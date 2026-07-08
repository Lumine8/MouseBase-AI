import { useState, createContext, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Playground from "./pages/Playground";
import SearchPage from "./pages/Search";
import Documentation from "./pages/Documentation";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Billing from "./pages/Billing";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

const SidebarCtx = createContext<{ open: boolean; toggle: () => void; close: () => void }>({
  open: false, toggle: () => {}, close: () => {},
});

export const useSidebar = () => useContext(SidebarCtx);

function hasAuth(): boolean {
  return !!(localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key"));
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SidebarCtx.Provider value={{
      open: sidebarOpen,
      toggle: () => setSidebarOpen((v) => !v),
      close: () => setSidebarOpen(false),
    }}>
      <div className="app-layout">
        <Sidebar />
        <div className="app-main">
          <Navbar />
          <main className="app-content">{children}</main>
        </div>
      </div>
    </SidebarCtx.Provider>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!hasAuth()) return <Navigate to="/login" replace />;
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  if (hasAuth()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><Signup /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/docs" element={<Documentation />} />
      <Route path="/docs/:section" element={<Documentation />} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={hasAuth() ? "/dashboard" : "/"} replace />} />
    </Routes>
  );
}
