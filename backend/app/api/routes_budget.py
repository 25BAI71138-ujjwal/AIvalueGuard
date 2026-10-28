from fastapi import APIRouter, Depends, Query, Body
from typing import Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.services.task_tracking_service import TaskTrackingService

router = APIRouter(prefix="/budget", tags=["Budget & Spending Alerts"])

@router.get("")
async def get_budget(
    workspace_id: str = Query("ws_default"),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns daily, weekly, and monthly budget limits, current consumption, and alert warnings.
    """
    return await TaskTrackingService.get_budget_status(db, workspace_id=workspace_id)

@router.post("")
async def update_budget(
    data: Dict[str, Any] = Body(...),
    workspace_id: str = Query("ws_default"),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates configurable budget limits (daily, weekly, monthly) and warning thresholds.
    """
    return await TaskTrackingService.update_budget(db, workspace_id=workspace_id, data=data)
