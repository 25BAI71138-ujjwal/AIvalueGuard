from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.schemas.gateway import GatewayChatRequest, GatewayChatResponse
from backend.app.services.gateway_orchestrator import GatewayOrchestrator

router = APIRouter(prefix="/gateway", tags=["Gateway"])

@router.post("/chat", response_model=GatewayChatResponse)
async def chat_completion(
    request: GatewayChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Central AI Gateway endpoint.
    Performs cache lookup, context optimization, eligible model selection, execution,
    and quality validation.
    """
    try:
        response = await GatewayOrchestrator.process_chat(db, request)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gateway execution failure: {str(e)}")

@router.post("/task-execute", response_model=GatewayChatResponse)
async def task_execute(
    request: GatewayChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Executes an AI task with live token tracking, cost monitoring, and task-level attribution.
    """
    try:
        response = await GatewayOrchestrator.process_chat(db, request)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI Task execution failure: {str(e)}")

