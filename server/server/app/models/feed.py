"""Database models for Event Feed feature."""

from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, Integer, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class FeedEvent(Base):
    """Event Feed model - separate from Find Meeting Point events."""

    __tablename__ = "feed_events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Host & Participants
    host_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    host_name = Column(String(100), nullable=False)
    host_contact_number = Column(String(20), nullable=True)  # Optional contact number for host
    participant_limit = Column(Integer, nullable=True)

    # Time & Location
    meeting_time = Column(DateTime(timezone=True), nullable=False)
    location_area = Column(String(255), nullable=False)
    location_coords_lat = Column(Float, nullable=True)
    location_coords_lng = Column(Float, nullable=True)

    # Location Type & Fixed Venue Details
    location_type = Column(String(20), nullable=False, default="collaborative")  # 'fixed' or 'collaborative'
    fixed_venue_id = Column(String(255), nullable=True)  # Google Place ID
    fixed_venue_name = Column(String(255), nullable=True)
    fixed_venue_address = Column(Text, nullable=True)
    fixed_venue_lat = Column(Float, nullable=True)
    fixed_venue_lng = Column(Float, nullable=True)

    # Categorization
    category = Column(String(100), nullable=True)

    # Visual
    background_image = Column(String(500), nullable=True)

    # Settings
    visibility = Column(String(20), default="public")  # 'public' or 'link_only'
    allow_vote = Column(Boolean, default=True)

    # Status
    status = Column(String(20), default="active")  # 'active', 'full', 'closed', 'past', 'cancelled', 'completed'

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    participants = relationship("FeedParticipant", back_populates="event", cascade="all, delete-orphan")
    venues = relationship("FeedVenue", back_populates="event", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_feed_events_created_at", "created_at"),
        Index("ix_feed_events_meeting_time", "meeting_time"),
        Index("ix_feed_events_status", "status"),
        Index("ix_feed_events_visibility", "visibility"),
        Index("ix_feed_events_host_id", "host_id"),
        Index("ix_feed_events_deleted_at", "deleted_at"),
    )


class FeedParticipant(Base):
    """Participant in an Event Feed event."""

    __tablename__ = "feed_participants"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("feed_events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    avatar = Column(String(500), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("FeedEvent", back_populates="participants")
    votes = relationship("FeedVote", back_populates="participant", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_feed_participants_event_id", "event_id"),
        Index("ix_feed_participants_user_id", "user_id"),
    )


class FeedVenue(Base):
    """Venue/candidate for collaborative location events."""

    __tablename__ = "feed_venues"

    id = Column(String, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("feed_events.id", ondelete="CASCADE"), nullable=False)
    place_id = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    vicinity = Column(Text, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rating = Column(Float, nullable=True)
    user_ratings_total = Column(Integer, default=0)
    distance_from_center = Column(Float, nullable=True)
    in_circle = Column(Boolean, default=True)
    open_now = Column(Boolean, nullable=True)
    types = Column(Text, nullable=True)  # JSON array as string
    photo_reference = Column(String(500), nullable=True)
    added_by = Column(String(20), default="system")  # 'system' or 'organizer'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("FeedEvent", back_populates="venues")
    votes = relationship("FeedVote", back_populates="venue", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index("ix_feed_venues_event_id", "event_id"),
        Index("ix_feed_venues_place_id", "place_id"),
    )


class FeedVote(Base):
    """Vote for a venue in an Event Feed event."""

    __tablename__ = "feed_votes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, ForeignKey("feed_events.id", ondelete="CASCADE"), nullable=False)
    participant_id = Column(String, ForeignKey("feed_participants.id", ondelete="CASCADE"), nullable=False)
    venue_id = Column(String, ForeignKey("feed_venues.id", ondelete="CASCADE"), nullable=False)
    voted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    participant = relationship("FeedParticipant", back_populates="votes")
    venue = relationship("FeedVenue", back_populates="votes")

    # Indexes
    __table_args__ = (
        Index("ix_feed_votes_event_id", "event_id"),
        Index("ix_feed_votes_participant_venue", "participant_id", "venue_id", unique=True),
    )
