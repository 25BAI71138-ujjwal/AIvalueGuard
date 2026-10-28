import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] in ["healthy", "degraded"]
        assert data["service"] == "AIValueGuard"

@pytest.mark.asyncio
async def test_models_list_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/models")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 5
        model_ids = [m["id"] for m in data]
        assert "gpt-4o" in model_ids
        assert "gpt-4o-mini" in model_ids

@pytest.mark.asyncio
async def test_analytics_overview_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/analytics/overview?time_range=7d")
        assert resp.status_code == 200
        data = resp.json()
        assert "metrics" in data
        assert "spend_chart" in data
        assert "model_breakdown" in data

@pytest.mark.asyncio
async def test_gateway_chat_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "prompt": "Classify this priority issue: Database timeout on main replica",
            "model": "auto",
            "optimize": True,
            "allow_cache": True
        }
        resp = await client.post("/api/gateway/chat", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "request_id" in data
        assert "content" in data
        assert data["cost_usd"] >= 0.0
        assert data["savings_percentage"] >= 0.0
        assert data["quality_eval"]["passed"] is True

@pytest.mark.asyncio
async def test_playground_compare_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "prompt": "Summarize the customer request",
            "baseline_model": "gpt-4o",
            "optimized_model_mode": "auto"
        }
        resp = await client.post("/api/playground/compare", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "baseline" in data
        assert "optimized" in data
        assert "comparison" in data
        assert data["comparison"]["savings_percentage"] >= 0.0

@pytest.mark.asyncio
async def test_simulate_route_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "prompt_tokens": 400,
            "latency_budget_ms": 350,
            "required_capabilities": ["json"],
            "prompt_text": "Write a python script to process records"
        }
        resp = await client.post("/api/models/simulate-route", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "selected_model" in data
        assert "decision" in data
        assert "fallbacks" in data
        assert data["selected_model"]["supports_json"] is True
        assert data["selected_model"]["latency_estimate_ms"] <= 350

@pytest.mark.asyncio
async def test_gateway_cache_repeat_hit_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "prompt": "Deterministic test query for cache hit verification",
            "model": "auto",
            "optimize": True,
            "allow_cache": True
        }
        # First call: executes & caches
        r1 = await client.post("/api/gateway/chat", json=payload)
        assert r1.status_code == 200
        
        # Second call: must hit cache
        r2 = await client.post("/api/gateway/chat", json=payload)
        assert r2.status_code == 200
        data2 = r2.json()
        assert data2["is_cached"] is True
        assert data2["cache_type"] == "exact"
        assert "(Cached)" in data2["model_used"]
