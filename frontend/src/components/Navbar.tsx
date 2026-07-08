import { useSidebar } from "../App";
import { useTheme } from "../lib/useTheme";
import { FiMenu, FiMoon, FiSun, FiGithub, FiBell, FiUser } from "react-icons/fi";

export default function Navbar() {
  const { toggle } = useSidebar();
  const { dark, toggle: toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-toggle" onClick={toggle}>
          <FiMenu size={20} />
        </button>
        <div className="navbar-brand">Mouse<span style={{ color: "var(--accent)" }}>Base</span></div>
      </div>

      <div className="navbar-right">
        <a href="https://github.com/anomalyco/MouseBase" target="_blank" rel="noopener noreferrer" className="navbar-icon-btn navbar-desktop-only" title="GitHub">
          <FiGithub size={18} />
        </a>
        <button className="navbar-icon-btn navbar-desktop-only" title="Notifications">
          <FiBell size={18} />
        </button>
        <button className="navbar-icon-btn" onClick={toggleTheme} title="Toggle theme">
          {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <div className="navbar-avatar">
          <FiUser size={16} />
        </div>
      </div>
    </header>
  );
}
