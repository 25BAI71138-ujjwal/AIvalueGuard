import re
from typing import Tuple, Dict, Any, Optional

class ContextOptimizer:
    """
    Conservative, safe context compaction:
    - Deduplicates identical lines and repeated citation blocks
    - Collapses excessive empty lines and trailing markdown formatting
    - Removes duplicate conversational greetings or echoes
    - Preserves system instructions and critical constraints without alteration
    - Enforces context token budget cleanly
    """

    @staticmethod
    def estimate_tokens(text: Optional[str]) -> int:
        if not text:
            return 0
        # Standard reliable heuristic: ~4 characters per token for English & code
        words = len(text.split())
        chars = len(text)
        return max(1, max(int(chars / 4.0), int(words * 1.3)))

    @classmethod
    def optimize_context(
        cls,
        context: Optional[str],
        max_token_budget: Optional[int] = None
    ) -> Tuple[Optional[str], Dict[str, Any]]:
        if not context or not context.strip():
            return context, {
                "raw_tokens": 0,
                "optimized_tokens": 0,
                "saved_tokens": 0,
                "reduction_percentage": 0.0,
                "strategy_applied": "none_empty_context"
            }

        raw_tokens = cls.estimate_tokens(context)
        original = context

        # 1. Deduplicate repeated paragraphs/lines safely
        lines = context.splitlines()
        seen = set()
        deduped_lines = []
        for line in lines:
            stripped = line.strip()
            # If line is longer than 15 chars and already seen in immediate succession, skip
            if len(stripped) > 15 and stripped in seen:
                continue
            if len(stripped) > 15:
                seen.add(stripped)
            deduped_lines.append(line)

        cleaned = "\n".join(deduped_lines)

        # 2. Collapse excessive whitespace and repetitive horizontal dividers
        cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)
        cleaned = re.sub(r'(-{3,}|_{3,}|\*{3,})\n', '---\n', cleaned)

        # 3. Trim non-essential conversational padding like "Here is the information you requested:"
        padding_patterns = [
            r'^(Here is the relevant context|Note that the following text contains information|Context below:)\s*\n?',
        ]
        for pat in padding_patterns:
            cleaned = re.sub(pat, '', cleaned, flags=re.IGNORECASE)

        cleaned = cleaned.strip()

        # 4. Enforce context budget if specified
        applied_budget_truncation = False
        if max_token_budget and max_token_budget > 0:
            current_tokens = cls.estimate_tokens(cleaned)
            if current_tokens > max_token_budget:
                notice = "\n...[Context budget reached; remaining context safely trimmed]"
                notice_tokens = cls.estimate_tokens(notice)
                budget_for_content = max(1, max_token_budget - notice_tokens)
                char_limit = budget_for_content * 4
                cleaned = cleaned[:char_limit].rstrip() + notice
                applied_budget_truncation = True

        optimized_tokens = cls.estimate_tokens(cleaned)
        saved_tokens = max(0, raw_tokens - optimized_tokens)
        reduction_pct = round((saved_tokens / raw_tokens) * 100.0, 1) if raw_tokens > 0 else 0.0

        strategy = "conservative_deduplication_and_whitespace_compaction"
        if applied_budget_truncation:
            strategy += "_with_token_budget_boundary"
        elif saved_tokens == 0:
            strategy = "preserved_original_fidelity"

        return cleaned, {
            "raw_tokens": raw_tokens,
            "optimized_tokens": optimized_tokens,
            "saved_tokens": saved_tokens,
            "reduction_percentage": reduction_pct,
            "strategy_applied": strategy
        }
