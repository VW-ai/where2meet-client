"""Pydantic schemas for Event Feed API requests and responses."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# Event Feed schemas
class FeedEventCreate(BaseModel):
    """Schema for creating a new Event Feed event."""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_time: datetime
    location_area: str = Field(..., min_length=1, max_length=255)
    location_coords_lat: Optional[float] = Field(None, ge=-90, le=90)
    location_coords_lng: Optional[float] = Field(None, ge=-180, le=180)
    category: Optional[str] = Field(None, max_length=100)
    participant_limit: int = Field(..., ge=2, le=100)
    visibility: str = Field(default="public", pattern="^(public|link_only)$")
    allow_vote: bool = True
    location_type: str = Field(..., pattern="^(fixed|collaborative)$")
    fixed_venue_name: Optional[str] = Field(None, max_length=255)
    fixed_venue_address: Optional[str] = None
    fixed_venue_lat: Optional[float] = Field(None, ge=-90, le=90)
    fixed_venue_lng: Optional[float] = Field(None, ge=-180, le=180)
    contact_number: Optional[str] = Field(None, max_length=20)
    background_image: Optional[str] = Field(None, max_length=500)


class FeedEventUpdate(BaseModel):
    """Schema for updating an Event Feed event."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    meeting_time: Optional[datetime] = None
    location_area: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    participant_limit: Optional[int] = Field(None, ge=2, le=1000)
    visibility: Optional[str] = Field(None, pattern="^(public|link_only)$")
    allow_vote: Optional[bool] = None
    status: Optional[str] = Field(None, pattern="^(active|full|closed|past|cancelled|completed)$")
    background_image: Optional[str] = Field(None, max_length=500)


class FeedParticipantResponse(BaseModel):
    """Schema for Event Feed participant response."""
    id: str
    user_id: Optional[str]
    name: str
    email: Optional[str]
    avatar: Optional[str]
    joined_at: datetime

    class Config:
        from_attributes = True


class FeedVenueResponse(BaseModel):
    """Schema for Event Feed venue response."""
    id: str
    place_id: str
    name: str
    vicinity: Optional[str]
    lat: float
    lng: float
    rating: Optional[float]
    user_ratings_total: int
    distance_from_center: Optional[float]
    in_circle: bool
    open_now: Optional[bool]
    types: Optional[str]
    photo_reference: Optional[str]
    added_by: str
    vote_count: int = 0
    user_voted: bool = False

    class Config:
        from_attributes = True


class FeedEventResponse(BaseModel):
    """Schema for Event Feed event response."""
    id: str
    title: str
    description: Optional[str]

    # Host & Participants
    host_id: Optional[str]
    host_name: str
    host_bio: Optional[str]
    host_contact_number: Optional[str]
    participant_count: int = 0
    participant_limit: Optional[int]
    participant_avatars: List[str] = []

    # Time & Location
    meeting_time: datetime
    location_area: str
    location_coords: Optional[dict] = None

    # Location Type & Fixed Venue
    location_type: str
    fixed_venue_id: Optional[str]
    fixed_venue_name: Optional[str]
    fixed_venue_address: Optional[str]
    fixed_venue_lat: Optional[float]
    fixed_venue_lng: Optional[float]

    # Categorization
    category: Optional[str]

    # Visual
    background_image: Optional[str]

    # Settings
    visibility: str
    allow_vote: bool

    # Computed Fields
    venue_count: int = 0
    average_rating: Optional[float] = None
    distance_km: Optional[float] = None

    # Status
    status: str

    # Timestamps
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FeedEventDetailResponse(BaseModel):
    """Schema for detailed Event Feed event with participants and venues."""
    event: FeedEventResponse
    participants: List[FeedParticipantResponse]
    venues: List[FeedVenueResponse]
    is_host: bool  # Is current user the host
    is_participant: bool  # Is current user a participant (joined the event)


class FeedEventsListResponse(BaseModel):
    """Schema for Event Feed events list."""
    events: List[FeedEventResponse]
    total: int
    page: int
    page_size: int
    has_more: bool


class FeedEventJoinRequest(BaseModel):
    """Schema for joining an Event Feed event."""
    name: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    avatar: Optional[str] = Field(None, max_length=500)


class FeedVenueCreate(BaseModel):
    """Schema for adding a venue to an event."""
    place_id: str
    name: str
    vicinity: Optional[str]
    lat: float
    lng: float
    rating: Optional[float]
    user_ratings_total: int = 0
    distance_from_center: Optional[float]
    in_circle: bool = True
    open_now: Optional[bool]
    types: Optional[str]
    photo_reference: Optional[str]


class FeedVoteCreate(BaseModel):
    """Schema for voting on a venue."""
    venue_id: str


class FeedEventFilters(BaseModel):
    """Schema for filtering Event Feed events."""
    category: Optional[str] = None
    date: Optional[datetime] = None
    near_me: bool = False
    user_lat: Optional[float] = Field(None, ge=-90, le=90)
    user_lng: Optional[float] = Field(None, ge=-180, le=180)
    max_distance_km: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    visibility: str = "public"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
