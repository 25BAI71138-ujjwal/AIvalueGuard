from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class EvaluationRuleRead(BaseModel):
    id: str
    name: str
    description: Optional[str]
    rule_type: str
    parameters_json: str
    severity: str
    is_active: bool
    pass_count: int
    fail_count: int
    pass_rate_pct: float = 100.0
    updated_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)

class EvaluationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parameters_json: Optional[str] = None
    severity: Optional[str] = None
    is_active: Optional[bool] = None

class EvaluationRunRequest(BaseModel):
    content: str
    rules: Optional[List[str]] = None # rule ids or None for all active

class EvaluationCheckResult(BaseModel):
    rule_id: str
    rule_name: str
    passed: bool
    score: float
    message: str

class EvaluationRunResponse(BaseModel):
    passed: bool
    total_checks: int
    passed_checks: int
    results: List[EvaluationCheckResult]
    escalation_needed: bool
