import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

export default function About() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="About" description="About MouseBase — persistent memory for AI agents" path="/about" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>About MouseBase</h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", marginBottom: 20 }}>
            Memory is the missing layer of modern AI.
          </p>
          <p>
            Large language models can reason, but they don't naturally retain knowledge across conversations, users, or applications. Every serious AI product eventually needs a reliable memory layer—but building one means stitching together vector databases, embedding pipelines, metadata stores, and search infrastructure.
          </p>
          <p>
            MouseBase abstracts all of that behind a simple API.
          </p>
          <p>
            Store memories, retrieve them with semantic search, organize them by projects, and let your AI applications build long-term context without managing embeddings, vector databases, or infrastructure. Whether you're building AI agents, copilots, customer support systems, or autonomous workflows, MouseBase gives your applications persistent memory from day one.
          </p>
          <p>
            We're building developer-first infrastructure that's simple to integrate, scalable by design, and focused on one thing: making memory a native capability for every AI application. Built by developers. Designed for the future of AI.
          </p>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
