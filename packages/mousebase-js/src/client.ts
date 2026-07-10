import {
  type ClientConfig,
  type RememberOptions,
  type RememberResponse,
  type SearchOptions,
  type SearchResponse,
  type MemoryResponse,
  type UpdateOptions,
  type ProjectCreateOptions,
  type ProjectUpdateOptions,
  type ProjectKeyResponse,
  type ProjectResponse,
  type ApiKeyResponse,
  type AuthResponse,
  type UserResponse,
} from "./types";
import { MissingApiKeyError, MouseBaseError, translateError } from "./errors";

const DEFAULT_BASE_URL = "https://api.mousebase.dev/v1";
const DEFAULT_TIMEOUT = 30_000;

export interface ProjectsClient {
  create(options: ProjectCreateOptions): Promise<ProjectKeyResponse>;
  list(): Promise<ProjectKeyResponse[]>;
  get(projectId: string): Promise<ProjectKeyResponse>;
  update(projectId: string, options: ProjectUpdateOptions): Promise<ProjectResponse>;
  delete(projectId: string): Promise<void>;
  viewKey(projectId: string): Promise<ApiKeyResponse>;
  rotateKey(projectId: string): Promise<ProjectKeyResponse>;
}

class _Projects implements ProjectsClient {
  private _client: MouseBase;

  constructor(client: MouseBase) {
    this._client = client;
  }

  async create(options: ProjectCreateOptions): Promise<ProjectKeyResponse> {
    return this._client._request("POST", "/projects", { name: options.name, description: options.description ?? null });
  }

  async list(): Promise<ProjectKeyResponse[]> {
    return this._client._request("GET", "/projects");
  }

  async get(projectId: string): Promise<ProjectKeyResponse> {
    return this._client._request("GET", `/projects/${projectId}`);
  }

  async update(projectId: string, options: ProjectUpdateOptions): Promise<ProjectResponse> {
    return this._client._request("PATCH", `/projects/${projectId}`, {
      name: options.name ?? null,
      description: options.description ?? null,
    });
  }

  async delete(projectId: string): Promise<void> {
    await this._client._request("DELETE", `/projects/${projectId}`);
  }

  async viewKey(projectId: string): Promise<ApiKeyResponse> {
    return this._client._request("GET", `/projects/${projectId}/api-key`);
  }

  async rotateKey(projectId: string): Promise<ProjectKeyResponse> {
    return this._client._request("POST", `/projects/${projectId}/rotate-key`);
  }
}

export class MouseBase {
  public readonly apiKey: string;
  public readonly baseUrl: string;
  public readonly timeout: number;
  public readonly projects: ProjectsClient;

  constructor(config?: ClientConfig) {
    const key = config?.apiKey ?? process.env.MOUSEBASE_API_KEY;
    if (!key) {
      throw new MissingApiKeyError();
    }
    this.apiKey = key;
    this.baseUrl = config?.baseUrl ?? process.env.MOUSEBASE_BASE_URL ?? DEFAULT_BASE_URL;
    this.timeout = config?.timeout ?? DEFAULT_TIMEOUT;
    this.projects = new _Projects(this);
  }

  async _request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
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

  async signup(email: string, password: string, fullName?: string): Promise<AuthResponse> {
    const body: Record<string, unknown> = { email, password };
    if (fullName) body.full_name = fullName;
    return this._request("POST", "/auth/signup", body);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this._request("POST", "/auth/login", { email, password });
  }

  async me(): Promise<UserResponse> {
    return this._request("GET", "/auth/me");
  }
}
