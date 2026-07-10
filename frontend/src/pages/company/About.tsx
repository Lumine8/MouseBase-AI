import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="About" description="About MouseBase — persistent memory for AI agents" path="/about" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>About MouseBase</h1>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          MouseBase provides persistent memory infrastructure for AI agents and applications. We believe that <strong style={{ color: "var(--text-primary)" }}>memory is the missing layer</strong> in modern AI stacks.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          We started MouseBase to solve a simple problem: every AI application needs to remember context across sessions, but existing solutions are either too complex (vector databases) or too limited (key-value stores). MouseBase bridges that gap with a developer-friendly API, powerful semantic search, and zero infrastructure overhead.
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          Built for developers, by developers. Open source at heart.
        </p>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
