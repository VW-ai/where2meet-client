"""API endpoints for Other People's Lists feature."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid

from app.db.base import get_db
from app.models.list import VenueList, ListItem, ListLike
from app.models.user import User
from app.schemas.list import (
    VenueListCreate,
    VenueListUpdate,
    VenueListSummary,
    VenueListDetail,
    ListLikeResponse,
    ListUnlikeResponse
)
from app.api.v1.auth import get_current_user, require_current_user

router = APIRouter()


def build_list_summary(
    venue_list: VenueList,
    db: Session,
    current_user: Optional[User] = None
) -> dict:
    """Build list summary response with computed fields."""
    # Get item count
    item_count = db.query(ListItem).filter(ListItem.list_id == venue_list.id).count()

    # Get like count
    like_count = db.query(ListLike).filter(ListLike.list_id == venue_list.id).count()

    # Check if current user has liked
    is_liked = False
    if current_user:
        is_liked = db.query(ListLike).filter(
            ListLike.list_id == venue_list.id,
            ListLike.user_id == current_user.id
        ).first() is not None

    # Get user info
    user = db.query(User).filter(User.id == venue_list.user_id).first()
    user_name = user.name if user and user.name else (user.email.split('@')[0] if user else "Unknown")

    return {
        "id": venue_list.id,
        "title": venue_list.title,
        "description": venue_list.description,
        "category": venue_list.category,
        "user_id": venue_list.user_id,
        "user_name": user_name,
        "item_count": item_count,
        "like_count": like_count,
        "is_liked": is_liked,
        "created_at": venue_list.created_at,
        "updated_at": venue_list.updated_at
    }


@router.get("", response_model=List[VenueListSummary])
async def get_public_lists(
    category: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Get public venue lists with optional filtering.

    - **category**: Filter by category (e.g., "Food & Drink", "Sports", "Entertainment")
    - **limit**: Maximum number of lists to return (default: 20, max: 100)
    - **offset**: Number of lists to skip for pagination (default: 0)
    """
    query = db.query(VenueList)

    # Apply category filter
    if category:
        query = query.filter(VenueList.category == category)

    # Get lists ordered by most recent
    lists = query.order_by(VenueList.created_at.desc()).offset(offset).limit(limit).all()

    # Build response with computed fields
    result = []
    for lst in lists:
        result.append(build_list_summary(lst, db, current_user))

    return result


@router.get("/{list_id}", response_model=VenueListDetail)
async def get_list_detail(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Get full list details including all venues.

    - **list_id**: UUID of the list
    """
    # Get list
    venue_list = db.query(VenueList).filter(VenueList.id == list_id).first()

    if not venue_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )

    # Get items ordered by order_index
    items = db.query(ListItem).filter(
        ListItem.list_id == list_id
    ).order_by(ListItem.order_index).all()

    # Build summary
    summary = build_list_summary(venue_list, db, current_user)

    # Add items
    return {
        **summary,
        "items": items
    }


@router.post("", response_model=VenueListDetail, status_code=status.HTTP_201_CREATED)
async def create_list(
    data: VenueListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Create a new venue list.

    Requires authentication.

    - **title**: List title (1-100 characters)
    - **description**: Optional description (max 500 characters)
    - **category**: List category
    - **items**: List of venues (minimum 1 required)
    """
    # Generate list ID
    list_id = f"list_{uuid.uuid4().hex[:12]}"

    # Create list
    new_list = VenueList(
        id=list_id,
        title=data.title,
        description=data.description,
        category=data.category,
        user_id=current_user.id
    )

    db.add(new_list)
    db.flush()

    # Add items
    for idx, item_data in enumerate(data.items):
        item = ListItem(
            id=f"item_{uuid.uuid4().hex[:12]}",
            list_id=list_id,
            place_id=item_data.place_id,
            venue_name=item_data.venue_name,
            venue_address=item_data.venue_address,
            venue_lat=item_data.venue_lat,
            venue_lng=item_data.venue_lng,
            rating=item_data.rating,
            notes=item_data.notes,
            order_index=idx
        )
        db.add(item)

    db.commit()
    db.refresh(new_list)

    # Return full detail
    return await get_list_detail(list_id, db, current_user)


@router.patch("/{list_id}", response_model=VenueListDetail)
async def update_list(
    list_id: str,
    data: VenueListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Update an existing venue list.

    Requires authentication and list ownership.

    - **list_id**: UUID of the list
    - **title**: Optional new title
    - **description**: Optional new description
    - **category**: Optional new category
    - **items**: Optional new list of venues (replaces existing items)
    """
    # Get list
    venue_list = db.query(VenueList).filter(VenueList.id == list_id).first()

    if not venue_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )

    # Check ownership
    if venue_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to edit this list"
        )

    # Update basic fields
    if data.title is not None:
        venue_list.title = data.title
    if data.description is not None:
        venue_list.description = data.description
    if data.category is not None:
        venue_list.category = data.category

    # Update items if provided
    if data.items is not None:
        # Delete existing items
        db.query(ListItem).filter(ListItem.list_id == list_id).delete()

        # Add new items
        for idx, item_data in enumerate(data.items):
            item = ListItem(
                id=f"item_{uuid.uuid4().hex[:12]}",
                list_id=list_id,
                place_id=item_data.place_id,
                venue_name=item_data.venue_name,
                venue_address=item_data.venue_address,
                venue_lat=item_data.venue_lat,
                venue_lng=item_data.venue_lng,
                rating=item_data.rating,
                notes=item_data.notes,
                order_index=idx
            )
            db.add(item)

    # Update timestamp
    venue_list.updated_at = func.now()

    db.commit()
    db.refresh(venue_list)

    # Return updated list
    return await get_list_detail(list_id, db, current_user)


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Delete a venue list.

    Requires authentication and list ownership.

    - **list_id**: UUID of the list
    """
    # Get list
    venue_list = db.query(VenueList).filter(VenueList.id == list_id).first()

    if not venue_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )

    # Check ownership
    if venue_list.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this list"
        )

    # Delete list (cascade will delete items and likes)
    db.delete(venue_list)
    db.commit()

    return None


@router.post("/{list_id}/like", response_model=ListLikeResponse)
async def like_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Like/save a list.

    Requires authentication.

    - **list_id**: UUID of the list
    """
    # Check if list exists
    venue_list = db.query(VenueList).filter(VenueList.id == list_id).first()
    if not venue_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found"
        )

    # Check if already liked
    existing_like = db.query(ListLike).filter(
        ListLike.list_id == list_id,
        ListLike.user_id == current_user.id
    ).first()

    if existing_like:
        # Already liked, return success
        return {"message": "List already liked"}

    # Create like
    like = ListLike(
        id=f"like_{uuid.uuid4().hex[:12]}",
        list_id=list_id,
        user_id=current_user.id
    )

    db.add(like)
    db.commit()

    return {"message": "List liked successfully"}


@router.delete("/{list_id}/like", response_model=ListUnlikeResponse)
async def unlike_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """
    Unlike/unsave a list.

    Requires authentication.

    - **list_id**: UUID of the list
    """
    # Find existing like
    like = db.query(ListLike).filter(
        ListLike.list_id == list_id,
        ListLike.user_id == current_user.id
    ).first()

    if not like:
        # Not liked, return success anyway
        return {"message": "List not liked"}

    # Delete like
    db.delete(like)
    db.commit()

    return {"message": "List unliked successfully"}
