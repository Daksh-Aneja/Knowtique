"""
Knowtique L9 — LLM Router (merged from Extract-OS)

BYOK (Bring Your Own Key) provider-agnostic LLM gateway.
Uses LiteLLM for unified access to 100+ LLM providers.
Supports: OpenAI, Anthropic, Mistral, Groq, Ollama, Azure, Google, Cohere, and more.
"""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class LLMRouter:
    """
    Provider-agnostic LLM gateway — BYOK model.
    Organizations bring their own API keys and choose their models.
    """

    # Model tier routing — hybrid: quality where it matters, open-source where possible
    MODEL_TIERS = {
        "reasoning": "claude-sonnet-4-20250514",         # Tier 1: debates, fairness, blueprints (quality-critical)
        "classification": "groq/llama-3.3-70b-versatile", # Tier 2: intent classification, extraction (open-source via Groq)
        "fast": "groq/llama-3.3-70b-versatile",           # Tier 3: formatting, simple ops (open-source via Groq)
    }

    # Fallback chains — if primary model fails (429/503), try next in chain
    FALLBACK_CHAINS = {
        "reasoning": ["claude-sonnet-4-20250514", "gpt-4o", "groq/llama-3.3-70b-versatile"],
        "classification": ["groq/llama-3.3-70b-versatile", "gpt-4o-mini", "claude-haiku-4-5-20251001"],
        "fast": ["groq/llama-3.3-70b-versatile", "gpt-4o-mini", "claude-haiku-4-5-20251001"],
    }

    MAX_RETRIES = 3
    RETRY_BACKOFF_SECS = [1.0, 3.0, 8.0]  # Exponential-ish backoff

    def __init__(self, api_keys: Optional[dict] = None):
        self.api_keys = api_keys or {}

    async def complete(
        self,
        prompt: str,
        model: str = "gpt-4o-mini",
        model_tier: Optional[str] = None,
        system_prompt: Optional[str] = None,
        temperature: float = 0.0,
        max_tokens: int = 2048,
        tenant_api_keys: Optional[dict] = None,
    ) -> dict | str:
        """
        Send a completion request through LiteLLM with retry + fallback.
        
        If model_tier is provided, it maps to a configured model and returns
        the content string directly (convenience for AEOS services).
        Otherwise returns: {"content": str, "model": str, "usage": {...}}
        """
        import asyncio

        # Resolve model from tier if provided
        return_string = False
        fallback_chain = [model]
        if model_tier:
            model = self.MODEL_TIERS.get(model_tier, model)
            fallback_chain = self.FALLBACK_CHAINS.get(model_tier, [model])
            return_string = True

        last_error = None
        for chain_model in fallback_chain:
            for attempt in range(self.MAX_RETRIES):
                try:
                    result = await self._call_llm(
                        chain_model, prompt, system_prompt, temperature,
                        max_tokens, tenant_api_keys
                    )
                    if return_string:
                        return result["content"]
                    return result
                except ImportError:
                    logger.warning("LiteLLM not installed — LLM routing unavailable")
                    return "" if return_string else {"content": "", "model": model, "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}}
                except Exception as e:
                    last_error = e
                    is_rate_limit = "429" in str(e) or "rate" in str(e).lower()
                    is_server_error = "503" in str(e) or "500" in str(e)
                    if is_rate_limit or is_server_error:
                        wait = self.RETRY_BACKOFF_SECS[min(attempt, len(self.RETRY_BACKOFF_SECS) - 1)]
                        logger.warning(f"[LLM] {chain_model} attempt {attempt+1} failed ({e}), retrying in {wait}s")
                        await asyncio.sleep(wait)
                    else:
                        # Non-retryable error — break to next model in chain
                        logger.error(f"[LLM] {chain_model} non-retryable error: {e}")
                        break
            logger.warning(f"[LLM] Exhausted retries for {chain_model}, trying next fallback")

        logger.error(f"[LLM] All fallback models exhausted. Last error: {last_error}")
        raise last_error or RuntimeError("All LLM fallback models failed")

    async def _call_llm(
        self, model: str, prompt: str, system_prompt: Optional[str],
        temperature: float, max_tokens: int, tenant_api_keys: Optional[dict],
    ) -> dict:
        """Single LLM call — extracted for retry/fallback orchestration."""
        import litellm

        effective_keys = {**self.api_keys, **(tenant_api_keys or {})}

        if "openai" in effective_keys:
            litellm.api_key = effective_keys["openai"]
        if "anthropic" in effective_keys:
            litellm.anthropic_key = effective_keys["anthropic"]

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        api_base = None
        if model.startswith("ollama/"):
            api_base = effective_keys.get("ollama_base_url", "http://localhost:11434")
        elif model.startswith("custom/"):
            api_base = effective_keys.get("custom_base_url")
            model = model.replace("custom/", "")

        response = await litellm.acompletion(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            api_base=api_base,
            api_key=effective_keys.get(self._get_provider(model)),
        )

        return {
            "content": response.choices[0].message.content,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0,
            },
        }

    async def embed(
        self,
        texts: list[str],
        model: str = "text-embedding-3-small",
        tenant_api_keys: Optional[dict] = None,
    ) -> list[list[float]]:
        """Generate embeddings using the configured embedding model."""
        try:
            import litellm
            effective_keys = {**self.api_keys, **(tenant_api_keys or {})}
            if "openai" in effective_keys:
                litellm.api_key = effective_keys["openai"]

            response = await litellm.aembedding(
                model=model,
                input=texts,
                api_key=effective_keys.get(self._get_provider(model)),
            )
            return [item["embedding"] for item in response.data]
        except ImportError:
            logger.warning("LiteLLM not installed — embedding unavailable")
            return [[0.0] * 1536 for _ in texts]
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            raise

    @staticmethod
    def _get_provider(model: str) -> str:
        if model.startswith(("gpt-", "text-embedding", "o1", "o3")): return "openai"
        elif model.startswith(("claude-",)): return "anthropic"
        elif model.startswith(("mistral",)): return "mistral"
        elif model.startswith(("command",)): return "cohere"
        elif model.startswith(("groq/", "llama")): return "groq"
        elif model.startswith("ollama/"): return "ollama"
        return "openai"

    @staticmethod
    def list_supported_providers() -> list[dict]:
        return [
            {"id": "openai", "name": "OpenAI", "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o3-mini"], "requires_key": True},
            {"id": "anthropic", "name": "Anthropic", "models": ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"], "requires_key": True},
            {"id": "mistral", "name": "Mistral AI", "models": ["mistral-large-latest", "mistral-medium", "mistral-small"], "requires_key": True},
            {"id": "groq", "name": "Groq", "models": ["groq/llama-3.3-70b-versatile", "groq/mixtral-8x7b-32768"], "requires_key": True},
            {"id": "cohere", "name": "Cohere", "models": ["command-r-plus", "command-r"], "requires_key": True},
            {"id": "ollama", "name": "Ollama (Self-hosted)", "models": ["ollama/llama3", "ollama/mistral"], "requires_key": False},
            {"id": "custom", "name": "Custom OpenAI-compatible", "models": [], "requires_key": True},
        ]

    @staticmethod
    def list_embedding_models() -> list[dict]:
        return [
            {"id": "text-embedding-3-small", "provider": "openai", "dimensions": 1536},
            {"id": "text-embedding-3-large", "provider": "openai", "dimensions": 3072},
            {"id": "embed-english-v3.0", "provider": "cohere", "dimensions": 1024},
        ]
