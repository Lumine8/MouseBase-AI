import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { fetchBlogPost, BlogPostResponse } from "../lib/blog";

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>Post not found</h1>
      <Link to="/blog" style={{ color: "var(--accent)" }}>Back to blog</Link>
    </div>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) {
      setError(true);
      setLoading(false);
      return;
    }
    fetchBlogPost(slug)
      .then(setPost)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <PublicNav />
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
        <PublicNav />
        <NotFound />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title={post.title}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          datePublished: post.created_at,
          description: post.excerpt,
          url: `https://mousebase.dev/blog/${post.slug}`,
        }}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <Link to="/blog" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
          ← Back to blog
        </Link>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
          {new Date(post.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {post.tags.split(",").filter(Boolean).map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 12, color: "var(--text-muted)" }}>
              {tag.trim()}
            </span>
          ))}
        </div>
        <div
          style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div style={{ marginTop: 48 }}><Footer /></div>
      </article>
    </div>
  );
}
