"""add photo_reference to candidates

Revision ID: 5e5913383ca6
Revises: cb2b543a7fe9
Create Date: 2025-10-23 00:06:50.977671

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5e5913383ca6'
down_revision = 'cb2b543a7fe9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add photo_reference column to candidates table
    op.add_column('candidates', sa.Column('photo_reference', sa.String(500), nullable=True))


def downgrade() -> None:
    # Remove photo_reference column from candidates table
    op.drop_column('candidates', 'photo_reference')
