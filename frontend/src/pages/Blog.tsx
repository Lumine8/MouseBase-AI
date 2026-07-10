import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

const posts = [
  { title: "Introducing MouseBase: Persistent Memory for AI Agents", date: "2026-07-09", excerpt: "We're building the memory layer for AI. Here's why." },
  { title: "Semantic Search vs. Keyword Search for AI Memory", date: "2026-07-08", excerpt: "Why vector embeddings matter for contextual recall." },
];

export default function Blog() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Blog" description="MouseBase blog — product updates, engineering notes, and AI memory insights" path="/blog" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Blog</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 40 }}>Product updates, engineering notes, and AI memory insights.</p>
        {posts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Coming soon.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {posts.map((p) => (
              <div key={p.title} style={{
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                borderRadius: 12, padding: "20px 24px",
              }}>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{p.date}</div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{p.title}</h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>{p.excerpt}</p>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
