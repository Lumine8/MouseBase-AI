# Customer Support

A multi-agent customer support system with tiered escalation, using MouseBase.

## What it demonstrates

- Routing queries to specialised sub-agents (billing, technical, general)
- Escalation flow when an agent cannot resolve
- Conversation history and context passing between agents

## Setup

```bash
export MOUSEBASE_API_KEY=sk-...
npm install
```

## Run

```bash
npm run dev
```

Start a conversation at http://localhost:3000.

## Core pattern

```ts
import { MousebaseClient } from "mousebase-js";

const client = new MousebaseClient({ apiKey: process.env.MOUSEBASE_API_KEY });

// Route to the right agent based on intent
const agentMap = { billing: "billing-agent", tech: "tech-support", general: "general-support" };

export async function handleTicket({ message, category }) {
  const agent = agentMap[category] || agentMap.general;
  return client.chat.stream({
    agent,
    messages: [{ role: "user", content: message }],
  });
}
```
