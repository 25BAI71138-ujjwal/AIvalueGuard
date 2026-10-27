import pytest
from backend.app.services.context_optimizer import ContextOptimizer

def test_context_optimizer_deduplication():
    context = (
        "This is an identical repeated statement from the knowledge base.\n"
        "This is an identical repeated statement from the knowledge base.\n"
        "Here is the unique supplementary information needed for the prompt.\n"
    )
    cleaned, meta = ContextOptimizer.optimize_context(context)
    assert meta["raw_tokens"] > meta["optimized_tokens"]
    assert meta["saved_tokens"] > 0
    assert "unique supplementary information" in cleaned

def test_context_optimizer_empty():
    cleaned, meta = ContextOptimizer.optimize_context("")
    assert cleaned == ""
    assert meta["raw_tokens"] == 0

def test_context_budget_enforcement():
    long_context = "Word " * 500
    cleaned, meta = ContextOptimizer.optimize_context(long_context, max_token_budget=50)
    assert meta["optimized_tokens"] <= 60
    assert "Context budget reached" in cleaned
