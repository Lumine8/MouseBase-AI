# Next.js Chatbot

A full-stack chatbot with streaming responses, built with Next.js App Router and MouseBase.

## What it demonstrates

- Server-sent event (SSE) streaming from a MouseBase agent
- Real-time chat UI with message history
- Tool call visualisation in the chat feed

## Setup

```bash
export MOUSEBASE_API_KEY=sk-...
npm install
```

## Run

```bash
npm run dev
```

Open http://localhost:3000 and start chatting.

## Core pattern

```ts
import { MousebaseClient } from "mousebase-js";

const client = new MousebaseClient({ apiKey: process.env.MOUSEBASE_API_KEY });

// POST /api/chat
export async function POST(req: Request) {
  const { messages } = await req.json();
  const stream = await client.chat.stream({
    agent: "chatbot",
    messages,
  });
  return new Response(stream.toReadableStream(), {
    headers: { "Content-Type": "text/event-stream" },
  });
}
```
