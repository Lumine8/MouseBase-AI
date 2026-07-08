import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMoon, FiSun, FiKey, FiTrash2, FiDownload, FiUser, FiMail, FiEye, FiEyeOff, FiCopy, FiCheck } from "react-icons/fi";
import { useTheme } from "../lib/useTheme";
import { auth, api, UserResponse, Project } from "../lib/api";

export default function Settings() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [keyInput, setKeyInput] = useState("");
  const [savedKey, setSavedKey] = useState(localStorage.getItem("mb_api_key") ?? "");

  useEffect(() => {
    if (localStorage.getItem("mb_token")) {
      auth.me().then(setUser).catch(() => {});
      api.projects.list().then(setProjects).catch(() => {});
    }
  }, []);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveKey = () => {
    if (keyInput.trim()) {
      localStorage.setItem("mb_api_key", keyInput.trim());
      setSavedKey(keyInput.trim());
      setKeyInput("");
    }
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("mb_api_key");
    setSavedKey("");
  };

  const handleClear = () => {
    localStorage.removeItem("mb_api_key");
    localStorage.removeItem("mb_token");
    navigate("/login");
  };

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account preferences.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        {user && (
          <div className="settings-section">
            <div className="section-title">Profile</div>
            <div className="settings-row">
              <FiUser style={{ color: "var(--text-muted)" }} />
              <div>
                <div className="settings-row-label">{user.full_name || "No name set"}</div>
                <div className="settings-row-desc"><FiMail /> {user.email}</div>
              </div>
            </div>
          </div>
        )}

        <div className="settings-section" style={{ marginTop: user ? 24 : 0 }}>
          <div className="section-title">Theme</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Appearance</div>
              <div className="settings-row-desc">Toggle between dark and light mode</div>
            </div>
            <div className="theme-toggle">
              {dark ? <FiMoon /> : <FiSun />}
              <div className="theme-toggle-track" onClick={toggle}>
                <div className={`theme-toggle-thumb${dark ? "" : " light"}`}>
                  {dark ? <FiMoon /> : <FiSun />}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section" style={{ marginTop: 24 }}>
          <div className="section-title">API Keys</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Stored Locally</div>
              <div className="settings-row-desc">Used by the playground and API client</div>
            </div>
          </div>
          {savedKey ? (
            <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
              <div className="key-display flex-1">
                <FiKey style={{ color: "var(--text-muted)" }} />
                <code>{savedKey.length > 24 ? savedKey.slice(0, 12) + "..." + savedKey.slice(-4) : savedKey.slice(0, 20) + "..."}</code>
              </div>
              <button onClick={handleRemoveKey} className="btn-ghost btn-sm" style={{ color: "var(--red)" }}>Remove</button>
            </div>
          ) : (
            <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
              <input className="input flex-1" placeholder="Paste your API key..." value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
              <button onClick={handleSaveKey} className="btn-primary btn-sm" disabled={!keyInput.trim()}>Save</button>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <div className="settings-row">
              <div>
                <div className="settings-row-label">Your Projects</div>
                <div className="settings-row-desc">Full API keys for each project — only you can see these</div>
              </div>
            </div>
            {projects.length === 0 ? (
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>No projects yet.</p>
            ) : (
              projects.map((p) => {
                const visible = showKeys[p.id];
                return (
                  <div key={p.id} className="card" style={{ padding: 16, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong style={{ fontSize: 14 }}>{p.name}</strong>
                      <button onClick={() => navigate(`/projects/${p.id}`)} className="btn-ghost btn-sm" style={{ fontSize: 12 }}>
                        Manage
                      </button>
                    </div>
                    {p.api_key ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="key-display flex-1">
                            <FiKey size={14} style={{ color: "var(--text-muted)" }} />
                            <code style={{ fontSize: 12 }}>{visible ? p.api_key : p.api_key.slice(0, 12) + "..." + p.api_key.slice(-4)}</code>
                          </div>
                          <button onClick={() => toggleShowKey(p.id)} className="btn-secondary btn-sm" title={visible ? "Hide" : "Show"}>
                            {visible ? <FiEyeOff /> : <FiEye />}
                          </button>
                          <button onClick={() => handleCopy(p.id, p.api_key!)} className="btn-secondary btn-sm">
                            {copiedId === p.id ? <FiCheck /> : <FiCopy />}
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            localStorage.setItem("mb_api_key", p.api_key!);
                            setSavedKey(p.api_key!);
                          }}
                          className="btn-ghost btn-sm"
                          style={{ marginTop: 6, fontSize: 12 }}
                        >
                          Use in Playground
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>
                          <code>{p.api_key_id}...</code> — Rotate to view
                        </p>
                        <button
                          onClick={async () => {
                            try {
                              const result = await api.projects.rotateKey(p.id);
                              setProjects((prev) => prev.map((x) => x.id === p.id ? result : x));
                            } catch {}
                          }}
                          className="btn-ghost btn-sm"
                          style={{ fontSize: 12 }}
                        >
                          Rotate Key
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="settings-section" style={{ marginTop: 24 }}>
          <div className="section-title">Account</div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Export Data</div>
              <div className="settings-row-desc">Download all your memories and project data</div>
            </div>
            <button className="btn-secondary"><FiDownload /> Export</button>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-row-label" style={{ color: "var(--red)" }}>Sign Out</div>
              <div className="settings-row-desc">Remove credentials and sign out</div>
            </div>
            <button onClick={handleClear} className="btn-danger"><FiTrash2 /> Sign Out</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 24 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>About</div>
        <p className="about-text">
          <strong>Mouse<span style={{ color: "var(--accent)" }}>Base</span></strong> provides persistent memory infrastructure
          for AI agents and applications.
        </p>
        <p className="about-text">
          Store, retrieve, and search semantic memories using vector
          embeddings. Built for developers who need their AI to remember.
        </p>
        <p className="about-version">MouseBase v0.1.0 &middot; API v1</p>
      </div>
    </div>
  );
}
