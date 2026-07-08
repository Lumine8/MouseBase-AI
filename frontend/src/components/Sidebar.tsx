import { NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiDatabase, FiSearch, FiCode, FiBookOpen, FiActivity, FiSettings, FiUser, FiLogOut, FiCpu, FiCreditCard } from "react-icons/fi";
import { useSidebar } from "../App";

export default function Sidebar() {
  const navigate = useNavigate();
  const { open, close } = useSidebar();

  const nav = [
    { to: "/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/projects", icon: FiDatabase, label: "Projects" },
    { to: "/playground", icon: FiCode, label: "Playground" },
    { to: "/search", icon: FiSearch, label: "Search" },
    { to: "/pricing", icon: FiCreditCard, label: "Billing" },
    { to: "/analytics", icon: FiActivity, label: "Analytics" },
    { to: "/docs/getting-started", icon: FiBookOpen, label: "Documentation" },
    { to: "/settings", icon: FiSettings, label: "Settings" },
  ];

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={close} />}

      <aside className="sidebar" data-open={open}>
        <div style={{ padding: "20px 20px 0" }}>
          <div
            onClick={() => { navigate("/dashboard"); close(); }}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 32, fontWeight: 700, fontSize: 17 }}
          >
            <div className="sidebar-brand-icon" style={{ width: 36, height: 36, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgb(9, 9, 9)", fontSize: 18, fontWeight: 700 }}>
              M
            </div>
            <span>Mouse<span className="accent-text">Base</span></span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={close}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Icon className="sidebar-link-icon" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={() => navigate("/settings")}>
            <FiUser className="sidebar-link-icon" />
            Profile
          </button>
          <button
            className="sidebar-link"
            onClick={() => {
              localStorage.removeItem("mb_api_key");
              localStorage.removeItem("mb_token");
              navigate("/");
            }}
          >
            <FiLogOut className="sidebar-link-icon" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
