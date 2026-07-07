import asyncio
import sys

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.project import Project

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Project))

        projects = result.scalars().all()

        print(f"Found {len(projects)} project(s)")

        for p in projects:
            print(p.id)
            print(p.name)
            print(p.api_key_id)


asyncio.run(main())