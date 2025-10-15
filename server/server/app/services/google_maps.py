"""Google Maps API integration service."""

import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings


class GoogleMapsService:
    """Service for interacting with Google Maps Places API."""

    def __init__(self):
        self.api_key = settings.GOOGLE_MAPS_API_KEY
        self.base_url = "https://maps.googleapis.com/maps/api"

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


# Singleton instance
google_maps_service = GoogleMapsService()
