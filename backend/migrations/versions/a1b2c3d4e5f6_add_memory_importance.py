"""add importance to memories

Revision ID: a1b2c3d4e5f6
Revises: 3f8a1b2c4d5e
Create Date: 2026-09-08

"""
from alembic import op
import sqlalchemy as sa

revision = "a1b2c3d4e5f6"
down_revision = "3f8a1b2c4d5e"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "memories",
        sa.Column("importance", sa.Float(), nullable=False, server_default="0.5"),
    )
    op.create_index("ix_memories_importance", "memories", ["importance"])


def downgrade() -> None:
    op.drop_index("ix_memories_importance", table_name="memories")
    op.drop_column("memories", "importance")
