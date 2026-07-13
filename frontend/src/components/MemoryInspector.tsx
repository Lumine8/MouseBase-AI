import { useState, useEffect } from "react";
import { MemoryListItem, Memory } from "../lib/api";
import { FiX, FiEdit, FiTrash2, FiCopy, FiCheck } from "react-icons/fi";

interface Props {
  memory: MemoryListItem;
  onClose: () => void;
  onEdit: (memory: MemoryListItem) => void;
  onDelete: (id: string) => void;
  onUpdated: (memory: MemoryListItem) => void;
}

export default function MemoryInspector({ memory, onClose, onDelete, onUpdated }: Props) {
  const [tab, setTab] = useState<"details" | "json">("details");
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(memory.content);
  const [editMeta, setEditMeta] = useState(JSON.stringify(memory.metadata, null, 2));
  const [editExtId, setEditExtId] = useState(memory.external_id || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fullMemory, setFullMemory] = useState<Memory | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);

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
          ) : (
            <pre className="inspector-json inspector-json-full">{JSON.stringify(displayMemory, null, 2)}</pre>
          )}
        </div>

        <div className="inspector-footer">
          <button onClick={handleCopy} className="btn-secondary btn-sm"><FiCopy /> {copied ? "Copied!" : "Copy JSON"}</button>
          {!editing && <button onClick={() => setEditing(true)} className="btn-secondary btn-sm"><FiEdit /> Edit</button>}
          <button onClick={handleDelete} className="btn-danger btn-sm"><FiTrash2 /> Delete</button>
        </div>
      </div>
    </div>
  );
}
