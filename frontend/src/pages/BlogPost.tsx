import { useParams, Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { getPostBySlug } from "../lib/blog";

const postContent: Record<string, { content: React.ReactNode }> = {
  "persistent-memory-for-ai-agents": {
    content: (
      <>
        <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
          AI agents are powerful, but they have a fundamental limitation: they forget. Every conversation starts from zero. In this guide, we'll add persistent memory to an AI agent using MouseBase — so it remembers user preferences, conversation history, and domain knowledge across sessions.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Why Persistent Memory Matters
        </h2>
        <p>
          Without memory, an AI agent is like a brilliant assistant with amnesia. The user has to re-explain their preferences, re-state project details, and re-establish context every single time. Persistent memory solves this by giving agents a knowledge base that grows over time.
        </p>
        <p>
          The key operations are simple: <strong>store</strong> memories, <strong>search</strong> for relevant ones, and <strong>manage</strong> them as context evolves. The challenge is doing this well — which is where a dedicated memory API comes in.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Setting Up MouseBase
        </h2>
        <p>
          First, sign up at <a href="https://mousebase.dev/signup" style={{ color: "var(--accent)" }}>mousebase.dev</a> and create a project. You'll get an API key. Then install the SDK:
        </p>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`# Python
pip install mousebase

# JavaScript
npm install mousebase`}</code>
        </pre>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Storing Memories
        </h2>
        <p>
          Memories are text snippets with optional metadata. Here's how to store user preferences:
        </p>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`from mousebase import MouseBase

client = MouseBase(api_key="your-key")

# Store user preferences
client.remember(
    "User prefers TypeScript and dark mode",
    external_id="user_123",
    metadata={"source": "onboarding", "category": "preferences"}
)

client.remember(
    "User is building a fintech chatbot",
    external_id="user_123",
    metadata={"source": "conversation"}
)`}</code>
        </pre>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`import MouseBase from "mousebase";

const client = new MouseBase({ apiKey: "your-key" });

await client.remember({
  content: "User prefers TypeScript and dark mode",
  externalId: "user_123",
  metadata: { source: "onboarding", category: "preferences" },
});`}</code>
        </pre>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Searching Memories
        </h2>
        <p>
          When the agent needs context, it searches for relevant memories:
        </p>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`# Search for relevant memories
results = client.search("What IDE does the user use?")

# results.results[0].content might return:
# "User prefers TypeScript and dark mode"

# Filter by metadata
results = client.search(
    "user preferences",
    metadata_filters={"category": "preferences"}
)`}</code>
        </pre>
        <p>
          MouseBase uses hybrid search — combining semantic similarity (embeddings), keyword matching (full-text search), metadata filtering, recency, and importance weighting. This gives better results than vector-only search.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Integrating with an Agent Framework
        </h2>
        <p>
          Here's a minimal agent loop that uses persistent memory:
        </p>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`from mousebase import MouseBase

client = MouseBase(api_key="your-key")

def agent_turn(user_message: str, user_id: str) -> str:
    # 1. Retrieve relevant memories
    memories = client.search(user_message, top_k=5)
    context = "\\n".join(m.content for m in memories.results)

    # 2. Generate response (using your LLM)
    response = call_llm(
        system_prompt=f"You are a helpful assistant.\\n\\nRelevant context:\\n{context}",
        user_message=user_message,
    )

    # 3. Store new memories from the conversation
    client.remember(
        f"User said: {user_message}",
        external_id=user_id,
        metadata={"source": "conversation"}
    )

    return response`}</code>
        </pre>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Managing Memory Lifecycle
        </h2>
        <p>
          Not all memories should live forever. MouseBase supports the full lifecycle:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
          <li><strong>Archive</strong> — retain for history, exclude from search</li>
          <li><strong>Expire</strong> — set a TTL for automatic cleanup</li>
          <li><strong>Delete</strong> — soft-delete with configurable retention</li>
        </ul>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`# Archive old memories
client.archive(memory_id="mem_abc123")

# Set expiration (auto-delete after 30 days)
client.remember(
    "Temporary session context",
    expires_at="2026-10-08T00:00:00Z"
)`}</code>
        </pre>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Next Steps
        </h2>
        <p>
          You now have an AI agent with persistent memory. It remembers user preferences, conversation history, and domain knowledge across sessions.
        </p>
        <p>
          Explore the full <a href="/docs" style={{ color: "var(--accent)" }}>API documentation</a> for advanced features like importance weighting, batch operations, and the Memory Explorer dashboard.
        </p>

        <div style={{ marginTop: 48, padding: 24, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border-default)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Try MouseBase Free</h3>
          <p style={{ marginBottom: 16 }}>
            5,000 memories, 3 projects, no credit card required.
          </p>
          <a href="/signup" style={{ display: "inline-block", padding: "10px 20px", background: "var(--accent)", color: "var(--bg-base)", borderRadius: 8, fontWeight: 600, textDecoration: "none" }}>
            Get Started
          </a>
        </div>
      </>
    ),
  },
  "introducing-mousebase": {
    content: (
      <>
        <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
          We're launching MouseBase — persistent memory infrastructure for AI agents and applications. Here's why we're building it and what it does.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          The Problem
        </h2>
        <p>
          Every AI developer faces the same problem: LLMs don't retain knowledge between conversations. Context windows are limited and temporary. Vector databases require significant infrastructure. Building from scratch means managing embedding pipelines, search, security, and storage.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          What MouseBase Does
        </h2>
        <p>
          MouseBase provides a hosted API for storing, searching, and managing long-term memories. You get:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
          <li><strong>Hybrid search</strong> — semantic + keyword + metadata + recency scoring</li>
          <li><strong>Memory lifecycle</strong> — soft-delete, archive, restore, expiration</li>
          <li><strong>SDKs</strong> — Python, JavaScript, with framework adapters for Next.js, Express, LangChain, and more</li>
          <li><strong>Dashboard</strong> — explore, filter, and manage memories visually</li>
          <li><strong>Auth & billing</strong> — project-scoped API keys, plan enforcement, Razorpay integration</li>
        </ul>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Get Started
        </h2>
        <p>
          The free tier includes 5,000 memories and 3 projects. Sign up at <a href="https://mousebase.dev/signup" style={{ color: "var(--accent)" }}>mousebase.dev</a> and start building agents that remember.
        </p>
      </>
    ),
  },
  "hybrid-search-for-ai-memory": {
    content: (
      <>
        <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
          Vector search is powerful, but it's not enough for AI memory retrieval. Here's why hybrid search — combining semantic, keyword, and metadata signals — gives consistently better results.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          The Limitation of Vector-Only Search
        </h2>
        <p>
          Embedding-based search excels at semantic similarity — finding memories with similar meaning. But it fails in common scenarios:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
          <li><strong>Exact terms</strong> — searching for "user_id=abc123" won't match an embedding of that literal string</li>
          <li><strong>Metadata queries</strong> — "show me memories from the onboarding flow" requires metadata filtering, not semantic matching</li>
          <li><strong>Recency</strong> — two memories with similar meaning should prefer the newer one</li>
        </ul>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          How Hybrid Search Works
        </h2>
        <p>
          MouseBase combines four signals with configurable weights:
        </p>
        <pre style={{ background: "var(--bg-elevated)", padding: 16, borderRadius: 8, marginBottom: 20, overflow: "auto" }}>
          <code>{`final_score =
    0.50 * semantic_score    # embedding cosine similarity
  + 0.20 * keyword_score     # PostgreSQL full-text search
  + 0.15 * importance_score  # user-defined priority (0-1)
  + 0.10 * metadata_match    # exact metadata key match
  + 0.05 * recency_score     # exponential decay (30-day half-life)`}</code>
        </pre>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Real-World Example
        </h2>
        <p>
          Consider a user who stores "I use VS Code with Copilot" and later searches "what editor do I use?".
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
          <li><strong>Semantic search</strong> finds it because "editor" and "VS Code" are semantically close</li>
          <li><strong>Keyword search</strong> boosts it because "use" appears in both query and memory</li>
          <li><strong>Metadata</strong> can boost memories tagged with "preferences"</li>
          <li><strong>Recency</strong> ensures newer, more relevant memories rank higher</li>
        </ul>

        <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
          Try It
        </h2>
        <p>
          Hybrid search is the default in MouseBase. Sign up at <a href="https://mousebase.dev/signup" style={{ color: "var(--accent)" }}>mousebase.dev</a> and experience the difference in your own agent.
        </p>
      </>
    ),
  },
};

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
  const post = slug ? getPostBySlug(slug) : undefined;
  const postData = slug ? postContent[slug] : undefined;

  if (!post || !postData) {
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
          datePublished: post.date,
          description: post.excerpt,
          url: `https://mousebase.dev/blog/${post.slug}`,
        }}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <Link to="/blog" style={{ fontSize: 14, color: "var(--text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 24 }}>
          ← Back to blog
        </Link>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{post.date}</div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          {post.title}
        </h1>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {post.tags.map((tag) => (
            <span key={tag} style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 12, color: "var(--text-muted)" }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          {postData.content}
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </article>
    </div>
  );
}
