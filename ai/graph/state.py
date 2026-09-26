from typing import TypedDict, List, Optional, Dict, Any
from ai.models.schemas import (
    Incident,
    TimelineItem,
    Evidence,
    Hypothesis,
    RemediationPlan,
    AuditEvent
)

class IncidentInvestigationState(TypedDict, total=False):
    incident: Incident
    thread_id: str
    status: str
    
    # Coordinator & Timeline
    coordinator_summary: str
    time_window: Dict[str, str]
    investigation_plan: List[str]
    timeline: List[TimelineItem]
    
    # Evidence & Telemetry
    evidence: List[Evidence]
    
    # Hypotheses & Hybrid Reasoning
    hypotheses: List[Hypothesis]
    root_cause: Optional[Hypothesis]
    confidence: float
    
    # Sufficiency Gate & Diagnostics
    sufficiency_checked: bool
    requires_more_data: bool
    missing_signals: List[str]
    diagnostics_iterations: int
    
    # Verification & Remediation
    verification_passed: bool
    verification_report: str
    remediation: Optional[RemediationPlan]
    
    # Human-in-the-loop & Execution
    approval_status: Optional[str] # "PENDING", "APPROVED", "REJECTED"
    execution_result: Optional[Dict[str, Any]]
    
    # Audit Trail
    audit_events: List[AuditEvent]
