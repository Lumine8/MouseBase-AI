import { useEffect, useState } from "react";
import { FiX, FiPlus, FiDownload } from "react-icons/fi";

const BASE = "/api/v1";

interface Plan {
  id: string; name: string; price: number; max_projects: number;
  max_memories: number; max_searches_per_month: number;
  requests_per_hour: number; description: string;
}

interface SubscriptionInfo {
  plan: string; status: string; renewal_date: string | null;
  cancel_at_period_end: boolean; max_projects: number;
  max_memories: number; max_searches_per_month: number; requests_per_hour: number;
}

interface PaymentRecord {
  id: string; amount: number; currency: string; status: string; created_at: string;
}

interface PlanLimits {
  max_memories: number; max_searches_per_month: number;
  max_projects: number; requests_per_hour: number;
}

interface BillingUsage {
  monthly_requests: number; monthly_searches: number;
  monthly_embeddings: number; total_storage_bytes: number;
  total_memories: number; total_projects: number;
  plan_limits: PlanLimits | null;
}

async function fetchJson<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const token = localStorage.getItem("mb_token") || localStorage.getItem("mb_api_key");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data: any;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data?.error?.message || data?.detail || "Request failed");
  return data as T;
}

declare global {
  interface Window { Razorpay: new (options: Record<string, unknown>) => { open: () => void }; }
}

export default function Billing() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [addons, setAddons] = useState<Record<string, { price: number; description: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [userCurrency, setUserCurrency] = useState("USD");

  const detectedCurrency = (() => {
    try {
      const fmt = new Intl.NumberFormat();
      const parts = fmt.resolvedOptions();
      return (parts as { currency?: string }).currency || "USD";
    } catch { return "USD"; }
  })();

  const currencySymbol = (() => {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: userCurrency, minimumFractionDigits: 0 })
        .format(0).replace(/[\d\s.,0]/g, "").trim() || (userCurrency === "USD" ? "$" : userCurrency);
    } catch { return userCurrency === "USD" ? "$" : userCurrency; }
  })();

  useEffect(() => { setUserCurrency(detectedCurrency); }, []);

  useEffect(() => {
    if (!userCurrency) return;
    const load = async () => {
      try {
        const [p, rateData, s, h, u, a] = await Promise.all([
          fetchJson<Plan[]>("/payments/plans"),
          userCurrency !== "USD"
            ? fetchJson<{ rate: number }>(`/payments/exchange-rate?currency=${userCurrency}`)
            : Promise.resolve(null),
          fetchJson<SubscriptionInfo>("/payments/subscription").catch(() => null),
          fetchJson<{ payments: PaymentRecord[] }>("/payments/history").catch(() => ({ payments: [] })),
          fetchJson<BillingUsage>("/dashboard/billing-usage").catch(() => null),
          fetchJson<Record<string, { price: number; description: string }>>("/payments/addons").catch(() => ({})),
        ]);
        setPlans(p);
        if (rateData) setExchangeRate(rateData.rate);
        setSub(s);
        setHistory(h?.payments || []);
        setUsage(u);
        setAddons(a);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userCurrency]);

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

  const activePlan = plans.find((p) => p.id === sub?.plan);
  const activePlanName = activePlan?.name || sub?.plan || "Free";
  const isPaid = sub && sub.plan !== "FREE" && sub.status === "ACTIVE";

  const handleUpgrade = async (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || plan.price === 0) return;
    setUpgrading(planId);
    setError("");
    try {
      const order = await fetchJson<{ order_id: string; amount: number; currency: string; key_id: string }>(
        "/payments/create-order", "POST", { plan_id: planId, currency: userCurrency }
      );
      if (typeof window.Razorpay === "undefined") throw new Error("Razorpay SDK not loaded");
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "MouseBase",
        description: `Upgrade to ${plan.name}`,
        order_id: order.order_id,
        prefill: { email: "" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await fetchJson("/payments/verify", "POST", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan_id: planId,
          });
          const s = await fetchJson<SubscriptionInfo>("/payments/subscription");
          setSub(s);
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

  const handleAddonPurchase = async (addonType: string) => {
    setError("");
    try {
      const addonInfo = addons[addonType];
      if (!addonInfo) return;
      const order = await fetchJson<{ order_id: string; amount: number; currency: string; key_id: string }>(
        "/payments/create-addon-order", "POST", { addon_type: addonType, quantity: 1, currency: userCurrency }
      );
      if (typeof window.Razorpay === "undefined") throw new Error("Razorpay SDK not loaded");
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "MouseBase",
        description: `Add-on: ${addonInfo.description}`,
        order_id: order.order_id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          await fetchJson("/payments/verify-addon", "POST", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            addon_type: addonType,
            quantity: 1,
          });
          const s = await fetchJson<SubscriptionInfo>("/payments/subscription");
          setSub(s);
          const u = await fetchJson<BillingUsage>("/dashboard/billing-usage");
          setUsage(u);
        },
      });
      rzp.open();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Add-on purchase failed");
    }
  };

  useEffect(() => {
    if (typeof window.Razorpay === "undefined") {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const storageGB = usage ? (usage.total_storage_bytes / (1024 * 1024 * 1024)).toFixed(2) : "0";
  const memPct = usage?.plan_limits ? Math.min(100, Math.round((usage.total_memories / usage.plan_limits.max_memories) * 100)) : 0;
  const searchPct = usage?.plan_limits ? Math.min(100, Math.round((usage.monthly_searches / usage.plan_limits.max_searches_per_month) * 100)) : 0;

  if (loading) {
    return <div className="page page-centered"><p>Loading billing...</p></div>;
  }

  return (
    <div className="page" style={{ maxWidth: 960 }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 24, margin: 0 }}>Billing</h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            Manage your subscription, usage, and payment history
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Current Plan */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Current Plan</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
                {sub?.status === "CANCELED"
                  ? "Your subscription has been canceled"
                  : "You are on the <strong>" + activePlanName + "</strong> plan"}
              </p>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: sub?.status === "ACTIVE" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: sub?.status === "ACTIVE" ? "#22c55e" : "#ef4444",
            }}>
              {sub?.status === "ACTIVE" ? "Active" : sub?.status === "CANCELED" ? "Canceled" : sub?.status || "Free"}
            </div>
          </div>

          <div className="section-divider" />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Plan</div>
              <div style={{ fontWeight: 600 }}>{activePlanName}</div>
              {activePlan && (
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {formatPrice(activePlan.price)}{activePlan.price > 0 ? "/mo" : ""}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Renewal</div>
              <div style={{ fontWeight: 600 }}>
                {sub?.renewal_date
                  ? new Date(sub.renewal_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                  : "—"}
              </div>
              {sub?.cancel_at_period_end && sub?.renewal_date && (
                <div style={{ fontSize: 12, color: "#ef4444" }}>
                  Ends on {new Date(sub.renewal_date).toLocaleDateString()}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Projects</div>
              <div style={{ fontWeight: 600 }}>{usage?.total_projects || 0} / {sub?.max_projects || 1}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>API Rate Limit</div>
              <div style={{ fontWeight: 600 }}>{sub?.requests_per_hour?.toLocaleString() || 100} req/hr</div>
            </div>
          </div>

          <div className="section-divider" />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {isPaid && !sub?.cancel_at_period_end && (
              <button onClick={handleCancel} className="btn-secondary" style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
                <FiX size={14} /> Cancel Subscription
              </button>
            )}
            {plans.filter((p) => p.id !== "FREE" && p.id !== "ENTERPRISE").map((plan) => {
              if (plan.id === sub?.plan) return null;
              return (
                <button
                  key={plan.id}
                  onClick={() => handleUpgrade(plan.id)}
                  className="btn-primary"
                  disabled={upgrading !== null}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {upgrading === plan.id ? "Processing..." : `Upgrade to ${plan.name}`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Usage */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Usage</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Memories</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {usage?.total_memories?.toLocaleString() || 0}
                  {usage?.plan_limits ? ` / ${usage.plan_limits.max_memories.toLocaleString()}` : ""}
                </span>
              </div>
              {usage?.plan_limits && (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${memPct}%` }} />
                </div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Searches (this month)</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {usage?.monthly_searches?.toLocaleString() || 0}
                  {usage?.plan_limits ? ` / ${usage.plan_limits.max_searches_per_month.toLocaleString()}` : ""}
                </span>
              </div>
              {usage?.plan_limits && (
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${searchPct}%` }} />
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Requests (this month)</div>
              <div style={{ fontWeight: 600 }}>{usage?.monthly_requests?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>Storage</div>
              <div style={{ fontWeight: 600 }}>{storageGB} GB</div>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--text-muted)" }}>
            Usage resets at the start of each billing cycle.
          </div>
        </div>

        {/* Add-ons */}
        {isPaid && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Add-ons</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
              Extend your plan limits with one-time purchases
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(addons).map(([key, info]) => (
                <div key={key} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", background: "var(--bg-base)", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border-default)",
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{info.description}</div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{formatPrice(info.price)}</div>
                  </div>
                  <button onClick={() => handleAddonPurchase(key)} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FiPlus size={14} /> Buy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 16px" }}>Payment History</h2>
          {history.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>No payment history yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((pmt) => (
                    <tr key={pmt.id}>
                      <td>{new Date(pmt.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td>{(pmt.amount / 100).toFixed(2)} {pmt.currency}</td>
                      <td>
                        <span style={{
                          padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 500,
                          background: pmt.status === "captured" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                          color: pmt.status === "captured" ? "#22c55e" : "#ef4444",
                        }}>
                          {pmt.status === "captured" ? "Paid" : pmt.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn-ghost" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                          <FiDownload size={12} /> Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* CLI */}
        <div className="card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Developer Experience — CLI</h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 16px" }}>
            The MouseBase CLI is coming in Phase 2. Here's a preview of the commands:
          </p>
          <div style={{
            background: "var(--bg-base)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-default)",
            padding: 20, fontFamily: "var(--font-mono, monospace)", fontSize: 13, display: "flex", flexDirection: "column", gap: 12,
          }}>
            {[
              { cmd: "mousebase login", desc: "Authenticate with your MouseBase account" },
              { cmd: "mousebase remember <content>", desc: "Store a memory" },
              { cmd: "mousebase search <query>", desc: "Semantic search across memories" },
              { cmd: "mousebase projects", desc: "List and manage your projects" },
              { cmd: "mousebase whoami", desc: "Show current user and API key info" },
            ].map(({ cmd, desc }) => (
              <div key={cmd}>
                <div style={{ color: "var(--accent)", fontWeight: 600 }}>$ {cmd}</div>
                <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 1 }}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "12px 0 0" }}>
            Developers love CLIs. The MouseBase CLI will be available as a standalone binary and via npm.
          </p>
        </div>

      </div>
    </div>
  );
}
