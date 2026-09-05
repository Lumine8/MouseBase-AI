"""add full-text search vector to memories

Revision ID: 2d6f74cc133b
Revises: b4488b76bf68
Create Date: 2026-09-05 20:03:05.396076

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "2d6f74cc133b"
down_revision: Union[str, Sequence[str], None] = "b4488b76bf68"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add tsvector column
    op.add_column(
        "memories",
        sa.Column("search_vector", sa.dialects.postgresql.TSVECTOR(), nullable=True),
    )

    # Create GIN index for fast full-text search
    op.create_index(
        "ix_memories_search_vector",
        "memories",
        ["search_vector"],
        postgresql_using="gin",
    )

    # Populate search_vector for existing rows
    op.execute("""
        UPDATE memories SET search_vector = to_tsvector('english', coalesce(content, ''));
    """)

    # Create trigger to auto-update search_vector on INSERT/UPDATE
    op.execute("""
        CREATE OR REPLACE FUNCTION memories_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER memories_search_vector_trigger
        BEFORE INSERT OR UPDATE OF content ON memories
        FOR EACH ROW
        EXECUTE FUNCTION memories_search_vector_update();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS memories_search_vector_trigger ON memories;")
    op.execute("DROP FUNCTION IF EXISTS memories_search_vector_update();")
    op.drop_index("ix_memories_search_vector", table_name="memories")
    op.drop_column("memories", "search_vector")
