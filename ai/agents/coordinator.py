from typing import Dict, Any, List
from ai.models.schemas import Incident, AuditEvent
from ai.models.llm import get_llm_client

def coordinate_intake(incident: Incident) -> Dict[str, Any]:
    """
    Incident intake and orchestration planning.
    Does not jump to conclusions; prepares bounded investigation context.
    """
    llm = get_llm_client()
    
    summary = f"Incident {incident.incident_id}: {incident.title} (Severity: {incident.severity})"
    services = list(incident.services)
    
    # Extract time window from logs & metrics
    timestamps = [l.timestamp for l in incident.logs] + [m.timestamp for m in incident.metrics]
    time_window = {
        "start": min(timestamps) if timestamps else incident.started_at,
        "end": max(timestamps) if timestamps else incident.started_at
    }
    
    plan = [
        "Ingest and align cross-service logs, metrics, traces, and deployment events chronologically.",
        "Dispatch parallel domain investigators (Logs, Metrics, Traces, Deployments, Dependencies).",
        "Synthesize structured evidence items with causal support/contradiction mapping.",
        "Generate 3-5 competing root-cause hypotheses.",
        "Rank hypotheses with hybrid scoring and verify sufficiency threshold.",
        "Execute verification tests on the primary hypothesis and form remediation plan."
    ]
    
    # Optionally enrich with Gemini if available
    if llm.is_available():
        prompt = f"""You are the Incident Coordinator Agent.
Incident: {incident.incident_id}
Title: {incident.title}
Severity: {incident.severity}
Services involved: {', '.join(services)}

Provide a concise 1-2 sentence intake summary and confirm the initial investigation plan.
Output format: {{"intake_summary": "...", "priority_focus": ["..."]}}
"""
        res = llm.generate_json(prompt)
        if res and "intake_summary" in res:
            summary = f"{summary} - {res['intake_summary']}"
            
    audit_events = [
        AuditEvent(
            audit_id="AUD-001",
            incident_id=incident.incident_id,
            timestamp=incident.started_at,
            actor="system",
            event="INCIDENT_CREATED",
            details=f"Incident {incident.incident_id} registered with severity {incident.severity}"
        ),
        AuditEvent(
            audit_id="AUD-002",
            incident_id=incident.incident_id,
            timestamp=incident.started_at,
            actor="agent",
            event="AGENT_STARTED",
            details="Coordinator launched multi-agent investigation workflow"
        )
    ]
    
    return {
        "summary": summary,
        "affected_services": services,
        "time_window": time_window,
        "investigation_plan": plan,
        "audit_events": audit_events
    }
