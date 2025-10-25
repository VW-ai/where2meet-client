"""merge bio and address migrations

Revision ID: 28746fa2f5e9
Revises: bio001, 23ac77adfd6c
Create Date: 2025-10-25 15:56:19.349730

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '28746fa2f5e9'
down_revision = ('bio001', '23ac77adfd6c')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
