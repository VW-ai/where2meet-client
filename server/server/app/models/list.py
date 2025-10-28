"""Database models for Other People's Lists feature."""

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Numeric, Index, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class VenueList(Base):
    """Venue List model - user-curated collections of venues."""

    __tablename__ = "venue_lists"

    id = Column(String, primary_key=True, index=True)  # list_xxx
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    items = relationship("ListItem", back_populates="venue_list", cascade="all, delete-orphan", order_by="ListItem.order_index")
    likes = relationship("ListLike", back_populates="venue_list", cascade="all, delete-orphan")
    user = relationship("User", backref="venue_lists")

    # Indexes
    __table_args__ = (
        Index("ix_venue_lists_user_id", "user_id"),
        Index("ix_venue_lists_category", "category"),
        Index("ix_venue_lists_created_at", "created_at"),
    )


class ListItem(Base):
    """Individual venue within a list."""

    __tablename__ = "list_items"

    id = Column(String, primary_key=True, index=True)  # item_xxx
    list_id = Column(String, ForeignKey("venue_lists.id", ondelete="CASCADE"), nullable=False, index=True)

    # Venue details from Google Places
    place_id = Column(String(255), nullable=False)
    venue_name = Column(String(255), nullable=False)
    venue_address = Column(Text, nullable=True)
    venue_lat = Column(Numeric(10, 7), nullable=False)
    venue_lng = Column(Numeric(10, 7), nullable=False)
    rating = Column(Numeric(2, 1), nullable=True)

    # User-added content
    notes = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False)

    added_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    venue_list = relationship("VenueList", back_populates="items")

    # Indexes
    __table_args__ = (
        Index("ix_list_items_list_id", "list_id"),
        Index("ix_list_items_order", "list_id", "order_index"),
    )


class ListLike(Base):
    """User likes/saves for venue lists."""

    __tablename__ = "list_likes"

    id = Column(String, primary_key=True, index=True)  # like_xxx
    list_id = Column(String, ForeignKey("venue_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    liked_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    venue_list = relationship("VenueList", back_populates="likes")
    user = relationship("User", backref="list_likes")

    # Constraints
    __table_args__ = (
        UniqueConstraint("list_id", "user_id", name="uq_list_user_like"),
        Index("ix_list_likes_list_id", "list_id"),
        Index("ix_list_likes_user_id", "user_id"),
    )
