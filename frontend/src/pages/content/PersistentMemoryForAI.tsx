import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Persistent Memory for AI Agents and Applications",
  description: "Learn how persistent memory gives AI agents long-term context that survives across sessions, conversations, and interactions.",
  url: "https://mousebase.dev/persistent-memory-for-ai",
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "MouseBase",
    applicationCategory: "DeveloperApplication",
    url: "https://mousebase.dev",
  },
};

export default function PersistentMemoryForAI() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title="Persistent Memory for AI Agents"
        description="Persistent memory gives AI agents long-term context that survives across sessions. Learn how it works and why it matters."
        path="/persistent-memory-for-ai"
        jsonLd={jsonLd}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          Persistent Memory for AI Agents
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            Persistent memory is storage that lets AI agents remember facts, preferences, and context across sessions. Unlike a context window that resets on every call, persistent memory survives indefinitely — giving AI systems true long-term knowledge.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Why AI Agents Need Persistent Memory
          </h2>
          <p>
            An AI agent without memory is like a assistant with amnesia. Every conversation starts from zero. The user has to re-explain their preferences, re-state their project details, and re-establish context every single time.
          </p>
          <p>
            Persistent memory solves this by giving agents a knowledge base that grows over time:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>User preferences</strong> — remember that a user prefers TypeScript, uses VS Code, and works on fintech projects</li>
            <li><strong>Conversation history</strong> — retain key decisions and action items from previous sessions</li>
            <li><strong>Domain knowledge</strong> — accumulate facts about products, users, and business logic</li>
            <li><strong>Task context</strong> — track ongoing work, blockers, and next steps across sessions</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            How Persistent Memory Works
          </h2>
          <p>
            At its core, persistent memory for AI agents involves three operations:
          </p>
          <ol style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>Store</strong> — Save a memory with content, metadata, and optional importance weight</li>
            <li><strong>Retrieve</strong> — Search for relevant memories using semantic similarity, keyword matching, or metadata filters</li>
            <li><strong>Manage</strong> — Update, archive, or delete memories as context evolves</li>
          </ol>
          <p>
            The retrieval step is critical. Raw vector search often misses relevant memories because it only considers semantic similarity. A better approach combines multiple signals:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>Semantic search</strong> — finds memories with similar meaning (via embeddings)</li>
            <li><strong>Keyword search</strong> — finds memories containing specific terms (via full-text search)</li>
            <li><strong>Metadata filtering</strong> — narrows results by tags, sources, or custom fields</li>
            <li><strong>Recency weighting</strong> — prioritizes newer memories when relevance is equal</li>
            <li><strong>Importance weighting</strong> — boosts high-priority memories in results</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Memory Lifecycle
          </h2>
          <p>
            Not all memories should live forever. A robust persistent memory system handles the full lifecycle:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>Active</strong> — included in normal search results</li>
            <li><strong>Archived</strong> — retained for history, excluded from search</li>
            <li><strong>Expired</strong> — automatically removed after a configurable TTL</li>
            <li><strong>Deleted</strong> — soft-deleted, then hard-removed after a retention period</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Building with Persistent Memory
          </h2>
          <p>
            The simplest way to add persistent memory to an AI agent is with a dedicated memory API. MouseBase provides this out of the box:
          </p>
          <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
            <code>{`# Python
from mousebase import MouseBase

client = MouseBase(api_key="your-key")

# Store a memory
client.remember("User prefers dark mode and uses TypeScript")

# Search for relevant memories
results = client.search("What IDE does the user use?")
print(results.results[0].content)`}</code>
          </pre>
          <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
            <code>{`// JavaScript
import MouseBase from "mousebase";

const client = new MouseBase({ apiKey: "your-key" });

// Store a memory
await client.remember({ content: "User prefers dark mode" });

// Search
const results = await client.search({ query: "user preferences" });
console.log(results.results[0].content);`}</code>
          </pre>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            When to Use Persistent Memory
          </h2>
          <p>
            Persistent memory is most valuable when:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>Building AI agents that interact with users across multiple sessions</li>
            <li>Creating chatbots that need to remember user preferences and history</li>
            <li>Developing copilots that accumulate domain knowledge over time</li>
            <li>Running autonomous workflows that need to track state across executions</li>
          </ul>
          <p>
            If your AI system only processes one-off requests with no state, you may not need persistent memory. But if context matters, it's the difference between a forgetful assistant and a knowledgeable one.
          </p>

          <div style={{ marginTop: 48, padding: 24, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border-default)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Get Started</h3>
            <p style={{ marginBottom: 16 }}>
              MouseBase provides persistent memory as a service. Free tier includes 5,000 memories and 3 projects.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a href="/signup" style={{ padding: "10px 20px", background: "var(--accent)", color: "var(--bg-base)", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
                Start Free
              </a>
              <a href="/what-is-mousebase" style={{ padding: "10px 20px", background: "var(--bg-card)", color: "var(--text-primary)", borderRadius: 8, border: "1px solid var(--border-default)", textDecoration: "none" }}>
                Learn More
              </a>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </article>
    </div>
  );
}
