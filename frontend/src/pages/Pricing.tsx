import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiArrowRight, FiClock } from "react-icons/fi";
import PublicNav from "../components/PublicNav";
import SEO from "../components/SEO";

interface Plan {
  id: string;
  name: string;
  price: number;
  max_projects: number;
  max_memories: number;
  max_searches_per_month: number;
  requests_per_hour: number;
  description: string;
  coming_soon?: boolean;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  renewal_date: string | null;
  cancel_at_period_end: boolean;
  max_projects: number;
  max_memories: number;
  max_searches_per_month: number;
  requests_per_hour: number;
}

const DEFAULT_PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    max_projects: 1,
    max_memories: 1_000,
    max_searches_per_month: 1_000,
    requests_per_hour: 100,
    description: "Perfect for exploring and prototyping.",
  },
  {
    id: "DEVELOPER",
    name: "Developer",
    price: 999,
    max_projects: 10,
    max_memories: 100_000,
    max_searches_per_month: 50_000,
    requests_per_hour: 1_000,
    description: "For indie developers and small projects.",
    coming_soon: true,
  },
  {
    id: "PRO",
    name: "Pro",
    price: 4999,
    max_projects: 50,
    max_memories: 1_000_000,
    max_searches_per_month: 500_000,
    requests_per_hour: 5_000,
    description: "For growing teams and production apps.",
    coming_soon: true,
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const loggedIn = !!(localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key"));

  useEffect(() => {
    if (!loggedIn) return;
    const load = async () => {
      try {
        const s = await fetchJson<SubscriptionInfo>("/payments/subscription");
        setSub(s);
      } catch {}
    };
    load();
  }, [loggedIn]);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await fetchJson<Plan[]>("/payments/plans");
        if (p && p.length > 0) setPlans(p);
      } catch {}
    };
    load();
  }, []);

  const activePlanId = sub?.plan || "FREE";

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
          {plans.filter((p) => !p.id.startsWith("TEAM_") && p.id !== "ENTERPRISE").map((plan) => {
            const isActive = activePlanId === plan.id;
            const isCurrent = isActive && sub?.status === "ACTIVE";
            return (
              <div key={plan.id} className={`pricing-card ${isCurrent ? "pricing-card-active" : ""}`} style={{
                background: "var(--bg-card)", borderRadius: 16, border: isCurrent ? "2px solid var(--accent)" : "1px solid var(--border-default)",
                padding: 32, display: "flex", flexDirection: "column", gap: 20, flex: 1, minWidth: 280,
              }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{plan.name}</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>{plan.description}</p>
                </div>
                <div>
                  <span style={{ fontSize: 36, fontWeight: 700 }}>
                    {plan.price === 0 ? "Free" : `$${plan.price / 100}`}
                  </span>
                  {plan.price > 0 && <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>/mo</span>}
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
                {plan.coming_soon ? (
                  <button
                    disabled
                    className="btn-secondary"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0.6, cursor: "default" }}
                  >
                    <FiClock /> Coming Soon
                  </button>
                ) : isCurrent ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button className="btn-primary" disabled style={{ opacity: 0.6, cursor: "default" }}>
                      Current Plan
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { if (!loggedIn) navigate("/signup"); }}
                    className="btn-primary"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {plan.price === 0 ? "Get Started" : "Get Started"} <FiArrowRight />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

async function fetchJson<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const res = await fetch(`/api/v1${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal: controller.signal });
  clearTimeout(timer);
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error?.message || data?.detail || "Request failed");
  return data as T;
}
