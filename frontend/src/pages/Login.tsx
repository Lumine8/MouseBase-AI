import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FiKey } from "react-icons/fi";
import { auth } from "../lib/api";
import PublicNav from "../components/PublicNav";
import SEO from "../components/SEO";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"email" | "apikey">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await auth.login({ email: email.trim(), password });
      localStorage.setItem("mb_token", res.token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!apiKey.trim()) {
      setError("Please enter your API key.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/projects/", {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });

      if (!res.ok) {
        let message = "Invalid API key. Please try again.";
        try {
          const data = await res.json();
          message = data?.error?.message ?? data?.detail ?? message;
        } catch {
          // response body was empty or not JSON
        }
        throw new Error(message);
      }

      localStorage.setItem("mb_api_key", apiKey.trim());
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ flexDirection: "column" }}>
      <SEO
        title="Sign In"
        description="Sign in to MouseBase — persistent memory for AI agents. Use email/password or API key."
        path="/login"
      />
      <PublicNav />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <div className="login-box">
        <div className="login-logo">
          <div className="login-logo-icon" style={{ width: 56, height: 56, borderRadius: 16, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(9, 9, 9)", fontSize: 28, fontWeight: 700, boxShadow: "rgba(245, 197, 66, 0.15) 0px 0px 40px" }}>
            M
          </div>
          <h1>Mouse<span style={{ color: "var(--accent)" }}>Base</span></h1>
          <p>Persistent memory for AI agents</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === "email" ? "active" : ""}`}
            onClick={() => setMode("email")}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${mode === "apikey" ? "active" : ""}`}
            onClick={() => setMode("apikey")}
          >
            <FiKey /> API Key
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmailSubmit} className="login-form">
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
                placeholder="Your password"
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
              {loading ? <span className="spinner" /> : "Sign in"}
            </button>

            <div className="login-footer" style={{ marginTop: 12 }}>
              Don't have an account? <Link to="/signup" style={{ color: "var(--accent)" }}>Sign up</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleApiKeySubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="apiKey" className="label">API Key</label>
              <input
                id="apiKey"
                type="password"
                className="input"
                placeholder="mb_live_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                autoFocus
              />
              <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)" }}>
                Enter your API key from the dashboard.
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-full"
              style={{ marginTop: 16 }}
            >
              {loading ? <span className="spinner" /> : "Sign in with API Key"}
            </button>
          </form>
        )}

        <div className="login-footer">
          Developer login. API key or email/password.
        </div>
      </div>
      </div>
    </div>
  );
}
