import { useState } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function ExportData() {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const loggedIn = !!(localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key"));

  const handleExport = async () => {
    setExporting(true);
    setError("");
    try {
      const token = localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key");
      const res = await fetch("/api/v1/auth/export", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mousebase-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch {
      setError("Export failed. Try again or email privacy@mousebase.dev.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Export My Data" description="Export your MouseBase account data" path="/privacy/export" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 540, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 8 }}>Export My Data</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
          Download all your account data, including memories and projects, in JSON format.
        </p>
        {!loggedIn ? (
          <div className="alert" style={{ border: "1px solid var(--border-default)", borderRadius: 12, padding: 16, fontSize: 14, color: "var(--text-secondary)" }}>
            <a href="/login" style={{ color: "var(--accent)" }}>Sign in</a> to export your data.
          </div>
        ) : done ? (
          <div style={{
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#22c55e", padding: "16px 20px", borderRadius: 12,
          }}>
            Export started. Check your downloads.
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            <button onClick={handleExport} disabled={exporting} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {exporting ? "Exporting..." : "Download My Data"}
            </button>
          </>
        )}
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
