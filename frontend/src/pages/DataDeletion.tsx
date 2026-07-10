import { useState } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function DataDeletion() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    setError("");
    try {
      await fetch("/api/v1/auth/data-deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), reason: reason.trim() || undefined }),
      });
      setSent(true);
    } catch {
      setError("Failed to submit. Please email privacy@mousebase.dev directly.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Data Deletion Request" description="Request deletion of your MouseBase account and data" path="/privacy/deletion" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 540, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Data Deletion Request</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
          Submit a request to delete your account and associated data. We'll process it within 30 days.
        </p>
        {sent ? (
          <div style={{
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e", padding: "16px 20px", borderRadius: 12,
          }}>
            Request submitted. We'll process your deletion within 30 days and confirm via email.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label className="label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="reason">Reason (optional)</label>
              <textarea id="reason" className="input" style={{ minHeight: 100, resize: "vertical" }} placeholder="Tell us why you're leaving..." value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn-primary" style={{ alignSelf: "flex-start" }}>Submit Request</button>
          </form>
        )}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
