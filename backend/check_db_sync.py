import sys
sys.modules["app.db.database"] = None

import sqlalchemy as sa
from app.core.config import settings

sync_url = settings.DATABASE_URL.replace("+psycopg", "+psycopg2")
engine = sa.create_engine(sync_url)
with engine.connect() as conn:
    r1 = conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='subscriptions' ORDER BY ordinal_position"))
    print("subscriptions columns:", [row[0] for row in r1])
    r2 = conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='payments' ORDER BY ordinal_position"))
    print("payments columns:", [row[0] for row in r2])
    r3 = conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_name='webhook_events' ORDER BY ordinal_position"))
    print("webhook_events columns:", [row[0] for row in r3])
engine.dispose()
