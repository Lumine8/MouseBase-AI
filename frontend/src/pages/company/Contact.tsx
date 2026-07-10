import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const channels = [
  { label: "GitHub", value: "github.com/Lumine8/MouseBase-AI", href: "https://github.com/Lumine8/MouseBase-AI", desc: "Source code, issues, feature requests" },
  { label: "Twitter", value: "@AtlasThinksly", href: "https://x.com/AtlasThinksly", desc: "Product updates & announcements" },
  { label: "npm", value: "npmjs.com/package/mousebase", href: "https://www.npmjs.com/package/mousebase", desc: "JavaScript SDK" },
  { label: "PyPI", value: "pypi.org/project/mousebase", href: "https://pypi.org/project/mousebase", desc: "Python SDK" },
];

export default function Contact() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Contact" description="Contact MouseBase" path="/contact" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 24 }}>Contact</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {channels.map((c) => (
            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer" style={{
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
