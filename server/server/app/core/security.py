"""Security utilities for token generation and validation."""

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from itsdangerous import URLSafeTimedSerializer
from app.core.config import settings


def create_event_token(event_id: str) -> str:
    """
    Create a signed token for event join links.

    Args:
        event_id: The event ID to encode

    Returns:
        Signed token string
    """
    expire = datetime.utcnow() + timedelta(hours=settings.EVENT_LINK_EXPIRY_HOURS)
    to_encode = {
        "event_id": event_id,
        "exp": expire,
        "type": "join_link"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_event_token(token: str) -> Optional[str]:
    """
    Verify and decode an event join token.

    Args:
        token: The JWT token to verify

    Returns:
        Event ID if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        event_id: str = payload.get("event_id")
        token_type: str = payload.get("type")

        if event_id is None or token_type != "join_link":
            return None

        return event_id
    except JWTError:
        return None


def generate_participant_id() -> str:
    """
    Generate a unique anonymous participant ID.

    Returns:
        A unique participant identifier
    """
    from uuid import uuid4
    return f"p_{uuid4().hex[:12]}"


def create_event_id() -> str:
    """
    Generate a unique event ID.

    Returns:
        A unique event identifier
    """
    from uuid import uuid4
    return f"evt_{uuid4().hex[:16]}"
