import { useState, FormEvent } from "react";
import { api, SearchResult } from "../lib/api";
import { FiSearch } from "react-icons/fi";

interface Props {
  onResults: (results: SearchResult[]) => void;
  onError: (error: string) => void;
}

export default function SearchBox({ onResults, onError }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.search({ query: query.trim(), top_k: 10 });
      onResults(res.results);
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none", fontSize: 14 }}>
        <FiSearch />
      </span>
      <input className="input" style={{ paddingLeft: 36, paddingRight: 48 }} placeholder="Search memories..." value={query} onChange={(e) => setQuery(e.target.value)} />
      <button type="submit" style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", padding: "4px 8px", fontSize: 12, fontWeight: 500, color: "var(--accent)", background: "none", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
        {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "Go"}
      </button>
    </form>
  );
}
