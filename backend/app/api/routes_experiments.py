import json
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models.experiment import Experiment
from backend.app.schemas.experiment import (
    ExperimentCreateRequest,
    ExperimentDetailResponse,
    ExperimentItemResult
)
from backend.app.services.experiment_runner import ExperimentRunner, DEFAULT_BENCHMARK_CASES
from backend.app.config import settings

router = APIRouter(prefix="/experiments", tags=["Optimization Lab"])

@router.get("")
async def list_experiments(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Experiment).order_by(desc(Experiment.created_at)).limit(limit)
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [
        {
            "id": e.id,
            "name": e.name,
            "dataset_name": e.dataset_name,
            "baseline_model": e.baseline_model,
            "optimized_policy": e.optimized_policy,
            "total_test_cases": e.total_test_cases,
            "baseline_total_cost": e.baseline_total_cost,
            "optimized_total_cost": e.optimized_total_cost,
            "savings_percentage": e.savings_percentage,
            "baseline_avg_latency_ms": e.baseline_avg_latency_ms,
            "optimized_avg_latency_ms": e.optimized_avg_latency_ms,
            "baseline_quality_pass_rate": e.baseline_quality_pass_rate,
            "optimized_quality_pass_rate": e.optimized_quality_pass_rate,
            "cache_hit_rate": e.cache_hit_rate,
            "status": e.status,
            "created_at": e.created_at.isoformat()
        }
        for e in records
    ]

@router.get("/benchmark-cases")
async def get_benchmark_cases():
    return DEFAULT_BENCHMARK_CASES

@router.post("", response_model=ExperimentDetailResponse)
async def create_and_run_experiment(
    request: ExperimentCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    try:
        res = await ExperimentRunner.run_experiment(db, request, is_demo=settings.DEMO_MODE)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute experiment: {str(e)}")

@router.get("/{experiment_id}", response_model=ExperimentDetailResponse)
async def get_experiment(
    experiment_id: str,
    db: AsyncSession = Depends(get_db)
):
    exp = await db.get(Experiment, experiment_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment run not found")

    items_raw = json.loads(exp.results_summary_json or "[]")
    items = [ExperimentItemResult(**i) for i in items_raw]

    return ExperimentDetailResponse(
        id=exp.id,
        name=exp.name,
        dataset_name=exp.dataset_name,
        baseline_model=exp.baseline_model,
        optimized_policy=exp.optimized_policy,
        total_test_cases=exp.total_test_cases,
        completed_test_cases=exp.completed_test_cases,
        baseline_total_cost=exp.baseline_total_cost,
        optimized_total_cost=exp.optimized_total_cost,
        savings_percentage=exp.savings_percentage,
        baseline_avg_latency_ms=exp.baseline_avg_latency_ms,
        optimized_avg_latency_ms=exp.optimized_avg_latency_ms,
        baseline_quality_pass_rate=exp.baseline_quality_pass_rate,
        optimized_quality_pass_rate=exp.optimized_quality_pass_rate,
        cache_hit_rate=exp.cache_hit_rate,
        status=exp.status,
        created_at=exp.created_at,
        items=items
    )
