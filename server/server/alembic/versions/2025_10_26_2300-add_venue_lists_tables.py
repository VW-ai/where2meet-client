"""add venue lists tables

Revision ID: lists001
Revises: 28746fa2f5e9
Create Date: 2025-10-26 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'lists001'
down_revision = '28746fa2f5e9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create venue_lists table
    op.create_table(
        'venue_lists',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_venue_lists_id', 'venue_lists', ['id'], unique=False)
    op.create_index('ix_venue_lists_user_id', 'venue_lists', ['user_id'], unique=False)
    op.create_index('ix_venue_lists_category', 'venue_lists', ['category'], unique=False)
    op.create_index('ix_venue_lists_created_at', 'venue_lists', ['created_at'], unique=False)

    # Create list_items table
    op.create_table(
        'list_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('list_id', sa.String(), nullable=False),
        sa.Column('place_id', sa.String(length=255), nullable=False),
        sa.Column('venue_name', sa.String(length=255), nullable=False),
        sa.Column('venue_address', sa.Text(), nullable=True),
        sa.Column('venue_lat', sa.Numeric(precision=10, scale=7), nullable=False),
        sa.Column('venue_lng', sa.Numeric(precision=10, scale=7), nullable=False),
        sa.Column('rating', sa.Numeric(precision=2, scale=1), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['list_id'], ['venue_lists.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_list_items_id', 'list_items', ['id'], unique=False)
    op.create_index('ix_list_items_list_id', 'list_items', ['list_id'], unique=False)
    op.create_index('ix_list_items_order', 'list_items', ['list_id', 'order_index'], unique=False)

    # Create list_likes table
    op.create_table(
        'list_likes',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('list_id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('liked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['list_id'], ['venue_lists.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('list_id', 'user_id', name='uq_list_user_like')
    )
    op.create_index('ix_list_likes_id', 'list_likes', ['id'], unique=False)
    op.create_index('ix_list_likes_list_id', 'list_likes', ['list_id'], unique=False)
    op.create_index('ix_list_likes_user_id', 'list_likes', ['user_id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index('ix_list_likes_user_id', table_name='list_likes')
    op.drop_index('ix_list_likes_list_id', table_name='list_likes')
    op.drop_index('ix_list_likes_id', table_name='list_likes')
    op.drop_table('list_likes')

    op.drop_index('ix_list_items_order', table_name='list_items')
    op.drop_index('ix_list_items_list_id', table_name='list_items')
    op.drop_index('ix_list_items_id', table_name='list_items')
    op.drop_table('list_items')

    op.drop_index('ix_venue_lists_created_at', table_name='venue_lists')
    op.drop_index('ix_venue_lists_category', table_name='venue_lists')
    op.drop_index('ix_venue_lists_user_id', table_name='venue_lists')
    op.drop_index('ix_venue_lists_id', table_name='venue_lists')
    op.drop_table('venue_lists')
