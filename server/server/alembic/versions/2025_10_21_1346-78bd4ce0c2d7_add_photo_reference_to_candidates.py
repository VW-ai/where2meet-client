"""add_photo_reference_to_candidates

Revision ID: 78bd4ce0c2d7
Revises: cb2b543a7fe9
Create Date: 2025-10-21 13:46:50.901326

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '78bd4ce0c2d7'
down_revision = 'cb2b543a7fe9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add photo_reference column to candidates table
    # Check if column already exists before adding
    from sqlalchemy import inspect
    from alembic import context

    conn = context.get_bind()
    inspector = inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('candidates')]

    if 'photo_reference' not in columns:
        op.add_column('candidates', sa.Column('photo_reference', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('candidates', 'photo_reference')
