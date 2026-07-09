import { useState } from "react";
import { api, RememberResponse, Memory, SearchResponse } from "../lib/api";
import { FiCpu, FiSearch, FiEye, FiEdit, FiTrash2, FiCopy, FiLoader, FiKey, FiEyeOff, FiChevronDown, FiChevronUp, FiTerminal } from "react-icons/fi";

type Tab = "remember" | "search" | "get" | "update" | "delete";

interface CodeExample { lang: string; label: string; code: string; }

const tabIcons: Record<Tab, React.ReactNode> = {
  remember: <FiCpu />,
  search: <FiSearch />,
  get: <FiEye />,
  update: <FiEdit />,
  delete: <FiTrash2 />,
};

const LANGUAGE_OPTIONS = [
  { lang: "python", label: "Python" },
  { lang: "javascript", label: "JavaScript" },
  { lang: "curl", label: "cURL" },
];

export default function Playground() {
  const [tab, setTab] = useState<Tab>("remember");
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem("mb_api_key") ?? "");
  const [showKey, setShowKey] = useState(false);
  const [codeLang, setCodeLang] = useState("python");
  const [responseOpen, setResponseOpen] = useState(true);

  const handleKeyChange = (val: string) => {
    setApiKeyInput(val);
    localStorage.setItem("mb_api_key", val);
  };
  const [remContent, setRemContent] = useState("");
  const [remExtId, setRemExtId] = useState("");
  const [remResult, setRemResult] = useState<RememberResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTopK, setSearchTopK] = useState(10);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [getMemoryId, setGetMemoryId] = useState("");
  const [getResult, setGetResult] = useState<Memory | null>(null);
  const [updMemoryId, setUpdMemoryId] = useState("");
  const [updContent, setUpdContent] = useState("");
  const [updResult, setUpdResult] = useState<Memory | null>(null);
  const [delMemoryId, setDelMemoryId] = useState("");
  const [delDone, setDelDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeKey = apiKeyInput || localStorage.getItem("mb_api_key") || undefined;

  const handleRemember = async () => {
    setError(""); setLoading(true);
    try { const r = await api.remember({ content: remContent, external_id: remExtId || null, metadata: {} }, activeKey); setRemResult(r); setResponseOpen(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    setError(""); setLoading(true);
    try { const r = await api.search({ query: searchQuery, top_k: searchTopK }, activeKey); setSearchResult(r); setResponseOpen(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleGet = async () => {
    setError(""); setLoading(true);
    try { const r = await api.memory.get(getMemoryId, activeKey); setGetResult(r); setResponseOpen(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setError(""); setLoading(true);
    try { const r = await api.memory.update(updMemoryId, { content: updContent || null }, activeKey); setUpdResult(r); setResponseOpen(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setError(""); setLoading(true);
    try { await api.memory.delete(delMemoryId, activeKey); setDelDone(true); setResponseOpen(true); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const apiKey = apiKeyInput || localStorage.getItem("mb_api_key") || "YOUR_API_KEY";
  const baseUrl = window.location.origin.replace(/:\d+$/, "") + ":8000/api/v1";

  const examples: Record<Tab, CodeExample[]> = {
    remember: [
      { lang: "curl", label: "cURL",
        code: `curl -X POST ${baseUrl}/remember/ \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "${remContent || "The user clicked the settings page."}"}'` },
      { lang: "python", label: "Python",
        code: `import httpx\n\nresponse = httpx.post(\n    "${baseUrl}/remember/",\n    headers={"Authorization": "Bearer ${apiKey}"},\n    json={"content": "${remContent || "The user clicked the settings page."}"},\n)\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript",
        code: `const response = await fetch("${baseUrl}/remember/", {\n  method: "POST",\n  headers: { Authorization: "Bearer ${apiKey}", "Content-Type": "application/json" },\n  body: JSON.stringify({ content: "${remContent || "The user clicked the settings page."}" }),\n});\nconst data = await response.json();\nconsole.log(data);` },
    ],
    search: [
      { lang: "curl", label: "cURL",
        code: `curl -X POST ${baseUrl}/search/ \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "${searchQuery || "user settings page"}", "top_k": ${searchTopK}}'` },
      { lang: "python", label: "Python",
        code: `import httpx\n\nresponse = httpx.post(\n    "${baseUrl}/search/",\n    headers={"Authorization": "Bearer ${apiKey}"},\n    json={"query": "${searchQuery || "user settings page"}", "top_k": ${searchTopK}},\n)\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript",
        code: `const response = await fetch("${baseUrl}/search/", {\n  method: "POST",\n  headers: { Authorization: "Bearer ${apiKey}", "Content-Type": "application/json" },\n  body: JSON.stringify({ query: "${searchQuery || "user settings page"}", top_k: ${searchTopK} }),\n});\nconst data = await response.json();\nconsole.log(data);` },
    ],
    get: [
      { lang: "curl", label: "cURL", code: `curl ${baseUrl}/memory/${getMemoryId || "<memory_id>"} \\\n  -H "Authorization: Bearer ${apiKey}"` },
      { lang: "python", label: "Python", code: `import httpx\n\nresponse = httpx.get("${baseUrl}/memory/${getMemoryId || "<memory_id>"}", headers={"Authorization": "Bearer ${apiKey}"})\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript", code: `const response = await fetch("${baseUrl}/memory/${getMemoryId || "<memory_id>"}", { headers: { Authorization: "Bearer ${apiKey}" } });\nconst data = await response.json();\nconsole.log(data);` },
    ],
    update: [
      { lang: "curl", label: "cURL", code: `curl -X PATCH ${baseUrl}/memory/${updMemoryId || "<memory_id>"} \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "${updContent || "Updated content."}"}'` },
      { lang: "python", label: "Python", code: `import httpx\n\nresponse = httpx.patch("${baseUrl}/memory/${updMemoryId || "<memory_id>"}", headers={"Authorization": "Bearer ${apiKey}"}, json={"content": "${updContent || "Updated content."}"})\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript", code: `const response = await fetch("${baseUrl}/memory/${updMemoryId || "<memory_id>"}", { method: "PATCH", headers: { Authorization: "Bearer ${apiKey}", "Content-Type": "application/json" }, body: JSON.stringify({ content: "${updContent || "Updated content."}" }) });\nconst data = await response.json();\nconsole.log(data);` },
    ],
    delete: [
      { lang: "curl", label: "cURL", code: `curl -X DELETE ${baseUrl}/memory/${delMemoryId || "<memory_id>"} \\\n  -H "Authorization: Bearer ${apiKey}"` },
      { lang: "python", label: "Python", code: `import httpx\n\nresponse = httpx.delete("${baseUrl}/memory/${delMemoryId || "<memory_id>"}", headers={"Authorization": "Bearer ${apiKey}"})\nprint(response.status_code)` },
      { lang: "javascript", label: "JavaScript", code: `await fetch("${baseUrl}/memory/${delMemoryId || "<memory_id>"}", { method: "DELETE", headers: { Authorization: "Bearer ${apiKey}" } });` },
    ],
  };

  const currentExamples = examples[tab];
  const activeExample = currentExamples.find((e) => e.lang === codeLang) ?? currentExamples[0];

  const handleCopyCode = () => {
    if (activeExample) { navigator.clipboard.writeText(activeExample.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setError("");
  };

  let responseContent: React.ReactNode = null;
  const hasResponse = (tab === "remember" && remResult) || (tab === "search" && searchResult) || (tab === "get" && getResult) || (tab === "update" && updResult) || (tab === "delete" && delDone);

  if (tab === "remember" && remResult) responseContent = <pre>{JSON.stringify(remResult, null, 2)}</pre>;
  if (tab === "search" && searchResult) responseContent = <pre>{JSON.stringify(searchResult, null, 2)}</pre>;
  if (tab === "get" && getResult) responseContent = <pre>{JSON.stringify(getResult, null, 2)}</pre>;
  if (tab === "update" && updResult) responseContent = <pre>{JSON.stringify(updResult, null, 2)}</pre>;
  if (tab === "delete" && delDone) responseContent = <div className="alert alert-success" style={{ margin: 0 }}>Memory deleted successfully (204 No Content).</div>;

  return (
    <div className="page" style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Playground</h1>
          <p>Test the Mouse<span style={{ color: "var(--accent)" }}>Base</span> API with live requests and view code examples.</p>
        </div>
      </div>

      <div className="api-key-bar" style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--bg-card)", borderRadius: 12,
        border: "1px solid var(--border-default)", padding: "10px 16px",
        marginBottom: 16,
      }}>
        <FiKey style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <input
          className="input flex-1"
          style={{ fontSize: 13, fontFamily: "monospace" }}
          placeholder="Enter your API key..."
          value={apiKeyInput}
          onChange={(e) => handleKeyChange(e.target.value)}
          type={showKey ? "text" : "password"}
        />
        <button onClick={() => setShowKey(!showKey)} className="btn-ghost btn-sm" title={showKey ? "Hide" : "Show"}>
          {showKey ? <FiEyeOff /> : <FiEye />}
        </button>
        {!apiKeyInput && (
          <span style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            No key set
          </span>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
      }}>
        <FiTerminal style={{ color: "var(--text-muted)", fontSize: 14, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginRight: 4 }}>
          Language:
        </span>
        {LANGUAGE_OPTIONS.map((opt) => (
          <button key={opt.lang} onClick={() => setCodeLang(opt.lang)}
            style={{
              padding: "5px 14px", fontSize: 13, fontWeight: 500, borderRadius: 8,
              border: `1px solid ${codeLang === opt.lang ? "var(--accent)" : "var(--border-input)"}`,
              background: codeLang === opt.lang ? "rgba(245,197,66,0.08)" : "transparent",
              color: codeLang === opt.lang ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 150ms ease",
            }}>
            {opt.label}
          </button>
        ))}
      </div>

      <div className="tabs">
        {(["remember", "search", "get", "update", "delete"] as Tab[]).map((t) => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`tab${tab === t ? " active" : ""}`}>
            {tabIcons[t]}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div className="card" style={{ padding: 20, flex: "0 0 420px", alignSelf: "flex-start" }}>
          <div className="section-title" style={{ marginBottom: 16, fontSize: 14 }}>Request</div>

          {tab === "remember" && (
            <>
              <div className="form-group">
                <label className="label">Content</label>
                <textarea className="input" placeholder="Remember something..." value={remContent} onChange={(e) => setRemContent(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">External ID <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
                <input className="input" placeholder="event_123" value={remExtId} onChange={(e) => setRemExtId(e.target.value)} />
              </div>
              <button onClick={handleRemember} disabled={loading || !remContent.trim()} className="btn-primary btn-full">
                {loading ? <FiLoader className="spinner" /> : <><FiCpu /> Remember Memory</>}
              </button>
            </>
          )}

          {tab === "search" && (
            <>
              <div className="form-group">
                <label className="label">Query</label>
                <textarea className="input" placeholder="Search memories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Top K <span style={{ color: "var(--text-muted)" }}>(1-100)</span></label>
                <input type="number" className="input" min={1} max={100} value={searchTopK} onChange={(e) => setSearchTopK(Number(e.target.value))} />
              </div>
              <button onClick={handleSearch} disabled={loading || !searchQuery.trim()} className="btn-primary btn-full">
                {loading ? <FiLoader className="spinner" /> : <><FiSearch /> Search</>}
              </button>
            </>
          )}

          {tab === "get" && (
            <>
              <div className="form-group">
                <label className="label">Memory ID</label>
                <input className="input" placeholder="00000000-0000-0000-0000-000000000000" value={getMemoryId} onChange={(e) => setGetMemoryId(e.target.value)} />
              </div>
              <button onClick={handleGet} disabled={loading || !getMemoryId.trim()} className="btn-primary btn-full">
                {loading ? <FiLoader className="spinner" /> : <><FiEye /> Get Memory</>}
              </button>
            </>
          )}

          {tab === "update" && (
            <>
              <div className="form-group">
                <label className="label">Memory ID</label>
                <input className="input" placeholder="00000000-0000-0000-0000-000000000000" value={updMemoryId} onChange={(e) => setUpdMemoryId(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">New Content</label>
                <textarea className="input" placeholder="Updated content..." value={updContent} onChange={(e) => setUpdContent(e.target.value)} />
              </div>
              <button onClick={handleUpdate} disabled={loading || !updMemoryId.trim()} className="btn-primary btn-full">
                {loading ? <FiLoader className="spinner" /> : <><FiEdit /> Update Memory</>}
              </button>
            </>
          )}

          {tab === "delete" && (
            <>
              <div className="form-group">
                <label className="label">Memory ID</label>
                <input className="input" placeholder="00000000-0000-0000-0000-000000000000" value={delMemoryId} onChange={(e) => setDelMemoryId(e.target.value)} />
              </div>
              <button onClick={handleDelete} disabled={loading || !delMemoryId.trim()} className="btn-danger btn-full">
                {loading ? <FiLoader className="spinner" /> : <><FiTrash2 /> Delete Memory</>}
              </button>
            </>
          )}

          {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          <div className="card" style={{ overflow: "hidden" }}>
            <div className="card-header">
              <h3>API Explorer</h3>
            </div>
            <div className="code-nav">
              {currentExamples.map((ex) => (
                <button key={ex.lang} onClick={() => setCodeLang(ex.lang)}
                  className={codeLang === ex.lang ? "active" : ""}>
                  {ex.label}
                </button>
              ))}
            </div>
            <div className="code-block">
              <button onClick={handleCopyCode} className="copy-btn" title="Copy code">
                {copied ? "✓" : <FiCopy />}
              </button>
              <pre><code>{activeExample?.code ?? ""}</code></pre>
            </div>
          </div>

          {hasResponse && (
            <div className="card" style={{ overflow: "hidden" }}>
              <div
                onClick={() => setResponseOpen(!responseOpen)}
                style={{
                  padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  borderBottom: responseOpen ? "1px solid var(--border-default)" : "none",
                  cursor: "pointer", userSelect: "none",
                }}>
                <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                  Response
                </span>
                {responseOpen ? <FiChevronUp style={{ color: "var(--text-muted)" }} /> : <FiChevronDown style={{ color: "var(--text-muted)" }} />}
              </div>
              {responseOpen && (
                <div style={{ padding: 16 }}>
                  <div className="response-block" style={{ marginTop: 0 }}>
                    {responseContent}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
