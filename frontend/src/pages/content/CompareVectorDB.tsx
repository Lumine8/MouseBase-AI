import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "MouseBase vs Vector Databases",
  description: "How MouseBase differs from vector databases like Pinecone, Weaviate, and pgvector for AI memory use cases.",
  url: "https://mousebase.dev/comparisons/vector-database",
};

export default function CompareVectorDB() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title="MouseBase vs Vector Databases"
        description="How MouseBase differs from vector databases for AI memory. Explains the difference between infrastructure primitives and memory infrastructure."
        path="/comparisons/vector-database"
        jsonLd={jsonLd}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          MouseBase vs Vector Databases
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            MouseBase is not a vector database. It's a memory infrastructure layer that uses a vector database internally. Understanding the difference helps you choose the right tool.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            What Is a Vector Database?
          </h2>
          <p>
            A vector database (Pinecone, Weaviate, Qdrant, Chroma, pgvector) stores high-dimensional vectors and supports similarity search. You embed your data, store the vectors, and query by vector similarity. It's an infrastructure primitive — a specialized index for approximate nearest neighbor search.
          </p>
          <p>
            Vector databases are powerful but low-level. To use one for AI memory, you need to build:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>An embedding pipeline (choose a model, embed on write, re-embed on update)</li>
            <li>Authentication and access control</li>
            <li>Project or tenant scoping</li>
            <li>Metadata storage and filtering</li>
            <li>Full-text search (most vector databases don't do this natively)</li>
            <li>Usage tracking and rate limiting</li>
            <li>An API layer on top of the raw database</li>
            <li>A developer dashboard for inspection</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            What MouseBase Provides
          </h2>
          <p>
            MouseBase is a complete memory infrastructure layer. It uses PostgreSQL with pgvector internally, but adds everything around it:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>API</strong> — RESTful endpoints for remember, search, get, update, delete</li>
            <li><strong>Authentication</strong> — JWT tokens, API keys, session management</li>
            <li><strong>Project scoping</strong> — Multi-tenant isolation with per-project API keys</li>
            <li><strong>Hybrid search</strong> — Vector similarity + full-text search + metadata + recency</li>
            <li><strong>Embedding management</strong> — Configurable model (Gemini or OpenAI), automatic embedding</li>
            <li><strong>SDKs</strong> — Python, JavaScript, browser — ready to use in 5 lines</li>
            <li><strong>Framework integrations</strong> — LangChain, LlamaIndex, OpenAI Agents, MCP Server</li>
            <li><strong>Dashboard</strong> — Browse, search, and manage memories through a web UI</li>
            <li><strong>Plan enforcement</strong> — Memory limits, rate limits, usage tracking</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Comparison
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Capability</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Vector DB Only</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>MouseBase</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Vector similarity search</td>
                <td style={{ padding: "8px 12px" }}>Yes</td>
                <td style={{ padding: "8px 12px" }}>Yes</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Full-text keyword search</td>
                <td style={{ padding: "8px 12px" }}>Rarely</td>
                <td style={{ padding: "8px 12px" }}>Yes (PostgreSQL tsvector)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Metadata filtering</td>
                <td style={{ padding: "8px 12px" }}>Some</td>
                <td style={{ padding: "8px 12px" }}>Yes (JSONB exact match)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Recency weighting</td>
                <td style={{ padding: "8px 12px" }}>No</td>
                <td style={{ padding: "8px 12px" }}>Yes (exponential decay)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Authentication</td>
                <td style={{ padding: "8px 12px" }}>Build it yourself</td>
                <td style={{ padding: "8px 12px" }}>Built-in (JWT + API keys)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Multi-tenant isolation</td>
                <td style={{ padding: "8px 12px" }}>Build it yourself</td>
                <td style={{ padding: "8px 12px" }}>Built-in (per-project)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>SDKs</td>
                <td style={{ padding: "8px 12px" }}>Client libraries vary</td>
                <td style={{ padding: "8px 12px" }}>Python, JS, Browser (consistent API)</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Dashboard</td>
                <td style={{ padding: "8px 12px" }}>Varies by provider</td>
                <td style={{ padding: "8px 12px" }}>Built-in web dashboard</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px" }}>Engineering effort to use</td>
                <td style={{ padding: "8px 12px" }}>Significant (build the layer above)</td>
                <td style={{ padding: "8px 12px" }}>Minimal (call the API)</td>
              </tr>
            </tbody>
          </table>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Use a Vector Database Directly
          </h2>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>You need similarity search for non-memory use cases (image search, recommendation, deduplication).</li>
            <li>You want to build a custom memory layer with specific requirements not covered by MouseBase.</li>
            <li>You need fine-grained control over the embedding pipeline and index configuration.</li>
            <li>You're building infrastructure for multiple products and want a shared vector store.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Use MouseBase
          </h2>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>You're building an AI application that needs persistent memory.</li>
            <li>You want to ship quickly without building memory infrastructure from scratch.</li>
            <li>You need authentication, project scoping, and usage tracking.</li>
            <li>You want hybrid search (semantic + keyword + metadata + recency) out of the box.</li>
            <li>You want SDKs and framework integrations that work immediately.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Bottom Line
          </h2>
          <p>
            A vector database is a storage engine. MouseBase is a product built on top of one. If you need a vector index for a general-purpose use case, use a vector database. If you need persistent memory for an AI application, MouseBase gives you the complete stack — search, auth, scoping, SDKs, dashboard — without the engineering overhead of building it yourself.
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
