from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ActionEnum(str, Enum):
    restart_service = "restart_service"
    rollback_deployment = "rollback_deployment"
    scale_service = "scale_service"
    clear_cache = "clear_cache"
    disable_dependency = "disable_dependency"

class RiskEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ActorEnum(str, Enum):
    system = "system"
    ai = "ai"
    human = "human"

class AuditEventTypeEnum(str, Enum):
    INCIDENT_CREATED = "INCIDENT_CREATED"
    AGENT_STARTED = "AGENT_STARTED"
    EVIDENCE_COLLECTED = "EVIDENCE_COLLECTED"
    HYPOTHESIS_CREATED = "HYPOTHESIS_CREATED"
    HYPOTHESIS_VERIFIED = "HYPOTHESIS_VERIFIED"
    REMEDIATION_PROPOSED = "REMEDIATION_PROPOSED"
    APPROVAL_REQUESTED = "APPROVAL_REQUESTED"
    APPROVAL_GRANTED = "APPROVAL_GRANTED"
    APPROVAL_REJECTED = "APPROVAL_REJECTED"
    ACTION_EXECUTED = "ACTION_EXECUTED"
    HEALTH_CHECK = "HEALTH_CHECK"
    ROLLBACK_EXECUTED = "ROLLBACK_EXECUTED"
    INCIDENT_RESOLVED = "INCIDENT_RESOLVED"

# Telemetry items
class LogItem(BaseModel):
    timestamp: str
    service: str
    level: str
    message: str

class MetricItem(BaseModel):
    timestamp: str
    service: str
    metric_name: str
    value: float
    unit: str

class TraceItem(BaseModel):
    trace_id: str
    span_id: str
    service: str
    operation: str
    duration_ms: float
    status_code: int

class DeploymentItem(BaseModel):
    timestamp: str
    service: str
    version: str
    commit: str

class DependencyItem(BaseModel):
    caller: str
    callee: str
    type: str

# Incident Schemas
class IncidentBase(BaseModel):
    incident_id: str
    title: str
    severity: SeverityEnum
    started_at: str
    services: List[str]

class IncidentCreate(IncidentBase):
    logs: Optional[List[LogItem]] = Field(default_factory=list)
    metrics: Optional[List[MetricItem]] = Field(default_factory=list)
    traces: Optional[List[TraceItem]] = Field(default_factory=list)
    deployments: Optional[List[DeploymentItem]] = Field(default_factory=list)
    dependencies: Optional[List[DependencyItem]] = Field(default_factory=list)

class IncidentResponse(IncidentBase):
    status: str = "OPEN"
    logs: List[LogItem] = Field(default_factory=list)
    metrics: List[MetricItem] = Field(default_factory=list)
    traces: List[TraceItem] = Field(default_factory=list)
    deployments: List[DeploymentItem] = Field(default_factory=list)
    dependencies: List[DependencyItem] = Field(default_factory=list)

class IncidentSummary(BaseModel):
    incident_id: str
    title: str
    severity: SeverityEnum
    status: str
    started_at: str
    services: List[str]

# Evidence Schema
class EvidenceItem(BaseModel):
    evidence_id: str
    source: str
    timestamp: str
    service: str
    observation: str
    importance: float = Field(ge=0.0, le=1.0)
    supports: List[str] = Field(default_factory=list)
    contradicts: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)

# Hypothesis Schema
class HypothesisItem(BaseModel):
    hypothesis_id: str
    cause: str
    service: str
    score: float = Field(ge=0.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)
    tests: List[str] = Field(default_factory=list)
    status: str = "VERIFIED"

# Remediation & Verification Schema
class VerificationMetric(BaseModel):
    metric: str
    threshold: str

class RemediationAction(BaseModel):
    action_id: str
    action: ActionEnum
    service: str
    current_version: Optional[str] = None
    target_version: Optional[str] = None
    replicas: Optional[int] = None
    risk: RiskEnum
    reversible: bool = True
    expected_effect: str
    verification: VerificationMetric
    requires_approval: bool = True
    status: str = "PENDING_APPROVAL"

class RootCauseInfo(BaseModel):
    hypothesis_id: Optional[str] = None
    cause: Optional[str] = None
    service: Optional[str] = None
    summary: Optional[str] = None

class TimelineEvent(BaseModel):
    timestamp: str
    service: str
    event: str
    source: str

# Diagnosis Response
class DiagnosisResponse(BaseModel):
    incident_id: str
    status: str
    timeline: List[TimelineEvent] = Field(default_factory=list)
    hypotheses: List[HypothesisItem] = Field(default_factory=list)
    root_cause: Optional[RootCauseInfo] = None
    evidence: List[EvidenceItem] = Field(default_factory=list)
    remediation: Optional[RemediationAction] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    requires_more_data: bool = False
    audit_events: List[Dict[str, Any]] = Field(default_factory=list)

# Approval
class ApprovalRequest(BaseModel):
    actor: str = "human"
    reason: Optional[str] = "Operator approved sandbox execution"

class ApprovalResponse(BaseModel):
    action_id: str
    status: str
    approved: bool
    actor: str
    timestamp: str
    message: str

# Execution & Rollback
class ExecutionResult(BaseModel):
    action_id: str
    status: str
    pre_health: Dict[str, Any]
    post_health: Dict[str, Any]
    verified: bool
    message: str
    auto_rollback: bool = False

class RollbackResult(BaseModel):
    action_id: str
    status: str
    post_health: Dict[str, Any]
    message: str

# Audit
class AuditEventItem(BaseModel):
    audit_id: str
    incident_id: str
    timestamp: str
    actor: str
    event: AuditEventTypeEnum
    action_id: Optional[str] = None
    details: str
    metadata: Optional[Dict[str, Any]] = None

# Evaluation
class ScenarioResult(BaseModel):
    scenario_id: str
    title: str
    ground_truth_cause: str
    predicted_cause: str
    top1_correct: bool
    top3_correct: bool
    diagnosis_time_ms: float
    remediation_successful: bool
    confidence: float

class EvaluationMetrics(BaseModel):
    top1_accuracy: float
    top3_accuracy: float
    mttd_seconds: float
    remediation_success_rate: float
    evidence_sufficiency_rate: float
    confidence_calibration_brier: float

class EvaluationResponse(BaseModel):
    benchmark_name: str = "Synthetic Incident Benchmark"
    scenarios_evaluated: int
    agentic_metrics: EvaluationMetrics
    rules_baseline_metrics: EvaluationMetrics
    scenario_breakdown: List[ScenarioResult]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    ai_service_available: bool
