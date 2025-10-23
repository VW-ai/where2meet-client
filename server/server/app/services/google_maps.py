"""Google Maps API integration service."""

import httpx
import redis
import json
from typing import List, Dict, Any, Optional
from app.core.config import settings


class GoogleMapsService:
    """Service for interacting with Google Maps Places API."""

    def __init__(self):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self.base_url = "https://maps.googleapis.com/maps/api"
        # Initialize Redis client for caching
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            print(f"⚠️ Redis connection failed: {e}. Photo caching will be disabled.")
            self.redis_client = None

    async def search_places_nearby(
        self,
        lat: float,
        lng: float,
        radius: float,
        keyword: str,
        min_rating: float = 2.5,  # Lowered from 3.0 to include more venues
        max_results: int = 60  # Fetch up to 60 results (3 pages)
    ) -> List[Dict[str, Any]]:
        """
        Search for places near a location using Google Places API.
        Supports pagination to fetch more results.

        Args:
            lat: Center latitude
            lng: Center longitude
            radius: Search radius in meters
            keyword: Search keyword
            min_rating: Minimum rating filter (default 2.5)
            max_results: Maximum number of results to fetch (default 60)

        Returns:
            List of place dictionaries
        """
        url = f"{self.base_url}/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": int(radius * 1000),  # Convert km to meters
            "keyword": keyword,
            "key": self.api_key
        }

        places = []
        seen_place_ids = set()
        page_count = 0
        max_pages = 3  # Google allows up to 3 pages (60 results total)

        async with httpx.AsyncClient() as client:
            while page_count < max_pages and len(places) < max_results:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()

                if data.get("status") not in ["OK", "ZERO_RESULTS"]:
                    break

                # Process results from this page
                for result in data.get("results", []):
                    if len(places) >= max_results:
                        break

                    place_id = result.get("place_id")

                    # De-duplicate
                    if place_id in seen_place_ids:
                        continue

                    # Filter by rating (allow unrated venues)
                    rating = result.get("rating", 0)
                    if rating > 0 and rating < min_rating:
                        continue

                    seen_place_ids.add(place_id)

                    # Don't fetch photos during search for performance
                    # Photos will be fetched on-demand when user selects a venue

                    places.append({
                        "place_id": place_id,
                        "name": result.get("name", ""),
                        "address": result.get("vicinity", ""),
                        "lat": result["geometry"]["location"]["lat"],
                        "lng": result["geometry"]["location"]["lng"],
                        "rating": rating if rating > 0 else None,
                        "user_ratings_total": result.get("user_ratings_total", 0),
                        "opening_hours": result.get("opening_hours"),
                    })

                # Check for next page
                next_page_token = data.get("next_page_token")
                if not next_page_token:
                    break

                # Google requires a short delay before using next_page_token
                import asyncio
                await asyncio.sleep(2)

                # Update params for next page
                params = {
                    "pagetoken": next_page_token,
                    "key": self.api_key
                }
                page_count += 1

            return places

    async def get_place_photo_reference(self, place_id: str) -> Optional[str]:
        """
        Get photo reference for a specific place (with Redis caching).

        Args:
            place_id: Google Place ID

        Returns:
            Photo reference string or None
        """
        # Check Redis cache first
        cache_key = f"photo_ref:{place_id}"
        if self.redis_client:
            try:
                cached = self.redis_client.get(cache_key)
                if cached is not None:
                    print(f"📸 Photo cache HIT for {place_id}")
                    return cached if cached != "None" else None
            except Exception as e:
                print(f"⚠️ Redis get error: {e}")

        # Fetch from Google Places API
        url = f"{self.base_url}/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "photos",  # Only fetch photos field
            "key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params, timeout=10.0)
                response.raise_for_status()
                data = response.json()

                if data.get("status") != "OK":
                    return None

                result = data.get("result", {})
                photos = result.get("photos", [])

                photo_reference = None
                if photos and len(photos) > 0:
                    photo_reference = photos[0].get("photo_reference")
                    print(f"📸 Photo fetched for {place_id}")

                # Cache the result (cache "None" string for places without photos)
                if self.redis_client:
                    try:
                        cache_value = photo_reference if photo_reference else "None"
                        self.redis_client.setex(cache_key, 86400, cache_value)  # Cache for 24 hours
                    except Exception as e:
                        print(f"⚠️ Redis set error: {e}")

                return photo_reference

            except Exception as e:
                print(f"❌ Error fetching photo for {place_id}: {e}")
                return None

    async def get_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a place.

        Args:
            place_id: Google Place ID

        Returns:
            Place details dictionary or None
        """
        url = f"{self.base_url}/place/details/json"
        params = {
            "place_id": place_id,
            "fields": "place_id,name,formatted_address,geometry,rating,user_ratings_total,opening_hours",
            "key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "OK":
                return None

            result = data.get("result", {})
            return {
                "place_id": result.get("place_id"),
                "name": result.get("name", ""),
                "address": result.get("formatted_address", ""),
                "lat": result["geometry"]["location"]["lat"],
                "lng": result["geometry"]["location"]["lng"],
                "rating": result.get("rating"),
                "user_ratings_total": result.get("user_ratings_total", 0),
                "opening_hours": result.get("opening_hours"),
            }

    async def reverse_geocode(self, lat: float, lng: float) -> Optional[Dict[str, Any]]:
        """
        Reverse geocode a location to get address information.
        Used to check if a location is on land or water.

        Args:
            lat: Latitude
            lng: Longitude

        Returns:
            Geocoding result with address components, or None
        """
        url = f"{self.base_url}/geocode/json"
        params = {
            "latlng": f"{lat},{lng}",
            "key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            if data.get("status") != "OK":
                return None

            results = data.get("results", [])
            if not results:
                return None

            # Return the first (most specific) result
            result = results[0]
            return {
                "formatted_address": result.get("formatted_address"),
                "address_components": result.get("address_components", []),
                "types": result.get("types", []),
                "geometry": result.get("geometry", {}),
            }

    def is_water_location(self, geocode_result: Optional[Dict[str, Any]]) -> bool:
        """
        Check if a geocoding result indicates a water location.

        Args:
            geocode_result: Result from reverse_geocode

        Returns:
            True if location is water, False otherwise
        """
        if not geocode_result:
            # No geocoding result means likely water or unpopulated area
            return True

        types = geocode_result.get("types", [])
        address = geocode_result.get("formatted_address", "").lower()

        # Check for water-related types
        water_types = {
            "natural_feature",
            "body_of_water",
            "bay",
            "sea",
            "ocean",
        }

        if any(t in water_types for t in types):
            return True

        # Check for water keywords in address
        water_keywords = [
            "ocean",
            "sea",
            "bay",
            "lake",
            "river",
            "strait",
            "channel",
            "harbor",
            "harbour",
            "sound",
            "inlet",
        ]

        if any(keyword in address for keyword in water_keywords):
            return True

        # CRITICAL: If the ONLY type is "plus_code", it's likely water
        # Plus codes are generic coordinates, not actual addresses
        if types == ["plus_code"]:
            return True

        # Check if it has any proper address components (indicates land)
        address_components = geocode_result.get("address_components", [])

        # Look for actual street-level addressing (strong indicator of land)
        has_street = any(
            "route" in comp.get("types", []) or
            "street_address" in comp.get("types", []) or
            "street_number" in comp.get("types", []) or
            "premise" in comp.get("types", [])
            for comp in address_components
        )

        # If it has a street address, it's definitely on land
        if has_street:
            return False

        # Check for neighborhood or sublocality (more specific than just "locality")
        has_neighborhood = any(
            "neighborhood" in comp.get("types", []) or
            "sublocality" in comp.get("types", []) or
            "postal_code" in comp.get("types", [])
            for comp in address_components
        )

        # If it has neighborhood-level detail, it's on land
        if has_neighborhood:
            return False

        # If we only have broad political areas (city, state, country) but no specific
        # neighborhood or street, it's likely water
        has_only_broad_political = any(
            any(t in ["locality", "administrative_area_level_1", "country"] for t in comp.get("types", []))
            for comp in address_components
        )

        # Broad political areas without specific location = water
        if has_only_broad_political and not has_neighborhood and not has_street:
            return True

        # Default to water if uncertain
        return True

    async def find_nearest_land_point(
        self,
        lat: float,
        lng: float,
        max_radius: float = 5.0
    ) -> Optional[Dict[str, float]]:
        """
        Find the nearest land-based location to a given point.
        Uses a spiral search pattern to find the closest addressable location.

        Args:
            lat: Center latitude
            lng: Center longitude
            max_radius: Maximum search radius in kilometers (default 5km)

        Returns:
            Dict with 'lat' and 'lng' of nearest land point, or None
        """
        # Try to find any nearby place (establishments are always on land)
        url = f"{self.base_url}/place/nearbysearch/json"
        params = {
            "location": f"{lat},{lng}",
            "radius": int(max_radius * 1000),  # Convert to meters
            "type": "establishment",  # Any business/place (always on land)
            "key": self.api_key
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            if data.get("status") == "OK" and data.get("results"):
                # Return the closest result (first in list)
                first_result = data["results"][0]
                location = first_result["geometry"]["location"]
                return {
                    "lat": location["lat"],
                    "lng": location["lng"]
                }

            # If no establishments found, try geocoding nearby points
            # Try points in 8 directions at increasing distances
            directions = [
                (0, 1),    # North
                (1, 1),    # NE
                (1, 0),    # East
                (1, -1),   # SE
                (0, -1),   # South
                (-1, -1),  # SW
                (-1, 0),   # West
                (-1, 1),   # NW
            ]

            # Try increasing distances
            for distance_km in [0.5, 1.0, 2.0, 3.0, 5.0]:
                # ~111 km per degree of latitude
                lat_offset = distance_km / 111.0

                for dx, dy in directions:
                    # Adjust longitude offset by latitude (cosine correction)
                    import math
                    lng_offset = distance_km / (111.0 * math.cos(math.radians(lat)))

                    test_lat = lat + (dy * lat_offset)
                    test_lng = lng + (dx * lng_offset)

                    # Check if this point is on land
                    geocode = await self.reverse_geocode(test_lat, test_lng)
                    if geocode and not self.is_water_location(geocode):
                        return {
                            "lat": test_lat,
                            "lng": test_lng
                        }

            # Could not find land within max_radius
            return None

    async def snap_to_land(
        self,
        lat: float,
        lng: float,
        max_radius: float = 5.0
    ) -> Dict[str, float]:
        """
        Ensure a coordinate is on land, not water.
        If the point is on water, find the nearest land location.

        Args:
            lat: Latitude
            lng: Longitude
            max_radius: Maximum search radius for land (km)

        Returns:
            Dict with 'lat' and 'lng' (on land)
        """
        # Check if current location is on land
        geocode = await self.reverse_geocode(lat, lng)

        if geocode and not self.is_water_location(geocode):
            # Already on land
            return {"lat": lat, "lng": lng}

        # Point is on water, find nearest land
        land_point = await self.find_nearest_land_point(lat, lng, max_radius)

        if land_point:
            return land_point

        # Fallback: return original coordinates
        # (better to have some result than none)
        return {"lat": lat, "lng": lng}


# Singleton instance
google_maps_service = GoogleMapsService()
