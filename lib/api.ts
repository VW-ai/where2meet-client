/**
 * API Client for Where2Meet Backend (M2)
 * Handles all communication with the FastAPI backend server
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  visibility: 'blur' | 'show';
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
  visibility?: 'blur' | 'show';
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
}

export interface SearchCandidatesRequest {
  keyword: string;
  radius_multiplier?: number;
  custom_center_lat?: number;
  custom_center_lng?: number;
  only_in_circle?: boolean;
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
  password?: string;
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

  // ===== Candidate Endpoints =====

  async searchCandidates(
    eventId: string,
    data: SearchCandidatesRequest
  ): Promise<Candidate[]> {
    return this.request<Candidate[]>(
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

  async getVotes(eventId: string, participantId?: string): Promise<Vote[]> {
    const query = participantId ? `?participant_id=${participantId}` : '';
    return this.request<Vote[]>(`/api/v1/events/${eventId}/votes${query}`);
  }

  async removeVote(eventId: string, voteId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      `/api/v1/events/${eventId}/votes/${voteId}`,
      { method: 'DELETE' }
    );
  }

  // ===== SSE (Server-Sent Events) =====

  connectSSE(
    eventId: string,
    onMessage: (message: SSEMessage) => void,
    onError?: (error: globalThis.Event) => void
  ): EventSource {
    const eventSource = new EventSource(
      `${this.baseUrl}/api/v1/events/${eventId}/stream`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage({ event: data.event || 'message', data: data.data || data });
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };

    if (onError) {
      eventSource.onerror = onError;
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
}

// Export singleton instance
export const api = new Where2MeetAPI();
