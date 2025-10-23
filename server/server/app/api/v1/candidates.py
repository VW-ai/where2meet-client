"""API endpoints for candidate venue management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import json

from app.db.base import get_db
from app.models.event import Event, Participant, Candidate, Vote
from app.schemas.event import CandidateResponse, CandidateSearch, CandidateAdd, CandidateSearchResponse, SearchAreaInfo
from app.services.sse import sse_manager
from app.services.google_maps import google_maps_service
from app.services.algorithms import compute_centroid, compute_mec, haversine_distance

router = APIRouter()


@router.post("/events/{event_id}/candidates/search", response_model=CandidateSearchResponse)
async def search_candidates(
    event_id: str,
    search_data: CandidateSearch,
    db: Session = Depends(get_db)
):
    """
    Search for candidate venues using Google Places API.

    M2-04: Server-side MEC & In-circle POI
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

    if len(participants) < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Need at least one participant to search"
        )

    # Use custom center if provided, otherwise compute MEC
    if search_data.custom_center_lat is not None and search_data.custom_center_lng is not None:
        # Use custom center from dragged centroid
        center_lat = search_data.custom_center_lat
        center_lng = search_data.custom_center_lng

        # Still compute MEC to get the radius
        locations = [(p.lat, p.lng) for p in participants]
        mec_result = compute_mec(locations)

        if not mec_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to compute MEC"
            )

        _, _, radius_km = mec_result  # Use MEC radius but custom center
        print(f"🎯 Using custom center: ({center_lat:.6f}, {center_lng:.6f}) with MEC radius: {radius_km:.2f}km")
    else:
        # Compute MEC normally
        locations = [(p.lat, p.lng) for p in participants]
        mec_result = compute_mec(locations)

        if not mec_result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to compute MEC"
            )

        center_lat, center_lng, radius_km = mec_result
        print(f"📍 Using computed MEC center: ({center_lat:.6f}, {center_lng:.6f}) with radius: {radius_km:.2f}km")

    # Store original center before snapping
    original_center_lat = center_lat
    original_center_lng = center_lng

    # Snap center point to land (avoid water)
    # This ensures the search center is always on land
    land_center = await google_maps_service.snap_to_land(
        lat=center_lat,
        lng=center_lng,
        max_radius=min(radius_km * 2, 10.0)  # Search up to 2x MEC radius or 10km
    )

    # Use land-based center for search
    search_center_lat = land_center["lat"]
    search_center_lng = land_center["lng"]
    search_radius = radius_km * search_data.radius_multiplier

    # Check if center was adjusted (snapped)
    was_snapped = abs(search_center_lat - center_lat) > 0.0001 or abs(search_center_lng - center_lng) > 0.0001

    # Log if center was adjusted
    if was_snapped:
        print(f"🌊 Center adjusted from water ({center_lat:.6f}, {center_lng:.6f}) to land ({search_center_lat:.6f}, {search_center_lng:.6f})")

    # Clear previous search results (system-added candidates only)
    # This ensures each search shows only new results, not accumulated ones
    db.query(Candidate).filter(
        Candidate.event_id == event_id,
        Candidate.added_by == "system"
    ).delete(synchronize_session=False)
    db.commit()

    # Search Google Places using land-based center
    places = await google_maps_service.search_places_nearby(
        lat=search_center_lat,
        lng=search_center_lng,
        radius=search_radius,
        keyword=search_data.keyword
    )

    # Store new candidates in database and track all place IDs
    place_ids_from_search = []
    for place in places:
        place_ids_from_search.append(place["place_id"])

        # Check if already exists
        existing = db.query(Candidate).filter(
            Candidate.event_id == event_id,
            Candidate.place_id == place["place_id"]
        ).first()

        if existing:
            continue

        # Calculate distance from land-based center
        distance = haversine_distance(
            search_center_lat, search_center_lng,
            place["lat"], place["lng"]
        )

        # Check if in circle (use original MEC radius)
        in_circle = distance <= radius_km

        # Create candidate
        candidate = Candidate(
            id=f"cand_{event_id}_{place['place_id'][:12]}",
            event_id=event_id,
            place_id=place["place_id"],
            name=place["name"],
            address=place["address"],
            lat=place["lat"],
            lng=place["lng"],
            rating=place.get("rating"),
            user_ratings_total=place.get("user_ratings_total", 0),
            distance_from_center=distance,
            in_circle=in_circle,
            opening_hours=json.dumps(place.get("opening_hours")) if place.get("opening_hours") else None,
            photo_reference=place.get("photo_reference"),
            added_by="system"
        )

        db.add(candidate)

    db.commit()

    # Fetch candidates from this search
    query = db.query(Candidate).filter(
        Candidate.event_id == event_id,
        Candidate.place_id.in_(place_ids_from_search)
    )

    # Filter to only in-circle candidates if requested
    if search_data.only_in_circle:
        query = query.filter(Candidate.in_circle == True)

    candidates = query.all()

    # Broadcast candidates added
    await sse_manager.broadcast(event_id, "candidates_added", {
        "count": len(candidates),
        "keyword": search_data.keyword,
        "only_in_circle": search_data.only_in_circle
    })

    # Get vote counts
    candidate_ids = [c.id for c in candidates]
    vote_count_map = {}

    if candidate_ids:
        vote_counts = db.query(
            Vote.candidate_id,
            func.count(Vote.id).label("vote_count")
        ).filter(
            Vote.candidate_id.in_(candidate_ids)
        ).group_by(Vote.candidate_id).all()

        vote_count_map = {cid: count for cid, count in vote_counts}

    # Build responses
    responses = []
    for c in candidates:
        responses.append(CandidateResponse(
            id=c.id,
            event_id=c.event_id,
            place_id=c.place_id,
            name=c.name,
            address=c.address,
            lat=c.lat,
            lng=c.lng,
            rating=c.rating,
            user_ratings_total=c.user_ratings_total,
            distance_from_center=c.distance_from_center,
            in_circle=c.in_circle,
            opening_hours=c.opening_hours,
            added_by=c.added_by,
            vote_count=vote_count_map.get(c.id, 0),
            photo_reference=c.photo_reference
        ))

    # Build search area metadata
    search_area = SearchAreaInfo(
        center_lat=search_center_lat,
        center_lng=search_center_lng,
        radius_km=search_radius,
        was_snapped=was_snapped,
        original_center_lat=original_center_lat if was_snapped else None,
        original_center_lng=original_center_lng if was_snapped else None
    )

    return CandidateSearchResponse(
        candidates=responses,
        search_area=search_area
    )


@router.get("/events/{event_id}/candidates", response_model=List[CandidateResponse])
async def get_candidates(
    event_id: str,
    sort_by: Optional[str] = "rating",  # rating or distance
    db: Session = Depends(get_db)
):
    """
    Get all candidates for an event with sorting.

    M2-05: Candidate Ranking API
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

    # Get candidates
    query = db.query(Candidate).filter(Candidate.event_id == event_id)

    # Apply sorting
    if sort_by == "distance":
        query = query.order_by(Candidate.distance_from_center.asc())
    else:  # rating
        query = query.order_by(Candidate.rating.desc())

    candidates = query.all()

    # Get vote counts
    candidate_ids = [c.id for c in candidates]
    vote_count_map = {}

    if candidate_ids:
        vote_counts = db.query(
            Vote.candidate_id,
            func.count(Vote.id).label("vote_count")
        ).filter(
            Vote.candidate_id.in_(candidate_ids)
        ).group_by(Vote.candidate_id).all()

        vote_count_map = {cid: count for cid, count in vote_counts}

    # Build responses
    responses = []
    for c in candidates:
        responses.append(CandidateResponse(
            id=c.id,
            event_id=c.event_id,
            place_id=c.place_id,
            name=c.name,
            address=c.address,
            lat=c.lat,
            lng=c.lng,
            rating=c.rating,
            user_ratings_total=c.user_ratings_total,
            distance_from_center=c.distance_from_center,
            in_circle=c.in_circle,
            opening_hours=c.opening_hours,
            added_by=c.added_by,
            vote_count=vote_count_map.get(c.id, 0),
            photo_reference=c.photo_reference
        ))

    return responses


@router.post("/events/{event_id}/candidates", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def add_candidate_manually(
    event_id: str,
    candidate_data: CandidateAdd,
    db: Session = Depends(get_db)
):
    """
    Manually add a candidate to the ballot (organizer only).

    M2-06: Visibility & Voting Toggles
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

    # Check if already exists
    existing = db.query(Candidate).filter(
        Candidate.event_id == event_id,
        Candidate.place_id == candidate_data.place_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate already exists"
        )

    # Create candidate
    candidate = Candidate(
        id=f"cand_{event_id}_{candidate_data.place_id[:12]}",
        event_id=event_id,
        place_id=candidate_data.place_id,
        name=candidate_data.name,
        address=candidate_data.address,
        lat=candidate_data.lat,
        lng=candidate_data.lng,
        added_by="organizer"
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    # Broadcast candidate added
    await sse_manager.broadcast(event_id, "candidate_added", {
        "candidate_id": candidate.id,
        "name": candidate.name
    })

    return CandidateResponse(
        id=candidate.id,
        event_id=candidate.event_id,
        place_id=candidate.place_id,
        name=candidate.name,
        address=candidate.address,
        lat=candidate.lat,
        lng=candidate.lng,
        rating=candidate.rating,
        user_ratings_total=candidate.user_ratings_total,
        distance_from_center=candidate.distance_from_center,
        in_circle=candidate.in_circle,
        opening_hours=candidate.opening_hours,
        added_by=candidate.added_by,
        vote_count=0,
        photo_reference=candidate.photo_reference
    )


@router.post("/events/{event_id}/candidates/{candidate_id}/save", response_model=CandidateResponse)
async def save_candidate_to_added(
    event_id: str,
    candidate_id: str,
    db: Session = Depends(get_db)
):
    """
    Save a search result candidate to the added venues list.
    Changes added_by from 'system' to 'organizer'.
    """
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.event_id == event_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )

    # Change to organizer-added
    candidate.added_by = "organizer"
    db.commit()
    db.refresh(candidate)

    # Broadcast candidate saved
    await sse_manager.broadcast(event_id, "candidate_saved", {
        "candidate_id": candidate_id,
        "name": candidate.name
    })

    # Get vote count
    vote_count = db.query(func.count(Vote.id)).filter(
        Vote.candidate_id == candidate_id
    ).scalar() or 0

    return CandidateResponse(
        id=candidate.id,
        event_id=candidate.event_id,
        place_id=candidate.place_id,
        name=candidate.name,
        address=candidate.address,
        lat=candidate.lat,
        lng=candidate.lng,
        rating=candidate.rating,
        user_ratings_total=candidate.user_ratings_total,
        distance_from_center=candidate.distance_from_center,
        in_circle=candidate.in_circle,
        opening_hours=candidate.opening_hours,
        added_by=candidate.added_by,
        vote_count=vote_count,
        photo_reference=candidate.photo_reference
    )


@router.post("/events/{event_id}/candidates/{candidate_id}/unsave", response_model=CandidateResponse)
async def unsave_candidate_from_added(
    event_id: str,
    candidate_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove a candidate from the added venues list (but keep in database).
    Changes added_by from 'organizer' to 'system'.
    """
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.event_id == event_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )

    # Change back to system-added (search result)
    candidate.added_by = "system"
    db.commit()
    db.refresh(candidate)

    # Broadcast candidate unsaved
    await sse_manager.broadcast(event_id, "candidate_unsaved", {
        "candidate_id": candidate_id,
        "name": candidate.name
    })

    # Get vote count
    vote_count = db.query(func.count(Vote.id)).filter(
        Vote.candidate_id == candidate_id
    ).scalar() or 0

    return CandidateResponse(
        id=candidate.id,
        event_id=candidate.event_id,
        place_id=candidate.place_id,
        name=candidate.name,
        address=candidate.address,
        lat=candidate.lat,
        lng=candidate.lng,
        rating=candidate.rating,
        user_ratings_total=candidate.user_ratings_total,
        distance_from_center=candidate.distance_from_center,
        in_circle=candidate.in_circle,
        opening_hours=candidate.opening_hours,
        added_by=candidate.added_by,
        vote_count=vote_count,
        photo_reference=candidate.photo_reference
    )


@router.delete("/events/{event_id}/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_candidate(
    event_id: str,
    candidate_id: str,
    db: Session = Depends(get_db)
):
    """
    Remove a candidate from an event (permanent delete).
    """
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.event_id == event_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )

    db.delete(candidate)
    db.commit()

    # Broadcast candidate removed
    await sse_manager.broadcast(event_id, "candidate_removed", {
        "candidate_id": candidate_id
    })


@router.get("/events/{event_id}/candidates/{candidate_id}/photo")
async def get_candidate_photo(
    event_id: str,
    candidate_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetch photo reference for a specific candidate (on-demand with caching).
    """
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id,
        Candidate.event_id == event_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )

    # Check if we already have the photo reference
    if candidate.photo_reference:
        return {"photo_reference": candidate.photo_reference}

    # Fetch photo reference from Google Places API (with Redis caching)
    photo_reference = await google_maps_service.get_place_photo_reference(candidate.place_id)

    # Update database with the fetched photo reference
    if photo_reference:
        candidate.photo_reference = photo_reference
        db.commit()

    return {"photo_reference": photo_reference}
