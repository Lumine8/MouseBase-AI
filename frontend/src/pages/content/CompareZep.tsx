import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "MouseBase vs Zep",
  description: "A technical comparison of MouseBase and Zep — two approaches to persistent memory for AI applications.",
  url: "https://mousebase.dev/comparisons/zep",
};

export default function CompareZep() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title="MouseBase vs Zep"
        description="Technical comparison of MouseBase and Zep for AI memory. Differences in architecture, memory model, search, and deployment."
        path="/comparisons/zep"
        jsonLd={jsonLd}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          MouseBase vs Zep
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            MouseBase and Zep both provide persistent memory for AI applications. They differ in their approach to memory management, search, and the level of abstraction they provide.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            What Is Zep?
          </h2>
          <p>
            Zep is a memory server for AI assistants and agents. It provides long-term memory storage with automatic extraction of facts, entities, and summaries from conversations. Zep focuses on building a memory graph from conversational history, with automatic summarization and fact extraction.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Architecture
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Aspect</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>MouseBase</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 600 }}>Zep</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Focus</td>
                <td style={{ padding: "8px 12px" }}>Memory infrastructure (store, search, manage)</td>
                <td style={{ padding: "8px 12px" }}>Conversational memory with auto-extraction</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Deployment</td>
                <td style={{ padding: "8px 12px" }}>Hosted API (SaaS)</td>
                <td style={{ padding: "8px 12px" }}>Self-hosted (Docker) or cloud</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Memory model</td>
                <td style={{ padding: "8px 12px" }}>Explicit memories (you store what you want)</td>
                <td style={{ padding: "8px 12px" }}>Auto-extracted facts + explicit messages</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Search</td>
                <td style={{ padding: "8px 12px" }}>Hybrid (vector + full-text + metadata + recency)</td>
                <td style={{ padding: "8px 12px" }}>Vector similarity + keyword search</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Summarization</td>
                <td style={{ padding: "8px 12px" }}>Not built-in (your application controls this)</td>
                <td style={{ padding: "8px 12px" }}>Automatic conversation summarization</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Fact extraction</td>
                <td style={{ padding: "8px 12px" }}>Not built-in (you store structured metadata)</td>
                <td style={{ padding: "8px 12px" }}>Automatic fact and entity extraction</td>
              </tr>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 12px" }}>Project scoping</td>
                <td style={{ padding: "8px 12px" }}>Native multi-project with API keys</td>
                <td style={{ padding: "8px 12px" }}>Session-based (user/agent ID)</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 12px" }}>Dashboard</td>
                <td style={{ padding: "8px 12px" }}>Built-in web dashboard</td>
                <td style={{ padding: "8px 12px" }}>No built-in dashboard</td>
              </tr>
            </tbody>
          </table>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Memory Philosophy
          </h2>
          <p>
            The fundamental difference is philosophical. <strong>Zep</strong> takes a conversational approach — it ingests conversation history and automatically extracts facts, entities, and summaries. You give it messages, and it builds a memory graph. This is powerful for chat applications where the conversation itself is the source of truth.
          </p>
          <p>
            <strong>MouseBase</strong> takes an explicit approach — your application decides what to remember and stores it as structured memories with metadata. This gives you full control over what gets stored, how it's categorized, and when it's updated or deleted. There's no automatic extraction — you control the memory pipeline.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Choose MouseBase
          </h2>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>You want full control over what gets stored as a memory.</li>
            <li>Your application stores structured information (not just conversation transcripts).</li>
            <li>You need project-based isolation with separate API keys per project.</li>
            <li>You want hybrid search with metadata filtering for precise retrieval.</li>
            <li>You want a hosted service without managing infrastructure.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Choose Zep
          </h2>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>You're building a conversational AI application (chatbot, assistant).</li>
            <li>You want automatic fact and entity extraction from conversations.</li>
            <li>You want automatic conversation summarization.</li>
            <li>You prefer self-hosting with Docker.</li>
            <li>You want a memory graph that builds itself from conversation history.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Honest Assessment
          </h2>
          <p>
            Zep is more opinionated about how memory works — it assumes conversations are the primary source and automates extraction. MouseBase is more of a blank canvas — it gives you primitives (store, search, update, delete) and lets your application decide how to use them. If you want automatic memory from conversations, Zep is strong. If you want explicit control over what your AI remembers, MouseBase gives you that control.
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
