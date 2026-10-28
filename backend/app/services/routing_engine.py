import re
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.model_config import ModelConfig
from backend.app.schemas.gateway import RoutingDecisionMeta

class RoutingEngine:
    """
    Intelligent, deterministic multi-criteria routing engine.
    Finds the lowest-cost eligible strategy that satisfies latency, context, and quality constraints.
    Supports bounded fallback chains.
    """

    @classmethod
    async def route_request(
        cls,
        db: AsyncSession,
        prompt_tokens: int,
        expected_completion_tokens: int = 500,
        latency_budget_ms: Optional[int] = None,
        required_capabilities: Optional[List[str]] = None,
        min_quality_score: float = 0.70,
        baseline_model_id: str = "gpt-4o",
        forced_model_id: Optional[str] = None,
        prompt_text: Optional[str] = None
    ) -> Tuple[ModelConfig, RoutingDecisionMeta, List[str]]:
        # Fetch all enabled models ordered by priority descending
        stmt = select(ModelConfig).where(ModelConfig.is_enabled == True)
        result = await db.execute(stmt)
        all_models = result.scalars().all()

        if not all_models:
            raise ValueError("No enabled models configured in AIValueGuard database.")

        model_dict = {m.id: m for m in all_models}
        baseline_model = model_dict.get(baseline_model_id) or all_models[0]

        # If user explicitly requested a specific model (not "auto")
        if forced_model_id and forced_model_id != "auto":
            selected = model_dict.get(forced_model_id)
            if not selected:
                selected = baseline_model
            decision = RoutingDecisionMeta(
                selected_model=selected.id,
                reason=f"User explicitly selected model '{selected.id}'",
                evaluated_models_count=len(all_models),
                eligible_models_count=1,
                estimated_cost_ratio=round((selected.input_cost_per_m + selected.output_cost_per_m) / 
                                           max(0.001, baseline_model.input_cost_per_m + baseline_model.output_cost_per_m), 4),
                latency_estimate_ms=selected.latency_estimate_ms
            )
            # Fallback list: next prioritized models
            fallbacks = [m.id for m in all_models if m.id != selected.id][:2]
            return selected, decision, fallbacks

        # Question-Aware Intent Classification (word-boundary matched)
        intent = "general"
        intent_boost: Dict[str, float] = {}

        if prompt_text:
            p_lower = prompt_text.lower()
            code_keywords = [r"\bcode\b", r"\bfunction\b", r"\bpython\b", r"\bscript\b", r"\bsql\b", r"\bbug\b", r"\bfix\b", r"\bregex\b", r"\balgorithm\b", r"\bclass\b", r"\bdef\s+", r"\bimport\s+", r"\bconst\s+", r"\basync\b", r"\bawait\b", r"\bapi\b", r"\bjson\b", r"\bendpoint\b", r"\bquery\b", r"\btypescript\b", r"\bjavascript\b"]
            reasoning_keywords = [r"\bcompare\b", r"\bdifference\b", r"\barchitect\b", r"\bwhy\b", r"\banalyze\b", r"\bevaluate\b", r"\btradeoff\b", r"\bstrategy\b", r"pros and cons", r"\baudit\b", r"\bcritique\b", r"\binvestigate\b", r"\bbenchmark\b"]
            creative_keywords = [r"\bsummarize\b", r"\bsummary\b", r"\btranslate\b", r"\brewrite\b", r"\bdraft\b", r"\bexplain\b", r"\bessay\b", r"\bstory\b", r"\bemail\b", r"\btone\b", r"\bpoem\b", r"\bgreeting\b", r"\bhello\b", r"\bhi\b", r"\boverview\b"]

            if any(re.search(pat, p_lower) for pat in creative_keywords):
                intent = "synthesis"
                intent_boost["gemini-1.5-flash"] = 0.22
                intent_boost["gpt-4o-mini"] = 0.18
                intent_boost["claude-3-5-haiku"] = 0.10
            elif any(re.search(pat, p_lower) for pat in reasoning_keywords):
                intent = "reasoning"
                intent_boost["claude-3-5-sonnet"] = 0.18
                intent_boost["gemini-1.5-pro"] = 0.15
                intent_boost["gpt-4o"] = 0.12
                intent_boost["llama-3.3-70b-versatile"] = 0.10
            elif any(re.search(pat, p_lower) for pat in code_keywords):
                intent = "coding"
                intent_boost["llama-3.3-70b-versatile"] = 0.18
                intent_boost["gpt-4o-mini"] = 0.12
                intent_boost["claude-3-5-sonnet"] = 0.08

        required_caps = [c.lower() for c in (required_capabilities or [])]
        total_needed_tokens = prompt_tokens + expected_completion_tokens

        # Step 3: Filter eligible models
        eligible_models: List[ModelConfig] = []
        filter_reasons: Dict[str, str] = {}

        for m in all_models:
            # 1. Context window constraint
            if m.context_window < total_needed_tokens:
                filter_reasons[m.id] = f"Context limit {m.context_window} < required {total_needed_tokens} tokens"
                continue
            
            # 2. Latency budget constraint
            if latency_budget_ms and m.latency_estimate_ms > latency_budget_ms:
                filter_reasons[m.id] = f"Latency estimate {m.latency_estimate_ms}ms exceeds budget {latency_budget_ms}ms"
                continue

            # 3. Quality threshold constraint
            if m.quality_score < min_quality_score:
                filter_reasons[m.id] = f"Quality score {m.quality_score} below minimum required {min_quality_score}"
                continue

            # 4. Mandatory capabilities
            if "json" in required_caps and not m.supports_json:
                filter_reasons[m.id] = "Model does not support JSON mode"
                continue
            if "tools" in required_caps and not m.supports_tools:
                filter_reasons[m.id] = "Model does not support Tool / Function calling"
                continue
            if "vision" in required_caps and not m.supports_vision:
                filter_reasons[m.id] = "Model does not support multimodal Vision"
                continue

            eligible_models.append(m)

        # If strict filtering excluded everything, fall back gracefully to the baseline model
        if not eligible_models:
            fallback_choice = baseline_model
            decision = RoutingDecisionMeta(
                selected_model=fallback_choice.id,
                reason="All economical models filtered out by constraints; safely defaulted to benchmark baseline",
                evaluated_models_count=len(all_models),
                eligible_models_count=0,
                estimated_cost_ratio=1.0,
                latency_estimate_ms=fallback_choice.latency_estimate_ms
            )
            return fallback_choice, decision, []

        # Step 4: Rank eligible models incorporating question-aware intent boosts
        max_cost = max((m.input_cost_per_m + m.output_cost_per_m) for m in eligible_models) or 1.0
        max_latency = max(m.latency_estimate_ms for m in eligible_models) or 1.0

        scored_models: List[Tuple[float, ModelConfig]] = []
        for m in eligible_models:
            cost_norm = (m.input_cost_per_m + m.output_cost_per_m) / max_cost
            latency_norm = m.latency_estimate_ms / max_latency

            # Balanced multi-criteria score
            score = (
                (1.0 - cost_norm) * 0.45 +
                (1.0 - latency_norm) * 0.20 +
                m.quality_score * 0.20 +
                (m.priority / 10.0) * 0.05 +
                intent_boost.get(m.id, 0.0)
            )
            scored_models.append((score, m))

        # Sort descending by score
        scored_models.sort(key=lambda x: x[0], reverse=True)
        best_score, selected_model = scored_models[0]

        # Calculate comparative savings against baseline
        baseline_combined = baseline_model.input_cost_per_m + baseline_model.output_cost_per_m
        selected_combined = selected_model.input_cost_per_m + selected_model.output_cost_per_m
        cost_ratio = round(selected_combined / max(0.0001, baseline_combined), 4)

        savings_ratio = max(0, round((1.0 - cost_ratio) * 100.0, 1))

        intent_tag = f" ({intent.capitalize()} Intent)" if intent != "general" else ""
        if selected_model.id == baseline_model.id:
            reason = f"Baseline '{selected_model.id}' is the optimal fit for the required quality threshold ({selected_model.quality_score})."
        else:
            reason = (
                f"Routed to '{selected_model.id}' (Provider: {selected_model.provider.capitalize()}){intent_tag} "
                f"satisfying all required capabilities with {savings_ratio}% estimated cost reduction vs {baseline_model.id} "
                f"and expected latency of {selected_model.latency_estimate_ms}ms (Quality Score: {selected_model.quality_score})."
            )

        # Build bounded fallback list (prioritize other live providers)
        fallbacks = [m.id for score, m in scored_models if m.id != selected_model.id][:3]
        if not fallbacks and baseline_model.id != selected_model.id:
            fallbacks = [baseline_model.id]

        decision = RoutingDecisionMeta(
            selected_model=selected_model.id,
            reason=reason,
            evaluated_models_count=len(all_models),
            eligible_models_count=len(eligible_models),
            estimated_cost_ratio=cost_ratio,
            latency_estimate_ms=selected_model.latency_estimate_ms
        )

        return selected_model, decision, fallbacks
