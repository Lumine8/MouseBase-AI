import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, Project } from "../lib/api";
import ApiKeyModal from "../components/ApiKeyModal";
import { FiCopy, FiRefreshCw, FiTrash2, FiArrowLeft } from "react-icons/fi";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [copyMsg, setCopyMsg] = useState("");

  useEffect(() => {
    if (!id) return;
    api.projects.get(id)
      .then((p) => { setProject(p); setNewName(p.name); setNewDesc(p.description ?? ""); })
      .catch(() => navigate("/projects"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUpdate = async () => {
    if (!project || !newName.trim()) return;
    setRenaming(true);
    try {
      const updated = await api.projects.update(project.id, { name: newName.trim(), description: newDesc.trim() || null });
      setProject(updated);
    } catch {} finally { setRenaming(false); }
  };

  const handleRotate = async () => {
    if (!project) return;
    try {
      const result = await api.projects.rotateKey(project.id);
      setProject(result);
      setShowApiKey(result.api_key ?? null);
    } catch {}
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try { await api.projects.delete(project.id); navigate("/projects"); }
    catch { setDeleting(false); }
  };

  const copyKeyId = () => {
    if (!project) return;
    navigator.clipboard.writeText(project.api_key_id);
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 2000);
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!project) return <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Project not found.</p>;

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <button onClick={() => navigate("/projects")} className="btn-ghost" style={{ marginBottom: 16 }}>
        <FiArrowLeft /> Back to projects
      </button>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
                {project.name}
              </h1>
              {project.description && (
                <p style={{ marginTop: 4, color: "var(--text-secondary)", fontSize: 14 }}>{project.description}</p>
              )}
            </div>
            <button onClick={() => navigate(`/projects/${project.id}/memories`)} className="btn-primary" style={{ fontSize: 13, padding: "8px 18px" }}>
              View Memories
            </button>
          </div>
        </div>

        <div className="section-title">Edit Project</div>
        <div className="form-group">
          <label className="label">Name</label>
          <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <input className="input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
        </div>
        <button onClick={handleUpdate} disabled={renaming || !newName.trim()} className="btn-primary">
          {renaming ? <span className="spinner" /> : "Save Changes"}
        </button>

        <div style={{ marginTop: 24 }}>
          <div className="section-title">API Key</div>
          <div className="flex items-center gap-2">
            <div className="key-display flex-1"><code>{project.api_key_id}</code></div>
            <button onClick={copyKeyId} className="btn-secondary btn-sm"><FiCopy /> {copyMsg || "Copy"}</button>
            <button onClick={handleRotate} className="btn-secondary btn-sm"><FiRefreshCw /> Rotate</button>
          </div>
          <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
            API Key ID: <code className="font-mono">{project.api_key_id}</code>. Rotating the key will invalidate the old one.
          </p>
        </div>

        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <p>Once you delete a project, there is no going back. Please be certain.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleRotate} className="btn-secondary"><FiRefreshCw /> Rotate Key</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger">
              {deleting ? <span className="spinner" /> : <><FiTrash2 /> Delete Project</>}
            </button>
          </div>
        </div>
      </div>

      {showApiKey && <ApiKeyModal apiKey={showApiKey} onClose={() => setShowApiKey(null)} />}
    </div>
  );
}
