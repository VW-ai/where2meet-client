"""add event feed tables

Revision ID: feed001
Revises: 78bd4ce0c2d7
Create Date: 2025-10-22 22:08:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'feed001'
down_revision = '78bd4ce0c2d7'
branch_labels = None
depends_on = None


def upgrade():
    # Create feed_events table
    op.create_table(
        'feed_events',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('host_id', sa.String(), nullable=True),
        sa.Column('host_name', sa.String(length=100), nullable=False),
        sa.Column('participant_limit', sa.Integer(), nullable=True),
        sa.Column('meeting_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('location_area', sa.String(length=255), nullable=False),
        sa.Column('location_coords_lat', sa.Float(), nullable=True),
        sa.Column('location_coords_lng', sa.Float(), nullable=True),
        sa.Column('location_type', sa.String(length=20), nullable=False, server_default='collaborative'),
        sa.Column('fixed_venue_id', sa.String(length=255), nullable=True),
        sa.Column('fixed_venue_name', sa.String(length=255), nullable=True),
        sa.Column('fixed_venue_address', sa.Text(), nullable=True),
        sa.Column('fixed_venue_lat', sa.Float(), nullable=True),
        sa.Column('fixed_venue_lng', sa.Float(), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('background_image', sa.String(length=500), nullable=True),
        sa.Column('visibility', sa.String(length=20), nullable=False, server_default='public'),
        sa.Column('allow_vote', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), onupdate=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['host_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feed_events_created_at', 'feed_events', ['created_at'])
    op.create_index('ix_feed_events_meeting_time', 'feed_events', ['meeting_time'])
    op.create_index('ix_feed_events_status', 'feed_events', ['status'])
    op.create_index('ix_feed_events_visibility', 'feed_events', ['visibility'])
    op.create_index('ix_feed_events_host_id', 'feed_events', ['host_id'])
    op.create_index('ix_feed_events_deleted_at', 'feed_events', ['deleted_at'])
    op.create_index('ix_feed_events_id', 'feed_events', ['id'])

    # Create feed_participants table
    op.create_table(
        'feed_participants',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('avatar', sa.String(length=500), nullable=True),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['feed_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feed_participants_event_id', 'feed_participants', ['event_id'])
    op.create_index('ix_feed_participants_user_id', 'feed_participants', ['user_id'])
    op.create_index('ix_feed_participants_id', 'feed_participants', ['id'])

    # Create feed_venues table
    op.create_table(
        'feed_venues',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('place_id', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('vicinity', sa.Text(), nullable=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=True),
        sa.Column('user_ratings_total', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('distance_from_center', sa.Float(), nullable=True),
        sa.Column('in_circle', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('open_now', sa.Boolean(), nullable=True),
        sa.Column('types', sa.Text(), nullable=True),
        sa.Column('photo_reference', sa.String(length=500), nullable=True),
        sa.Column('added_by', sa.String(length=20), nullable=False, server_default='system'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['feed_events.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feed_venues_event_id', 'feed_venues', ['event_id'])
    op.create_index('ix_feed_venues_place_id', 'feed_venues', ['place_id'])
    op.create_index('ix_feed_venues_id', 'feed_venues', ['id'])

    # Create feed_votes table
    op.create_table(
        'feed_votes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('event_id', sa.String(), nullable=False),
        sa.Column('participant_id', sa.String(), nullable=False),
        sa.Column('venue_id', sa.String(), nullable=False),
        sa.Column('voted_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['feed_events.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['participant_id'], ['feed_participants.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['venue_id'], ['feed_venues.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feed_votes_event_id', 'feed_votes', ['event_id'])
    op.create_index('ix_feed_votes_participant_venue', 'feed_votes', ['participant_id', 'venue_id'], unique=True)


def downgrade():
    # Drop tables in reverse order (respect foreign keys)
    op.drop_index('ix_feed_votes_participant_venue', table_name='feed_votes')
    op.drop_index('ix_feed_votes_event_id', table_name='feed_votes')
    op.drop_table('feed_votes')

    op.drop_index('ix_feed_venues_id', table_name='feed_venues')
    op.drop_index('ix_feed_venues_place_id', table_name='feed_venues')
    op.drop_index('ix_feed_venues_event_id', table_name='feed_venues')
    op.drop_table('feed_venues')

    op.drop_index('ix_feed_participants_id', table_name='feed_participants')
    op.drop_index('ix_feed_participants_user_id', table_name='feed_participants')
    op.drop_index('ix_feed_participants_event_id', table_name='feed_participants')
    op.drop_table('feed_participants')

    op.drop_index('ix_feed_events_id', table_name='feed_events')
    op.drop_index('ix_feed_events_deleted_at', table_name='feed_events')
    op.drop_index('ix_feed_events_host_id', table_name='feed_events')
    op.drop_index('ix_feed_events_visibility', table_name='feed_events')
    op.drop_index('ix_feed_events_status', table_name='feed_events')
    op.drop_index('ix_feed_events_meeting_time', table_name='feed_events')
    op.drop_index('ix_feed_events_created_at', table_name='feed_events')
    op.drop_table('feed_events')
