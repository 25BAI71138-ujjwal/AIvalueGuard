from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.schemas.playground import PlaygroundCompareRequest, PlaygroundCompareResponse
from backend.app.services.playground_service import PlaygroundService
from backend.app.config import settings

router = APIRouter(prefix="/playground", tags=["Playground"])

@router.post("/compare", response_model=PlaygroundCompareResponse)
async def compare_strategies(
    request: PlaygroundCompareRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Side-by-side comparison playground.
    Executes raw unoptimized baseline vs AIValueGuard optimized path.
    """
    try:
        response = await PlaygroundService.compare(db, request, is_demo=settings.DEMO_MODE)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison execution error: {str(e)}")
