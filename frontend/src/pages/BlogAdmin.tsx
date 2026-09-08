import { useState, useEffect } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { api, BlogPostListItem, BlogPostResponse } from "../lib/api";

export default function BlogAdmin() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<BlogPostResponse | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    excerpt: "",
    content: "",
    tags: "",
    published: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadPosts = () => {
    setLoading(true);
    api.blog.list(false)
      .then(setPosts)
      .catch(() => setError("Failed to load posts"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleEdit = (post: BlogPostListItem) => {
    api.blog.get(post.slug).then((full) => {
      setEditing(full);
      setFormData({
        slug: full.slug,
        title: full.title,
        excerpt: full.excerpt,
        content: full.content,
        tags: full.tags,
        published: full.published,
      });
      setShowForm(true);
    });
  };

  const handleNew = () => {
    setEditing(null);
    setFormData({ slug: "", title: "", excerpt: "", content: "", tags: "", published: false });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (editing) {
        await api.blog.update(editing.id, formData);
        setMessage("Post updated");
      } else {
        await api.blog.create(formData);
        setMessage("Post created");
      }
      setShowForm(false);
      loadPosts();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.blog.delete(id);
      loadPosts();
    } catch {
      setError("Failed to delete");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Blog Admin" description="Manage blog posts" path="/admin/blog" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 800, margin: "0 auto", padding: "100px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Blog Admin</h1>
          <button
            onClick={handleNew}
            style={{ padding: "8px 16px", background: "var(--accent)", color: "var(--bg-base)", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
          >
            New Post
          </button>
        </div>

        {message && (
          <div style={{ padding: 12, background: "var(--bg-elevated)", borderRadius: 8, marginBottom: 16, color: "var(--text-primary)" }}>
            {message}
          </div>
        )}

        {showForm && (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editing ? "Edit Post" : "New Post"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "monospace" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Excerpt</label>
                <input
                  type="text"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4, display: "block" }}>Content (HTML)</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={15}
                  style={{ width: "100%", padding: "8px 12px", background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "monospace", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  id="published"
                />
                <label htmlFor="published" style={{ fontSize: 14, color: "var(--text-primary)" }}>Published</label>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.title || !formData.slug || !formData.content}
                  style={{ padding: "8px 16px", background: "var(--accent)", color: "var(--bg-base)", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", opacity: saving || !formData.title || !formData.slug || !formData.content ? 0.5 : 1 }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ padding: "8px 16px", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: 8, cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)" }}>Loading...</p>
        ) : error ? (
          <p style={{ color: "var(--error)" }}>{error}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 8,
                  padding: "12px 16px",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>{post.title}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                    /{post.slug} · {post.published ? "Published" : "Draft"} · {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleEdit(post)}
                    style={{ padding: "4px 12px", background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border-default)", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    style={{ padding: "4px 12px", background: "var(--bg-elevated)", color: "var(--error)", border: "1px solid var(--border-default)", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
