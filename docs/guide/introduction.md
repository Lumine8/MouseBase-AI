<div align="center">
  <img src="https://raw.githubusercontent.com/Lumine8/MouseBase-AI/main/frontend/public/assets/logo_mousebase.svg" alt="MouseBase" width="60" />
</div>

# Introduction

MouseBase is a managed memory service for AI applications. It lets you store text memories and search them semantically — so your agents can recall relevant context at runtime.

## Why MouseBase?

- **No infrastructure to manage** — embeddings, vector storage, and search are handled for you
- **Simple API** — one endpoint to remember, one to search
- **Works with any stack** — Python SDK, TypeScript SDK, REST API
- **Semantic search out of the box** — powered by Gemini or OpenAI embeddings

## How it works

1. You store a memory: `client.remember(content="User clicked settings")`
2. MouseBase generates an embedding and stores it
3. You search later: `client.search(query="user preferences")`
4. MouseBase returns relevant memories ranked by similarity

## Current features

- `POST /remember` — store a new memory
- `POST /search` — semantic search
- `GET /memory/{id}` — retrieve a memory
- `PATCH /memory/{id}` — update a memory
- `DELETE /memory/{id}` — delete a memory
- Project management — create, list, rotate API keys
