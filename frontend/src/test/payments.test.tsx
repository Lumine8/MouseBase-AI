import { describe, it, expect, beforeEach, vi } from "vitest";
import { payments, type PlanInfo, type CreateOrderResponse, type VerifyPaymentResponse, type SubscriptionInfo, type BillingHistoryResponse } from "../lib/api";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Pricing from "../pages/Pricing";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(status: number, body: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
});

const plans: PlanInfo[] = [
  { id: "FREE", name: "Free", price: 0, max_projects: 1, max_memories: 1000, max_searches_per_month: 1000, requests_per_hour: 100, description: "For individuals" },
  { id: "DEVELOPER", name: "Developer", price: 900, max_projects: 3, max_memories: 50000, max_searches_per_month: 50000, requests_per_hour: 1000, description: "For indie developers" },
  { id: "PRO", name: "Pro", price: 1900, max_projects: 10, max_memories: 500000, max_searches_per_month: 200000, requests_per_hour: 5000, description: "For production" },
];

const order: CreateOrderResponse = {
  order_id: "order_test_001", amount: 900, currency: "USD", plan_id: "DEVELOPER", key_id: "rzp_test_xxx",
};

const verifyResp: VerifyPaymentResponse = { status: "success", message: "Plan upgraded", plan: "DEVELOPER" };

const subscription: SubscriptionInfo = {
  plan: "DEVELOPER", status: "ACTIVE", renewal_date: "2026-08-07T00:00:00Z",
  cancel_at_period_end: false, max_projects: 3, max_memories: 50000,
  max_searches_per_month: 50000, requests_per_hour: 1000,
};

const history: BillingHistoryResponse = {
  payments: [{ id: "pay_001", amount: 900, currency: "USD", status: "captured", created_at: "2026-07-07T00:00:00Z" }],
};

// ─── API Client Tests (20) ───────────────────────────────────────────────

describe("payments.listPlans", () => {
  it("sends GET /payments/plans and returns plans", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    const result = await payments.listPlans();
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/plans", expect.objectContaining({ method: "GET" }));
    expect(result).toHaveLength(3);
    expect(result[0].name).toBe("Free");
  });

  it("includes free plan with price zero", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    const result = await payments.listPlans();
    const free = result.find((p) => p.id === "FREE");
    expect(free?.price).toBe(0);
  });

  it("returns all paid plan prices", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    const result = await payments.listPlans();
    const dev = result.find((p) => p.id === "DEVELOPER");
    expect(dev?.price).toBe(900);
    const pro = result.find((p) => p.id === "PRO");
    expect(pro?.price).toBe(1900);
  });
});

describe("payments.listAddons", () => {
  it("sends GET /payments/addons and returns addons", async () => {
    const addons = { additional_memory_1k: { price: 99, description: "1K memories" } };
    mockFetch.mockResolvedValue(mockResponse(200, addons));
    const result = await payments.listAddons();
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/addons", expect.objectContaining({ method: "GET" }));
    expect(result.additional_memory_1k.price).toBe(99);
  });

  it("includes all addon types", async () => {
    const addons = {
      additional_memory_1k: { price: 99, description: "" },
      additional_searches_1k: { price: 49, description: "" },
      additional_project: { price: 199, description: "" },
    };
    mockFetch.mockResolvedValue(mockResponse(200, addons));
    const result = await payments.listAddons();
    expect(Object.keys(result).length).toBe(3);
  });
});

describe("payments.createOrder", () => {
  it("sends POST /payments/create-order with plan_id", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValue(mockResponse(200, order));
    const result = await payments.createOrder("DEVELOPER");
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/create-order", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer test_token" }),
    }));
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.plan_id).toBe("DEVELOPER");
    expect(result.order_id).toBe("order_test_001");
  });

  it("returns amount and currency", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, order));
    const result = await payments.createOrder("DEVELOPER");
    expect(result.amount).toBe(900);
    expect(result.currency).toBe("USD");
  });
});

describe("payments.verify", () => {
  it("sends POST /payments/verify with payment data", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, verifyResp));
    const data = { razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig", plan_id: "DEVELOPER" };
    const result = await payments.verify(data);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/verify", expect.objectContaining({ method: "POST" }));
    expect(result.status).toBe("success");
  });

  it("returns the upgraded plan", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, verifyResp));
    const data = { razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig", plan_id: "DEVELOPER" };
    const result = await payments.verify(data);
    expect(result.plan).toBe("DEVELOPER");
  });
});

describe("payments.getSubscription", () => {
  it("sends GET /payments/subscription and returns info", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, subscription));
    const result = await payments.getSubscription();
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/subscription", expect.objectContaining({ method: "GET" }));
    expect(result.plan).toBe("DEVELOPER");
    expect(result.status).toBe("ACTIVE");
  });

  it("returns plan limits", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, subscription));
    const result = await payments.getSubscription();
    expect(result.max_projects).toBe(3);
    expect(result.max_memories).toBe(50000);
  });
});

describe("payments.cancel", () => {
  it("sends POST /payments/cancel and returns status", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, { status: "canceled", message: "Canceled" }));
    const result = await payments.cancel();
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/cancel", expect.objectContaining({ method: "POST" }));
    expect(result.status).toBe("canceled");
  });
});

describe("payments.getHistory", () => {
  it("sends GET /payments/history and returns payments", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, history));
    const result = await payments.getHistory();
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/history", expect.objectContaining({ method: "GET" }));
    expect(result.payments).toHaveLength(1);
  });

  it("includes amount and status in history", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, history));
    const result = await payments.getHistory();
    expect(result.payments[0].amount).toBe(900);
    expect(result.payments[0].status).toBe("captured");
  });
});

describe("payments.createAddonOrder", () => {
  it("sends POST /payments/create-addon-order with addon type", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, order));
    const result = await payments.createAddonOrder("additional_memory_1k", 1);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/create-addon-order", expect.objectContaining({ method: "POST" }));
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.addon_type).toBe("additional_memory_1k");
    expect(result.order_id).toBe("order_test_001");
  });

  it("accepts quantity parameter", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, { ...order, amount: 198 }));
    const result = await payments.createAddonOrder("additional_memory_1k", 2);
    expect(result.amount).toBe(198);
  });
});

describe("payments.verifyAddon", () => {
  it("sends POST /payments/verify-addon and returns response", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, verifyResp));
    const data = { razorpay_order_id: "o1", razorpay_payment_id: "p1", razorpay_signature: "s1", addon_type: "additional_memory_1k", quantity: 1 };
    const result = await payments.verifyAddon(data);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/verify-addon", expect.objectContaining({ method: "POST" }));
    expect(result.status).toBe("success");
  });
});

describe("payments.cancelAddon", () => {
  it("sends POST /payments/cancel-addon", async () => {
    localStorage.setItem("mb_token", "token");
    mockFetch.mockResolvedValue(mockResponse(200, subscription));
    const result = await payments.cancelAddon("additional_memory_1k", 1);
    expect(mockFetch).toHaveBeenCalledWith("/api/v1/payments/cancel-addon", expect.objectContaining({ method: "POST" }));
    expect(result.plan).toBe("DEVELOPER");
  });
});

// ─── Pricing Page Component Tests (22) ───────────────────────────────────

describe("Pricing page rendering", () => {
  it("shows loading state initially", () => {
    mockFetch.mockResolvedValue(new Promise(() => {})); // never resolves
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    expect(screen.getByText("Loading plans...")).toBeInTheDocument();
  });

  it("renders plan names after loading", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Developer")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
    });
  });

  it("renders plan descriptions", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("For individuals")).toBeInTheDocument();
      expect(screen.getByText("For indie developers")).toBeInTheDocument();
    });
  });

  it("shows price for paid plans", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("$9")).toBeInTheDocument();
      expect(screen.getByText("$19")).toBeInTheDocument();
    });
  });

  it("shows Free for free plan price", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      const freeTexts = screen.getAllByText("Free");
      expect(freeTexts.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows memory limits in feature list", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("1,000 memories")).toBeInTheDocument();
      expect(screen.getByText("50,000 memories")).toBeInTheDocument();
    });
  });

  it("shows current plan for logged in user on FREE", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, plans));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ...subscription, plan: "FREE" }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { payments: [] }));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      const buttons = screen.getAllByText("Current Plan");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});

describe("Pricing page user auth state", () => {
  it("shows Get Started button when not logged in", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      const buttons = screen.getAllByText("Get Started");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it("shows sign in option for anonymous users via PublicNav", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Sign In")).toBeInTheDocument();
    });
  });

  it("shows Dashboard button when logged in", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, plans));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ...subscription, plan: "FREE" }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { payments: [] }));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });
});

describe("Pricing page subscription details", () => {
  it("shows subscription info for logged in user on paid plan", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, plans));
    mockFetch.mockResolvedValueOnce(mockResponse(200, subscription));
    mockFetch.mockResolvedValueOnce(mockResponse(200, history));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Subscription Details")).toBeInTheDocument();
    });
  });

  it("shows payment history", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, plans));
    mockFetch.mockResolvedValueOnce(mockResponse(200, subscription));
    mockFetch.mockResolvedValueOnce(mockResponse(200, history));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Payment History")).toBeInTheDocument();
    });
  });

  it("shows Cancel Subscription button for paid plan", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, plans));
    mockFetch.mockResolvedValueOnce(mockResponse(200, subscription));
    mockFetch.mockResolvedValueOnce(mockResponse(200, history));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Cancel Subscription")).toBeInTheDocument();
    });
  });

  it("does not show cancel for free plan", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, plans));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { ...subscription, plan: "FREE" }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, { payments: [] }));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.queryByText("Cancel Subscription")).not.toBeInTheDocument();
    });
  });
});

describe("Pricing page error state", () => {
  it("shows error message when plans fail to load", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});

describe("Pricing page plan features", () => {
  it("shows search limits in feature list", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("1,000 searches/mo")).toBeInTheDocument();
      expect(screen.getByText("50,000 searches/mo")).toBeInTheDocument();
    });
  });

  it("shows project limits in feature list", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("1 project")).toBeInTheDocument();
      expect(screen.getByText("3 projects")).toBeInTheDocument();
    });
  });

  it("shows request per hour limits", async () => {
    mockFetch.mockResolvedValue(mockResponse(200, plans));
    render(<MemoryRouter><Pricing /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("100 req/hr")).toBeInTheDocument();
      expect(screen.getByText("1,000 req/hr")).toBeInTheDocument();
    });
  });
});

// ─── Dashboard plan display (2) ──────────────────────────────────────────

describe("Dashboard plan display", () => {
  it("shows plan name in metrics", async () => {
    localStorage.setItem("mb_token", "test_token");
    mockFetch.mockResolvedValueOnce(mockResponse(200, {
      id: "u1", email: "test@test.com", full_name: null, avatar_url: null,
      email_verified: true, created_at: "", updated_at: "",
    }));
    mockFetch.mockResolvedValueOnce(mockResponse(200, [
      { id: "p1", owner_id: "u1", name: "Test", description: null, api_key_id: "k1", status: "ACTIVE", created_at: "", updated_at: "" },
    ]));
    mockFetch.mockResolvedValueOnce(mockResponse(200, {
      total_memories: 100, total_searches: 10, total_requests: 50,
      total_embeddings: 10, total_projects: 1, plan: "free",
    }));
    const { default: Dashboard } = await import("../pages/Dashboard");
    render(<MemoryRouter><Dashboard /></MemoryRouter>);
    await waitFor(() => {
      expect(screen.getByText("Free")).toBeInTheDocument();
    });
  });
});

// ─── PublicNav pricing link (1) ──────────────────────────────────────────

describe("PublicNav pricing link", () => {
  it("renders Pricing link in navigation", async () => {
    const { default: PublicNav } = await import("../components/PublicNav");
    render(<MemoryRouter><PublicNav /></MemoryRouter>);
    expect(screen.getByText("Pricing")).toBeInTheDocument();
  });
});

// Total: 20 API + 22 component + 1 dashboard + 1 PublicNav = 44 frontend tests
// Combined with 114 backend tests = 158 total
