import { useState, useEffect } from "react";
import { MemoryListItem, Memory } from "../lib/api";
import { FiX, FiEdit, FiTrash2, FiCopy, FiCheck, FiClock, FiRotateCcw } from "react-icons/fi";

interface MemoryVersion {
  id: string;
  memory_id: string;
  version: number;
  content: string;
  metadata: Record<string, unknown> | null;
  external_id: string | null;
  importance: number;
  source: string | null;
  confidence: number | null;
  created_at: string;
}

interface Props {
  memory: MemoryListItem;
  onClose: () => void;
  onEdit: (memory: MemoryListItem) => void;
  onDelete: (id: string) => void;
  onUpdated: (memory: MemoryListItem) => void;
}

export default function MemoryInspector({ memory, onClose, onDelete, onUpdated }: Props) {
  const [tab, setTab] = useState<"details" | "json" | "versions">("details");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(memory.content);
  const [editMeta, setEditMeta] = useState(JSON.stringify(memory.metadata, null, 2));
  const [editExtId, setEditExtId] = useState(memory.external_id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fullMemory, setFullMemory] = useState<Memory | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [versions, setVersions] = useState<MemoryVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { api } = await import("../lib/api");
        const m = await api.memory.get(memory.id);
        setFullMemory(m);
      } catch {}
      finally { setLoadingDetail(false); }
    })();
  }, [memory.id]);

  useEffect(() => {
    if (tab === "versions") {
      setLoadingVersions(true);
      (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL ?? "/api/v1"}/memory/${memory.id}/versions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setVersions(data);
        }
      } catch {}
        finally { setLoadingVersions(false); }
      })();
    }
  }, [tab, memory.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fullMemory || memory, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const { api } = await import("../lib/api");
      let parsedMeta: Record<string, unknown> = {};
      try { parsedMeta = editMeta.trim() ? JSON.parse(editMeta) : {}; } catch { setError("Invalid JSON in metadata"); setSaving(false); return; }
      const updated = await api.memory.update(memory.id, {
        content: editContent !== memory.content ? editContent : null,
        metadata: parsedMeta,
        external_id: editExtId !== (memory.external_id || "") ? editExtId || null : null,
      });
      onUpdated({ ...memory, content: updated.content, metadata: updated.metadata, external_id: updated.external_id, updated_at: updated.updated_at });
      setFullMemory(updated);
      setEditing(false);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm("Restore this version? Current state will be saved as a new version.")) return;
    setRestoring(versionId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "/api/v1"}/memory/${memory.id}/restore/${versionId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFullMemory(data);
        onUpdated({ ...memory, content: data.content, metadata: data.metadata, external_id: data.external_id, updated_at: data.updated_at });
        setEditContent(data.content);
        setEditMeta(JSON.stringify(data.metadata, null, 2));
        setEditExtId(data.external_id || "");
        // Reload versions
        const versionsRes = await fetch(`${import.meta.env.VITE_API_URL ?? "/api/v1"}/memory/${memory.id}/versions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key")}` },
        });
        if (versionsRes.ok) setVersions(await versionsRes.json());
      }
    } catch {}
    finally { setRestoring(null); }
  };

  const handleDelete = () => {
    if (window.confirm("Delete this memory? This cannot be undone.")) {
      onDelete(memory.id);
      onClose();
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();
  const displayMemory = fullMemory || memory;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal inspector-modal" style={{ maxWidth: 640, maxHeight: "90vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Memory Inspector</h2>
          <button onClick={onClose} className="modal-close"><FiX /></button>
        </div>

        <div className="inspector-tabs">
          <button className={`inspector-tab ${tab === "details" ? "active" : ""}`} onClick={() => setTab("details")}>Details</button>
          <button className={`inspector-tab ${tab === "versions" ? "active" : ""}`} onClick={() => setTab("versions")}>
            <FiClock style={{ marginRight: 4 }} /> Versions
          </button>
          <button className={`inspector-tab ${tab === "json" ? "active" : ""}`} onClick={() => setTab("json")}>JSON</button>
        </div>

        {error && <div className="alert alert-error" style={{ margin: "0 20px 12px" }}>{error}</div>}

        <div className="inspector-body">
          {tab === "details" ? (
            <div className="inspector-details">
              {editing ? (
                <>
                  <div className="inspector-field">
                    <label className="inspector-label">Content</label>
                    <textarea className="input" value={editContent} onChange={(e) => setEditContent(e.target.value)} style={{ minHeight: 60 }} />
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">External ID</label>
                    <input className="input" value={editExtId} onChange={(e) => setEditExtId(e.target.value)} />
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Metadata (JSON)</label>
                    <textarea className="input font-mono" value={editMeta} onChange={(e) => setEditMeta(e.target.value)} style={{ minHeight: 80, fontSize: 12 }} />
                  </div>
                  <div className="inspector-actions">
                    <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
                      {saving ? <span className="spinner" /> : <><FiCheck /> Save</>}
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-secondary btn-sm">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="inspector-field">
                    <label className="inspector-label">ID</label>
                    <code className="inspector-value font-mono text-xs">{memory.id}</code>
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Content</label>
                    <div className="inspector-value">{memory.content}</div>
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">External ID</label>
                    <div className="inspector-value">{memory.external_id || <span className="text-gray-400">—</span>}</div>
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Importance</label>
                    <div className="inspector-value">
                      {Math.round((memory.importance ?? 0.5) * 100)}%
                      <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)" }}>
                        (0–1 scale, default 0.5)
                      </span>
                    </div>
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Metadata</label>
                    <pre className="inspector-json">{JSON.stringify(memory.metadata, null, 2)}</pre>
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Embedding</label>
                    {loadingDetail ? (
                      <div className="inspector-value"><span className="spinner" style={{ width: 14, height: 14 }} /></div>
                    ) : (
                      <div className="inspector-value">
                        {displayMemory.embedding_model ? (
                          <><span className="meta-chip">{displayMemory.embedding_model}</span> <span className="meta-chip">{displayMemory.embedding_dimensions} dimensions</span></>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Created</label>
                    <div className="inspector-value">{formatDate(memory.created_at)}</div>
                  </div>
                  <div className="inspector-field">
                    <label className="inspector-label">Updated</label>
                    <div className="inspector-value">{formatDate(memory.updated_at)}</div>
                  </div>
                </>
              )}
            </div>
          ) : tab === "versions" ? (
            <div className="inspector-details" style={{ padding: "12px 20px" }}>
              {loadingVersions ? (
                <div style={{ textAlign: "center", padding: 20 }}><span className="spinner" /></div>
              ) : versions.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)", fontSize: 14 }}>
                  No version history yet. Versions are created when you update a memory.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {versions.map((v) => (
                    <div key={v.id} style={{
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border-default)",
                      borderRadius: 8,
                      padding: "12px 16px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          Version {v.version}
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(v.id)}
                          disabled={restoring === v.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "4px 10px", fontSize: 12,
                            background: "var(--bg-card)", border: "1px solid var(--border-default)",
                            borderRadius: 6, cursor: "pointer", color: "var(--accent)",
                          }}
                        >
                          {restoring === v.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <FiRotateCcw size={12} />}
                          Restore
                        </button>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4, lineHeight: 1.5 }}>
                        {v.content.length > 200 ? v.content.slice(0, 200) + "..." : v.content}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {formatDate(v.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <pre className="inspector-json inspector-json-full">{JSON.stringify(displayMemory, null, 2)}</pre>
          )}
        </div>

        <div className="inspector-footer">
          <button onClick={handleCopy} className="btn-secondary btn-sm"><FiCopy /> {copied ? "Copied!" : "Copy JSON"}</button>
          {!editing && tab === "details" && <button onClick={() => setEditing(true)} className="btn-secondary btn-sm"><FiEdit /> Edit</button>}
          <button onClick={handleDelete} className="btn-danger btn-sm"><FiTrash2 /> Delete</button>
        </div>
      </div>
    </div>
  );
}
