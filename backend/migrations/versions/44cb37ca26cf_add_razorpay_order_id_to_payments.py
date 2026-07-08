"""add razorpay_order_id to payments

Revision ID: 44cb37ca26cf
Revises: 5a6b7c8d9e0f
Create Date: 2026-07-08 14:33:39.558127

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44cb37ca26cf'
down_revision: Union[str, Sequence[str], None] = '5a6b7c8d9e0f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('payments', sa.Column('razorpay_order_id', sa.String(255), nullable=True))


def downgrade() -> None:
    op.drop_column('payments', 'razorpay_order_id')
