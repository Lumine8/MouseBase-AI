from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db
from app.dependencies.auth import get_current_user_jwt_only as get_current_user
from app.models.activity import ActivityLog
from app.models.memory import Memory
from app.models.project import Project
from app.models.usage import Usage
from app.models.user import User

router = APIRouter(prefix="/data", tags=["data"])

TABLE_CONFIG = {
    "projects": {
        "model": Project,
        "label": "Projects",
        "columns": ["id", "name", "description", "plan", "status", "created_at", "updated_at", "last_used_at"],
        "order_by": "created_at",
    },
    "memories": {
        "model": Memory,
        "label": "Memories",
        "columns": ["id", "project_id", "external_id", "content", "created_at", "updated_at"],
        "order_by": "created_at",
    },
    "activity_logs": {
        "model": ActivityLog,
        "label": "Activity",
        "columns": ["id", "project_id", "action", "memory_id", "details", "created_at"],
        "order_by": "created_at",
    },
    "usage": {
        "model": Usage,
        "label": "Usage",
        "columns": ["id", "project_id", "date", "requests", "searches", "embeddings", "storage_bytes", "created_at"],
        "order_by": "date",
    },
}


def _get_project_ids_query(current_user_id):
    return select(Project.id).where(Project.owner_id == current_user_id)


@router.get("/tables")
async def list_tables(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project_ids_subq = _get_project_ids_query(current_user.id)
    tables = []
    for key, cfg in TABLE_CONFIG.items():
        model = cfg["model"]
        if key == "projects":
            count_q = select(func.count()).select_from(model).where(model.owner_id == current_user.id)
        elif hasattr(model, "project_id"):
            count_q = select(func.count()).select_from(model).where(model.project_id.in_(project_ids_subq))
        else:
            count_q = select(func.count()).select_from(model)
        count = await db.scalar(count_q)
        tables.append({
            "id": key,
            "label": cfg["label"],
            "columns": cfg["columns"],
            "row_count": count or 0,
        })
    return {"tables": tables}


@router.get("/{table}/rows")
async def get_table_rows(
    table: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    search: str | None = Query(None),
    sort: str | None = Query(None),
    order: str | None = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cfg = TABLE_CONFIG.get(table)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Unknown table: {table}")

    model = cfg["model"]
    project_ids_subq = _get_project_ids_query(current_user.id)

    if table == "projects":
        base_q = select(model).where(model.owner_id == current_user.id)
    elif hasattr(model, "project_id"):
        base_q = select(model).where(model.project_id.in_(project_ids_subq))
    else:
        base_q = select(model)

    if search and hasattr(model, "content"):
        base_q = base_q.where(model.content.ilike(f"%{search}%"))
    elif search and hasattr(model, "name"):
        base_q = base_q.where(model.name.ilike(f"%{search}%"))
    elif search and hasattr(model, "action"):
        base_q = base_q.where(model.action.ilike(f"%{search}%"))

    sort_col = sort or cfg["order_by"]
    sort_dir = order if order in ("asc", "desc") else "desc"
    sort_col_attr = getattr(model, sort_col, None)
    if sort_col_attr is not None:
        order_col = sort_col_attr.asc() if sort_dir == "asc" else sort_col_attr.desc()
        base_q = base_q.order_by(order_col)
    else:
        default = getattr(model, cfg["order_by"])
        base_q = base_q.order_by(default.desc())

    count_q = select(func.count()).select_from(base_q.subquery())
    total = await db.scalar(count_q) or 0
    total_pages = max(1, (total + per_page - 1) // per_page)

    offset = (page - 1) * per_page
    rows_q = base_q.offset(offset).limit(per_page)
    result = await db.execute(rows_q)
    rows = result.scalars().all()

    data = []
    for row in rows:
        row_data = {}
        for col in cfg["columns"]:
            val = getattr(row, col, None)
            if isinstance(val, bytes):
                val = val.hex()
            row_data[col] = val
        data.append(row_data)

    return {
        "table": table,
        "columns": cfg["columns"],
        "rows": data,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
    }


@router.get("/{table}/count")
async def get_table_count(
    table: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cfg = TABLE_CONFIG.get(table)
    if not cfg:
        raise HTTPException(status_code=404, detail=f"Unknown table: {table}")

    model = cfg["model"]
    project_ids_subq = _get_project_ids_query(current_user.id)

    if table == "projects":
        q = select(func.count()).select_from(model).where(model.owner_id == current_user.id)
    elif hasattr(model, "project_id"):
        q = select(func.count()).select_from(model).where(model.project_id.in_(project_ids_subq))
    else:
        q = select(func.count()).select_from(model)
    count = await db.scalar(q) or 0
    return {"table": table, "count": count}
