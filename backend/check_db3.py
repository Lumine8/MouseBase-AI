import asyncio
import sys
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import text
from app.db.database import engine

async def check():
    async with engine.connect() as conn:
        r2 = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='payments' ORDER BY ordinal_position"))
        print("payments columns:", [row[0] for row in r2])

asyncio.run(check())
