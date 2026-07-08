import asyncio
from sqlalchemy import text
from app.db.database import engine

async def check():
    async with engine.connect() as conn:
        r1 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions' ORDER BY ordinal_position"))
        print("subscriptions columns:", [row[0] for row in r1])
        r2 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='payments' ORDER BY ordinal_position"))
        print("payments columns:", [row[0] for row in r2])
        r3 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='webhook_events' ORDER BY ordinal_position"))
        print("webhook_events columns:", [row[0] for row in r3])

asyncio.run(check())
