import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

const entries = [
  { date: "2026-09-08", version: "v0.3.4", items: [
    "Version history: every memory update is automatically versioned",
    "GET /memory/{id}/versions — view full version history",
    "POST /memory/{id}/restore/{version_id} — restore to any previous version",
    "Provenance fields: source (api/import/enrichment/conversation), confidence (0-1), supersedes_id",
    "Advanced metadata filters: range queries ($gt, $lt, $gte, $lte), IN lists, nested keys",
    "Memory lifecycle workers: automatic expiry + hard-delete after retention period",
    "Python SDK v0.3.4: versions(), restore_version(), source/confidence/supersedes_id",
    "JS SDK v0.1.10: versions(), restoreVersion(), source/confidence/supersedes_id",
    "MemoryInspector: new Versions tab with restore-to-version UI",
    "Blog admin: CRUD API + editor at /admin/blog",
    "3 blog posts: tutorial, launch announcement, hybrid search deep-dive",
  ]},
  { date: "2026-09-08", version: "v0.3.3", items: [
    "Memory lifecycle: soft-delete, archive, restore, expiration",
    "Importance field (0.0–1.0) for weighted search ranking",
    "Monthly search rate limiting enforced by plan",
    "Hybrid search: 50% semantic, 20% keyword, 15% importance, 10% metadata, 5% recency",
    "Search rate limiting: 429 when monthly limit exceeded",
    "Dashboard excludes deleted memories from counts",
    "Python SDK v0.3.3: archive(), restore(), importance param",
    "JS SDK v0.1.9: archive(), restore(), importance param",
    "API key rotation with 24h grace period",
    "JWT secret rotation support",
    "131 test users cleaned from production database",
    "Frontend: importance column, search score bars, error handling improvements",
    "CSS fixes: search results, error banners, loading states",
    "Dead code cleanup: removed unused MemoryTable, fixed raw fetch calls",
  ]},
  { date: "2026-07-10", version: "v0.2.8", items: ["Python SDK: updated API base URL to api.mousebase.dev/api/v1", "JS SDK: updated API base URL to api.mousebase.dev/api/v1", "Backend: full MemoryResponse on POST /remember/"] },
  { date: "2026-07-09", version: "v0.2.6", items: ["Initial public release", "Python SDK with sync and async clients", "JavaScript SDK with multi-framework adapters", "Self-hosted deployment with Docker"] },
];

export default function Changelog() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Changelog" description="Version history and release notes for MouseBase — persistent memory API for AI agents. See what shipped recently." path="/changelog" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Changelog</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 40 }}>Release notes for MouseBase SDKs and platform.</p>
        {entries.map((e) => (
          <div key={e.version} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{e.version}</h2>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{e.date}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              {e.items.map((item, i) => (
                <li key={i} style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
