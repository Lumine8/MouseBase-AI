import LegalPage from "../LegalPage";

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" description="MouseBase Privacy Policy" path="/legal/privacy">
      <p>Last updated: July 2026</p>

      <h3>1. Information We Collect</h3>
      <p>We collect information you provide when creating an account (email, name) and data you store via the MouseBase API (memories, metadata, search queries). We also collect basic usage analytics and error logs to improve the service.</p>

      <h3>2. How We Use Your Data</h3>
      <p>Your stored memories and metadata are used solely to provide the memory storage and retrieval service. We do not train models on your data. Usage analytics are used to monitor performance, detect abuse, and improve the platform.</p>

      <h3>3. Data Sharing</h3>
      <p>We do not sell your personal data. We may share data with subprocessors (hosting, database, email) strictly to operate the service. See our <a href="/legal/subprocessors" style={{ color: "var(--accent)" }}>Subprocessors</a> page for details.</p>

      <h3>4. Data Retention</h3>
      <p>Memories are retained until deleted by the user or project owner. Account data is retained until account deletion. See our <a href="/privacy/retention" style={{ color: "var(--accent)" }}>Data Retention Policy</a>.</p>

      <h3>5. Your Rights</h3>
      <p>Depending on your jurisdiction, you may have rights to access, correct, delete, or export your data. Use the <a href="/privacy/deletion" style={{ color: "var(--accent)" }}>Data Deletion Request</a> or <a href="/privacy/export" style={{ color: "var(--accent)" }}>Export My Data</a> pages, or contact us at privacy@mousebase.dev.</p>

      <h3>6. Security</h3>
      <p>We encrypt data in transit (TLS) and at rest. API keys are hashed. We follow industry best practices for infrastructure security.</p>

      <h3>7. Contact</h3>
      <p>For privacy-related inquiries: privacy@mousebase.dev</p>
    </LegalPage>
  );
}
