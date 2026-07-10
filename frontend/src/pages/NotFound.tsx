import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      <SEO title="404 — Page Not Found" description="Page not found" path="/404" />
      <PublicNav />
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "40px 24px", textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#090909", fontSize: 32, fontWeight: 700, marginBottom: 24,
        }}>404</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Page not found</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 8, marginBottom: 24 }}>
          This page doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary" style={{ padding: "10px 24px", borderRadius: 12, textDecoration: "none" }}>
          Go Home
        </Link>
      </div>
      <Footer />
    </div>
  );
}
