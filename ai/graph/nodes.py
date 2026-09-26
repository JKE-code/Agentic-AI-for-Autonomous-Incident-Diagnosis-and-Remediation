from datetime import datetime
from typing import Dict, Any, List
from ai.graph.state import IncidentInvestigationState
from ai.models.schemas import AuditEvent, Evidence
from ai.agents.coordinator import coordinate_intake
from ai.agents.timeline_agent import build_incident_timeline
from ai.agents.log_agent import run_log_investigator
from ai.agents.metrics_agent import run_metrics_investigator
from ai.agents.trace_agent import run_trace_investigator
from ai.agents.deployment_agent import run_deployment_investigator
from ai.agents.dependency_agent import run_dependency_investigator
from ai.agents.hypothesis_agent import generate_competing_hypotheses
from ai.agents.verifier_agent import verify_leading_hypothesis
from ai.agents.remediation_agent import plan_remediation
from ai.reasoning.evidence import EvidenceAggregator
from ai.reasoning.scorer import rank_and_normalize_hypotheses
from ai.reasoning.confidence import evaluate_evidence_sufficiency
from ai.tools.diagnostics import DiagnosticService

def intake_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    res = coordinate_intake(incident)
    
    return {
        "status": "INVESTIGATING",
        "coordinator_summary": res["summary"],
        "investigation_plan": res["investigation_plan"],
        "time_window": res["time_window"],
        "audit_events": state.get("audit_events", []) + res["audit_events"],
        "diagnostics_iterations": 0
    }

def timeline_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    timeline = build_incident_timeline(incident)
    return {"timeline": timeline}

def investigators_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    aggregator = EvidenceAggregator()
    
    # Run specialized investigators
    run_log_investigator(incident, aggregator)
    run_metrics_investigator(incident, aggregator)
    run_trace_investigator(incident, aggregator)
    run_deployment_investigator(incident, aggregator)
    run_dependency_investigator(incident, aggregator)
    
    audit_ev = AuditEvent(
        audit_id=f"AUD-{len(state.get('audit_events', [])) + 1:03d}",
        incident_id=incident.incident_id,
        timestamp=incident.started_at,
        actor="agent",
        event="EVIDENCE_COLLECTED",
        details=f"Parallel investigator agents extracted {len(aggregator.items)} structured evidence items"
    )
    
    return {
        "evidence": aggregator.items,
        "audit_events": state.get("audit_events", []) + [audit_ev]
    }

def hypothesis_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    evidence = state["evidence"]
    
    hypotheses = generate_competing_hypotheses(incident, evidence)
    
    # Link evidence supports/contradicts
    aggregator = EvidenceAggregator()
    aggregator.items = evidence
    aggregator.link_hypotheses(hypotheses)
    
    audit_ev = AuditEvent(
        audit_id=f"AUD-{len(state.get('audit_events', [])) + 1:03d}",
        incident_id=incident.incident_id,
        timestamp=incident.started_at,
        actor="agent",
        event="HYPOTHESIS_CREATED",
        details=f"Formulated {len(hypotheses)} competing root-cause hypotheses"
    )
    
    return {
        "evidence": aggregator.items,
        "hypotheses": hypotheses,
        "audit_events": state.get("audit_events", []) + [audit_ev]
    }

def ranking_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    evidence = state["evidence"]
    hypotheses = state["hypotheses"]
    
    ranked = rank_and_normalize_hypotheses(hypotheses, incident, evidence)
    is_sufficient, missing_reasons = evaluate_evidence_sufficiency(ranked, evidence)
    
    top_hyp = ranked[0] if ranked else None
    confidence = top_hyp.confidence if top_hyp else 0.0
    
    return {
        "hypotheses": ranked,
        "root_cause": top_hyp,
        "confidence": confidence,
        "sufficiency_checked": True,
        "requires_more_data": not is_sufficient,
        "missing_signals": missing_reasons
    }

def diagnostic_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    """Active diagnostic data query when evidence sufficiency gate triggers."""
    incident = state["incident"]
    evidence = list(state.get("evidence", []))
    diag = DiagnosticService(incident)
    
    # Pull supplemental diagnostics
    svc = incident.services[0] if incident.services else "system"
    health = diag.get_service_health(svc)
    
    ev_id = f"E-{len(evidence) + 1:03d}"
    diag_ev = Evidence(
        evidence_id=ev_id,
        source="diagnostics",
        timestamp=incident.started_at,
        service=svc,
        observation=f"Targeted diagnostic probe: Service {svc} reported status {health['status']} across {health['active_metrics_count']} active metric probes.",
        importance=0.88,
        supports=[state["root_cause"].hypothesis_id] if state.get("root_cause") else [],
        contradicts=[],
        confidence=0.92,
        raw_ref=health
    )
    evidence.append(diag_ev)
    
    audit_ev = AuditEvent(
        audit_id=f"AUD-{len(state.get('audit_events', [])) + 1:03d}",
        incident_id=incident.incident_id,
        timestamp=incident.started_at,
        actor="agent",
        event="EVIDENCE_COLLECTED",
        details="Diagnostic agent gathered supplemental telemetry to satisfy sufficiency threshold"
    )
    
    return {
        "evidence": evidence,
        "diagnostics_iterations": state.get("diagnostics_iterations", 0) + 1,
        "requires_more_data": False,
        "audit_events": state.get("audit_events", []) + [audit_ev]
    }

def verifier_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    evidence = state["evidence"]
    root_cause = state["root_cause"]
    
    if not root_cause:
        return {"verification_passed": False, "verification_report": "No root cause to verify"}
        
    verified, report = verify_leading_hypothesis(root_cause, incident, evidence)
    
    # Update hypothesis status
    root_cause.status = "VERIFIED" if verified else "REJECTED"
    root_cause.verification_details = report
    
    audit_ev = AuditEvent(
        audit_id=f"AUD-{len(state.get('audit_events', [])) + 1:03d}",
        incident_id=incident.incident_id,
        timestamp=incident.started_at,
        actor="agent",
        event="HYPOTHESIS_VERIFIED",
        details=f"Leading hypothesis {root_cause.hypothesis_id} ({root_cause.root_cause_category}) verified: {verified}"
    )
    
    return {
        "root_cause": root_cause,
        "verification_passed": verified,
        "verification_report": report,
        "audit_events": state.get("audit_events", []) + [audit_ev]
    }

def remediation_node(state: IncidentInvestigationState) -> Dict[str, Any]:
    incident = state["incident"]
    root_cause = state["root_cause"]
    audit_events = list(state.get("audit_events", []))
    
    remediation_plan = None
    if root_cause and root_cause.status == "VERIFIED":
        remediation_plan = plan_remediation(root_cause, incident)
        
    if remediation_plan:
        audit_events.append(AuditEvent(
            audit_id=f"AUD-{len(audit_events) + 1:03d}",
            incident_id=incident.incident_id,
            timestamp=incident.started_at,
            actor="agent",
            event="REMEDIATION_PROPOSED",
            action_id=remediation_plan.action_id,
            details=f"Formulated remediation action: {remediation_plan.action} on {remediation_plan.service}"
        ))
        audit_events.append(AuditEvent(
            audit_id=f"AUD-{len(audit_events) + 1:03d}",
            incident_id=incident.incident_id,
            timestamp=incident.started_at,
            actor="system",
            event="APPROVAL_REQUESTED",
            action_id=remediation_plan.action_id,
            details=f"Human approval required for {remediation_plan.risk} risk remediation {remediation_plan.action_id}"
        ))
        status = "AWAITING_APPROVAL"
    else:
        status = "DIAGNOSIS_COMPLETE"
        
    return {
        "remediation": remediation_plan,
        "status": status,
        "audit_events": audit_events
    }
