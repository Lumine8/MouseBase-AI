import LegalPage from "../LegalPage";

export default function DPA() {
  return (
    <LegalPage title="Data Processing Addendum" description="MouseBase Data Processing Addendum (DPA)" path="/legal/dpa">
      <p>Last updated: July 2026</p>

      <p>This Data Processing Addendum ("DPA") forms part of the agreement between MouseBase and its customers who process personal data subject to GDPR, CCPA, or similar regulations.</p>

      <h3>1. Scope</h3>
      <p>This DPA applies when Customer stores personal data in MouseBase memories that is subject to EU GDPR, UK GDPR, or CCPA.</p>

      <h3>2. Data Processing</h3>
      <p>MouseBase processes data solely as a data processor on behalf of Customer (the data controller). Customer retains full control over what data is stored.</p>

      <h3>3. Subprocessors</h3>
      <p>Customer authorizes MouseBase to engage subprocessors as listed on our <a href="/legal/subprocessors" style={{ color: "var(--accent)" }}>Subprocessors</a> page. MouseBase will notify Customer of any changes.</p>

      <h3>4. Data Subject Rights</h3>
      <p>MouseBase will assist Customer in fulfilling data subject access, correction, and deletion requests. Customers can use the in-app data tools or contact privacy@mousebase.dev.</p>

      <h3>5. Security</h3>
      <p>MouseBase maintains appropriate technical and organizational measures as described in our <a href="/legal/security" style={{ color: "var(--accent)" }}>Security Policy</a>.</p>

      <h3>6. Data Breach</h3>
      <p>MouseBase will notify Customer within 72 hours of becoming aware of a breach affecting Customer's data.</p>

      <h3>7. Governing Law</h3>
      <p>This DPA is governed by the laws of England and Wales.</p>

      <p>To request a signed copy, contact dpa@mousebase.dev.</p>
    </LegalPage>
  );
}
