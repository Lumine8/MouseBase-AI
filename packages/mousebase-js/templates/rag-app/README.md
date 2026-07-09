# RAG App

A Retrieval-Augmented Generation application that ingests documents and answers questions over your own data.

## What it demonstrates

- Document chunking and embedding ingestion
- Semantic search over ingested content
- Augmented prompts that include retrieved context

## Setup

```bash
export MOUSEBASE_API_KEY=sk-...
npm install
```

## Run

```bash
npm run dev
```

Upload a PDF or text file, then ask questions about its contents.

## Core pattern

```ts
import { MousebaseClient } from "mousebase-js";

const client = new MousebaseClient({ apiKey: process.env.MOUSEBASE_API_KEY });

// Ingest a document
await client.knowledge.ingest("my-doc", {
  text: "MouseBase is an AI agent framework for JavaScript.",
  metadata: { source: "docs.txt" },
});

// Ask a question (context is injected automatically)
const stream = await client.chat.stream({
  agent: "rag-agent",
  messages: [{ role: "user", content: "What is MouseBase?" }],
});
```
