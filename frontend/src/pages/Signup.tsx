import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiCopy, FiCheck, FiExternalLink } from "react-icons/fi";
import { auth, projects, Project } from "../lib/api";
import PublicNav from "../components/PublicNav";
import SEO from "../components/SEO";

export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState<{ key: string; projectId: string; projectName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await auth.signup({
        email: email.trim(),
        password,
        full_name: fullName.trim() || null,
      });
      localStorage.setItem("mb_token", res.token);

      const project: Project = await projects.create({ name: "demo-project" });
      localStorage.setItem("mb_api_key", project.api_key!);
      setApiKeyModal({ key: project.api_key!, projectId: project.id, projectName: project.name });
    } catch (err: any) {
      setError(err?.message ?? "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  function handleCopyKey() {
    if (apiKeyModal) {
      navigator.clipboard.writeText(apiKeyModal.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDismiss() {
    setApiKeyModal(null);
    navigate("/dashboard");
  }

  return (
    <div className="login-page" style={{ flexDirection: "column" }}>
      <SEO
        title="Create Account"
        description="Sign up for MouseBase — persistent memory for AI agents. Get your API key and start building in minutes."
        path="/signup"
      />
      <PublicNav />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(9, 9, 9)", fontSize: 28, fontWeight: 700, boxShadow: "rgba(245, 197, 66, 0.15) 0px 0px 40px" }}>
            M
          </div>
          <h1>Mouse<span style={{ color: "var(--accent)" }}>Base</span></h1>
          <p>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="fullName" className="label">Full Name (optional)</label>
            <input
              id="fullName"
              type="text"
              className="input"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="label">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-full"
            style={{ marginTop: 16 }}
          >
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <div className="login-footer">
          Already have an account? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
        </div>
      </div>
      </div>

      {apiKeyModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>Your API Key</h2>
            </div>
            <div style={{ padding: "0 0 20px" }}>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                A starter project <strong style={{ color: "var(--text-primary)" }}>{apiKeyModal.projectName}</strong> has been created.
                Save this API key now — you won't be able to see it again.
              </p>
              <div className="key-display" style={{ marginBottom: 16 }}>
                <code style={{ wordBreak: "break-all", fontSize: 12 }}>{apiKeyModal.key}</code>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleCopyKey}
                  className="btn-primary"
                  style={{ flex: 1, padding: "10px 16px" }}
                >
                  {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy Key</>}
                </button>
                <button
                  onClick={() => navigate(`/projects/${apiKeyModal.projectId}`)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: "10px 16px" }}
                >
                  <FiExternalLink /> View Project
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="btn-ghost"
                style={{ width: "100%", marginTop: 12, padding: "10px", fontSize: 13 }}
              >
                I'll save it later — go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
