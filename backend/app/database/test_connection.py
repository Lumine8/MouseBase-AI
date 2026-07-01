from sqlalchemy import text

from app.database.database import engine

with engine.connect() as conn:
    result = conn.execute(text("SELECT version();"))
    print(result.fetchone())