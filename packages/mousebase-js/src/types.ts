export interface RememberOptions {
  content: string;
  externalId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RememberResponse {
  id: string;
  external_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SearchOptions {
  query: string;
  top_k?: number;
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

export interface MemoryResponse {
  id: string;
  external_id: string | null;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UpdateOptions {
  content?: string | null;
  metadata?: Record<string, unknown> | null;
  external_id?: string | null;
}

export interface ProjectCreateOptions {
  name: string;
  description?: string | null;
}

export interface ProjectUpdateOptions {
  name?: string | null;
  description?: string | null;
}

export interface ProjectResponse {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  api_key_id: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectKeyResponse extends ProjectResponse {
  api_key: string | null;
}

export interface ApiKeyResponse {
  project_id: string;
  api_key: string;
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

export interface ClientConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface BrowserClientConfig {
  token?: string;
  baseUrl?: string;
}
