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
        forced_model_id: Optional[str] = None
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
                reason="All economical models filtered out by tight constraints; defaulted to high-tier baseline",
                evaluated_models_count=len(all_models),
                eligible_models_count=0,
                estimated_cost_ratio=1.0,
                latency_estimate_ms=fallback_choice.latency_estimate_ms
            )
            return fallback_choice, decision, []

        # Step 4: Rank eligible models
        # Calculate composite score: 60% cost efficiency, 20% latency, 20% quality
        max_cost = max((m.input_cost_per_m + m.output_cost_per_m) for m in eligible_models) or 1.0
        max_latency = max(m.latency_estimate_ms for m in eligible_models) or 1.0

        scored_models: List[Tuple[float, ModelConfig]] = []
        for m in eligible_models:
            cost_norm = (m.input_cost_per_m + m.output_cost_per_m) / max_cost
            latency_norm = m.latency_estimate_ms / max_latency

            # Higher is better: 1 - cost_norm means cheaper gets higher score
            score = (
                (1.0 - cost_norm) * 0.60 +
                (1.0 - latency_norm) * 0.20 +
                m.quality_score * 0.20 +
                (m.priority * 0.05)
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

        if selected_model.id == baseline_model.id:
            reason = f"Baseline '{selected_model.id}' is already the optimal fit for the required quality threshold ({selected_model.quality_score})."
        else:
            reason = (
                f"Routed to '{selected_model.id}' (Provider: {selected_model.provider.capitalize()}) "
                f"satisfying all required capabilities with {savings_ratio}% estimated cost reduction vs {baseline_model.id} "
                f"and expected latency of {selected_model.latency_estimate_ms}ms."
            )

        # Build bounded fallback list (next top scored models up to 2)
        fallbacks = [m.id for score, m in scored_models if m.id != selected_model.id][:2]
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
