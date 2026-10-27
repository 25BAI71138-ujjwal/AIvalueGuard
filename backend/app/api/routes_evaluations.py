from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from backend.app.database import get_db
from backend.app.models.evaluation_rule import EvaluationRule
from backend.app.schemas.eval import (
    EvaluationRuleRead,
    EvaluationRuleUpdate,
    EvaluationRunRequest,
    EvaluationRunResponse
)
from backend.app.services.quality_evaluator import QualityEvaluator

router = APIRouter(prefix="/evaluations", tags=["Quality Evaluations"])

@router.get("/rules", response_model=List[EvaluationRuleRead])
async def list_evaluation_rules(db: AsyncSession = Depends(get_db)):
    stmt = select(EvaluationRule).order_by(desc(EvaluationRule.pass_count + EvaluationRule.fail_count))
    result = await db.execute(stmt)
    rules = result.scalars().all()
    
    out = []
    for r in rules:
        total = r.pass_count + r.fail_count
        pass_rate = round((r.pass_count / total) * 100.0, 1) if total > 0 else 100.0
        out.append(EvaluationRuleRead(
            id=r.id,
            name=r.name,
            description=r.description,
            rule_type=r.rule_type,
            parameters_json=r.parameters_json,
            severity=r.severity,
            is_active=r.is_active,
            pass_count=r.pass_count,
            fail_count=r.fail_count,
            pass_rate_pct=pass_rate,
            updated_at=r.updated_at
        ))
    return out

@router.put("/rules/{rule_id}", response_model=EvaluationRuleRead)
async def update_rule(
    rule_id: str,
    rule_update: EvaluationRuleUpdate,
    db: AsyncSession = Depends(get_db)
):
    rule = await db.get(EvaluationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Evaluation rule not found")

    data = rule_update.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(rule, field, val)

    await db.commit()
    await db.refresh(rule)

    total = rule.pass_count + rule.fail_count
    pass_rate = round((rule.pass_count / total) * 100.0, 1) if total > 0 else 100.0

    return EvaluationRuleRead(
        id=rule.id,
        name=rule.name,
        description=rule.description,
        rule_type=rule.rule_type,
        parameters_json=rule.parameters_json,
        severity=rule.severity,
        is_active=rule.is_active,
        pass_count=rule.pass_count,
        fail_count=rule.fail_count,
        pass_rate_pct=pass_rate,
        updated_at=rule.updated_at
    )

@router.post("/run", response_model=EvaluationRunResponse)
async def run_evaluation_test(
    request: EvaluationRunRequest,
    db: AsyncSession = Depends(get_db)
):
    eval_meta = await QualityEvaluator.evaluate(
        db=db,
        content=request.content,
        json_mode="{" in request.content
    )
    return EvaluationRunResponse(
        passed=eval_meta.passed,
        total_checks=eval_meta.checks_run,
        passed_checks=eval_meta.checks_passed,
        results=[
            {
                "rule_id": f"check_{idx}",
                "rule_name": c.rule_name,
                "passed": c.passed,
                "score": c.score,
                "message": c.details
            }
            for idx, c in enumerate(eval_meta.details)
        ],
        escalation_needed=not eval_meta.passed
    )
