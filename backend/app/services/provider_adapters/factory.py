from typing import Optional
from backend.app.services.provider_adapters.base import BaseProviderAdapter
from backend.app.services.provider_adapters.demo_adapter import DemoProviderAdapter
from backend.app.services.provider_adapters.openai_adapter import OpenAIProviderAdapter
from backend.app.services.provider_adapters.anthropic_adapter import AnthropicProviderAdapter
from backend.app.services.provider_adapters.gemini_adapter import GeminiProviderAdapter
from backend.app.services.provider_adapters.groq_adapter import GroqProviderAdapter
from backend.app.config import settings

class ProviderAdapterFactory:
    @staticmethod
    def get_adapter(
        provider: str,
        is_demo: bool = True,
        override_api_key: Optional[str] = None
    ) -> BaseProviderAdapter:
        # If demo mode is active, use the DemoProviderAdapter
        if is_demo or settings.DEMO_MODE:
            return DemoProviderAdapter()

        provider_clean = (provider or "").lower().strip()
        
        if provider_clean in ["openai"]:
            key = override_api_key or settings.OPENAI_API_KEY
            if not key:
                return DemoProviderAdapter()
            return OpenAIProviderAdapter(api_key=key)

        elif provider_clean in ["anthropic", "claude"]:
            key = override_api_key or settings.ANTHROPIC_API_KEY
            if not key:
                return DemoProviderAdapter()
            return AnthropicProviderAdapter(api_key=key)

        elif provider_clean in ["google", "gemini"]:
            key = override_api_key or settings.GEMINI_API_KEY
            if not key:
                return DemoProviderAdapter()
            return GeminiProviderAdapter(api_key=key)

        elif provider_clean in ["groq", "meta", "llama"]:
            key = override_api_key or settings.GROQ_API_KEY
            if not key:
                return DemoProviderAdapter()
            return GroqProviderAdapter(api_key=key)

        # Fallback to demo adapter for unconfigured or unknown providers
        return DemoProviderAdapter()
