import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

const cards = [
  { title: "Security", desc: "TLS 1.3, AES-256 encryption, hashed API keys, regular audits.", link: "/legal/security" },
  { title: "Privacy", desc: "We do not train on your data. SOC 2 compliant infrastructure.", link: "/legal/privacy" },
  { title: "Availability", desc: "99.9% uptime SLA for paid plans. Real-time status page.", link: "/status" },
  { title: "Subprocessors", desc: "Transparent list of all third-party services we use.", link: "/legal/subprocessors" },
  { title: "Data Portability", desc: "Export your data anytime. Open API and SDKs.", link: "/privacy/export" },
  { title: "Compliance", desc: "GDPR, CCPA compliant. DPA available on request.", link: "/legal/dpa" },
];

export default function TrustCenter() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Trust Center" description="MouseBase Trust Center — security, privacy, and compliance" path="/trust" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Trust Center</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
          Security, privacy, and compliance information for MouseBase.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {cards.map((c) => (
            <a key={c.title} href={c.link} style={{
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              borderRadius: 12, padding: 24, textDecoration: "none",
              transition: "border-color 180ms",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-default)"}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{c.title}</h3>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 8, lineHeight: 1.5 }}>{c.desc}</p>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
