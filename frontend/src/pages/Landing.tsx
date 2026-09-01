import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight, FiSearch, FiDatabase, FiServer, FiLock, FiCode, FiGithub,
  FiTerminal, FiSave, FiBook, FiMessageCircle, FiCpu, FiHeadphones, FiHardDrive,
  FiLayers, FiCheck
} from "react-icons/fi";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
      });
    }

    let raf: number;
    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(245,197,66,${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(245,197,66,0.12)";
        ctx.fill();
      }

      raf = requestAnimationFrame(animate);
    }
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const features = [
    { icon: FiSearch, title: "Semantic Search", desc: "Store memories that remain searchable by meaning, not just keywords. Find relevant context instantly with natural language queries." },
    { icon: FiDatabase, title: "Vector Storage", desc: "Fast vector retrieval with pgvector indexing. Scale from thousands to millions of memories without sacrificing latency." },
    { icon: FiServer, title: "Namespace Isolation", desc: "Organize memories into isolated namespaces per user, project, or session. Keep data clean and scoped." },
    { icon: FiLock, title: "Secure by Default", desc: "API key authentication with full project isolation. Your data is encrypted in transit and at rest." },
    { icon: FiTerminal, title: "Simple SDK", desc: "Python SDK with a clean, intuitive API surface. Get started with two lines of code — no boilerplate." },
    { icon: FiLayers, title: "Multi-Modal Storage", desc: "Store text, embeddings, and rich metadata in a single memory entry. Attach context to every recollection." },
  ];

  const steps = [
    { icon: FiTerminal, step: "1", title: "Install", code: "pip install mousebase" },
    { icon: FiSave, step: "2", title: "Store", code: "client.remember(\"User prefers dark mode.\")" },
    { icon: FiSearch, step: "3", title: "Search", code: "client.search(\"What theme does the user like?\")" },
  ];

  const docSections = [
    { icon: FiTerminal, title: "Getting Started", desc: "Install the SDK, create an API key, and write your first memory in under 5 minutes." },
    { icon: FiCode, title: "SDK Reference", desc: "Complete Python SDK reference covering remember, search, forget, and namespace management." },
    { icon: FiServer, title: "REST API", desc: "RESTful API reference for direct HTTP access to the MouseBase memory platform." },
    { icon: FiBook, title: "Guides & Tutorials", desc: "Deep-dive guides on building chatbots, RAG pipelines, and AI agents with persistent memory." },
  ];

  const examples = [
    { icon: FiMessageCircle, title: "Chatbot", desc: "Remember user preferences, past conversations, and context across sessions for more natural interactions." },
    { icon: FiCpu, title: "RAG", desc: "Augment LLM responses with long-term context stored as retrievable semantic memories." },
    { icon: FiHeadphones, title: "Customer Support", desc: "Persist customer history, past issues, and preferences for intelligent routing and personalized support." },
    { icon: FiHardDrive, title: "AI Agent", desc: "Give your agent persistent memory across long-running tasks, tool calls, and multi-turn reasoning." },
  ];

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MouseBase",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Linux, macOS, Windows",
    "description": "Persistent memory infrastructure for AI agents. Store, search, and retrieve semantic memories with a simple API.",
    "url": "https://mousebase.dev",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier available"
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>
      <SEO
        title="MouseBase: Persistent Memory API for AI Agents"
        description="Store, search, inspect, and delete long-term memory for AI agents with a simple Python, JavaScript, or REST API backed by PostgreSQL and pgvector."
        path="/"
        jsonLd={softwareSchema}
      />
      {/* Animated BG */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      <PublicNav />

      {/* Hero */}
      <section style={{
        minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", position: "relative", zIndex: 1
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#090909", fontSize: 28, fontWeight: 700, marginBottom: 28,
          boxShadow: "0 0 40px rgba(245,197,66,0.15)"
        }}>M</div>

        <h1 style={{
          fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.05,
          color: "var(--text-primary)", maxWidth: 700, margin: "0 auto"
        }}>
          Persistent Memory<br />
          <span style={{ color: "var(--accent)" }}>for Production AI Agents</span>
        </h1>

        <p style={{
          marginTop: 20, fontSize: 17, color: "var(--text-secondary)",
          lineHeight: 1.6, maxWidth: 480, marginLeft: "auto", marginRight: "auto"
        }}>
          Store, retrieve, inspect, and delete scoped memories through one API. MouseBase gives Python and JavaScript applications semantic search, project isolation, metadata, and memory lifecycle controls — without building the storage layer yourself.
        </p>

        {/* Install snippet */}
        <div style={{
          marginTop: 24, width: "100%", maxWidth: 420,
          background: "#000", border: "1px solid var(--border-default)",
          borderRadius: 12, overflow: "hidden", textAlign: "left",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F56" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#27C93F" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6, fontFamily: "'JetBrains Mono',monospace" }}>terminal</span>
          </div>
          <pre style={{ padding: "12px 16px", fontSize: 13, lineHeight: 1.8, margin: 0, color: "#e4e4e4" }}>
            <code style={{ fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: "#98C379" }}>$</span> pip install mousebase</code>
          </pre>
          <pre style={{ padding: "0 16px 12px", fontSize: 13, lineHeight: 1.8, margin: 0, color: "#e4e4e4", borderTop: "1px solid var(--border-default)" }}>
            <code style={{ fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: "#98C379" }}>$</span> npm install mousebase</code>
          </pre>
        </div>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/login")} style={{
            background: "var(--accent)", color: "#090909", border: "none", borderRadius: 14,
            padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer",
            height: 48, display: "inline-flex", alignItems: "center", gap: 8,
            transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,197,66,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }} onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          >
            Get Started <FiArrowRight />
          </button>

          <a href="/docs" style={{
            border: "1px solid #2A2A2A", borderRadius: 14, padding: "12px 28px", height: 48,
            fontSize: 15, fontWeight: 500, color: "var(--text-primary)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#151515"; e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "var(--text-primary)"; }}
          >
            <FiCode /> View Documentation
          </a>
        </div>

        {/* Code block */}
        <div style={{
          marginTop: 64, width: "100%", maxWidth: 560,
          background: "#000", border: "1px solid var(--border-default)",
          borderRadius: 18, overflow: "hidden", textAlign: "left",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderBottom: "1px solid var(--border-default)", background: "var(--bg-elevated)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F56" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#27C93F" }} />
            <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8, fontFamily: "'JetBrains Mono',monospace" }}>POST /memories</span>
          </div>
          <pre style={{ padding: 20, fontSize: 13, lineHeight: 1.8, margin: 0, color: "#e4e4e4", overflow: "auto" }}>
<code style={{ fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: "#F5C542" }}>curl</span> -X POST https://api.mousebase.dev/api/v1/remember/ \<br/>
  <span style={{ color: "#F5C542" }}>-H</span> <span style={{ color: "#98C379" }}>"Authorization: Bearer mb_live_..."</span> \<br/>
  <span style={{ color: "#F5C542" }}>-H</span> <span style={{ color: "#98C379" }}>"Content-Type: application/json"</span> \<br/>
  <span style={{ color: "#F5C542" }}>-d</span> <span style={{ color: "#98C379" }}>{'{"user":"...","content":"User prefers dark mode."}'}</span></code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 48 }}>
          Why MouseBase?
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 18, padding: 24, transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,66,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,197,66,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 16, marginBottom: 14 }}>
                  <Icon />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{f.title}</h3>
                <p style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.desc}</p>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-default)", display: "flex", gap: 16, fontSize: 13, color: "var(--text-muted)" }}>
                  <span>Low latency</span>
                  <span>Auto-scaling</span>
                  <span>RESTful API</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it Works */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 16 }}>
          How it Works
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-secondary)", marginBottom: 52, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Three simple steps to give your AI persistent memory.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.step} style={{ textAlign: "center", background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 18, padding: 36, transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,66,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,197,66,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 20, margin: "0 auto 16px" }}>
                  <Icon />
                </div>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "var(--accent)",
                  color: "#090909", fontWeight: 700, fontSize: 14,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 12px"
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 12 }}>{s.title}</h3>
                <div style={{
                  background: "#000", border: "1px solid var(--border-default)",
                  borderRadius: 10, padding: "10px 14px", fontSize: 12,
                  fontFamily: "'JetBrains Mono',monospace", color: "#98C379",
                  textAlign: "left", overflow: "auto"
                }}>
                  {s.code}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 16 }}>
          Pricing
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-secondary)", marginBottom: 48, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          Start free. Scale when you need to.
        </p>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { name: "Free", price: "$0", features: ["5,000 memories", "50 searches/mo", "1 project", "100 req/hr"] },
            { name: "Hobby", price: "$3.99/mo", features: ["25,000 memories", "500 searches/mo", "3 projects", "500 req/hr"] },
            { name: "Pro", price: "$7.99/mo", features: ["250,000 memories", "5,000 searches/mo", "10 projects", "2,000 req/hr"] },
          ].map((plan, i) => (
            <div key={plan.name} style={{
              background: "var(--bg-card)", border: i === 2 ? "2px solid var(--accent)" : "1px solid var(--border-default)",
              borderRadius: 16, padding: 32, flex: "1 1 240px", maxWidth: 280,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{plan.name}</h3>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>{plan.price}</div>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, marginBottom: 8 }}>
                  <FiCheck style={{ color: "var(--accent)" }} /> {f}
                </div>
              ))}
              <button onClick={() => navigate("/signup")} style={{
                marginTop: 16, background: i === 2 ? "var(--accent)" : "transparent",
                color: i === 2 ? "#090909" : "var(--text-primary)",
                border: i === 2 ? "none" : "1px solid var(--border-default)",
                borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%",
              }}>
                Get Started
              </button>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a href="/pricing" style={{ color: "var(--accent)", fontSize: 14, textDecoration: "none" }}>Compare all plans →</a>
        </div>
      </section>

      {/* Documentation */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 16 }}>
          Documentation
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-secondary)", marginBottom: 48, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          Everything you need to integrate persistent memory into your AI stack.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
          {docSections.map((d) => {
            const Icon = d.icon;
            return (
              <a key={d.title} href="/docs" style={{
                background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 18, padding: 24,
                textDecoration: "none", transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)"
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,66,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,197,66,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 16, marginBottom: 14 }}>
                  <Icon />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{d.title}</h3>
                <p style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{d.desc}</p>
              </a>
            );
          })}
        </div>
      </section>

      {/* Examples */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 16 }}>
          Built for Every Use Case
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-secondary)", marginBottom: 48, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
          From chatbots to autonomous agents — MouseBase powers them all.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 20 }}>
          {examples.map((e) => {
            const Icon = e.icon;
            return (
              <div key={e.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border-default)", borderRadius: 18, padding: 24, transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(245,197,66,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(245,197,66,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 16, marginBottom: 14 }}>
                  <Icon />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{e.title}</h3>
                <p style={{ marginTop: 6, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{e.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
          Ready to give your AI a memory?
        </h2>
        <p style={{ marginTop: 12, fontSize: 15, color: "var(--text-secondary)", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
          Sign up free. No credit card required. Full API access from day one.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/login")} style={{
            background: "var(--accent)", color: "#090909", border: "none", borderRadius: 14,
            padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer",
            height: 48, display: "inline-flex", alignItems: "center", gap: 8,
            transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,197,66,0.25)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            Get Started Free <FiArrowRight />
          </button>
          <a href="https://github.com/Lumine8/MouseBase-AI" target="_blank" rel="noopener noreferrer" style={{
            border: "1px solid #2A2A2A", borderRadius: 14, padding: "12px 28px", height: 48,
            fontSize: 15, color: "var(--text-primary)", textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
            transition: "all 180ms"
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#151515"; e.currentTarget.style.borderColor = "var(--accent)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2A2A2A"; }}
          >
            <FiGithub style={{ fontSize: 18 }} /> Star on GitHub
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
