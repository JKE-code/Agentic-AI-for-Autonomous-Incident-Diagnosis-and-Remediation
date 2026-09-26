from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, Text, DateTime, Integer, JSON
from backend.db.database import Base

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

class IncidentModel(Base):
    __tablename__ = "incidents"

    incident_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    status = Column(String, default="OPEN")  # OPEN, DIAGNOSING, DIAGNOSED, MITIGATING, RESOLVED
    started_at = Column(String, nullable=False)
    services = Column(JSON, default=list)
    logs = Column(JSON, default=list)
    metrics = Column(JSON, default=list)
    traces = Column(JSON, default=list)
    deployments = Column(JSON, default=list)
    dependencies = Column(JSON, default=list)
    created_at = Column(String, default=utc_now_iso)

class EvidenceModel(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True, nullable=False)
    source = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)
    service = Column(String, nullable=False)
    observation = Column(Text, nullable=False)
    importance = Column(Float, default=1.0)
    supports = Column(JSON, default=list)
    contradicts = Column(JSON, default=list)
    confidence = Column(Float, default=0.5)

class HypothesisModel(Base):
    __tablename__ = "hypotheses"

    hypothesis_id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True, nullable=False)
    cause = Column(String, nullable=False)
    service = Column(String, nullable=False)
    score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    supporting_evidence = Column(JSON, default=list)
    contradicting_evidence = Column(JSON, default=list)
    tests = Column(JSON, default=list)
    status = Column(String, default="PENDING")

class RemediationModel(Base):
    __tablename__ = "remediations"

    action_id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)
    service = Column(String, nullable=False)
    current_version = Column(String, nullable=True)
    target_version = Column(String, nullable=True)
    replicas = Column(Integer, nullable=True)
    risk = Column(String, default="MEDIUM")
    reversible = Column(Boolean, default=True)
    expected_effect = Column(Text, nullable=False)
    verification = Column(JSON, default=dict)
    requires_approval = Column(Boolean, default=True)
    status = Column(String, default="PENDING_APPROVAL")  # PENDING_APPROVAL, APPROVED, EXECUTING, SUCCESS, FAILED, ROLLED_BACK
    rollback_plan = Column(Text, nullable=True)
    parameters = Column(JSON, default=dict)
    health_before = Column(JSON, default=dict)
    health_after = Column(JSON, default=dict)
    approved_at = Column(String, nullable=True)
    executed_at = Column(String, nullable=True)
    created_at = Column(String, default=utc_now_iso)

class ApprovalModel(Base):
    __tablename__ = "approvals"

    approval_id = Column(String, primary_key=True, index=True)
    action_id = Column(String, index=True, nullable=False)
    incident_id = Column(String, index=True, nullable=False)
    actor = Column(String, default="human")
    approved = Column(Boolean, default=False)
    reason = Column(Text, nullable=True)
    timestamp = Column(String, default=utc_now_iso)

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    audit_id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, index=True, nullable=False)
    timestamp = Column(String, default=utc_now_iso)
    actor = Column(String, nullable=False)
    event = Column(String, nullable=False)
    action_id = Column(String, nullable=True)
    details = Column(Text, nullable=False)
    extra_metadata = Column(JSON, default=dict)

class EvaluationModel(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, default=utc_now_iso)
    benchmark_name = Column(String, default="Synthetic Incident Benchmark")
    results = Column(JSON, default=dict)
