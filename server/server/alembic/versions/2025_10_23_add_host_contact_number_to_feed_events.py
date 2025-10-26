"""add_host_contact_number_to_feed_events

Revision ID: contact001
Revises: b012172d21fc
Create Date: 2025-10-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'contact001'
down_revision = 'b012172d21fc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add host_contact_number column to feed_events table
    from sqlalchemy import inspect
    from alembic import context

    conn = context.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('feed_events')]

    if 'host_contact_number' not in columns:
        op.add_column('feed_events', sa.Column('host_contact_number', sa.String(20), nullable=True))


def downgrade() -> None:
    # Remove host_contact_number column from feed_events table
    op.drop_column('feed_events', 'host_contact_number')
