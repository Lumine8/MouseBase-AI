import { useState } from "react";
import { SearchResult } from "../lib/api";
import SearchBox from "../components/SearchBox";
import { FiSearch } from "react-icons/fi";

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "var(--green)" : pct >= 60 ? "var(--yellow, #eab308)" : "var(--text-muted)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 120 }}>
      <div style={{ flex: 1, height: 6, background: "var(--bg-secondary)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Search</h1>
          <p>Semantically search your memories</p>
        </div>
      </div>

      <div style={{ maxWidth: 600, marginBottom: 32 }}>
        <SearchBox
          onResults={(r) => { setResults(r); setSearched(true); setError(null); }}
          onError={(e) => { setError(e); setSearched(true); }}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {searched && results.length === 0 && !error && (
        <div className="empty-state">
          <FiSearch size={32} />
          <p>No results found</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="results-list">
          {results.map((r) => (
            <div key={r.id} className="result-card">
              <p style={{ marginBottom: 8 }}>{r.content}</p>
              {r.metadata && Object.keys(r.metadata).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                  {Object.entries(r.metadata).slice(0, 4).map(([k, v]) => (
                    <span key={k} style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-secondary)", borderRadius: 12, color: "var(--text-muted)" }}>
                      {k}: {String(v).slice(0, 30)}
                    </span>
                  ))}
                </div>
              )}
              <div className="result-card-footer" style={{ justifyContent: "space-between" }}>
                <ScoreBar score={r.score} />
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  {r.external_id && <span>ID: {r.external_id}</span>}
                  {r.created_at && <span>{new Date(r.created_at).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
