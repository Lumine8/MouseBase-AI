import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function RefundPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <SEO title="Refund Policy" description="MouseBase refund and cancellation policy" path="/refund" />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100, maxWidth: 640, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 16 }}>Refund Policy</h1>
        <div style={{ fontSize: 15, lineHeight: 1.8, color: "var(--text-secondary)" }}>
          <h3>Subscriptions</h3>
          <p>You can cancel your subscription at any time from the billing page. Upon cancellation, you retain access to paid features until the end of the current billing period. No prorated refunds are issued for partial months.</p>
          <h3>Annual Plans</h3>
          <p>For annual plans, a prorated refund may be issued within 14 days of renewal. Contact billing@mousebase.dev for assistance.</p>
          <h3>Free Tier</h3>
          <p>The free tier is always free. No refunds apply.</p>
          <h3>Disputes</h3>
          <p>If you believe a charge was made in error, contact billing@mousebase.dev within 30 days. We'll work with you to resolve the issue.</p>
        </div>
        <div style={{ marginTop: 48 }}><Footer /></div>
      </div>
    </div>
  );
}
