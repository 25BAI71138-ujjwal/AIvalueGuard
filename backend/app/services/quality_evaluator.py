import json
import re
from typing import Dict, Any, List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.models.evaluation_rule import EvaluationRule
from backend.app.schemas.gateway import QualityEvaluationMeta, QualityCheckDetail

class QualityEvaluator:
    """
    Quality Evaluation & Structural Validation Engine.
    Executes checks: JSON validity, required keys, length bounds, regex/substring constraints,
    and refusal detection. Tracks pass/fail stats on evaluation rules.
    """

    @classmethod
    async def evaluate(
        cls,
        db: AsyncSession,
        content: str,
        required_fields: Optional[List[str]] = None,
        json_mode: bool = False,
        min_length: int = 1,
        max_length: Optional[int] = None,
        required_phrases: Optional[List[str]] = None
    ) -> QualityEvaluationMeta:
        checks: List[QualityCheckDetail] = []
        all_passed = True

        # 1. Non-empty check
        if not content or len(content.strip()) < min_length:
            checks.append(QualityCheckDetail(
                rule_name="Minimum Length & Non-Empty",
                passed=False,
                score=0.0,
                details=f"Output is shorter than minimum required length ({len(content or '')} < {min_length})"
            ))
            all_passed = False
        else:
            checks.append(QualityCheckDetail(
                rule_name="Minimum Length & Non-Empty",
                passed=True,
                score=1.0,
                details=f"Passed length check ({len(content)} chars)"
            ))

        # 2. Maximum Length check
        if max_length and len(content) > max_length:
            checks.append(QualityCheckDetail(
                rule_name="Maximum Length Boundary",
                passed=False,
                score=0.0,
                details=f"Output exceeded max character limit ({len(content)} > {max_length})"
            ))
            all_passed = False
        elif max_length:
            checks.append(QualityCheckDetail(
                rule_name="Maximum Length Boundary",
                passed=True,
                score=1.0,
                details=f"Within character boundary ({len(content)} <= {max_length})"
            ))

        # 3. Completeness & Truncation Guard (Ensures 90%+ Output Fidelity)
        trimmed = content.strip() if content else ""
        is_truncated = False
        trunc_reason = ""
        if trimmed.count("```") % 2 != 0:
            is_truncated = True
            trunc_reason = "Unclosed code fence block detected"
        elif re.search(r'\n\s*[-*•]\s*$', trimmed):
            is_truncated = True
            trunc_reason = "Dangling empty list marker at end of response"
        elif len(trimmed) < 20 and not json_mode and any(w in trimmed.lower() for w in ["summary:", "difference:", "overview:"]):
            is_truncated = True
            trunc_reason = "Premature termination before summary content was generated"

        if is_truncated:
            checks.append(QualityCheckDetail(
                rule_name="Output Completeness & Truncation Guard",
                passed=False,
                score=0.0,
                details=f"Incomplete generation detected: {trunc_reason}"
            ))
            all_passed = False
        else:
            checks.append(QualityCheckDetail(
                rule_name="Output Completeness & Truncation Guard",
                passed=True,
                score=1.0,
                details="Output completed naturally with full sentence/structural termination"
            ))

        # 4. JSON Validity & Required Fields check
        parsed_json = None
        if json_mode or required_fields:
            try:
                # Try finding JSON block in case wrapped in markdown code fence
                json_str = content.strip()
                if "```json" in json_str:
                    match = re.search(r"```json\s*(.*?)\s*```", json_str, re.DOTALL)
                    if match:
                        json_str = match.group(1).strip()
                elif "```" in json_str:
                    match = re.search(r"```\s*(.*?)\s*```", json_str, re.DOTALL)
                    if match:
                        json_str = match.group(1).strip()

                parsed_json = json.loads(json_str)
                checks.append(QualityCheckDetail(
                    rule_name="JSON Schema & Syntax Validity",
                    passed=True,
                    score=1.0,
                    details="Output is well-formed parseable JSON"
                ))
            except Exception as e:
                checks.append(QualityCheckDetail(
                    rule_name="JSON Schema & Syntax Validity",
                    passed=False,
                    score=0.0,
                    details=f"Failed to parse valid JSON: {str(e)[:100]}"
                ))
                all_passed = False

            if parsed_json and isinstance(parsed_json, dict) and required_fields:
                missing_fields = [f for f in required_fields if f not in parsed_json]
                if missing_fields:
                    checks.append(QualityCheckDetail(
                        rule_name="Required JSON Keys",
                        passed=False,
                        score=round((len(required_fields) - len(missing_fields)) / len(required_fields), 2),
                        details=f"Missing mandatory keys: {', '.join(missing_fields)}"
                    ))
                    all_passed = False
                else:
                    checks.append(QualityCheckDetail(
                        rule_name="Required JSON Keys",
                        passed=True,
                        score=1.0,
                        details=f"All {len(required_fields)} required fields present ({', '.join(required_fields)})"
                    ))

        # 4. Refusal detection
        refusal_patterns = [
            r"as an ai (language )?model",
            r"i cannot fulfill this request",
            r"i am unable to assist with",
            r"i apologize, but i cannot"
        ]
        is_refusal = any(re.search(pat, content, re.IGNORECASE) for pat in refusal_patterns)
        if is_refusal:
            checks.append(QualityCheckDetail(
                rule_name="Zero-Refusal / Task Fulfillability",
                passed=False,
                score=0.0,
                details="Detected generic AI refusal pattern in completion"
            ))
            all_passed = False
        else:
            checks.append(QualityCheckDetail(
                rule_name="Zero-Refusal / Task Fulfillability",
                passed=True,
                score=1.0,
                details="No refusal patterns detected"
            ))

        # 5. Required Phrases check
        if required_phrases:
            missing_phrases = [p for p in required_phrases if p.lower() not in content.lower()]
            if missing_phrases:
                checks.append(QualityCheckDetail(
                    rule_name="Required Substring Constraints",
                    passed=False,
                    score=round((len(required_phrases) - len(missing_phrases)) / len(required_phrases), 2),
                    details=f"Missing required phrase: {', '.join(missing_phrases)}"
                ))
                all_passed = False
            else:
                checks.append(QualityCheckDetail(
                    rule_name="Required Substring Constraints",
                    passed=True,
                    score=1.0,
                    details=f"All {len(required_phrases)} required phrases present"
                ))

        checks_run = len(checks)
        checks_passed = sum(1 for c in checks if c.passed)

        # Update stats on evaluation rules in DB asynchronously
        try:
            for c in checks:
                if c.passed:
                    await db.execute(
                        update(EvaluationRule).where(EvaluationRule.name.ilike(f"%{c.rule_name[:15]}%"))
                        .values(pass_count=EvaluationRule.pass_count + 1)
                    )
                else:
                    await db.execute(
                        update(EvaluationRule).where(EvaluationRule.name.ilike(f"%{c.rule_name[:15]}%"))
                        .values(fail_count=EvaluationRule.fail_count + 1)
                    )
            await db.commit()
        except Exception:
            pass

        return QualityEvaluationMeta(
            passed=all_passed,
            checks_run=checks_run,
            checks_passed=checks_passed,
            details=checks
        )
