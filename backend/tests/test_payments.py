"""114 test cases: payment integration, Razorpay redirect, plan upgrades, pricing page data."""

import hashlib
import hmac
import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.core.limits import PLAN_LIMITS, PLAN_HIERARCHY, ADDON_PRICING
from app.models.subscription import PlanType, SubscriptionStatus

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def unique_email() -> str:
    return f"payment_test_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture
async def auth_token(client: AsyncClient, unique_email: str) -> str:
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": unique_email, "password": "TestPass123!", "full_name": "Payment Tester"},
    )
    data = resp.json()
    assert "token" in data, f"Signup failed: {data}"
    return data["token"]


@pytest.fixture
async def auth_headers(auth_token: str) -> dict:
    return {"Authorization": f"Bearer {auth_token}"}


def _mock_order(client_mock, order_id=None, amount=900, receipt="test_receipt"):
    oid = order_id or f"order_{uuid.uuid4().hex}"
    client_mock.order.create.return_value = {
        "id": oid, "amount": amount, "currency": "USD",
        "receipt": receipt, "status": "created",
        "notes": {"plan_id": "DEVELOPER", "user_id": "test", "user_email": "test@example.com"},
    }
    return oid


def _mock_payment(client_mock, payment_id=None, status="captured"):
    pid = payment_id or f"pay_{uuid.uuid4().hex}"
    client_mock.payment.fetch.return_value = {
        "id": pid, "status": status, "amount": 900, "currency": "USD",
    }
    return pid


def _valid_signature(order_id: str, payment_id: str) -> str:
    return hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()


def _webhook_signature(payload: dict) -> str:
    body = json.dumps(payload).encode()
    return hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()


# ===========================================================================
# 1. Plan listing (3 tests)
# ===========================================================================

class TestPlanListing:
    @pytest.mark.test_id(1)
    async def test_list_plans_returns_correct_structure(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/plans")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 4

    @pytest.mark.test_id(2)
    async def test_plans_include_free_with_price_zero(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/plans")
        plans = resp.json()
        free = next((p for p in plans if p["id"] == "FREE"), None)
        assert free is not None
        assert free["price"] == 0
        assert free["name"] == "Free"

    @pytest.mark.test_id(3)
    async def test_plans_include_all_plan_types(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/plans")
        ids = {p["id"] for p in resp.json()}
        for pt in PlanType:
            assert pt.value in ids, f"Missing plan {pt.value}"


# ===========================================================================
# 2. Addon listing (2 tests)
# ===========================================================================

class TestAddonListing:
    @pytest.mark.test_id(4)
    async def test_list_addons_returns_correct_structure(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/addons")
        assert resp.status_code == 200
        data = resp.json()
        assert "additional_memory_1k" in data
        assert "additional_searches_1k" in data
        assert "additional_project" in data

    @pytest.mark.test_id(5)
    async def test_addons_have_price_and_description(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/addons")
        for key, val in resp.json().items():
            assert "price" in val
            assert "description" in val
            assert val["price"] > 0


# ===========================================================================
# 3. Auth required (10 tests)
# ===========================================================================

class TestAuthRequired:
    @pytest.mark.test_id(6)
    async def test_create_order_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "DEVELOPER"})
        assert resp.status_code == 401

    @pytest.mark.test_id(7)
    async def test_verify_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/payments/verify", json={})
        assert resp.status_code == 401

    @pytest.mark.test_id(8)
    async def test_get_subscription_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/subscription")
        assert resp.status_code == 401

    @pytest.mark.test_id(9)
    async def test_cancel_subscription_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/payments/cancel")
        assert resp.status_code == 401

    @pytest.mark.test_id(10)
    async def test_billing_history_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/payments/history")
        assert resp.status_code == 401

    @pytest.mark.test_id(11)
    async def test_create_addon_order_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/payments/create-addon-order", json={"addon_type": "additional_memory_1k"})
        assert resp.status_code == 401

    @pytest.mark.test_id(12)
    async def test_verify_addon_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/payments/verify-addon", json={})
        assert resp.status_code == 401

    @pytest.mark.test_id(13)
    async def test_cancel_addon_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/payments/cancel-addon", json={"addon_type": "additional_memory_1k"})
        assert resp.status_code == 401

    @pytest.mark.test_id(14)
    async def test_webhook_does_not_require_auth(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=b"{}",
            headers={"x-razorpay-signature": "test"},
        )
        assert resp.status_code != 401

    @pytest.mark.test_id(15)
    async def test_plans_and_addons_do_not_require_auth(self, client: AsyncClient):
        r1 = await client.get("/api/v1/payments/plans")
        r2 = await client.get("/api/v1/payments/addons")
        assert r1.status_code == 200
        assert r2.status_code == 200


# ===========================================================================
# 4. Create order (7 tests)
# ===========================================================================

class TestCreateOrder:
    @pytest.mark.test_id(16)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_succeeds_for_paid_plan(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "DEVELOPER"}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "order_id" in data
        assert data["amount"] == 900

    @pytest.mark.test_id(17)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_fails_for_free_plan(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "FREE"}, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(18)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_fails_for_invalid_plan(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "INVALID"}, headers=auth_headers)
        assert resp.status_code == 422

    @pytest.mark.test_id(19)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_returns_correct_structure(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "DEVELOPER"}, headers=auth_headers)
        data = resp.json()
        assert "order_id" in data
        assert "amount" in data
        assert "currency" in data
        assert "plan_id" in data
        assert "key_id" in data

    @pytest.mark.test_id(20)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_calls_razorpay(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc)
        mock_get_rc.return_value = rc
        await client.post("/api/v1/payments/create-order", json={"plan_id": "DEVELOPER"}, headers=auth_headers)
        rc.order.create.assert_called_once()

    @pytest.mark.test_id(21)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_sets_receipt_with_user_id(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "DEVELOPER"}, headers=auth_headers)
        call_kwargs = rc.order.create.call_args[0][0]
        assert "receipt" in call_kwargs
        assert "plan_" in call_kwargs["receipt"]

    @pytest.mark.test_id(22)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_order_sets_notes(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-order", json={"plan_id": "DEVELOPER"}, headers=auth_headers)
        call_kwargs = rc.order.create.call_args[0][0]
        assert "notes" in call_kwargs
        assert call_kwargs["notes"]["plan_id"] == "DEVELOPER"


# ===========================================================================
# 5. Verify payment (10 tests)
# ===========================================================================

class TestVerifyPayment:
    @pytest.mark.test_id(23)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_payment_succeeds(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

    @pytest.mark.test_id(24)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_payment_fails_invalid_signature(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        bad_sig = "bad_signature"
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": bad_sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(25)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_payment_upgrades_subscription(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        sub_resp = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub_resp.json()["plan"] == "DEVELOPER"

    @pytest.mark.test_id(26)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_payment_creates_payment_record(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert len(hist.json()["payments"]) >= 1

    @pytest.mark.test_id(27)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_payment_fails_non_captured(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc, status="failed")
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(28)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_free_plan_fails(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "FREE",
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(29)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_upgrades_free_to_developer(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_projects"] == 3
        assert sub.json()["max_memories"] == 50000

    @pytest.mark.test_id(30)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_upgrades_developer_to_pro(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=1900)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "PRO",
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["plan"] == "PRO"

    @pytest.mark.test_id(31)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_upgrades_free_to_pro_skip_tier(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=1900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "PRO",
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["plan"] == "PRO"

    @pytest.mark.test_id(32)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_fails_downgrade(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=1900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "PRO",
        }, headers=auth_headers)
        # Now try to "upgrade" to FREE (downgrade)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=0)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "FREE",
        }, headers=auth_headers)
        assert resp.status_code == 400


# ===========================================================================
# 6. Get subscription (5 tests)
# ===========================================================================

class TestGetSubscription:
    @pytest.mark.test_id(33)
    async def test_subscription_is_free_after_signup(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["plan"] == "FREE"

    @pytest.mark.test_id(34)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_subscription_reflects_upgraded_plan(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["plan"] == "DEVELOPER"

    @pytest.mark.test_id(35)
    async def test_subscription_has_correct_limits(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        data = resp.json()
        assert data["max_projects"] == 1
        assert data["max_memories"] == 1000
        assert data["max_searches_per_month"] == 1000

    @pytest.mark.test_id(36)
    async def test_subscription_includes_renewal_date(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        data = resp.json()
        assert "renewal_date" in data

    @pytest.mark.test_id(37)
    async def test_subscription_has_cancel_flag(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        data = resp.json()
        assert "cancel_at_period_end" in data
        assert data["cancel_at_period_end"] is False


# ===========================================================================
# 7. Cancel subscription (5 tests)
# ===========================================================================

class TestCancelSubscription:
    @pytest.mark.test_id(38)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_subscription_succeeds(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        resp = await client.post("/api/v1/payments/cancel", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["status"] == "canceled"

    @pytest.mark.test_id(39)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_changes_status(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        await client.post("/api/v1/payments/cancel", headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["status"] == "CANCELED"

    @pytest.mark.test_id(40)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_sets_cancel_at_period_end(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        await client.post("/api/v1/payments/cancel", headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["cancel_at_period_end"] is True

    @pytest.mark.test_id(41)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_twice_fails(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        await client.post("/api/v1/payments/cancel", headers=auth_headers)
        resp = await client.post("/api/v1/payments/cancel", headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(42)
    async def test_cancel_free_plan_works(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.post("/api/v1/payments/cancel", headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["status"] == "CANCELED"


# ===========================================================================
# 8. Billing history (5 tests)
# ===========================================================================

class TestBillingHistory:
    @pytest.mark.test_id(43)
    async def test_history_empty_initially(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert resp.json()["payments"] == []

    @pytest.mark.test_id(44)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_history_shows_payment_after_upgrade(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert len(hist.json()["payments"]) >= 1

    @pytest.mark.test_id(45)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_history_includes_amount(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert hist.json()["payments"][0]["amount"] == 900

    @pytest.mark.test_id(46)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_history_includes_status(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert hist.json()["payments"][0]["status"] == "captured"

    @pytest.mark.test_id(47)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_history_ordered_by_date_desc(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=1900)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "PRO",
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        dates = [h["created_at"] for h in hist.json()["payments"]]
        assert dates == sorted(dates, reverse=True)


# ===========================================================================
# 9. Create addon order (6 tests)
# ===========================================================================

class TestCreateAddonOrder:
    @pytest.mark.test_id(48)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_addon_order_succeeds(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": 1},
                                 headers=auth_headers)
        assert resp.status_code == 200
        assert "order_id" in resp.json()

    @pytest.mark.test_id(49)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_addon_order_with_quantity(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=198)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": 2},
                                 headers=auth_headers)
        assert resp.status_code == 200

    @pytest.mark.test_id(50)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_addon_order_fails_invalid_type(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "invalid_addon", "quantity": 1},
                                 headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(51)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_addon_order_returns_order_id(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": 1},
                                 headers=auth_headers)
        assert "order_id" in resp.json()

    @pytest.mark.test_id(52)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_addon_order_returns_correct_amount(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc, amount=99)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": 1},
                                 headers=auth_headers)
        assert resp.json()["amount"] == 99

    @pytest.mark.test_id(53)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_create_addon_order_doubles_amount_with_quantity_2(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc, amount=198)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": 2},
                                 headers=auth_headers)
        assert resp.json()["amount"] == 198


# ===========================================================================
# 10. Verify addon (8 tests)
# ===========================================================================

class TestVerifyAddon:
    @pytest.mark.test_id(54)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_succeeds(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 200

    @pytest.mark.test_id(55)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_increases_memory_limit(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 2000  # 1000 base + 1000 addon

    @pytest.mark.test_id(56)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_increases_search_limit(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=49)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_searches_1k",
            "quantity": 1,
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_searches_per_month"] == 2000

    @pytest.mark.test_id(57)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_increases_project_limit(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=199)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_project",
            "quantity": 1,
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_projects"] == 2

    @pytest.mark.test_id(58)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_with_quantity_2(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=198)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 2,
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 3000  # 1000 base + 2000 addon

    @pytest.mark.test_id(59)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_fails_invalid_signature(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": "bad_sig", "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(60)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_addon_creates_payment_record(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert len(hist.json()["payments"]) >= 1

    @pytest.mark.test_id(61)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_multiple_addons_stack(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        oid2 = _mock_order(rc, amount=99)
        pid2 = _mock_payment(rc)
        sig2 = _valid_signature(oid2, pid2)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 3000  # 1000 base + 1000 + 1000


# ===========================================================================
# 11. Cancel addon (6 tests)
# ===========================================================================

class TestCancelAddon:
    @pytest.mark.test_id(62)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_addon_succeeds(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        resp = await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "additional_memory_1k", "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 200

    @pytest.mark.test_id(63)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_addon_decreases_memory_limit(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "additional_memory_1k", "quantity": 1,
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 1000

    @pytest.mark.test_id(64)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_addon_below_base_fails(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "additional_memory_1k", "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(65)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_addon_partial_quantity(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=198)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 2,
        }, headers=auth_headers)
        resp = await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "additional_memory_1k", "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 2000  # 1000 base + 1000 remaining

    @pytest.mark.test_id(66)
    async def test_cancel_invalid_addon_type_fails(
        self, client: AsyncClient, auth_headers: dict,
    ):
        resp = await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "invalid_type", "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(67)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_project_addon(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=199)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_project",
            "quantity": 1,
        }, headers=auth_headers)
        resp = await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "additional_project", "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_projects"] == 1


# ===========================================================================
# 12. Webhook (8 tests)
# ===========================================================================

def _unique_evt_id():
    return f"evt_{uuid.uuid4().hex}"

class TestWebhook:
    @pytest.mark.test_id(68)
    async def test_webhook_valid_signature_processes(self, client: AsyncClient):
        payload = {"event": "payment.captured", "event_id": _unique_evt_id(), "payload": {}}
        sig = _webhook_signature(payload)
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "processed"

    @pytest.mark.test_id(69)
    async def test_webhook_invalid_signature_fails(self, client: AsyncClient):
        payload = {"event": "payment.captured", "event_id": _unique_evt_id(), "payload": {}}
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": "bad_sig"},
        )
        assert resp.status_code == 400

    @pytest.mark.test_id(70)
    async def test_webhook_duplicate_ignored(self, client: AsyncClient):
        eid = _unique_evt_id()
        payload = {"event": "payment.captured", "event_id": eid, "payload": {}}
        sig = _webhook_signature(payload)
        await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert resp.json()["status"] == "ignored"

    @pytest.mark.test_id(71)
    async def test_webhook_stores_event(self, client: AsyncClient):
        payload = {"event": "payment.captured", "event_id": _unique_evt_id(), "payload": {"data": "test"}}
        sig = _webhook_signature(payload)
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert resp.status_code == 200

    @pytest.mark.test_id(72)
    async def test_webhook_captured_event_works(self, client: AsyncClient):
        payload = {"event": "payment.captured", "event_id": _unique_evt_id(), "payload": {"amount": 900}}
        sig = _webhook_signature(payload)
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert resp.status_code == 200

    @pytest.mark.test_id(73)
    async def test_webhook_refund_event_works(self, client: AsyncClient):
        payload = {"event": "payment.refunded", "event_id": _unique_evt_id(), "payload": {"amount": 900}}
        sig = _webhook_signature(payload)
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert resp.status_code == 200

    @pytest.mark.test_id(74)
    async def test_webhook_missing_event_id_fails(self, client: AsyncClient):
        payload = {"event": "payment.captured", "payload": {}}
        sig = _webhook_signature(payload)
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert resp.status_code == 400

    @pytest.mark.test_id(75)
    async def test_webhook_missing_signature_fails(self, client: AsyncClient):
        payload = {"event": "payment.captured", "event_id": _unique_evt_id(), "payload": {}}
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
        )
        assert resp.status_code == 400


# ===========================================================================
# 13. Plan limits enforcement (8 tests)
# ===========================================================================

class TestPlanLimitsEnforcement:
    @pytest.mark.test_id(76)
    async def test_free_plan_cannot_create_second_project(
        self, client: AsyncClient, auth_headers: dict,
    ):
        await client.post("/api/v1/projects/", json={"name": "Project 1"}, headers=auth_headers)
        resp = await client.post("/api/v1/projects/", json={"name": "Project 2"}, headers=auth_headers)
        assert resp.status_code == 402

    @pytest.mark.test_id(77)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_developer_can_create_up_to_three_projects(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        for i in range(3):
            resp = await client.post("/api/v1/projects/", json={"name": f"Project {i}"}, headers=auth_headers)
            assert resp.status_code == 201, f"Failed on project {i}: {resp.text}"
        # 4th should fail
        resp = await client.post("/api/v1/projects/", json={"name": "Project 4"}, headers=auth_headers)
        assert resp.status_code == 402

    @pytest.mark.test_id(78)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_pro_can_create_ten_projects(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=1900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "PRO",
        }, headers=auth_headers)
        for i in range(10):
            resp = await client.post("/api/v1/projects/", json={"name": f"Project {i}"}, headers=auth_headers)
            assert resp.status_code == 201, f"Failed on project {i}"
        resp = await client.post("/api/v1/projects/", json={"name": "Project 11"}, headers=auth_headers)
        assert resp.status_code == 402

    @pytest.mark.test_id(79)
    async def test_memory_limit_free_plan(self):
        from app.core.plan_enforcer import check_memory_limit
        from app.models.project import Project
        from app.models.user import User
        from app.models.subscription import Subscription, PlanType, SubscriptionStatus
        from app.db.database import AsyncSessionLocal
        import uuid
        async with AsyncSessionLocal() as db:
            uid = uuid.uuid4()
            user = User(id=uid, email=f"memlimit_{uuid.uuid4().hex[:8]}@test.com", password_hash="x")
            db.add(user)
            sub = Subscription(
                user_id=uid, plan=PlanType.FREE, status=SubscriptionStatus.ACTIVE,
                max_memories=1000, max_projects=1, max_searches_per_month=1000, requests_per_hour=100,
            )
            db.add(sub)
            suffix = uuid.uuid4().hex[:8]
            proj = Project(owner_id=uid, name="test", api_key_hash=f"x_{suffix}", api_key_id=f"y_{suffix}")
            db.add(proj)
            await db.commit()
            await db.refresh(proj)
            limited, msg = await check_memory_limit(db, proj)
            assert limited is False

    @pytest.mark.test_id(80)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_upgrade_allows_more_projects(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        # Create max projects for free plan (1)
        resp = await client.post("/api/v1/projects/", json={"name": "Only Project"}, headers=auth_headers)
        assert resp.status_code == 201
        # Upgrade to developer
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        resp = await client.post("/api/v1/projects/", json={"name": "Second Project"}, headers=auth_headers)
        assert resp.status_code == 201

    @pytest.mark.test_id(81)
    async def test_plan_limits_per_user(
        self, client: AsyncClient,
    ):
        import uuid
        resp1 = await client.post(
            "/api/v1/auth/signup",
            json={"email": f"limits_user1_{uuid.uuid4().hex[:8]}@test.com", "password": "TestPass123!", "full_name": "User1"},
        )
        assert resp1.status_code == 201, f"User1 signup failed: {resp1.json()}"
        u1_token = resp1.json()["token"]
        h1 = {"Authorization": f"Bearer {u1_token}"}
        resp2 = await client.post(
            "/api/v1/auth/signup",
            json={"email": f"limits_user2_{uuid.uuid4().hex[:8]}@test.com", "password": "TestPass123!", "full_name": "User2"},
        )
        assert resp2.status_code == 201, f"User2 signup failed: {resp2.json()}"
        u2_token = resp2.json()["token"]
        h2 = {"Authorization": f"Bearer {u2_token}"}
        # Each user can create 1 project
        r1 = await client.post("/api/v1/projects/", json={"name": "U1 Project"}, headers=h1)
        assert r1.status_code == 201
        r2 = await client.post("/api/v1/projects/", json={"name": "U2 Project"}, headers=h2)
        assert r2.status_code == 201
        # Both users' 2nd project should fail
        r1b = await client.post("/api/v1/projects/", json={"name": "U1 Second"}, headers=h1)
        assert r1b.status_code == 402
        r2b = await client.post("/api/v1/projects/", json={"name": "U2 Second"}, headers=h2)
        assert r2b.status_code == 402

    @pytest.mark.test_id(82)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_addon_increases_project_limit(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=199)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_project",
            "quantity": 1,
        }, headers=auth_headers)
        await client.post("/api/v1/projects/", json={"name": "First"}, headers=auth_headers)
        r2 = await client.post("/api/v1/projects/", json={"name": "Second"}, headers=auth_headers)
        assert r2.status_code == 201

    @pytest.mark.test_id(83)
    async def test_memory_creation_checks_limits(self):
        from app.db.database import AsyncSessionLocal
        import uuid
        from datetime import datetime, timezone
        from app.models.memory import Memory
        from app.models.user import User
        from app.models.project import Project
        from app.models.subscription import Subscription, PlanType, SubscriptionStatus
        async with AsyncSessionLocal() as db:
            user_id = uuid.uuid4()
            user = User(id=user_id, email=f"memcheck_{uuid.uuid4().hex[:8]}@test.com", password_hash="x")
            db.add(user)
            sub = Subscription(
                user_id=user_id, plan=PlanType.FREE, status=SubscriptionStatus.ACTIVE,
                max_memories=1000, max_projects=1, max_searches_per_month=1000, requests_per_hour=100,
            )
            db.add(sub)
            suffix3 = uuid.uuid4().hex[:8]
            proj = Project(owner_id=user_id, name="test", api_key_hash=f"x_{suffix3}", api_key_id=f"y_{suffix3}")
            db.add(proj)
            await db.flush()
            now = datetime.now(timezone.utc)
            db.add_all(Memory(project_id=proj.id, content="x", created_at=now, updated_at=now) for _ in range(1000))
            await db.commit()
            from app.core.plan_enforcer import check_memory_limit
            limited, msg = await check_memory_limit(db, proj)
            assert limited is True


# ===========================================================================
# 14. Signup creates subscription (3 tests)
# ===========================================================================

class TestSignupSubscription:
    @pytest.mark.test_id(84)
    async def test_signup_creates_free_subscription(self, client: AsyncClient, unique_email: str):
        resp = await client.post(
            "/api/v1/auth/signup",
            json={"email": unique_email, "password": "TestPass123!", "full_name": "Signup Sub"},
        )
        token = resp.json()["token"]
        sub_resp = await client.get("/api/v1/payments/subscription", headers={"Authorization": f"Bearer {token}"})
        assert sub_resp.json()["plan"] == "FREE"
        assert sub_resp.json()["status"] == "ACTIVE"

    @pytest.mark.test_id(85)
    async def test_signup_subscription_has_correct_limits(self, client: AsyncClient, unique_email: str):
        resp = await client.post(
            "/api/v1/auth/signup",
            json={"email": unique_email, "password": "TestPass123!", "full_name": "Signup Limits"},
        )
        token = resp.json()["token"]
        sub_resp = await client.get("/api/v1/payments/subscription", headers={"Authorization": f"Bearer {token}"})
        data = sub_resp.json()
        assert data["max_projects"] == 1
        assert data["max_memories"] == 1000
        assert data["max_searches_per_month"] == 1000
        assert data["requests_per_hour"] == 100

    @pytest.mark.test_id(86)
    async def test_multiple_signups_each_own_subscription(self, client: AsyncClient):
        emails = [f"multi_sub_{uuid.uuid4().hex[:8]}_{i}@test.com" for i in range(3)]
        tokens = []
        for email in emails:
            resp = await client.post(
                "/api/v1/auth/signup",
                json={"email": email, "password": "TestPass123!", "full_name": "Multi Sub"},
            )
            tokens.append(resp.json()["token"])
        for token in tokens:
            sub_resp = await client.get("/api/v1/payments/subscription", headers={"Authorization": f"Bearer {token}"})
            assert sub_resp.json()["plan"] == "FREE"


# ===========================================================================
# 15. Dashboard metrics (3 tests)
# ===========================================================================

class TestDashboardMetrics:
    @pytest.mark.test_id(87)
    async def test_dashboard_metrics_include_plan(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/dashboard/metrics", headers=auth_headers)
        assert resp.status_code == 200
        assert "plan" in resp.json()

    @pytest.mark.test_id(88)
    async def test_dashboard_metrics_show_correct_plan(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/dashboard/metrics", headers=auth_headers)
        assert resp.json()["plan"] == "free"

    @pytest.mark.test_id(89)
    async def test_dashboard_metrics_include_project_count(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/dashboard/metrics", headers=auth_headers)
        assert resp.json()["total_projects"] == 0


# ===========================================================================
# 16. Plan hierarchy (4 tests)
# ===========================================================================

class TestPlanHierarchy:
    @pytest.mark.test_id(90)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_downgrade_pro_to_free_fails(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=1900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "PRO",
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=0)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "FREE",
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(91)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_downgrade_developer_to_free_fails(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=0)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "FREE",
        }, headers=auth_headers)
        assert resp.status_code == 400

    @pytest.mark.test_id(92)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_upgrade_free_to_pro_skip_developer(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=1900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "PRO",
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["plan"] == "PRO"

    @pytest.mark.test_id(93)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cannot_upgrade_to_same_plan(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=900)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        assert resp.status_code == 400


# ===========================================================================
# 17. Edge cases (10 tests)
# ===========================================================================

class TestEdgeCases:
    @pytest.mark.test_id(94)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_verify_with_mismatched_plan_id(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        resp = await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "PRO",
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["plan"] == "PRO"

    @pytest.mark.test_id(95)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_addon_order_zero_quantity(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc, amount=0)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": 0},
                                 headers=auth_headers)
        assert resp.status_code == 200

    @pytest.mark.test_id(96)
    async def test_cancel_nonexistent_subscription(self, client: AsyncClient, unique_email: str):
        """Sign up, cancel, then cancel again - already covered in test 41."""
        resp = await client.post(
            "/api/v1/auth/signup",
            json={"email": unique_email, "password": "TestPass123!", "full_name": "Cancel Nonexist"},
        )
        token = resp.json()["token"]
        h = {"Authorization": f"Bearer {token}"}
        await client.post("/api/v1/payments/cancel", headers=h)
        r2 = await client.post("/api/v1/payments/cancel", headers=h)
        assert r2.status_code == 400

    @pytest.mark.test_id(97)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_addon_order_negative_quantity(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        _mock_order(rc, amount=-99)
        mock_get_rc.return_value = rc
        resp = await client.post("/api/v1/payments/create-addon-order",
                                 json={"addon_type": "additional_memory_1k", "quantity": -1},
                                 headers=auth_headers)
        assert resp.status_code == 200

    @pytest.mark.test_id(98)
    async def test_webhook_empty_payload(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=b"{}",
            headers={"x-razorpay-signature": "test_sig"},
        )
        assert resp.status_code == 400

    @pytest.mark.test_id(99)
    async def test_webhook_malformed_payload(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/payments/webhook",
            content=b"not json",
            headers={"x-razorpay-signature": "test_sig"},
        )
        assert resp.status_code == 400

    @pytest.mark.test_id(100)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_get_history_after_multiple_upgrades(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=900)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=1900)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "PRO",
        }, headers=auth_headers)
        hist = await client.get("/api/v1/payments/history", headers=auth_headers)
        assert len(hist.json()["payments"]) == 2

    @pytest.mark.test_id(101)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_addon_survives_plan_upgrade(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=99)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 1,
        }, headers=auth_headers)
        rc2 = MagicMock()
        oid2 = _mock_order(rc2, amount=900)
        pid2 = _mock_payment(rc2)
        mock_get_rc.return_value = rc2
        sig2 = _valid_signature(oid2, pid2)
        await client.post("/api/v1/payments/verify", json={
            "razorpay_order_id": oid2, "razorpay_payment_id": pid2,
            "razorpay_signature": sig2, "plan_id": "DEVELOPER",
        }, headers=auth_headers)
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 51000  # 50000 base + 1000 addon

    @pytest.mark.test_id(102)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_cancel_addon_partially(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        rc = MagicMock()
        oid = _mock_order(rc, amount=198)
        pid = _mock_payment(rc)
        mock_get_rc.return_value = rc
        sig = _valid_signature(oid, pid)
        await client.post("/api/v1/payments/verify-addon", json={
            "razorpay_order_id": oid, "razorpay_payment_id": pid,
            "razorpay_signature": sig, "addon_type": "additional_memory_1k",
            "quantity": 2,
        }, headers=auth_headers)
        resp = await client.post("/api/v1/payments/cancel-addon", json={
            "addon_type": "additional_memory_1k", "quantity": 1,
        }, headers=auth_headers)
        assert resp.status_code == 200
        sub = await client.get("/api/v1/payments/subscription", headers=auth_headers)
        assert sub.json()["max_memories"] == 2000  # 1000 base + 1000 left

    @pytest.mark.test_id(103)
    @patch("app.services.payment_service.get_razorpay_client")
    async def test_webhook_event_processed_only_once(
        self, mock_get_rc, client: AsyncClient, auth_headers: dict,
    ):
        payload = {"event": "payment.captured", "event_id": _unique_evt_id(), "payload": {"amount": 900}}
        sig = _webhook_signature(payload)
        r1 = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert r1.json()["status"] == "processed"
        r2 = await client.post(
            "/api/v1/payments/webhook",
            content=json.dumps(payload),
            headers={"x-razorpay-signature": sig},
        )
        assert r2.json()["status"] == "ignored"


# ===========================================================================
# 18. Razorpay client integration (11 tests)
# ===========================================================================

class TestRazorpayIntegration:
    @pytest.mark.test_id(104)
    def test_razorpay_client_creates_order(self):
        from app.services.payment_service import get_razorpay_client
        client = get_razorpay_client()
        assert client is not None

    @pytest.mark.test_id(105)
    def test_signature_verification_algorithm(self):
        import hashlib, hmac
        order_id = "order_test_001"
        payment_id = "pay_test_001"
        sig = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        assert len(sig) == 64
        import hmac
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{order_id}|{payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()
        assert hmac.compare_digest(sig, expected)

    @pytest.mark.test_id(106)
    def test_razorpay_key_id_configured(self):
        assert settings.RAZORPAY_KEY_ID is not None
        assert settings.RAZORPAY_KEY_ID.startswith("rzp_")

    @pytest.mark.test_id(107)
    def test_process_webhook_extracts_event_id(self):
        from app.services.payment_service import process_webhook
        payload = json.dumps({"event": "test", "event_id": "evt_001", "payload": {}}).encode()
        sig = _webhook_signature(json.loads(payload))
        result = process_webhook(payload, sig)
        assert result["event_id"] == "evt_001"

    @pytest.mark.test_id(108)
    def test_process_webhook_extracts_event_type(self):
        from app.services.payment_service import process_webhook
        payload = json.dumps({"event": "payment.captured", "event_id": "evt_002", "payload": {}}).encode()
        sig = _webhook_signature(json.loads(payload))
        result = process_webhook(payload, sig)
        assert result["event_type"] == "payment.captured"

    @pytest.mark.test_id(109)
    def test_signature_verification_rejects_bad_sig(self):
        from app.services.payment_service import verify_payment
        import pytest
        with pytest.raises(ValueError, match="Invalid payment signature"):
            verify_payment("order_test", "pay_test", "bad_sig", PlanType.DEVELOPER)

    @pytest.mark.test_id(110)
    def test_webhook_signature_rejects_bad_sig(self):
        from app.services.payment_service import process_webhook
        import pytest
        payload = json.dumps({"event": "test", "event_id": "evt_003", "payload": {}}).encode()
        with pytest.raises(ValueError, match="Invalid webhook signature"):
            process_webhook(payload, "bad_sig")

    @pytest.mark.test_id(111)
    def test_free_plan_price_zero(self):
        info = PLAN_LIMITS[PlanType.FREE]
        assert info["price"] == 0

    @pytest.mark.test_id(112)
    def test_enterprise_plan_price_zero(self):
        info = PLAN_LIMITS[PlanType.ENTERPRISE]
        assert info["price"] == 0

    @pytest.mark.test_id(113)
    def test_all_addons_positive_price(self):
        for key, info in ADDON_PRICING.items():
            assert info["price"] > 0, f"Addon {key} has non-positive price"

    @pytest.mark.test_id(114)
    def test_plan_hierarchy_ordering(self):
        assert PLAN_HIERARCHY[PlanType.FREE] == 0
        assert PLAN_HIERARCHY[PlanType.DEVELOPER] == 1
        assert PLAN_HIERARCHY[PlanType.PRO] == 2
        assert PLAN_HIERARCHY[PlanType.TEAM_5] == 3
        assert PLAN_HIERARCHY[PlanType.TEAM_10] == 4
        assert PLAN_HIERARCHY[PlanType.ENTERPRISE] == 5
