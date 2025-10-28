/**
 * API Client for Where2Meet Backend (M2)
 * Handles all communication with the FastAPI backend server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

// Debug: Log the API URL being used
if (typeof window !== 'undefined') {
  console.log('🔧 API Base URL:', API_BASE_URL);
  console.log('🔧 NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
}

// ===== Types (matching backend schemas) =====

export interface Event {
  id: string;
  title: string;
  category: string;
  visibility: 'blur' | 'show';  // DEPRECATED: Use per-participant visibility instead
  allow_vote: boolean;
  deadline?: string;
  final_decision?: string;
  custom_center_lat?: number;
  custom_center_lng?: number;
  created_at: string;
  expires_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  lat: number;
  lng: number;
  fuzzy_lat?: number;
  fuzzy_lng?: number;
  name?: string;
  address?: string;  // Human-readable address
  visibility?: 'blur' | 'show';  // Per-participant visibility preference
  joined_at: string;
}

export interface Candidate {
  id: string;
  event_id: string;
  place_id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
  distance_from_center?: number;
  in_circle: boolean;
  photo_reference?: string;
  vote_count?: number;
  added_by?: string;
}

export interface Vote {
  id: string;
  event_id: string;
  participant_id: string;
  candidate_id: string;
  voted_at: string;
}

export interface CreateEventRequest {
  title: string;
  category: string;
  visibility?: 'blur' | 'show';  // DEPRECATED: Use per-participant visibility instead
  allow_vote?: boolean;
  deadline?: string;
}

export interface CreateEventResponse {
  event: Event;
  join_token: string;
  join_link: string;
}

export interface AddParticipantRequest {
  lat: number;
  lng: number;
  name?: string;
  address?: string;  // Human-readable address
  visibility?: 'blur' | 'show';  // Participant's visibility preference
}

export interface SearchCandidatesRequest {
  keyword: string;
  radius_multiplier?: number;
  custom_center_lat?: number;
  custom_center_lng?: number;
  only_in_circle?: boolean;
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

export interface SSEMessage {
  event: string;
  data: any;
}

// ===== Auth Types =====

export interface UserSignup {
  email: string;
  password: string;
  name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  created_at: string;
  last_login: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserUpdate {
  name?: string;
  bio?: string;
  avatar?: string;
  password?: string;
}

// ===== Venue List Types =====

export interface VenueListSummary {
  id: string;
  title: string;
  description?: string;
  category: string;
  user_id: string;
  user_name: string;
  item_count: number;
  like_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  place_id: string;
  venue_name: string;
  venue_address?: string;
  venue_lat: number;
  venue_lng: number;
  rating?: number;
  notes?: string;
  order_index: number;
  added_at: string;
}

export interface VenueListDetail extends VenueListSummary {
  items: ListItem[];
}

export interface CreateListRequest {
  title: string;
  description?: string;
  category: string;
  items: {
    place_id: string;
    venue_name: string;
    venue_address?: string;
    venue_lat: number;
    venue_lng: number;
    rating?: number;
    notes?: string;
  }[];
}

export interface VenueListUpdate {
  title?: string;
  description?: string;
  category?: string;
  items?: {
    place_id: string;
    venue_name: string;
    venue_address?: string;
    venue_lat: number;
    venue_lng: number;
    rating?: number;
    notes?: string;
  }[];
}

// ===== API Client Class =====

export class Where2MeetAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Helper method for API calls
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('🌐 Making API request to:', url);
    console.log('🌐 Method:', options.method || 'GET');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('API Error Details:', error);

      // Handle different error formats
      let errorMessage = `API Error: ${response.statusText}`;
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          // FastAPI validation errors
          errorMessage = error.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
        } else if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (typeof error.detail === 'object') {
          errorMessage = JSON.stringify(error.detail);
        }
      }

      throw new Error(errorMessage);
    }

    // Handle 204 No Content responses (no JSON body)
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // ===== Event Endpoints =====

  async createEvent(data: CreateEventRequest, token?: string): Promise<CreateEventResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<CreateEventResponse>('/api/v1/events', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  async getEvent(eventId: string): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${eventId}`);
  }

  async updateEvent(eventId: string, data: Partial<Event>): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishEvent(eventId: string, finalDecision: string): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${eventId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ final_decision: finalDecision }),
    });
  }

  async unpublishEvent(eventId: string): Promise<Event> {
    return this.request<Event>(`/api/v1/events/${eventId}/unpublish`, {
      method: 'POST',
    });
  }

  async deleteEvent(eventId: string, hardDelete: boolean = false): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/events/${eventId}?hard_delete=${hardDelete}`,
      { method: 'DELETE' }
    );
  }

  async getEventAnalysis(eventId: string): Promise<{
    event: Event;
    participant_count: number;
    candidate_count: number;
    vote_count: number;
    centroid: { lat: number; lng: number } | null;
    circle: { center: { lat: number; lng: number }; radius: number } | null;
  }> {
    return this.request(`/api/v1/events/${eventId}/analysis`);
  }

  // ===== Participant Endpoints =====

  async addParticipant(
    eventId: string,
    data: AddParticipantRequest
  ): Promise<Participant> {
    return this.request<Participant>(`/api/v1/events/${eventId}/participants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getParticipants(eventId: string): Promise<Participant[]> {
    return this.request<Participant[]>(`/api/v1/events/${eventId}/participants`);
  }

  async updateParticipant(
    eventId: string,
    participantId: string,
    data: Partial<AddParticipantRequest>
  ): Promise<Participant> {
    return this.request<Participant>(
      `/api/v1/events/${eventId}/participants/${participantId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      }
    );
  }

  async removeParticipant(eventId: string, participantId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/events/${eventId}/participants/${participantId}`,
      { method: 'DELETE' }
    );
  }

  async reverseGeocode(lat: number, lng: number): Promise<{ address: string | null; lat: number; lng: number; error?: string }> {
    return this.request<{ address: string | null; lat: number; lng: number; error?: string }>(
      `/api/v1/geocode/reverse?lat=${lat}&lng=${lng}`,
      { method: 'POST' }
    );
  }

  // ===== Candidate Endpoints =====

  async searchCandidates(
    eventId: string,
    data: SearchCandidatesRequest
  ): Promise<CandidateSearchResponse> {
    return this.request<CandidateSearchResponse>(
      `/api/v1/events/${eventId}/candidates/search`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getCandidates(
    eventId: string,
    sortBy?: 'rating' | 'distance'
  ): Promise<Candidate[]> {
    const query = sortBy ? `?sort_by=${sortBy}` : '';
    return this.request<Candidate[]>(
      `/api/v1/events/${eventId}/candidates${query}`
    );
  }

  async addCandidateManually(
    eventId: string,
    data: {
      place_id: string;
      name: string;
      address?: string;
      lat: number;
      lng: number;
      rating?: number;
    }
  ): Promise<Candidate> {
    return this.request<Candidate>(`/api/v1/events/${eventId}/candidates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async removeCandidate(eventId: string, candidateId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/events/${eventId}/candidates/${candidateId}`,
      { method: 'DELETE' }
    );
  }

  async saveCandidate(eventId: string, candidateId: string): Promise<Candidate> {
    return this.request<Candidate>(
      `/api/v1/events/${eventId}/candidates/${candidateId}/save`,
      { method: 'POST' }
    );
  }

  async unsaveCandidate(eventId: string, candidateId: string): Promise<Candidate> {
    return this.request<Candidate>(
      `/api/v1/events/${eventId}/candidates/${candidateId}/unsave`,
      { method: 'POST' }
    );
  }

  async getCandidatePhoto(eventId: string, candidateId: string): Promise<{ photo_reference: string | null }> {
    return this.request<{ photo_reference: string | null }>(
      `/api/v1/events/${eventId}/candidates/${candidateId}/photo`
    );
  }

  async getCandidateDetails(eventId: string, candidateId: string): Promise<{ editorial_summary: string | null; opening_hours: any }> {
    return this.request<{ editorial_summary: string | null; opening_hours: any }>(
      `/api/v1/events/${eventId}/candidates/${candidateId}/details`
    );
  }

  // ===== Vote Endpoints =====

  async castVote(
    eventId: string,
    participantId: string,
    candidateId: string
  ): Promise<Vote> {
    return this.request<Vote>(
      `/api/v1/events/${eventId}/votes?participant_id=${participantId}`,
      {
        method: 'POST',
        body: JSON.stringify({ candidate_id: candidateId }),
      }
    );
  }

  async getVotes(eventId: string, participantId: string): Promise<Vote[]> {
    return this.request<Vote[]>(`/api/v1/events/${eventId}/votes?participant_id=${participantId}`);
  }

  async removeVote(eventId: string, voteId: string, participantId: string): Promise<{ message: string }> {
    return this.request<{ message: string}>(
      `/api/v1/events/${eventId}/votes/${voteId}?participant_id=${participantId}`,
      { method: 'DELETE' }
    );
  }

  // ===== SSE (Server-Sent Events) =====

  connectSSE(
    eventId: string,
    onMessage: (message: SSEMessage) => void,
    onError?: (error: globalThis.Event) => void
  ): EventSource {
    const url = `${this.baseUrl}/api/v1/events/${eventId}/stream`;
    console.log('🔌 Establishing SSE connection to:', url);

    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened successfully');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: data.event || 'message', data: data.data || data });
      } catch (error) {
        console.error('❌ Failed to parse SSE message:', error, 'Raw data:', event.data);
      }
    };

    if (onError) {
      eventSource.onerror = onError as (this: EventSource, ev: globalThis.Event) => any;
    } else {
      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        console.log('Connection state:', eventSource.readyState === 0 ? 'CONNECTING' : eventSource.readyState === 1 ? 'OPEN' : 'CLOSED');
      };
    }

    return eventSource;
  }

  // ===== Auth Endpoints =====

  async signup(data: UserSignup): Promise<TokenResponse> {
    return this.request<TokenResponse>('/api/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: UserLogin): Promise<TokenResponse> {
    return this.request<TokenResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(token: string): Promise<User> {
    return this.request<User>('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async updateCurrentUser(token: string, data: UserUpdate): Promise<User> {
    return this.request<User>('/api/v1/auth/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async getUserEvents(token: string): Promise<Event[]> {
    return this.request<Event[]>('/api/v1/auth/me/events', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // ===== Event Feed Endpoints =====

  async fetchEventsFeed(params: {
    date?: string;
    near_me?: boolean;
    category?: string;
    page?: number;
    page_size?: number;
    lat?: number;
    lng?: number;
  } = {}): Promise<import('@/types').EventsListResponse> {
    const query = new URLSearchParams();
    if (params.date) query.append('date', params.date);
    if (params.near_me) query.append('near_me', 'true');
    if (params.category) query.append('category', params.category);
    if (params.page) query.append('page', params.page.toString());
    if (params.page_size) query.append('page_size', params.page_size.toString());
    if (params.lat) query.append('lat', params.lat.toString());
    if (params.lng) query.append('lng', params.lng.toString());

    const queryString = query.toString();
    return this.request<import('@/types').EventsListResponse>(
      `/api/v1/feed/events${queryString ? `?${queryString}` : ''}`
    );
  }

  async createEventFeed(
    data: import('@/types').CreateEventFeedRequest,
    token?: string
  ): Promise<{ event: import('@/types').Event; join_token: string }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request('/api/v1/feed/events', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  async getEventFeedDetail(eventId: string, token?: string): Promise<import('@/types').EventDetailResponse> {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<import('@/types').EventDetailResponse>(
      `/api/v1/feed/events/${eventId}`,
      { headers }
    );
  }

  async joinEventFeed(eventId: string, data: { name: string; email?: string; avatar?: string }, token?: string): Promise<{
    id: string;
    event_id: string;
    user_id?: string;
    name: string;
    email?: string;
    avatar?: string;
    joined_at: string;
  }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request(`/api/v1/feed/events/${eventId}/join`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  }

  async leaveEventFeed(eventId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request(`/api/v1/feed/events/${eventId}/leave`, {
      method: 'DELETE',
      headers,
    });
  }

  async updateEventFeed(
    eventId: string,
    data: Partial<import('@/types').CreateEventFeedRequest>,
    token?: string
  ): Promise<{ event: import('@/types').Event }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request(`/api/v1/feed/events/${eventId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  }

  async deleteEventFeed(eventId: string, token?: string): Promise<void> {
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request(`/api/v1/feed/events/${eventId}`, {
      method: 'DELETE',
      headers,
    });
  }

  // ===== Venue List Endpoints =====

  async getPublicLists(params: {
    category?: string;
    limit?: number;
    offset?: number;
  } = {}, token?: string): Promise<VenueListSummary[]> {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const queryString = query.toString();
    return this.request<VenueListSummary[]>(
      `/api/v1/lists${queryString ? `?${queryString}` : ''}`,
      { headers }
    );
  }

  async getListDetail(listId: string, token?: string): Promise<VenueListDetail> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<VenueListDetail>(`/api/v1/lists/${listId}`, { headers });
  }

  async createList(data: CreateListRequest, token: string): Promise<VenueListDetail> {
    return this.request<VenueListDetail>('/api/v1/lists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateList(listId: string, data: Partial<CreateListRequest>, token: string): Promise<VenueListDetail> {
    return this.request<VenueListDetail>(`/api/v1/lists/${listId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async updateList(listId: string, data: VenueListUpdate, token: string): Promise<VenueListDetail> {
    return this.request<VenueListDetail>(`/api/v1/lists/${listId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async deleteList(listId: string, token: string): Promise<void> {
    return this.request<void>(`/api/v1/lists/${listId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async likeList(listId: string, token: string): Promise<void> {
    return this.request<void>(`/api/v1/lists/${listId}/like`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  async unlikeList(listId: string, token: string): Promise<void> {
    return this.request<void>(`/api/v1/lists/${listId}/like`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }
}

// Export singleton instance
export const api = new Where2MeetAPI();
