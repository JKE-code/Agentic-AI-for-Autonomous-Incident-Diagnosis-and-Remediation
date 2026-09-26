from typing import List, Optional
from sqlalchemy.orm import Session
from backend.db.models import IncidentModel, EvidenceModel, HypothesisModel, RemediationModel
from backend.services.audit_service import log_audit_event
from backend.services.ai_client import request_ai_diagnosis
from backend.mock.ai_mock import MOCK_DIAGNOSES

SEED_INCIDENTS = [
    {
        "incident_id": "INC-001",
        "title": "Payment failures and HTTP 500 error spike post-release",
        "severity": "CRITICAL",
        "status": "OPEN",
        "started_at": "2026-09-26T10:41:00Z",
        "services": ["api-gateway", "payment-service", "orders-db"],
        "logs": [
            {"timestamp": "2026-09-26T10:41:00Z", "service": "payment-service", "level": "INFO", "message": "Deployed image payment-service:v1.5"},
            {"timestamp": "2026-09-26T10:42:15Z", "service": "payment-service", "level": "ERROR", "message": "HTTP 500 in PaymentProcessor.execute()"},
            {"timestamp": "2026-09-26T10:43:40Z", "service": "payment-service", "level": "ERROR", "message": "java.lang.NullPointerException at line 84"}
        ],
        "metrics": [
            {"timestamp": "2026-09-26T10:42:15Z", "service": "payment-service", "metric_name": "http_error_rate", "value": 0.187, "unit": "ratio"},
            {"timestamp": "2026-09-26T10:43:00Z", "service": "payment-db", "metric_name": "db_connections", "value": 22.0, "unit": "count"}
        ],
        "traces": [
            {"trace_id": "tr-001-a", "span_id": "sp-01", "service": "payment-service", "operation": "POST /process-payment", "duration_ms": 420.0, "status_code": 500}
        ],
        "deployments": [
            {"timestamp": "2026-09-26T10:41:00Z", "service": "payment-service", "version": "v1.5", "commit": "8f2a1b"}
        ],
        "dependencies": [
            {"caller": "api-gateway", "callee": "payment-service", "type": "HTTP"},
            {"caller": "payment-service", "callee": "payment-db", "type": "POSTGRES"}
        ]
    },
    {
        "incident_id": "INC-002",
        "title": "Database connection pool exhaustion on orders-db",
        "severity": "HIGH",
        "status": "OPEN",
        "started_at": "2026-09-26T11:10:00Z",
        "services": ["order-service", "orders-db"],
        "logs": [
            {"timestamp": "2026-09-26T11:11:30Z", "service": "order-service", "level": "ERROR", "message": "ConnectionPoolTimeoutException: timeout acquiring connection"}
        ],
        "metrics": [
            {"timestamp": "2026-09-26T11:10:00Z", "service": "orders-db", "metric_name": "active_connections", "value": 98.0, "unit": "count"}
        ],
        "traces": [
            {"trace_id": "tr-002-a", "span_id": "sp-02", "service": "order-service", "operation": "POST /orders", "duration_ms": 4800.0, "status_code": 504}
        ],
        "deployments": [],
        "dependencies": [
            {"caller": "order-service", "callee": "orders-db", "type": "POSTGRES"}
        ]
    },
    {
        "incident_id": "INC-003",
        "title": "Container crashloop and OOMKilled in payment-service",
        "severity": "CRITICAL",
        "status": "OPEN",
        "started_at": "2026-09-26T09:00:00Z",
        "services": ["payment-service"],
        "logs": [
            {"timestamp": "2026-09-26T09:48:12Z", "service": "payment-service", "level": "FATAL", "message": "kernel: Out of memory: Killed process payment-service (exit 137)"}
        ],
        "metrics": [
            {"timestamp": "2026-09-26T09:45:00Z", "service": "payment-service", "metric_name": "memory_utilization", "value": 0.99, "unit": "ratio"}
        ],
        "traces": [],
        "deployments": [],
        "dependencies": []
    },
    {
        "incident_id": "INC-004",
        "title": "Cascading timeouts from external payment provider",
        "severity": "HIGH",
        "status": "OPEN",
        "started_at": "2026-09-26T08:15:00Z",
        "services": ["payment-service", "external-payment-provider"],
        "logs": [
            {"timestamp": "2026-09-26T08:17:00Z", "service": "payment-service", "level": "WARN", "message": "GatewayTimeout calling external payment gateway"}
        ],
        "metrics": [],
        "traces": [
            {"trace_id": "tr-004-a", "span_id": "sp-04", "service": "payment-service", "operation": "POST /vendor/charge", "duration_ms": 12000.0, "status_code": 504}
        ],
        "deployments": [],
        "dependencies": [
            {"caller": "payment-service", "callee": "external-payment-provider", "type": "HTTPS"}
        ]
    },
    {
        "incident_id": "INC-005",
        "title": "Order service CPU saturation (97%) and queue backlog",
        "severity": "MEDIUM",
        "status": "OPEN",
        "started_at": "2026-09-26T12:00:00Z",
        "services": ["order-service"],
        "logs": [],
        "metrics": [
            {"timestamp": "2026-09-26T12:00:00Z", "service": "order-service", "metric_name": "cpu_utilization", "value": 0.974, "unit": "ratio"},
            {"timestamp": "2026-09-26T12:01:10Z", "service": "order-service", "metric_name": "pending_queue_size", "value": 4200.0, "unit": "count"}
        ],
        "traces": [],
        "deployments": [],
        "dependencies": []
    },
    {
        "incident_id": "INC-006",
        "title": "Inter-service network latency spike to inventory-service",
        "severity": "LOW",
        "status": "OPEN",
        "started_at": "2026-09-26T07:20:00Z",
        "services": ["api-gateway", "inventory-service"],
        "logs": [
            {"timestamp": "2026-09-26T07:21:00Z", "service": "api-gateway", "level": "WARN", "message": "TCP retransmission rate rose to 12%"}
        ],
        "metrics": [
            {"timestamp": "2026-09-26T07:20:00Z", "service": "api-gateway", "metric_name": "network_latency_ms", "value": 850.0, "unit": "ms"}
        ],
        "traces": [],
        "deployments": [],
        "dependencies": [
            {"caller": "api-gateway", "callee": "inventory-service", "type": "HTTP"}
        ]
    }
]

def seed_initial_incidents(db: Session):
    existing = db.query(IncidentModel).first()
    if existing:
        return
    for item in SEED_INCIDENTS:
        record = IncidentModel(
            incident_id=item["incident_id"],
            title=item["title"],
            severity=item["severity"],
            status=item["status"],
            started_at=item["started_at"],
            services=item["services"],
            logs=item["logs"],
            metrics=item["metrics"],
            traces=item["traces"],
            deployments=item["deployments"],
            dependencies=item["dependencies"]
        )
        db.add(record)
        log_audit_event(
            db=db,
            incident_id=item["incident_id"],
            event="INCIDENT_CREATED",
            actor="system",
            details=f"Incident {item['incident_id']} imported into registry: {item['title']}"
        )
    db.commit()

def list_incidents(db: Session) -> List[IncidentModel]:
    return db.query(IncidentModel).all()

def get_incident(db: Session, incident_id: str) -> Optional[IncidentModel]:
    return db.query(IncidentModel).filter(IncidentModel.incident_id == incident_id).first()

async def diagnose_incident(db: Session, incident_id: str) -> dict:
    inc = get_incident(db, incident_id)
    if not inc:
        return {}
    
    inc.status = "DIAGNOSING"
    db.commit()
    
    log_audit_event(
        db=db,
        incident_id=incident_id,
        event="AGENT_STARTED",
        actor="ai",
        details="LangGraph investigation agent initiated diagnosis workflow."
    )

    incident_payload = {
        "title": inc.title,
        "severity": inc.severity,
        "services": inc.services,
        "logs": inc.logs,
        "metrics": inc.metrics,
        "traces": inc.traces,
        "deployments": inc.deployments,
        "dependencies": inc.dependencies
    }

    diagnosis = await request_ai_diagnosis(incident_id, incident_payload)
    
    # Save evidence
    for ev in diagnosis.get("evidence", []):
        existing_ev = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == ev["evidence_id"]).first()
        if not existing_ev:
            ev_rec = EvidenceModel(
                evidence_id=ev["evidence_id"],
                incident_id=incident_id,
                source=ev.get("source", "logs"),
                timestamp=ev.get("timestamp", ""),
                service=ev.get("service", ""),
                observation=ev.get("observation", ""),
                importance=ev.get("importance", 1.0),
                supports=ev.get("supports", []),
                contradicts=ev.get("contradicts", []),
                confidence=ev.get("confidence", 0.5)
            )
            db.add(ev_rec)

    log_audit_event(
        db=db,
        incident_id=incident_id,
        event="EVIDENCE_COLLECTED",
        actor="ai",
        details=f"Collected {len(diagnosis.get('evidence', []))} correlated evidence artifacts across telemetry streams."
    )

    # Save hypotheses
    for hyp in diagnosis.get("hypotheses", []):
        existing_hyp = db.query(HypothesisModel).filter(HypothesisModel.hypothesis_id == hyp["hypothesis_id"]).first()
        if not existing_hyp:
            hyp_rec = HypothesisModel(
                hypothesis_id=hyp["hypothesis_id"],
                incident_id=incident_id,
                cause=hyp.get("cause", ""),
                service=hyp.get("service", ""),
                score=hyp.get("score", 0.0),
                confidence=hyp.get("confidence", 0.0),
                supporting_evidence=hyp.get("supporting_evidence", []),
                contradicting_evidence=hyp.get("contradicting_evidence", []),
                tests=hyp.get("tests", []),
                status=hyp.get("status", "VERIFIED")
            )
            db.add(hyp_rec)

    log_audit_event(
        db=db,
        incident_id=incident_id,
        event="HYPOTHESIS_VERIFIED",
        actor="ai",
        details=f"Evaluated competing hypotheses. Leading root cause identified: {diagnosis.get('root_cause', {}).get('cause', 'UNKNOWN')}"
    )

    # Save and enrich remediation
    rem_data = diagnosis.get("remediation")
    if rem_data:
        mock_rem = MOCK_DIAGNOSES.get(incident_id, {}).get("remediation", {})
        health_before = rem_data.get("health_before") or rem_data.get("pre_health") or mock_rem.get("health_before") or {
            "error_rate": 18.72,
            "latency_p99_ms": 4850,
            "throughput_rps": 420
        }
        health_after = rem_data.get("health_after") or rem_data.get("post_health") or mock_rem.get("health_after") or {
            "error_rate": 0.15,
            "latency_p99_ms": 115,
            "throughput_rps": 680
        }
        
        rem_data["health_before"] = health_before
        rem_data["health_after"] = health_after
        rem_data["pre_health"] = health_before
        rem_data["post_health"] = health_after
        rem_data["target_service"] = rem_data.get("service") or rem_data.get("target_service")
        rem_data["risk_level"] = rem_data.get("risk") or rem_data.get("risk_level", "MEDIUM")
        rem_data["explanation"] = rem_data.get("expected_effect") or rem_data.get("explanation", "")
        rem_data["rollback_plan"] = rem_data.get("rollback_plan") or mock_rem.get("rollback_plan", "Automatic rollback to previous known baseline if probes fail.")
        rem_data["status"] = "PENDING_APPROVAL"

        existing_rem = db.query(RemediationModel).filter(RemediationModel.action_id == rem_data["action_id"]).first()
        if not existing_rem:
            rem_rec = RemediationModel(
                action_id=rem_data["action_id"],
                incident_id=incident_id,
                action=rem_data["action"],
                service=rem_data.get("service") or rem_data.get("target_service", "payment-service"),
                current_version=rem_data.get("current_version"),
                target_version=rem_data.get("target_version"),
                replicas=rem_data.get("replicas"),
                risk=rem_data.get("risk") or rem_data.get("risk_level", "MEDIUM"),
                reversible=rem_data.get("reversible", True),
                expected_effect=rem_data.get("expected_effect") or rem_data.get("explanation", ""),
                verification=rem_data.get("verification", {}),
                requires_approval=rem_data.get("requires_approval", True),
                status=rem_data.get("status", "PENDING_APPROVAL"),
                rollback_plan=rem_data["rollback_plan"],
                parameters=rem_data.get("parameters", {}),
                health_before=health_before,
                health_after=health_after
            )
            db.add(rem_rec)

        log_audit_event(
            db=db,
            incident_id=incident_id,
            event="REMEDIATION_PROPOSED",
            actor="ai",
            action_id=rem_data["action_id"],
            details=f"Proposed safe action: {rem_data['action']} on {rem_data['service']}. Awaiting operator approval."
        )

    # Ensure timeline is populated for frontend
    if not diagnosis.get("timeline"):
        diagnosis["timeline"] = MOCK_DIAGNOSES.get(incident_id, {}).get("timeline", [])

    inc.status = "DIAGNOSED"
    db.commit()

    # Append recent audit trail
    from backend.services.audit_service import get_audit_trail
    aud_events = get_audit_trail(db, incident_id)
    diagnosis["audit_events"] = [
        {
            "audit_id": ev.audit_id,
            "incident_id": ev.incident_id,
            "timestamp": ev.timestamp,
            "actor": ev.actor,
            "event": ev.event,
            "action_id": ev.action_id,
            "details": ev.details
        }
        for ev in aud_events
    ]

    return diagnosis

def reset_incident(db: Session, incident_id: str) -> bool:
    from backend.db.models import ApprovalModel
    from backend.services.sandbox_service import reset_sandbox
    
    inc = get_incident(db, incident_id)
    if not inc:
        return False

    inc.status = "OPEN"
    db.query(EvidenceModel).filter(EvidenceModel.incident_id == incident_id).delete()
    db.query(HypothesisModel).filter(HypothesisModel.incident_id == incident_id).delete()
    db.query(RemediationModel).filter(RemediationModel.incident_id == incident_id).delete()
    db.query(ApprovalModel).filter(ApprovalModel.incident_id == incident_id).delete()

    reset_sandbox()
    
    log_audit_event(
        db=db,
        incident_id=incident_id,
        event="INCIDENT_CREATED",
        actor="human",
        details=f"Incident {incident_id} state was reset by operator for re-investigation demo."
    )
    db.commit()
    return True

def reset_all_incidents(db: Session) -> bool:
    incidents = list_incidents(db)
    for inc in incidents:
        reset_incident(db, inc.incident_id)
    return True

