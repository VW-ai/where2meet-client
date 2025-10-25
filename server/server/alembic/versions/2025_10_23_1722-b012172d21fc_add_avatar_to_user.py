"""add_avatar_to_user

Revision ID: b012172d21fc
Revises: feed001
Create Date: 2025-10-23 17:22:26.842617

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b012172d21fc'
down_revision = 'feed001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add avatar column to users table
    op.add_column('users', sa.Column('avatar', sa.String(500), nullable=True))


def downgrade() -> None:
    # Remove avatar column from users table
    op.drop_column('users', 'avatar')
