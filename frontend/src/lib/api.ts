const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const TIMEOUT_MS = 10_000;

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

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  });
  clearTimeout(timer);

  if (res.status === 204) {
    return undefined as T;
  }

  if (res.status === 401 && !useApiKey && !path.includes("/auth/login") && !path.includes("/auth/signup") && !path.includes("/auth/refresh")) {
    const refreshToken = localStorage.getItem("mb_refresh_token");
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          localStorage.setItem("mb_token", refreshData.token);
          localStorage.setItem("mb_refresh_token", refreshData.refresh_token);

          headers["Authorization"] = `Bearer ${refreshData.token}`;
          const retryRes = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
          if (retryRes.status === 204) return undefined as T;
          const retryData = await retryRes.json();
          if (!retryRes.ok) {
            const err = retryData?.error ?? {};
            throw new ApiError(retryRes.status, err.code ?? "unknown_error", err.message ?? "An unexpected error occurred");
          }
          return retryData as T;
        } else {
          localStorage.removeItem("mb_token");
          localStorage.removeItem("mb_refresh_token");
        }
      } catch {}
    }
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
  memory_id: string;
  created_at: string;
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
  embedding_model?: string;
  embedding_dimensions?: number;
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
  refresh_token: string;
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

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  token: string;
  refresh_token: string;
}

export const auth = {
  signup: (data: SignupRequest) =>
    request<AuthResponse>("POST", "/auth/signup", data),
  login: (data: LoginRequest) =>
    request<AuthResponse>("POST", "/auth/login", data),
  refresh: (refreshToken: string) =>
    request<RefreshResponse>("POST", "/auth/refresh", { refresh_token: refreshToken }),
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

export interface MemoryListItem {
  id: string;
  external_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  embedding_model?: string;
  embedding_dimensions?: number;
}

export interface MemoryListResponse {
  memories: MemoryListItem[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface MemoryStats {
  total_memories: number;
  storage_bytes: number;
  avg_memory_length: number;
  top_external_ids: { external_id: string; count: number }[];
  top_metadata_keys: { key: string; count: number }[];
  memories_created_today: number;
  searches_today: number;
}

export interface BatchExportResponse {
  memories: Record<string, unknown>[];
  format: string;
  count: number;
}

export interface TimelineEntry {
  id: string;
  action: string;
  memory_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface TimelineResponse {
  entries: TimelineEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

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

  explorer: {
    list: (projectId: string, params?: Record<string, string | number>) => {
      const qs = params ? "?" + new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => [k, String(v)])
      ).toString() : "";
      return request<MemoryListResponse>("GET", `/projects/${projectId}/memories${qs}`);
    },
    stats: (projectId: string) =>
      request<MemoryStats>("GET", `/projects/${projectId}/memories/stats`),
    batchDelete: (projectId: string, memoryIds: string[]) =>
      request<{ deleted: number }>("POST", `/projects/${projectId}/memories/batch-delete`, { memory_ids: memoryIds }),
    export: (projectId: string, memoryIds: string[], format: string = "json") =>
      request<BatchExportResponse>("POST", `/projects/${projectId}/memories/export`, { memory_ids: memoryIds, format }),
    move: (projectId: string, memoryIds: string[], targetProjectId: string) =>
      request<{ moved: number }>("POST", `/projects/${projectId}/memories/move`, { memory_ids: memoryIds, target_project_id: targetProjectId }),
    batchAddMetadata: (projectId: string, memoryIds: string[], metadata: Record<string, unknown>) =>
      request<{ updated: number }>("POST", `/projects/${projectId}/memories/batch-add-metadata`, { memory_ids: memoryIds, metadata }),
    timeline: (projectId: string, page: number = 1, perPage: number = 50) =>
      request<TimelineResponse>("GET", `/projects/${projectId}/memories/timeline?page=${page}&per_page=${perPage}`),
  },
};
