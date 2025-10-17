"""API endpoints for event management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from app.db.base import get_db
from app.models.event import Event, Participant, Candidate, Vote
from app.models.user import User
from app.schemas.event import (
    EventCreate, EventResponse, EventJoinResponse, EventUpdate, EventPublish, EventAnalysis, CircleInfo
)
from app.core.security import create_event_token, create_event_id
from app.core.config import settings
from app.services.sse import sse_manager
from app.services.algorithms import compute_centroid, compute_mec
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.post("/events", response_model=EventJoinResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Create a new event and return join link.

    M2-01: Event Creation

    If user is authenticated, the event will be linked to their account.
    Anonymous users can still create events.
    """
    # Generate event ID
    event_id = create_event_id()

    # Calculate expiry date
    expires_at = datetime.utcnow() + timedelta(days=settings.EVENT_TTL_DAYS)

    # Create event
    event = Event(
        id=event_id,
        title=event_data.title,
        category=event_data.category,
        deadline=event_data.deadline,
        visibility=event_data.visibility,
        allow_vote=event_data.allow_vote,
        expires_at=expires_at,
        created_by=current_user.id if current_user else None  # Link to user if authenticated
    )

    db.add(event)
    db.commit()
    db.refresh(event)

    # Generate join token
    token = create_event_token(event_id)
    join_link = f"{settings.ALLOWED_ORIGINS[0]}/join/{token}"

    return EventJoinResponse(
        event=EventResponse.from_orm(event),
        join_link=join_link,
        join_token=token
    )


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get event details.
    """
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return event


@router.patch("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    update_data: EventUpdate,
    db: Session = Depends(get_db)
):
    """
    Update event settings.

    M2-06: Visibility & Voting Toggles
    """
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Update fields
    if update_data.title is not None:
        event.title = update_data.title
    if update_data.deadline is not None:
        event.deadline = update_data.deadline
    if update_data.visibility is not None:
        event.visibility = update_data.visibility
    if update_data.allow_vote is not None:
        event.allow_vote = update_data.allow_vote
    if update_data.final_decision is not None:
        event.final_decision = update_data.final_decision
    if update_data.custom_center_lat is not None:
        event.custom_center_lat = update_data.custom_center_lat
    if update_data.custom_center_lng is not None:
        event.custom_center_lng = update_data.custom_center_lng

    db.commit()
    db.refresh(event)

    # Broadcast update
    await sse_manager.broadcast(event_id, "event_updated", {
        "event_id": event_id,
        "visibility": event.visibility,
        "allow_vote": event.allow_vote,
        "custom_center_lat": event.custom_center_lat,
        "custom_center_lng": event.custom_center_lng
    })

    return event


@router.post("/events/{event_id}/publish", response_model=EventResponse)
async def publish_event(
    event_id: str,
    publish_data: EventPublish,
    db: Session = Depends(get_db)
):
    """
    Publish final decision and lock event.

    M2-08: Deadline & Publish
    """
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Set final decision
    event.final_decision = publish_data.final_decision
    event.allow_vote = False  # Lock voting

    db.commit()
    db.refresh(event)

    # Broadcast final decision
    await sse_manager.broadcast(event_id, "event_published", {
        "event_id": event_id,
        "final_decision": event.final_decision
    })

    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: str,
    hard_delete: bool = False,
    db: Session = Depends(get_db)
):
    """
    Delete event (soft or hard delete).

    M2-09: Data Lifecycle & Governance
    """
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if hard_delete:
        # Hard delete - remove from database
        db.delete(event)
    else:
        # Soft delete - mark as deleted
        event.deleted_at = datetime.utcnow()

    db.commit()


@router.get("/events/{event_id}/analysis", response_model=EventAnalysis)
async def get_event_analysis(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get event analysis including MEC calculations.
    """
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Get participants
    participants = db.query(Participant).filter(
        Participant.event_id == event_id
    ).all()

    # Get candidates
    candidates = db.query(Candidate).filter(
        Candidate.event_id == event_id
    ).all()

    # Compute MEC if we have participants
    circle = None
    if len(participants) >= 1:
        locations = [(p.lat, p.lng) for p in participants]
        mec_result = compute_mec(locations)
        if mec_result:
            center_lat, center_lng, radius_km = mec_result
            circle = CircleInfo(
                center_lat=center_lat,
                center_lng=center_lng,
                radius_km=radius_km
            )

    return EventAnalysis(
        event_id=event_id,
        participant_count=len(participants),
        candidate_count=len(candidates),
        circle=circle
    )
