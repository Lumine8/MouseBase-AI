# JavaScript / TypeScript SDK

The official JavaScript/TypeScript SDK provides a fully-typed, promise-based interface to the MouseBase API. It works in Node.js 18+, Bun, Deno, and Cloudflare Workers.

---

## Installation

```bash
npm install mousebase
```

```bash
yarn add mousebase
```

```bash
pnpm add mousebase
```

Requires Node.js 18+ (for global `fetch`) or a runtime that provides it (Bun, Deno, Cloudflare Workers).

---

## Quick Start

```typescript
import { MouseBase } from "mousebase";

// Initialize with your API key
const client = new MouseBase({ apiKey: "mb_live_xxx" });

// Store a memory
const result = await client.remember({
  content: "User prefers dark mode in their IDE.",
  metadata: { source: "preferences", userId: "123" },
});
console.log(`Stored memory: ${result.memory_id}`);

// Search semantically
const results = await client.search({ query: "What theme does the user like?", top_k: 5 });
for (const r of results.results) {
  console.log(`  [${r.score.toFixed(2)}] ${r.content}`);
}
```

---

## Server vs Browser

The SDK exports two entry points:

- **`mousebase`** — Server-side client. Uses API keys, supports all operations including projects and auth.
- **`mousebase/browser`** — Browser client. Uses JWT tokens (from user auth). Only supports memory operations — no project management.

```typescript
// Server / Node.js
import { MouseBase } from "mousebase";
const client = new MouseBase({ apiKey: "mb_live_xxx" });

// Browser / client-side
import { MouseBaseBrowser } from "mousebase/browser";
const client = new MouseBaseBrowser({ token: "jwt_from_login" });
```

The browser client (`MouseBaseBrowser`) is designed for authenticated end-user sessions. Get the JWT by calling `signup()` or `login()` on the server side, then pass the token to the browser client.

---

## Configuration

### ClientConfig

```typescript
import { MouseBase } from "mousebase";

// Option 1: Pass API key directly
const client = new MouseBase({ apiKey: "mb_live_xxx" });

// Option 2: Use environment variables
// MOUSEBASE_API_KEY="mb_live_xxx"
const client = new MouseBase();

// Option 3: Custom base URL and timeout
const client = new MouseBase({
  apiKey: "mb_live_xxx",
  baseUrl: "https://api.mousebase.dev/api/v1",
  timeout: 60_000, // milliseconds (default: 30_000)
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `process.env.MOUSEBASE_API_KEY` | API key |
| `baseUrl` | `string` | `process.env.MOUSEBASE_BASE_URL` or `https://api.mousebase.dev/api/v1` | API base URL |
| `timeout` | `number` | `30_000` | Request timeout in milliseconds |

### Environment Variables

| Variable | Description |
|----------|-------------|
| `MOUSEBASE_API_KEY` | API key (required if not passed in constructor) |
| `MOUSEBASE_BASE_URL` | Custom API base URL (optional) |

---

## Remember

Stores a memory and generates its embedding.

```typescript
const result = await client.remember({
  content: "The user completed the onboarding flow.",
  externalId: "user_789",                       // optional: your own ID
  metadata: { source: "onboarding", step: 5 }, // optional: arbitrary metadata
});
// result.memory_id  -> "mem_abc123"
// result.created_at -> "2025-01-15T10:30:00Z"
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | `string` | Yes | The text to remember |
| `externalId` | `string \| null` | No | Your own identifier |
| `metadata` | `Record<string, unknown>` | No | Arbitrary key-value pairs |

---

## Search

Finds memories by semantic similarity, not keyword matching.

```typescript
const results = await client.search({ query: "What do I know about the user?", top_k: 10 });

for (const r of results.results) {
  console.log(`  [${r.score.toFixed(2)}] ${r.content}`);
  if (r.metadata) {
    console.log(`       metadata:`, r.metadata);
  }
}
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | `string` | Yes | — | Natural language query |
| `top_k` | `number` | No | `10` | Max results to return |

Each `SearchResult` has: `id`, `content`, `score` (cosine similarity), `metadata`, `external_id`.

---

## Get / Update / Delete

### get — Retrieve a Memory

```typescript
const memory = await client.get("mem_abc123");
console.log(memory.content);       // The stored text
console.log(memory.metadata);      // { source: "onboarding" }
console.log(memory.external_id);   // "user_789" or null
console.log(memory.created_at);    // "2025-01-15T10:30:00Z"
console.log(memory.updated_at);    // "2025-01-15T10:30:00Z"
```

### update — Modify a Memory

Only the fields you provide are updated; omitted fields stay unchanged.

```typescript
const memory = await client.update("mem_abc123", {
  content: "Updated content",            // optional
  metadata: { edited: true },            // optional — replaces existing metadata
  external_id: "new_external_id",        // optional
});
```

### delete — Remove a Memory

```typescript
await client.delete("mem_abc123");  // Returns void on success
```

Throws `MouseBaseError` if the memory doesn't exist.

---

## Projects

Projects group memories and each has its own API key.

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase({ apiKey: "mb_live_xxx" });

// Create a project (returns the API key)
const project = await client.projects.create({
  name: "My Chatbot",
  description: "Customer support memories",
});
console.log(project.api_key);  // "mb_live_..."

// List all projects
const projects = await client.projects.list();
for (const p of projects) {
  console.log(p.name, p.id);
}

// Get a project by ID
const project = await client.projects.get("proj_abc123");

// Update project metadata
await client.projects.update("proj_abc123", { name: "Renamed", description: "New desc" });

// Delete a project
await client.projects.delete("proj_abc123");

// View the API key (partially masked)
const key = await client.projects.viewKey("proj_abc123");
console.log(key.api_key);  // "mb_live_...xxxx"

// Rotate the API key (old key becomes invalid)
const project = await client.projects.rotateKey("proj_abc123");
console.log(project.api_key);  // New key
```

---

## Auth

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase({ apiKey: "mb_live_xxx" });

// Sign up (creates a user account, sends verification email)
const auth = await client.signup("user@example.com", "securepassword123", "Jane Doe");
console.log(auth.token);           // JWT for browser client
console.log(auth.refresh_token);   // For refreshing expired tokens
console.log(auth.user.email);

// Log in to an existing account
const auth = await client.login("user@example.com", "securepassword123");

// Refresh an expired access token
const refreshed = await client.refresh(auth.refresh_token);
console.log(refreshed.token);            // New access token
console.log(refreshed.refresh_token);     // New refresh token (old one revoked)

// Verify email (use token from verification email)
await client.verifyEmail("verify_token_from_email");

// Resend verification email
await client.resendVerification();

// Password reset flow
await client.forgotPassword("user@example.com");
await client.resetPassword("reset_token", "new_secure_password");

// List active sessions
const sessions = await client.listSessions();
for (const s of sessions) {
  console.log(s.id, s.user_agent, s.last_used_at);
}

// Revoke a specific session
await client.revokeSession(sessions[0].id);

// Revoke all sessions (sign out everywhere)
await client.revokeAllSessions();

// Get the currently authenticated user
const user = await client.me();
console.log(user.email, user.email_verified, user.created_at);
```

---

## Framework Adapters

### Next.js

```typescript
// app/api/chat/route.ts
import { withMousebase, NextMouseBase } from "mousebase/adapters/nextjs";

export const POST = withMousebase(async (req, context, mousebase) => {
  const { message } = await req.json();

  await mousebase.remember({ content: message, metadata: { role: "user" } });
  const results = await mousebase.search({ query: message, top_k: 5 });

  return Response.json({ context: results.results });
});
```

### Express

```typescript
import express from "express";
import { mousebaseMiddleware, ExpressMouseBase } from "mousebase/adapters/express";

const app = express();
app.use(express.json());
app.use(mousebaseMiddleware({ apiKey: "mb_live_xxx" }));

app.post("/remember", (req, res) => {
  const mousebase: ExpressMouseBase = req.mousebase;
  const result = await mousebase.remember({ content: req.body.message });
  res.json(result);
});
```

### NestJS

```typescript
import { Module } from "@nestjs/common";
import { createMousebaseModule, MouseBaseService } from "mousebase/adapters/nestjs";

@Module({
  imports: [createMousebaseModule({ apiKey: "mb_live_xxx" })],
})
export class AppModule {}

// In your service:
import { Injectable } from "@nestjs/common";
import { MouseBaseService } from "mousebase/adapters/nestjs";

@Injectable()
export class ChatService {
  constructor(private readonly mousebase: MouseBaseService) {}

  async chat(message: string) {
    await this.mousebase.remember({ content: message });
    return this.mousebase.search({ query: message });
  }
}
```

### Cloudflare Workers

```typescript
import { CloudflareMouseBase } from "mousebase/adapters/cloudflare";

interface Env {
  MOUSEBASE_API_KEY: string;
}

export default {
  async fetch(req: Request, env: Env) {
    const client = new CloudflareMouseBase({ env });
    const result = await client.remember({ content: "Worker memory" });
    return new Response(JSON.stringify(result));
  },
};
```

### Bun

```typescript
import { BunMouseBase } from "mousebase/adapters/bun";

const client = new BunMouseBase({ apiKey: "mb_live_xxx" });
const result = await client.remember({ content: "Bun memory" });
```

### Deno

```typescript
import { DenoMouseBase } from "mousebase/adapters/deno";

const client = new DenoMouseBase({ apiKey: "mb_live_xxx" });
const result = await client.remember({ content: "Deno memory" });
```

---

## AI Integrations

### LangChain

```typescript
import { MouseBaseMemory } from "mousebase/integrations/langchain";

const memory = new MouseBaseMemory({
  apiKey: "mb_live_xxx",
  sessionId: "session_123",
  topK: 10,
});

await memory.saveContext({ input: "Hello" }, { output: "Hi there!" });
const { history } = await memory.loadMemoryVariables({});
console.log(history);

await memory.clear();
```

### LlamaIndex

```typescript
import { MouseBaseMemoryStore } from "mousebase/integrations/llama-index";

const store = new MouseBaseMemoryStore({
  apiKey: "mb_live_xxx",
  sessionId: "session_123",
});

await store.put({ role: "user", content: "Hello" });
const messages = await store.getMessages("session_123");
console.log(messages);
```

### OpenAI Agents SDK

```typescript
import { MouseBaseAgentMemory } from "mousebase/integrations/openai-agents";

const memory = new MouseBaseAgentMemory({ apiKey: "mb_live_xxx" });

await memory.storeMessage({ role: "user", content: "Hello", threadId: "thread_1" });
const messages = await memory.retrieveMessages("thread_1");
console.log(messages);
```

### CrewAI

```typescript
import { MouseBaseCrewMemory } from "mousebase/integrations/crewai";

const memory = new MouseBaseCrewMemory({
  apiKey: "mb_live_xxx",
  crew: "research-team",
  session: "session_123",
});

await memory.add("Research findings on topic X");
const results = await memory.search("findings", 10);
```

### Mastra

```typescript
import { MouseBaseMastraMemory } from "mousebase/integrations/mastra";

const memory = new MouseBaseMastraMemory({
  apiKey: "mb_live_xxx",
  defaultThreadId: "thread_1",
});

await memory.store({ content: "Important note", role: "assistant" });
const entries = await memory.retrieve();
console.log(entries);
```

### MCP Server

Run MouseBase as a Model Context Protocol server:

```typescript
import { createMousebaseMcpServer } from "mousebase/integrations/mcp-server";

await createMousebaseMcpServer({
  apiKey: "mb_live_xxx",
  name: "mousebase-mcp",
});
```

This exposes `remember`, `search`, `get_memory`, `delete_memory`, and `list_projects` tools to any MCP client (Claude Desktop, Cline, etc.).

---

## CLI

The package ships with a CLI via `npx mousebase` or the globally installed `mousebase` command.

```bash
# Save your API key locally
npx mousebase login

# Store a memory
npx mousebase remember "User likes Python for data science"

# Search memories
npx mousebase search "programming languages" --top-k 5

# Manage projects
npx mousebase projects list
npx mousebase projects create "my-app"
```

The API key is stored in `~/.mousebase/config.json` after running `login`.

---

## Starter Templates

Scaffold a full project with one of the official templates:

| Template | Description |
|----------|-------------|
| `nextjs-chatbot` | Next.js chatbot with persistent memory |
| `express-agent` | Express.js AI agent with context recall |
| `rag-app` | RAG pipeline — index, retrieve, generate |
| `customer-support` | Support ticket system with similar-issue lookup |
| `discord-bot` | Discord bot with per-user memory |
| `research-assistant` | Research assistant with citation tracking |

```bash
# Clone a template directly
npx degit mousebase/templates/nextjs-chatbot my-chatbot
cd my-chatbot
npm install
```

---

## Error Handling

Every SDK error is a subclass of `MouseBaseError`.

### Exception Hierarchy

| Exception | HTTP Status | Trigger |
|-----------|-------------|---------|
| `MissingApiKeyError` | — | No API key provided or found in env |
| `ValidationError` | 400 / 422 | Invalid request payload |
| `AuthenticationError` | 401 | Invalid or expired API key |
| `RateLimitError` | 429 | Too many requests |
| `InternalError` | 500 / 502 | Server-side failure |
| `MouseBaseError` | any | Catch-all base exception |

### Example

```typescript
import {
  MouseBase,
  MouseBaseError,
  MissingApiKeyError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
} from "mousebase";

const client = new MouseBase({ apiKey: "mb_live_xxx" });

try {
  const result = await client.remember({ content: "Test memory" });
} catch (err) {
  if (err instanceof MissingApiKeyError) {
    console.error("Please set MOUSEBASE_API_KEY");
  } else if (err instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (err instanceof ValidationError) {
    console.error(`Validation failed: ${err.message}`);
  } else if (err instanceof RateLimitError) {
    console.error("Too many requests — slow down");
  } else if (err instanceof MouseBaseError) {
    console.error(`Error ${err.code}: ${err.message} (HTTP ${err.statusCode})`);
  }
}
```

All exceptions have `.code` (string), `.message` (string), and `.statusCode` (number) properties.

### Timeouts

The SDK will throw a `MouseBaseError` with code `"timeout"` if a request exceeds the configured timeout (default 30 seconds).

---

## Response Types

```typescript
// RememberResponse
result.memory_id   // string
result.created_at  // string (ISO 8601)

// SearchResponse
results.results    // SearchResult[]

// SearchResult
r.id          // string
r.content     // string
r.score       // number
r.metadata    // Record<string, unknown>
r.external_id // string | null

// MemoryResponse
m.id           // string
m.content      // string
m.metadata     // Record<string, unknown>
m.external_id  // string | null
m.created_at   // string (ISO 8601)
m.updated_at   // string (ISO 8601)

// ProjectKeyResponse
p.id          // string
p.owner_id    // string
p.name        // string
p.description // string | null
p.api_key     // string | null (only on create/rotate)
p.status      // string
p.created_at  // string (ISO 8601)
p.updated_at  // string (ISO 8601)

// AuthResponse
auth.token  // string (JWT)
auth.user   // UserResponse

// UserResponse
u.id             // string
u.email          // string
u.full_name      // string | null
u.avatar_url     // string | null
u.email_verified // boolean
u.created_at     // string (ISO 8601)
u.updated_at     // string (ISO 8601)
```

---

## Use Cases

### Chatbot with Persistent Memory

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase();

async function chat(userId: string, message: string): Promise<string[]> {
  await client.remember({
    content: message,
    externalId: userId,
    metadata: { role: "user", timestamp: new Date().toISOString() },
  });
  const results = await client.search({ query: `${userId} ${message}`, top_k: 5 });
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
      metadata: { type: "agent_step" },
    });
  }

  async recallContext(agentId: string, task: string): Promise<string[]> {
    const results = await client.search({ query: `${agentId} ${task}`, top_k: 20 });
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

async function retrieveContext(query: string, topK: number = 5): Promise<string> {
  const results = await client.search({ query, top_k: topK });
  return results.results.map((r) => r.content).join("\n");
}

// Use with your LLM:
const context = await retrieveContext("What are the user's preferences?");
const prompt = `Context:\n${context}\n\nAnswer the question based on the context above.`;
```

---

## Full API Reference

### `MouseBase`

| Method | Returns | Description |
|--------|---------|-------------|
| `remember(options)` | `Promise<RememberResponse>` | Store a memory |
| `search(options)` | `Promise<SearchResponse>` | Semantic search |
| `get(memoryId)` | `Promise<MemoryResponse>` | Get a memory by ID |
| `update(memoryId, options)` | `Promise<MemoryResponse>` | Update a memory |
| `delete(memoryId)` | `Promise<void>` | Delete a memory |
| `signup(email, password, fullName?)` | `Promise<AuthResponse>` | Create user account (sends verification email) |
| `login(email, password)` | `Promise<AuthResponse>` | Log in |
| `refresh(refreshToken)` | `Promise<RefreshResponse>` | Refresh expired access token |
| `verifyEmail(token)` | `Promise<MessageResponse>` | Verify email address |
| `resendVerification()` | `Promise<MessageResponse>` | Resend verification email |
| `forgotPassword(email)` | `Promise<MessageResponse>` | Request password reset |
| `resetPassword(token, password)` | `Promise<MessageResponse>` | Reset password with token |
| `listSessions()` | `Promise<SessionResponse[]>` | List active sessions |
| `revokeSession(sessionId)` | `Promise<MessageResponse>` | Revoke a specific session |
| `revokeAllSessions()` | `Promise<MessageResponse>` | Revoke all sessions |
| `me()` | `Promise<UserResponse>` | Get current user |

### `client.projects`

| Method | Returns | Description |
|--------|---------|-------------|
| `create(options)` | `Promise<ProjectKeyResponse>` | Create project with API key |
| `list()` | `Promise<ProjectKeyResponse[]>` | List projects |
| `get(projectId)` | `Promise<ProjectKeyResponse>` | Get project details |
| `update(projectId, options)` | `Promise<ProjectResponse>` | Update project |
| `delete(projectId)` | `Promise<void>` | Delete project |
| `viewKey(projectId)` | `Promise<ApiKeyResponse>` | View API key |
| `rotateKey(projectId)` | `Promise<ProjectKeyResponse>` | Generate new key |

### `MouseBaseBrowser`

| Method | Returns | Description |
|--------|---------|-------------|
| `signup(email, password, fullName?)` | `Promise<AuthResponse>` | Create account (updates stored token) |
| `login(email, password)` | `Promise<AuthResponse>` | Log in (updates stored token) |
| `remember(options)` | `Promise<RememberResponse>` | Store a memory |
| `search(options)` | `Promise<SearchResponse>` | Semantic search |
| `get(memoryId)` | `Promise<MemoryResponse>` | Get a memory by ID |
| `update(memoryId, options)` | `Promise<MemoryResponse>` | Update a memory |
| `delete(memoryId)` | `Promise<void>` | Delete a memory |
| `refresh(refreshToken)` | `Promise<RefreshResponse>` | Refresh token (updates stored token) |
| `verifyEmail(token)` | `Promise<MessageResponse>` | Verify email address |
| `resendVerification()` | `Promise<MessageResponse>` | Resend verification email |
| `forgotPassword(email)` | `Promise<MessageResponse>` | Request password reset |
| `resetPassword(token, password)` | `Promise<MessageResponse>` | Reset password with token |
| `listSessions()` | `Promise<SessionResponse[]>` | List active sessions |
| `revokeSession(sessionId)` | `Promise<MessageResponse>` | Revoke a specific session |
| `revokeAllSessions()` | `Promise<MessageResponse>` | Revoke all sessions |
| `me()` | `Promise<UserResponse>` | Get current user |

### Exceptions

| Exception | Inherits From |
|-----------|---------------|
| `MouseBaseError` | `Error` |
| `MissingApiKeyError` | `MouseBaseError` |
| `ValidationError` | `MouseBaseError` |
| `AuthenticationError` | `MouseBaseError` |
| `ConflictError` | `MouseBaseError` |
| `RateLimitError` | `MouseBaseError` |
| `InternalError` | `MouseBaseError` |

All exceptions have `.code` (string), `.message` (string), and `.statusCode` (number).