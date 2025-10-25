"""User model for authentication."""

from sqlalchemy import Column, String, DateTime, Boolean, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class User(Base):
    """User model for authentication and event ownership."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # user_xxx
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=True)
    bio = Column(String(500), nullable=True)  # User bio/description
    avatar = Column(String(500), nullable=True)  # Avatar URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)

    # Relationships
    # Events will reference this user as the creator
    # We'll add this relationship after updating the Event model

    # Indexes
    __table_args__ = (
        Index("ix_users_email", "email"),
        Index("ix_users_created_at", "created_at"),
    )
