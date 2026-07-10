import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function DataRetention() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Data Retention Policy" description="MouseBase data retention policy" path="/privacy/retention" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>Data Retention Policy</h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <h3>Memories</h3>
          <p>Memories are retained until deleted by the user via the API or dashboard. Deleted memories are purged from primary storage immediately and from backups within 30 days.</p>
          <h3>Account Data</h3>
          <p>Account information (email, name) is retained as long as the account is active. Upon account deletion, personal data is purged within 30 days.</p>
          <h3>Usage Logs</h3>
          <p>Aggregated usage metrics are retained for 12 months. Individual request logs are retained for 90 days for debugging and abuse prevention.</p>
          <h3>Backups</h3>
          <p>Database backups are retained for 30 days. Backups are encrypted and stored in a separate region.</p>
          <h3>Data Subject Requests</h3>
          <p>You may request deletion or export of your data at any time via our <a href="/privacy/deletion" style={{ color: "var(--accent)" }}>Data Deletion</a> and <a href="/privacy/export" style={{ color: "var(--accent)" }}>Export</a> pages.</p>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
