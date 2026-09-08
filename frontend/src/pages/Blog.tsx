import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { blogPosts } from "../lib/blog";

export default function Blog() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Blog" description="Product updates, engineering deep-dives, and guides for building AI agents with persistent memory using MouseBase." path="/blog" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Blog</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 40 }}>Product updates, engineering notes, and AI memory insights.</p>
        {blogPosts.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Coming soon.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                style={{
                  display: "block",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 12,
                  padding: "20px 24px",
                  textDecoration: "none",
                  transition: "border-color 150ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; }}
              >
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{post.date}</div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>{post.title}</h2>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>{post.excerpt}</p>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  {post.tags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 12, color: "var(--text-muted)" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
