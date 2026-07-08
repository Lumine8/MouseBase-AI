"""create billing tables if missing, add cancel_at_period_end column

Revision ID: 5a6b7c8d9e0f
Revises: 4a5b6c7d8e9f
Create Date: 2026-07-08 14:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "5a6b7c8d9e0f"
down_revision: Union[str, None] = "4a5b6c7d8e9f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id UUID NOT NULL,
            user_id UUID NOT NULL,
            plan VARCHAR(20) DEFAULT 'FREE' NOT NULL,
            status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL,
            renewal_date TIMESTAMP WITH TIME ZONE,
            razorpay_customer_id VARCHAR(255),
            razorpay_subscription_id VARCHAR(255),
            cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
            max_projects INTEGER DEFAULT 1 NOT NULL,
            max_memories INTEGER DEFAULT 1000 NOT NULL,
            max_searches_per_month INTEGER DEFAULT 1000 NOT NULL,
            requests_per_hour INTEGER DEFAULT 100 NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );
    """)
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='subscriptions' AND column_name='cancel_at_period_end'
            ) THEN
                ALTER TABLE subscriptions ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
            END IF;
        END $$;
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS payments (
            id UUID NOT NULL,
            subscription_id UUID NOT NULL,
            amount INTEGER NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
            status VARCHAR(20) DEFAULT 'created' NOT NULL,
            invoice_id VARCHAR(255),
            razorpay_payment_id VARCHAR(255),
            razorpay_order_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (subscription_id) REFERENCES subscriptions (id) ON DELETE CASCADE
        );
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS webhook_events (
            id UUID NOT NULL,
            razorpay_event_id VARCHAR(255) NOT NULL,
            event_type VARCHAR(100) NOT NULL,
            payload JSON NOT NULL,
            processed_at TIMESTAMP WITH TIME ZONE NOT NULL,
            PRIMARY KEY (id),
            CONSTRAINT uq_webhook_event_id UNIQUE (razorpay_event_id)
        );
    """)


def downgrade() -> None:
    op.drop_table("webhook_events")
    op.drop_table("payments")
    op.drop_table("subscriptions")
