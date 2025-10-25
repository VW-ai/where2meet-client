"""API endpoints for Event Feed management."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from typing import List, Optional
import math

from app.db.base import get_db
from app.models.feed import FeedEvent, FeedParticipant, FeedVenue, FeedVote
from app.models.user import User
from app.schemas.feed import (
    FeedEventCreate, FeedEventUpdate, FeedEventResponse, FeedEventDetailResponse,
    FeedEventsListResponse, FeedEventJoinRequest, FeedParticipantResponse,
    FeedVenueResponse, FeedVenueCreate, FeedVoteCreate, FeedEventFilters
)
from app.core.security import create_event_id
from app.api.v1.auth import get_current_user, require_current_user

router = APIRouter()

# Map subcategories to their parent categories
SUBCATEGORY_TO_PARENT = {
    # Sports subcategories
    'Basketball': 'sports',
    'Soccer': 'sports',
    'Tennis': 'sports',
    'Running': 'sports',
    'Gym': 'sports',
    'Cycling': 'sports',
    'Volleyball': 'sports',
    'Badminton': 'sports',
    # Entertainment subcategories
    'Movies': 'entertainment',
    'Theater': 'entertainment',
    'Concerts': 'entertainment',
    'Museums': 'entertainment',
    'Gaming': 'entertainment',
    'Comedy': 'entertainment',
    'Karaoke': 'entertainment',
    'Festival': 'entertainment',
}

# Map parent categories to their subcategories
PARENT_TO_SUBCATEGORIES = {
    'sports': ['Basketball', 'Soccer', 'Tennis', 'Running', 'Gym', 'Cycling', 'Volleyball', 'Badminton'],
    'entertainment': ['Movies', 'Theater', 'Concerts', 'Museums', 'Gaming', 'Comedy', 'Karaoke', 'Festival'],
}


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula."""
    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = math.sin(delta_lat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def build_event_response(event: FeedEvent, db: Session, user_lat: Optional[float] = None, user_lng: Optional[float] = None) -> FeedEventResponse:
    """Build Event Feed response with computed fields."""
    # Get host bio from users table
    host_bio = None
    if event.host_id:
        host_user = db.query(User).filter(User.id == event.host_id).first()
        if host_user:
            host_bio = host_user.bio

    # Get participant count and avatars
    participants = db.query(FeedParticipant).filter(FeedParticipant.event_id == event.id).all()
    participant_count = len(participants)
    participant_avatars = [p.avatar for p in participants[:4] if p.avatar]

    # Get venue count and average rating
    venues = db.query(FeedVenue).filter(FeedVenue.event_id == event.id).all()
    venue_count = len(venues)
    average_rating = None
    if venues:
        ratings = [v.rating for v in venues if v.rating is not None]
        if ratings:
            average_rating = sum(ratings) / len(ratings)

    # Calculate distance from user
    distance_km = None
    if user_lat is not None and user_lng is not None:
        if event.location_coords_lat and event.location_coords_lng:
            distance_km = calculate_distance(user_lat, user_lng, event.location_coords_lat, event.location_coords_lng)
        elif event.fixed_venue_lat and event.fixed_venue_lng:
            distance_km = calculate_distance(user_lat, user_lng, event.fixed_venue_lat, event.fixed_venue_lng)

    # Build location coords
    location_coords = None
    if event.location_coords_lat and event.location_coords_lng:
        location_coords = {"lat": event.location_coords_lat, "lng": event.location_coords_lng}

    return FeedEventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        host_id=event.host_id,
        host_name=event.host_name,
        host_bio=host_bio,
        host_contact_number=event.host_contact_number,
        participant_count=participant_count,
        participant_limit=event.participant_limit,
        participant_avatars=participant_avatars,
        meeting_time=event.meeting_time,
        location_area=event.location_area,
        location_coords=location_coords,
        location_type=event.location_type,
        fixed_venue_id=event.fixed_venue_id,
        fixed_venue_name=event.fixed_venue_name,
        fixed_venue_address=event.fixed_venue_address,
        fixed_venue_lat=event.fixed_venue_lat,
        fixed_venue_lng=event.fixed_venue_lng,
        category=event.category,
        background_image=event.background_image,
        visibility=event.visibility,
        allow_vote=event.allow_vote,
        venue_count=venue_count,
        average_rating=average_rating,
        distance_km=distance_km,
        status=event.status,
        created_at=event.created_at,
        updated_at=event.updated_at
    )


@router.post("/feed/events", response_model=FeedEventResponse, status_code=status.HTTP_201_CREATED)
async def create_feed_event(
    event_data: FeedEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Create a new Event Feed event (requires authentication)."""
    # Generate event ID
    event_id = create_event_id()

    # Determine host name
    host_name = current_user.name if current_user.name else current_user.email.split('@')[0]

    # Create event
    event = FeedEvent(
        id=event_id,
        title=event_data.title,
        description=event_data.description,
        host_id=current_user.id,
        host_name=host_name,
        host_contact_number=event_data.contact_number,
        participant_limit=event_data.participant_limit,
        meeting_time=event_data.meeting_time,
        location_area=event_data.location_area,
        location_coords_lat=event_data.location_coords_lat,
        location_coords_lng=event_data.location_coords_lng,
        location_type=event_data.location_type,
        fixed_venue_name=event_data.fixed_venue_name,
        fixed_venue_address=event_data.fixed_venue_address,
        fixed_venue_lat=event_data.fixed_venue_lat,
        fixed_venue_lng=event_data.fixed_venue_lng,
        category=event_data.category,
        background_image=event_data.background_image,
        visibility=event_data.visibility,
        allow_vote=event_data.allow_vote,
        status="active"
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    return build_event_response(event, db)


@router.get("/feed/events", response_model=FeedEventsListResponse)
async def list_feed_events(
    category: Optional[str] = Query(None),
    date: Optional[str] = Query(None),  # Changed to str to handle date-only input
    timezone_offset: Optional[int] = Query(None),  # Timezone offset in minutes
    near_me: bool = Query(False),
    user_lat: Optional[float] = Query(None, ge=-90, le=90),
    user_lng: Optional[float] = Query(None, ge=-180, le=180),
    max_distance_km: Optional[float] = Query(None, ge=0),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List Event Feed events with filters."""
    # Base query - only public, non-deleted, and non-closed events
    query = db.query(FeedEvent).filter(
        FeedEvent.visibility == "public",
        FeedEvent.deleted_at.is_(None),
        FeedEvent.status != "closed"
    )

    # Apply filters
    if category:
        # Check if this is a parent category (sports, entertainment)
        if category.lower() in PARENT_TO_SUBCATEGORIES:
            # Match both the parent category and all its subcategories
            subcategories = PARENT_TO_SUBCATEGORIES[category.lower()]
            query = query.filter(
                or_(
                    FeedEvent.category == category,
                    FeedEvent.category.in_(subcategories)
                )
            )
        else:
            # It's a specific subcategory or exact match
            query = query.filter(FeedEvent.category == category)

    if date:
        # Filter by date (same day) - use SQL date extraction to compare dates only
        # This ensures we compare calendar dates, not datetime stamps
        from sqlalchemy import func as sqlfunc, Date, cast, text
        from datetime import datetime

        # Convert string date to date object
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d').date()

            # Get timezone offset from query params (in minutes)
            # JavaScript's getTimezoneOffset() returns positive for zones behind UTC
            # e.g., PST (UTC-8) returns 480
            if timezone_offset is not None:
                # Convert meeting_time to user's local timezone before extracting date
                # Subtract offset because JS getTimezoneOffset is inverted
                query = query.filter(
                    sqlfunc.date(FeedEvent.meeting_time - text(f"INTERVAL '{timezone_offset} minutes'")) == date_obj
                )
            else:
                # Fallback to UTC if no timezone provided
                query = query.filter(
                    sqlfunc.date(FeedEvent.meeting_time) == date_obj
                )
        except (ValueError, TypeError):
            # If date format is invalid, skip the filter
            pass

    if status:
        query = query.filter(FeedEvent.status == status)
    else:
        # By default, exclude past, cancelled, and closed events
        query = query.filter(FeedEvent.status.notin_(["past", "cancelled", "closed"]))

    # Get total count before pagination
    total = query.count()

    # Order by meeting time (soonest first)
    query = query.order_by(FeedEvent.meeting_time.asc())

    # Pagination
    offset = (page - 1) * page_size
    events = query.offset(offset).limit(page_size).all()

    # Build responses
    event_responses = []
    for event in events:
        event_response = build_event_response(event, db, user_lat, user_lng)

        # Apply distance filter if specified
        if near_me and max_distance_km and event_response.distance_km:
            if event_response.distance_km <= max_distance_km:
                event_responses.append(event_response)
        else:
            event_responses.append(event_response)

    has_more = (offset + page_size) < total

    return FeedEventsListResponse(
        events=event_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )


@router.get("/feed/events/{event_id}", response_model=FeedEventDetailResponse)
async def get_feed_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get Event Feed event details with participants and venues."""
    event = db.query(FeedEvent).filter(
        FeedEvent.id == event_id,
        FeedEvent.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Get participants
    participants = db.query(FeedParticipant).filter(
        FeedParticipant.event_id == event_id
    ).all()

    # Get venues with vote counts, sorted by vote count (descending)
    venues_query = db.query(
        FeedVenue,
        func.count(FeedVote.id).label("vote_count")
    ).outerjoin(
        FeedVote, FeedVenue.id == FeedVote.venue_id
    ).filter(
        FeedVenue.event_id == event_id
    ).group_by(FeedVenue.id).order_by(
        func.count(FeedVote.id).desc()
    ).all()

    # Get current user's participant record if they are a participant
    current_participant = None
    if current_user:
        current_participant = db.query(FeedParticipant).filter(
            FeedParticipant.event_id == event_id,
            FeedParticipant.user_id == current_user.id
        ).first()

    # Get user's votes if they are a participant
    user_voted_venue_ids = set()
    if current_participant:
        user_votes = db.query(FeedVote.venue_id).filter(
            FeedVote.participant_id == current_participant.id,
            FeedVote.event_id == event_id
        ).all()
        user_voted_venue_ids = {vote[0] for vote in user_votes}

    venues = []
    for venue, vote_count in venues_query:
        venue_response = FeedVenueResponse.from_orm(venue)
        venue_response.vote_count = vote_count
        venue_response.user_voted = venue.id in user_voted_venue_ids
        venues.append(venue_response)

    # Determine if current user is host and/or participant
    is_host = current_user and event.host_id == current_user.id
    is_participant = current_user and any(p.user_id == current_user.id for p in participants)

    event_response = build_event_response(event, db)

    return FeedEventDetailResponse(
        event=event_response,
        participants=[FeedParticipantResponse.from_orm(p) for p in participants],
        venues=venues,
        is_host=is_host or False,
        is_participant=is_participant or False
    )


@router.patch("/feed/events/{event_id}", response_model=FeedEventResponse)
async def update_feed_event(
    event_id: str,
    update_data: FeedEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Update Event Feed event (host only - requires authentication)."""
    event = db.query(FeedEvent).filter(
        FeedEvent.id == event_id,
        FeedEvent.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is host
    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can update this event"
        )

    # Update fields
    if update_data.title is not None:
        event.title = update_data.title
    if update_data.description is not None:
        event.description = update_data.description
    if update_data.meeting_time is not None:
        event.meeting_time = update_data.meeting_time
    if update_data.location_area is not None:
        event.location_area = update_data.location_area
    if update_data.category is not None:
        event.category = update_data.category
    if update_data.participant_limit is not None:
        event.participant_limit = update_data.participant_limit
    if update_data.visibility is not None:
        event.visibility = update_data.visibility
    if update_data.allow_vote is not None:
        event.allow_vote = update_data.allow_vote
    if update_data.status is not None:
        event.status = update_data.status
    if update_data.background_image is not None:
        event.background_image = update_data.background_image

    db.commit()
    db.refresh(event)

    return build_event_response(event, db)


@router.delete("/feed/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feed_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Delete Event Feed event (soft delete, host only - requires authentication)."""
    event = db.query(FeedEvent).filter(
        FeedEvent.id == event_id,
        FeedEvent.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is host
    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can delete this event"
        )

    # Soft delete
    event.deleted_at = datetime.utcnow()
    db.commit()


@router.post("/feed/events/{event_id}/close", response_model=FeedEventResponse)
async def close_feed_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Close Event Feed event (host only - requires authentication)."""
    event = db.query(FeedEvent).filter(
        FeedEvent.id == event_id,
        FeedEvent.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is host
    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can close this event"
        )

    # Update status to closed
    event.status = "closed"
    db.commit()
    db.refresh(event)

    return build_event_response(event, db)


@router.post("/feed/events/{event_id}/join", response_model=FeedParticipantResponse)
async def join_feed_event(
    event_id: str,
    join_data: FeedEventJoinRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Join an Event Feed event."""
    event = db.query(FeedEvent).filter(
        FeedEvent.id == event_id,
        FeedEvent.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if event is full
    if event.participant_limit:
        participant_count = db.query(FeedParticipant).filter(
            FeedParticipant.event_id == event_id
        ).count()
        if participant_count >= event.participant_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is full"
            )

    # Check if event is closed
    if event.status in ["closed", "cancelled", "past"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot join event with status: {event.status}"
        )

    # Check if user already joined
    if current_user:
        existing = db.query(FeedParticipant).filter(
            FeedParticipant.event_id == event_id,
            FeedParticipant.user_id == current_user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already joined this event"
            )

    # Create participant with fallback avatar
    avatar = join_data.avatar
    if not avatar and current_user:
        # Use user's avatar if available
        avatar = current_user.avatar
    if not avatar:
        # Generate fallback avatar from name
        name_for_avatar = join_data.name.replace(' ', '+')
        avatar = f"https://ui-avatars.com/api/?name={name_for_avatar}&background=4F46E5&color=fff"

    participant = FeedParticipant(
        id=create_event_id(),
        event_id=event.id,
        user_id=current_user.id if current_user else None,
        name=join_data.name,
        email=join_data.email,
        avatar=avatar
    )

    db.add(participant)

    # Update event status to full if limit reached
    if event.participant_limit:
        new_count = db.query(FeedParticipant).filter(
            FeedParticipant.event_id == event_id
        ).count() + 1
        if new_count >= event.participant_limit:
            event.status = "full"

    db.commit()
    db.refresh(participant)

    return FeedParticipantResponse.from_orm(participant)


@router.delete("/feed/events/{event_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_feed_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Leave an Event Feed event (requires authentication)."""
    participant = db.query(FeedParticipant).filter(
        FeedParticipant.event_id == event_id,
        FeedParticipant.user_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a participant of this event"
        )

    event = db.query(FeedEvent).filter(FeedEvent.id == event_id).first()

    db.delete(participant)

    # Update event status from full to active if participant left
    if event and event.status == "full" and event.participant_limit:
        new_count = db.query(FeedParticipant).filter(
            FeedParticipant.event_id == event_id
        ).count() - 1
        if new_count < event.participant_limit:
            event.status = "active"

    db.commit()


@router.delete("/feed/events/{event_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant_from_event(
    event_id: str,
    participant_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Remove a participant from an Event Feed event (host only)."""
    # Check if event exists and user is the host
    event = db.query(FeedEvent).filter(FeedEvent.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can remove participants"
        )

    # Find the participant
    participant = db.query(FeedParticipant).filter(
        FeedParticipant.id == participant_id,
        FeedParticipant.event_id == event_id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found in this event"
        )

    # Delete the participant
    db.delete(participant)

    # Update event status from full to active if needed
    if event.status == "full" and event.participant_limit:
        new_count = db.query(FeedParticipant).filter(
            FeedParticipant.event_id == event_id
        ).count() - 1
        if new_count < event.participant_limit:
            event.status = "active"

    db.commit()


@router.post("/feed/events/{event_id}/venues", response_model=FeedVenueResponse)
async def add_venue(
    event_id: str,
    venue_data: FeedVenueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Add a venue to an event (participants only - requires authentication)."""
    event = db.query(FeedEvent).filter(
        FeedEvent.id == event_id,
        FeedEvent.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is participant or host
    is_participant = db.query(FeedParticipant).filter(
        FeedParticipant.event_id == event_id,
        FeedParticipant.user_id == current_user.id
    ).first()

    if not is_participant and event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only participants can add venues"
        )

    # Check if venue already exists
    existing = db.query(FeedVenue).filter(
        FeedVenue.event_id == event_id,
        FeedVenue.place_id == venue_data.place_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Venue already added to this event"
        )

    # Create venue
    venue = FeedVenue(
        id=create_event_id(),
        event_id=event.id,
        place_id=venue_data.place_id,
        name=venue_data.name,
        vicinity=venue_data.vicinity,
        lat=venue_data.lat,
        lng=venue_data.lng,
        rating=venue_data.rating,
        user_ratings_total=venue_data.user_ratings_total,
        distance_from_center=venue_data.distance_from_center,
        in_circle=venue_data.in_circle,
        open_now=venue_data.open_now,
        types=venue_data.types,
        photo_reference=venue_data.photo_reference,
        added_by="organizer" if event.host_id == current_user.id else "participant"
    )

    db.add(venue)
    db.commit()
    db.refresh(venue)

    venue_response = FeedVenueResponse.from_orm(venue)
    venue_response.vote_count = 0

    return venue_response


@router.post("/feed/events/{event_id}/votes", status_code=status.HTTP_201_CREATED)
async def vote_on_venue(
    event_id: str,
    vote_data: FeedVoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Vote for a venue (participants only - requires authentication)."""
    # Check if user is participant
    participant = db.query(FeedParticipant).filter(
        FeedParticipant.event_id == event_id,
        FeedParticipant.user_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only participants can vote"
        )

    # Check if venue exists
    venue = db.query(FeedVenue).filter(
        FeedVenue.id == vote_data.venue_id,
        FeedVenue.event_id == event_id
    ).first()

    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )

    # Check if already voted for this venue
    existing_vote = db.query(FeedVote).filter(
        FeedVote.participant_id == participant.id,
        FeedVote.venue_id == vote_data.venue_id
    ).first()

    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already voted for this venue"
        )

    # Create vote
    vote = FeedVote(
        event_id=event_id,
        participant_id=participant.id,
        venue_id=vote_data.venue_id
    )

    db.add(vote)
    db.commit()

    return {"message": "Vote recorded successfully"}


@router.delete("/feed/events/{event_id}/votes/{venue_id}", status_code=status.HTTP_200_OK)
async def unvote_venue(
    event_id: str,
    venue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Remove vote for a venue (participants only - requires authentication)."""
    # Check if user is participant
    participant = db.query(FeedParticipant).filter(
        FeedParticipant.event_id == event_id,
        FeedParticipant.user_id == current_user.id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only participants can unvote"
        )

    # Find and delete the vote
    vote = db.query(FeedVote).filter(
        FeedVote.participant_id == participant.id,
        FeedVote.venue_id == venue_id,
        FeedVote.event_id == event_id
    ).first()

    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )

    db.delete(vote)
    db.commit()

    return {"message": "Vote removed successfully"}


@router.get("/feed/my-posts", response_model=FeedEventsListResponse)
async def get_my_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Get events created by current user (requires authentication)."""
    query = db.query(FeedEvent).filter(
        FeedEvent.host_id == current_user.id,
        FeedEvent.deleted_at.is_(None)
    ).order_by(FeedEvent.created_at.desc())

    total = query.count()
    offset = (page - 1) * page_size
    events = query.offset(offset).limit(page_size).all()

    event_responses = [build_event_response(event, db) for event in events]
    has_more = (offset + page_size) < total

    return FeedEventsListResponse(
        events=event_responses,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )
