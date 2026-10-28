"""
Agentic Tool-Payload Pruner & Infinite Loop Circuit Breaker
------------------------------------------------------------
Architected for AI Infrastructure & FinOps (Track: PS-08).

Key FinOps Mechanism:
1. Tool Payload Pruner: AI Agents calling database/API tools frequently ingest
   massive raw JSON blobs (10,000+ tokens) full of empty fields, verbose metadata,
   and hundreds of raw rows. Passing these across multi-turn agent conversations
   explodes token costs linearly or quadratically.
   This pruner applies recursive key projection, drops null/empty structures, removes
   redundant headers, and summarizes oversized collections into compact, context-safe representations.

2. Infinite Loop Circuit Breaker: Agents often fall into reasoning thrashing loops,
   calling identical or near-identical tools (e.g. searching the same keyword with minor typos,
   or retrying identical SQL queries). This module maintains a sliding window of recent
   tool invocations, computes structural/semantic argument similarity, trips a circuit breaker
   at >90% thrashing, and injects a deterministic stop interrupt.
"""

import json
import difflib
from typing import Any, Dict, List, Optional, Tuple, Union


class AgentCircuitBreaker:
    """
    Stateful circuit breaker that tracks tool call trajectories and prunes payloads.
    Can be used as a per-session stateful instance or via static evaluation methods.
    """

    # In-memory sliding window history keyed by session_id: List[Dict[str, Any]]
    _SESSION_WINDOWS: Dict[str, List[Dict[str, Any]]] = {}

    # Common non-essential API/DB metadata keys to purge
    PURGE_KEYS = {
        "headers", "request_headers", "response_headers", "request_id", "trace_id",
        "correlation_id", "debug", "debug_info", "server_timing", "_links", "etag",
        "status_code", "http_status", "error_code", "telemetry", "stack_trace"
    }

    # FinOps constants for calculating cost avoided
    BASELINE_INPUT_COST_PER_M = 2.50   # GPT-4o input cost benchmark ($/1M tokens)
    BASELINE_OUTPUT_COST_PER_M = 10.00 # GPT-4o output cost benchmark ($/1M tokens)
    ESTIMATED_RUNAWAY_STEPS = 4        # Typical steps an uninhibited loop wastes before timeout

    @staticmethod
    def estimate_tokens(data: Any) -> int:
        if data is None:
            return 0
        if isinstance(data, (dict, list)):
            text = json.dumps(data, ensure_ascii=False)
        else:
            text = str(data)
        return max(1, int(len(text) / 4.0))

    # =========================================================================
    # 1. TOOL-PAYLOAD PRUNER
    # =========================================================================
    @classmethod
    def prune_tool_payload(
        cls,
        payload: Any,
        max_array_items: int = 5,
        max_string_len: int = 400
    ) -> Tuple[Any, Dict[str, Any]]:
        """
        Recursively projects and compresses tool output payloads:
        - Drops nulls, None, empty strings, and empty objects.
        - Purges useless HTTP/debug headers.
        - Summarizes large collections to `max_array_items` with descriptive headers.
        - Clips giant raw string dumps.
        """
        raw_tokens = cls.estimate_tokens(payload)

        # Parse stringified JSON if passed as string
        was_json_string = False
        parsed_payload = payload
        if isinstance(payload, str) and payload.strip().startswith(("{", "[")):
            try:
                parsed_payload = json.loads(payload)
                was_json_string = True
            except Exception:
                parsed_payload = payload

        def _clean_node(node: Any) -> Any:
            if node is None:
                return None

            if isinstance(node, dict):
                cleaned = {}
                for k, v in node.items():
                    k_lower = str(k).lower()
                    # Skip common debug/redundant metadata
                    if k_lower in cls.PURGE_KEYS:
                        continue
                    
                    cleaned_val = _clean_node(v)
                    # Drop empty/null values
                    if cleaned_val is None or cleaned_val == "" or cleaned_val == {} or cleaned_val == []:
                        continue
                    cleaned[k] = cleaned_val
                return cleaned if cleaned else None

            elif isinstance(node, list):
                if not node:
                    return None
                cleaned_list = [_clean_node(item) for item in node]
                cleaned_list = [item for item in cleaned_list if item is not None and item != "" and item != {} and item != []]

                if not cleaned_list:
                    return None

                # Array summarization if array exceeds threshold
                if len(cleaned_list) > max_array_items:
                    total_count = len(cleaned_list)
                    sample = cleaned_list[:max_array_items]
                    return {
                        "_summary": f"Array truncated: showing {max_array_items} of {total_count} total records. Remaining {total_count - max_array_items} items omitted to protect agent token budget.",
                        "items": sample
                    }
                return cleaned_list

            elif isinstance(node, str):
                node_clean = node.strip()
                if len(node_clean) > max_string_len:
                    return node_clean[:max_string_len] + f"... [truncated {len(node_clean) - max_string_len} chars]"
                return node_clean

            return node

        pruned_payload = _clean_node(parsed_payload)
        if pruned_payload is None:
            pruned_payload = {"status": "success", "data": "empty"}

        # Return in original format if input was JSON string
        if was_json_string:
            final_output = json.dumps(pruned_payload, indent=2)
        else:
            final_output = pruned_payload

        pruned_tokens = cls.estimate_tokens(final_output)
        saved_tokens = max(0, raw_tokens - pruned_tokens)
        reduction_pct = round((saved_tokens / max(1, raw_tokens)) * 100.0, 1) if raw_tokens > 0 else 0.0

        # Estimated cost avoided based on input token rate
        cost_saved_usd = round((saved_tokens / 1_000_000.0) * cls.BASELINE_INPUT_COST_PER_M, 6)

        telemetry = {
            "raw_tokens": raw_tokens,
            "pruned_tokens": pruned_tokens,
            "pruned_tokens_saved": saved_tokens,
            "reduction_percentage": reduction_pct,
            "estimated_cost_avoided_usd": cost_saved_usd,
            "is_pruned": saved_tokens > 0
        }

        return final_output, telemetry

    # =========================================================================
    # 2. INFINITE LOOP DETECTION & CIRCUIT BREAKER
    # =========================================================================
    @classmethod
    def evaluate_tool_call(
        cls,
        session_id: str,
        tool_name: str,
        tool_args: Union[Dict[str, Any], str],
        history_window: int = 3,
        similarity_threshold: float = 0.90
    ) -> Tuple[bool, Optional[str], Dict[str, Any]]:
        """
        Sliding-window loop detection:
        - Tracks recent tool calls for the given session.
        - Calculates structural & semantic similarity across consecutive arguments.
        - If similarity > 90% (repetitive thrashing), trips the breaker.
        
        Returns:
            (loop_detected: bool, interrupt_message: Optional[str], telemetry: dict)
        """
        session_key = session_id or "default_session"
        if session_key not in cls._SESSION_WINDOWS:
            cls._SESSION_WINDOWS[session_key] = []

        window = cls._SESSION_WINDOWS[session_key]

        # Normalize arguments to comparable string
        if isinstance(tool_args, dict):
            args_str = json.dumps(tool_args, sort_keys=True)
        else:
            args_str = str(tool_args).strip()

        current_call = {
            "tool_name": tool_name.strip().lower(),
            "args_str": args_str,
            "raw_args": tool_args
        }

        loop_detected = False
        highest_similarity = 0.0
        loop_pattern = "none"

        # Check against previous calls in the sliding window
        if len(window) >= 1:
            prev_call = window[-1]

            # Same tool invocation
            if prev_call["tool_name"] == current_call["tool_name"]:
                matcher = difflib.SequenceMatcher(None, prev_call["args_str"], current_call["args_str"])
                highest_similarity = round(matcher.ratio(), 3)

                if highest_similarity >= similarity_threshold:
                    loop_detected = True
                    loop_pattern = "consecutive_thrashing"

            # Check alternating ping-pong loop (A -> B -> A -> B)
            if not loop_detected and len(window) >= 3:
                two_steps_back = window[-2]
                three_steps_back = window[-3]

                if (two_steps_back["tool_name"] == current_call["tool_name"] and
                    three_steps_back["tool_name"] == prev_call["tool_name"]):
                    matcher = difflib.SequenceMatcher(None, two_steps_back["args_str"], current_call["args_str"])
                    ping_pong_sim = matcher.ratio()
                    if ping_pong_sim >= similarity_threshold:
                        loop_detected = True
                        highest_similarity = round(ping_pong_sim, 3)
                        loop_pattern = "alternating_ping_pong"

        # Update sliding window
        window.append(current_call)
        if len(window) > history_window:
            window.pop(0)

        # Generate interrupt message and FinOps avoided cost if tripped
        interrupt_message = None
        estimated_cost_avoided_usd = 0.0
        tokens_avoided = 0

        if loop_detected:
            # FinOps calculation: 4 steps * ~3,500 tokens context per step
            tokens_avoided = cls.ESTIMATED_RUNAWAY_STEPS * 3500
            estimated_cost_avoided_usd = round(
                (tokens_avoided / 1_000_000.0) * cls.BASELINE_INPUT_COST_PER_M +
                ((cls.ESTIMATED_RUNAWAY_STEPS * 500) / 1_000_000.0) * cls.BASELINE_OUTPUT_COST_PER_M,
                4
            )

            interrupt_message = (
                f"⚠️ [CIRCUIT BREAKER ACTIVATED]: Repetitive tool calling loop detected "
                f"({int(highest_similarity * 100)}% argument similarity on tool '{tool_name}'). "
                f"Loop threshold reached. Stop tool calling immediately and synthesize your final answer using only existing information."
            )

        telemetry = {
            "loop_detected": loop_detected,
            "similarity_score": highest_similarity,
            "loop_pattern": loop_pattern,
            "tool_name": tool_name,
            "tokens_avoided": tokens_avoided if loop_detected else 0,
            "estimated_cost_avoided_usd": estimated_cost_avoided_usd,
            "session_id": session_key
        }

        return loop_detected, interrupt_message, telemetry

    @classmethod
    def reset_session(cls, session_id: str):
        """Clears the circuit breaker sliding window for a given session."""
        session_key = session_id or "default_session"
        if session_key in cls._SESSION_WINDOWS:
            del cls._SESSION_WINDOWS[session_key]


# Standalone functional aliases for drop-in usage
def prune_tool_payload(
    payload: Any,
    max_array_items: int = 5,
    max_string_len: int = 400
) -> Tuple[Any, Dict[str, Any]]:
    """Drop-in functional alias for pruning tool outputs."""
    return AgentCircuitBreaker.prune_tool_payload(
        payload=payload,
        max_array_items=max_array_items,
        max_string_len=max_string_len
    )


def evaluate_tool_call(
    session_id: str,
    tool_name: str,
    tool_args: Union[Dict[str, Any], str],
    history_window: int = 3,
    similarity_threshold: float = 0.90
) -> Tuple[bool, Optional[str], Dict[str, Any]]:
    """Drop-in functional alias for checking agent infinite loops."""
    return AgentCircuitBreaker.evaluate_tool_call(
        session_id=session_id,
        tool_name=tool_name,
        tool_args=tool_args,
        history_window=history_window,
        similarity_threshold=similarity_threshold
    )
