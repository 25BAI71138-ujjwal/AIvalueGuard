from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models.model_config import ModelConfig
from backend.app.schemas.model import (
    ModelConfigRead,
    ModelConfigCreate,
    ModelConfigUpdate,
    SimulateRouteRequest,
    SimulateRouteResponse
)
from backend.app.services.routing_engine import RoutingEngine

router = APIRouter(prefix="/models", tags=["Models & Routing"])

@router.post("/simulate-route", response_model=SimulateRouteResponse)
async def simulate_route(
    req: SimulateRouteRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Simulates multi-criteria routing decisions without invoking external APIs.
    Returns the optimal model, decision reasoning, and fallback chain.
    """
    selected, decision, fallbacks = await RoutingEngine.route_request(
        db=db,
        prompt_tokens=req.prompt_tokens,
        expected_completion_tokens=req.expected_completion_tokens,
        latency_budget_ms=req.latency_budget_ms,
        required_capabilities=req.required_capabilities,
        min_quality_score=req.min_quality_score,
        baseline_model_id=req.baseline_model_id,
        forced_model_id=req.forced_model_id,
        prompt_text=req.prompt_text
    )
    return SimulateRouteResponse(
        selected_model=selected,
        decision=decision.model_dump(),
        fallbacks=fallbacks
    )

@router.get("", response_model=List[ModelConfigRead])
async def list_models(db: AsyncSession = Depends(get_db)):
    stmt = select(ModelConfig).order_by(desc(ModelConfig.priority), ModelConfig.input_cost_per_m)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("", response_model=ModelConfigRead)
async def create_model(model_in: ModelConfigCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.get(ModelConfig, model_in.id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Model '{model_in.id}' already exists")

    model = ModelConfig(**model_in.model_dump())
    db.add(model)
    await db.commit()
    await db.refresh(model)
    return model

@router.put("/{model_id}", response_model=ModelConfigRead)
async def update_model(
    model_id: str,
    model_update: ModelConfigUpdate,
    db: AsyncSession = Depends(get_db)
):
    model = await db.get(ModelConfig, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model configuration not found")

    update_data = model_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(model, field, val)

    await db.commit()
    await db.refresh(model)
    return model
