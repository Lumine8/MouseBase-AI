import { describe, it, expect, beforeEach, vi } from "vitest";
import { api, auth, type AuthResponse, type UserResponse, type ProjectWithKey, type SearchResponse } from "../lib/api";

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockResponse(status: number, body: unknown, statusText?: string) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText: statusText ?? "",
    json: () => Promise.resolve(body),
  } as Response);
}

beforeEach(() => {
  localStorage.clear();
  mockFetch.mockReset();
});

describe("auth module", () => {
  const baseUser: UserResponse = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    email: "test@example.com",
    full_name: "Test User",
    avatar_url: null,
    email_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  describe("signup", () => {
    it("sends POST /auth/signup with email and password", async () => {
      const authResp: AuthResponse = { token: "jwt_token_123", user: baseUser };
      mockFetch.mockResolvedValue(mockResponse(201, authResp));

      const result = await auth.signup({ email: "test@example.com", password: "password123", full_name: "Test User" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com", password: "password123", full_name: "Test User" }),
        }),
      );
      expect(result.token).toBe("jwt_token_123");
      expect(result.user.email).toBe("test@example.com");
    });

    it("sends signup without optional full_name", async () => {
      const authResp: AuthResponse = { token: "jwt_token_123", user: baseUser };
      mockFetch.mockResolvedValue(mockResponse(201, authResp));

      await auth.signup({ email: "test@example.com", password: "password123" });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.full_name).toBeUndefined();
    });
  });

  describe("login", () => {
    it("sends POST /auth/login with credentials", async () => {
      const authResp: AuthResponse = { token: "jwt_token_456", user: baseUser };
      mockFetch.mockResolvedValue(mockResponse(200, authResp));

      const result = await auth.login({ email: "test@example.com", password: "mypassword" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com", password: "mypassword" }),
        }),
      );
      expect(result.token).toBe("jwt_token_456");
    });

    it("throws on invalid credentials", async () => {
      mockFetch.mockResolvedValue(
        mockResponse(401, { error: { code: "invalid_credentials", message: "Invalid email or password" } }),
      );

      await expect(auth.login({ email: "wrong@example.com", password: "wrongpass" })).rejects.toThrow(
        "Invalid email or password",
      );
    });
  });

  describe("me", () => {
    it("sends GET /auth/me with JWT token", async () => {
      localStorage.setItem("mb_token", "my_jwt_token");
      mockFetch.mockResolvedValue(mockResponse(200, baseUser));

      const result = await auth.me();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/me",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ Authorization: "Bearer my_jwt_token" }),
        }),
      );
      expect(result.email).toBe("test@example.com");
    });

    it("fails when no token is stored", async () => {
      mockFetch.mockResolvedValue(mockResponse(401, { error: { code: "invalid_token", message: "Not authenticated" } }));

      await expect(auth.me()).rejects.toThrow("Not authenticated");
    });
  });
});

describe("api module", () => {
  const projectKey: ProjectWithKey = {
    id: "proj-123",
    owner_id: "user-456",
    name: "Test Project",
    description: "A test project",
    api_key_id: "key_abc",
    api_key: "mb_live_key_abc_secret",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };

  describe("projects", () => {
    it("list sends GET /projects/ with JWT token", async () => {
      localStorage.setItem("mb_token", "my_jwt");
      mockFetch.mockResolvedValue(mockResponse(200, [projectKey]));

      const result = await api.projects.list();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({ Authorization: "Bearer my_jwt" }),
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Project");
    });

    it("list falls back to API key when no JWT token", async () => {
      localStorage.setItem("mb_api_key", "my_api_key");
      mockFetch.mockResolvedValue(mockResponse(200, [projectKey]));

      const result = await api.projects.list();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer my_api_key" }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it("create sends POST /projects/ and returns project with key", async () => {
      localStorage.setItem("mb_token", "my_jwt");
      mockFetch.mockResolvedValue(mockResponse(201, projectKey));

      const result = await api.projects.create({ name: "Test Project", description: "desc" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Test Project", description: "desc" }),
        }),
      );
      expect(result.api_key).toBe("mb_live_key_abc_secret");
    });

    it("get sends GET /projects/:id", async () => {
      localStorage.setItem("mb_token", "my_jwt");
      mockFetch.mockResolvedValue(mockResponse(200, projectKey));

      const result = await api.projects.get("proj-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/proj-123",
        expect.objectContaining({ method: "GET" }),
      );
      expect(result.id).toBe("proj-123");
    });

    it("update sends PATCH /projects/:id", async () => {
      localStorage.setItem("mb_token", "my_jwt");
      mockFetch.mockResolvedValue(mockResponse(200, projectKey));

      const result = await api.projects.update("proj-123", { name: "Updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/proj-123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ name: "Updated" }),
        }),
      );
      expect(result.name).toBe("Test Project");
    });

    it("delete sends DELETE /projects/:id", async () => {
      localStorage.setItem("mb_token", "my_jwt");
      mockFetch.mockResolvedValue(mockResponse(204, undefined));

      const result = await api.projects.delete("proj-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/proj-123",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(result).toBeUndefined();
    });

    it("rotateKey sends POST /projects/:id/api-key/rotate", async () => {
      localStorage.setItem("mb_token", "my_jwt");
      const rotated = { ...projectKey, api_key: "mb_live_new_secret_new", api_key_id: "new_id" };
      mockFetch.mockResolvedValue(mockResponse(200, rotated));

      const result = await api.projects.rotateKey("proj-123");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/projects/proj-123/api-key/rotate",
        expect.objectContaining({ method: "POST" }),
      );
      expect(result.api_key).toBe("mb_live_new_secret_new");
    });
  });

  describe("remember", () => {
    it("sends POST /remember/ with API key", async () => {
      localStorage.setItem("mb_api_key", "my_api_key");
      mockFetch.mockResolvedValue(mockResponse(201, { id: "mem-1", created_at: "2026-01-01T00:00:00Z" }));

      const result = await api.remember({ content: "Hello world" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/remember/",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ Authorization: "Bearer my_api_key" }),
          body: JSON.stringify({ content: "Hello world" }),
        }),
      );
      expect(result.id).toBe("mem-1");
    });

    it("accepts explicit API key override", async () => {
      mockFetch.mockResolvedValue(mockResponse(201, { id: "mem-2", created_at: "2026-01-01T00:00:00Z" }));

      const result = await api.remember({ content: "Hello" }, "explicit_key");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/remember/",
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer explicit_key" }),
        }),
      );
      expect(result.id).toBe("mem-2");
    });

    it("sends optional external_id and metadata", async () => {
      localStorage.setItem("mb_api_key", "key");
      mockFetch.mockResolvedValue(mockResponse(201, { id: "mem-3", created_at: "2026-01-01T00:00:00Z" }));

      await api.remember({ content: "data", external_id: "ext_123", metadata: { source: "test" } });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.external_id).toBe("ext_123");
      expect(callBody.metadata.source).toBe("test");
    });
  });

  describe("search", () => {
    it("sends POST /search/ with query", async () => {
      localStorage.setItem("mb_api_key", "key");
      const searchResp: SearchResponse = {
        results: [{ id: "mem-1", external_id: null, content: "result", metadata: {}, score: 0.95 }],
      };
      mockFetch.mockResolvedValue(mockResponse(200, searchResp));

      const result = await api.search({ query: "test query", top_k: 5 });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/search/",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ query: "test query", top_k: 5 }),
        }),
      );
      expect(result.results).toHaveLength(1);
      expect(result.results[0].score).toBe(0.95);
    });
  });

  describe("memory", () => {
    const memoryData = {
      id: "mem-1",
      external_id: null,
      content: "memory content",
      metadata: {},
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    it("get sends GET /memory/:id with API key", async () => {
      localStorage.setItem("mb_api_key", "key");
      mockFetch.mockResolvedValue(mockResponse(200, memoryData));

      const result = await api.memory.get("mem-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/memory/mem-1",
        expect.objectContaining({ method: "GET" }),
      );
      expect(result.content).toBe("memory content");
    });

    it("update sends PATCH /memory/:id", async () => {
      localStorage.setItem("mb_api_key", "key");
      mockFetch.mockResolvedValue(mockResponse(200, { ...memoryData, content: "updated content" }));

      const result = await api.memory.update("mem-1", { content: "updated content" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/memory/mem-1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ content: "updated content" }),
        }),
      );
      expect(result.content).toBe("updated content");
    });

    it("delete sends DELETE /memory/:id", async () => {
      localStorage.setItem("mb_api_key", "key");
      mockFetch.mockResolvedValue(mockResponse(204, undefined));

      const result = await api.memory.delete("mem-1");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/memory/mem-1",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(result).toBeUndefined();
    });
  });

  describe("error handling", () => {
    it("throws ApiError with code and message on failure", async () => {
      localStorage.setItem("mb_token", "jwt");
      mockFetch.mockResolvedValue(
        mockResponse(404, { error: { code: "project_not_found", message: "Project not found" } }),
      );

      try {
        await api.projects.get("nonexistent");
        expect.unreachable("Should have thrown");
      } catch (err: any) {
        expect(err.status).toBe(404);
        expect(err.code).toBe("project_not_found");
        expect(err.message).toBe("Project not found");
      }
    });

    it("handles network errors", async () => {
      localStorage.setItem("mb_token", "jwt");
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(api.projects.list()).rejects.toThrow();
    });

    it("handles non-JSON error responses", async () => {
      localStorage.setItem("mb_token", "jwt");
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: () => Promise.reject(new Error("Invalid JSON")),
      } as Response);

      await expect(api.projects.list()).rejects.toThrow();
    });
  });

  describe("auth header fallback behavior", () => {
    it("uses JWT token for dashboard operations when available", async () => {
      localStorage.setItem("mb_token", "jwt_token");
      mockFetch.mockResolvedValue(mockResponse(200, []));

      await api.projects.list();

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toBe("Bearer jwt_token");
    });

    it("falls back to API key for dashboard when no JWT", async () => {
      localStorage.setItem("mb_api_key", "api_key_value");
      mockFetch.mockResolvedValue(mockResponse(200, []));

      await api.projects.list();

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toBe("Bearer api_key_value");
    });

    it("uses API key for memory operations regardless of JWT", async () => {
      localStorage.setItem("mb_token", "jwt_token");
      localStorage.setItem("mb_api_key", "api_key_value");
      mockFetch.mockResolvedValue(mockResponse(201, { id: "mem-1", created_at: "2026-01-01T00:00:00Z" }));

      await api.remember({ content: "test" });

      const authHeader = mockFetch.mock.calls[0][1].headers.Authorization;
      expect(authHeader).toBe("Bearer api_key_value");
    });
  });
});
