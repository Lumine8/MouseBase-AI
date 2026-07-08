"""add status column to projects

Revision ID: 113c31deb105
Revises: 3ec9751287fe
Create Date: 2026-07-09 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "113c31deb105"
down_revision: Union[str, Sequence[str], None] = "3ec9751287fe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='projects' AND column_name='status'
            ) THEN
                ALTER TABLE projects ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='projects' AND column_name='status'
            ) THEN
                ALTER TABLE projects DROP COLUMN status;
            END IF;
        END $$;
    """)
