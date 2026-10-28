import pytest
from backend.app.services.cache_service import CacheService
from backend.app.services.quality_evaluator import QualityEvaluator
from backend.app.database import engine, Base, AsyncSessionLocal

def test_cache_fingerprint_isolation():
    key_workspace_a = CacheService.generate_fingerprint("ws_a", "gpt-4o", "Analyze this financial data", temperature=0.7)
    key_workspace_b = CacheService.generate_fingerprint("ws_b", "gpt-4o", "Analyze this financial data", temperature=0.7)
    
    # Different workspaces must generate distinct fingerprints (tenant isolation)
    assert key_workspace_a != key_workspace_b

def test_cache_fingerprint_temperature_sensitivity():
    key_temp_0 = CacheService.generate_fingerprint("ws_a", "gpt-4o", "Hello", temperature=0.0)
    key_temp_1 = CacheService.generate_fingerprint("ws_a", "gpt-4o", "Hello", temperature=1.0)
    
    assert key_temp_0 != key_temp_1

@pytest.mark.asyncio
async def test_quality_evaluator_json_validation():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Valid JSON
        valid_json = '{"status": "success", "summary": "Task complete", "confidence": 0.99}'
        res = await QualityEvaluator.evaluate(session, valid_json, required_fields=["status", "summary"], json_mode=True)
        assert res.passed is True
        assert res.checks_passed == res.checks_run

        # Invalid JSON
        invalid_json = '{"status": "broken", summary: invalid_json}'
        res_fail = await QualityEvaluator.evaluate(session, invalid_json, json_mode=True)
        assert res_fail.passed is False

        # Refusal check
        refusal_content = "I apologize, but as an AI language model I cannot assist with this."
        res_refusal = await QualityEvaluator.evaluate(session, refusal_content)
        assert res_refusal.passed is False

@pytest.mark.asyncio
async def test_short_completion_caching_and_invalidation():
    async with AsyncSessionLocal() as session:
        cache_key = CacheService.generate_fingerprint("ws_test", "auto", "What is 2+2?", temperature=0.7)
        
        # Test storing short completion (under 80 characters)
        await CacheService.set(
            db=session,
            cache_key=cache_key,
            workspace_id="ws_test",
            model="gemini-1.5-flash",
            prompt="What is 2+2?",
            response_content="The sum of 2 and 2 is 4.",
            prompt_tokens=10,
            completion_tokens=8,
            cost_saved_per_hit=0.0005
        )

        # Retrieve and verify it hits and is not flagged as corrupt
        retrieved = await CacheService.get(session, cache_key, "ws_test")
        assert retrieved is not None
        assert retrieved["response_content"] == "The sum of 2 and 2 is 4."
        assert retrieved["hit_count"] >= 1

        # Test invalidation
        count = await CacheService.invalidate(session, cache_key=cache_key)
        assert count >= 1

        # Verify entry is now inactive
        retrieved_after = await CacheService.get(session, cache_key, "ws_test")
        assert retrieved_after is None
