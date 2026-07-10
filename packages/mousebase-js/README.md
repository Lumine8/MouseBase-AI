# MouseBase — TypeScript SDK

Persistent memory for AI applications. Store, search, and retrieve long-term memory for agents, chatbots, and AI products.

```bash
npm install mousebase
```

## Quick Start

```typescript
import { MouseBase } from "mousebase";

const client = new MouseBase({
  apiKey: process.env.MOUSEBASE_API_KEY!,
});

// Store a memory
await client.remember({
  content: "Alice prefers dark mode",
});

// Search semantically
const results = await client.search({
  query: "UI preferences",
});

console.log(results.results);
```

## Server vs Browser

```typescript
// Server (uses API key)
import { MouseBase } from "mousebase";

// Browser (uses JWT — no API keys exposed)
import { MouseBaseBrowser } from "mousebase/browser";
```

## API

### Memory Operations

```typescript
// Remember
await client.remember({ content: "text", externalId: "opt", metadata: {} });

// Search
await client.search({ query: "search text", top_k: 10 });

// Get / Update / Delete
await client.get("mem_abc123");
await client.update("mem_abc123", { content: "updated" });
await client.delete("mem_abc123");
```

### Auth (JWT)

```typescript
// Sign up — sends verification email
const auth = await client.signup({ email: "...", password: "...", fullName: "..." });
auth.token;         // Access token (15 min expiry)
auth.refreshToken;  // Refresh token (30 day, one-time use)
auth.user;          // { id, email, fullName, emailVerified, createdAt }

// Log in
const auth = await client.login({ email: "...", password: "..." });

// Refresh access token
const refreshed = await client.refresh({ refreshToken: auth.refreshToken });

// Get current user
const user = await client.me();

// List active sessions
const sessions = await client.listSessions();

// Revoke all sessions (sign out everywhere)
await client.revokeAllSessions();
```

### Projects

```typescript
await client.projects.create({ name: "My Project" });
await client.projects.list();
await client.projects.get("proj_abc123");
await client.projects.rotateKey("proj_abc123");
```

## Framework Adapters

```typescript
import { NextMouseBase } from "mousebase/adapters/nextjs";
import { ExpressMouseBase } from "mousebase/adapters/express";
import { NestMouseBase } from "mousebase/adapters/nestjs";
import { CloudflareMouseBase } from "mousebase/adapters/cloudflare";
```

## AI Framework Integrations

```typescript
import { MouseBaseMemory } from "mousebase/integrations/langchain";
import { MouseBaseMemoryStore } from "mousebase/integrations/llama-index";
import { MouseBaseAgentMemory } from "mousebase/integrations/openai-agents";
import { MouseBaseCrewMemory } from "mousebase/integrations/crewai";
import { createMousebaseMcpServer } from "mousebase/integrations/mcp-server";
```

## CLI

```bash
npm install -g mousebase
mousebase login
mousebase remember "Alice likes dark mode"
mousebase search "UI preferences"
mousebase projects list
```

## License

MIT
