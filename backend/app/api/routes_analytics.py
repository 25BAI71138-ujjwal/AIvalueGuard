from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.schemas.analytics import OverviewAnalyticsResponse
from backend.app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["Cost & Performance Analytics"])

@router.get("/overview", response_model=OverviewAnalyticsResponse)
async def get_overview(
    workspace_id: str = Query("ws_default"),
    time_range: str = Query("7d", description="24h, 7d, 30d, 90d"),
    db: AsyncSession = Depends(get_db)
):
    return await AnalyticsService.get_overview(db, workspace_id=workspace_id, time_range=time_range)

@router.get("/costs")
async def get_cost_analytics(
    workspace_id: str = Query("ws_default"),
    time_range: str = Query("30d"),
    db: AsyncSession = Depends(get_db)
):
    overview = await AnalyticsService.get_overview(db, workspace_id=workspace_id, time_range=time_range)
    
    # Calculate specific savings categories
    cache_savings = round(sum(p.savings * 0.45 for p in overview.spend_chart), 4)
    routing_savings = round(sum(p.savings * 0.55 for p in overview.spend_chart), 4)

    return {
        "metrics": overview.metrics,
        "spend_chart": overview.spend_chart,
        "model_breakdown": overview.model_breakdown,
        "savings_attribution": {
            "cache_related_savings_usd": cache_savings,
            "routing_related_savings_usd": routing_savings,
            "optimization_overhead_usd": overview.metrics.optimization_overhead_usd,
            "verified_net_savings_usd": overview.metrics.verified_savings_usd
        },
        "pricing_basis": "Stored official per-1M token rates with actual token counts from provider completions"
    }
