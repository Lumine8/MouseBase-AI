"""Background workers for memory lifecycle management.

- Expiry worker: marks expired memories as deleted
- Hard-delete worker: permanently removes deleted memories after retention period
"""

import asyncio
from datetime import datetime, timezone, timedelta

from sqlalchemy import update, delete

from app.core.config import settings
from app.core.log_config import get_logger
from app.db.database import AsyncSessionLocal
from app.models.memory import Memory, MemoryStatus

logger = get_logger(__name__)


async def run_expiry_worker():
    """Mark memories with expires_at < now() as deleted."""
    try:
        async with AsyncSessionLocal() as db:
            now = datetime.now(timezone.utc)
            result = await db.execute(
                update(Memory)
                .where(
                    Memory.expires_at.isnot(None),
                    Memory.expires_at < now,
                    Memory.status == MemoryStatus.ACTIVE.value,
                )
                .values(
                    status=MemoryStatus.DELETED.value,
                    updated_at=now,
                )
                .execution_options(synchronize_session=False)
            )
            if result.rowcount > 0:
                logger.info(
                    "expiry_worker: marked %d expired memories as deleted",
                    result.rowcount,
                )
            await db.commit()
    except Exception:
        logger.exception("expiry_worker: failed")


async def run_hard_delete_worker():
    """Permanently remove deleted memories after retention period."""
    try:
        async with AsyncSessionLocal() as db:
            cutoff = datetime.now(timezone.utc) - timedelta(
                days=settings.HARD_DELETE_RETENTION_DAYS
            )
            result = await db.execute(
                delete(Memory).where(
                    Memory.status == MemoryStatus.DELETED.value,
                    Memory.updated_at < cutoff,
                )
            )
            if result.rowcount > 0:
                logger.info(
                    "hard_delete_worker: permanently deleted %d memories (retention=%d days)",
                    result.rowcount,
                    settings.HARD_DELETE_RETENTION_DAYS,
                )
            await db.commit()
    except Exception:
        logger.exception("hard_delete_worker: failed")


async def memory_lifecycle_worker():
    """Run all memory lifecycle tasks on an interval."""
    while True:
        await run_expiry_worker()
        await run_hard_delete_worker()
        await asyncio.sleep(settings.WORKER_INTERVAL_SECONDS)
