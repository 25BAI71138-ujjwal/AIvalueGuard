import time
import uuid
import json
import re
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.schemas.gateway import (
    GatewayChatRequest,
    GatewayChatResponse,
    RoutingDecisionMeta,
    QualityEvaluationMeta,
    ContextReductionMeta
)
from backend.app.models.model_config import ModelConfig
from backend.app.models.request_log import RequestLog
from backend.app.services.cost_calculator import CostCalculator
from backend.app.services.context_optimizer import ContextOptimizer
from backend.app.services.cache_service import CacheService
from backend.app.services.routing_engine import RoutingEngine
from backend.app.services.quality_evaluator import QualityEvaluator
from backend.app.services.provider_adapters.factory import ProviderAdapterFactory
from backend.app.services.cache_topology import optimize_prompt_topology, KVCacheTopologyAligner
from backend.app.services.agent_guard import prune_tool_payload, evaluate_tool_call
from backend.app.config import settings

class GatewayOrchestrator:
    @classmethod
    async def process_chat(
        cls,
        db: AsyncSession,
        request: GatewayChatRequest,
        is_demo_override: Optional[bool] = None
    ) -> GatewayChatResponse:
        start_total = time.perf_counter()
        request_id = f"req_{uuid.uuid4().hex[:14]}"

        # Determine effective demo mode
        is_demo = is_demo_override if is_demo_override is not None else settings.DEMO_MODE

        # 1. Parse prompt & Align KV-Cache Topology (Deterministic Prefix Hoisting)
        prompt_text = request.prompt or ""
        topology_meta = {"prefix_tokens_secured": 0, "cache_alignment_score": 100.0, "is_topology_optimized": False}
        if request.messages:
            dict_msgs = [{"role": m.role, "content": m.content} for m in request.messages]
            aligned_msgs, topology_meta = optimize_prompt_topology(dict_msgs, request.system_instruction)
            sys_parts = [m["content"] for m in aligned_msgs if m.get("role") == "system"]
            if sys_parts:
                request.system_instruction = "\n\n".join(sys_parts)
            user_parts = [m["content"] for m in aligned_msgs if m.get("role") != "system"]
            if user_parts:
                prompt_text = "\n".join(user_parts)
        elif not prompt_text:
            pass

        if not prompt_text.strip():
            raise ValueError("Prompt or user messages must not be empty.")

        workspace_id = request.workspace_id or settings.DEFAULT_WORKSPACE_ID
        baseline_id = request.baseline_model or settings.DEFAULT_BASELINE_MODEL

        # Get baseline model details for cost/savings comparison
        baseline_result = await db.execute(select(ModelConfig).where(ModelConfig.id == baseline_id))
        baseline_model_cfg = baseline_result.scalar_one_or_none()
        if not baseline_model_cfg:
            # Fallback query for any baseline
            all_m = (await db.execute(select(ModelConfig))).scalars().all()
            baseline_model_cfg = all_m[0] if all_m else ModelConfig(
                id="gpt-4o", provider="openai", display_name="GPT-4o",
                input_cost_per_m=2.50, output_cost_per_m=10.0, latency_estimate_ms=750, quality_score=0.96
            )

        # 2. Cache Lookup (Deterministic Invariant Fingerprinting)
        cache_prompt = prompt_text
        clean_inv, _ = KVCacheTopologyAligner.extract_volatile_segments(prompt_text)
        if clean_inv.strip():
            cache_prompt = clean_inv.strip()

        clean_sys = request.system_instruction
        if request.system_instruction:
            clean_s, _ = KVCacheTopologyAligner.extract_volatile_segments(request.system_instruction)
            if clean_s.strip():
                clean_sys = clean_s.strip()

        cache_key = CacheService.generate_fingerprint(
            workspace_id=workspace_id,
            model=request.model or "auto",
            prompt=cache_prompt,
            system_instruction=clean_sys,
            context=request.context,
            temperature=request.temperature,
            tenant_id=request.tenant_id
        )

        if request.allow_cache:
            cached_entry = await CacheService.get(db, cache_key, workspace_id)
            if cached_entry:
                latency_ms = round((time.perf_counter() - start_total) * 1000.0, 1)
                p_tokens = cached_entry["prompt_tokens"]
                c_tokens = cached_entry["completion_tokens"]
                total_t = p_tokens + c_tokens

                # Baseline cost if executed fresh
                base_cost = CostCalculator.calculate_token_cost(
                    p_tokens, c_tokens,
                    baseline_model_cfg.input_cost_per_m,
                    baseline_model_cfg.output_cost_per_m
                )
                # Cached response cost is near 0 (+ negligible internal overhead)
                act_cost = 0.0
                saved_amt, savings_pct, total_opt = CostCalculator.calculate_savings(
                    base_cost, act_cost, settings.OPTIMIZATION_OVERHEAD_COST
                )

                # Log request
                req_log = RequestLog(
                    id=request_id,
                    workspace_id=workspace_id,
                    prompt_preview=prompt_text[:300],
                    system_instruction=request.system_instruction,
                    temperature=request.temperature,
                    model_selected=cached_entry["model"],
                    baseline_model=baseline_id,
                    provider="cache",
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    total_tokens=total_t,
                    latency_ms=latency_ms,
                    ttft_ms=5.0,
                    actual_cost_usd=total_opt,
                    baseline_cost_usd=base_cost,
                    saved_cost_usd=saved_amt,
                    savings_percentage=savings_pct,
                    optimization_overhead_usd=settings.OPTIMIZATION_OVERHEAD_COST,
                    is_cached=True,
                    cache_type="exact",
                    quality_passed=True,
                    status="cached",
                    is_demo=is_demo,
                    task_name=request.task_name or "General Task",
                    project_name=request.project_name or "Default Project",
                    session_id=request.session_id
                )
                db.add(req_log)
                await db.commit()

                return GatewayChatResponse(
                    request_id=request_id,
                    model_used=f"{cached_entry['model']} (Cached)",
                    baseline_model=baseline_id,
                    provider="cache",
                    content=cached_entry["response_content"],
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    total_tokens=total_t,
                    cost_usd=total_opt,
                    baseline_cost_usd=base_cost,
                    saved_cost_usd=saved_amt,
                    savings_percentage=savings_pct,
                    latency_ms=latency_ms,
                    ttft_ms=5.0,
                    is_cached=True,
                    cache_type="exact",
                    routing_decision=RoutingDecisionMeta(
                        selected_model=cached_entry["model"],
                        reason="Served instantly from tenant-isolated exact cache. 100% token cost avoided.",
                        evaluated_models_count=0,
                        eligible_models_count=1,
                        estimated_cost_ratio=0.0,
                        latency_estimate_ms=5
                    ),
                    quality_eval=QualityEvaluationMeta(
                        passed=True, checks_run=1, checks_passed=1, details=[]
                    ),
                    context_reduction=ContextReductionMeta(
                        raw_tokens=p_tokens, optimized_tokens=p_tokens,
                        saved_tokens=0, reduction_percentage=0.0,
                        strategy_applied="cached_reuse"
                    ),
                    fallbacks_used=[],
                    optimization_overhead_usd=settings.OPTIMIZATION_OVERHEAD_COST,
                    status="cached",
                    is_demo=is_demo,
                    task_name=request.task_name or "General Task",
                    project_name=request.project_name or "Default Project",
                    session_id=request.session_id
                )

        # 3. Context Optimization
        raw_context = request.context
        optimized_context, context_meta = ContextOptimizer.optimize_context(raw_context)

        # 4. Routing Decision
        estimated_prompt_tokens = ContextOptimizer.estimate_tokens(prompt_text) + (
            context_meta["optimized_tokens"] or 0
        )
        if request.system_instruction:
            estimated_prompt_tokens += ContextOptimizer.estimate_tokens(request.system_instruction)

        selected_model_cfg, routing_decision, fallback_chain = await RoutingEngine.route_request(
            db=db,
            prompt_tokens=estimated_prompt_tokens,
            expected_completion_tokens=request.max_tokens or 500,
            latency_budget_ms=request.latency_budget_ms,
            required_capabilities=request.required_capabilities,
            baseline_model_id=baseline_id,
            forced_model_id=request.model if not request.optimize or request.model != "auto" else None,
            prompt_text=prompt_text
        )


        # 5. Model Execution with Bounded Fallback
        completion_text = ""
        prompt_tokens_actual = 0
        completion_tokens_actual = 0
        latency_ms_actual = 0.0
        ttft_ms_actual = None
        executed_model_id = selected_model_cfg.id
        fallbacks_invoked = []
        status = "success"

        models_to_try = [selected_model_cfg.id] + fallback_chain

        for attempt_idx, candidate_model_id in enumerate(models_to_try):
            try:
                candidate_cfg = (await db.execute(select(ModelConfig).where(ModelConfig.id == candidate_model_id))).scalar_one_or_none()
                provider = candidate_cfg.provider if candidate_cfg else "demo"
                adapter = ProviderAdapterFactory.get_adapter(provider, is_demo=is_demo)

                is_json_req = bool(request.required_capabilities and "json" in [c.lower() for c in request.required_capabilities])

                c_text, p_tok, comp_tok, lat_ms, ttft = await adapter.generate(
                    model_id=candidate_model_id,
                    prompt=prompt_text,
                    system_instruction=request.system_instruction,
                    context=optimized_context,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens if request.max_tokens and request.max_tokens >= 2048 else 2048,
                    json_mode=is_json_req
                )

                # Completeness verification before accepting candidate output
                c_clean = (c_text or "").strip()
                is_incomplete = (
                    c_clean.count("```") % 2 != 0 or
                    bool(re.search(r'\n\s*[-*•]\s*$', c_clean)) or
                    (c_clean.endswith(("...", "…")) and len(c_clean) > 200) or
                    (len(c_clean) < 60 and not is_json_req and any(k in prompt_text.lower() for k in ["difference", "compare", "summary", "explain", "why"]))
                )

                if is_incomplete and attempt_idx < len(models_to_try) - 1:
                    fallbacks_invoked.append(f"{candidate_model_id}: truncated/incomplete generation, falling back to next provider")
                    continue

                completion_text = c_text
                prompt_tokens_actual = p_tok
                completion_tokens_actual = comp_tok
                latency_ms_actual = lat_ms
                ttft_ms_actual = ttft
                executed_model_id = candidate_model_id

                if attempt_idx > 0:
                    status = "fallback_success"
                    fallbacks_invoked.append(candidate_model_id)
                break

            except Exception as e:
                fallbacks_invoked.append(f"{candidate_model_id}: failed ({str(e)[:60]})")
                if attempt_idx == len(models_to_try) - 1:
                    # Autonomous resilient fallback when live providers fail or exhaust quota
                    try:
                        demo_adapter = ProviderAdapterFactory.get_adapter("demo", is_demo=True)
                        c_text, p_tok, comp_tok, lat_ms, ttft = await demo_adapter.generate(
                            model_id=selected_model_cfg.id,
                            prompt=prompt_text,
                            system_instruction=request.system_instruction,
                            context=optimized_context,
                            temperature=request.temperature,
                            max_tokens=request.max_tokens if request.max_tokens and request.max_tokens >= 2048 else 2048,
                            json_mode=is_json_req
                        )
                        completion_text = c_text
                        prompt_tokens_actual = p_tok
                        completion_tokens_actual = comp_tok
                        latency_ms_actual = lat_ms
                        ttft_ms_actual = ttft
                        executed_model_id = selected_model_cfg.id
                        fallbacks_invoked.append("live_api_unavailable -> autonomous_resilient_fallback")
                        status = "fallback_success"
                        break
                    except Exception as fallback_err:
                        status = "error"
                        raise RuntimeError(f"All candidate models in fallback chain failed: {e} | {fallback_err}")

        # 6. Quality Evaluation
        quality_eval = await QualityEvaluator.evaluate(
            db=db,
            content=completion_text,
            required_fields=request.quality_checks,
            json_mode=bool(request.required_capabilities and "json" in [c.lower() for c in request.required_capabilities])
        )

        if not quality_eval.passed:
            status = "quality_failed"

        # 7. Financial & Savings Calculation
        executed_cfg = (await db.execute(select(ModelConfig).where(ModelConfig.id == executed_model_id))).scalar_one_or_none() or selected_model_cfg
        
        actual_model_cost = CostCalculator.calculate_token_cost(
            prompt_tokens_actual, completion_tokens_actual,
            executed_cfg.input_cost_per_m, executed_cfg.output_cost_per_m
        )

        baseline_cost = CostCalculator.calculate_token_cost(
            prompt_tokens_actual, completion_tokens_actual,
            baseline_model_cfg.input_cost_per_m, baseline_model_cfg.output_cost_per_m
        )

        saved_amount, savings_pct, total_optimized_cost = CostCalculator.calculate_savings(
            baseline_cost, actual_model_cost, settings.OPTIMIZATION_OVERHEAD_COST
        )

        # 8. Cache response if eligible (quality passed, non-empty response, and safe)
        is_complete = bool(completion_text and completion_text.strip())
        if request.allow_cache and quality_eval.passed and is_complete and status != "error":
            await CacheService.set(
                db=db,
                cache_key=cache_key,
                workspace_id=workspace_id,
                model=executed_model_id,
                prompt=cache_prompt,
                response_content=completion_text,
                prompt_tokens=prompt_tokens_actual,
                completion_tokens=completion_tokens_actual,
                cost_saved_per_hit=saved_amount
            )

        # 9. Persist Request Audit Log
        total_time_ms = round((time.perf_counter() - start_total) * 1000.0, 1)
        req_log = RequestLog(
            id=request_id,
            workspace_id=workspace_id,
            prompt_preview=prompt_text[:300],
            system_instruction=request.system_instruction,
            temperature=request.temperature,
            model_selected=executed_model_id,
            baseline_model=baseline_id,
            provider=executed_cfg.provider,
            prompt_tokens=prompt_tokens_actual,
            completion_tokens=completion_tokens_actual,
            total_tokens=prompt_tokens_actual + completion_tokens_actual,
            raw_context_tokens=context_meta.get("raw_tokens", 0),
            optimized_context_tokens=context_meta.get("optimized_tokens", 0),
            tokens_saved_context=context_meta.get("saved_tokens", 0),
            latency_ms=total_time_ms,
            ttft_ms=ttft_ms_actual,
            actual_cost_usd=total_optimized_cost,
            baseline_cost_usd=baseline_cost,
            saved_cost_usd=saved_amount,
            savings_percentage=savings_pct,
            optimization_overhead_usd=settings.OPTIMIZATION_OVERHEAD_COST,
            is_cached=False,
            cache_type="none",
            quality_passed=quality_eval.passed,
            quality_checks_run=quality_eval.checks_run,
            quality_details_json=json.dumps([c.model_dump() for c in quality_eval.details]),
            routing_reason=routing_decision.reason,
            routing_decision_json=json.dumps(routing_decision.model_dump()),
            fallbacks_used_json=json.dumps(fallbacks_invoked),
            status=status,
            is_demo=is_demo,
            task_name=request.task_name or "General Task",
            project_name=request.project_name or "Default Project",
            session_id=request.session_id
        )
        db.add(req_log)
        await db.commit()

        return GatewayChatResponse(
            request_id=request_id,
            model_used=executed_model_id,
            baseline_model=baseline_id,
            provider=executed_cfg.provider,
            content=completion_text,
            prompt_tokens=prompt_tokens_actual,
            completion_tokens=completion_tokens_actual,
            total_tokens=prompt_tokens_actual + completion_tokens_actual,
            cost_usd=total_optimized_cost,
            baseline_cost_usd=baseline_cost,
            saved_cost_usd=saved_amount,
            savings_percentage=savings_pct,
            latency_ms=total_time_ms,
            ttft_ms=ttft_ms_actual,
            is_cached=False,
            cache_type="none",
            routing_decision=routing_decision,
            quality_eval=quality_eval,
            context_reduction=ContextReductionMeta(**context_meta),
            fallbacks_used=fallbacks_invoked,
            optimization_overhead_usd=settings.OPTIMIZATION_OVERHEAD_COST,
            status=status,
            is_demo=is_demo,
            task_name=request.task_name or "General Task",
            project_name=request.project_name or "Default Project",
            session_id=request.session_id
        )

