import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "What Is AI Memory?",
  description: "An explanation of persistent memory for AI applications — what it is, why it matters, and how it works.",
  url: "https://mousebase.dev/ai-memory",
};

export default function AIMemory() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO
        title="What Is AI Memory?"
        description="Persistent memory for AI applications — what it is, why context windows aren't enough, and how to give AI agents long-term memory."
        path="/ai-memory"
        jsonLd={jsonLd}
      />
      <PublicNav />
      <article className="page" style={{ paddingTop: 100, maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>
          What Is AI Memory?
        </h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            AI memory is the ability of an AI system to retain and retrieve information across sessions, conversations, and interactions. It transforms AI from stateless reasoning engines into systems that build context over time.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Why Context Windows Aren't Enough
          </h2>
          <p>
            Large language models have context windows — the amount of text they can process in a single request. As of 2025, these windows range from 8K to 1M+ tokens. But context windows have fundamental limitations:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>They're temporary.</strong> Context is lost when the session ends. A chatbot that helped you yesterday starts from zero today.</li>
            <li><strong>They're expensive.</strong> Larger context windows mean higher token costs. Storing 100K tokens of history for every request is wasteful.</li>
            <li><strong>They're noisy.</strong> Dumping entire conversation histories into context reduces retrieval quality. The model has to find relevant information among irrelevant content.</li>
            <li><strong>They don't scale.</strong> A user with 1,000 interactions can't fit their history into any context window. Even if they could, the model's performance degrades with length.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            What Persistent Memory Solves
          </h2>
          <p>
            Persistent memory decouples "what the AI knows" from "what fits in the current prompt." Instead of cramming everything into context, the application stores memories and retrieves only the relevant ones for each interaction.
          </p>
          <p>
            This means:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li>A chatbot remembers your preferences across months of conversations.</li>
            <li>An AI agent retains task context between execution steps.</li>
            <li>A customer support system recalls past resolutions without re-asking questions.</li>
            <li>A copilot understands your codebase patterns from previous sessions.</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            How AI Memory Works
          </h2>
          <p>
            The basic pattern is <strong>store → retrieve → inject</strong>:
          </p>
          <p>
            <strong>1. Store.</strong> When something worth remembering happens, the application sends it to a memory system. The memory is embedded (converted to a vector), stored with metadata, and indexed for search.
          </p>
          <p>
            <strong>2. Retrieve.</strong> Before each interaction, the application searches for relevant memories. Modern systems use hybrid search — combining semantic similarity (vector search), keyword matching, metadata filtering, and recency signals.
          </p>
          <p>
            <strong>3. Inject.</strong> The retrieved memories are included in the LLM prompt alongside the current conversation. The model uses this context to provide more relevant, personalized responses.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Types of AI Memory
          </h2>
          <p>
            Different applications need different types of memory:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>User preferences</strong> — "User prefers dark mode," "User likes concise responses."</li>
            <li><strong>Facts and entities</strong> — "Project deadline is March 15," "User works at Acme Corp."</li>
            <li><strong>Conversation history</strong> — Summaries or key points from previous conversations.</li>
            <li><strong>Task context</strong> — "Last analysis found 3 critical issues," "Database migration is at step 4 of 7."</li>
            <li><strong>Learned patterns</strong> — "User always asks for TypeScript examples," "This customer prefers email over chat."</li>
          </ul>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Building vs Using Memory Infrastructure
          </h2>
          <p>
            You can build memory infrastructure from scratch using a vector database, or use a dedicated memory service. Building from scratch gives you full control but requires significant engineering: embedding pipelines, search infrastructure, metadata stores, authentication, and multi-tenant isolation.
          </p>
          <p>
            Dedicated memory services (like <a href="/what-is-mousebase" style={{ color: "var(--accent)" }}>MouseBase</a>) provide the complete stack — store, search, manage, and retrieve — through a simple API. This lets you focus on your application logic rather than memory infrastructure.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)", marginTop: 40, marginBottom: 12 }}>
            Key Considerations
          </h2>
          <p>
            When implementing AI memory, consider:
          </p>
          <ul style={{ paddingLeft: 20, marginBottom: 20 }}>
            <li><strong>Search quality</strong> — Hybrid search (semantic + keyword + metadata + recency) outperforms pure vector search for most use cases.</li>
            <li><strong>Staleness</strong> — Memories can become outdated. Systems need mechanisms for updating, archiving, or expiring old memories.</li>
            <li><strong>Deduplication</strong> — Without deduplication, the same fact gets stored multiple times, degrading search quality.</li>
            <li><strong>Privacy</strong> — Memory systems store sensitive information. Access control, encryption, and deletion guarantees are essential.</li>
            <li><strong>Cost</strong> — Embedding and storing every interaction is expensive. Applications need to decide what's worth remembering.</li>
          </ul>

          <div style={{ marginTop: 40, padding: 16, background: "var(--bg-elevated)", borderRadius: 8 }}>
            <p style={{ margin: 0 }}>
              <strong>Ready to add memory to your AI application?</strong> <a href="https://mousebase.dev/signup" style={{ color: "var(--accent)" }}>Sign up for MouseBase</a> — 5,000 memories free. See the <a href="/docs/quickstart" style={{ color: "var(--accent)" }}>quickstart guide</a> for a 5-minute integration.
            </p>
          </div>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </article>
    </div>
  );
}
