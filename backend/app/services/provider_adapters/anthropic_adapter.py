import time
import httpx
from typing import Optional, Tuple
from backend.app.services.provider_adapters.base import BaseProviderAdapter
from backend.app.config import settings

class AnthropicProviderAdapter(BaseProviderAdapter):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ANTHROPIC_API_KEY

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
        if not self.api_key:
            raise ValueError("Anthropic API key is not configured. Please supply an API key in Settings or activate Demo Mode.")

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }

        user_content = prompt
        if context:
            user_content = f"Context:\n{context}\n\nTask:\n{prompt}"
        if json_mode:
            user_content += "\nRespond strictly in valid JSON format."

        payload = {
            "model": model_id,
            "messages": [{"role": "user", "content": user_content}],
            "max_tokens": max_tokens or 1024,
            "temperature": temperature
        }
        if system_instruction:
            payload["system"] = system_instruction

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
            latency_ms = round((time.perf_counter() - start) * 1000.0, 1)

            if resp.status_code != 200:
                raise RuntimeError(f"Anthropic API Error ({resp.status_code}): {resp.text[:300]}")

            data = resp.json()
            completion_text = "".join(b.get("text", "") for b in data.get("content", []))
            usage = data.get("usage", {})
            prompt_tokens = usage.get("input_tokens", int(len(user_content) / 4))
            completion_tokens = usage.get("output_tokens", int(len(completion_text) / 4))

            return completion_text, prompt_tokens, completion_tokens, latency_ms, None
