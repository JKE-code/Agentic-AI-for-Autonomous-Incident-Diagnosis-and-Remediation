import os
import json
import logging
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai.models.schemas import (
    Incident,
    DiagnosisResponse,
    Hypothesis,
    RemediationPlan,
    TimelineItem,
    Evidence,
    AuditEvent
)
from ai.graph.graph import investigation_graph
from ai.evaluation.evaluator import run_evaluation_suite, load_all_scenarios_and_truth

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai.service")

app = FastAPI(
    title="Incident AI Investigation Engine",
    description="Multi-agent LangGraph investigation service for autonomous incident diagnosis and remediation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCENARIOS_DIR = os.path.join(BASE_DIR, "data", "scenarios")

class DiagnoseRequest(BaseModel):
    model_config = {"extra": "allow"}
    incident_id: Optional[str] = None
    incident: Optional[Incident] = None

class ResumeRequest(BaseModel):
    thread_id: str
    approval: str # "approved" or "rejected"
    action_id: Optional[str] = None

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-investigation-engine",
        "model": os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
    }

@app.get("/scenarios")
def list_scenarios() -> List[Dict[str, Any]]:
    """List available synthetic benchmark incident scenarios."""
    scenarios = []
    if os.path.exists(SCENARIOS_DIR):
        for fname in sorted(os.listdir(SCENARIOS_DIR)):
            if fname.endswith(".json"):
                fpath = os.path.join(SCENARIOS_DIR, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    scenarios.append({
                        "incident_id": data["incident_id"],
                        "title": data["title"],
                        "severity": data["severity"],
                        "services": data["services"],
                        "started_at": data["started_at"]
                    })
    return scenarios

def load_incident_by_id(incident_id: str) -> Incident:
    fpath = os.path.join(SCENARIOS_DIR, f"{incident_id}.json")
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail=f"Scenario {incident_id} not found")
    with open(fpath, "r", encoding="utf-8") as f:
        data = json.load(f)
    return Incident(**data)

@app.post("/diagnose", response_model=DiagnosisResponse)
def diagnose_incident(req: DiagnoseRequest):
    """
    Executes LangGraph investigation pipeline over the incident telemetry.
    Returns standardized DiagnosisResponse adhering to shared contracts.
    """
    # 1. Resolve incident object
    if req.incident:
        incident = req.incident
    elif req.incident_id:
        extra = getattr(req, "__pydantic_extra__", {}) or {}
        if "services" in extra and "logs" in extra:
            try:
                incident = Incident(incident_id=req.incident_id, **extra)
            except Exception:
                incident = load_incident_by_id(req.incident_id)
        else:
            incident = load_incident_by_id(req.incident_id)
    else:
        raise HTTPException(status_code=400, detail="Must provide incident_id or incident body")
        
    logger.info(f"Starting investigation for incident: {incident.incident_id}")
    
    # 2. Invoke LangGraph workflow
    thread_id = f"thread-{incident.incident_id}"
    initial_state = {
        "incident": incident,
        "thread_id": thread_id,
        "diagnostics_iterations": 0
    }
    
    try:
        final_state = investigation_graph.invoke(initial_state)
    except Exception as e:
        logger.error(f"Investigation graph error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")
        
    return DiagnosisResponse(
        incident_id=incident.incident_id,
        status=final_state.get("status", "DIAGNOSIS_COMPLETE"),
        timeline=final_state.get("timeline", []),
        hypotheses=final_state.get("hypotheses", []),
        root_cause=final_state.get("root_cause"),
        evidence=final_state.get("evidence", []),
        remediation=final_state.get("remediation"),
        confidence=final_state.get("confidence", 0.0),
        requires_more_data=final_state.get("requires_more_data", False),
        missing_signals=final_state.get("missing_signals", []),
        audit_events=final_state.get("audit_events", [])
    )

@app.post("/resume")
def resume_workflow(req: ResumeRequest):
    """
    Resumes LangGraph human approval interrupt.
    """
    approved = (req.approval.lower() == "approved" or req.approval.lower() == "approve")
    return {
        "thread_id": req.thread_id,
        "approval": req.approval,
        "status": "PROCEEDING_TO_SANDBOX" if approved else "REMEDIATION_REJECTED",
        "action_id": req.action_id,
        "message": f"Action execution {'approved by operator' if approved else 'rejected by operator'}"
    }

@app.post("/evaluate")
def run_evaluation():
    """
    Executes benchmark comparison of Agentic System vs. Rules Baseline on 6 scenarios.
    """
    return run_evaluation_suite()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.service:app", host="0.0.0.0", port=8001, reload=True)
