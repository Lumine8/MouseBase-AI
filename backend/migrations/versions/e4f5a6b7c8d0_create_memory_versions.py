"""create memory_versions table

Revision ID: e4f5a6b7c8d0
Revises: d3e4f5a6b7c8
Create Date: 2026-09-08

"""

from alembic import op
import sqlalchemy as sa

revision = "e4f5a6b7c8d0"
down_revision = "d3e4f5a6b7c8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "memory_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("memory_id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("external_id", sa.String(255), nullable=True),
        sa.Column(
            "importance", sa.Float(), nullable=False, server_default=sa.text("0.5")
        ),
        sa.Column("source", sa.String(20), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["memory_id"], ["memories.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_memory_versions_memory_id", "memory_versions", ["memory_id"])
    op.create_index("ix_memory_versions_version", "memory_versions", ["version"])


def downgrade() -> None:
    op.drop_index("ix_memory_versions_version")
    op.drop_index("ix_memory_versions_memory_id")
    op.drop_table("memory_versions")
