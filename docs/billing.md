# Billing — v0 (deferred)

**Do not build this yet.** This exists so that when a real user actually wants to pay, there's a plan ready instead of a full Razorpay subscription system getting built under time pressure. Nothing here gets implemented until `MemoryService`, API-key auth, `/remember`, and `/search` are working end to end.

## What v0 billing actually is

No subscriptions table. No webhooks. No JWT. No usage-metering job. Just enough to take money and unlock a limit.

**One column, added to the existing `Project` table:**

```
plan (TEXT, NOT NULL, default 'free')
```

Values: `'free'`, `'developer'`, `'pro'`.

**Limits enforced in application code, not a separate table:**

```python
PLAN_LIMITS = {
    "free":      {"max_memories": 1_000,   "max_searches_per_month": 1_000,   "max_projects": 1,  "price_usd": 0},
    "developer": {"max_memories": 50_000,  "max_searches_per_month": 50_000,  "max_projects": 3,  "price_usd": 9},
    "pro":       {"max_memories": 500_000, "max_searches_per_month": 200_000, "max_projects": 10, "price_usd": 19},
}
```

Cost basis (per-plan variable cost at max usage, Gemini `embedding-001` + Neon pgvector storage): Free ≈ $0.02/mo, Developer ≈ $0.48/mo, Pro ≈ $4.20/mo. Margin stays comfortable (~95% and ~78% respectively) even if the embedding provider changes later — see the margin notes at the bottom of this file before touching these numbers.

## The actual upgrade flow

1. Send the user a Razorpay Payment Link (created manually in the Razorpay dashboard, or via a single one-off API call — no checkout integration in your app).
2. They pay.
3. You see the payment land in the Razorpay dashboard.
4. You run one command or hit one admin-only endpoint:
   ```
   UPDATE projects SET plan = 'developer' WHERE id = '...';
   ```
5. Done. Their limits are now higher on their next request.

No automation. No webhook signature verification. No subscription lifecycle. You are the billing system for the first several customers.

## Why this is enough for now

- Nobody is paying yet, so there's nothing to automate.
- A manual step for the first ~10–20 customers costs you a few minutes each, total. Building webhook infrastructure costs days, before you know if anyone will pay at all.
- It's a one-line migration to add the `plan` column, and it doesn't touch `User`, doesn't require JWT auth on the API, doesn't require a `subscriptions` or `payments` table.

## What upgrades this into the real system

Build the full architecture (users, subscriptions, payments, usage tracking, Razorpay webhooks, JWT dashboard auth, cancellation flows) only when one of these becomes true:

- Manual upgrades are happening often enough that doing them by hand is actually costing you meaningful time.
- Someone asks for self-serve upgrade/downgrade without waiting on you.
- You need proration, trials, or multiple paid tiers — a single `plan` column can't express that.

At that point, the architecture proposed earlier (Razorpay customer/subscription objects, webhook-driven state updates, usage table, `app/billing/`, `app/subscriptions/`, `app/webhooks/`) is the right target — it just isn't the right *starting point*.

## What this does NOT touch

- `User` — no changes needed. Doesn't need `email_verified`, doesn't need JWT for the API itself.
- `Memory`, `Embedding` — untouched.
- API authentication — still just `Authorization: Bearer <api_key>` → `Project` lookup, same as already designed. No dependency on billing state to authenticate a request, only to authorize a request past a limit.

---

## Billing v1 — full Razorpay integration (reference for when you actually need it)

This section exists so the full picture is documented once. **It is not a build task right now** — the trigger conditions above still apply. Read this when you're actually about to build it, not before.

### Razorpay concepts you'll be working with

| Object | What it is |
|---|---|
| **Plan** | A recurring price you define in Razorpay (e.g. "Developer — ₹750/mo"). Created once per tier, referenced by `plan_id` on every subscription. |
| **Customer** | One Razorpay customer per MouseBase user. Created once, reused for every subscription/payment they make. |
| **Subscription** | Links a Customer to a Plan. Has a status (`created`, `active`, `past_due`, `cancelled`, `expired`) and drives recurring charges. |
| **Order/Payment** | A single charge. A subscription generates a new payment each billing cycle. |
| **Webhook** | Razorpay's push notifications for anything that changes subscription/payment state. This is the only source of truth — never trust a frontend redirect. |

### Database additions (beyond the `plan` column already in place)

```
subscriptions
  id                        UUID, PK
  project_id                UUID, FK -> Project.id
  razorpay_customer_id      TEXT
  razorpay_subscription_id  TEXT
  plan                      TEXT            -- 'developer' | 'pro'
  status                    TEXT            -- 'active' | 'past_due' | 'cancelled' | 'expired'
  current_period_start      TIMESTAMPTZ
  current_period_end        TIMESTAMPTZ
  cancel_at_period_end      BOOLEAN, default false
  created_at                TIMESTAMPTZ
  updated_at                TIMESTAMPTZ

payments
  id                    UUID, PK
  subscription_id       UUID, FK -> subscriptions.id
  razorpay_payment_id   TEXT
  razorpay_order_id     TEXT
  amount                INTEGER   -- smallest currency unit (paise)
  currency               TEXT
  status                TEXT      -- 'captured' | 'failed' | 'refunded'
  paid_at               TIMESTAMPTZ

webhook_events
  id              UUID, PK
  razorpay_event_id  TEXT, UNIQUE   -- for idempotency, see below
  event_type      TEXT
  payload         JSONB
  processed_at    TIMESTAMPTZ
```

`subscriptions.project_id` — not `user_id` — because billing attaches to the thing being metered (the Project), consistent with how `plan` already works on the `Project` table today.

### Subscribe flow

```
User clicks "Upgrade" in dashboard
        │
        ▼
POST /billing/create-subscription  { plan: "developer" }
        │
        ▼
Backend:
  - looks up or creates Razorpay Customer for this user
  - calls Razorpay: create Subscription (customer_id, plan_id)
  - stores a `subscriptions` row with status = 'created'
  - returns { subscription_id, razorpay_key_id } to frontend
        │
        ▼
Frontend opens Razorpay Checkout using subscription_id
        │
        ▼
User pays in the Razorpay popup
        │
        ▼
Razorpay redirects on success — this redirect is DISPLAY ONLY.
Do not update the database here. Anyone can fake a redirect.
        │
        ▼
Razorpay sends a webhook (below) — this is what actually updates the database.
```

### Webhook handling

```
POST /billing/webhook
```

Events to handle at minimum:

- `subscription.activated` → set `subscriptions.status = 'active'`, set `projects.plan` to the paid tier
- `subscription.charged` → insert a `payments` row, extend `current_period_end`
- `subscription.cancelled` → set `status = 'cancelled'`; do **not** downgrade `projects.plan` immediately — see cancellation flow below
- `subscription.pending` / payment failure → set `status = 'past_due'`; decide whether to downgrade immediately or grace-period it

**Every webhook handler must:**

1. **Verify the Razorpay signature** (HMAC-SHA256 using your webhook secret) before touching the database. An unverified webhook endpoint is an open door for anyone to fake "payment succeeded."
2. **Be idempotent.** Razorpay retries webhooks that don't return a fast 2xx. Use `razorpay_event_id` (stored in `webhook_events`, unique constraint) to detect and skip events you've already processed — otherwise a retry can double-charge a `payments` insert or re-extend a billing period.
3. **Return quickly.** Do the actual work (DB writes) synchronously if it's fast; if you ever add anything slow (emails, Slack notifications), push it to a background task so the webhook response isn't delayed — Razorpay has its own timeout and will retry if you're too slow, which then collides with point 2.

### Cancellation flow

```
User clicks "Cancel"
        │
        ▼
POST /billing/cancel
        │
        ▼
Backend calls Razorpay: cancel subscription with cancel_at_cycle_end = true
        │
        ▼
subscriptions.cancel_at_period_end = true
(projects.plan is NOT changed yet — they paid for this period, they keep access)
        │
        ▼
At period end, Razorpay sends subscription.cancelled
        │
        ▼
Webhook handler sets projects.plan = 'free'
```

### Enforcing limits on every request

```python
async def check_usage(project: Project, db: Session):
    limits = PLAN_LIMITS[project.plan]
    memory_count = await count_memories(project.id, db)
    if memory_count >= limits["max_memories"]:
        raise HTTPException(
            status_code=402,
            detail={"error": {"code": "plan_limit_reached", "message": "Memory limit reached for your plan."}},
        )
```

Called as a FastAPI dependency on `/remember` (and `/search` for search-count limits, tracked separately per month — this needs a lightweight `usage` table or a Redis counter with monthly TTL, not something to derive by scanning `Memory` rows each request).

### API surface

```
POST   /billing/create-subscription   -- start an upgrade
POST   /billing/webhook               -- Razorpay calls this, not the frontend
POST   /billing/cancel                -- cancel_at_period_end
GET    /billing/subscription          -- current plan, renewal date, status
GET    /billing/usage                 -- current period's memory/search counts vs. limits
```

### Security checklist

- Razorpay **secret key** and **webhook secret** live server-side only, never sent to the frontend.
- Frontend only ever receives: the Razorpay **key ID** (public) and a `subscription_id`/`order_id` needed to open Checkout.
- All plan changes happen via webhook, never via a value the frontend sends back after a redirect.
- Webhook signature verification is not optional — treat a missing/invalid signature as a rejected request (401), not a warning.

### Suggested build order, when the time comes

1. `subscriptions` + `payments` + `webhook_events` tables and migration
2. Razorpay Customer/Subscription creation (`POST /billing/create-subscription`)
3. Webhook endpoint with signature verification and idempotency, handling `subscription.activated` and `subscription.charged` only
4. Wire `projects.plan` updates to the webhook instead of the manual `UPDATE` statement from v0
5. Cancellation flow (`POST /billing/cancel` + `subscription.cancelled` handling)
6. Usage tracking table/counters for the search-limit enforcement
7. `GET /billing/subscription` and `GET /billing/usage` for the dashboard

Steps 1–4 alone replace the manual v0 flow. Steps 5–7 can trail behind — a customer who wants to cancel can still email you in the meantime, same as upgrades work today.

---

Revisit this file, don't rebuild from scratch, once real billing is actually needed.
