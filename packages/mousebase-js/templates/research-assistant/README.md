# Research Assistant

An agent that searches the web, reads articles, and produces structured research summaries.

## What it demonstrates

- Tool calling (web search, page fetch) from a MouseBase agent
- Structured output with citations
- Iterative research with follow-up refinement

## Setup

```bash
export MOUSEBASE_API_KEY=sk-...
npm install
```

## Run

```bash
npm run dev
```

Send a research topic via the CLI or web UI.

## Core pattern

```ts
import { MousebaseClient } from "mousebase-js";

const client = new MousebaseClient({ apiKey: process.env.MOUSEBASE_API_KEY });

// The agent has built-in search/fetch tools; just ask
const stream = await client.chat.stream({
  agent: "researcher",
  messages: [
    {
      role: "user",
      content: "Research the latest developments in AI agent frameworks. Provide a summary with sources.",
    },
  ],
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```
