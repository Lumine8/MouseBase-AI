import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone

import razorpay

from app.core.config import settings
from app.core.limits import PLAN_LIMITS, PLAN_HIERARCHY, ADDON_PRICING
from app.models.subscription import PlanType, SubscriptionStatus
from app.models.payment import Payment
from app.models.webhook_event import WebhookEvent
from app.schemas.payment import CreateOrderRequest, CreateOrderResponse
from app.services.exchange_rate import convert_amount, get_rate


def get_razorpay_client():
    return razorpay.Client(
        auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
    )


async def create_order(plan_id: PlanType, user_email: str, user_id: str, currency: str = "USD") -> CreateOrderResponse:
    plan_info = PLAN_LIMITS.get(plan_id)
    if not plan_info:
        raise ValueError(f"Invalid plan: {plan_id}")
    usd_amount = plan_info["price"]
    if usd_amount <= 0:
        raise ValueError(f"Plan {plan_id} is free and does not require payment")
    rate = await get_rate(currency)
    converted = convert_amount(usd_amount, rate)
    client = get_razorpay_client()
    receipt = f"plan_{user_id[:8]}_{uuid.uuid4().hex[:8]}"
    order = client.order.create({
        "amount": converted,
        "currency": currency,
        "receipt": receipt,
        "notes": {"plan_id": plan_id.value, "user_id": user_id, "user_email": user_email},
    })
    return CreateOrderResponse(
        order_id=order["id"],
        amount=converted,
        currency=currency,
        plan_id=plan_id,
        key_id=settings.RAZORPAY_KEY_ID,
    )


def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    plan_id: PlanType,
) -> dict:
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if expected_signature != razorpay_signature:
        raise ValueError("Invalid payment signature")
    client = get_razorpay_client()
    payment = client.payment.fetch(razorpay_payment_id)
    if payment.get("status") != "captured":
        raise ValueError(f"Payment not captured: {payment.get('status')}")
    return {"status": "success", "plan_id": plan_id.value, "payment_id": razorpay_payment_id}


def process_webhook(payload: bytes, signature: str) -> dict:
    expected_signature = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    if expected_signature != signature:
        raise ValueError("Invalid webhook signature")
    data = json.loads(payload)
    event_id = data.get("event_id") or data.get("id", "")
    event_type = data.get("event", "")
    if not event_id or not event_type:
        raise ValueError("Missing event_id or event in payload")
    return {"event_id": event_id, "event_type": event_type, "payload": data}


async def create_addon_order(
    user_id: str,
    user_email: str,
    addon_type: str,
    quantity: int = 1,
    currency: str = "USD",
) -> CreateOrderResponse:
    addon_info = ADDON_PRICING.get(addon_type)
    if not addon_info:
        raise ValueError(f"Invalid addon type: {addon_type}")
    usd_amount = addon_info["price"] * quantity
    rate = await get_rate(currency)
    converted = convert_amount(usd_amount, rate)
    client = get_razorpay_client()
    receipt = f"addon_{user_id[:8]}_{uuid.uuid4().hex[:8]}"
    order = client.order.create({
        "amount": converted,
        "currency": currency,
        "receipt": receipt,
        "notes": {
            "addon_type": addon_type,
            "quantity": str(quantity),
            "user_id": user_id,
            "user_email": user_email,
        },
    })
    return CreateOrderResponse(
        order_id=order["id"],
        amount=converted,
        currency=currency,
        plan_id=PlanType.FREE,
        key_id=settings.RAZORPAY_KEY_ID,
    )


def verify_addon_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    addon_type: str,
) -> dict:
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()
    if expected_signature != razorpay_signature:
        raise ValueError("Invalid payment signature")
    client = get_razorpay_client()
    payment = client.payment.fetch(razorpay_payment_id)
    if payment.get("status") != "captured":
        raise ValueError(f"Payment not captured: {payment.get('status')}")
    return {"status": "success", "addon_type": addon_type, "payment_id": razorpay_payment_id}
