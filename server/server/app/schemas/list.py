"""Pydantic schemas for Other People's Lists feature."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal


# ===== List Item Schemas =====

class ListItemCreate(BaseModel):
    """Schema for creating a list item."""
    place_id: str = Field(..., max_length=255)
    venue_name: str = Field(..., max_length=255)
    venue_address: Optional[str] = None
    venue_lat: float
    venue_lng: float
    rating: Optional[float] = Field(None, ge=0, le=5)
    notes: Optional[str] = Field(None, max_length=500)


class ListItemResponse(BaseModel):
    """Schema for list item response."""
    id: str
    list_id: str
    place_id: str
    venue_name: str
    venue_address: Optional[str]
    venue_lat: Decimal
    venue_lng: Decimal
    rating: Optional[Decimal]
    notes: Optional[str]
    order_index: int
    added_at: datetime

    class Config:
        from_attributes = True


# ===== Venue List Schemas =====

class VenueListCreate(BaseModel):
    """Schema for creating a venue list."""
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: str = Field(..., max_length=50)
    items: List[ListItemCreate] = Field(..., min_items=1)


class VenueListUpdate(BaseModel):
    """Schema for updating a venue list."""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    items: Optional[List[ListItemCreate]] = None


class VenueListSummary(BaseModel):
    """Schema for venue list summary (without items)."""
    id: str
    title: str
    description: Optional[str]
    category: str
    user_id: str
    user_name: str
    item_count: int
    like_count: int
    is_liked: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VenueListDetail(VenueListSummary):
    """Schema for venue list with full details including items."""
    items: List[ListItemResponse]

    class Config:
        from_attributes = True


# ===== List Like Schemas =====

class ListLikeResponse(BaseModel):
    """Schema for list like response."""
    message: str = "List liked successfully"


class ListUnlikeResponse(BaseModel):
    """Schema for list unlike response."""
    message: str = "List unliked successfully"
