"""add provenance fields to memories

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
Create Date: 2026-09-08

"""

from alembic import op
import sqlalchemy as sa

revision = "d3e4f5a6b7c8"
down_revision = "c2d3e4f5a6b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "memories",
        sa.Column("source", sa.String(20), nullable=True),
    )
    op.add_column(
        "memories",
        sa.Column("confidence", sa.Float(), nullable=True),
    )
    op.add_column(
        "memories",
        sa.Column("supersedes_id", sa.Uuid(), nullable=True),
    )
    op.create_index("ix_memories_supersedes_id", "memories", ["supersedes_id"])


def downgrade() -> None:
    op.drop_index("ix_memories_supersedes_id")
    op.drop_column("memories", "supersedes_id")
    op.drop_column("memories", "confidence")
    op.drop_column("memories", "source")
