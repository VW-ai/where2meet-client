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
  photoReference?: string; // Google Places photo reference
  voteCount?: number;
  addedBy?: string; // 'system' or 'organizer'
  userVoted?: boolean; // Whether current user has voted for this venue
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

// Event Feed Types
export type EventCategory = 'food' | 'sports' | 'entertainment' | 'work' | 'music' | 'outdoors' | 'other';
export type EventVisibility = 'public' | 'link_only';
export type EventStatus = 'active' | 'full' | 'closed' | 'past' | 'cancelled' | 'completed';
export type EventUserRole = 'host' | 'participant' | 'guest';
export type LocationType = 'fixed' | 'collaborative';

export interface Event {
  id: string;
  title: string;
  description?: string;

  // Host & Participants
  host_id: string;
  host_name: string;
  host_bio?: string; // Optional bio/description for host
  host_contact_number?: string; // Optional contact number for host
  participant_ids: string[];
  participant_count: number;
  participant_limit?: number;
  participant_avatars?: string[]; // Avatar URLs of participants

  // Time & Location
  meeting_time: string; // ISO 8601
  location_area: string; // "Downtown SF", "Brooklyn, NY"
  location_coords?: {
    lat: number;
    lng: number;
  };

  // Location Type & Fixed Venue Details
  location_type: LocationType; // 'fixed' or 'collaborative'
  fixed_venue_id?: string; // Google Place ID for fixed location events
  fixed_venue_name?: string; // Venue name for fixed location events
  fixed_venue_address?: string; // Full address for fixed location events
  fixed_venue_lat?: number; // Venue latitude
  fixed_venue_lng?: number; // Venue longitude

  // Categorization
  category?: EventCategory;

  // Visual
  background_image?: string; // Background image URL for event card

  // Settings
  visibility: EventVisibility;
  allow_vote: boolean;

  // Computed Fields
  venue_count: number;
  average_rating?: number;
  distance_km?: number; // Distance from user

  // Status
  status: EventStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface EventsListResponse {
  events: Event[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreateEventFeedRequest {
  title: string;
  description?: string;
  meeting_time: string;
  location_area: string;
  location_coords?: { lat: number; lng: number };
  location_type: LocationType;
  fixed_venue_name?: string;
  fixed_venue_address?: string;
  fixed_venue_lat?: number;
  fixed_venue_lng?: number;
  category?: EventCategory;
  participant_limit?: number;
  visibility: EventVisibility;
  allow_vote: boolean;
  contact_number?: string;
  background_image?: string;
}

export interface EventDetailResponse {
  event: Event;
  participants: Array<{
    id: string;
    user_id?: string;
    name: string;
    email?: string;
    avatar?: string;
  }>;
  venues: Candidate[];
  is_host: boolean;  // Is current user the host
  is_participant: boolean;  // Is current user a participant (joined the event)
}
