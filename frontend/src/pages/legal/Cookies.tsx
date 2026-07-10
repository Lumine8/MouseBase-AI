import LegalPage from "../LegalPage";

export default function Cookies() {
  return (
    <LegalPage title="Cookie Policy" description="MouseBase Cookie Policy" path="/legal/cookies">
      <p>Last updated: July 2026</p>

      <h3>1. What Are Cookies</h3>
      <p>Cookies are small text files stored by your browser. We use a minimal set of cookies essential for authentication and session management.</p>

      <h3>2. Cookies We Use</h3>
      <ul>
        <li><strong>Session cookies</strong> — Required to keep you logged in. Expire when you close your browser.</li>
        <li><strong>Authentication cookies</strong> — Store your JWT token for API requests from the dashboard. These are strictly necessary.</li>
      </ul>
      <p>We do not use tracking cookies, advertising cookies, or third-party analytics cookies that require consent.</p>

      <h3>3. Managing Cookies</h3>
      <p>You can disable cookies in your browser settings. However, disabling essential cookies will break authentication and the dashboard will not function.</p>

      <h3>4. Third-Party Services</h3>
      <p>Our payment processor (Razorpay) may set cookies during checkout. Those are governed by Razorpay's own privacy policy.</p>

      <h3>5. Contact</h3>
      <p>privacy@mousebase.dev</p>
    </LegalPage>
  );
}
