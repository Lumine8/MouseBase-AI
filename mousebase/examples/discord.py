"""
Discord bot skeleton using MouseBase for persistent conversation memory.

Requires: discord.py (pip install discord.py)

Usage:
    export MOUSEBASE_API_KEY=mb_live_xxx
    export DISCORD_TOKEN=your_bot_token
    python examples/discord.py
"""

import os
from datetime import datetime

import discord
from mousebase import MouseBase, MouseBaseError

intents = discord.Intents.default()
intents.message_content = True
bot = discord.Bot if hasattr(discord, "Bot") else discord.Client


class MemoryBot(discord.Client):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)
        self.mousebase = MouseBase()

    async def on_ready(self):
        print(f"Logged in as {self.user}")

    async def on_message(self, message: discord.Message):
        if message.author == self.user:
            return

        author_tag = f"discord_{message.author.id}"
        content = message.clean_content

        try:
            self.mousebase.remember(
                content=content,
                external_id=author_tag,
                metadata={
                    "platform": "discord",
                    "author": str(message.author),
                    "channel": str(message.channel),
                    "timestamp": str(datetime.now()),
                },
            )
        except MouseBaseError as e:
            print(f"Failed to store memory: {e}")

        if content.startswith("!recall"):
            query = content.removeprefix("!recall").strip() or "recent"
            try:
                results = self.mousebase.search(f"{author_tag} {query}", top_k=5)
                if not results.results:
                    await message.channel.send("No memories found.")
                    return
                lines = [f"{r.content} (score: {r.score:.2f})" for r in results.results]
                await message.channel.send("**Your memories:**\n" + "\n".join(lines))
            except MouseBaseError as e:
                await message.channel.send(f"Search failed: {e}")

    def run_bot(self):
        token = os.getenv("DISCORD_TOKEN")
        if not token:
            print("Set DISCORD_TOKEN first.")
            return
        self.run(token)


def main():
    api_key = os.getenv("MOUSEBASE_API_KEY")
    if not api_key:
        print("Set MOUSEBASE_API_KEY first.")
        return

    bot = MemoryBot()
    bot.run_bot()


if __name__ == "__main__":
    main()
