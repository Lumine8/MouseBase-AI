"""add api key rotation grace period fields

Revision ID: b4488b76bf68
Revises: e4f5a6b7c8d9
Create Date: 2026-09-05 19:41:09.621492

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b4488b76bf68"
down_revision: Union[str, Sequence[str], None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("previous_api_key_hash", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("key_rotated_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "key_rotated_at")
    op.drop_column("projects", "previous_api_key_hash")
