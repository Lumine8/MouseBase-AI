import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

const entries = [
  { date: "2026-07-10", version: "v0.2.8", items: ["Python SDK: updated API base URL to api.mousebase.dev/api/v1", "JS SDK: updated API base URL to api.mousebase.dev/api/v1", "Backend: full MemoryResponse on POST /remember/"] },
  { date: "2026-07-09", version: "v0.2.6", items: ["Initial public release", "Python SDK with sync and async clients", "JavaScript SDK with multi-framework adapters", "Self-hosted deployment with Docker"] },
];

export default function Changelog() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Changelog" description="MouseBase changelog and release notes" path="/changelog" />
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
