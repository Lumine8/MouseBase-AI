import LegalPage from "../LegalPage";

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" description="MouseBase Terms of Service" path="/legal/terms">
      <p>Last updated: July 2026</p>

      <h3>1. Acceptance</h3>
      <p>By using MouseBase, you agree to these Terms. If you do not agree, do not use the service.</p>

      <h3>2. Service Description</h3>
      <p>MouseBase provides persistent memory infrastructure for AI applications via a REST API and SDKs. You may store, retrieve, and search memories programmatically.</p>

      <h3>3. Accounts</h3>
      <p>You are responsible for maintaining the confidentiality of your API keys and account credentials. You are liable for all activity under your account.</p>

      <h3>4. Acceptable Use</h3>
      <p>You agree not to use MouseBase for any illegal activity, to store malicious content, or to abuse the API (excessive rate-limiting bypass, scraping, etc.). See our <a href="/legal/aup" style={{ color: "var(--accent)" }}>Acceptable Use Policy</a>.</p>

      <h3>5. Data Ownership</h3>
      <p>You retain all rights to the data you store. We claim no intellectual property over your content.</p>

      <h3>6. Service Level</h3>
      <p>The service is provided "as is." We strive for high availability but do not guarantee 100% uptime. Paid plans may include SLA terms as specified in your agreement.</p>

      <h3>7. Limitation of Liability</h3>
      <p>MouseBase is not liable for indirect, incidental, or consequential damages arising from use of the service. Total liability is limited to the amount paid in the 12 months preceding a claim.</p>

      <h3>8. Termination</h3>
      <p>We may suspend or terminate accounts that violate these terms. You may delete your account at any time.</p>

      <h3>9. Changes</h3>
      <p>We may update these terms. Material changes will be notified via email or platform notice.</p>

      <h3>10. Contact</h3>
      <p>legal@mousebase.dev</p>
    </LegalPage>
  );
}
