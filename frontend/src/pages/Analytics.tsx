import { FiBarChart2 } from "react-icons/fi";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const chartBars = [40, 65, 45, 80, 55, 30, 70];
const searchBars = [25, 45, 35, 60, 40, 20, 50];
const latencyBars = [90, 85, 95, 80, 88, 92, 78];
const storageLine = [60, 62, 65, 68, 70, 73, 76];

function SimpleBarChart({ data, color, height = 120 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, padding: "8px 0" }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ width: "100%", height: `${(v / max) * 100}%`, background: color, borderRadius: "4px 4px 0 0", minHeight: 4, opacity: 0.8 }} />
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{days[i]}</span>
        </div>
      ))}
    </div>
  );
}

const metrics = [
  { label: "Requests / day", value: "13,924", data: chartBars, color: "var(--accent)" },
  { label: "Searches / day", value: "431", data: searchBars, color: "var(--green)" },
  { label: "Latency (ms)", value: "87 ms", data: latencyBars, color: "var(--yellow)" },
  { label: "Storage (GB)", value: "2.4 GB", data: storageLine, color: "var(--red)" },
];

export default function Analytics() {
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
            <SimpleBarChart data={m.data} color={m.color} height={80} />
          </div>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-header">
          <h3><FiBarChart2 /> Requests Over Time</h3>
        </div>
        <div className="card-body">
          <SimpleBarChart data={chartBars} color="var(--accent)" height={180} />
        </div>
      </div>
    </div>
  );
}
