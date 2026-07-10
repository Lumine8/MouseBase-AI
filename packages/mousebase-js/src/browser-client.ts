import type {
  RememberOptions,
  RememberResponse,
  SearchOptions,
  SearchResponse,
  MemoryResponse,
  UpdateOptions,
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

  async me(): Promise<{ id: string; email: string; full_name: string | null }> {
    return this._request("GET", "/auth/me");
  }
}
