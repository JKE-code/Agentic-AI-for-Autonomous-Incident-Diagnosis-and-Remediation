import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("ai.llm")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: str = GEMINI_MODEL):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model
        self.client = None
        
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Initialized Gemini client with model {self.model}")
            except Exception as e:
                logger.warning(f"Failed to initialize google-genai Client: {e}. Falling back to hybrid heuristic engine.")
        else:
            logger.info("No GEMINI_API_KEY found; operating in high-fidelity deterministic reasoning fallback mode.")

    def is_available(self) -> bool:
        return self.client is not None

    def generate_json(self, prompt: str, system_instruction: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Call Gemini requesting structured JSON output with error handling."""
        if not self.is_available():
            return None
            
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1
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
            return json.loads(text.strip())
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
