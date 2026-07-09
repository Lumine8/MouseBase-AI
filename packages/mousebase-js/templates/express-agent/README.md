# Express Agent

An Express.js REST API that wraps a MouseBase agent behind HTTP endpoints.

## What it demonstrates

- Exposing an agent as a REST API
- Handling streaming and non-streaming responses
- Session management across requests

## Setup

```bash
export MOUSEBASE_API_KEY=sk-...
npm install
```

## Run

```bash
npm run dev
```

API runs on http://localhost:4000.

## Core pattern

```ts
import { MousebaseClient } from "mousebase-js";
import express from "express";

const client = new MousebaseClient({ apiKey: process.env.MOUSEBASE_API_KEY });
const app = express();

app.post("/chat", async (req, res) => {
  const stream = await client.chat.stream({
    agent: "assistant",
    messages: req.body.messages,
  });
  stream.pipe(res);
});

app.listen(4000);
```
