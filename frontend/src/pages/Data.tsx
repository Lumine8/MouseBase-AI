import { useEffect, useState, useCallback } from "react";
import { FiDatabase, FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp, FiRefreshCw, FiExternalLink, FiInfo } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { data, TableInfo, TableRowsResponse } from "../lib/api";

type SortDir = "asc" | "desc";

export default function Data() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [activeTable, setActiveTable] = useState<string>("projects");
  const [rowsData, setRowsData] = useState<TableRowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await data.listTables();
        setTables(res.tables);
        if (res.tables.length > 0) {
          setActiveTable(res.tables[0].id);
        }
      } catch {
        setError("Failed to load tables");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const loadRows = useCallback(async () => {
    setRowsLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, per_page: 50 };
      if (search) params.search = search;
      if (sortCol) {
        params.sort = sortCol;
        params.order = sortDir;
      }
      const res = await data.getRows(activeTable, params);
      setRowsData(res);
    } catch {
      setRowsData(null);
      setError("Failed to load rows");
    } finally {
      setRowsLoading(false);
    }
  }, [activeTable, page, search, sortCol, sortDir]);

  useEffect(() => {
    if (activeTable) loadRows();
  }, [activeTable, loadRows]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
    setPage(1);
  };

  const switchTable = (id: string) => {
    setActiveTable(id);
    setPage(1);
    setSearch("");
    setSortCol(null);
    setSortDir("desc");
    setExpandedRow(null);
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val);
  };

  const truncate = (val: unknown, max = 60): string => {
    const s = formatValue(val);
    if (s.length > max) return s.slice(0, max) + "...";
    return s;
  };

  const activeInfo = tables.find((t) => t.id === activeTable);

  if (loading) {
    return <div className="page page-centered"><div className="spinner" /></div>;
  }

  return (
    <div className="page" style={{ maxWidth: "100%", padding: 0 }}>
      <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>

        {/* Table sidebar */}
        <div style={{
          width: 240, flexShrink: 0, borderRight: "1px solid var(--border-default)",
          display: "flex", flexDirection: "column", background: "var(--bg-base)",
        }}>
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid var(--border-default)" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FiDatabase size={16} /> Database
            </h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>
              {tables.length} tables
            </p>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
            {tables.map((t) => (
              <button
                key={t.id}
                onClick={() => switchTable(t.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", border: "none", background: activeTable === t.id ? "var(--bg-hover)" : "transparent",
                  color: "var(--text-primary)", cursor: "pointer", fontSize: 13, textAlign: "left",
                  borderLeft: activeTable === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >
                <span style={{ fontWeight: activeTable === t.id ? 600 : 400 }}>{t.label}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-card)", padding: "1px 6px", borderRadius: 8 }}>
                  {t.row_count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{
            padding: "12px 20px", borderBottom: "1px solid var(--border-default)",
            display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            background: "var(--bg-base)",
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, flex: 1, minWidth: 120 }}>
              {activeInfo?.label || activeTable}
              {rowsData && <span style={{ fontWeight: 400, color: "var(--text-muted)", fontSize: 12, marginLeft: 8 }}>
                {rowsData.total} rows
              </span>}
            </div>
            <div style={{ position: "relative", flex: 1, maxWidth: 320, minWidth: 160 }}>
              <FiSearch size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="input"
                style={{ paddingLeft: 32, fontSize: 13 }}
                placeholder="Search content..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <button onClick={loadRows} className="btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FiRefreshCw size={13} /> Refresh
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error" style={{ margin: "12px 20px 0" }}>{error}</div>
          )}

          {/* Table */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {rowsLoading ? (
              <div className="loading-center" style={{ height: 200 }}><div className="spinner" /></div>
            ) : rowsData && rowsData.rows.length > 0 ? (
              <table className="explorer-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ width: 32, padding: "8px 8px" }}></th>
                    {rowsData.columns.map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        style={{
                          padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 12,
                          color: sortCol === col ? "var(--accent)" : "var(--text-secondary)",
                          cursor: "pointer", whiteSpace: "nowrap", userSelect: "none",
                          borderBottom: "2px solid var(--border-default)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          {col}
                          {sortCol === col && (sortDir === "asc" ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsData.rows.map((row, i) => {
                    const rowNum = (rowsData.page - 1) * rowsData.per_page + i;
                    const isExpanded = expandedRow === rowNum;
                    return (
                      <tr key={i}>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-subtle)" }}>
                          <button
                            onClick={() => setExpandedRow(isExpanded ? null : rowNum)}
                            className="btn-ghost btn-sm"
                            style={{ padding: 2 }}
                          >
                            {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                          </button>
                        </td>
                        {rowsData.columns.map((col) => (
                          <td key={col} style={{
                            padding: "8px 12px", borderBottom: "1px solid var(--border-subtle)",
                            maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            color: col === "id" ? "var(--accent)" : col === "action" ? "var(--text-primary)" : undefined,
                            fontFamily: col === "id" || col === "project_id" ? "var(--font-mono, monospace)" : undefined,
                            fontSize: col === "content" ? 12 : 13,
                          }}>
                            {truncate(row[col])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state" style={{ marginTop: 60 }}>
                <div className="empty-state-icon"><FiInfo size={24} /></div>
                <p>No rows found</p>
                <div className="hint">{search ? "Try a different search term" : "This table is empty"}</div>
              </div>
            )}
          </div>

          {/* Expanded row detail */}
          {rowsData && expandedRow !== null && rowsData.rows[expandedRow - (rowsData.page - 1) * rowsData.per_page] && (
            <div style={{
              borderTop: "1px solid var(--border-default)", background: "var(--bg-card)",
              padding: "16px 20px", maxHeight: 240, overflow: "auto",
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Row Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 6 }}>
                {Object.entries(rowsData.rows[expandedRow - (rowsData.page - 1) * rowsData.per_page]).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", flexDirection: "column", gap: 1, padding: "4px 8px", background: "var(--bg-base)", borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{k}</span>
                    <span style={{ fontSize: 13, fontFamily: k.includes("id") ? "var(--font-mono, monospace)" : undefined, wordBreak: "break-all" }}>
                      {formatValue(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {rowsData && rowsData.total_pages > 1 && (
            <div style={{
              padding: "10px 20px", borderTop: "1px solid var(--border-default)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "var(--bg-base)", fontSize: 13,
            }}>
              <span style={{ color: "var(--text-secondary)" }}>
                Page {rowsData.page} of {rowsData.total_pages} ({rowsData.total} rows)
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <FiChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(rowsData.total_pages, p + 1))}
                  disabled={page >= rowsData.total_pages}
                  className="btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  Next <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
