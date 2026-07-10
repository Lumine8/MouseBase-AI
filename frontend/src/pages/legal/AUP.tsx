import LegalPage from "../LegalPage";

export default function AUP() {
  return (
    <LegalPage title="Acceptable Use Policy" description="MouseBase Acceptable Use Policy" path="/legal/aup">
      <p>Last updated: July 2026</p>

      <p>This Acceptable Use Policy ("AUP") governs your use of MouseBase. By using the service, you agree not to:</p>

      <h3>Prohibited Activities</h3>
      <ul>
        <li>Store illegal, abusive, or harmful content (malware, phishing, CSAM, etc.)</li>
        <li>Use the service to violate any applicable law or regulation</li>
        <li>Attempt to bypass rate limits, authentication, or access controls</li>
        <li>Reverse engineer, decompile, or extract the underlying embedding models</li>
        <li>Use the service for large-scale scraping, data mining, or spam</li>
        <li>Interfere with other users' access to the platform</li>
        <li>Store personal health information (PHI) or similarly regulated data without a proper BAA</li>
      </ul>

      <h3>Enforcement</h3>
      <p>Violations may result in content removal, account suspension, or termination. We reserve the right to investigate suspected abuse.</p>

      <h3>Reporting</h3>
      <p>Report AUP violations to abuse@mousebase.dev.</p>
    </LegalPage>
  );
}
