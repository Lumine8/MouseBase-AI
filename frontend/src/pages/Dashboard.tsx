import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  auth,
  dashboard,
  payments,
  Project,
  UserResponse,
  DashboardMetrics,
  AnalyticsResponse,
  SubscriptionInfo,
} from "../lib/api";
import {
  FiActivity,
  FiBook,
  FiDatabase,
  FiHardDrive,
  FiLayers,
  FiPieChart,
  FiPlay,
  FiPlus,
  FiSearch,
  FiStar,
  FiTrash2,
  FiDownload,
  FiInfo,
} from "react-icons/fi";
import { SkeletonMetricsGrid, SkeletonProjectGrid, SkeletonLine } from "../components/Skeleton";

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (localStorage.getItem("mb_token")) {
        auth.me().then(setUser).catch(() => {});
      }
      const results = await Promise.allSettled([
        api.projects.list(),
        dashboard.metrics(),
        dashboard.analytics(),
        payments.getSubscription(),
      ]);
      if (results[0].status === "fulfilled") setProjects(results[0].value);
      if (results[1].status === "fulfilled") setMetrics(results[1].value);
      if (results[2].status === "fulfilled") setAnalytics(results[2].value);
      if (results[3].status === "fulfilled") setSubscription(results[3].value);
      setLoading(false);
    };
    load();
  }, []);

  const storageBytes = analytics?.totals.storage_bytes ?? 0;

  const remainingMemories = subscription
    ? Math.max(0, subscription.max_memories - (metrics?.total_memories ?? 0))
    : null;
  const remainingSearches = subscription
    ? Math.max(0, subscription.max_searches_per_month - (metrics?.total_searches ?? 0))
    : null;

  const metricCards = metrics
    ? [
        { icon: FiSearch, color: "green", value: formatNum(metrics.total_searches), label: "Searches" },
        { icon: FiDatabase, color: "blue", value: formatNum(metrics.total_memories), label: "Memories Stored" },
        { icon: FiActivity, color: "yellow", value: formatNum(metrics.total_requests), label: "Today's Requests" },
        { icon: FiLayers, color: "red", value: formatNum(metrics.total_embeddings), label: "Embedding Usage" },
        { icon: FiHardDrive, color: "blue", value: formatBytes(storageBytes), label: "Storage Used" },
        { icon: FiStar, color: "green", value: metrics.plan.charAt(0).toUpperCase() + metrics.plan.slice(1), label: "Current Plan" },
        {
          icon: FiPieChart,
          color: "yellow",
          value:
            remainingMemories !== null && remainingSearches !== null
              ? `${formatNum(remainingMemories)} mem, ${formatNum(remainingSearches)} srch`
              : "N/A",
          label: "Remaining Quota",
        },
      ]
    : [];

  const planLimits = subscription
    ? [
        { label: "Memories", used: metrics?.total_memories ?? 0, max: subscription.max_memories },
        { label: "Searches", used: metrics?.total_searches ?? 0, max: subscription.max_searches_per_month },
        { label: "Projects", used: projects.length, max: subscription.max_projects },
      ]
    : [];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Welcome{user?.full_name ? `, ${user.full_name}` : " back"}.</h1>
          {loading ? <SkeletonLine width="120px" /> : <p>{projects.length} project{projects.length !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      {loading ? <SkeletonMetricsGrid /> : (
        <div className="metrics-grid">
          {metricCards.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="metric-card">
                <div className="metric-card-header">
                  <div className={`metric-card-icon ${m.color}`}><Icon /></div>
                </div>
                <div className="metric-card-value">{m.value}</div>
                <div className="metric-card-label">{m.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {planLimits.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div className="page-header-left">
              <h1>Usage</h1>
            </div>
          </div>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
            }}
          >
            {planLimits.map((item) => {
              const pct = item.max > 0 ? Math.min((item.used / item.max) * 100, 100) : 0;
              return (
                <div key={item.label} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {formatNum(item.used)} / {formatNum(item.max)}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct > 90
                            ? "var(--red)"
                            : pct > 70
                              ? "var(--yellow)"
                              : "var(--accent)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div className="page-header-left">
            <h1>Quick Actions</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/projects")}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <FiPlus /> Create Project
          </button>
          <button
            onClick={() => navigate("/playground")}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <FiPlay /> Go to Playground
          </button>
          <button
            onClick={() => window.open("https://docs.mousebase.ai", "_blank")}
            className="btn-secondary"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <FiBook /> View Docs
          </button>
        </div>
      </div>

      {loading ? <SkeletonProjectGrid /> : projects.length > 0 ? (
        <div style={{ marginTop: 32 }}>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div className="page-header-left">
              <h1>Your Projects</h1>
            </div>
          </div>
          <div className="project-grid">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="project-card"
              >
                <h3>{p.name}</h3>
                {p.description && <p>{p.description}</p>}
                <div className="project-card-footer">
                  <span className="project-card-badge">{p.api_key_id}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 32 }}>
          <div className="empty-state">
            <div className="empty-state-icon"><FiDatabase /></div>
            <p>No projects yet</p>
            <div className="hint">Create your first project to get started.</div>
            <button
              onClick={() => navigate("/projects")}
              className="btn-primary"
              style={{ marginTop: 16 }}
            >
              <FiPlus /> Create Project
            </button>
          </div>
        </div>
      )}

      {/* Privacy actions */}
      <div style={{ marginTop: 32 }}>
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div className="page-header-left">
            <h1>Data & Privacy</h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/privacy/export")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiDownload /> Export My Data
          </button>
          <button onClick={() => navigate("/privacy/deletion")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8, color: "#ef4444" }}>
            <FiTrash2 /> Request Deletion
          </button>
          <button onClick={() => navigate("/privacy/retention")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiInfo /> Data Retention
          </button>
        </div>
      </div>
    </div>
  );
}
