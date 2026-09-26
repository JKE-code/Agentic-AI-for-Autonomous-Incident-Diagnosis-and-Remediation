import os
import logging
from typing import Dict, Any
import httpx
from backend.mock.ai_mock import get_mock_diagnosis

logger = logging.getLogger("backend.ai_client")

AI_SERVICE_URL = os.environ.get("AI_SERVICE_URL", "http://localhost:8001")

async def request_ai_diagnosis(incident_id: str, incident_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Attempts to call the LangGraph AI service at AI_SERVICE_URL/diagnose.
    If unavailable or timed out, gracefully falls back to the deterministic mock adapter.
    """
    url = f"{AI_SERVICE_URL}/diagnose"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json={"incident_id": incident_id, **incident_payload})
            if resp.status_code == 200:
                logger.info(f"Successfully received diagnosis from AI service for {incident_id}")
                return resp.json()
            else:
                logger.warning(f"AI service returned HTTP {resp.status_code}. Falling back to mock adapter.")
    except Exception as e:
        logger.info(f"AI service not reachable at {url} ({e}). Using built-in mock adapter.")

    # Graceful high-fidelity mock fallback
    return get_mock_diagnosis(incident_id)

async def check_ai_health() -> bool:
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{AI_SERVICE_URL}/health")
            return resp.status_code == 200
    except Exception:
        return False
