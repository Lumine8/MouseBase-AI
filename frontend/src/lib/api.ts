const BASE_URL = "/api/v1";

class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  authToken?: string | null,
  useApiKey?: boolean,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = localStorage.getItem("mb_api_key");
  const token = localStorage.getItem("mb_token");

  if (useApiKey) {
    const key = authToken ?? apiKey;
    if (key) {
      headers["Authorization"] = `Bearer ${key}`;
    }
  } else {
    const t = authToken ?? token ?? apiKey;
    if (t) {
      headers["Authorization"] = `Bearer ${t}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();

  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "unknown_error",
      err.message ?? "An unexpected error occurred"
    );
  }

  return data as T;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  api_key_id: string;
  api_key?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type ProjectWithKey = Project;

export interface CreateProjectRequest {
  name: string;
  description?: string | null;
}

export interface UpdateProjectRequest {
  name?: string | null;
  description?: string | null;
}

export interface RememberResponse {
  id: string;
  external_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RememberRequest {
  content: string;
  external_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Memory {
  id: string;
  external_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateMemoryRequest {
  content?: string | null;
  metadata?: Record<string, unknown> | null;
  external_id?: string | null;
}

export interface SearchResult {
  id: string;
  external_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface SearchRequest {
  query: string;
  top_k?: number;
}

export interface UserResponse {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const auth = {
  signup: (data: SignupRequest) =>
    request<AuthResponse>("POST", "/auth/signup", data),
  login: (data: LoginRequest) =>
    request<AuthResponse>("POST", "/auth/login", data),
  me: () =>
    request<UserResponse>("GET", "/auth/me"),
};

export const projects = {
  create: (data: CreateProjectRequest) =>
    request<ProjectWithKey>("POST", "/projects/", data),
};

export interface DashboardMetrics {
  total_memories: number;
  total_searches: number;
  total_requests: number;
  total_embeddings: number;
  total_projects: number;
  plan: string;
}

export interface DailyUsage {
  day: string;
  requests: number;
  searches: number;
  embeddings: number;
  storage_bytes: number;
}

export interface AnalyticsTotals {
  requests: number;
  searches: number;
  embeddings: number;
  memories: number;
  storage_bytes: number;
}

export interface AnalyticsResponse {
  daily: DailyUsage[];
  totals: AnalyticsTotals;
}

export const dashboard = {
  metrics: () =>
    request<DashboardMetrics>("GET", "/dashboard/metrics"),
  analytics: () =>
    request<AnalyticsResponse>("GET", "/dashboard/analytics"),
};

export interface PlanInfo {
  id: string;
  name: string;
  price: number;
  max_projects: number;
  max_memories: number;
  max_searches_per_month: number;
  requests_per_hour: number;
  description: string;
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  plan_id: string;
  key_id: string;
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan_id: string;
}

export interface VerifyPaymentResponse {
  status: string;
  message: string;
  plan: string;
}

export interface SubscriptionInfo {
  plan: string;
  status: string;
  renewal_date: string | null;
  cancel_at_period_end: boolean;
  max_projects: number;
  max_memories: number;
  max_searches_per_month: number;
  requests_per_hour: number;
}

export interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface BillingHistoryResponse {
  payments: PaymentHistoryItem[];
}

export const payments = {
  listPlans: () =>
    request<PlanInfo[]>("GET", "/payments/plans"),
  listAddons: () =>
    request<Record<string, { price: number; description: string }>>("GET", "/payments/addons"),
  createOrder: (planId: string) =>
    request<CreateOrderResponse>("POST", "/payments/create-order", { plan_id: planId }),
  verify: (data: VerifyPaymentRequest) =>
    request<VerifyPaymentResponse>("POST", "/payments/verify", data),
  getSubscription: () =>
    request<SubscriptionInfo>("GET", "/payments/subscription"),
  cancel: () =>
    request<{ status: string; message: string }>("POST", "/payments/cancel"),
  getHistory: () =>
    request<BillingHistoryResponse>("GET", "/payments/history"),
  createAddonOrder: (addonType: string, quantity: number = 1) =>
    request<CreateOrderResponse>("POST", "/payments/create-addon-order", { addon_type: addonType, quantity }),
  verifyAddon: (data: Record<string, unknown>) =>
    request<VerifyPaymentResponse>("POST", "/payments/verify-addon", data),
  cancelAddon: (addonType: string, quantity: number = 1) =>
    request<SubscriptionInfo>("POST", "/payments/cancel-addon", { addon_type: addonType, quantity }),
};

export const api = {
  projects: {
    list: () =>
      request<Project[]>("GET", "/projects/"),
    get: (id: string) =>
      request<Project>("GET", `/projects/${id}`),
    create: (data: CreateProjectRequest) =>
      request<Project>("POST", "/projects/", data),
    update: (id: string, data: UpdateProjectRequest) =>
      request<Project>("PATCH", `/projects/${id}`, data),
    delete: (id: string) =>
      request<void>("DELETE", `/projects/${id}`),
    rotateKey: (id: string) =>
      request<Project>("POST", `/projects/${id}/api-key/rotate`),
  },

  remember: (data: RememberRequest, apiKey?: string) =>
    request<RememberResponse>("POST", "/remember/", data, apiKey ?? null, true),

  search: (data: SearchRequest, apiKey?: string) =>
    request<SearchResponse>("POST", "/search/", data, apiKey ?? null, true),

  memory: {
    get: (id: string, apiKey?: string) =>
      request<Memory>("GET", `/memory/${id}`, undefined, apiKey ?? null, true),
    update: (id: string, data: UpdateMemoryRequest, apiKey?: string) =>
      request<Memory>("PATCH", `/memory/${id}`, data, apiKey ?? null, true),
    delete: (id: string, apiKey?: string) =>
      request<void>("DELETE", `/memory/${id}`, undefined, apiKey ?? null, true),
  },
};
