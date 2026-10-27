from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models.cache_entry import CacheEntry
from backend.app.schemas.cache import CacheStats, CacheInvalidateRequest, CacheEntryRead
from backend.app.services.cache_service import CacheService

router = APIRouter(prefix="/cache", tags=["Cache"])

@router.get("/stats", response_model=CacheStats)
async def get_cache_stats(
    workspace_id: str = Query("ws_default"),
    db: AsyncSession = Depends(get_db)
):
    stats = await CacheService.get_stats(db, workspace_id)
    return stats

@router.get("/entries", response_model=List[CacheEntryRead])
async def list_cache_entries(
    workspace_id: str = Query("ws_default"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(CacheEntry)
        .where(CacheEntry.workspace_id == workspace_id, CacheEntry.is_active == True)
        .order_by(desc(CacheEntry.last_hit_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/invalidate")
async def invalidate_cache(
    request: CacheInvalidateRequest,
    db: AsyncSession = Depends(get_db)
):
    count = await CacheService.invalidate(
        db,
        workspace_id=request.workspace_id,
        model=request.model,
        cache_key=request.cache_key
    )
    return {
        "status": "success",
        "invalidated_count": count,
        "message": f"Successfully invalidated {count} cache records"
    }
