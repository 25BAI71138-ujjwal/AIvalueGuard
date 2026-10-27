from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, Tuple

class BaseProviderAdapter(ABC):
    @abstractmethod
    async def generate(
        self,
        model_id: str,
        prompt: str,
        system_instruction: Optional[str] = None,
        context: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = 1024,
        json_mode: bool = False
    ) -> Tuple[str, int, int, float, Optional[float]]:
        """
        Executes model generation.
        Returns:
            (completion_text, prompt_tokens, completion_tokens, latency_ms, ttft_ms)
        """
        pass
