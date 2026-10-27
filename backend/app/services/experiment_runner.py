import uuid
import json
import time
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.models.experiment import Experiment
from backend.app.schemas.experiment import (
    ExperimentCreateRequest,
    ExperimentDetailResponse,
    ExperimentItemResult,
    ExperimentTestCase
)
from backend.app.schemas.playground import PlaygroundCompareRequest
from backend.app.services.playground_service import PlaygroundService

# Built-in high-quality benchmark test dataset
DEFAULT_BENCHMARK_CASES = [
    ExperimentTestCase(
        id="case_01",
        prompt="Classify this customer ticket into categories [billing, auth, bug, feature_request]: 'I was charged twice on my invoice for the April subscription cycle. Please refund $49 immediately.'",
        category="Classification",
        expected_contains="billing"
    ),
    ExperimentTestCase(
        id="case_02",
        prompt="Extract user entities from text: 'Dr. Sarah Connor, Senior Director of Engineering at Cyberdyne Systems in Sunnyvale, CA, registered on 2026-03-15.' Return valid JSON with keys: name, title, company, location, date.",
        category="Entity Extraction",
        expected_contains="name"
    ),
    ExperimentTestCase(
        id="case_03",
        prompt="Write a Python function `safe_divide(a: float, b: float) -> Optional[float]` that handles ZeroDivisionError and returns None.",
        category="Code Generation",
        expected_contains="def safe_divide"
    ),
    ExperimentTestCase(
        id="case_04",
        prompt="Summarize this server incident log in 2 sentences: 'At 04:12 UTC, database replica node db-02 reported connection saturation. Load balancer failover triggered at 04:14. Standby read replica promoted without data corruption at 04:18.'",
        category="Summarization",
        expected_contains="Summary"
    ),
    ExperimentTestCase(
        id="case_05",
        prompt="Translate this product error message to French: 'Your session has expired due to 15 minutes of inactivity. Please re-authenticate to continue.'",
        category="Translation",
        expected_contains="session"
    ),
    ExperimentTestCase(
        id="case_06",
        prompt="Classify sentiment (Positive, Neutral, Negative): 'The new gateway caching layer reduced our monthly API bill by 68% while keeping latency under 150ms. Highly recommended.'",
        category="Sentiment Analysis",
        expected_contains="Positive"
    ),
    ExperimentTestCase(
        id="case_07",
        prompt="Generate a JSON schema for a Product entity with fields: id (uuid), title (string), price (number > 0), in_stock (boolean).",
        category="Schema Design",
        expected_contains="properties"
    ),
    ExperimentTestCase(
        id="case_08",
        prompt="Find potential security issues in this SQL snippet: 'SELECT * FROM users WHERE email = ' + user_input + ' AND active = 1'",
        category="Security Review",
        expected_contains="SQL injection"
    ),
    ExperimentTestCase(
        id="case_09",
        prompt="What is the difference between p95 and p99 latency in distributed systems? Keep it to 3 bullet points.",
        category="Technical Explanations",
        expected_contains="latency"
    ),
    ExperimentTestCase(
        id="case_10",
        prompt="Extract key metrics from this release report: 'Release 2.4.0 completed 1,420 unit tests with 99.8% pass rate, 42ms median build time, and zero high-severity vulnerabilities.'",
        category="Report Analysis",
        expected_contains="pass rate"
    )
]

class ExperimentRunner:
    @classmethod
    async def run_experiment(
        cls,
        db: AsyncSession,
        request: ExperimentCreateRequest,
        is_demo: bool = True
    ) -> ExperimentDetailResponse:
        exp_id = f"exp_{uuid.uuid4().hex[:12]}"
        created_at = datetime.datetime.utcnow()

        # Select test cases (custom or default benchmark)
        cases = request.custom_dataset or DEFAULT_BENCHMARK_CASES
        sample_size = min(len(cases), max(1, request.sample_size))
        selected_cases = cases[:sample_size]

        items_results: List[ExperimentItemResult] = []
        b_total_cost = 0.0
        opt_total_cost = 0.0
        b_latencies = []
        opt_latencies = []
        b_passes = 0
        opt_passes = 0
        cache_hits = 0
        fallbacks_used = 0

        for case in selected_cases:
            compare_req = PlaygroundCompareRequest(
                prompt=case.prompt,
                system_instruction=case.system_instruction,
                context=case.context,
                baseline_model=request.baseline_model,
                optimized_model_mode="auto",
                json_mode="json" in case.prompt.lower(),
                workspace_id="ws_default"
            )

            res = await PlaygroundService.compare(db, compare_req, is_demo=is_demo)

            b_total_cost += res.baseline.cost_usd
            opt_total_cost += res.optimized.cost_usd
            b_latencies.append(res.baseline.latency_ms)
            opt_latencies.append(res.optimized.latency_ms)

            if res.baseline.quality_passed:
                b_passes += 1
            if res.optimized.quality_passed:
                opt_passes += 1
            if res.optimized.is_cached:
                cache_hits += 1
            if "fallback" in (res.optimized.routing_reason or "").lower():
                fallbacks_used += 1

            item_result = ExperimentItemResult(
                case_id=case.id,
                prompt_preview=case.prompt[:120],
                category=case.category,
                baseline_model=res.baseline.model,
                optimized_model=res.optimized.model,
                baseline_cost=res.baseline.cost_usd,
                optimized_cost=res.optimized.cost_usd,
                savings_pct=res.comparison.savings_percentage,
                baseline_latency_ms=res.baseline.latency_ms,
                optimized_latency_ms=res.optimized.latency_ms,
                baseline_passed=res.baseline.quality_passed,
                optimized_passed=res.optimized.quality_passed,
                is_cached=res.optimized.is_cached,
                fallback_used=res.optimized.model != request.baseline_model and not res.optimized.is_cached
            )
            items_results.append(item_result)

        # Summary calculations
        if b_total_cost > 0:
            savings_pct = round(((b_total_cost - opt_total_cost) / b_total_cost) * 100.0, 1)
        else:
            savings_pct = 0.0

        b_avg_lat = round(sum(b_latencies) / max(1, len(b_latencies)), 1)
        opt_avg_lat = round(sum(opt_latencies) / max(1, len(opt_latencies)), 1)
        b_pass_rate = round((b_passes / sample_size) * 100.0, 1)
        opt_pass_rate = round((opt_passes / sample_size) * 100.0, 1)
        c_hit_rate = round((cache_hits / sample_size) * 100.0, 1)

        # Persist experiment record
        exp_record = Experiment(
            id=exp_id,
            name=request.name,
            dataset_name=request.dataset_name,
            baseline_model=request.baseline_model,
            optimized_policy=request.optimized_policy,
            total_test_cases=sample_size,
            completed_test_cases=sample_size,
            baseline_total_cost=round(b_total_cost, 6),
            optimized_total_cost=round(opt_total_cost, 6),
            savings_percentage=savings_pct,
            baseline_avg_latency_ms=b_avg_lat,
            optimized_avg_latency_ms=opt_avg_lat,
            baseline_quality_pass_rate=b_pass_rate,
            optimized_quality_pass_rate=opt_pass_rate,
            cache_hit_rate=c_hit_rate,
            status="completed",
            results_summary_json=json.dumps([i.model_dump() for i in items_results]),
            created_at=created_at
        )
        db.add(exp_record)
        await db.commit()

        return ExperimentDetailResponse(
            id=exp_id,
            name=request.name,
            dataset_name=request.dataset_name,
            baseline_model=request.baseline_model,
            optimized_policy=request.optimized_policy,
            total_test_cases=sample_size,
            completed_test_cases=sample_size,
            baseline_total_cost=round(b_total_cost, 6),
            optimized_total_cost=round(opt_total_cost, 6),
            savings_percentage=savings_pct,
            baseline_avg_latency_ms=b_avg_lat,
            optimized_avg_latency_ms=opt_avg_lat,
            baseline_quality_pass_rate=b_pass_rate,
            optimized_quality_pass_rate=opt_pass_rate,
            cache_hit_rate=c_hit_rate,
            status="completed",
            created_at=created_at,
            items=items_results
        )
