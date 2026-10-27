import datetime
import json
import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from backend.app.models.model_config import ModelConfig
from backend.app.models.evaluation_rule import EvaluationRule
from backend.app.models.request_log import RequestLog
from backend.app.models.cache_entry import CacheEntry

INITIAL_MODELS = [
    {
        "id": "gpt-4o",
        "provider": "openai",
        "display_name": "OpenAI GPT-4o",
        "input_cost_per_m": 2.50,
        "output_cost_per_m": 10.00,
        "context_window": 128000,
        "max_output_tokens": 4096,
        "latency_estimate_ms": 780,
        "quality_score": 0.96,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": True,
        "priority": 1,
        "is_enabled": True,
        "is_default_baseline": True,
        "pricing_source": "OpenAI Pricing March 2026"
    },
    {
        "id": "gpt-4o-mini",
        "provider": "openai",
        "display_name": "OpenAI GPT-4o Mini",
        "input_cost_per_m": 0.15,
        "output_cost_per_m": 0.60,
        "context_window": 128000,
        "max_output_tokens": 4096,
        "latency_estimate_ms": 280,
        "quality_score": 0.88,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": True,
        "priority": 8,
        "is_enabled": True,
        "is_default_baseline": False,
        "pricing_source": "OpenAI Pricing March 2026"
    },
    {
        "id": "claude-3-5-sonnet",
        "provider": "anthropic",
        "display_name": "Claude 3.5 Sonnet",
        "input_cost_per_m": 3.00,
        "output_cost_per_m": 15.00,
        "context_window": 200000,
        "max_output_tokens": 8192,
        "latency_estimate_ms": 820,
        "quality_score": 0.97,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": True,
        "priority": 2,
        "is_enabled": True,
        "is_default_baseline": False,
        "pricing_source": "Anthropic Official 2026"
    },
    {
        "id": "claude-3-5-haiku",
        "provider": "anthropic",
        "display_name": "Claude 3.5 Haiku",
        "input_cost_per_m": 0.80,
        "output_cost_per_m": 4.00,
        "context_window": 200000,
        "max_output_tokens": 4096,
        "latency_estimate_ms": 310,
        "quality_score": 0.89,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": False,
        "priority": 5,
        "is_enabled": True,
        "is_default_baseline": False,
        "pricing_source": "Anthropic Official 2026"
    },
    {
        "id": "gemini-1.5-flash",
        "provider": "google",
        "display_name": "Gemini 1.5 Flash",
        "input_cost_per_m": 0.075,
        "output_cost_per_m": 0.30,
        "context_window": 1000000,
        "max_output_tokens": 8192,
        "latency_estimate_ms": 230,
        "quality_score": 0.87,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": True,
        "priority": 9,
        "is_enabled": True,
        "is_default_baseline": False,
        "pricing_source": "Google Cloud Pricing 2026"
    },
    {
        "id": "gemini-1.5-pro",
        "provider": "google",
        "display_name": "Gemini 1.5 Pro",
        "input_cost_per_m": 1.25,
        "output_cost_per_m": 5.00,
        "context_window": 2000000,
        "max_output_tokens": 8192,
        "latency_estimate_ms": 710,
        "quality_score": 0.95,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": True,
        "priority": 3,
        "is_enabled": True,
        "is_default_baseline": False,
        "pricing_source": "Google Cloud Pricing 2026"
    },
    {
        "id": "llama-3.3-70b-versatile",
        "provider": "groq",
        "display_name": "Llama 3.3 70B (Groq LPU)",
        "input_cost_per_m": 0.59,
        "output_cost_per_m": 0.79,
        "context_window": 128000,
        "max_output_tokens": 8192,
        "latency_estimate_ms": 150,
        "quality_score": 0.91,
        "supports_json": True,
        "supports_tools": True,
        "supports_vision": False,
        "priority": 10,
        "is_enabled": True,
        "is_default_baseline": False,
        "pricing_source": "Groq Official Pricing 2026"
    }
]

INITIAL_RULES = [
    {
        "id": "rule_json_schema",
        "name": "JSON Schema & Syntax Validity",
        "description": "Verifies output is well-formed parseable JSON without trailing commas or syntax defects",
        "rule_type": "json_schema",
        "parameters_json": json.dumps({"schema_type": "strict_json"}),
        "severity": "retry_then_escalate",
        "pass_count": 412,
        "fail_count": 14
    },
    {
        "id": "rule_required_fields",
        "name": "Required JSON Keys Integrity",
        "description": "Validates that essential application payload keys (e.g. status, classification) are present",
        "rule_type": "required_fields",
        "parameters_json": json.dumps({"required_keys": ["status", "summary"]}),
        "severity": "fail",
        "pass_count": 395,
        "fail_count": 8
    },
    {
        "id": "rule_zero_refusal",
        "name": "Zero-Refusal / Task Fulfillability",
        "description": "Detects evasive generic model refusal phrases like 'As an AI language model I cannot'",
        "rule_type": "no_refusal",
        "parameters_json": json.dumps({"sensitivity": "high"}),
        "severity": "retry_then_escalate",
        "pass_count": 420,
        "fail_count": 2
    },
    {
        "id": "rule_min_length",
        "name": "Minimum Length Non-Empty",
        "description": "Ensures model completions provide substantial substance (> 10 characters)",
        "rule_type": "min_length",
        "parameters_json": json.dumps({"min_chars": 10}),
        "severity": "fail",
        "pass_count": 426,
        "fail_count": 0
    }
]

SAMPLE_PROMPTS = [
    ("Classify inbound customer ticket #8491 regarding enterprise SSO timeout", "gpt-4o-mini", 240, 180, 0.00014, 0.0024, 94.2, False, "success"),
    ("Extract vendor invoice fields: invoice_number, total_amount, line_items, tax_id", "gemini-1.5-flash", 620, 310, 0.00013, 0.0046, 97.2, False, "success"),
    ("Classify inbound customer ticket #8491 regarding enterprise SSO timeout", "gpt-4o-mini", 240, 180, 0.00002, 0.0024, 99.1, True, "cached"),
    ("Write a fast SQL migration for adding compound indices to event_logs table", "llama-3.3-70b-versatile", 410, 290, 0.00047, 0.0039, 87.9, False, "success"),
    ("Summarize quarterly SOC-2 compliance audit summary for executive board", "gpt-4o-mini", 1240, 480, 0.00047, 0.0079, 94.0, False, "success"),
    ("Translate user onboarding instructions to Spanish and German", "gemini-1.5-flash", 350, 410, 0.00014, 0.0049, 97.1, False, "success"),
    ("Parse JSON user claims and verify cryptographic token expiry timestamp", "llama-3.3-70b-versatile", 510, 220, 0.00047, 0.0034, 86.2, False, "success"),
    ("Summarize quarterly SOC-2 compliance audit summary for executive board", "gpt-4o-mini", 1240, 480, 0.00002, 0.0079, 99.7, True, "cached"),
    ("Analyze high-volume API gateway error logs during burst traffic", "claude-3-5-haiku", 890, 380, 0.00223, 0.0060, 62.8, False, "success"),
    ("Extract vendor invoice fields: invoice_number, total_amount, line_items, tax_id", "gemini-1.5-flash", 620, 310, 0.00002, 0.0046, 99.6, True, "cached"),
    ("Complex contract legal ambiguity analysis with multi-clause liability", "gpt-4o", 1850, 920, 0.01382, 0.01382, 0.0, False, "success"),
    ("Format unstructured log trace into JSON schema with severity & timestamp", "gpt-4o-mini", 480, 210, 0.00019, 0.0033, 94.2, False, "success"),
    ("Generate unit tests in pytest for asynchronous token rate limiter", "llama-3.3-70b-versatile", 720, 440, 0.00077, 0.0062, 87.6, False, "success"),
    ("Analyze sentiment and intent from customer feedback survey #1029", "gpt-4o-mini", 310, 140, 0.00013, 0.0021, 93.8, False, "success"),
    ("Classify inbound customer ticket #8491 regarding enterprise SSO timeout", "gpt-4o-mini", 240, 180, 0.00002, 0.0024, 99.1, True, "cached")
]

async def seed_initial_data(db: AsyncSession):
    # Check if models already exist
    models_count = (await db.execute(select(func.count(ModelConfig.id)))).scalar() or 0
    if models_count == 0:
        for m_data in INITIAL_MODELS:
            db.add(ModelConfig(**m_data))
        await db.commit()

    # Check if evaluation rules exist
    rules_count = (await db.execute(select(func.count(EvaluationRule.id)))).scalar() or 0
    if rules_count == 0:
        for r_data in INITIAL_RULES:
            db.add(EvaluationRule(**r_data))
        await db.commit()

    # Check if demonstration request logs exist
    logs_count = (await db.execute(select(func.count(RequestLog.id)))).scalar() or 0
    if logs_count == 0:
        now = datetime.datetime.utcnow()
        for idx, (prompt, model, p_tokens, c_tokens, act_cost, base_cost, sav_pct, is_c, status) in enumerate(SAMPLE_PROMPTS):
            created = now - datetime.timedelta(hours=random.randint(1, 140))
            req_id = f"req_demo_{1000 + idx}"
            saved_usd = round(base_cost - act_cost, 6)

            req = RequestLog(
                id=req_id,
                workspace_id="ws_default",
                created_at=created,
                prompt_preview=prompt,
                system_instruction="You are a helpful AI assistant running behind AIValueGuard.",
                temperature=0.7,
                model_selected=model,
                baseline_model="gpt-4o",
                provider="cache" if is_c else ("openai" if "gpt" in model else ("anthropic" if "claude" in model else ("google" if "gemini" in model else "groq"))),
                prompt_tokens=p_tokens,
                completion_tokens=c_tokens,
                total_tokens=p_tokens + c_tokens,
                raw_context_tokens=int(p_tokens * 1.25),
                optimized_context_tokens=p_tokens,
                tokens_saved_context=int(p_tokens * 0.25),
                latency_ms=12.0 if is_c else (180.0 if "mini" in model or "flash" in model or "llama" in model else 750.0),
                ttft_ms=5.0 if is_c else 85.0,
                actual_cost_usd=act_cost,
                baseline_cost_usd=base_cost,
                saved_cost_usd=saved_usd,
                savings_percentage=sav_pct,
                optimization_overhead_usd=0.00002,
                is_cached=is_c,
                cache_type="exact" if is_c else "none",
                quality_passed=True,
                quality_checks_run=3,
                quality_details_json="[]",
                routing_reason="Cached response" if is_c else f"Selected '{model}' to optimize cost by {sav_pct}% while maintaining quality score >= 0.85",
                routing_decision_json="{}",
                fallbacks_used_json="[]",
                status=status,
                is_demo=True
            )
            db.add(req)

            # Seed Cache Entry if cached
            if is_c:
                cache_key = f"demo_cache_key_{idx}"
                cache_entry = CacheEntry(
                    cache_key=cache_key,
                    workspace_id="ws_default",
                    model=model,
                    prompt_hash=f"hash_{idx}",
                    prompt_preview=prompt,
                    response_content=f"Demonstration cached response for: '{prompt}'. Served with zero provider API invocation.",
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    cost_saved_per_hit=saved_usd,
                    hit_count=3,
                    created_at=created,
                    last_hit_at=now,
                    expires_at=now + datetime.timedelta(days=7),
                    is_active=True
                )
                db.add(cache_entry)

        await db.commit()
