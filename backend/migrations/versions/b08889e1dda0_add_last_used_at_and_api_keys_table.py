"""add last_used_at and api_keys table

Revision ID: b08889e1dda0
Revises: d3fee61ccd7b
Create Date: 2026-07-08 22:00:29.192897

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b08889e1dda0'
down_revision: Union[str, Sequence[str], None] = 'd3fee61ccd7b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('api_keys',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('project_id', sa.Uuid(), nullable=False),
        sa.Column('api_key_id', sa.String(length=16), nullable=False),
        sa.Column('api_key_hash', sa.String(length=255), nullable=False),
        sa.Column('encrypted_api_key', sa.String(length=512), nullable=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_api_keys_api_key_id'), 'api_keys', ['api_key_id'], unique=True)
    op.create_index(op.f('ix_api_keys_project_id'), 'api_keys', ['project_id'], unique=False)
    op.add_column('projects', sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('projects', 'last_used_at')
    op.drop_index(op.f('ix_api_keys_project_id'), table_name='api_keys')
    op.drop_index(op.f('ix_api_keys_api_key_id'), table_name='api_keys')
    op.drop_table('api_keys')
