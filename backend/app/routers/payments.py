from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.webhook_event import WebhookEvent
from app.schemas.payment import (
    BillingHistory,
    CancelSubscriptionResponse,
    CreateOrderRequest,
    CreateOrderResponse,
    PlanInfo,
    SubscriptionInfo,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)
from app.services.exchange_rate import get_rate
from app.services.payment_service import (
    create_addon_order as payment_create_addon_order,
    create_order as payment_create_order,
    process_webhook,
    verify_addon_payment as payment_verify_addon_payment,
    verify_payment as payment_verify_payment,
)
from app.services.subscription_service import (
    add_addon,
    cancel_addon,
    cancel_subscription,
    get_available_plans,
    get_billing_history,
    get_subscription,
    upgrade_subscription,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/plans", response_model=list[PlanInfo])
async def list_plans():
    return get_available_plans()


@router.get("/addons", response_model=dict)
async def list_addons():
    from app.core.limits import ADDON_PRICING

    return ADDON_PRICING


@router.get("/exchange-rate")
async def get_exchange_rate(currency: str = "USD"):
    try:
        rate = await get_rate(currency)
        return {"base": "USD", "target": currency.upper(), "rate": rate}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Exchange rate error: {str(e)}")


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(
    request: CreateOrderRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        result = await payment_create_order(
            request.plan_id,
            current_user.email,
            str(current_user.id),
            request.currency,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Payment gateway error: {str(e)}")


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(
    request: VerifyPaymentRequest = Body(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        payment_verify_payment(
            request.razorpay_order_id,
            request.razorpay_payment_id,
            request.razorpay_signature,
            request.plan_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        sub = await upgrade_subscription(
            db,
            current_user.id,
            request.plan_id,
            request.razorpay_payment_id,
            request.razorpay_order_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return VerifyPaymentResponse(
        status="success",
        message="Payment verified and plan upgraded",
        plan=sub.plan,
    )


@router.get("/subscription", response_model=SubscriptionInfo)
async def get_subscription_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sub = await get_subscription(db, current_user.id)
    if not sub:
        raise HTTPException(status_code=404, detail="No subscription found")
    return SubscriptionInfo(
        plan=sub.plan,
        status=sub.status,
        renewal_date=sub.renewal_date,
        cancel_at_period_end=sub.cancel_at_period_end,
        max_projects=sub.max_projects,
        max_memories=sub.max_memories,
        max_searches_per_month=sub.max_searches_per_month,
        requests_per_hour=sub.requests_per_hour,
    )


@router.post("/cancel", response_model=CancelSubscriptionResponse)
async def cancel_user_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        sub = await cancel_subscription(db, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return CancelSubscriptionResponse(
        status="canceled",
        message="Subscription has been canceled",
        subscription_status=sub.status,
    )


@router.get("/history", response_model=BillingHistory)
async def billing_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_billing_history(db, current_user.id)


@router.post("/create-addon-order", response_model=CreateOrderResponse)
async def create_addon_order(
    addon_type: str = Body(...),
    quantity: int = Body(1),
    currency: str = Body("USD"),
    current_user: User = Depends(get_current_user),
    _db: AsyncSession = Depends(get_db),
):
    try:
        result = await payment_create_addon_order(
            str(current_user.id), current_user.email, addon_type, quantity, currency
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-addon", response_model=VerifyPaymentResponse)
async def verify_addon(
    razorpay_order_id: str = Body(...),
    razorpay_payment_id: str = Body(...),
    razorpay_signature: str = Body(...),
    addon_type: str = Body(...),
    quantity: int = Body(1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        payment_verify_addon_payment(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addon_type,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        sub = await add_addon(
            db,
            current_user.id,
            addon_type,
            quantity,
            razorpay_payment_id,
            razorpay_order_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return VerifyPaymentResponse(
        status="success",
        message=f"Addon {addon_type} activated",
        plan=sub.plan,
    )


@router.post("/cancel-addon", response_model=SubscriptionInfo)
async def cancel_user_addon(
    addon_type: str = Body(...),
    quantity: int = Body(1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        sub = await cancel_addon(db, current_user.id, addon_type, quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return SubscriptionInfo(
        plan=sub.plan,
        status=sub.status,
        renewal_date=sub.renewal_date,
        cancel_at_period_end=sub.cancel_at_period_end,
        max_projects=sub.max_projects,
        max_memories=sub.max_memories,
        max_searches_per_month=sub.max_searches_per_month,
        requests_per_hour=sub.requests_per_hour,
    )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    body = await request.body()
    signature = request.headers.get("x-razorpay-signature", "")
    try:
        result = process_webhook(body, signature)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    result_obj = await db.execute(
        select(WebhookEvent).where(WebhookEvent.razorpay_event_id == result["event_id"])
    )
    existing = result_obj.scalar_one_or_none()
    if existing:
        return {"status": "ignored", "reason": "duplicate"}
    webhook_event = WebhookEvent(
        razorpay_event_id=result["event_id"],
        event_type=result["event_type"],
        payload=result["payload"],
    )
    db.add(webhook_event)
    await db.commit()
    return {"status": "processed"}
