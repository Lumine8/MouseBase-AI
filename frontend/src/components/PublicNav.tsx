import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiGithub, FiMenu, FiX } from "react-icons/fi";

const NAV_LINKS = [
  { label: "Features", href: "/" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs/getting-started" },
];

export default function PublicNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const loggedIn = !!(localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key"));

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(9,9,9,0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border-default)"
      }}>
        <div
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, cursor: "pointer" }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#090909", fontSize: 14, fontWeight: 700 }}>M</div>
          <span>Mouse<span style={{ color: "var(--accent)" }}>Base</span></span>
        </div>

        <div className="desktop-nav" style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.href || (l.href !== "/" && location.pathname.startsWith(l.href));
            return (
              <a
                key={l.label}
                href={l.href}
                onClick={(e) => { e.preventDefault(); navigate(l.href); }}
                style={{
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  textDecoration: "none", fontSize: 14, transition: "color 150ms",
                  borderBottom: "2px solid", borderColor: active ? "var(--accent)" : "transparent",
                  paddingBottom: 2, fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; if (!active) e.currentTarget.style.borderColor = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = active ? "var(--accent)" : "var(--text-secondary)"; if (!active) e.currentTarget.style.borderColor = "transparent"; }}
              >{l.label}</a>
            );
          })}
          <a href="https://github.com/anomalyco/MouseBase" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", fontSize: 16 }}><FiGithub /></a>
          {loggedIn ? (
            <button onClick={() => navigate("/dashboard")} className="btn-primary" style={{ padding: "8px 20px", fontSize: 14 }}>
              Dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate("/login")}
                className="btn-ghost"
                style={{ fontSize: 14 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = ""; }}
              >Sign In</button>
              <button onClick={() => navigate("/signup")} className="btn-primary" style={{ padding: "8px 20px", fontSize: 14 }}>
                Get Started
              </button>
            </>
          )}
        </div>

        <button onClick={() => setMobileMenu(!mobileMenu)} className="mobile-menu-btn">
          {mobileMenu ? <FiX /> : <FiMenu />}
        </button>
      </nav>

      {mobileMenu && (
        <div className="mobile-menu-dropdown" style={{ display: "flex" }}>
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => { e.preventDefault(); navigate(l.href); setMobileMenu(false); }}
              style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, padding: "8px 0" }}
            >{l.label}</a>
          ))}
          <a href="https://github.com/anomalyco/MouseBase" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 14, padding: "8px 0" }}>GitHub</a>
          {loggedIn ? (
            <button onClick={() => navigate("/dashboard")} className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: 14 }}>Dashboard</button>
          ) : (
            <>
              <button onClick={() => navigate("/login")} className="btn-ghost" style={{ textAlign: "left", padding: "8px 0", fontSize: 14 }}>Sign In</button>
              <button onClick={() => navigate("/signup")} className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: 14 }}>Get Started</button>
            </>
          )}
        </div>
      )}
    </>
  );
}
