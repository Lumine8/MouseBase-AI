import { useState } from "react";
import { api, RememberResponse, Memory, SearchResponse } from "../lib/api";
import { FiCpu, FiSearch, FiEye, FiEdit, FiTrash2, FiPlay, FiCopy, FiLoader, FiKey, FiEyeOff } from "react-icons/fi";

type Tab = "remember" | "search" | "get" | "update" | "delete";

interface CodeExample { lang: string; label: string; code: string; }

const tabIcons: Record<Tab, React.ReactNode> = {
  remember: <FiCpu />,
  search: <FiSearch />,
  get: <FiEye />,
  update: <FiEdit />,
  delete: <FiTrash2 />,
};

export default function Playground() {
  const [tab, setTab] = useState<Tab>("remember");
  const [apiKeyInput, setApiKeyInput] = useState(localStorage.getItem("mb_api_key") ?? "");
  const [showKey, setShowKey] = useState(false);

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
    try { const r = await api.remember({ content: remContent, external_id: remExtId || null, metadata: {} }, activeKey); setRemResult(r); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    setError(""); setLoading(true);
    try { const r = await api.search({ query: searchQuery, top_k: searchTopK }, activeKey); setSearchResult(r); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleGet = async () => {
    setError(""); setLoading(true);
    try { const r = await api.memory.get(getMemoryId, activeKey); setGetResult(r); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    setError(""); setLoading(true);
    try { const r = await api.memory.update(updMemoryId, { content: updContent || null }, activeKey); setUpdResult(r); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    setError(""); setLoading(true);
    try { await api.memory.delete(delMemoryId, activeKey); setDelDone(true); }
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
      { lang: "node", label: "Node",
        code: `import mousebase\n\nconst client = new mousebase.Client({ apiKey: "${apiKey}" });\nconst result = await client.remember("${remContent || "The user clicked the settings page."}");\nconsole.log(result);` },
    ],
    search: [
      { lang: "curl", label: "cURL",
        code: `curl -X POST ${baseUrl}/search/ \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"query": "${searchQuery || "user settings page"}", "top_k": ${searchTopK}}'` },
      { lang: "python", label: "Python",
        code: `import httpx\n\nresponse = httpx.post(\n    "${baseUrl}/search/",\n    headers={"Authorization": "Bearer ${apiKey}"},\n    json={"query": "${searchQuery || "user settings page"}", "top_k": ${searchTopK}},\n)\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript",
        code: `const response = await fetch("${baseUrl}/search/", {\n  method: "POST",\n  headers: { Authorization: "Bearer ${apiKey}", "Content-Type": "application/json" },\n  body: JSON.stringify({ query: "${searchQuery || "user settings page"}", top_k: ${searchTopK} }),\n});\nconst data = await response.json();\nconsole.log(data);` },
      { lang: "node", label: "Node",
        code: `import mousebase\n\nconst client = new mousebase.Client({ apiKey: "${apiKey}" });\nconst results = await client.search("${searchQuery || "user settings page"}", { topK: ${searchTopK} });\nconsole.log(results);` },
    ],
    get: [
      { lang: "curl", label: "cURL", code: `curl ${baseUrl}/memory/${getMemoryId || "<memory_id>"} \\\n  -H "Authorization: Bearer ${apiKey}"` },
      { lang: "python", label: "Python", code: `import httpx\n\nresponse = httpx.get("${baseUrl}/memory/${getMemoryId || "<memory_id>"}", headers={"Authorization": "Bearer ${apiKey}"})\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript", code: `const response = await fetch("${baseUrl}/memory/${getMemoryId || "<memory_id>"}", { headers: { Authorization: "Bearer ${apiKey}" } });\nconst data = await response.json();\nconsole.log(data);` },
      { lang: "node", label: "Node", code: `import mousebase\n\nconst client = new mousebase.Client({ apiKey: "${apiKey}" });\nconst memory = await client.getMemory("${getMemoryId || "<memory_id>"}");\nconsole.log(memory);` },
    ],
    update: [
      { lang: "curl", label: "cURL", code: `curl -X PATCH ${baseUrl}/memory/${updMemoryId || "<memory_id>"} \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "${updContent || "Updated content."}"}'` },
      { lang: "python", label: "Python", code: `import httpx\n\nresponse = httpx.patch("${baseUrl}/memory/${updMemoryId || "<memory_id>"}", headers={"Authorization": "Bearer ${apiKey}"}, json={"content": "${updContent || "Updated content."}"})\nprint(response.json())` },
      { lang: "javascript", label: "JavaScript", code: `const response = await fetch("${baseUrl}/memory/${updMemoryId || "<memory_id>"}", { method: "PATCH", headers: { Authorization: "Bearer ${apiKey}", "Content-Type": "application/json" }, body: JSON.stringify({ content: "${updContent || "Updated content."}" }) });\nconst data = await response.json();\nconsole.log(data);` },
      { lang: "node", label: "Node", code: `import mousebase\n\nconst client = new mousebase.Client({ apiKey: "${apiKey}" });\nconst memory = await client.updateMemory("${updMemoryId || "<memory_id>"}", { content: "${updContent || "Updated content."}" });\nconsole.log(memory);` },
    ],
    delete: [
      { lang: "curl", label: "cURL", code: `curl -X DELETE ${baseUrl}/memory/${delMemoryId || "<memory_id>"} \\\n  -H "Authorization: Bearer ${apiKey}"` },
      { lang: "python", label: "Python", code: `import httpx\n\nresponse = httpx.delete("${baseUrl}/memory/${delMemoryId || "<memory_id>"}", headers={"Authorization": "Bearer ${apiKey}"})\nprint(response.status_code)` },
      { lang: "javascript", label: "JavaScript", code: `await fetch("${baseUrl}/memory/${delMemoryId || "<memory_id>"}", { method: "DELETE", headers: { Authorization: "Bearer ${apiKey}" } });` },
      { lang: "node", label: "Node", code: `import mousebase\n\nconst client = new mousebase.Client({ apiKey: "${apiKey}" });\nawait client.deleteMemory("${delMemoryId || "<memory_id>"}");` },
    ],
  };

  const currentExamples = examples[tab];
  const [codeLang, setCodeLang] = useState(currentExamples[0].lang);

  const handleCopyCode = () => {
    const ex = currentExamples.find((e) => e.lang === codeLang);
    if (ex) { navigator.clipboard.writeText(ex.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

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
        marginBottom: 20,
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

      <div className="tabs">
        {(["remember", "search", "get", "update", "delete"] as Tab[]).map((t) => (
          <button key={t} onClick={() => { setTab(t); setCodeLang(currentExamples[0].lang); setError(""); }}
            className={`tab${tab === t ? " active" : ""}`}>
            {tabIcons[t]}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="playground-grid">
        <div className="card" style={{ padding: 20 }}>
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

          {remResult && tab === "remember" && (
            <div className="response-block"><h3>Response</h3><pre>{JSON.stringify(remResult, null, 2)}</pre></div>
          )}
          {searchResult && tab === "search" && (
            <div className="response-block"><h3>Response</h3><pre>{JSON.stringify(searchResult, null, 2)}</pre></div>
          )}
          {getResult && tab === "get" && (
            <div className="response-block"><h3>Response</h3><pre>{JSON.stringify(getResult, null, 2)}</pre></div>
          )}
          {updResult && tab === "update" && (
            <div className="response-block"><h3>Response</h3><pre>{JSON.stringify(updResult, null, 2)}</pre></div>
          )}
          {delDone && tab === "delete" && (
            <div className="alert alert-success" style={{ marginTop: 12 }}>Memory deleted successfully (204 No Content).</div>
          )}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="card-header">
            <h3>API Explorer</h3>
          </div>

          <div className="code-nav">
            {currentExamples.map((ex) => (
              <button key={ex.lang} onClick={() => setCodeLang(ex.lang)}
                className={codeLang === ex.lang ? "active" : ""}>
                {ex.label === "Node" ? <><FiPlay /> {ex.label}</> : ex.label}
              </button>
            ))}
          </div>

          <div className="code-block">
            <button onClick={handleCopyCode} className="copy-btn" title="Copy code">
              {copied ? "✓" : <FiCopy />}
            </button>
            <pre><code>{currentExamples.find((e) => e.lang === codeLang)?.code ?? ""}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
}
