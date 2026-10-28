import time
import httpx
from typing import Optional, Tuple
from backend.app.services.provider_adapters.base import BaseProviderAdapter
from backend.app.config import settings

class GeminiProviderAdapter(BaseProviderAdapter):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY

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
            raise ValueError("Google Gemini API key is not configured. Please supply an API key in Settings or activate Demo Mode.")

        user_content = prompt
        if context:
            user_content = f"Context:\n{context}\n\nTask:\n{prompt}"
        if json_mode:
            user_content += "\nRespond strictly in valid JSON format."

        # Candidate models supported by Google Gemini v1beta
        if "pro" in model_id:
            candidate_models = [model_id, "gemini-pro-latest", "gemini-2.5-pro", "gemini-flash-latest"]
        else:
            candidate_models = [model_id, "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite"]

        payload = {
            "contents": [{
                "parts": [{"text": user_content}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens or 1024
            }
        }
        if system_instruction:
            payload["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        start = time.perf_counter()
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = None
            last_err = ""
            for m_ver in candidate_models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_ver}:generateContent?key={self.api_key}"
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        break
                    last_err = f"({m_ver} returned {resp.status_code}): {resp.text[:200]}"
                except Exception as ex:
                    last_err = f"({m_ver} connection error: {str(ex)[:100]})"

            latency_ms = round((time.perf_counter() - start) * 1000.0, 1)

            if not resp or resp.status_code != 200:
                raise RuntimeError(f"Gemini API Error: {last_err}")


            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("Gemini returned empty candidate response")

            parts = candidates[0].get("content", {}).get("parts", [])
            completion_text = "".join(p.get("text", "") for p in parts)
            usage = data.get("usageMetadata", {})
            prompt_tokens = usage.get("promptTokenCount", int(len(user_content) / 4))
            completion_tokens = usage.get("candidatesTokenCount", int(len(completion_text) / 4))

            return completion_text, prompt_tokens, completion_tokens, latency_ms, None
