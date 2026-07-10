import { useEffect, useState } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { SkeletonLine } from "../components/Skeleton";

const checks = [
  { label: "API", endpoint: "/api/v1/health/" },
  { label: "Dashboard", endpoint: "/api/v1/auth/me" },
];

export default function Status() {
  const [results, setResults] = useState<{ label: string; status: "up" | "down" | "checking"; latency?: number }[]>(
    checks.map((c) => ({ label: c.label, status: "checking" }))
  );

  useEffect(() => {
    checks.forEach((c, i) => {
      const start = performance.now();
      fetch(c.endpoint, { method: "HEAD", signal: AbortSignal.timeout(10_000) })
        .then((res) => {
          setResults((prev) => {
            const next = [...prev];
            next[i] = { label: c.label, status: res.ok ? "up" : "down", latency: Math.round(performance.now() - start) };
            return next;
          });
        })
        .catch(() => {
          setResults((prev) => {
            const next = [...prev];
            next[i] = { label: c.label, status: "down" };
            return next;
          });
        });
    });
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Status" description="MouseBase system status" path="/status" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 540, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>System Status</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>Live status of MouseBase services.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.map((r) => (
            <div key={r.label} style={{
              background: "var(--bg-card)", border: "1px solid var(--border-default)",
              borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{r.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {r.status === "checking" ? (
                  <SkeletonLine width="60px" />
                ) : (
                  <>
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: r.status === "up" ? "#22c55e" : "#ef4444",
                    }} />
                    <span style={{ fontSize: 13, color: r.status === "up" ? "#22c55e" : "#ef4444", textTransform: "capitalize" }}>
                      {r.status}
                    </span>
                    {r.latency && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.latency}ms</span>}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 24 }}>
          For real-time incident history, visit <a href="https://status.mousebase.dev" style={{ color: "var(--accent)" }}>status.mousebase.dev</a>.
        </p>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
