const shimmer = `
  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
`;

const styleId = "skeleton-shimmer";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = shimmer;
  document.head.appendChild(style);
}

export function SkeletonLine({ width = "100%" }: { width?: string }) {
  return (
    <div
      style={{
        height: 14,
        width,
        borderRadius: 6,
        background: "linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-card) 50%, var(--bg-elevated) 75%)",
        backgroundSize: "400px 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: "var(--bg-card)", border: "1px solid var(--border-default)",
      borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-elevated)" }} />
      <SkeletonLine width="60%" />
      <SkeletonLine />
      <SkeletonLine width="80%" />
    </div>
  );
}

export function SkeletonMetricsGrid() {
  return (
    <div className="metrics-grid">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="metric-card" style={{ padding: 20 }}>
          <div className="metric-card-header">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-elevated)" }} />
          </div>
          <div style={{ height: 28, width: "40%", borderRadius: 6, background: "var(--bg-elevated)", marginTop: 12 }} />
          <div style={{ height: 14, width: "60%", borderRadius: 6, background: "var(--bg-elevated)", marginTop: 6 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonProjectGrid() {
  return (
    <div className="project-grid">
      {[1, 2, 3].map((i) => (
        <div key={i} className="project-card" style={{ padding: 20, minHeight: 100 }}>
          <div style={{ height: 18, width: "50%", borderRadius: 6, background: "var(--bg-elevated)" }} />
          <div style={{ height: 14, width: "80%", borderRadius: 6, background: "var(--bg-elevated)", marginTop: 10 }} />
          <div style={{ height: 14, width: "30%", borderRadius: 6, background: "var(--bg-elevated)", marginTop: 16 }} />
        </div>
      ))}
    </div>
  );
}
