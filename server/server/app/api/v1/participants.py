"""API endpoints for participant management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.event import Event, Participant
from app.schemas.event import ParticipantCreate, ParticipantUpdate, ParticipantResponse
from app.core.security import generate_participant_id
from app.services.sse import sse_manager
from app.services.algorithms import apply_fuzzing

router = APIRouter()


@router.post("/events/{event_id}/participants", response_model=ParticipantResponse, status_code=status.HTTP_201_CREATED)
async def add_participant(
    event_id: str,
    participant_data: ParticipantCreate,
    db: Session = Depends(get_db)
):
    """
    Add a participant to an event (anonymous location submission).

    M2-02: Participant Location Submission
    """
    # Check if event exists and is not deleted
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if event is locked
    if event.final_decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is locked"
        )

    # Generate participant ID
    participant_id = generate_participant_id()

    # Apply fuzzing if visibility is blur
    if event.visibility == "blur":
        fuzzy_lat, fuzzy_lng = apply_fuzzing(participant_data.lat, participant_data.lng)
    else:
        fuzzy_lat, fuzzy_lng = participant_data.lat, participant_data.lng

    # Create participant
    participant = Participant(
        id=participant_id,
        event_id=event_id,
        lat=participant_data.lat,
        lng=participant_data.lng,
        fuzzy_lat=fuzzy_lat,
        fuzzy_lng=fuzzy_lng,
        name=participant_data.name
    )

    db.add(participant)
    db.commit()
    db.refresh(participant)

    # Broadcast participant joined
    await sse_manager.broadcast(event_id, "participant_joined", {
        "participant_id": participant_id,
        "lat": fuzzy_lat if event.visibility == "blur" else participant.lat,
        "lng": fuzzy_lng if event.visibility == "blur" else participant.lng,
        "name": participant.name
    })

    # Return response with appropriate coordinates
    response = ParticipantResponse(
        id=participant.id,
        event_id=participant.event_id,
        lat=fuzzy_lat if event.visibility == "blur" else participant.lat,
        lng=fuzzy_lng if event.visibility == "blur" else participant.lng,
        name=participant.name,
        joined_at=participant.joined_at
    )

    return response


@router.get("/events/{event_id}/participants", response_model=List[ParticipantResponse])
async def get_participants(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all participants for an event.
    """
    # Check if event exists
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

    # Return with appropriate coordinates based on visibility
    responses = []
    for p in participants:
        responses.append(ParticipantResponse(
            id=p.id,
            event_id=p.event_id,
            lat=p.fuzzy_lat if event.visibility == "blur" else p.lat,
            lng=p.fuzzy_lng if event.visibility == "blur" else p.lng,
            name=p.name,
            joined_at=p.joined_at
        ))

    return responses


@router.patch("/events/{event_id}/participants/{participant_id}", response_model=ParticipantResponse)
async def update_participant(
    event_id: str,
    participant_id: str,
    update_data: ParticipantUpdate,
    db: Session = Depends(get_db)
):
    """
    Update participant location or name.
    """
    # Check if event exists
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Get participant
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.event_id == event_id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )

    # Update fields
    if update_data.lat is not None and update_data.lng is not None:
        participant.lat = update_data.lat
        participant.lng = update_data.lng

        # Apply fuzzing if visibility is blur
        if event.visibility == "blur":
            fuzzy_lat, fuzzy_lng = apply_fuzzing(update_data.lat, update_data.lng)
            participant.fuzzy_lat = fuzzy_lat
            participant.fuzzy_lng = fuzzy_lng
        else:
            participant.fuzzy_lat = update_data.lat
            participant.fuzzy_lng = update_data.lng

    if update_data.name is not None:
        participant.name = update_data.name

    db.commit()
    db.refresh(participant)

    # Broadcast participant updated
    await sse_manager.broadcast(event_id, "participant_updated", {
        "participant_id": participant_id,
        "lat": participant.fuzzy_lat if event.visibility == "blur" else participant.lat,
        "lng": participant.fuzzy_lng if event.visibility == "blur" else participant.lng,
        "name": participant.name
    })

    return ParticipantResponse(
        id=participant.id,
        event_id=participant.event_id,
        lat=participant.fuzzy_lat if event.visibility == "blur" else participant.lat,
        lng=participant.fuzzy_lng if event.visibility == "blur" else participant.lng,
        name=participant.name,
        joined_at=participant.joined_at
    )


@router.delete("/events/{event_id}/participants/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_participant(
    event_id: str,
    participant_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove a participant from an event.
    """
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.event_id == event_id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )

    db.delete(participant)
    db.commit()

    # Broadcast participant left
    await sse_manager.broadcast(event_id, "participant_left", {
        "participant_id": participant_id
    })
