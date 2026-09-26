import os
import json
import hashlib
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("ai.llm")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

# Cost guard parameters (500 INR budget cap)
MAX_COST_INR = float(os.getenv("MAX_COST_INR", "500.0"))
MAX_CALLS_BUDGET = int(os.getenv("MAX_LLM_CALLS_BUDGET", "500"))

# Approximate Gemini 3.8 Flash pricing per 1K tokens in INR (~$0.075 / 1M input, ~$0.30 / 1M output -> avg ~0.015 INR / 1k tokens)
APPROX_INR_PER_1K_TOKENS = 0.020

class CostTracker:
    def __init__(self, max_cost_inr: float = MAX_COST_INR, max_calls: int = MAX_CALLS_BUDGET):
        self.max_cost_inr = max_cost_inr
        self.max_calls = max_calls
        self.total_calls = 0
        self.estimated_inr_spent = 0.0
        self.cache: Dict[str, Dict[str, Any]] = {}

    def can_call(self) -> bool:
        if self.total_calls >= self.max_calls:
            logger.warning(f"Cost Guard: Reached max call budget ({self.total_calls}/{self.max_calls}). Switching to offline fallback.")
            return False
        if self.estimated_inr_spent >= self.max_cost_inr:
            logger.warning(f"Cost Guard: Reached max budget of ₹{self.max_cost_inr:.2f} (spent ₹{self.estimated_inr_spent:.2f}). Switching to offline fallback.")
            return False
        return True

    def record_call(self, prompt_len_chars: int, response_len_chars: int):
        self.total_calls += 1
        # Approx 4 chars per token
        approx_tokens = (prompt_len_chars + response_len_chars) / 4.0
        cost_incurred = (approx_tokens / 1000.0) * APPROX_INR_PER_1K_TOKENS
        self.estimated_inr_spent += cost_incurred
        logger.info(f"LLM Call #{self.total_calls} executed. Estimated spend so far: ₹{self.estimated_inr_spent:.4f} / ₹{self.max_cost_inr:.2f}")

cost_tracker = CostTracker()

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: str = GEMINI_MODEL):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model = model
        self.client = None
        
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Gemini client with model {self.model} (Cost guard active: cap ₹{MAX_COST_INR})")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai Client: {e}. Falling back to deterministic mode.")
        else:
            logger.info("No GEMINI_API_KEY found; operating in deterministic fallback mode.")

    def is_available(self) -> bool:
        return self.client is not None and cost_tracker.can_call()

    def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Call Gemini requesting structured JSON output with error handling, caching, and cost guard."""
        # 1. Check prompt cache
        cache_key = hashlib.sha256(f"{system_instruction}::{prompt}".encode()).hexdigest()
        if cache_key in cost_tracker.cache:
            logger.info("Returning cached LLM response (₹0.00 incurred).")
            return cost_tracker.cache[cache_key]

        if not self.is_available():
            return None
            
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
                max_output_tokens=800
            )
            if system_instruction:
                config.system_instruction = system_instruction
                
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=config
            )
            
            text = response.text.strip()
            # Clean possible markdown wrapping if any
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            parsed = json.loads(text.strip())
            
            # Record cost and cache
            cost_tracker.record_call(len(prompt), len(text))
            cost_tracker.cache[cache_key] = parsed
            return parsed
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Using deterministic fallback.")
            return None

# Global client singleton
_llm_client: Optional[GeminiClient] = None

def get_llm_client() -> GeminiClient:
    global _llm_client
    if _llm_client is None:
        _llm_client = GeminiClient()
    return _llm_client
