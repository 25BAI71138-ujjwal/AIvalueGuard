import datetime

from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from backend.app.models.request_log import RequestLog
from backend.app.schemas.analytics import (
    OverviewAnalyticsResponse,
    OverviewMetrics,
    DailySpendPoint,
    ModelUsageBreakdown,
    LatencyPercentiles
)

class AnalyticsService:
    @classmethod
    async def get_overview(
        cls,
        db: AsyncSession,
        workspace_id: str = "ws_default",
        time_range: str = "7d"
    ) -> OverviewAnalyticsResponse:
        # Determine cutoff date
        now = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        days_map = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}
        days = days_map.get(time_range, 7)
        cutoff = now - datetime.timedelta(days=days)

        # Query all requests in range
        stmt = (
            select(RequestLog)
            .where(RequestLog.workspace_id == workspace_id, RequestLog.created_at >= cutoff)
            .order_by(desc(RequestLog.created_at))
        )
        result = await db.execute(stmt)
        requests = result.scalars().all()

        total_requests = len(requests)
        if total_requests == 0:
            # Return empty/default state
            empty_metrics = OverviewMetrics(
                total_spend_usd=0.0,
                baseline_spend_usd=0.0,
                total_savings_usd=0.0,
                savings_percentage=0.0,
                cost_per_successful_task=0.0,
                total_requests=0,
                successful_requests=0,
                latency=LatencyPercentiles(p50=0, p90=0, p95=0, p99=0, avg=0),
                quality_pass_rate_pct=100.0,
                cache_hit_rate_pct=0.0,
                failure_rate_pct=0.0,
                fallback_rate_pct=0.0,
                verified_savings_usd=0.0,
                estimated_savings_usd=0.0,
                optimization_overhead_usd=0.0,
                time_range=time_range,
                is_demo=True
            )
            return OverviewAnalyticsResponse(
                metrics=empty_metrics,
                spend_chart=[],
                model_breakdown=[],
                recent_savings_events=[]
            )

        # Computations
        total_spend = sum(r.actual_cost_usd for r in requests)
        baseline_spend = sum(r.baseline_cost_usd for r in requests)
        total_savings = round(baseline_spend - total_spend, 4)

        if baseline_spend > 0:
            savings_pct = round(((baseline_spend - total_spend) / baseline_spend) * 100.0, 1)
        else:
            savings_pct = 0.0

        successful_requests = sum(1 for r in requests if r.status in ["success", "cached", "fallback_success"])
        cost_per_task = round(total_spend / max(1, successful_requests), 6)

        # Latencies
        latencies = sorted([r.latency_ms for r in requests if r.latency_ms > 0] or [0.0])
        def get_pct(p):
            if not latencies:
                return 0.0
            idx = int(round((len(latencies) - 1) * (p / 100.0)))
            return latencies[min(idx, len(latencies) - 1)]

        p50 = get_pct(50)
        p90 = get_pct(90)
        p95 = get_pct(95)
        p99 = get_pct(99)
        avg_lat = sum(latencies) / max(1, len(latencies))

        # Rates
        quality_passes = sum(1 for r in requests if r.quality_passed)
        quality_pass_rate = round((quality_passes / total_requests) * 100.0, 1)

        cache_hits = sum(1 for r in requests if r.is_cached)
        cache_hit_rate = round((cache_hits / total_requests) * 100.0, 1)

        failures = sum(1 for r in requests if r.status == "error")
        failure_rate = round((failures / total_requests) * 100.0, 1)

        fallbacks = sum(1 for r in requests if r.status == "fallback_success")
        fallback_rate = round((fallbacks / total_requests) * 100.0, 1)

        total_overhead = sum(r.optimization_overhead_usd for r in requests)
        verified_savings = round(sum(r.saved_cost_usd for r in requests if r.quality_passed), 4)
        estimated_savings = total_savings

        # Check if dataset is demo
        is_demo_data = any(r.is_demo for r in requests)

        metrics = OverviewMetrics(
            total_spend_usd=round(total_spend, 4),
            baseline_spend_usd=round(baseline_spend, 4),
            total_savings_usd=total_savings,
            savings_percentage=savings_pct,
            cost_per_successful_task=cost_per_task,
            total_requests=total_requests,
            successful_requests=successful_requests,
            latency=LatencyPercentiles(
                p50=round(p50, 1),
                p90=round(p90, 1),
                p95=round(p95, 1),
                p99=round(p99, 1),
                avg=round(avg_lat, 1)
            ),
            quality_pass_rate_pct=quality_pass_rate,
            cache_hit_rate_pct=cache_hit_rate,
            failure_rate_pct=failure_rate,
            fallback_rate_pct=fallback_rate,
            verified_savings_usd=verified_savings,
            estimated_savings_usd=estimated_savings,
            optimization_overhead_usd=round(total_overhead, 4),
            time_range=time_range,
            is_demo=is_demo_data
        )

        # Daily Spend Timeseries
        daily_buckets: Dict[str, Dict[str, Any]] = {}
        # Prepopulate past N days
        for i in range(days):
            d = (now - datetime.timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
            daily_buckets[d] = {"date": d, "baseline_spend": 0.0, "optimized_spend": 0.0, "savings": 0.0, "request_count": 0}

        for r in requests:
            d_str = r.created_at.strftime("%Y-%m-%d")
            if d_str in daily_buckets:
                daily_buckets[d_str]["baseline_spend"] += r.baseline_cost_usd
                daily_buckets[d_str]["optimized_spend"] += r.actual_cost_usd
                daily_buckets[d_str]["savings"] += r.saved_cost_usd
                daily_buckets[d_str]["request_count"] += 1

        spend_chart = [
            DailySpendPoint(
                date=k,
                baseline_spend=round(v["baseline_spend"], 4),
                optimized_spend=round(v["optimized_spend"], 4),
                savings=round(v["savings"], 4),
                request_count=v["request_count"]
            )
            for k, v in daily_buckets.items()
        ]

        # Model Usage Breakdown
        model_counts: Dict[str, Dict[str, Any]] = {}
        for r in requests:
            m = r.model_selected
            if m not in model_counts:
                model_counts[m] = {"provider": r.provider, "count": 0, "cost": 0.0, "latencies": []}
            model_counts[m]["count"] += 1
            model_counts[m]["cost"] += r.actual_cost_usd
            if r.latency_ms > 0:
                model_counts[m]["latencies"].append(r.latency_ms)

        model_breakdown = [
            ModelUsageBreakdown(
                model=m,
                provider=data["provider"],
                request_count=data["count"],
                percentage=round((data["count"] / total_requests) * 100.0, 1),
                total_cost=round(data["cost"], 4),
                avg_latency_ms=round(sum(data["latencies"]) / len(data["latencies"]), 1) if data["latencies"] else 0.0
            )
            for m, data in sorted(model_counts.items(), key=lambda x: x[1]["count"], reverse=True)
        ]

        # Recent Savings Events (top 5 impactful optimizations)
        recent_savings = [
            {
                "request_id": r.id,
                "timestamp": r.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "model_selected": r.model_selected,
                "baseline_model": r.baseline_model,
                "saved_usd": round(r.saved_cost_usd, 5),
                "savings_pct": r.savings_percentage,
                "reason": r.routing_reason or ("Cached hit" if r.is_cached else "Intelligent routing"),
                "status": r.status
            }
            for r in requests[:5]
        ]

        return OverviewAnalyticsResponse(
            metrics=metrics,
            spend_chart=spend_chart,
            model_breakdown=model_breakdown,
            recent_savings_events=recent_savings
        )
