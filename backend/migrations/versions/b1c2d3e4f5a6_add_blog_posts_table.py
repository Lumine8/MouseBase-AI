"""add blog_posts table

Revision ID: b1c2d3e4f5a6
Revises: e4f5a6b7c8d9
Create Date: 2026-09-08

"""
from alembic import op
import sqlalchemy as sa

revision = "b1c2d3e4f5a6"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "blog_posts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("excerpt", sa.String(500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tags", sa.String(500), nullable=False, server_default=""),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("author_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_blog_posts_slug", "blog_posts", ["slug"])
    op.create_index("ix_blog_posts_published", "blog_posts", ["published"])
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("users", "is_admin")
    op.drop_index("ix_blog_posts_published")
    op.drop_index("ix_blog_posts_slug")
    op.drop_table("blog_posts")
