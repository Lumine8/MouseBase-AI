import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const channels = [
  { label: "GitHub Issues", value: "github.com/anomalyco/MouseBase", href: "https://github.com/anomalyco/MouseBase/issues", desc: "Bug reports, feature requests, discussions" },
  { label: "Email", value: "hello@mousebase.dev", href: "mailto:hello@mousebase.dev", desc: "General inquiries" },
  { label: "Security", value: "security@mousebase.dev", href: "mailto:security@mousebase.dev", desc: "Vulnerability disclosures" },
  { label: "Privacy", value: "privacy@mousebase.dev", href: "mailto:privacy@mousebase.dev", desc: "Privacy-related requests" },
  { label: "Legal", value: "legal@mousebase.dev", href: "mailto:legal@mousebase.dev", desc: "Legal inquiries & DPA requests" },
  { label: "Twitter", value: "@mousebase", href: "https://x.com/mousebase", desc: "Product updates & announcements" },
];

export default function Contact() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Contact" description="Contact MouseBase" path="/contact" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Contact</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>The best way to reach us depends on what you need.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {channels.map((c) => (
            <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              borderRadius: 12, padding: "16px 20px", textDecoration: "none",
              transition: "border-color 180ms",
            }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-default)"}
            >
              <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{c.label}</div>
              <div style={{ fontSize: 13, color: "var(--accent)", marginTop: 2 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{c.desc}</div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
