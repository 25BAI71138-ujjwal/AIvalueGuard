import pytest
from backend.app.services.cost_calculator import CostCalculator

def test_token_cost_calculation():
    # 1,000 prompt tokens @ $2.50 per 1M = $0.0025
    # 500 completion tokens @ $10.00 per 1M = $0.0050
    cost = CostCalculator.calculate_token_cost(1000, 500, 2.50, 10.00)
    assert cost == 0.0075

def test_savings_formula():
    # Baseline: $0.010, Optimized: $0.002, Overhead: $0.00002
    baseline = 0.010
    optimized = 0.002
    overhead = 0.00002

    saved, pct, total_opt = CostCalculator.calculate_savings(baseline, optimized, overhead)
    
    # Total optimized = 0.002 + 0.00002 = 0.00202
    assert total_opt == 0.00202
    # Saved = 0.010 - 0.00202 = 0.00798
    assert saved == 0.00798
    # Pct = ((0.010 - 0.00202) / 0.010) * 100 = 79.8%
    assert pct == 79.8

def test_zero_baseline_savings():
    saved, pct, total_opt = CostCalculator.calculate_savings(0.0, 0.001)
    assert pct == 0.0
    assert saved == -0.001

def test_cost_with_zero_tokens():
    cost = CostCalculator.calculate_token_cost(0, 0, 5.0, 15.0)
    assert cost == 0.0
