import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "What Is MouseBase?",
  description: "MouseBase is persistent memory infrastructure for AI applications and agents, providing APIs and storage/retrieval primitives for giving AI systems long-term memory.",
  url: "https://mousebase.dev/what-is-mousebase",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "MouseBase",
    applicationCategory: "DeveloperApplication",
    url: "https://mousebase.dev",
  },
};

export default function WhatIsMouseBase() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title="What Is MouseBase?"
        description="MouseBase is persistent memory infrastructure for AI applications and agents. Store, search, and manage long-term context with a simple API."
        path="/what-is-mousebase"
        jsonLd={jsonLd}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          What Is MouseBase?
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            MouseBase is persistent memory infrastructure for AI applications and agents. It provides a hosted API for storing, searching, and managing long-term memories so AI systems can maintain context across sessions.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            The Problem
          </h2>
          <p>
            Large language models can reason, but they don't retain knowledge between conversations. Every session starts from zero. Developers building AI agents, chatbots, copilots, or autonomous workflows all face the same problem: how do you give an AI system memory that persists?
          </p>
          <p>
            The common approaches have significant limitations:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>Context windows</strong> are limited in size and expensive at scale. They're also temporary — lost when the session ends.</li>
            <li><strong>Vector databases</strong> store embeddings but don't provide authentication, project scoping, plan enforcement, SDKs, or a developer experience. They're infrastructure primitives, not product.</li>
            <li><strong>Building from scratch</strong> means managing embedding pipelines, search infrastructure, metadata stores, and security — substantial engineering for something that should be a commodity.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            What MouseBase Does
          </h2>
          <p>
            MouseBase sits between your AI application and the database. You call a simple API to store memories, and MouseBase handles embeddings, storage, search, and retrieval. Your agent remembers context. You don't manage infrastructure.
          </p>
          <p>
            MouseBase provides:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>Memory storage</strong> — Store any text content as a memory, scoped to a project, with optional metadata.</li>
            <li><strong>Hybrid search</strong> — Retrieve memories using a combination of semantic (vector embedding), keyword (full-text), metadata, and recency signals.</li>
            <li><strong>Project scoping</strong> — Each project has its own isolated memory space with separate API keys and usage tracking.</li>
            <li><strong>SDKs</strong> — Python, JavaScript, and browser SDKs with a consistent interface.</li>
            <li><strong>Framework integrations</strong> — LangChain, LlamaIndex, OpenAI Agents, MCP Server, CrewAI, and Mastra.</li>
            <li><strong>Dashboard</strong> — Web interface for managing projects, browsing memories, and monitoring usage.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            How It Works
          </h2>
          <p>
            <strong>1. Store a memory.</strong> Your application calls the <code>remember</code> endpoint with content and optional metadata. MouseBase embeds the content using a configurable embedding model (Gemini or OpenAI) and stores it in PostgreSQL with pgvector.
          </p>
          <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, overflow: "auto", marginBottom: 20 }}>
            <code>{`from mousebase import MouseBase

client = MouseBase(api_key="mb_live_...")
client.remember(
    "User prefers dark mode and concise responses",
    metadata={"source": "conversation", "session_id": "abc123"}
)`}</code>
          </pre>
          <p>
            <strong>2. Search for memories.</strong> Your application calls the <code>search</code> endpoint with a natural language query. MouseBase combines semantic similarity, keyword matching, metadata filtering, and recency to rank results.
          </p>
          <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, overflow: "auto", marginBottom: 20 }}>
            <code>{`results = client.search("What UI preferences does the user have?")
for result in results.results:
    print(f"{result.score:.2f} — {result.content}")`}</code>
          </pre>
          <p>
            <strong>3. Inject into context.</strong> Your application includes the retrieved memories in the LLM prompt, giving the model persistent context from previous sessions.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Who Is MouseBase For?
          </h2>
          <p>
            MouseBase is built for developers building AI applications that need to remember:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>AI agents</strong> that operate across multiple sessions and need to retain task context, user preferences, and learned facts.</li>
            <li><strong>Chatbots and copilots</strong> that need to remember previous conversations and user preferences.</li>
            <li><strong>Customer support systems</strong> that need to recall customer history and past resolutions.</li>
            <li><strong>Autonomous workflows</strong> that need to track state and decisions across execution steps.</li>
            <li><strong>Any LLM application</strong> where short-term context windows are insufficient.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Get Started
          </h2>
          <p>
            Install the Python SDK with <code>pip install mousebase</code> or the JavaScript SDK with <code>npm install mousebase</code>. Create a project at <a href="https://mousebase.dev/signup" style={{ color: "var(--accent)" }}>mousebase.dev</a>, get an API key, and start storing memories in five lines of code.
          </p>
          <p>
            See the <a href="/docs/quickstart" style={{ color: "var(--accent)" }}>quickstart guide</a> for a step-by-step walkthrough, or browse the <a href="/docs" style={{ color: "var(--accent)" }}>full documentation</a>.
          </p>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </article>
    </div>
  );
}
