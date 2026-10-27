from typing import Dict, Any, Tuple
from backend.app.config import settings

class CostCalculator:
    """
    Computes precise token costs and savings adhering to:
    Savings percentage = ((baseline total cost - optimized total cost) / baseline total cost) * 100
    Includes optimization overhead in optimized total cost.
    If baseline cost is zero, savings percentage is 0.0.
    """

    @staticmethod
    def calculate_token_cost(
        prompt_tokens: int,
        completion_tokens: int,
        input_cost_per_m: float,
        output_cost_per_m: float
    ) -> float:
        """Calculate USD cost for given prompt and completion tokens based on per-1M-token pricing."""
        in_cost = (prompt_tokens / 1_000_000.0) * input_cost_per_m
        out_cost = (completion_tokens / 1_000_000.0) * output_cost_per_m
        return round(in_cost + out_cost, 8)

    @staticmethod
    def calculate_savings(
        baseline_cost: float,
        optimized_cost: float,
        optimization_overhead: float = 0.0
    ) -> Tuple[float, float, float]:
        """
        Returns:
            (saved_amount_usd, savings_percentage, total_optimized_cost_with_overhead)
        """
        total_optimized = round(optimized_cost + optimization_overhead, 8)
        saved_amount = round(baseline_cost - total_optimized, 8)

        if baseline_cost <= 0.0:
            savings_pct = 0.0
        else:
            savings_pct = round(((baseline_cost - total_optimized) / baseline_cost) * 100.0, 2)
            # Clip negative savings if optimized somehow cost more
            savings_pct = max(-100.0, min(100.0, savings_pct))

        return saved_amount, savings_pct, total_optimized
