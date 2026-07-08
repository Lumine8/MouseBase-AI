import uuid
from datetime import datetime
from pydantic import BaseModel

from app.models.subscription import PlanType, SubscriptionStatus


class PlanInfo(BaseModel):
    id: str
    name: str
    price: int
    max_projects: int
    max_memories: int
    max_searches_per_month: int
    requests_per_hour: int
    description: str


class CreateOrderRequest(BaseModel):
    plan_id: PlanType
    currency: str = "USD"


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    plan_id: PlanType
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: PlanType


class VerifyPaymentResponse(BaseModel):
    status: str
    message: str
    plan: PlanType


class CancelSubscriptionResponse(BaseModel):
    status: str
    message: str
    subscription_status: SubscriptionStatus


class SubscriptionInfo(BaseModel):
    plan: PlanType
    status: SubscriptionStatus
    renewal_date: datetime | None
    cancel_at_period_end: bool
    max_projects: int
    max_memories: int
    max_searches_per_month: int
    requests_per_hour: int


class PaymentHistory(BaseModel):
    id: uuid.UUID
    amount: int
    currency: str
    status: str
    created_at: datetime


class BillingHistory(BaseModel):
    payments: list[PaymentHistory]
