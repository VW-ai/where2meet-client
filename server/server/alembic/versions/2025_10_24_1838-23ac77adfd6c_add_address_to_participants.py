"""add_address_to_participants

Revision ID: 23ac77adfd6c
Revises: 500b32641abb
Create Date: 2025-10-24 18:38:44.351615

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '23ac77adfd6c'
down_revision = '500b32641abb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add address column to participants table (nullable, for human-readable location)
    op.add_column('participants', sa.Column('address', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove address column from participants table
    op.drop_column('participants', 'address')
