from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from backend.app.database import get_db
from backend.app.models.request_log import RequestLog

router = APIRouter(prefix="/requests", tags=["Gateway Requests"])

@router.get("")
async def list_requests(
    search: Optional[str] = Query(None, description="Search prompt or model"),
    status: Optional[str] = Query(None, description="Filter by status"),
    model: Optional[str] = Query(None, description="Filter by model"),
    is_cached: Optional[bool] = Query(None, description="Filter by cache status"),
    workspace_id: str = Query("ws_default"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(RequestLog).where(RequestLog.workspace_id == workspace_id)

    if search:
        search_fmt = f"%{search}%"
        stmt = stmt.where(
            or_(
                RequestLog.prompt_preview.ilike(search_fmt),
                RequestLog.model_selected.ilike(search_fmt),
                RequestLog.id.ilike(search_fmt)
            )
        )

    if status:
        stmt = stmt.where(RequestLog.status == status)

    if model:
        stmt = stmt.where(RequestLog.model_selected == model)

    if is_cached is not None:
        stmt = stmt.where(RequestLog.is_cached == is_cached)

    stmt = stmt.order_by(desc(RequestLog.created_at)).limit(limit).offset(offset)
    result = await db.execute(stmt)
    items = result.scalars().all()

    return {
        "total": len(items),
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": r.id,
                "timestamp": r.created_at.isoformat(),
                "prompt_preview": r.prompt_preview,
                "model_selected": r.model_selected,
                "baseline_model": r.baseline_model,
                "provider": r.provider,
                "prompt_tokens": r.prompt_tokens,
                "completion_tokens": r.completion_tokens,
                "total_tokens": r.total_tokens,
                "latency_ms": r.latency_ms,
                "ttft_ms": r.ttft_ms,
                "actual_cost_usd": r.actual_cost_usd,
                "baseline_cost_usd": r.baseline_cost_usd,
                "saved_cost_usd": r.saved_cost_usd,
                "savings_percentage": r.savings_percentage,
                "is_cached": r.is_cached,
                "cache_type": r.cache_type,
                "quality_passed": r.quality_passed,
                "quality_checks_run": r.quality_checks_run,
                "status": r.status,
                "is_demo": r.is_demo
            }
            for r in items
        ]
    }

@router.get("/{request_id}")
async def get_request_detail(
    request_id: str,
    db: AsyncSession = Depends(get_db)
):
    r = await db.get(RequestLog, request_id)
    if not r:
        raise HTTPException(status_code=404, detail="Request trace not found")

    return {
        "id": r.id,
        "workspace_id": r.workspace_id,
        "timestamp": r.created_at.isoformat(),
        "prompt_preview": r.prompt_preview,
        "system_instruction": r.system_instruction,
        "temperature": r.temperature,
        "model_selected": r.model_selected,
        "baseline_model": r.baseline_model,
        "provider": r.provider,
        "tokens": {
            "prompt": r.prompt_tokens,
            "completion": r.completion_tokens,
            "total": r.total_tokens,
            "raw_context": r.raw_context_tokens,
            "optimized_context": r.optimized_context_tokens,
            "saved_context": r.tokens_saved_context
        },
        "performance": {
            "latency_ms": r.latency_ms,
            "ttft_ms": r.ttft_ms
        },
        "financials": {
            "actual_cost_usd": r.actual_cost_usd,
            "baseline_cost_usd": r.baseline_cost_usd,
            "saved_cost_usd": r.saved_cost_usd,
            "savings_percentage": r.savings_percentage,
            "optimization_overhead_usd": r.optimization_overhead_usd
        },
        "cache": {
            "is_cached": r.is_cached,
            "cache_type": r.cache_type
        },
        "quality": {
            "passed": r.quality_passed,
            "checks_run": r.quality_checks_run,
            "details_json": r.quality_details_json
        },
        "routing": {
            "reason": r.routing_reason,
            "decision_json": r.routing_decision_json,
            "fallbacks_used_json": r.fallbacks_used_json
        },
        "status": r.status,
        "error_message": r.error_message,
        "is_demo": r.is_demo
    }
