"""add_bio_to_users

Revision ID: bio001
Revises: contact001
Create Date: 2025-10-23 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bio001'
down_revision = 'contact001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add bio column to users table
    op.add_column('users', sa.Column('bio', sa.String(500), nullable=True))


def downgrade() -> None:
    # Remove bio column from users table
    op.drop_column('users', 'bio')
