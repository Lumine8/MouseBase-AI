import { useState } from "react";
import { SearchResult } from "../lib/api";
import SearchBox from "../components/SearchBox";
import { FiSearch } from "react-icons/fi";

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
              <p>{r.content}</p>
              {r.metadata && Object.keys(r.metadata).length > 0 && (
                <pre>{JSON.stringify(r.metadata, null, 2)}</pre>
              )}
              <div className="result-card-footer">
                <span>Score: {(r.score * 100).toFixed(1)}%</span>
                <span>{r.external_id ? `ID: ${r.external_id}` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
