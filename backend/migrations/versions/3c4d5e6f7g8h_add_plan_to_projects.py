"""add plan column to projects

Revision ID: 3c4d5e6f7g8h
Revises: 2a3b4c5d6e7f
Create Date: 2026-07-08 13:50:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "3c4d5e6f7g8h"
down_revision: Union[str, None] = "2a3b4c5d6e7f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("plan", sa.String(20), nullable=False, server_default="free"))


def downgrade() -> None:
    op.drop_column("projects", "plan")
