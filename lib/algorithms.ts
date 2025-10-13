import { Location, Circle } from '@/types';

/**
 * Convert lat/lng to unit vector on sphere
 */
function latLngToVector(lat: number, lng: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  return [
    Math.cos(latRad) * Math.cos(lngRad),
    Math.cos(latRad) * Math.sin(lngRad),
    Math.sin(latRad),
  ];
}

/**
 * Convert unit vector back to lat/lng
 */
function vectorToLatLng(v: [number, number, number]): { lat: number; lng: number } {
  const length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  const x = v[0] / length;
  const y = v[1] / length;
  const z = v[2] / length;

  const lat = (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI;
  const lng = (Math.atan2(y, x) * 180) / Math.PI;

  return { lat, lng };
}

/**
 * Compute centroid on sphere
 * Avoids artifacts near poles & 180° crossings
 */
export function computeCentroid(locations: Location[]): { lat: number; lng: number } | null {
  if (locations.length === 0) return null;

  // Convert all locations to unit vectors and average
  let sumX = 0,
    sumY = 0,
    sumZ = 0;

  for (const loc of locations) {
    const [x, y, z] = latLngToVector(loc.lat, loc.lng);
    sumX += x;
    sumY += y;
    sumZ += z;
  }

  const avgVector: [number, number, number] = [
    sumX / locations.length,
    sumY / locations.length,
    sumZ / locations.length,
  ];

  return vectorToLatLng(avgVector);
}

/**
 * Calculate distance between two points on Earth using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Compute circle from 2 points (diameter)
 */
function circleFrom2Points(
  p1: Location,
  p2: Location
): { center: { lat: number; lng: number }; radius: number } {
  const center = {
    lat: (p1.lat + p2.lat) / 2,
    lng: (p1.lng + p2.lng) / 2,
  };
  const radius = haversineDistance(p1.lat, p1.lng, p2.lat, p2.lng) / 2;
  return { center, radius };
}

/**
 * Compute circle from 3 points using circumcircle
 */
function circleFrom3Points(
  p1: Location,
  p2: Location,
  p3: Location
): { center: { lat: number; lng: number }; radius: number } | null {
  // Use simple approximation for small areas
  // Convert to planar coordinates (works well for small regions)
  const ax = p1.lng;
  const ay = p1.lat;
  const bx = p2.lng;
  const by = p2.lat;
  const cx = p3.lng;
  const cy = p3.lat;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

  if (Math.abs(d) < 1e-10) {
    // Collinear points, fall back to 2-point circle
    return circleFrom2Points(p1, p2);
  }

  const ux =
    ((ax * ax + ay * ay) * (by - cy) +
      (bx * bx + by * by) * (cy - ay) +
      (cx * cx + cy * cy) * (ay - by)) /
    d;
  const uy =
    ((ax * ax + ay * ay) * (cx - bx) +
      (bx * bx + by * by) * (ax - cx) +
      (cx * cx + cy * cy) * (bx - ax)) /
    d;

  const center = { lat: uy, lng: ux };
  const radius = haversineDistance(center.lat, center.lng, p1.lat, p1.lng);

  return { center, radius };
}

/**
 * Check if point is inside circle (with tolerance)
 */
function isInsideCircle(
  point: Location,
  circle: { center: { lat: number; lng: number }; radius: number },
  tolerance: number = 0.01
): boolean {
  const dist = haversineDistance(point.lat, point.lng, circle.center.lat, circle.center.lng);
  return dist <= circle.radius * (1 + tolerance);
}

/**
 * Welzl's algorithm for Minimum Enclosing Circle
 * Expected O(n) time complexity
 */
function welzlRecursive(
  points: Location[],
  boundary: Location[],
  n: number
): { center: { lat: number; lng: number }; radius: number } | null {
  // Base cases
  if (n === 0 || boundary.length === 3) {
    if (boundary.length === 0) return null;
    if (boundary.length === 1)
      return { center: { lat: boundary[0].lat, lng: boundary[0].lng }, radius: 0 };
    if (boundary.length === 2) return circleFrom2Points(boundary[0], boundary[1]);
    return circleFrom3Points(boundary[0], boundary[1], boundary[2]);
  }

  // Pick a random point
  const idx = Math.floor(Math.random() * n);
  const p = points[idx];

  // Swap with last point
  [points[idx], points[n - 1]] = [points[n - 1], points[idx]];

  // Recursively compute circle without p
  const circle = welzlRecursive(points, boundary, n - 1);

  // If p is inside circle, return circle
  if (circle && isInsideCircle(p, circle)) {
    return circle;
  }

  // Otherwise, p must be on the boundary
  return welzlRecursive(points, [...boundary, p], n - 1);
}

/**
 * Compute Minimum Enclosing Circle using Welzl's algorithm
 * Handles edge cases: duplicates, collinear sets, 2-point/3-point circles
 */
export function computeMinimumEnclosingCircle(locations: Location[]): Circle | null {
  if (locations.length === 0) return null;
  if (locations.length === 1) {
    return {
      center: { lat: locations[0].lat, lng: locations[0].lng },
      radius: 100, // Minimum radius of 100m for single point
    };
  }

  // Create a copy to avoid mutating original array
  const points = [...locations];
  const circle = welzlRecursive(points, [], points.length);

  if (!circle) return null;

  // Ensure minimum radius of 100m
  return {
    center: circle.center,
    radius: Math.max(circle.radius, 100),
  };
}

/**
 * Expand circle by epsilon factor (default 10% = 0.1)
 */
export function expandCircle(circle: Circle, epsilon: number = 0.1): Circle {
  return {
    center: circle.center,
    radius: circle.radius * (1 + epsilon),
  };
}
