import asyncio
import os
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select

from app.core.security import (
    APIKey,
    encrypt_api_key,
    hash_api_key,
    parse_api_key,
)
from app.db.database import AsyncSessionLocal
from app.models.project import Project
from app.models.user import User

DEFAULT_TEST_API_KEY = (
    "mb_live_ZbqFJSTeqGsxQUFT_" "C56InqSqcVN36jb-jzUYqF2q3XToAz1z_96vDE1FB2E"
)


async def main():
    print("Starting...")

    async with AsyncSessionLocal() as db:
        print("Connected to database.")

        result = await db.execute(
            select(User).where(User.email == "dev@mousebase.local")
        )
        user = result.scalar_one_or_none()

        if user is None:
            print("Creating new user...")
            user = User(
                email="dev@mousebase.local",
                password_hash="development-only",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

            print(f"Created user: {user.email}")
        else:
            print(f"User already exists: {user.email}")

        fixed_key = os.getenv("TEST_API_KEY", DEFAULT_TEST_API_KEY)
        key_id, secret = parse_api_key(fixed_key)
        api_key = APIKey(key=fixed_key, key_id=key_id)

        result = await db.execute(
            select(Project).where(
                Project.owner_id == user.id,
                Project.name == "Development Project",
            )
        )
        project = result.scalar_one_or_none()

        if project is None:
            project = Project(
                owner_id=user.id,
                name="Development Project",
                description="Development project for testing purposes",
                api_key_id=api_key.key_id,
                api_key_hash=hash_api_key(secret),
                api_key_encrypted=encrypt_api_key(fixed_key),
            )
            db.add(project)
        else:
            project.api_key_id = api_key.key_id
            project.api_key_hash = hash_api_key(secret)
            project.api_key_encrypted = encrypt_api_key(fixed_key)
            print(f"Updated existing project key.")

        await db.commit()
        await db.refresh(project)

        print("\n" + "=" * 60)
        print("Development project ready.")
        print(f"Project ID : {project.id}")
        print(f"API Key    : {api_key.key}")
        print("=" * 60)

        print("\nFull key for sign-in:")
        print(f"  {fixed_key}")


if __name__ == "__main__":
    asyncio.run(main())
