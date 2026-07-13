import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, MemoryListItem, MemoryStats, Project, TimelineEntry } from "../lib/api";
import MemoryInspector from "../components/MemoryInspector";
import {
  FiSearch, FiChevronLeft, FiChevronRight, FiTrash2, FiDownload,
  FiArrowLeft, FiCheck, FiX, FiSettings, FiRefreshCw, FiClock,
  FiCpu, FiEdit, FiSearch as FiSearchIcon,
} from "react-icons/fi";

const ALL_COLUMNS = [
  { key: "content" as const, label: "Content" },
  { key: "external_id" as const, label: "External ID" },
  { key: "created_at" as const, label: "Created" },
  { key: "updated_at" as const, label: "Updated" },
  { key: "metadata" as const, label: "Metadata" },
];

type ColumnKey = "content" | "external_id" | "created_at" | "updated_at" | "metadata";

const COLUMN_KEYS: ColumnKey[] = ["content", "external_id", "created_at", "updated_at", "metadata"];

function formatDate(d: string) {
  const dt = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

export default function MemoryExplorer() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [memories, setMemories] = useState<MemoryListItem[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterExtId, setFilterExtId] = useState("");
  const [filterMeta, setFilterMeta] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [inspectorMemory, setInspectorMemory] = useState<MemoryListItem | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(["content", "external_id", "created_at"]);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"memories" | "timeline">("memories");
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [timelineTotal, setTimelineTotal] = useState(0);
  const [timelinePage, setTimelinePage] = useState(1);
  const [timelineTotalPages, setTimelineTotalPages] = useState(1);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const loadMemories = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = {
        page, per_page: perPage,
        sort_by: "created_at", sort_order: "desc",
      };
      if (searchQuery.trim()) params.content = searchQuery.trim();
      if (filterExtId.trim()) params.external_id = filterExtId.trim();
      if (filterMeta.trim()) params.metadata_filter = filterMeta.trim();
      if (filterDateFrom) params.date_from = filterDateFrom;
      if (filterDateTo) params.date_to = filterDateTo;

      const [memRes, statsRes, projRes] = await Promise.all([
        api.explorer.list(projectId, params),
        api.explorer.stats(projectId),
        api.projects.get(projectId).catch(() => null),
      ]);
      setMemories(memRes.memories);
      setTotal(memRes.total);
      setPage(memRes.page);
      setTotalPages(memRes.total_pages);
      setStats(statsRes);
      if (projRes) setProject(projRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load memories");
    } finally {
      setLoading(false);
    }
  }, [projectId, page, perPage, searchQuery, filterExtId, filterMeta, filterDateFrom, filterDateTo]);

  const loadTimeline = useCallback(async () => {
    if (!projectId) return;
    setLoadingTimeline(true);
    try {
      const res = await api.explorer.timeline(projectId, timelinePage);
      setTimeline(res.entries);
      setTimelineTotal(res.total);
      setTimelineTotalPages(res.total_pages);
    } catch {}
    finally { setLoadingTimeline(false); }
  }, [projectId, timelinePage]);

  useEffect(() => {
    if (view === "memories") loadMemories();
    else loadTimeline();
  }, [view, loadMemories, loadTimeline]);

  useEffect(() => { setSelected(new Set()); setSelectAll(false); }, [memories]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); loadMemories(); };

  const handleSelectAll = () => {
    if (selectAll) { setSelected(new Set()); setSelectAll(false); }
    else { setSelected(new Set(memories.map(m => m.id))); setSelectAll(true); }
  };

  const handleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
    setSelectAll(next.size === memories.length && memories.length > 0);
  };

  const handleBatchDelete = async () => {
    if (!projectId || selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} memories? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.explorer.batchDelete(projectId, Array.from(selected));
      setSelected(new Set());
      loadMemories();
    } catch { setError("Batch delete failed"); }
    finally { setBusy(false); }
  };

  const handleExport = async (fmt: string) => {
    if (!projectId || selected.size === 0) return;
    setBusy(true);
    try {
      const res = await api.explorer.export(projectId, Array.from(selected), fmt);
      let content = "";
      const filename = `memories-export-${Date.now()}`;
      if (fmt === "json") {
        content = JSON.stringify(res.memories, null, 2);
        download(content, `${filename}.json`, "application/json");
      } else if (fmt === "csv") {
        const headers = Object.keys(res.memories[0] || {});
        const rows = res.memories.map((m: Record<string, unknown>) =>
          headers.map(h => {
            const v = m[h];
            const s = v === null || v === undefined ? "" : String(v);
            return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
          }).join(",")
        );
        content = [headers.join(","), ...rows].join("\n");
        download(content, `${filename}.csv`, "text/csv");
      } else if (fmt === "ndjson") {
        content = res.memories.map((m: Record<string, unknown>) => JSON.stringify(m)).join("\n");
        download(content, `${filename}.ndjson`, "application/x-ndjson");
      }
    } catch { setError("Export failed"); }
    finally { setBusy(false); }
  };

  const handleMove = async () => {
    if (!projectId || selected.size === 0) return;
    const targetId = window.prompt("Enter target project ID:");
    if (!targetId) return;
    setBusy(true);
    try {
      await api.explorer.move(projectId, Array.from(selected), targetId);
      setSelected(new Set());
      loadMemories();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Move failed"); }
    finally { setBusy(false); }
  };

  const handleAddMetadata = async () => {
    if (!projectId || selected.size === 0) return;
    const key = window.prompt("Metadata key:");
    if (!key) return;
    const value = window.prompt(`Value for "${key}":`);
    if (value === null) return;
    setBusy(true);
    try {
      await api.explorer.batchAddMetadata(projectId, Array.from(selected), { [key]: value });
      loadMemories();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to add metadata"); }
    finally { setBusy(false); }
  };

  const handleDeleteOne = async (id: string) => {
    if (!window.confirm("Delete this memory?")) return;
    try { await api.memory.delete(id); loadMemories(); }
    catch {}
  };

  const handleInspectorUpdated = (updated: MemoryListItem) => {
    setMemories(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev =>
      prev.includes(key as ColumnKey) ? prev.filter(k => k !== key) : [...prev, key as ColumnKey]
    );
  };

  const renderCell = (m: MemoryListItem, key: ColumnKey) => {
    switch (key) {
      case "content": return <span className="explorer-cell-content">{m.content}</span>;
      case "external_id": return <span className="font-mono text-xs">{m.external_id || "—"}</span>;
      case "created_at": return <span className="explorer-cell-date">{formatDate(m.created_at)}</span>;
      case "updated_at": return <span className="explorer-cell-date">{formatDate(m.updated_at)}</span>;
      case "metadata":
        const entries = Object.entries(m.metadata || {});
        return entries.length === 0 ? <span className="text-gray-400">—</span> : (
          <span className="explorer-cell-meta">
            {entries.slice(0, 2).map(([k, v]) => (
              <span key={k} className="meta-chip">{k}: {String(v).slice(0, 20)}</span>
            ))}
            {entries.length > 2 && <span className="meta-chip">+{entries.length - 2}</span>}
          </span>
        );
    }
  };

  if (!projectId) return null;

  return (
    <div className="page" style={{ maxWidth: 1400 }}>
      <button onClick={() => navigate("/projects")} className="btn-ghost" style={{ marginBottom: 16 }}>
        <FiArrowLeft /> Back to projects
      </button>

      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1>{project?.name || "Memory Explorer"}</h1>
          <p>
            {total.toLocaleString()} memories
            {stats && <> · {formatBytes(stats.storage_bytes)}</>}
          </p>
        </div>
      </div>

      {stats && (
        <div className="explorer-stats">
          <div className="explorer-stat">
            <span className="explorer-stat-value">{formatNum(stats.total_memories)}</span>
            <span className="explorer-stat-label">Total</span>
          </div>
          <div className="explorer-stat">
            <span className="explorer-stat-value">{formatBytes(stats.storage_bytes)}</span>
            <span className="explorer-stat-label">Storage</span>
          </div>
          <div className="explorer-stat">
            <span className="explorer-stat-value">{stats.avg_memory_length}</span>
            <span className="explorer-stat-label">Avg chars</span>
          </div>
          <div className="explorer-stat">
            <span className="explorer-stat-value">{formatNum(stats.memories_created_today)}</span>
            <span className="explorer-stat-label">Today</span>
          </div>
          <div className="explorer-stat">
            <span className="explorer-stat-value">{formatNum(stats.searches_today)}</span>
            <span className="explorer-stat-label">Searches today</span>
          </div>
        </div>
      )}

      <div className="explorer-toolbar">
        <form onSubmit={handleSearch} className="explorer-search" style={{ flex: 1 }}>
          <FiSearch className="explorer-search-icon" />
          <input
            className="input explorer-search-input"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn-primary btn-sm" style={{ padding: "6px 16px", fontSize: 13 }}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Search"}
          </button>
        </form>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="tabs" style={{ margin: 0, padding: 3 }}>
            <button onClick={() => setView("memories")} className={`tab ${view === "memories" ? "active" : ""}`} style={{ padding: "6px 12px", fontSize: 12 }}>
              Memories
            </button>
            <button onClick={() => setView("timeline")} className={`tab ${view === "timeline" ? "active" : ""}`} style={{ padding: "6px 12px", fontSize: 12 }}>
              <FiClock /> Timeline
            </button>
          </div>
          {view === "memories" && <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary btn-sm ${showFilters ? "active" : ""}`}>
            <FiSettings /> Filters
          </button>}
          {view === "memories" && <div className="relative">
            <button onClick={() => setShowColumnSettings(!showColumnSettings)} className="btn-secondary btn-sm">
              Columns
            </button>
            {showColumnSettings && (
              <div className="explorer-dropdown">
                {COLUMN_KEYS.map(key => {
                  const col = ALL_COLUMNS.find(c => c.key === key)!;
                  return (
                    <label key={key} className="explorer-dropdown-item">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(key)}
                        onChange={() => toggleColumn(key)}
                      />
                      {col.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>}
        </div>
      </div>

      {showFilters && (
        <div className="explorer-filters">
          <div className="explorer-filter-group">
            <label>External ID</label>
            <input className="input" placeholder="user_123" value={filterExtId} onChange={(e) => setFilterExtId(e.target.value)} />
          </div>
          <div className="explorer-filter-group">
            <label>Metadata</label>
            <input className="input" placeholder="key:value" value={filterMeta} onChange={(e) => setFilterMeta(e.target.value)} />
          </div>
          <div className="explorer-filter-group">
            <label>From</label>
            <input className="input" type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} />
          </div>
          <div className="explorer-filter-group">
            <label>To</label>
            <input className="input" type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} />
          </div>
          <button onClick={() => { setFilterExtId(""); setFilterMeta(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); loadMemories(); }} className="btn-ghost btn-sm" style={{ alignSelf: "flex-end" }}>
            <FiRefreshCw /> Clear
          </button>
        </div>
      )}

      {selected.size > 0 && (
        <div className="explorer-bulk-bar">
          <span className="explorer-bulk-count"><FiCheck /> {selected.size} selected</span>
          <button onClick={handleBatchDelete} disabled={busy} className="btn-danger btn-sm">
            {busy ? <span className="spinner" /> : <><FiTrash2 /> Delete</>}
          </button>
          <button onClick={() => handleExport("json")} disabled={busy} className="btn-secondary btn-sm">
            <FiDownload /> Export JSON
          </button>
          <button onClick={() => handleExport("csv")} disabled={busy} className="btn-secondary btn-sm">
            <FiDownload /> CSV
          </button>
          <button onClick={() => handleExport("ndjson")} disabled={busy} className="btn-secondary btn-sm">
            <FiDownload /> NDJSON
          </button>
          <button onClick={handleMove} disabled={busy} className="btn-secondary btn-sm">
            Move
          </button>
          <button onClick={handleAddMetadata} disabled={busy} className="btn-secondary btn-sm">
            + Metadata
          </button>
          <button onClick={() => setSelected(new Set())} className="btn-ghost btn-sm">
            <FiX /> Clear
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {view === "timeline" ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header">
            <h3><FiClock /> Activity Timeline</h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{timelineTotal} events</span>
          </div>
          <div style={{ padding: 20 }}>
            {loadingTimeline ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : timeline.length === 0 ? (
              <div className="empty-state"><p>No activity yet</p></div>
            ) : (
              <div className="timeline">
                {timeline.map((entry) => (
                  <div key={entry.id} className="timeline-item">
                    <div className={`timeline-icon ${entry.action === "remember" || entry.action === "batch_add_metadata" ? "add" : entry.action === "patch" || entry.action === "move" ? "edit" : entry.action === "delete" || entry.action === "batch_delete" ? "delete" : "rotate"}`}>
                      {entry.action === "remember" || entry.action === "batch_add_metadata" ? <FiCpu size={14} /> : entry.action === "search" ? <FiSearchIcon size={14} /> : entry.action === "patch" || entry.action === "move" ? <FiEdit size={14} /> : <FiTrash2 size={14} />}
                    </div>
                    <div className="timeline-content">
                      <div className="title">
                        {entry.action === "remember" && "Memory stored"}
                        {entry.action === "search" && "Search performed"}
                        {entry.action === "patch" && "Memory updated"}
                        {entry.action === "delete" && "Memory deleted"}
                        {entry.action === "batch_delete" && `Batch deleted ${String(entry.details?.count ?? "")} memories`}
                        {entry.action === "batch_add_metadata" && `Metadata added to ${String(entry.details?.count ?? "")} memories`}
                        {entry.action === "move" && "Memories moved"}
                        {!["remember", "search", "patch", "delete", "batch_delete", "batch_add_metadata", "move"].includes(entry.action) && entry.action}
                      </div>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <div className="desc">
                          {String(entry.details?.content_preview ?? "") && <span>"{String(entry.details?.content_preview ?? "").slice(0, 80)}" </span>}
                          {String(entry.details?.query ?? "") && <span>Query: "{String(entry.details?.query ?? "").slice(0, 60)}" </span>}
                          {String(entry.details?.changed_fields ?? "") && <span>Changed: {String(entry.details?.changed_fields ?? "")} </span>}
                          {String(entry.details?.keys ?? "") && <span>Keys: {String(entry.details?.keys ?? "")} </span>}
                        </div>
                      )}
                      <div className="time">{formatDate(entry.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {timelineTotalPages > 1 && (
              <div className="explorer-pagination" style={{ marginTop: 16 }}>
                <span className="explorer-pagination-info">Page {timelinePage} of {timelineTotalPages}</span>
                <div className="explorer-pagination-buttons">
                  <button onClick={() => setTimelinePage(p => Math.max(1, p - 1))} disabled={timelinePage <= 1} className="btn-secondary btn-sm"><FiChevronLeft /> Prev</button>
                  <button onClick={() => setTimelinePage(p => Math.min(timelineTotalPages, p + 1))} disabled={timelinePage >= timelineTotalPages} className="btn-secondary btn-sm">Next <FiChevronRight /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
        <div className="explorer-table-wrap">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : memories.length === 0 ? (
          <div className="empty-state">
            <p>No memories found</p>
            <div className="hint">
              {searchQuery || filterExtId || filterMeta || filterDateFrom ? "Try adjusting your filters" : "Use the API to remember something"}
            </div>
          </div>
        ) : (
          <table className="explorer-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                </th>
                {COLUMN_KEYS.filter(c => visibleColumns.includes(c)).map(key => (
                  <th key={key}>{ALL_COLUMNS.find(c => c.key === key)!.label}</th>
                ))}
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {memories.map(m => (
                <tr
                  key={m.id}
                  className={`explorer-row ${selected.has(m.id) ? "selected" : ""}`}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => handleSelect(m.id)}
                    />
                  </td>
                  {COLUMN_KEYS.filter(c => visibleColumns.includes(c)).map(key => (
                    <td
                      key={key}
                      className={`explorer-cell ${key === "content" ? "explorer-cell-main" : ""}`}
                      onClick={() => setInspectorMemory(m)}
                    >
                      {renderCell(m, key)}
                    </td>
                  ))}
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="explorer-row-actions">
                      <button onClick={() => setInspectorMemory(m)} className="btn-ghost btn-sm" title="Inspect">View</button>
                      <button onClick={() => handleDeleteOne(m.id)} className="btn-ghost btn-sm" style={{ color: "var(--red)" }} title="Delete">
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="explorer-pagination">
          <span className="explorer-pagination-info">
            Page {page} of {totalPages} ({total.toLocaleString()} total)
          </span>
          <div className="explorer-pagination-buttons">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary btn-sm"
            >
              <FiChevronLeft /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 3, totalPages - 6));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`btn-sm ${p === page ? "btn-primary" : "btn-secondary"}`}
                  style={{ minWidth: 32 }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary btn-sm"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>
      )}
      </>)}
      {inspectorMemory && (
        <MemoryInspector
          memory={inspectorMemory}
          onClose={() => setInspectorMemory(null)}
          onEdit={() => {}}
          onDelete={handleDeleteOne}
          onUpdated={handleInspectorUpdated}
        />
      )}
    </div>
  );
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
