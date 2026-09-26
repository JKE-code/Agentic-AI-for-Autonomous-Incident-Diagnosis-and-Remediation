from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

# Shared Core Models matching /shared/contracts

class LogEntry(BaseModel):
    timestamp: str
    service: str
    level: Literal["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]
    message: str
    trace_id: Optional[str] = None
    error_code: Optional[str] = None

class MetricPoint(BaseModel):
    timestamp: str
    service: str
    metric_name: str
    value: float
    unit: str

class TraceSpan(BaseModel):
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    service: str
    operation: str
    duration_ms: float
    status_code: int
    timestamp: str
    error: bool = False
    error_message: Optional[str] = None

class DeploymentEvent(BaseModel):
    deployment_id: str
    service: str
    version: str
    previous_version: Optional[str] = None
    deployed_at: str
    status: Literal["SUCCESS", "FAILED", "ROLLED_BACK"]
    commit_hash: Optional[str] = None
    changelog: Optional[str] = None

class DependencyEdge(BaseModel):
    source: str
    target: str
    type: Literal["sync_http", "async_queue", "database", "cache", "external_api"]
    critical: bool = True

class Incident(BaseModel):
    incident_id: str
    title: str
    severity: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    started_at: str
    services: List[str]
    logs: List[LogEntry] = Field(default_factory=list)
    metrics: List[MetricPoint] = Field(default_factory=list)
    traces: List[TraceSpan] = Field(default_factory=list)
    deployments: List[DeploymentEvent] = Field(default_factory=list)
    dependencies: List[DependencyEdge] = Field(default_factory=list)

class TimelineItem(BaseModel):
    timestamp: str
    source: str
    service: str
    summary: str
    anomaly: bool = False

class Evidence(BaseModel):
    evidence_id: str
    source: Literal["logs", "metrics", "traces", "deployments", "dependencies", "diagnostics"]
    timestamp: str
    service: str
    observation: str
    importance: float = Field(ge=0.0, le=1.0)
    supports: List[str] = Field(default_factory=list)
    contradicts: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    raw_ref: Optional[Dict[str, Any]] = None

class Hypothesis(BaseModel):
    hypothesis_id: str
    cause: str
    root_cause_category: Literal[
        "BAD_DEPLOYMENT",
        "DB_CONNECTION_EXHAUSTION",
        "MEMORY_LEAK",
        "DOWNSTREAM_FAILURE",
        "CPU_SATURATION",
        "NETWORK_LATENCY",
        "UNKNOWN"
    ]
    service: str
    score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)
    tests: List[str] = Field(default_factory=list)
    status: Literal["PROPOSED", "TESTING", "VERIFIED", "REJECTED"] = "PROPOSED"
    verification_details: Optional[str] = None

class RemediationVerification(BaseModel):
    metric: str
    threshold: str

class RemediationPlan(BaseModel):
    action_id: str
    action: Literal[
        "restart_service",
        "rollback_deployment",
        "scale_service",
        "clear_cache",
        "disable_dependency"
    ]
    service: str
    current_version: Optional[str] = None
    target_version: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    risk: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    reversible: bool = True
    expected_effect: str
    verification: RemediationVerification
    requires_approval: bool = True

class AuditEvent(BaseModel):
    audit_id: str
    incident_id: str
    timestamp: str
    actor: Literal["agent", "human", "system"]
    event: Literal[
        "INCIDENT_CREATED",
        "AGENT_STARTED",
        "EVIDENCE_COLLECTED",
        "HYPOTHESIS_CREATED",
        "HYPOTHESIS_VERIFIED",
        "REMEDIATION_PROPOSED",
        "APPROVAL_REQUESTED",
        "APPROVAL_GRANTED",
        "APPROVAL_REJECTED",
        "ACTION_EXECUTED",
        "HEALTH_CHECK",
        "ROLLBACK_EXECUTED",
        "INCIDENT_RESOLVED"
    ]
    action_id: Optional[str] = None
    details: str
    metadata: Optional[Dict[str, Any]] = None

class DiagnosisResponse(BaseModel):
    incident_id: str
    status: Literal[
        "INVESTIGATING",
        "REQUIRES_DATA",
        "AWAITING_APPROVAL",
        "DIAGNOSIS_COMPLETE",
        "FAILED"
    ]
    timeline: List[TimelineItem] = Field(default_factory=list)
    hypotheses: List[Hypothesis] = Field(default_factory=list)
    root_cause: Optional[Hypothesis] = None
    evidence: List[Evidence] = Field(default_factory=list)
    remediation: Optional[RemediationPlan] = None
    confidence: float = 0.0
    requires_more_data: bool = False
    missing_signals: List[str] = Field(default_factory=list)
    audit_events: List[AuditEvent] = Field(default_factory=list)
