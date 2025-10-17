export interface Location {
  id: string;
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface Candidate {
  id: string;
  placeId: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingsTotal?: number;
  distanceFromCenter?: number;
  inCircle: boolean;
  openNow?: boolean;
  vicinity?: string;
  types?: string[];
  voteCount?: number;
  addedBy?: string; // 'system' or 'organizer'
}

export interface Circle {
  center: { lat: number; lng: number };
  radius: number; // in meters
}

export type SortMode = 'rating' | 'distance' | 'vote';
