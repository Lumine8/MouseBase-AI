import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Project } from "../lib/api";
import { FiPlus, FiCopy, FiEdit, FiTrash2, FiFolder } from "react-icons/fi";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    api.projects.list().then(setProjects).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const result = await api.projects.create({ name: newName.trim(), description: newDesc.trim() || null });
      setCreatedKey(result.api_key ?? null);
      setProjects((prev) => [...prev, result]);
      setNewName("");
      setNewDesc("");
    } catch {} finally { setCreating(false); }
  };

  const handleCopyKey = async (p: Project) => {
    try {
      const full: any = await api.projects.rotateKey(p.id);
      navigator.clipboard.writeText(full.api_key);
      setCopyMsg("Copied!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {}
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    try {
      await api.projects.delete(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {}
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Projects</h1>
          <p>Manage your API projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <FiPlus /> New Project
        </button>
      </div>

      {createdKey && (
        <div className="alert alert-info" style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>
            Project created! Copy your API key now — it won't be shown again.
          </p>
          <div className="alert-row">
            <code className="alert-key">{createdKey}</code>
            <button onClick={() => { navigator.clipboard.writeText(createdKey); setCreatedKey(null); }} className="btn-secondary btn-sm">
              <FiCopy />
            </button>
            <button onClick={() => setCreatedKey(null)} className="btn-ghost btn-sm">Dismiss</button>
          </div>
        </div>
      )}

      {showCreate && !createdKey && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <div className="section-title">Create Project</div>
          <div className="form-group">
            <label className="label">Name</label>
            <input className="input" placeholder="My Project" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label className="label">Description (optional)</label>
            <input className="input" placeholder="What is this project for?" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
          </div>
          <div className="form-actions">
            <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary">
              {creating ? <span className="spinner" /> : "Create"}
            </button>
            <button onClick={() => { setShowCreate(false); setCreatedKey(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FiFolder /></div>
          <p>No projects yet.</p>
          <div className="hint">Create your first project to get started.</div>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div key={p.id} className="project-card" style={{ cursor: "default" }}>
              <div onClick={() => navigate(`/projects/${p.id}`)} style={{ cursor: "pointer" }}>
                <h3>{p.name}</h3>
                {p.description && <p>{p.description}</p>}
                <div className="project-card-footer">
                  <span className="project-card-badge">{p.api_key_id}</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="project-card-actions">
                <button onClick={() => handleCopyKey(p)} className="btn-secondary btn-sm" title="Copy API Key">
                  <FiCopy /> {copyMsg || "Copy"}
                </button>
                <button onClick={() => navigate(`/projects/${p.id}`)} className="btn-secondary btn-sm" title="Edit">
                  <FiEdit />
                </button>
                <button onClick={() => handleDelete(p.id, p.name)} className="btn-danger btn-sm" title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
