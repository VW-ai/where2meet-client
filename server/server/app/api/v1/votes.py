"""API endpoints for voting system."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.base import get_db
from app.models.event import Event, Vote, Candidate, Participant
from app.schemas.event import VoteCreate, VoteResponse
from app.services.sse import sse_manager

router = APIRouter()


@router.post("/events/{event_id}/votes", response_model=VoteResponse, status_code=status.HTTP_201_CREATED)
async def cast_vote(
    event_id: str,
    participant_id: str,
    vote_data: VoteCreate,
    db: Session = Depends(get_db)
):
    """
    Cast a vote for a candidate.

    M2-07: Voting (Basic)
    - One person one vote per candidate (de-duplication)
    - Check if voting is allowed
    - Rate limiting handled by middleware
    """
    # Check if event exists and voting is allowed
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if not event.allow_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voting is not allowed for this event"
        )

    if event.final_decision:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is locked"
        )

    # Check if participant exists
    participant = db.query(Participant).filter(
        Participant.id == participant_id,
        Participant.event_id == event_id
    ).first()

    if not participant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participant not found"
        )

    # Check if candidate exists
    candidate = db.query(Candidate).filter(
        Candidate.id == vote_data.candidate_id,
        Candidate.event_id == event_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )

    # Check if already voted (de-duplication)
    existing_vote = db.query(Vote).filter(
        Vote.event_id == event_id,
        Vote.participant_id == participant_id,
        Vote.candidate_id == vote_data.candidate_id
    ).first()

    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already voted for this candidate"
        )

    # Create vote
    vote = Vote(
        event_id=event_id,
        participant_id=participant_id,
        candidate_id=vote_data.candidate_id
    )

    db.add(vote)
    db.commit()
    db.refresh(vote)

    # Get updated vote count
    vote_count = db.query(Vote).filter(
        Vote.event_id == event_id,
        Vote.candidate_id == vote_data.candidate_id
    ).count()

    # Broadcast vote cast
    await sse_manager.broadcast(event_id, "vote_cast", {
        "candidate_id": vote_data.candidate_id,
        "vote_count": vote_count
    })

    return vote


@router.delete("/events/{event_id}/votes/{vote_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_vote(
    event_id: str,
    vote_id: int,
    participant_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove a vote (allow users to change their mind).
    """
    vote = db.query(Vote).filter(
        Vote.id == vote_id,
        Vote.event_id == event_id,
        Vote.participant_id == participant_id
    ).first()

    if not vote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vote not found"
        )

    candidate_id = vote.candidate_id
    db.delete(vote)
    db.commit()

    # Get updated vote count
    vote_count = db.query(Vote).filter(
        Vote.event_id == event_id,
        Vote.candidate_id == candidate_id
    ).count()

    # Broadcast vote removed
    await sse_manager.broadcast(event_id, "vote_removed", {
        "candidate_id": candidate_id,
        "vote_count": vote_count
    })


@router.get("/events/{event_id}/votes", response_model=List[VoteResponse])
async def get_votes(
    event_id: str,
    participant_id: str = None,
    db: Session = Depends(get_db)
):
    """
    Get all votes for an event, optionally filtered by participant.
    """
    query = db.query(Vote).filter(Vote.event_id == event_id)

    if participant_id:
        query = query.filter(Vote.participant_id == participant_id)

    votes = query.all()
    return votes
