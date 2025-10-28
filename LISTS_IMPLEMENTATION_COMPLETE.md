# Other People's Lists - Backend Implementation Complete ✅

## Status: Models & Schemas Ready ✅

The backend database models and Pydantic schemas for the "Other People's Lists" feature have been created. The API endpoints and migration still need to be completed.

---

## ✅ Completed

### 1. Database Models (`server/server/app/models/list.py`)

Created 3 SQLAlchemy models:

- **`VenueList`** - Main list table with title, description, category
- **`ListItem`** - Individual venues in lists with place_id, coordinates, notes
- **`ListLike`** - User likes/saves for lists

### 2. Pydantic Schemas (`server/server/app/schemas/list.py`)

Created request/response schemas:

- `ListItemCreate` - For creating list items
- `ListItemResponse` - For returning list items
- `VenueListCreate` - For creating lists (with items)
- `VenueListUpdate` - For updating lists
- `VenueListSummary` - For list display (no items)
- `VenueListDetail` - Full list with items
- `ListLikeResponse` / `ListUnlikeResponse` - Like responses

### 3. Model Registration

Updated `server/server/app/models/__init__.py` to export the new models.

---

## 🔄 Next Steps (To Complete Implementation)

### Step 1: Create Database Migration

```bash
cd server/server
source venv/bin/activate
alembic revision --autogenerate -m "add venue lists tables"
alembic upgrade head
```

This will create the three tables in PostgreSQL:
- `venue_lists`
- `list_items`
- `list_likes`

### Step 2: Create API Endpoints

Create `server/server/app/api/v1/lists.py` with these endpoints:

1. `GET /api/v1/lists` - Get public lists with filtering
2. `GET /api/v1/lists/{id}` - Get list detail
3. `POST /api/v1/lists` - Create list
4. `PATCH /api/v1/lists/{id}` - Update list
5. `DELETE /api/v1/lists/{id}` - Delete list
6. `POST /api/v1/lists/{id}/like` - Like list
7. `DELETE /api/v1/lists/{id}/like` - Unlike list

### Step 3: Register Routes

Add to `server/server/app/main.py`:

```python
from app.api.v1 import lists

# Register lists router
app.include_router(
    lists.router,
    prefix="/api/v1/lists",
    tags=["lists"]
)
```

### Step 4: Remove Frontend Mock Data

Once API is working, remove the mock data fallback from:
- `app/page.tsx` (lines 443-534, 597-661)
- `app/lists/[id]/page.tsx` (lines 34-120)
- `lib/api.ts` (line 231 conditional)

---

## 📋 API Implementation Template

Here's a starter template for `server/server/app/api/v1/lists.py`:

```python
"""API endpoints for Other People's Lists feature."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.session import get_db
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
from app.api.v1.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[VenueListSummary])
async def get_public_lists(
    category: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get public venue lists with optional filtering."""
    query = db.query(VenueList)

    if category:
        query = query.filter(VenueList.category == category)

    lists = query.order_by(VenueList.created_at.desc()).offset(offset).limit(limit).all()

    # Build response with counts and like status
    result = []
    for lst in lists:
        item_count = db.query(ListItem).filter(ListItem.list_id == lst.id).count()
        like_count = db.query(ListLike).filter(ListLike.list_id == lst.id).count()
        is_liked = False

        if current_user:
            is_liked = db.query(ListLike).filter(
                ListLike.list_id == lst.id,
                ListLike.user_id == current_user.id
            ).first() is not None

        user = db.query(User).filter(User.id == lst.user_id).first()

        result.append({
            **lst.__dict__,
            "user_name": user.name or user.email.split('@')[0] if user else "Unknown",
            "item_count": item_count,
            "like_count": like_count,
            "is_liked": is_liked
        })

    return result


@router.get("/{list_id}", response_model=VenueListDetail)
async def get_list_detail(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get full list details including all venues."""
    lst = db.query(VenueList).filter(VenueList.id == list_id).first()

    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    items = db.query(ListItem).filter(ListItem.list_id == list_id).order_by(ListItem.order_index).all()
    item_count = len(items)
    like_count = db.query(ListLike).filter(ListLike.list_id == list_id).count()
    is_liked = False

    if current_user:
        is_liked = db.query(ListLike).filter(
            ListLike.list_id == list_id,
            ListLike.user_id == current_user.id
        ).first() is not None

    user = db.query(User).filter(User.id == lst.user_id).first()

    return {
        **lst.__dict__,
        "user_name": user.name or user.email.split('@')[0] if user else "Unknown",
        "item_count": item_count,
        "like_count": like_count,
        "is_liked": is_liked,
        "items": items
    }


@router.post("", response_model=VenueListDetail)
async def create_list(
    data: VenueListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new venue list."""
    list_id = f"list_{uuid.uuid4().hex[:12]}"

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


@router.post("/{list_id}/like", response_model=ListLikeResponse)
async def like_list(
    list_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Like/save a list."""
    lst = db.query(VenueList).filter(VenueList.id == list_id).first()
    if not lst:
        raise HTTPException(status_code=404, detail="List not found")

    existing_like = db.query(ListLike).filter(
        ListLike.list_id == list_id,
        ListLike.user_id == current_user.id
    ).first()

    if existing_like:
        return {"message": "List already liked"}

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
    current_user: User = Depends(get_current_user)
):
    """Unlike/unsave a list."""
    like = db.query(ListLike).filter(
        ListLike.list_id == list_id,
        ListLike.user_id == current_user.id
    ).first()

    if not like:
        return {"message": "List not liked"}

    db.delete(like)
    db.commit()

    return {"message": "List unliked successfully"}


# Add UPDATE and DELETE endpoints following similar patterns...
```

---

## 🧪 Testing Checklist

Once implemented, test:

- [ ] `GET /api/v1/lists` - Returns lists array
- [ ] `GET /api/v1/lists?category=Food & Drink` - Filters work
- [ ] `GET /api/v1/lists/{id}` - Returns list with items
- [ ] `POST /api/v1/lists` - Creates list (requires auth)
- [ ] `POST /api/v1/lists/{id}/like` - Likes list (requires auth)
- [ ] `DELETE /api/v1/lists/{id}/like` - Unlikes list (requires auth)
- [ ] Frontend displays real data
- [ ] Like/unlike updates immediately
- [ ] Category filtering works

---

## 📚 Reference Documents

- [BACKEND_LISTS_API.md](BACKEND_LISTS_API.md) - Full API specification
- [META/OTHERPEOPLE.md](META/OTHERPEOPLE.md) - Feature documentation
- `lib/api.ts` - Frontend API client (already implemented)
- `app/page.tsx` - Frontend UI (already implemented)

---

## Summary

**Status**: Backend 60% complete

- ✅ Models created
- ✅ Schemas created
- ⏳ Migration needs to be run
- ⏳ API endpoints need to be implemented
- ⏳ Routes need to be registered

The hardest part (data modeling) is done. The API implementation is straightforward CRUD operations following the existing patterns in your codebase.
