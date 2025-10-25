"""API endpoints for user authentication."""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional

from app.db.base import get_db
from app.models.user import User
from app.models.event import Event
from app.schemas.user import UserSignup, UserLogin, UserResponse, TokenResponse, UserUpdate
from app.core.auth import hash_password, verify_password, create_access_token, verify_access_token, create_user_id

router = APIRouter()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user from Authorization header.
    Returns None if no valid token provided (allows anonymous access).
    """
    if not authorization:
        return None

    # Extract token from "Bearer <token>"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]
    user_id = verify_access_token(token)
    if not user_id:
        return None

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    return user


async def require_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
) -> User:
    """
    Require authenticated user. Raises 401 if not authenticated.
    """
    user = await get_current_user(authorization, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserSignup,
    db: Session = Depends(get_db)
):
    """
    Create a new user account.
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user_id = create_user_id()
    user = User(
        id=user_id,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        name=user_data.name,
        last_login=datetime.utcnow()
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # Create access token
    access_token = create_access_token(user_id)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()

    # Create access token
    access_token = create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(require_current_user)
):
    """
    Get current user's profile.
    """
    return UserResponse.from_orm(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    """
    if update_data.name is not None:
        current_user.name = update_data.name

    if update_data.bio is not None:
        current_user.bio = update_data.bio

    if update_data.avatar is not None:
        current_user.avatar = update_data.avatar

    if update_data.password is not None:
        current_user.hashed_password = hash_password(update_data.password)

    db.commit()
    db.refresh(current_user)

    return UserResponse.from_orm(current_user)


@router.get("/me/events", response_model=list)
async def get_user_events(
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all events created by the current user.
    """
    from app.schemas.event import EventResponse

    events = db.query(Event).filter(
        Event.created_by == current_user.id,
        Event.deleted_at.is_(None)
    ).order_by(Event.created_at.desc()).all()

    return [EventResponse.from_orm(event) for event in events]
