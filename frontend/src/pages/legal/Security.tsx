import LegalPage from "../LegalPage";

export default function Security() {
  return (
    <LegalPage title="Security Policy" description="MouseBase Security Policy" path="/legal/security">
      <h3>Encryption</h3>
      <ul>
        <li><strong>In transit:</strong> All API traffic is encrypted with TLS 1.3. We enforce HTTPS-only access.</li>
        <li><strong>At rest:</strong> Database storage is encrypted using AES-256. API keys are hashed with bcrypt.</li>
      </ul>

      <h3>Authentication</h3>
      <p>API keys follow the format <code>mb_live_&lt;key_id&gt;_&lt;secret&gt;</code> with high-entropy secrets. JWT tokens expire after 24 hours. Keys can be rotated at any time via the dashboard.</p>

      <h3>Infrastructure</h3>
      <p>We use Neon (PostgreSQL) for primary data with automated backups, point-in-time recovery, and encryption at rest. Applications run in isolated containers with no cross-tenant access.</p>

      <h3>Access Control</h3>
      <p>Production access is limited to core team members with multi-factor authentication. All access is logged and audited.</p>

      <h3>Vulnerability Disclosure</h3>
      <p>See our <a href="/legal/security#disclosure" style={{ color: "var(--accent)" }}>Responsible Disclosure</a> policy below.</p>

      <h3 id="disclosure">Responsible Disclosure</h3>
      <p>If you discover a security vulnerability, please report it privately to security@mousebase.dev. We commit to acknowledging receipt within 24 hours and providing a fix timeline within 5 business days.</p>
      <p>We support safe harbor for researchers who follow responsible disclosure practices.</p>

      <h3>.well-known/security.txt</h3>
      <p>Our security.txt is available at <a href="/.well-known/security.txt" style={{ color: "var(--accent)" }}>/.well-known/security.txt</a>.</p>
    </LegalPage>
  );
}
