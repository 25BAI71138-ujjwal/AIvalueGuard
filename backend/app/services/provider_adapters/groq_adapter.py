import time
import httpx
from typing import Optional, Tuple
from backend.app.services.provider_adapters.base import BaseProviderAdapter
from backend.app.config import settings

class GroqProviderAdapter(BaseProviderAdapter):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY

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
            raise ValueError("Groq API key is not configured. Please supply an API key in Settings or activate Demo Mode.")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})

        user_content = prompt
        if context:
            user_content = f"Context:\n{context}\n\nTask:\n{prompt}"
        messages.append({"role": "user", "content": user_content})

        # Default Groq model if shorthand used
        groq_model = model_id if "llama" in model_id or "mixtral" in model_id else "llama-3.3-70b-versatile"

        payload = {
            "model": groq_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            latency_ms = round((time.perf_counter() - start) * 1000.0, 1)

            if resp.status_code != 200:
                raise RuntimeError(f"Groq API Error ({resp.status_code}): {resp.text[:300]}")

            data = resp.json()
            completion_text = data["choices"][0]["message"]["content"]
            usage = data.get("usage", {})
            prompt_tokens = usage.get("prompt_tokens", int(len(user_content) / 4))
            completion_tokens = usage.get("completion_tokens", int(len(completion_text) / 4))

            return completion_text, prompt_tokens, completion_tokens, latency_ms, None
