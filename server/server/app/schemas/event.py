"""Pydantic schemas for event-related API requests and responses."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


# Event schemas
class EventCreate(BaseModel):
    """Schema for creating a new event."""
    title: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    deadline: Optional[datetime] = None
    visibility: str = Field(default="blur", pattern="^(blur|show)$")
    allow_vote: bool = True


class EventResponse(BaseModel):
    """Schema for event response."""
    id: str
    title: str
    category: str
    deadline: Optional[datetime]
    visibility: str
    allow_vote: bool
    final_decision: Optional[str]
    custom_center_lat: Optional[float]
    custom_center_lng: Optional[float]
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class EventJoinResponse(BaseModel):
    """Schema for event join link response."""
    event: EventResponse  # Full event object
    join_link: str
    join_token: str  # Token for joining the event


# Participant schemas
class ParticipantCreate(BaseModel):
    """Schema for participant location submission."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    name: Optional[str] = Field(None, max_length=100)


class ParticipantUpdate(BaseModel):
    """Schema for updating participant location."""
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    name: Optional[str] = Field(None, max_length=100)


class ParticipantResponse(BaseModel):
    """Schema for participant response."""
    id: str
    event_id: str
    lat: float  # May be fuzzy depending on visibility
    lng: float  # May be fuzzy depending on visibility
    name: Optional[str]
    joined_at: datetime

    class Config:
        from_attributes = True


# Candidate schemas
class CandidateResponse(BaseModel):
    """Schema for candidate venue response."""
    id: str
    event_id: str
    place_id: str
    name: str
    address: Optional[str]
    lat: float
    lng: float
    rating: Optional[float]
    user_ratings_total: int
    distance_from_center: Optional[float]
    in_circle: bool
    opening_hours: Optional[str]
    added_by: str
    vote_count: int = 0
    photo_reference: Optional[str] = None

    class Config:
        from_attributes = True


class CandidateSearch(BaseModel):
    """Schema for candidate search request."""
    keyword: str = Field(..., min_length=1, max_length=100)
    radius_multiplier: float = Field(default=1.0, ge=1.0, le=2.0)  # Search exactly within MEC by default
    custom_center_lat: Optional[float] = Field(None, ge=-90, le=90)  # Optional custom center point
    custom_center_lng: Optional[float] = Field(None, ge=-180, le=180)
    only_in_circle: bool = Field(default=True)  # Filter to only show venues within MEC circle


class CandidateAdd(BaseModel):
    """Schema for manually adding a candidate."""
    place_id: str
    name: str
    address: Optional[str]
    lat: float
    lng: float


# Vote schemas
class VoteCreate(BaseModel):
    """Schema for creating a vote."""
    candidate_id: str


class VoteResponse(BaseModel):
    """Schema for vote response."""
    id: int
    event_id: str
    participant_id: str
    candidate_id: str
    voted_at: datetime

    class Config:
        from_attributes = True


# Update schemas
class EventUpdate(BaseModel):
    """Schema for updating event settings."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    deadline: Optional[datetime] = None
    visibility: Optional[str] = Field(None, pattern="^(blur|show)$")
    allow_vote: Optional[bool] = None
    final_decision: Optional[str] = None
    custom_center_lat: Optional[float] = Field(None, ge=-90, le=90)
    custom_center_lng: Optional[float] = Field(None, ge=-180, le=180)


class EventPublish(BaseModel):
    """Schema for publishing final decision."""
    final_decision: str = Field(..., min_length=1)


# Analysis schemas
class CircleInfo(BaseModel):
    """Schema for circle analysis info."""
    center_lat: float
    center_lng: float
    radius_km: float


class EventAnalysis(BaseModel):
    """Schema for event analysis response."""
    event_id: str
    participant_count: int
    candidate_count: int
    circle: Optional[CircleInfo]


class SearchAreaInfo(BaseModel):
    """Schema for search area metadata (post-snap center and radius)."""
    center_lat: float
    center_lng: float
    radius_km: float
    was_snapped: bool = False  # Whether the center was adjusted from water to land
    original_center_lat: Optional[float] = None
    original_center_lng: Optional[float] = None


class CandidateSearchResponse(BaseModel):
    """Schema for candidate search response with search area metadata."""
    candidates: List[CandidateResponse]
    search_area: SearchAreaInfo
