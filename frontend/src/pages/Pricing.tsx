import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiArrowRight, FiClock } from "react-icons/fi";
import PublicNav from "../components/PublicNav";
import SEO from "../components/SEO";
import { SkeletonLine } from "../components/Skeleton";

interface Plan {
  id: string;
  name: string;
  price: number;
  max_projects: number;
  max_memories: number;
  max_searches_per_month: number;
  requests_per_hour: number;
  description: string;
}

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedIn = !!(localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key"));

  useEffect(() => {
    const load = async () => {
      try {
        const p = await fetchJson<Plan[]>("/payments/plans");
        if (p && p.length > 0) {
          setPlans(p);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePlanClick = (planId: string) => {
    if (planId === "FREE") {
      navigate(loggedIn ? "/dashboard" : "/signup");
    } else {
      navigate(loggedIn ? "/billing" : "/signup");
    }
  };

  return (
    <>
      <SEO
        title="Pricing"
        description="Simple, transparent pricing for MouseBase. Choose the plan that fits your needs — from free to enterprise."
        path="/pricing"
      />
      <PublicNav />
      <div className="page" style={{ paddingTop: 100 }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: 40 }}>
          <h1>Simple, transparent pricing</h1>
          <p>Choose the plan that fits your needs</p>
        </div>

        <div className="pricing-grid">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="pricing-card" style={{
                background: "var(--bg-card)", borderRadius: 16,
                border: "1px solid var(--border-default)", padding: 32,
                display: "flex", flexDirection: "column", gap: 16, flex: 1, minWidth: 280,
              }}>
                <SkeletonLine width="40%" />
                <SkeletonLine width="60%" />
                <SkeletonLine width="80%" />
                <SkeletonLine width="30%" />
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine />
                <SkeletonLine width="60%" />
              </div>
            ))
          ) : !plans || plans.length === 0 ? (
            <div className="pricing-card" style={{
              background: "var(--bg-card)", borderRadius: 16,
              border: "1px solid var(--border-default)", padding: 32, textAlign: "center",
              flex: 1, minWidth: 280,
            }}>
              <FiClock size={32} style={{ color: "var(--accent)", marginBottom: 12 }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Coming Soon</h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Pricing plans are being finalized. The free tier is available now — sign up to lock in early access pricing.
              </p>
              <button onClick={() => navigate(loggedIn ? "/dashboard" : "/signup")} className="btn-primary" style={{ marginTop: 16 }}>
                {loggedIn ? "Go to Dashboard" : "Get Started Free"} <FiArrowRight />
              </button>
            </div>
          ) : (
            plans.filter((p) => !p.id.startsWith("TEAM_") && p.id !== "ENTERPRISE").map((plan) => {
              const isPaid = plan.price > 0;
              return (
                <div key={plan.id} className="pricing-card" style={{
                  background: "var(--bg-card)", borderRadius: 16,
                  border: isPaid ? "1px solid var(--border-default)" : "2px solid var(--accent)",
                  padding: 32, display: "flex", flexDirection: "column", gap: 20, flex: 1, minWidth: 280,
                }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{plan.name}</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>{plan.description}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 36, fontWeight: 700 }}>
                      {plan.price === 0 ? "Free" : `$${(plan.price / 100).toFixed(2)}`}
                    </span>
                    {isPaid && <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>/mo</span>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                    {[
                      `${plan.max_memories.toLocaleString()} memories`,
                      `${plan.max_searches_per_month.toLocaleString()} searches/mo`,
                      `${plan.max_projects} project${plan.max_projects > 1 ? "s" : ""}`,
                      `${plan.requests_per_hour.toLocaleString()} req/hr`,
                    ].map((feat) => (
                      <div key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                        <FiCheck style={{ color: "var(--accent)", flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => handlePlanClick(plan.id)} className={isPaid ? "btn-primary" : "btn-secondary"} style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {plan.price === 0
                      ? (loggedIn ? "Current Plan" : "Get Started")
                      : (loggedIn ? "Upgrade" : "Sign Up")} <FiArrowRight />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

async function fetchJson<T>(path: string): Promise<T> {
  const token = localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const res = await fetch(`${API_BASE}${path}`, { method: "GET", headers, signal: controller.signal });
  clearTimeout(timer);
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error?.message || data?.detail || "Request failed");
  return data as T;
}
