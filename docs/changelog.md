# MouseBase Changelog

All notable changes to the MouseBase project are documented here.

---

## Table of Contents

- [SDK Versions](#sdk-versions)
- [Recent Commits (Most Recent First)](#recent-commits-most-recent-first)
- [Frontend Changes](#frontend-changes)
- [Backend API Changes](#backend-api-changes)
- [Python SDK (mousebase) Changes](#python-sdk-mousebase-changes)
- [JavaScript SDK (mousebase-js) Changes](#javascript-sdk-mousebase-js-changes)
- [Published Packages](#published-packages)
- [File Structure](#file-structure)

---

## SDK Versions

| Package | Version | Published To |
|---|---|---|
| `mousebase` (Python) | v0.2.9 | PyPI, TestPyPI |
| `mousebase` (JavaScript) | v0.1.4 | npm |
| Frontend | v0.1.0 | Vercel |
| Backend API | v0.1.0 | Render |

---

## Recent Commits (Most Recent First)

### `ad29b04` — Status page & refund policy cleanup
- **Status page**: Changed from relative URLs (`/api/v1/health/`, `/api/v1/auth/me`) to absolute URLs (`https://api.mousebase.dev/`, `https://api.mousebase.dev/api/v1/payments/plans`)
- Uses `GET` instead of `HEAD` for broader server compatibility
- Uses public endpoints that don't require authentication (root `GET /` and `GET /payments/plans`)
- **RefundPolicy.tsx**: Removed both references to `billing@mousebase.dev` (non-functional email)
- **Contact.tsx**: Stripped down to only GitHub (`github.com/Lumine8/MouseBase-AI`) and Twitter (`x.com/AtlasThinksly`)

### `969a45b` — SEO, RememberResponse simplification, SDK publish
- **SEO**: Added `react-helmet-async` integration. Created reusable `SEO.tsx` component with OG tags, Twitter cards, canonical URLs, and JSON-LD support. Every public page now has proper meta tags.
- **robots.txt**: Created at `frontend/public/robots.txt` — disallows protected pages (dashboard, projects, playground, search, analytics, billing, settings), allows public pages (/, /pricing, /docs, /login, /signup)
- **sitemap.xml**: Created at `frontend/public/sitemap.xml` — 7 URLs with changefreq and priority
- **security.txt**: Created at `frontend/public/.well-known/security.txt` — security contact, policy link, expires 2027
- **RememberResponse API**: Simplified to only return `memory_id` and `created_at`. Removed `content` from POST /remember/ response.
- **Python SDK v0.2.8**: Published to PyPI with updated API base URL (`api.mousebase.dev/api/v1`) and simplified RememberResponse
- **JavaScript SDK v0.1.3**: Published to npm with updated base URL and simplified RememberResponse

### `9adf31a` — Fix Twitter handle
- Corrected Twitter handle from `@AtlasThinks` to `@AtlasThinksly` in Contact.tsx and Footer.tsx

### `94329ca` — Pricing Coming Soon fallback
- Pricing page now checks if any plan returned from API has `price > 0`. If all prices are 0 (payments not live), falls back to "Coming Soon" card instead of rendering plan cards with "Get Started" buttons

### `4689edd` — Remove broken pages, fix settings/contact/about/pricing
- **Deleted pages**: `DataDeletion.tsx`, `ExportData.tsx`, `DataRetention.tsx`, `company/Careers.tsx` (broken or non-functional)
- **Settings.tsx**: Working Delete Account with confirmation modal + Export Data with API-first then localStorage fallback
- **Contact.tsx**: Simplified to GitHub, Twitter, npm, PyPI only
- **About.tsx**: New copy — "Memory is the missing layer of modern AI"
- **Pricing.tsx**: Removed hardcoded `DEFAULT_PLANS`. Paid plans now show "Coming Soon" (determined by API price field)
- **Footer.tsx**: Removed Careers link, removed Privacy section, updated GitHub/Twitter handles

### `a0112dc` — Phase 0: security, logging, rate limiting, connection pooling, health endpoint
- **SecurityHeadersMiddleware**: HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **RequestIDMiddleware**: Unique `X-Request-ID` on every request, propagated through logs via `request.state`
- **RequestTimingMiddleware**: `X-Response-Time-Ms` header on all responses
- **structlog**: Structured JSON logging in production, console in dev. Context vars include `request_id`
- **slowapi**: Rate limiting at 60 requests/minute per IP, disabled in development mode
- **sentry-sdk**: Installed, initializes from `SENTRY_DSN` env var on startup (via lifespan)
- **Connection pooling**: `pool_size=20`, `max_overflow=10`, `pool_pre_ping=True`, `pool_recycle=3600`
- **Health endpoint**: `GET /health/` checks DB with `SELECT 1`, returns status + latency
- **Graceful startup/shutdown**: FastAPI lifespan — initializes logging/Sentry/DB on boot, disposes engine on shutdown
- **New files**: `core/middleware.py`, `core/log_config.py`, `db/check_db()` helper

### `ad29b04` — Status page & refund policy cleanup
### `969a45b` — SEO, RememberResponse simplification, SDK publish
### `9adf31a` — Fix Twitter handle
### `94329ca` — Pricing Coming Soon fallback
### `4689edd` — Remove broken pages, fix settings/contact/about/pricing
### `8a43d19` — SEO, legal pages, skeleton loaders, SDK publishing
- **Skeleton.tsx**: Created shimmer loading components (`SkeletonMetricsGrid`, `SkeletonProjectGrid`, `SkeletonLine`)
- **Footer.tsx**: Full footer with Product, Resources, Company, Legal, Business columns
- **27+ new routes**: Privacy, Terms, Cookies, AUP, DPA, Security, Subprocessors, About, Contact, Careers, Blog, Changelog, Roadmap, Status, Trust Center, Refund Policy, 404, Data Deletion, Export, Retention
- **Custom 404 page** at `NotFound.tsx`
- **10s timeout**: All API requests via `AbortController` in `api.ts`
- **Promise.allSettled**: Dashboard loads metrics, analytics, projects, and subscription in parallel without one failure blocking others
- **Homepage**: Shows both `pip install mousebase` and `npm install mousebase`
- **Python SDK v0.2.9**: Published to PyPI (README URL fix)
- **JavaScript SDK v0.1.4**: Published to npm
- **Python SDK v0.2.9**: Published to TestPyPI

### `1a0fa44` — Bump SDKs to v0.2.7 / v0.1.2
- Corrected API base URL path (`/api/v1`, not `/v1`)
- Full `MemoryResponse` on `POST /remember/`

### `4160c2b` — Fix API base URL and RememberResponse
- All SDKs now use `https://api.mousebase.dev/api/v1` (previously used `/v1`)
- `POST /remember/` returns full `MemoryResponse` instead of bare memory_id

### `cdb9b87` — Bump SDKs to v0.2.6 / v0.1.1
- Minor fixes and dependency updates

### `4f48369` — Update base URL and docs
- Base URL updated to `api.mousebase.dev`
- Documentation refreshed across all platforms

### `04548cf` — Documentation updates
- Root README, VitePress JS SDK guide, frontend docs, PyPI v0.2.5

### Earlier commits
- Phase 4: TypeScript SDK with adapters (Next.js, Express, NestJS, Cloudflare Workers, Bun, Deno), integrations (LangChain, LlamaIndex, OpenAI Agents SDK, CrewAI, Mastra, MCP Server), CLI, and starter templates
- Phase 3: Landing page, docs with code tabs, playground, dashboard, SDK examples
- Phase 2: Integrations package (LangChain, LlamaIndex, OpenAI Agents SDK, CrewAI)
- Phase 1: Core Python SDK, backend, frontend, documentation

---

## Frontend Changes

### SEO Infrastructure
- **Component**: `frontend/src/components/SEO.tsx`
- **Library**: `react-helmet-async` added to dependencies
- **What it provides**:
  - `<title>` with format `"{Page Title} — MouseBase"`
  - `<meta name="description">` — unique per page
  - `<link rel="canonical">` — points to `https://mousebase.dev/{path}`
  - OG tags: `og:type`, `og:url`, `og:title`, `og:description`, `og:image`
  - Twitter cards: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
  - Optional JSON-LD schema via `jsonLd` prop
  - Default OG image: `https://mousebase.dev/assets/logo_mousebase.svg`

### Pages Using SEO Component (all public pages)
| Page | Path | SEO Title | Description |
|---|---|---|---|
| Landing | `/` | "MouseBase" | "Persistent memory for AI applications" |
| Pricing | `/pricing` | "Pricing" | "Simple, transparent pricing for MouseBase" |
| Login | `/login` | "Sign In" | "Sign in to MouseBase" |
| Signup | `/signup` | "Sign Up" | "Create your MouseBase account" |
| Docs | `/docs` | "Documentation" | "MouseBase documentation and API reference" |
| Blog | `/blog` | "Blog" | "MouseBase blog" |
| Status | `/status` | "Status" | "MouseBase system status" |
| Changelog | `/changelog` | "Changelog" | "MouseBase changelog" |
| Roadmap | `/roadmap` | "Roadmap" | "MouseBase roadmap" |
| Trust Center | `/trust` | "Trust Center" | "MouseBase trust center" |
| Refund Policy | `/refund` | "Refund Policy" | "MouseBase refund policy" |
| About | `/about` | "About" | "About MouseBase" |
| Contact | `/contact` | "Contact" | "Contact MouseBase" |
| Privacy | `/legal/privacy` | "Privacy Policy" | "MouseBase privacy policy" |
| Terms | `/legal/terms` | "Terms of Service" | "MouseBase terms of service" |
| Cookies | `/legal/cookies` | "Cookie Policy" | "MouseBase cookie policy" |
| AUP | `/legal/aup` | "Acceptable Use Policy" | "MouseBase acceptable use policy" |
| DPA | `/legal/dpa` | "Data Processing Agreement" | "MouseBase data processing agreement" |
| Security | `/legal/security` | "Security" | "MouseBase security" |
| Subprocessors | `/legal/subprocessors` | "Subprocessors" | "MouseBase subprocessors" |
| Careers | ~~`/careers`~~ | **Removed** | Page was non-functional, deleted |
| 404 | `*` | "Page Not Found" | Custom 404 page |

### Static Files
- **`frontend/public/robots.txt`**: Disallows all protected routes, allows public routes. Points sitemap to `https://mousebase.dev/sitemap.xml`
- **`frontend/public/sitemap.xml`**: 7 URLs with changefreq and priority values
- **`frontend/public/.well-known/security.txt`**: Security contact at `security@mousebase.dev`, expires 2027-07-10

### Skeleton Loading Components
**File**: `frontend/src/components/Skeleton.tsx`

Components created:
- `SkeletonBase` — base shimmer element with `bg-shimmer` gradient animation
- `SkeletonLine` — configurable width line (default 100%)
- `SkeletonMetricsGrid` — 2x2 grid of skeleton metric cards (7 cards)
- `SkeletonProjectGrid` — 3 skeleton project cards in a row

Used in:
- **Dashboard**: `SkeletonMetricsGrid`, `SkeletonProjectGrid`, `SkeletonLine` for user name
- **Pricing**: 3 skeleton cards while fetching plans
- **Status**: `SkeletonLine` while checking endpoints

### Footer
**File**: `frontend/src/components/Footer.tsx`

5-column layout:
| Product | Resources | Company | Legal | Business |
|---|---|---|---|---|
| Pricing | Documentation | About | Privacy Policy | Refund Policy |
| Documentation | GitHub | Contact | Terms of Service | |
| Changelog | PyPI | Trust Center | Cookie Policy | |
| Roadmap | npm | | Security | |
| Status | Blog | | Acceptable Use | |
| | | | Subprocessors | |
| | | | DPA | |

Bottom bar: "MouseBase — Persistent Memory for AI Applications" + GitHub + Twitter links

### Performance Improvements
- **10s timeout**: Every API request in `api.ts` wraps `fetch` with `AbortController` + `setTimeout(10_000)`
- **Promise.allSettled**: Dashboard loads 4 independent API calls in parallel. If any single call fails, the others still render
- **Skeleton loaders**: Dashboard and Pricing pages show shimmer animations immediately, no white flash

### Pricing Page (`Pricing.tsx`)
- Fetches plans from `/api/v1/payments/plans` via inline `fetchJson` helper
- Three states:
  1. **Loading**: 3 skeleton cards with shimmer
  2. **No plans / all-zero prices**: Single "Coming Soon" card with CTA button
  3. **Plans with real prices**: Renders each plan card. Free plan gets accent border + "Get Started" button. Paid plans get "Coming Soon" disabled button
- Filters out `TEAM_*` and `ENTERPRISE` plan IDs
- 10s timeout on the API call
- If no plan has `price > 0`, treats as Coming Soon (handles the case where payments backend isn't live)

### Status Page (`Status.tsx`)
- Pings `https://api.mousebase.dev/` and `https://api.mousebase.dev/api/v1/payments/plans`
- Uses `GET` (not `HEAD`) with `AbortSignal.timeout(10_000)`
- Shows green/red dot with latency in ms
- Shows skeleton while checking
- Links to `https://status.mousebase.dev` for incident history

### Settings Page (`Settings.tsx`)
- **Profile**: Shows user name + email (fetched from `auth.me()`)
- **Theme**: Toggle dark/light mode
- **API Keys**: Local key management, project key visibility (show/hide/copy), rotate key, "Use in Playground"
- **Account**:
  - **Export Data**: Tries `GET /api/v1/auth/export`, falls back to localStorage export if API fails. Downloads as `mousebase-export-YYYY-MM-DD.json`
  - **Delete Account**: Opens confirmation modal "This action cannot be undone". Calls `DELETE /api/v1/auth/delete`, clears localStorage, navigates to `/`
  - **Sign Out**: Removes credentials from localStorage, navigates to `/login`

### Dashboard (`Dashboard.tsx`)
- Loads: projects, dashboard metrics, analytics, subscription info via `Promise.allSettled`
- Metrics cards: Searches, Memories Stored, Today's Requests, Embedding Usage, Storage Used, Current Plan, Remaining Quota
- Usage bars: Memories, Searches, Projects with color-coded progress (green < 70%, yellow < 90%, red > 90%)
- Quick Actions: Create Project, Go to Playground, View Docs
- Projects list or empty state
- **Removed**: Data & Privacy section (Export, Deletion, Retention links)

### Deleted Pages
| File | Reason |
|---|---|
| `frontend/src/pages/DataDeletion.tsx` | Non-functional (no backend endpoint) |
| `frontend/src/pages/ExportData.tsx` | Non-functional (no backend endpoint) |
| `frontend/src/pages/DataRetention.tsx` | Non-functional (no backend endpoint) |
| `frontend/src/pages/company/Careers.tsx` | Non-functional (no hiring page needed) |

### Contact Page (`Contact.tsx`)
Now only shows:
1. GitHub — `github.com/Lumine8/MouseBase-AI` — "Source code, issues, feature requests"
2. Twitter — `x.com/AtlasThinksly` — "Product updates & announcements"

**Removed**: npm, PyPI, billing@mousebase.dev, privacy@mousebase.dev, support@mousebase.dev

### About Page (`About.tsx`)
New copy:
- Headline: "Memory is the missing layer of modern AI."
- Explains that LLMs don't naturally retain knowledge
- MouseBase abstracts vector databases, embedding pipelines, metadata stores, and search infrastructure behind a simple API
- "We're building developer-first infrastructure"

---

## Backend API Changes

### Router Structure (all under `/api/v1` prefix)

| Router | Prefix | Endpoints |
|---|---|---|
| `auth.py` | `/auth` | `POST /signup`, `POST /login`, `POST /verify-email`, `GET /me` |
| `remember.py` | (none) | `POST /remember/` |
| `search.py` | (none) | `POST /search/` |
| `memory.py` | (none) | `GET /{memory_id}`, `PATCH /{memory_id}`, `DELETE /{memory_id}` |
| `projects.py` | (none) | `POST /projects`, `GET /projects`, `GET /projects/{id}`, `PATCH /projects/{id}`, `DELETE /projects/{id}`, `GET /projects/{id}/api-key`, `POST /projects/{id}/rotate-key` |
| `dashboard.py` | (none) | `GET /metrics`, `GET /analytics`, `GET /billing-usage` |
| `payments.py` | `/payments` | `GET /plans`, `GET /addons`, `GET /exchange-rate`, `POST /create-order`, `POST /verify`, `GET /subscription`, `POST /cancel`, `GET /history`, `POST /create-addon-order`, `POST /verify-addon`, `POST /cancel-addon`, `POST /webhook` |
| Root | `/` | `GET /` → `{"status": "ok", "service": "MouseBase Memory API"}` |

### RememberResponse Change
**Before**: `POST /remember/` returned `{memory_id, content, ...}`
**After**: `POST /remember/` returns only `{memory_id, created_at}`

### CORS Configuration
```python
allow_origins = [settings.FRONTEND_URL, "http://localhost:5173"]
```

### Error Handling
Three error handlers:
1. `APIException` — structured errors with `{error: {code, message}}`
2. `RequestValidationError` — returns first validation error as 400
3. Generic `Exception` — returns 500 with generic message

---

## Python SDK (mousebase) Changes

### Version History
| Version | Changes |
|---|---|
| v0.2.9 | README URL fix, published to PyPI and TestPyPI |
| v0.2.8 | Updated API base URL to `api.mousebase.dev/api/v1`, simplified RememberResponse |
| v0.2.7 | Same as v0.2.8 (independent publish) |
| v0.2.6 | Minor fixes |
| v0.2.5 | Documentation update |
| v0.2.4 | Integrations package |
| v0.2.3 | Landing page, SDK examples |
| v0.2.0 | Full SDK with auth, async client, integrations |

### Package Structure (`mousebase/src/mousebase/`)

```
mousebase/
├── __init__.py          # Public exports (MouseBase, AsyncMouseBase, errors, models)
├── client.py            # Sync client (MouseBase) with retry/backoff, dotenv, httpx
├── async_client.py      # Async client (AsyncMouseBase)
├── models.py            # Pydantic models (RememberResponse, SearchResponse, etc.)
├── errors.py            # Error types (MouseBaseError, AuthenticationError, etc.)
└── integrations/
    ├── __init__.py
    ├── langchain_memory.py
    ├── llama_index_memory.py
    ├── openai_agents_memory.py
    └── crewai_memory.py
```

### Dependencies
```toml
dependencies = [
    "httpx>=0.27.0",
    "pydantic>=2.0",
    "python-dotenv>=1.0.0",
    "tenacity>=8.0.0",
]
```

### Key Features
- **Sync client**: `MouseBase(api_key="...")` — supports context manager
- **Async client**: `AsyncMouseBase(api_key="...")`
- **Retry/backoff**: Retries on 429, 500, 502, 503, network errors, and timeouts
- **Dotenv**: Auto-loads `.env` file from CWD for `MOUSEBASE_API_KEY`
- **Type safety**: All responses are Pydantic models
- **Projects**: CRUD, view/rotate API keys
- **Integrations**: LangChain, LlamaIndex, OpenAI Agents SDK, CrewAI

### Tests (13 passing)
| File | Tests |
|---|---|
| `tests/test_client.py` | test_remember, test_search_memory, test_get_memory, test_update_memory, test_delete_memory, test_deleted_memory_not_found, test_missing_api_key, test_invalid_api_key, test_malformed_api_key |
| `tests/test_root.py` | test_root (GET / returns status ok) |
| `tests/test_validation.py` | test_empty_content, test_whitespace_content, test_empty_update |

### Client API
```python
class MouseBase:
    def __init__(self, api_key: str | None = None, base_url: str = DEFAULT_BASE_URL, timeout: int = 30)
    def remember(self, content: str, project_id: str, user_id: str | None = None) -> RememberResponse
    def search(self, query: str, project_id: str, top_k: int = 10, threshold: float = 0.0, user_id: str | None = None) -> SearchResponse
    def get_memory(self, memory_id: str) -> MemoryResponse
    def update_memory(self, memory_id: str, content: str) -> MemoryResponse
    def delete_memory(self, memory_id: str) -> None
    @property
    def projects(self) -> _Projects  # create, list, get, update, delete, view_key, rotate_key
```

### Published Packages
- **PyPI**: `pip install mousebase` → [pypi.org/project/mousebase](https://pypi.org/project/mousebase)
- **TestPyPI**: `pip install -i https://test.pypi.org/simple/ mousebase` → [test.pypi.org/project/mousebase](https://test.pypi.org/project/mousebase)

---

## JavaScript SDK (mousebase-js) Changes

### Version History
| Version | Changes |
|---|---|
| v0.1.4 | Published to npm with updated URL and memory response |
| v0.1.3 | Updated API base URL, simplified RememberResponse |
| v0.1.2 | Fixed API base URL path |
| v0.1.1 | Minor fixes |
| v0.1.0 | Initial SDK release |

### Package Structure (`packages/mousebase-js/src/`)

```
src/
├── index.ts              # Exports: MouseBase, MouseBaseBrowser, errors, types
├── client.ts             # Node.js client
├── browser-client.ts     # Browser client
├── browser.ts            # Browser entry point
├── errors.ts             # Error classes
├── types.ts              # TypeScript interfaces
├── adapters/
│   ├── express.ts        # Express.js middleware adapter
│   ├── nextjs.ts         # Next.js route handler adapter
│   ├── nestjs.ts         # NestJS module adapter
│   ├── cloudflare.ts     # Cloudflare Workers adapter
│   ├── bun.ts            # Bun adapter
│   └── deno.ts           # Deno adapter
└── integrations/
    ├── langchain.ts      # LangChain memory integration
    ├── llama-index.ts    # LlamaIndex integration
    ├── openai-agents.ts  # OpenAI Agents SDK integration
    ├── crewai.ts         # CrewAI integration
    ├── mastra.ts         # Mastra integration
    └── mcp-server.ts     # MCP Server integration
```

### Package Configuration
```json
{
  "name": "mousebase",
  "version": "0.1.4",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": ..., "import": ..., "require": ... },
    "./browser": { "types": ..., "import": ..., "require": ... },
    "./adapters/*": { "types": ..., "import": ..., "require": ... },
    "./integrations/*": { "types": ..., "import": ..., "require": ... }
  },
  "bin": { "mousebase": "bin/mousebase.js" }
}
```

### Build
- **Tool**: `tsup` — produces ESM, CJS, and DTS bundles
- **Output**: `dist/` directory with `.js`, `.cjs`, `.d.ts` files

### Published Package
- **npm**: `npm install mousebase` → [npmjs.com/package/mousebase](https://www.npmjs.com/package/mousebase)

---

## Published Packages Summary

| Package | Registry | Command | Version |
|---|---|---|---|
| mousebase (Python) | PyPI | `pip install mousebase` | v0.2.9 |
| mousebase (Python) | TestPyPI | `pip install -i https://test.pypi.org/simple/ mousebase` | v0.2.9 |
| mousebase (JS) | npm | `npm install mousebase` | v0.1.4 |

### PyPI Setup
- **Token**: `pypi-` (scoped to project `mousebase`)
- **Build**: `python -m build`
- **Publish**: `python -m twine upload dist/*`
- **TestPyPI**: `python -m twine upload --repository testpypi dist/*`

### npm Setup
- **Build**: `npm run build` (tsup)
- **Publish**: `npm publish`

---

## File Structure (Simplified)

```
MouseBase/
├── README.md
├── vercel.json
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, error handlers, router includes
│   │   ├── routers/
│   │   │   ├── auth.py          # signup, login, verify-email, me
│   │   │   ├── remember.py      # POST /remember/
│   │   │   ├── search.py        # POST /search/
│   │   │   ├── memory.py        # GET/PATCH/DELETE /{memory_id}
│   │   │   ├── projects.py      # CRUD + API key management
│   │   │   ├── dashboard.py     # metrics, analytics, billing-usage
│   │   │   └── payments.py      # plans, orders, subscriptions, webhooks
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic
│   │   ├── dependencies/        # Auth dependencies
│   │   ├── core/                # Config, limits
│   │   └── db/                  # Database session, migrations
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # All routes (public + protected)
│   │   ├── components/
│   │   │   ├── Footer.tsx       # 5-column footer
│   │   │   ├── SEO.tsx          # OG/Twitter/canonical/JSON-LD
│   │   │   ├── Skeleton.tsx     # Shimmer loading components
│   │   │   ├── Navbar.tsx       # Authenticated navbar
│   │   │   ├── PublicNav.tsx    # Public navigation
│   │   │   ├── Sidebar.tsx      # Sidebar for protected routes
│   │   │   ├── MemoryTable.tsx  # Memory data table
│   │   │   ├── SearchBox.tsx    # Search input
│   │   │   └── ApiKeyModal.tsx  # API key modal
│   │   ├── pages/
│   │   │   ├── Landing.tsx      # Hero, features, install snippets
│   │   │   ├── Pricing.tsx      # Dynamic plans + Coming Soon fallback
│   │   │   ├── Status.tsx       # Live checks against api.mousebase.dev
│   │   │   ├── Settings.tsx     # Profile, theme, keys, export, delete
│   │   │   ├── Dashboard.tsx    # Metrics, usage, projects
│   │   │   ├── Documentation.tsx # Full API docs with code tabs
│   │   │   ├── Playground.tsx   # Interactive API playground
│   │   │   ├── Analytics.tsx    # Charts and stats
│   │   │   ├── Billing.tsx      # Subscription management
│   │   │   ├── Projects.tsx     # Project CRUD UI
│   │   │   ├── Search.tsx       # Memory search page
│   │   │   ├── Login.tsx / Signup.tsx
│   │   │   ├── NotFound.tsx     # Custom 404
│   │   │   ├── Blog.tsx / Changelog.tsx / Roadmap.tsx / TrustCenter.tsx
│   │   │   ├── RefundPolicy.tsx
│   │   │   ├── company/
│   │   │   │   ├── About.tsx
│   │   │   │   └── Contact.tsx
│   │   │   └── legal/
│   │   │       ├── Privacy.tsx / Terms.tsx / Cookies.tsx
│   │   │       ├── AUP.tsx / DPA.tsx / Security.tsx / Subprocessors.tsx
│   │   └── lib/
│   │       ├── api.ts           # API client with timeout, auth, types
│   │       └── useTheme.ts      # Dark/light theme hook
│   └── public/
│       ├── robots.txt
│       ├── sitemap.xml
│       └── .well-known/
│           └── security.txt
├── mousebase/                   # Python SDK
│   ├── pyproject.toml           # v0.2.9
│   ├── src/mousebase/           # Source
│   │   ├── client.py, async_client.py, models.py, errors.py
│   │   └── integrations/
│   └── tests/                   # 13 passing tests
├── packages/mousebase-js/       # JavaScript SDK
│   ├── package.json             # v0.1.4
│   ├── src/
│   │   ├── client.ts, browser-client.ts, errors.ts, types.ts
│   │   ├── adapters/            # Next.js, Express, NestJS, Cloudflare, Bun, Deno
│   │   └── integrations/        # LangChain, LlamaIndex, OpenAI Agents, CrewAI, Mastra, MCP
│   └── bin/
└── docs/
    ├── .vitepress/              # Documentation site (VitePress)
    └── guide/                   # Quickstart, SDK docs, API reference
```

---

## API Base URL

All SDKs and frontend requests use:

```
https://api.mousebase.dev/api/v1
```

**Migration history**:
- Originally used `/v1` — incorrect, FastAPI routes are mounted under `/api/v1`
- Fixed to `/api/v1` in SDK versions v0.2.7 (Python) and v0.1.2 (JS)
- Frontend `api.ts` uses relative `/api/v1` path (proxied via Vite in dev, via nginx/Vercel in production)

---

## Testing

### Backend (FastAPI)
```bash
cd backend
python -m pytest -v
# 13 tests pass (auth, memory CRUD, remember, search, root, validation)
```

### Python SDK
```bash
cd mousebase
python -m pytest -v
# 13 tests pass (client, error handling, root, validation)
```

### Frontend
```bash
cd frontend
npm run build     # tsc -b && vite build (type check + production build)
npm run test      # vitest (when tests exist)
```
