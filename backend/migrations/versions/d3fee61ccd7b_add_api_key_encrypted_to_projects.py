"""add api_key_encrypted to projects

Revision ID: d3fee61ccd7b
Revises: 81b73c131bd8
Create Date: 2026-07-08 21:01:29.772184

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3fee61ccd7b"
down_revision: Union[str, Sequence[str], None] = "44cb37ca26cf"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("api_key_encrypted", sa.String(length=512), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "api_key_encrypted")
