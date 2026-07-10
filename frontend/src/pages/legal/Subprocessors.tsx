import LegalPage from "../LegalPage";

const subs = [
  { name: "Neon", service: "PostgreSQL Database (primary data store)", location: "US (multi-region)" },
  { name: "Vercel", service: "Frontend hosting & deployment", location: "US" },
  { name: "Stripe / Razorpay", service: "Payment processing", location: "Global" },
  { name: "Google Cloud (Gemini)", service: "Embedding generation via Gemini API", location: "US" },
  { name: "OpenAI", service: "Embedding generation via OpenAI API", location: "US" },
  { name: "GitHub", service: "Source code hosting & issue tracking", location: "US" },
  { name: "SendGrid / Resend", service: "Transactional email", location: "US" },
  { name: "Cloudflare", service: "DNS, CDN, DDoS protection", location: "Global" },
];

export default function Subprocessors() {
  return (
    <LegalPage title="Subprocessors" description="MouseBase Subprocessors list" path="/legal/subprocessors">
      <p>Last updated: July 2026</p>
      <p>MouseBase engages the following subprocessors to operate the service. All subprocessors are contractually bound to protect your data.</p>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        {subs.map((s) => (
          <div key={s.name} style={{
            background: "var(--bg-card)", border: "1px solid var(--border-default)",
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: 14 }}>{s.name}</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>{s.service}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Location: {s.location}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 24 }}>To be notified of subprocessor changes, subscribe at <a href="mailto:privacy@mousebase.dev" style={{ color: "var(--accent)" }}>privacy@mousebase.dev</a>.</p>
    </LegalPage>
  );
}
