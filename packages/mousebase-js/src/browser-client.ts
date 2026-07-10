import type {
  AuthResponse,
  MessageResponse,
  RememberOptions,
  RememberResponse,
  SearchOptions,
  SearchResponse,
  MemoryResponse,
  UpdateOptions,
  RefreshResponse,
  SessionResponse,
  UserResponse,
  BrowserClientConfig,
} from "./types";
import { MouseBaseError, translateError } from "./errors";

const DEFAULT_BASE_URL = "https://api.mousebase.dev/api/v1";
const DEFAULT_TIMEOUT = 30_000;

export class MouseBaseBrowser {
  private _token: string;
  private _baseUrl: string;
  private _timeout: number;

  constructor(config?: BrowserClientConfig) {
    if (!config?.token) {
      throw new MouseBaseError(
        "JWT token is required for browser client. Use login() or pass a token.",
        "missing_token",
        0,
      );
    }
    this._token = config.token;
    this._baseUrl = config?.baseUrl ?? DEFAULT_BASE_URL;
    this._timeout = DEFAULT_TIMEOUT;
  }

  private async _request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this._baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${this._token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (res.ok) {
        if (res.status === 204) return undefined as T;
        return res.json() as Promise<T>;
      }

      const errBody = await res.json().catch(() => ({}));
      throw translateError(res.status, errBody);
    } catch (err) {
      if (err instanceof MouseBaseError) throw err;
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new MouseBaseError("Request timed out", "timeout", 0);
      }
      throw new MouseBaseError(
        err instanceof Error ? err.message : "Network error",
        "network_error",
        0,
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async remember(options: RememberOptions): Promise<RememberResponse> {
    const body: Record<string, unknown> = { content: options.content };
    if (options.externalId !== undefined && options.externalId !== null) {
      body.external_id = options.externalId;
    }
    if (options.metadata !== undefined) body.metadata = options.metadata;
    return this._request("POST", "/remember/", body);
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    return this._request("POST", "/search/", {
      query: options.query,
      top_k: options.top_k ?? 10,
    });
  }

  async get(memoryId: string): Promise<MemoryResponse> {
    return this._request("GET", `/memory/${memoryId}`);
  }

  async update(memoryId: string, options: UpdateOptions): Promise<MemoryResponse> {
    const body: Record<string, unknown> = {};
    if (options.content !== undefined && options.content !== null) body.content = options.content;
    if (options.metadata !== undefined) body.metadata = options.metadata;
    if (options.external_id !== undefined) body.external_id = options.external_id;
    return this._request("PATCH", `/memory/${memoryId}`, body);
  }

  async delete(memoryId: string): Promise<void> {
    await this._request("DELETE", `/memory/${memoryId}`);
  }

  async signup(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const body: Record<string, unknown> = { email, password };
    if (fullName) body.full_name = fullName;
    const result = await this._request<AuthResponse>("POST", "/auth/signup", body);
    this._token = result.token;
    return result;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const result = await this._request<AuthResponse>("POST", "/auth/login", { email, password });
    this._token = result.token;
    return result;
  }

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const result = await this._request<RefreshResponse>("POST", "/auth/refresh", { refresh_token: refreshToken });
    this._token = result.token;
    return result;
  }

  async verifyEmail(token: string): Promise<MessageResponse> {
    return this._request("POST", "/auth/verify-email", { token });
  }

  async resendVerification(): Promise<MessageResponse> {
    return this._request("POST", "/auth/resend-verification");
  }

  async forgotPassword(email: string): Promise<MessageResponse> {
    return this._request("POST", "/auth/forgot-password", { email });
  }

  async resetPassword(token: string, password: string): Promise<MessageResponse> {
    return this._request("POST", "/auth/reset-password", { token, password });
  }

  async listSessions(): Promise<SessionResponse[]> {
    return this._request("GET", "/auth/sessions");
  }

  async revokeSession(sessionId: string): Promise<MessageResponse> {
    return this._request("DELETE", `/auth/sessions/${sessionId}`);
  }

  async revokeAllSessions(): Promise<MessageResponse> {
    return this._request("DELETE", "/auth/sessions");
  }

  async me(): Promise<UserResponse> {
    return this._request("GET", "/auth/me");
  }
}
