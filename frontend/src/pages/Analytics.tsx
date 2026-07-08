import { useEffect, useState } from "react";
import { dashboard, AnalyticsResponse } from "../lib/api";
import { FiBarChart2 } from "react-icons/fi";

function SimpleBarChart({ data, color, height = 120, labels }: { data: number[]; color: string; height?: number; labels?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, padding: "8px 0" }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: color, borderRadius: "4px 4px 0 0", minHeight: 4, opacity: 0.8 }} />
          {labels && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{labels[i]}</span>}
        </div>
      ))}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboard.analytics()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><p>Loading...</p></div>;

  const daily = data?.daily ?? [];
  const totals = data?.totals ?? { requests: 0, searches: 0, embeddings: 0, memories: 0, storage_bytes: 0 };

  const metrics = [
    { label: "Requests", value: formatNum(totals.requests), data: daily.map(d => d.requests), color: "var(--accent)" },
    { label: "Searches", value: formatNum(totals.searches), data: daily.map(d => d.searches), color: "var(--green)" },
    { label: "Embeddings", value: formatNum(totals.embeddings), data: daily.map(d => d.embeddings), color: "var(--yellow)" },
    { label: "Storage", value: formatBytes(totals.storage_bytes), data: daily.map(d => d.storage_bytes), color: "var(--red)" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Analytics</h1>
          <p>Usage metrics and performance insights.</p>
        </div>
      </div>

      <div className="metrics-grid">
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-card-header">
              <div className="metric-card-label" style={{ margin: 0 }}>{m.label}</div>
            </div>
            <div className="metric-card-value" style={{ fontSize: 22, marginBottom: 8 }}>{m.value}</div>
            <SimpleBarChart data={m.data} color={m.color} height={80} labels={daily.map(d => d.day)} />
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-header">
          <h3><FiBarChart2 /> Requests Over Time</h3>
        </div>
        <div className="card-body">
          <SimpleBarChart data={daily.map(d => d.requests)} color="var(--accent)" height={180} labels={daily.map(d => d.day)} />
        </div>
      </div>
    </div>
  );
}
