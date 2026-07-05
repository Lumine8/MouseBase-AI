import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy import select

from app.core.security import hash_api_key, generate_api_key, parse_api_key
from app.db.database import AsyncSessionLocal
from app.models.project import Project
from app.models.user import User

async def main():
    print("Starting...")
    async with AsyncSessionLocal() as db:
        print("Connected to database.")
        result = await db.execute(select(User).where(User.email == "dev@mousebase.local"))
        user = result.scalar_one_or_none()
        if user is None:
            print("Creating new user...")
            user = User(email="dev@mousebase.local", password_hash="development-only")
            db.add(user)
            await db.commit()
            await db.refresh(user)

            print(f"Created user: {user.email} with ID: {user.id}")

        else:
            print(f"User already exists: {user.email} with ID: {user.id}")
        
        result = await db.execute(select(Project).where(Project.owner_id==user.id,Project.name == "Development Project"))
        project = result.scalar_one_or_none()

        if project is None:
            api_key = generate_api_key()
            # hashed_api_key = hash_api_key(api_key)
            _, secret = parse_api_key(api_key.key)
            project = Project(owner_id=user.id, 
                            name="Development Project", 
                            description="Development project for testing purposes",
                            api_key_id=api_key.key_id, 
                            api_key_hash=hash_api_key(secret),
            )
            
            db.add(project)
            await db.commit()
            await db.refresh(project)

            print("\n" + "=" * 60)
            print("Development project created successfully.")
            print(f"Project ID : {project.id}")
            print(f"API Key    : {api_key.key}")
            print("=" * 60)
            print("Save this API key now. It cannot be recovered later.")
        else:
            print(f"Project already exists: {project.name} with ID: {project.id}")
            print("API Key is not retrievable for existing projects. If you need a new API key, please create a new project.")

if __name__ == "__main__":
    print("Running script...")
    asyncio.run(main())