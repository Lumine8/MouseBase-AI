import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "MouseBase vs Mem0",
  description: "A technical comparison of MouseBase and Mem0 — two approaches to persistent memory for AI applications.",
  url: "https://mousebase.dev/comparisons/mem0",
};

export default function CompareMem0() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title="MouseBase vs Mem0"
        description="Technical comparison of MouseBase and Mem0 for AI memory. Differences in architecture, API design, search, and deployment."
        path="/comparisons/mem0"
        jsonLd={jsonLd}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          MouseBase vs Mem0
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            MouseBase and Mem0 both provide persistent memory for AI applications. They differ in architecture, deployment model, API design, and search capabilities.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            What Is Mem0?
          </h2>
          <p>
            Mem0 (formerly Embedchain) is an open-source memory layer for AI applications. It provides a Python library for storing and retrieving memories, with support for multiple LLM providers and vector databases. Mem0 can run locally or use their managed cloud service.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Architecture
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Aspect</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>MouseBase</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Mem0</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Deployment</td>
                <td style={{ padding: "8px 12px" }}>Hosted API (SaaS)</td>
                <td style={{ padding: "8px 12px" }}>Self-hosted library or managed cloud</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Database</td>
                <td style={{ padding: "8px 12px" }}>PostgreSQL + pgvector</td>
                <td style={{ padding: "8px 12px" }}>Configurable (Qdrant, Chroma, Pinecone, etc.)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Search</td>
                <td style={{ padding: "8px 12px" }}>Hybrid (vector + full-text + metadata + recency)</td>
                <td style={{ padding: "8px 12px" }}>Vector similarity + optional graph memory</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Authentication</td>
                <td style={{ padding: "8px 12px" }}>Built-in (JWT + API keys)</td>
                <td style={{ padding: "8px 12px" }}>Not included (self-managed)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Project scoping</td>
                <td style={{ padding: "8px 12px" }}>Native (multi-project per account)</td>
                <td style={{ padding: "8px 12px" }}>User ID / agent ID based</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Dashboard</td>
                <td style={{ padding: "8px 12px" }}>Built-in web dashboard</td>
                <td style={{ padding: "8px 12px" }}>No built-in dashboard</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>SDKs</td>
                <td style={{ padding: "8px 12px" }}>Python, JavaScript, Browser</td>
                <td style={{ padding: "8px 12px" }}>Python</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px" }}>Pricing</td>
                <td style={{ padding: "8px 12px" }}>Tiered plans (Free / Hobby / Pro)</td>
                <td style={{ padding: "8px 12px" }}>Open source (self-host) or cloud pricing</td>
              </tr>
            </tbody>
          </table>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Search Capabilities
          </h2>
          <p>
            <strong>MouseBase</strong> uses hybrid search that combines four signals: semantic similarity (vector embeddings), keyword matching (PostgreSQL full-text search), metadata filtering (exact match on JSONB fields), and recency (exponential decay). Results are scored using a weighted formula.
          </p>
          <p>
            <strong>Mem0</strong> primarily uses vector similarity search. Mem0 also supports graph memory for relationships between entities, which MouseBase does not yet provide. Mem0's graph memory can be useful for complex entity relationships but adds complexity.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Choose MouseBase
          </h2>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>You want a hosted service without managing infrastructure.</li>
            <li>You need authentication, project scoping, and usage tracking out of the box.</li>
            <li>You want hybrid search (semantic + keyword + metadata + recency) for better retrieval quality.</li>
            <li>You're building a multi-tenant application and need per-project isolation.</li>
            <li>You want a built-in dashboard for browsing and managing memories.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Choose Mem0
          </h2>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>You want to self-host and have full control over the infrastructure.</li>
            <li>You need graph memory for complex entity relationships.</li>
            <li>You want to use a specific vector database (Qdrant, Chroma, Pinecone, etc.).</li>
            <li>You prefer an open-source solution you can modify directly.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Honest Assessment
          </h2>
          <p>
            Neither solution is universally better. Mem0 is a strong choice for teams that want to self-host and need graph memory. MouseBase is a strong choice for teams that want a hosted service with built-in auth, hybrid search, and a developer dashboard. The right choice depends on your deployment preferences, infrastructure requirements, and search quality needs.
          </p>

          <div style={{ marginTop: 40, padding: 16, background: "var(--bg-elevated)", borderRadius: 8 }}>
            <p style={{ margin: 0 }}>
              <strong>Try MouseBase:</strong> <a href="https://mousebase.dev/signup" style={{ color: "var(--accent)" }}>Sign up free</a> — 5,000 memories, 3 projects, no credit card required. See the <a href="/docs/quickstart" style={{ color: "var(--accent)" }}>quickstart guide</a> or <a href="https://github.com/Lumine8/MouseBase-AI" style={{ color: "var(--accent)" }}>GitHub repository</a>.
            </p>
          </div>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </article>
    </div>
  );
}
