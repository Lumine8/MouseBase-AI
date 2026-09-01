# MouseBase Action Plan

## Iteration 1: Critical Fixes (Immediate)

### P0 — Security
- [ ] Revoke the exposed live API key (`mb_live_...`) found in tests, CI, and bootstrap scripts
- [ ] Remove all hardcoded secrets from the codebase and Git history
- [ ] Create a dynamic key generation system for CI tests
- [ ] Mask secrets in CI logs, never print full keys

### P0 — Broken Links & URLs
- [ ] ~~Fix GitHub links (anomalyco → Lumine8)~~ ✅ Done
- [ ] Fix Playground generated Python example — uses `mousebase-ai.vercel.app:8000` instead of `api.mousebase.dev`
- [ ] Crawl production site for any remaining stale domains or repository references

### P0 — DNS & Infrastructure
- [ ] ~~Fix api.mousebase.dev DNS/SSL~~ ✅ Done
- [ ] Ensure Cloudflare `api` record stays working (DNS only + Full Strict SSL)
- [ ] Verify all deploy workflows pass (Vercel frontend, Render backend)

---

## Iteration 2: Trust & Consistency (Week 1–2)

### P1 — Public Messaging Consistency
- [ ] Remove "Coming Soon" from landing page pricing section — billing is live
- [ ] Ensure pricing is consistent across: landing page, pricing page, README, docs, account UI
- [ ] Verify all public pages reflect current plan names and prices (Free/Hobby/Pro)

### P1 — Security Documentation
- [ ] Publish a security model page (already have `/trust` route)
- [ ] Document: project isolation, token lifecycle, API key rotation, refresh token replay protection
- [ ] Add notes on data retention, deletion propagation, and audit trails

### P1 — SEO & Discoverability
- [ ] ~~Fix robots.txt for AI crawlers~~ ✅ Done
- [ ] ~~Add JSON-LD structured data~~ ✅ Done
- [ ] ~~Update sitemap.xml~~ ✅ Done
- [ ] ~~Add llms.txt~~ ✅ Done
- [ ] Submit sitemap to Google Search Console and Bing Webmaster Tools
- [ ] Inspect homepage, docs, pricing, and use-case pages in Search Console

---

## Iteration 3: Testing & Quality (Week 2–4)

### P1 — Test Coverage
- [ ] Add cross-project access isolation tests
- [ ] Add cross-user access isolation tests
- [ ] Add API key rotation tests
- [ ] Add refresh token replay prevention tests
- [ ] Add memory deletion propagation tests
- [ ] Add export functionality tests
- [ ] Add rate limit enforcement tests
- [ ] Ensure CI generates ephemeral credentials per run

### P1 — API Examples
- [ ] Centralize API base URL in all SDK examples and playground
- [ ] Add automated test that verifies all generated examples use canonical API origin
- [ ] Ensure Python and JavaScript quickstarts are copy-paste ready

---

## Iteration 4: Product Differentiation (Week 4–8)

### Memory Lifecycle
- [ ] Add TTL/retention policies per project or namespace
- [ ] Add soft-delete with recovery window
- [ ] Add memory versioning (track edits over time)
- [ ] Add duplicate detection and conflict resolution
- [ ] Add importance/provenance metadata fields

### Retrieval Quality
- [ ] Build a public retrieval benchmark dataset
- [ ] Measure and publish precision@k, recall@k, MRR/nDCG
- [ ] Measure and publish p50/p95 latency
- [ ] Test retrieval freshness after updates and deletes
- [ ] Test behavior with conflicting memories

### Documentation
- [ ] Document the exact isolation model: user → project → namespace → session → external ID
- [ ] Clarify namespace terminology — is it a first-class API concept or marketing?
- [ ] Document retention scope and data lifecycle

---

## Iteration 5: Content & Onboarding (Week 6–12)

### Knowledge Base Content
Write high-quality, indexable articles:

**Category Education**
- [ ] "What Is Persistent Memory for AI Agents?"
- [ ] "Long-Term Memory vs RAG vs Context Window"
- [ ] "Semantic, Episodic, and Procedural Memory for Agents"

**Implementation Guides**
- [ ] "How to Add Persistent Memory to a Python Agent"
- [ ] "PostgreSQL + pgvector Memory Store Tutorial"
- [ ] "Memory Namespaces for Multi-Tenant AI Apps"

**Evaluation**
- [ ] "How to Evaluate AI Agent Memory Retrieval"
- [ ] "Memory Precision, Recall, Freshness, and Latency"
- [ ] "When Semantic Search Fails for Agent Memory"

**Comparisons**
- [ ] "MouseBase vs Redis for AI Memory"
- [ ] "MouseBase vs a Vector Database"
- [ ] "Hosted Memory API vs Self-Hosted pgvector"

**Use Cases**
- [ ] "Persistent Memory for Customer Support Agents"
- [ ] "Memory for RAG Applications"
- [ ] "Memory for Coding Agents"
- [ ] "Memory for Discord Bots"

**Trust & Governance**
- [ ] "How to Delete AI Memories Reliably"
- [ ] "Tenant Isolation for Agent Memory"
- [ ] "Sensitive Data and AI Memory Retention"

### Content Guidelines
Each article must:
- Answer the query in the first paragraph
- Use descriptive H2 headings
- Include a short runnable example with expected output
- Identify trade-offs
- Link to relevant SDK/API documentation
- Include author identity, publication date, last-updated date, source links
- State what was tested

### AI-Search Visibility Principles
- Write clear, self-contained facts easy to verify
- Explicit definition: "MouseBase is a hosted persistent-memory API for AI applications that stores and semantically retrieves project-scoped memories."
- State supported SDKs, API base URL, storage model, quotas, pricing, limitations, security boundaries in HTML text
- Use short answer blocks under descriptive headings
- Include tables for supported operations, code snippets with canonical URLs, "last verified" dates
- Publish original benchmarks and architecture diagrams with explanatory alt text
- Do NOT treat llms.txt as a substitute for SEO — normal crawlability and high-quality content remain the foundation

### Onboarding
- [ ] One canonical quickstart: create project → store memory → search → delete (under 5 min)
- [ ] Runnable examples in Python and JavaScript
- [ ] Add author identity, publication date, and last-updated dates to all content
- [ ] Three proof points below hero: working 5-min quickstart, public retrieval benchmark, transparent security/data-lifecycle page

---

## Iteration 6: Growth & Developer Attention (Week 8–16)

### Design Partners
- [ ] Recruit 5–10 design partners building real agents
- [ ] Target at least 3 use cases with repeat usage
- [ ] Collect evidence of reduced prompt/context work

### Positioning
- [ ] Reframe as: "Operational memory infrastructure for production AI agents"
- [ ] Emphasize: scoped, inspectable, evaluable, easy to delete
- [ ] Avoid "just another vector database" framing

### Developer Attention Strategy
- [ ] Publish a small open-source benchmark repository (dataset format, evaluation script, baseline results, MouseBase results)
- [ ] Share experiment on Hacker News, Reddit (r/LocalLLaMA, r/MachineLearning), GitHub Discussions, developer newsletters
- [ ] Frame as concrete result: "How memory retrieval changes when recency and importance are added to cosine similarity"
- [ ] Create canonical starter templates for: LangGraph, OpenAI Agents SDK, LlamaIndex, CrewAI, plain FastAPI/Node
- [ ] Each template: one-command setup, deployed demo, architecture diagram, link to docs
- [ ] Add public changelog and roadmap with dates, version numbers, breaking-change policy, migration notes
- [ ] Add "memory inspector" demo (synthetic data, no personal info needed)
- [ ] Encourage GitHub stars/issues only after repo links are correct and quickstart works

### Benchmarks & Evidence
- [ ] Publish retrieval benchmarks with methodology
- [ ] Publish latency benchmarks across plans
- [ ] Document real-world usage patterns from design partners

---

## Measurement Plan

Track these metrics to measure progress:

| Metric | Baseline | Target |
|--------|----------|--------|
| Indexed pages | Search Console coverage report | 100% of intended public pages indexed |
| Branded discovery | Queries containing "MouseBase" | Increasing impressions/clicks month over month |
| Non-branded discovery | "AI agent memory", "persistent memory API", "long-term memory LLM" | 10+ pages receiving impressions; prioritize technical page clicks |
| AI citations | Manual search in ChatGPT, Google AI, Copilot | Baseline of cited pages; improve docs/benchmark representation |
| Developer conversion | Docs landing → SDK install → API request → retained project | Instrument each step; reduce largest drop-off |
| Content quality | Time on page, scroll depth, code-copy events, outbound GitHub/PyPI/npm clicks | Pages attracting qualified developers, not empty traffic |
| Product proof | Quickstart success rate, API p50/p95 latency | Publish reproducible evidence, not unsupported claims |

---

## Completed

- [x] Fix robots.txt for OAI-SearchBot and AI crawlers
- [x] Fix GitHub links (anomalyco → Lumine8) across all files
- [x] Add JSON-LD structured data (SoftwareApplication, WebSite, Organization)
- [x] Update sitemap.xml with all public routes (16 URLs)
- [x] Add llms.txt
- [x] Update homepage hero copy
- [x] Fix api.mousebase.dev DNS/SSL
- [x] Fix Vercel deploy workflow
- [x] Fix rollup optional deps in CI
- [x] Publish Python SDK v0.3.1 to PyPI
- [x] Publish npm SDK v0.1.6 to npm
- [x] Add /api/v1/stats/downloads endpoint
- [x] Fix www.mousebase.dev DNS on Cloudflare
- [x] Switch to live Razorpay keys
- [x] Add Google Analytics
- [x] Update SDK metadata with mousebase.dev homepage link
