# Discord Bot

A Discord bot powered by a MouseBase agent, responding to slash commands and mentions.

## What it demonstrates

- Connecting MouseBase to Discord's Gateway API
- Handling slash commands with agent responses
- Long-running conversations per channel

## Setup

```bash
export MOUSEBASE_API_KEY=sk-...
export DISCORD_BOT_TOKEN=your-bot-token
export DISCORD_CLIENT_ID=your-client-id
npm install
```

## Run

```bash
npm run dev
```

Invite the bot to a server and use `/ask <question>`.

## Core pattern

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { MousebaseClient } from "mousebase-js";

const mousebase = new MousebaseClient({ apiKey: process.env.MOUSEBASE_API_KEY });
const discord = new Client({ intents: [GatewayIntentBits.Guilds] });

discord.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await interaction.deferReply();
  const stream = await mousebase.chat.stream({
    agent: "helper",
    messages: [{ role: "user", content: interaction.options.getString("question") }],
  });
  let reply = "";
  for await (const chunk of stream) reply += chunk;
  await interaction.editReply(reply);
});

discord.login(process.env.DISCORD_BOT_TOKEN);
```
