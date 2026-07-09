import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiArrowRight } from "react-icons/fi";
import PublicNav from "../components/PublicNav";

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

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

async function fetchJson<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`/api/v1${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error?.message || data?.detail || "Request failed");
  return data as T;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [userCurrency, setUserCurrency] = useState("USD");
  const loggedIn = !!(localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key"));

  useEffect(() => {
    const detected = (() => {
      try {
        const fmt = new Intl.NumberFormat();
        const parts = fmt.resolvedOptions();
        const localeCurrency = (parts as { currency?: string }).currency;
        return localeCurrency || "USD";
      } catch {
        return "USD";
      }
    })();
    setUserCurrency(detected);
  }, []);

  useEffect(() => {
    if (!userCurrency) return;
    const load = async () => {
      try {
        const [p, rateData] = await Promise.all([
          fetchJson<Plan[]>("/payments/plans"),
          userCurrency !== "USD"
            ? fetchJson<{ rate: number }>(`/payments/exchange-rate?currency=${userCurrency}`)
            : Promise.resolve(null),
        ]);
        setPlans(p);
        if (rateData) setExchangeRate(rateData.rate);
        if (loggedIn) {
          try {
            const [s, h] = await Promise.all([
              fetchJson<SubscriptionInfo>("/payments/subscription"),
              fetchJson<{ payments: PaymentHistory[] }>("/payments/history"),
            ]);
            setSub(s);
            setHistory(h.payments || []);
          } catch {}
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load plans");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [loggedIn, userCurrency]);

  const currencySymbol = (() => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: userCurrency, minimumFractionDigits: 0 }).format(0).replace(/[\d\s.,0]/g, "").trim() || (userCurrency === "USD" ? "$" : userCurrency);
    } catch {
      return userCurrency === "USD" ? "$" : userCurrency;
    }
  })();

  const convertPrice = (usdCents: number) => {
    if (usdCents === 0) return 0;
    return Math.round(usdCents / 100 * exchangeRate / 100) * 100;
  };

  const formatPrice = (amount: number) => {
    if (amount === 0) return "Free";
    const converted = userCurrency === "USD" ? amount : convertPrice(amount);
    const displayAmount = converted / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: userCurrency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(displayAmount);
    } catch {
      return `${currencySymbol}${displayAmount.toFixed(0)}`;
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!loggedIn) {
      navigate("/signup");
      return;
    }
    const plan = plans.find((p) => p.id === planId);
    if (!plan || plan.price === 0) return;
    setUpgrading(planId);
    setError("");
    try {
      const order = await fetchJson<{
        order_id: string; amount: number; currency: string; key_id: string;
      }>("/payments/create-order", "POST", { plan_id: planId, currency: userCurrency });
      if (typeof window.Razorpay === "undefined") {
        throw new Error("Razorpay SDK not loaded");
      }
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "MouseBase",
        description: `Upgrade to ${plan.name}`,
        order_id: order.order_id,
        prefill: { email: "" },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          await fetchJson("/payments/verify", "POST", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: planId,
          });
          const s = await fetchJson<SubscriptionInfo>("/payments/subscription");
          setSub(s);
          alert("Plan upgraded successfully!");
        },
        modal: { ondismiss: () => setUpgrading(null) },
      });
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upgrade failed");
      setUpgrading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;
    try {
      await fetchJson("/payments/cancel", "POST");
      const s = await fetchJson<SubscriptionInfo>("/payments/subscription");
      setSub(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cancel failed");
    }
  };

  const loadRazorpayScript = () => {
    if (typeof window.Razorpay !== "undefined") return;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  useEffect(() => { loadRazorpayScript(); }, []);

  const activePlanId = sub?.plan || "FREE";

  if (loading) {
    return (
      <>
        <PublicNav />
        <div className="page-centered"><p>Loading plans...</p></div>
      </>
    );
  }

  return (
    <>
      <PublicNav />
      <div className="page" style={{ paddingTop: 100 }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: 40 }}>
          <h1>Simple, transparent pricing</h1>
          <p>Choose the plan that fits your needs</p>
        </div>

        {error && (
          <div className="error-banner" style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444", padding: "12px 20px", borderRadius: 12, marginBottom: 24, textAlign: "center"
          }}>{error}</div>
        )}

        <div className="pricing-grid">
          {/* TODO: add team/enterprise plan cards when ready */}
          {plans.map((plan) => {
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
                    {formatPrice(plan.price)}
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
                {isCurrent ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button className="btn-primary" disabled style={{ opacity: 0.6, cursor: "default" }}>
                      Current Plan
                    </button>
                    {sub?.cancel_at_period_end ? (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>Canceled — active until {sub.renewal_date ? new Date(sub.renewal_date).toLocaleDateString() : "end of period"}</span>
                    ) : plan.price > 0 ? (
                      <button onClick={handleCancel} className="btn-ghost" style={{ fontSize: 13, color: "#ef4444" }}>
                        Cancel Subscription
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className={`btn-primary ${upgrading === plan.id ? "loading" : ""}`}
                    disabled={upgrading !== null}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    {upgrading === plan.id ? "Processing..." : plan.price === 0 && loggedIn ? "Current Plan" : plan.price === 0 ? "Get Started" : "Upgrade"}
                    {upgrading !== plan.id && <FiArrowRight />}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {sub && sub.plan !== "FREE" && (
          <div className="billing-summary" style={{
            marginTop: 48, background: "var(--bg-card)", borderRadius: 16,
            border: "1px solid var(--border-default)", padding: 32,
          }}>
            <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Subscription Details</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div><strong>Plan:</strong> {sub.plan}</div>
              <div><strong>Status:</strong> <span style={{ color: sub.status === "ACTIVE" ? "#22c55e" : "#ef4444" }}>{sub.status}</span></div>
              {sub.renewal_date && <div><strong>Renewal:</strong> {new Date(sub.renewal_date).toLocaleDateString()}</div>}
              <div><strong>Projects:</strong> {sub.max_projects}</div>
              <div><strong>Memories:</strong> {sub.max_memories.toLocaleString()}</div>
              <div><strong>Searches/mo:</strong> {sub.max_searches_per_month.toLocaleString()}</div>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="billing-history" style={{
            marginTop: 32, background: "var(--bg-card)", borderRadius: 16,
            border: "1px solid var(--border-default)", padding: 32,
          }}>
            <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Payment History</h2>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-secondary)", fontSize: 13 }}>
                  <th style={{ padding: "8px 12px" }}>Date</th>
                  <th style={{ padding: "8px 12px" }}>Amount</th>
                  <th style={{ padding: "8px 12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((pmt) => (
                  <tr key={pmt.id} style={{ borderTop: "1px solid var(--border-default)" }}>
                    <td style={{ padding: "12px" }}>{new Date(pmt.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "12px" }}>{(pmt.amount / 100).toFixed(2)} {pmt.currency}</td>
                    <td style={{ padding: "12px" }}>{pmt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
