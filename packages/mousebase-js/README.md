<div align="center">
  <img src="https://raw.githubusercontent.com/Lumine8/MouseBase-AI/main/frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="120" />
  <h1>MouseBase — TypeScript SDK</h1>
</div>

[![npm version](https://img.shields.io/npm/v/mousebase)](https://www.npmjs.com/package/mousebase)
[![License](https://img.shields.io/npm/l/mousebase)](https://github.com/Lumine8/MouseBase-AI/blob/main/LICENSE)

<p align="center">
  <a href="https://pypi.org/project/mousebase/">Python SDK →</a> · <a href="https://mousebase.dev">Website →</a>
</p>

Official TypeScript/JavaScript SDK for [MouseBase](https://mousebase.dev) — persistent memory infrastructure for AI applications.

Store, retrieve, and semantically search memories using hybrid search. Works with any LLM or AI agent.

---

## Installation

```bash
npm install mousebase
```

TypeScript 5.0+ recommended. Works in Node.js 18+, Deno, Bun, and browsers.

---

## Quick Start

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase({
  apiKey: process.env.MOUSEBASE_API_KEY!,
});

// Store a memory
const result = await client.remember({
  content: "User prefers dark mode in their IDE.",
  metadata: { source: "preferences", user_id: "123" },
});
console.log(`Stored memory: ${result.id}`);

// Hybrid search (semantic + keyword + metadata + recency)
const results = await client.search({
  query: "What theme does the user like?",
  top_k: 5,
});
for (const r of results.results) {
  console.log(`${r.content} (score: ${r.score.toFixed(2)})`);
}
```

---

## Server vs Browser

MouseBase provides two clients for different environments:

| Client | Environment | Auth |
|---|---|---|
| `MouseBase` | Server (Node.js, Deno, Bun) | API key |
| `MouseBaseBrowser` | Browser (React, Vue, etc.) | JWT token |

```typescript
// Server — uses API key
import { MouseBase } from "mousebase";

// Browser — uses JWT (no API keys exposed to client)
import { MouseBaseBrowser } from "mousebase/browser";
```

---

## Server Client (`MouseBase`)

### Creating a Client

```typescript
import { MouseBase } from "mousebase";

// Option 1: Pass the API key directly
const client = new MouseBase({ apiKey: "mb_live_xxx" });

// Option 2: Use environment variable (recommended)
// export MOUSEBASE_API_KEY="mb_live_xxx"
const client = new MouseBase();

// Option 3: Custom server URL
const client = new MouseBase({
  apiKey: "mb_live_xxx",
  baseUrl: "https://your-instance.com/api/v1",
  timeout: 60_000, // milliseconds, default is 30000
});
```

### `remember()` — Store a Memory

```typescript
const result = await client.remember({
  content: "The user completed the onboarding flow.",
  externalId: "user_789",                    // optional: your own ID
  metadata: { source: "onboarding", step: 5 }, // optional: arbitrary key-value pairs
});
// result.id -> "mem_abc123"
// result.created_at -> ISO datetime string
```

**Parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `content` | `string` | Yes | The text content to remember |
| `externalId` | `string` | No | Your own identifier for this memory |
| `metadata` | `Record<string, unknown>` | No | Arbitrary key-value metadata |

### `search()` — Hybrid Search

Finds memories using **hybrid search** — combining four signals:

1. **Semantic** (60%) — vector embedding cosine similarity
2. **Keyword** (25%) — PostgreSQL full-text search (tsvector/tsquery)
3. **Metadata** (10%) — exact metadata key/value matching
4. **Recency** (5%) — exponential decay favoring newer memories

```typescript
const results = await client.search({
  query: "What do I know about the user?",
  top_k: 10,
});

for (const r of results.results) {
  console.log(`  [${r.score.toFixed(2)}] ${r.content}`);
  if (Object.keys(r.metadata).length > 0) {
    console.log(`       metadata:`, r.metadata);
  }
}
```

**Metadata Filters:**

Filter search results by exact metadata matches. Only memories matching all provided filters are returned.

```typescript
// Search only in a specific category
const results = await client.search({
  query: "What are the user's preferences?",
  top_k: 5,
  metadata_filters: { category: "preferences" },
});

// Filter by multiple keys
const results = await client.search({
  query: "What did the user buy?",
  top_k: 10,
  metadata_filters: { source: "shopify", user_id: "123" },
});
```

**Parameters:**
| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | Yes | — | The search query |
| `top_k` | `number` | No | `10` | Number of results to return |
| `metadata_filters` | `Record<string, unknown>` | No | — | Filter by metadata key/value pairs |

### `get()` — Retrieve a Memory

```typescript
const memory = await client.get("mem_abc123");
console.log(memory.content);      // "The user completed the onboarding flow."
console.log(memory.metadata);     // { source: "onboarding" }
console.log(memory.created_at);   // ISO datetime string
console.log(memory.external_id);  // "user_789" or null
```

### `update()` — Update a Memory

```typescript
const memory = await client.update("mem_abc123", {
  content: "Updated content here",              // optional: new text
  metadata: { edited: true, version: 2 },       // optional: replaces existing metadata
  external_id: "new_external_id",               // optional: new external ID
});
```

Only the fields you provide are updated. Fields you omit remain unchanged.

### `delete()` — Delete a Memory

```typescript
await client.delete("mem_abc123");
```

---

## Browser Client (`MouseBaseBrowser`)

For browser environments (React, Vue, etc.), use `MouseBaseBrowser`. It authenticates with a JWT token instead of an API key, so secrets aren't exposed to the client.

```typescript
import { MouseBaseBrowser } from "mousebase/browser";

const client = new MouseBaseBrowser({
  token: "eyJhbGciOi...", // JWT from login/signup
});

// Same API as server client
await client.remember({ content: "From the browser!" });
const results = await client.search({ query: "browser memories" });
```

The browser client supports all the same methods: `remember`, `search`, `get`, `update`, `delete`, `signup`, `login`, `refresh`, `me`, `listSessions`, `revokeSession`, `revokeAllSessions`.

---

## Project Management

```typescript
// Create a project
const project = await client.projects.create({
  name: "My Chatbot",
  description: "Memories for my customer support chatbot",
});
console.log(project.api_key); // "mb_live_..." — the project's API key

// List projects
const projects = await client.projects.list();

// Get a project
const project = await client.projects.get("proj_abc123");

// Update a project
await client.projects.update("proj_abc123", {
  name: "New Name",
  description: "Updated",
});

// Delete a project
await client.projects.delete("proj_abc123");

// View API key (masked)
const key = await client.projects.viewKey("proj_abc123");
console.log(key.api_key); // "mb_live_...xxxx"

// Rotate API key (generates a new one, old one is invalidated)
const updated = await client.projects.rotateKey("proj_abc123");
console.log(updated.api_key); // new "mb_live_..."
```

---

## Account Management

```typescript
// Sign up (creates a new user account, sends verification email)
const auth = await client.signup("user@example.com", "securepassword123", "Jane Doe");
console.log(auth.token);         // JWT access token (15 min expiry)
console.log(auth.refresh_token); // Refresh token (30 day expiry, one-time use)
console.log(auth.user);          // { id, email, full_name, email_verified, created_at }

// Log in
const auth = await client.login("user@example.com", "securepassword123");

// Refresh access token
const refreshed = await client.refresh("your_refresh_token");

// Get current user info
const user = await client.me();
console.log(user.email);        // "user@example.com"
console.log(user.full_name);    // "Jane Doe"
console.log(user.email_verified); // boolean

// List active sessions
const sessions = await client.listSessions();

// Revoke a specific session
await client.revokeSession("session_abc123");

// Revoke all sessions (sign out everywhere)
await client.revokeAllSessions();

// Email verification
await client.verifyEmail("verification_token");
await client.resendVerification();

// Password reset
await client.forgotPassword("user@example.com");
await client.resetPassword("reset_token", "new_password123");
```

---

## Framework Adapters

MouseBase provides framework-specific adapters that extract the API key from request headers:

```typescript
// Next.js (App Router)
import { NextMouseBase } from "mousebase/adapters/nextjs";

// Express
import { ExpressMouseBase } from "mousebase/adapters/express";

// NestJS
import { NestMouseBase } from "mousebase/adapters/nestjs";

// Cloudflare Workers
import { CloudflareMouseBase } from "mousebase/adapters/cloudflare";

// Bun
import { BunMouseBase } from "mousebase/adapters/bun";

// Deno
import { DenoMouseBase } from "mousebase/adapters/deno";
```

### Next.js Example

```typescript
// app/api/memory/route.ts
import { NextMouseBase } from "mousebase/adapters/nextjs";

export async function POST(req: Request) {
  const mousebase = NextMouseBase.fromRequest(req);
  const { content } = await req.json();

  const result = await mousebase.remember({ content });
  return Response.json(result);
}
```

### Cloudflare Workers Example

```typescript
import { CloudflareMouseBase } from "mousebase/adapters/cloudflare";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const mousebase = CloudflareMouseBase.fromRequest(request, {
      baseUrl: env.MOUSEBASE_API_URL,
    });

    const result = await mousebase.remember({ content: "Hello from Workers!" });
    return Response.json(result);
  },
};
```

---

## AI Framework Integrations

```typescript
// LangChain
import { MouseBaseMemory } from "mousebase/integrations/langchain";

// LlamaIndex
import { MouseBaseMemoryStore } from "mousebase/integrations/llama-index";

// OpenAI Agents SDK
import { MouseBaseAgentMemory } from "mousebase/integrations/openai-agents";

// CrewAI
import { MouseBaseCrewMemory } from "mousebase/integrations/crewai";

// MCP Server (expose MouseBase as a tool)
import { createMousebaseMcpServer } from "mousebase/integrations/mcp-server";

// Mastra
import { MouseBaseMastraMemory } from "mousebase/integrations/mastra";
```

---

## CLI

```bash
npm install -g mousebase
mousebase login
mousebase remember "Alice likes dark mode"
mousebase search "UI preferences"
mousebase projects list
```

---

## Error Handling

The SDK throws typed errors for different conditions.

```typescript
import {
  MouseBaseError,
  MissingApiKeyError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  InternalError,
} from "mousebase";
```

| Error | HTTP Status | When it occurs |
|---|---|---|
| `MissingApiKeyError` | — | No API key provided or found in environment |
| `AuthenticationError` | 401 | Invalid or expired API key |
| `ValidationError` | 400/422 | Invalid request payload |
| `RateLimitError` | 429 | Too many requests |
| `InternalError` | 500/502/503 | Server error |
| `MouseBaseError` | any | Catch-all for all SDK errors |

```typescript
try {
  const result = await client.remember({ content: "Test" });
} catch (err) {
  if (err instanceof MissingApiKeyError) {
    console.error("Please set MOUSEBASE_API_KEY");
  } else if (err instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (err instanceof RateLimitError) {
    console.error("Slow down!");
  } else if (err instanceof MouseBaseError) {
    console.error(`Error ${err.code}: ${err.message} (HTTP ${err.statusCode})`);
  }
}
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MOUSEBASE_API_KEY` | — | Your API key (required if not passed directly) |
| `MOUSEBASE_BASE_URL` | `https://api.mousebase.dev/api/v1` | Custom server URL |

### Constructor Options

```typescript
new MouseBase({
  apiKey?: string,      // or MOUSEBASE_API_KEY env var
  baseUrl?: string,     // or MOUSEBASE_BASE_URL env var
  timeout?: number,     // milliseconds, default 30000
});
```

---

## TypeScript Types

All request/response types are exported for type safety:

```typescript
import type {
  RememberOptions,
  RememberResponse,
  SearchOptions,
  SearchResponse,
  SearchResult,
  MemoryResponse,
  UpdateOptions,
  ProjectCreateOptions,
  ProjectUpdateOptions,
  ProjectKeyResponse,
  ProjectResponse,
  ApiKeyResponse,
  AuthResponse,
  RefreshResponse,
  UserResponse,
  SessionResponse,
  MessageResponse,
  ClientConfig,
  BrowserClientConfig,
} from "mousebase";
```

---

## Complete API Reference

### `MouseBase` (Server)

| Method | Returns | Description |
|---|---|---|
| `remember(options)` | `Promise<RememberResponse>` | Store a new memory |
| `search(options)` | `Promise<SearchResponse>` | Hybrid search |
| `get(memoryId)` | `Promise<MemoryResponse>` | Retrieve a memory by ID |
| `update(memoryId, options)` | `Promise<MemoryResponse>` | Update a memory |
| `delete(memoryId)` | `Promise<void>` | Delete a memory |
| `signup(email, password, fullName?)` | `Promise<AuthResponse>` | Create account |
| `login(email, password)` | `Promise<AuthResponse>` | Log in |
| `refresh(refreshToken)` | `Promise<RefreshResponse>` | Refresh access token |
| `me()` | `Promise<UserResponse>` | Get current user |
| `listSessions()` | `Promise<SessionResponse[]>` | List active sessions |
| `revokeSession(sessionId)` | `Promise<MessageResponse>` | Revoke a session |
| `revokeAllSessions()` | `Promise<MessageResponse>` | Revoke all sessions |
| `verifyEmail(token)` | `Promise<MessageResponse>` | Verify email |
| `resendVerification()` | `Promise<MessageResponse>` | Resend verification |
| `forgotPassword(email)` | `Promise<MessageResponse>` | Request password reset |
| `resetPassword(token, password)` | `Promise<MessageResponse>` | Reset password |

### `client.projects`

| Method | Returns | Description |
|---|---|---|
| `create(options)` | `Promise<ProjectKeyResponse>` | Create project with API key |
| `list()` | `Promise<ProjectKeyResponse[]>` | List all projects |
| `get(projectId)` | `Promise<ProjectKeyResponse>` | Get project details |
| `update(projectId, options)` | `Promise<ProjectResponse>` | Update project |
| `delete(projectId)` | `Promise<void>` | Delete project |
| `viewKey(projectId)` | `Promise<ApiKeyResponse>` | View project API key |
| `rotateKey(projectId)` | `Promise<ProjectKeyResponse>` | Rotate API key |

### `MouseBaseBrowser` (Browser)

Same methods as `MouseBase` (except project management), authenticating with JWT tokens.

---

## Use Cases

### Chatbot with Persistent Memory

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase();

async function chat(userId: string, message: string): Promise<string[]> {
  // Store the user's message
  await client.remember({
    content: message,
    externalId: userId,
    metadata: { role: "user" },
  });

  // Retrieve relevant context from past conversations
  const results = await client.search({
    query: `user:${userId} ${message}`,
    top_k: 5,
  });
  return results.results.map((r) => r.content);
}
```

### AI Agent Memory

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase();

class AgentMemory {
  async storeStep(agentId: string, step: string, result: string) {
    await client.remember({
      content: `Step: ${step}\nResult: ${result}`,
      externalId: agentId,
      metadata: { type: "agent_step", agent_id: agentId },
    });
  }

  async recallContext(agentId: string, task: string): Promise<string[]> {
    const results = await client.search({
      query: `${agentId} ${task}`,
      top_k: 20,
    });
    return results.results.map((r) => r.content);
  }

  async clearSession(agentId: string) {
    const results = await client.search({ query: agentId, top_k: 100 });
    for (const r of results.results) {
      await client.delete(r.id);
    }
  }
}
```

### RAG Pipeline

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase();

async function ragRetrieve(query: string, topK = 5): Promise<string[]> {
  const results = await client.search({ query, top_k: topK });
  return results.results.map((r) => r.content);
}

// Use with your LLM:
const context = (await ragRetrieve("What are the user's preferences?")).join("\n");
const prompt = `Based on this context:\n${context}\n\nAnswer the user's question.`;
```

---

## License

MIT
