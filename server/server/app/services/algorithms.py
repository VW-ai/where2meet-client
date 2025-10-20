"""Server-side algorithm implementations for geometric calculations."""

import math
from typing import List, Tuple, Optional


def compute_centroid(locations: List[Tuple[float, float]]) -> Optional[Tuple[float, float]]:
    """
    Compute the spherical centroid of multiple lat/lng coordinates.

    Args:
        locations: List of (lat, lng) tuples

    Returns:
        (lat, lng) tuple of centroid, or None if empty
    """
    if not locations:
        return None

    if len(locations) == 1:
        return locations[0]

    # Convert to unit vectors
    x_sum = 0.0
    y_sum = 0.0
    z_sum = 0.0

    for lat, lng in locations:
        lat_rad = math.radians(lat)
        lng_rad = math.radians(lng)

        x_sum += math.cos(lat_rad) * math.cos(lng_rad)
        y_sum += math.cos(lat_rad) * math.sin(lng_rad)
        z_sum += math.sin(lat_rad)

    # Average
    n = len(locations)
    x_avg = x_sum / n
    y_avg = y_sum / n
    z_avg = z_sum / n

    # Normalize and convert back
    lng_rad = math.atan2(y_avg, x_avg)
    hyp = math.sqrt(x_avg * x_avg + y_avg * y_avg)
    lat_rad = math.atan2(z_avg, hyp)

    return (math.degrees(lat_rad), math.degrees(lng_rad))


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth.

    Args:
        lat1, lng1: First point coordinates
        lat2, lng2: Second point coordinates

    Returns:
        Distance in kilometers
    """
    R = 6371.0  # Earth radius in km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def compute_mec(locations: List[Tuple[float, float]]) -> Optional[Tuple[float, float, float]]:
    """
    Compute the Minimum Enclosing Circle using Welzl's algorithm.

    Args:
        locations: List of (lat, lng) tuples

    Returns:
        (center_lat, center_lng, radius_km) tuple, or None if empty
    """
    if not locations:
        return None

    if len(locations) == 1:
        return (locations[0][0], locations[0][1], 1.0)  # 1km minimum for visibility and search purposes

    # Welzl's algorithm implementation
    def welzl_helper(points: List[Tuple[float, float]], boundary: List[Tuple[float, float]]) -> Tuple[float, float, float]:
        # Base cases
        if not points or len(boundary) == 3:
            return make_circle_from_boundary(boundary)

        # Pick a random point
        p = points[0]
        remaining = points[1:]

        # Recursively compute MEC without p
        circle = welzl_helper(remaining, boundary)

        # If p is inside the circle, return it
        if is_inside_circle(p, circle):
            return circle

        # Otherwise, p must be on the boundary
        return welzl_helper(remaining, boundary + [p])

    def make_circle_from_boundary(boundary: List[Tuple[float, float]]) -> Tuple[float, float, float]:
        """Create minimum circle from boundary points."""
        if len(boundary) == 0:
            return (0.0, 0.0, 0.0)
        elif len(boundary) == 1:
            return (boundary[0][0], boundary[0][1], 1.0)  # 1km minimum for visibility
        elif len(boundary) == 2:
            # Circle with two points as diameter
            lat1, lng1 = boundary[0]
            lat2, lng2 = boundary[1]
            center_lat = (lat1 + lat2) / 2
            center_lng = (lng1 + lng2) / 2
            radius = haversine_distance(lat1, lng1, lat2, lng2) / 2
            return (center_lat, center_lng, max(radius, 1.0))  # 1km minimum for visibility
        else:
            # Circle with three points
            return make_circle_from_three_points(boundary[0], boundary[1], boundary[2])

    def make_circle_from_three_points(
        p1: Tuple[float, float],
        p2: Tuple[float, float],
        p3: Tuple[float, float]
    ) -> Tuple[float, float, float]:
        """Create circle from three points using circumcircle."""
        # Simplified: use centroid and max distance
        center_lat = (p1[0] + p2[0] + p3[0]) / 3
        center_lng = (p1[1] + p2[1] + p3[1]) / 3

        r1 = haversine_distance(center_lat, center_lng, p1[0], p1[1])
        r2 = haversine_distance(center_lat, center_lng, p2[0], p2[1])
        r3 = haversine_distance(center_lat, center_lng, p3[0], p3[1])

        radius = max(r1, r2, r3)
        return (center_lat, center_lng, max(radius, 1.0))  # 1km minimum for visibility

    def is_inside_circle(point: Tuple[float, float], circle: Tuple[float, float, float]) -> bool:
        """Check if point is inside circle."""
        center_lat, center_lng, radius = circle
        distance = haversine_distance(point[0], point[1], center_lat, center_lng)
        return distance <= radius * 1.001  # Small tolerance for floating point

    # Run Welzl's algorithm
    import random
    shuffled = locations.copy()
    random.shuffle(shuffled)
    return welzl_helper(shuffled, [])


def apply_fuzzing(lat: float, lng: float, radius_km: float = 0.5) -> Tuple[float, float]:
    """
    Apply random offset to coordinates for privacy (blur mode).

    Args:
        lat: Original latitude
        lng: Original longitude
        radius_km: Fuzzing radius in kilometers

    Returns:
        (fuzzy_lat, fuzzy_lng) tuple
    """
    import random

    # Convert km to degrees (approximate)
    lat_offset = (random.random() - 0.5) * 2 * (radius_km / 111.0)
    lng_offset = (random.random() - 0.5) * 2 * (radius_km / (111.0 * math.cos(math.radians(lat))))

    return (lat + lat_offset, lng + lng_offset)
