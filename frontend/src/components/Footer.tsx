import { Link } from "react-router-dom";

const linkStyle: React.CSSProperties = {
  color: "var(--text-muted)", textDecoration: "none", fontSize: 13,
  transition: "color 180ms",
};

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border-default)", padding: "48px 28px 32px",
      maxWidth: 1100, margin: "0 auto",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 32, marginBottom: 32 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/pricing" style={linkStyle}>Pricing</Link>
            <Link to="/docs" style={linkStyle}>Documentation</Link>
            <Link to="/changelog" style={linkStyle}>Changelog</Link>
            <Link to="/roadmap" style={linkStyle}>Roadmap</Link>
            <Link to="/status" style={linkStyle}>Status</Link>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Resources</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/docs" style={linkStyle}>Documentation</Link>
            <a href="https://github.com/Lumine8/MouseBase-AI" target="_blank" rel="noopener noreferrer" style={linkStyle}>GitHub</a>
            <a href="https://pypi.org/project/mousebase/" target="_blank" rel="noopener noreferrer" style={linkStyle}>PyPI</a>
            <a href="https://www.npmjs.com/package/mousebase" target="_blank" rel="noopener noreferrer" style={linkStyle}>npm</a>
            <Link to="/blog" style={linkStyle}>Blog</Link>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Company</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/about" style={linkStyle}>About</Link>
            <Link to="/contact" style={linkStyle}>Contact</Link>
            <Link to="/trust" style={linkStyle}>Trust Center</Link>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Legal</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/legal/privacy" style={linkStyle}>Privacy Policy</Link>
            <Link to="/legal/terms" style={linkStyle}>Terms of Service</Link>
            <Link to="/legal/cookies" style={linkStyle}>Cookie Policy</Link>
            <Link to="/legal/security" style={linkStyle}>Security</Link>
            <Link to="/legal/aup" style={linkStyle}>Acceptable Use</Link>
            <Link to="/legal/subprocessors" style={linkStyle}>Subprocessors</Link>
            <Link to="/legal/dpa" style={linkStyle}>DPA</Link>
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Business</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Link to="/refund" style={linkStyle}>Refund Policy</Link>
          </div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>MouseBase — Persistent Memory for AI Applications</span>
        <div style={{ display: "flex", gap: 16 }}>
          <a href="https://github.com/Lumine8/MouseBase-AI" target="_blank" rel="noopener noreferrer" style={linkStyle}>GitHub</a>
          <a href="https://x.com/AtlasThinks" target="_blank" rel="noopener noreferrer" style={linkStyle}>Twitter</a>
        </div>
      </div>
    </footer>
  );
}
