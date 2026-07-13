"""create activity_logs table

Revision ID: e4f5a6b7c8d9
Revises: c7d8e9f0a1b2
Create Date: 2026-07-14 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, Sequence[str], None] = "c7d8e9f0a1b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "activity_logs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("project_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("memory_id", sa.Uuid(), nullable=True),
        sa.Column("details", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["memory_id"], ["memories.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_activity_logs_project_id", "activity_logs", ["project_id"])
    op.create_index("ix_activity_logs_created_at", "activity_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_activity_logs_created_at")
    op.drop_index("ix_activity_logs_project_id")
    op.drop_table("activity_logs")
