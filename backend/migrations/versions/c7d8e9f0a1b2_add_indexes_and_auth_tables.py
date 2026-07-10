"""Add indexes, refresh_tokens, and sessions tables

Revision ID: c7d8e9f0a1b2
Revises: 583aafa764cc
Create Date: 2026-07-10 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, Sequence[str], None] = "583aafa764cc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Refresh Tokens ---
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token_hash"),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index(
        "ix_refresh_tokens_active",
        "refresh_tokens",
        ["user_id", "revoked", "expires_at"],
    )

    # --- Sessions ---
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("refresh_token_id", sa.Uuid(), nullable=False),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["refresh_token_id"], ["refresh_tokens.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"])

    # --- Indexes on users ---
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_created_at", "users", ["created_at"])

    # --- Indexes on projects ---
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"])
    op.create_index(
        "ix_projects_owner_created",
        "projects",
        ["owner_id", "created_at"],
    )

    # --- Indexes on memories ---
    op.create_index("ix_memories_project_id", "memories", ["project_id"])
    op.create_index("ix_memories_created_at", "memories", ["created_at"])
    op.create_index(
        "ix_memories_project_created",
        "memories",
        ["project_id", "created_at"],
    )
    op.create_index(
        "ix_memories_external_id",
        "memories",
        ["project_id", "external_id"],
        postgresql_where=sa.text("external_id IS NOT NULL"),
    )

    # --- Indexes on embeddings ---
    op.create_index(
        "ix_embeddings_memory_id",
        "embeddings",
        ["memory_id"],
    )

    # --- Indexes on usage ---
    op.create_index(
        "ix_usage_project_date",
        "usage",
        ["project_id", "date"],
    )


def downgrade() -> None:
    op.drop_index("ix_usage_project_date", table_name="usage")
    op.drop_index("ix_embeddings_memory_id", table_name="embeddings")
    op.drop_index("ix_memories_external_id", table_name="memories")
    op.drop_index("ix_memories_project_created", table_name="memories")
    op.drop_index("ix_memories_created_at", table_name="memories")
    op.drop_index("ix_memories_project_id", table_name="memories")
    op.drop_index("ix_projects_owner_created", table_name="projects")
    op.drop_index("ix_projects_owner_id", table_name="projects")
    op.drop_index("ix_users_created_at", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("ix_refresh_tokens_active", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_user_id", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
