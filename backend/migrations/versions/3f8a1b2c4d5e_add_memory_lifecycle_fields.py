"""add memory lifecycle fields (status, expires_at)

Revision ID: 3f8a1b2c4d5e
Revises: 2d6f74cc133b
Create Date: 2026-09-07 18:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "3f8a1b2c4d5e"
down_revision: Union[str, Sequence[str], None] = "2d6f74cc133b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add status column with default 'active'
    op.add_column(
        "memories",
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
    )

    # Add expires_at column
    op.add_column(
        "memories",
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Create indexes
    op.create_index("ix_memories_status", "memories", ["status"])
    op.create_index("ix_memories_expires_at", "memories", ["expires_at"])

    # Backfill existing rows
    op.execute("UPDATE memories SET status = 'active' WHERE status IS NULL")


def downgrade() -> None:
    op.drop_index("ix_memories_expires_at", table_name="memories")
    op.drop_index("ix_memories_status", table_name="memories")
    op.drop_column("memories", "expires_at")
    op.drop_column("memories", "status")
