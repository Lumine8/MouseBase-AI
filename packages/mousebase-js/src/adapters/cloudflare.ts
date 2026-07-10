import type { RememberOptions, RememberResponse, SearchOptions, SearchResponse, MemoryResponse, UpdateOptions } from "../types.js";
import { MouseBaseError, translateError } from "../errors.js";

const DEFAULT_BASE_URL = "https://api.mousebase.dev/v1";
const DEFAULT_TIMEOUT = 30_000;

export interface CloudflareEnv {
  MOUSEBASE_API_KEY?: string;
  MOUSEBASE_BASE_URL?: string;
}

export interface CloudflareMouseBaseConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  env?: CloudflareEnv;
}

export interface ProjectsClient {
  create(options: { name: string; description?: string | null }): Promise<any>;
  list(): Promise<any[]>;
  get(projectId: string): Promise<any>;
  update(projectId: string, options: { name?: string | null; description?: string | null }): Promise<any>;
  delete(projectId: string): Promise<void>;
  viewKey(projectId: string): Promise<any>;
  rotateKey(projectId: string): Promise<any>;
}

export class CloudflareMouseBase {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  public readonly projects: ProjectsClient;

  constructor(config?: CloudflareMouseBaseConfig) {
    const key = config?.apiKey ?? config?.env?.MOUSEBASE_API_KEY ?? (globalThis as any).MOUSEBASE_API_KEY;
    if (!key) {
      throw new MouseBaseError(
        "MOUSEBASE_API_KEY is not set. Provide it via config.apiKey, config.env.MOUSEBASE_API_KEY, or set it in Workers secrets.",
        "missing_api_key",
        0,
      );
    }
    this.apiKey = key;
    this.baseUrl = config?.baseUrl ?? config?.env?.MOUSEBASE_BASE_URL ?? DEFAULT_BASE_URL;
    this.timeout = config?.timeout ?? DEFAULT_TIMEOUT;
    this.projects = this._createProjectsClient();
  }

  private _createProjectsClient(): ProjectsClient {
    const self = this;
    return {
      async create(options: { name: string; description?: string | null }) {
        return self._request("POST", "/projects", { name: options.name, description: options.description ?? null });
      },
      async list() {
        return self._request("GET", "/projects");
      },
      async get(projectId: string) {
        return self._request("GET", `/projects/${projectId}`);
      },
      async update(projectId: string, options: { name?: string | null; description?: string | null }) {
        return self._request("PATCH", `/projects/${projectId}`, {
          name: options.name ?? null,
          description: options.description ?? null,
        });
      },
      async delete(projectId: string) {
        await self._request("DELETE", `/projects/${projectId}`);
      },
      async viewKey(projectId: string) {
        return self._request("GET", `/projects/${projectId}/api-key`);
      },
      async rotateKey(projectId: string) {
        return self._request("POST", `/projects/${projectId}/rotate-key`);
      },
    };
  }

  private async _request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
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
    if (options.metadata !== undefined) {
      body.metadata = options.metadata;
    }
    return this._request("POST", "/remember/", body);
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    return this._request("POST", "/search/", { query: options.query, top_k: options.top_k ?? 10 });
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
}