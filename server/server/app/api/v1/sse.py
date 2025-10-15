"""API endpoints for Server-Sent Events (SSE)."""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.event import Event
from app.services.sse import sse_manager

router = APIRouter()


@router.get("/events/{event_id}/stream")
async def event_stream(
    event_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    SSE endpoint for real-time event updates.

    M2-03: Realtime Updates (SSE)

    Client receives events:
    - participant_joined
    - participant_left
    - candidates_added
    - candidate_added
    - candidate_removed
    - vote_cast
    - vote_removed
    - event_updated
    - event_published
    """
    # Check if event exists
    event = db.query(Event).filter(
        Event.id == event_id,
        Event.deleted_at.is_(None)
    ).first()

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    # Return SSE stream
    return StreamingResponse(
        sse_manager.event_stream(event_id, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
