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
  photoReference?: string; // Google Places photo reference
}

export interface Circle {
  center: { lat: number; lng: number };
  radius: number; // in meters
}

export interface SearchAreaInfo {
  center_lat: number;
  center_lng: number;
  radius_km: number;
  was_snapped: boolean;
  original_center_lat?: number;
  original_center_lng?: number;
}

export interface CandidateSearchResponse {
  candidates: Candidate[];
  search_area: SearchAreaInfo;
}

export type SortMode = 'rating' | 'distance' | 'vote';
