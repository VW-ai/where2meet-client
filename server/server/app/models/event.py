"""Database models for events and related entities."""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, Integer, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Event(Base):
    """Event model representing a meeting coordination event."""

    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=True)
    visibility = Column(String(20), default="blur")  # blur, show
    allow_vote = Column(Boolean, default=True)
    final_decision = Column(Text, nullable=True)
    custom_center_lat = Column(Float, nullable=True)  # Custom center point (dragged by host)
    custom_center_lng = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # User relationship (optional - events can be created anonymously or by logged-in users)
    created_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    participants = relationship("Participant", back_populates="event", cascade="all, delete-orphan")
    candidates = relationship("Candidate", back_populates="event", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_events_created_at", "created_at"),
        Index("ix_events_deleted_at", "deleted_at"),
        Index("ix_events_expires_at", "expires_at"),
    )


class Participant(Base):
    """Participant model representing an anonymous event participant."""

    __tablename__ = "participants"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    fuzzy_lat = Column(Float, nullable=True)  # Blurred coordinate for privacy
    fuzzy_lng = Column(Float, nullable=True)  # Blurred coordinate for privacy
    name = Column(String(100), nullable=True)  # Optional display name
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="participants")
    votes = relationship("Vote", back_populates="participant", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_participants_event_id", "event_id"),
    )


class Candidate(Base):
    """Candidate model representing a potential meeting venue."""

    __tablename__ = "candidates"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    place_id = Column(String(255), nullable=False)  # Google Places ID
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rating = Column(Float, nullable=True)
    user_ratings_total = Column(Integer, default=0)
    distance_from_center = Column(Float, nullable=True)  # in km
    in_circle = Column(Boolean, default=True)
    opening_hours = Column(Text, nullable=True)  # JSON string
    added_by = Column(String(20), default="system")  # system or organizer
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="candidates")
    votes = relationship("Vote", back_populates="candidate", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_candidates_event_id", "event_id"),
        Index("ix_candidates_place_id", "place_id"),
    )


class Vote(Base):
    """Vote model representing a participant's vote for a candidate."""

    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(String, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False)
    candidate_id = Column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    voted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    participant = relationship("Participant", back_populates="votes")
    candidate = relationship("Candidate", back_populates="votes")

    # Indexes
    __table_args__ = (
        Index("ix_votes_event_id", "event_id"),
        Index("ix_votes_participant_candidate", "participant_id", "candidate_id", unique=True),
    )
