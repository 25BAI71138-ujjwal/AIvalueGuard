import pytest
from backend.app.services.routing_engine import RoutingEngine
from backend.app.models.model_config import ModelConfig
from backend.app.database import engine, Base, AsyncSessionLocal
from backend.app.seed import INITIAL_MODELS

@pytest.mark.asyncio
async def test_routing_engine_eligibility_and_ranking():
    # Setup database with models
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Clear & insert initial test models
        for m in INITIAL_MODELS:
            existing = await session.get(ModelConfig, m["id"])
            if not existing:
                session.add(ModelConfig(**m))
        await session.commit()

        # Test 1: Standard classification prompt (low latency, economical)
        # Should select an economical, fast model like gpt-4o-mini or gemini-1.5-flash or llama-3.3-70b
        selected, decision, fallbacks = await RoutingEngine.route_request(
            db=session,
            prompt_tokens=250,
            expected_completion_tokens=200,
            latency_budget_ms=400,
            required_capabilities=["json"],
            baseline_model_id="gpt-4o"
        )
        assert selected is not None
        assert selected.latency_estimate_ms <= 400
        assert selected.supports_json is True
        assert selected.input_cost_per_m < 2.50 # strictly cheaper than gpt-4o baseline
        assert len(fallbacks) >= 1
        assert "Routed to" in decision.reason

        # Test 2: Multi-modal Vision capability requirement
        # Should filter out models without vision (like claude-3-5-haiku or llama-3.3-70b)
        selected_vision, decision_vision, _ = await RoutingEngine.route_request(
            db=session,
            prompt_tokens=500,
            expected_completion_tokens=500,
            required_capabilities=["vision"],
            baseline_model_id="gpt-4o"
        )
        assert selected_vision.supports_vision is True

        # Test 3: Tight latency budget (e.g. 200ms)
        # Should select ultra-fast models like llama-3.3-70b-versatile or gemini-1.5-flash
        selected_fast, decision_fast, _ = await RoutingEngine.route_request(
            db=session,
            prompt_tokens=100,
            expected_completion_tokens=100,
            latency_budget_ms=250,
            baseline_model_id="gpt-4o"
        )
        assert selected_fast.latency_estimate_ms <= 250
