"""Seed blog posts from hardcoded data

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-09-08

"""

from alembic import op
import sqlalchemy as sa

revision = "c2d3e4f5a6b7"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO blog_posts (id, slug, title, excerpt, content, tags, published, author_id, created_at, updated_at)
        VALUES
        (
            gen_random_uuid(),
            'introducing-mousebase',
            'Introducing MouseBase: Persistent Memory for AI Agents',
            'We''re building the memory layer for AI. Here''s why.',
            'We''re launching MouseBase — persistent memory infrastructure for AI agents and applications. Here''s why we''re building it and what it does.',
            'announcement',
            true,
            (SELECT id FROM users WHERE email = 'sankargopan1@gmail.com' LIMIT 1),
            '2026-07-09 00:00:00+00',
            '2026-07-09 00:00:00+00'
        );
    """)


def downgrade() -> None:
    op.execute("DELETE FROM blog_posts WHERE slug = 'introducing-mousebase';")
