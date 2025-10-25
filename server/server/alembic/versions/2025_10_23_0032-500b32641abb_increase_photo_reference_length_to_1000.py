"""increase photo_reference length to 1000

Revision ID: 500b32641abb
Revises: 5e5913383ca6
Create Date: 2025-10-23 00:32:49.925315

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '500b32641abb'
down_revision = '5e5913383ca6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Increase photo_reference column length from 500 to 1000
    op.alter_column('candidates', 'photo_reference',
                   type_=sa.String(1000),
                   existing_type=sa.String(500),
                   existing_nullable=True)


def downgrade() -> None:
    # Decrease photo_reference column length back to 500
    op.alter_column('candidates', 'photo_reference',
                   type_=sa.String(500),
                   existing_type=sa.String(1000),
                   existing_nullable=True)
