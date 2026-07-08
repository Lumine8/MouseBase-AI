"""add missing user columns

Revision ID: 3ec9751287fe
Revises: b08889e1dda0
Create Date: 2026-07-09 00:04:56.852905

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '3ec9751287fe'
down_revision: Union[str, Sequence[str], None] = 'b08889e1dda0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='full_name'
            ) THEN
                ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='avatar_url'
            ) THEN
                ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512);
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='email_verified'
            ) THEN
                ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
            END IF;
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='last_login'
            ) THEN
                ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='last_login'
            ) THEN
                ALTER TABLE users DROP COLUMN last_login;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='email_verified'
            ) THEN
                ALTER TABLE users DROP COLUMN email_verified;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='avatar_url'
            ) THEN
                ALTER TABLE users DROP COLUMN avatar_url;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='users' AND column_name='full_name'
            ) THEN
                ALTER TABLE users DROP COLUMN full_name;
            END IF;
        END $$;
    """)
