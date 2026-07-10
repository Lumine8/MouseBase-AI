import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

const sections = [
  {
    label: "In Progress",
    items: [
      "Team & enterprise plans with SSO",
      "Multi-region replication for low-latency global access",
      "Webhook notifications for memory events",
    ],
  },
  {
    label: "Next Up",
    items: [
      "Batch memory operations (import/export CSV, JSONL)",
      "Memory TTL / auto-expiration",
      "Go SDK",
      "Improved embedding model support (custom providers)",
    ],
  },
  {
    label: "Future",
    items: [
      "Visual memory graph explorer",
      "Real-time memory streaming (WebSockets)",
      "On-premise / air-gapped deployment option",
      "Memory versioning and diff tracking",
    ],
  },
];

export default function Roadmap() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Roadmap" description="MouseBase product roadmap" path="/roadmap" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Roadmap</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
          What we're building next. Timelines are approximate and subject to change.
        </p>
        {sections.map((s) => (
          <div key={s.label} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--text-primary)" }}>{s.label}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.items.map((item) => (
                <div key={item} style={{
                  background: "var(--bg-card)", border: "1px solid var(--border-default)",
                  borderRadius: 10, padding: "12px 16px", fontSize: 14, color: "var(--text-secondary)",
                }}>{item}</div>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
