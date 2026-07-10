import PublicNav from "../../components/PublicNav";
import Footer from "../../components/Footer";
import SEO from "../../components/SEO";

const roles = [
  { title: "Founding Engineer", dept: "Engineering", location: "Remote" },
  { title: "Developer Experience Engineer", dept: "Engineering", location: "Remote" },
];

export default function Careers() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Careers" description="Join MouseBase — build the memory layer for AI" path="/careers" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Careers</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.6 }}>
          We're building the memory layer for AI. Work on hard infrastructure problems with a small, focused team.
        </p>
        {roles.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {roles.map((r) => (
              <div key={r.title} style={{
                background: "var(--bg-card)", border: "1px solid var(--border-default)",
                borderRadius: 12, padding: "16px 20px",
              }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{r.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{r.dept} · {r.location}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No open positions right now. Check back later.</p>
        )}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
