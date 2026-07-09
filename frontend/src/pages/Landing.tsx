import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight, FiSearch, FiDatabase, FiServer, FiLock, FiCode, FiGithub,
  FiTerminal, FiSave, FiBook, FiMessageCircle, FiCpu, FiHeadphones, FiHardDrive,
  FiCheck, FiStar, FiZap, FiBriefcase, FiLayers
} from "react-icons/fi";
import PublicNav from "../components/PublicNav";

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

  const plans = [
    {
      name: "Free", price: "$0", period: "forever", icon: FiZap, features: [
        "1,000 memories", "1 namespace", "7-day retention", "REST API access", "Community support"
      ]
    },
    {
      name: "Pro", price: "$19", period: "/month", icon: FiStar, featured: true, features: [
        "100,000 memories", "10 namespaces", "90-day retention", "Priority support", "Metadata filtering"
      ]
    },
    {
      name: "Enterprise", price: "Custom", period: "", icon: FiBriefcase, features: [
        "Unlimited memories", "Unlimited namespaces", "Custom retention", "Dedicated support", "On-premise deployment"
      ]
    },
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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative", overflow: "hidden" }}>
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
          <span style={{ color: "var(--accent)" }}>for AI Applications</span>
        </h1>

        <p style={{
          marginTop: 20, fontSize: 17, color: "var(--text-secondary)",
          lineHeight: 1.6, maxWidth: 480, marginLeft: "auto", marginRight: "auto"
        }}>
          Store, search, and retrieve long-term memory for AI agents and applications.
        </p>

        {/* Install snippet */}
        <div style={{
          marginTop: 24, width: "100%", maxWidth: 380,
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
          <pre style={{ padding: "12px 16px", fontSize: 13, lineHeight: 1.6, margin: 0, color: "#e4e4e4" }}>
            <code style={{ fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: "#98C379" }}>$</span> pip install mousebase</code>
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
<code style={{ fontFamily: "'JetBrains Mono',monospace" }}><span style={{ color: "#F5C542" }}>curl</span> -X POST https://api.mousebase.dev/v1/remember/ \<br/>
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
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 100px", position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: "center", letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 16 }}>
          Simple Pricing
        </h2>
        <p style={{ textAlign: "center", fontSize: 15, color: "var(--text-secondary)", marginBottom: 48, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
          Start free, scale as you grow. No hidden fees.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, alignItems: "start" }}>
          {plans.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} style={{
                background: "var(--bg-card)", border: p.featured ? "1px solid var(--accent)" : "1px solid var(--border-default)",
                borderRadius: 18, padding: 32, textAlign: "center",
                transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)",
                position: "relative", ...(p.featured ? { boxShadow: "0 0 30px rgba(245,197,66,0.08)" } : {})
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 24px rgba(245,197,66,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = p.featured ? "0 0 30px rgba(245,197,66,0.08)" : "none"; }}
              >
                {p.featured && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: "var(--accent)", color: "#090909", fontSize: 11, fontWeight: 600,
                    padding: "4px 14px", borderRadius: 20
                  }}>
                    Most Popular
                  </div>
                )}
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,197,66,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 18, margin: "0 auto 16px" }}>
                  <Icon />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{p.name}</h3>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "var(--text-primary)" }}>{p.price}</span>
                  {p.period && <span style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }}>{p.period}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 24 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                      <FiCheck style={{ color: "var(--accent)", fontSize: 14, flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate("/login")} style={{
                  width: "100%", background: p.featured ? "var(--accent)" : "transparent",
                  color: p.featured ? "#090909" : "var(--text-primary)",
                  border: p.featured ? "none" : "1px solid #2A2A2A",
                  borderRadius: 12, padding: "10px 0", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", transition: "all 180ms cubic-bezier(0.25,0.1,0.25,1)"
                }}
                  onMouseEnter={(e) => {
                    if (p.featured) { e.currentTarget.style.background = "var(--accent-hover)"; } else { e.currentTarget.style.background = "#151515"; e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }
                  }}
                  onMouseLeave={(e) => {
                    if (p.featured) { e.currentTarget.style.background = "var(--accent)"; } else { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2A2A2A"; e.currentTarget.style.color = "var(--text-primary)"; }
                  }}
                >
                  {p.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            );
          })}
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
          <a href="https://github.com/anomalyco/MouseBase" target="_blank" rel="noopener noreferrer" style={{
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

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-default)", padding: "24px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        maxWidth: 1100, margin: "0 auto", flexWrap: "wrap", gap: 16,
        position: "relative", zIndex: 1, fontSize: 13, color: "var(--text-muted)"
      }}>
        <span>MouseBase — Persistent Memory for AI Applications</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="/docs" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Documentation</a>
          <a href="https://github.com/anomalyco/MouseBase" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none" }}>GitHub</a>
          <a href="https://pypi.org/project/mousebase/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-muted)", textDecoration: "none" }}>PyPI</a>
        </div>
      </footer>
    </div>
  );
}
