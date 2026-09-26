from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import IncidentModel, EvidenceModel, HypothesisModel, RemediationModel
from backend.schemas.api_models import DiagnosisResponse, HypothesisItem, EvidenceItem, RemediationAction, RootCauseInfo
from backend.mock.ai_mock import get_mock_diagnosis

router = APIRouter(prefix="/api/diagnoses", tags=["diagnoses"])

@router.get("/{incident_id}", response_model=DiagnosisResponse)
def get_diagnosis(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(IncidentModel).filter(IncidentModel.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    hypotheses = db.query(HypothesisModel).filter(HypothesisModel.incident_id == incident_id).all()
    evidence = db.query(EvidenceModel).filter(EvidenceModel.incident_id == incident_id).all()
    remediation = db.query(RemediationModel).filter(RemediationModel.incident_id == incident_id).first()

    # If already diagnosed in DB, assemble from DB records
    mock_data = get_mock_diagnosis(incident_id)
    if hypotheses:
        leading_hyp = sorted(hypotheses, key=lambda h: h.score, reverse=True)[0]
        
        rem_health_before = (
            remediation.health_before 
            if remediation and remediation.health_before 
            else mock_data.get("remediation", {}).get("health_before")
        )
        rem_health_after = (
            remediation.health_after 
            if remediation and remediation.health_after 
            else mock_data.get("remediation", {}).get("health_after")
        )

        return DiagnosisResponse(
            incident_id=incident_id,
            status="DIAGNOSIS_COMPLETE" if inc.status in ["DIAGNOSED", "MITIGATING", "RESOLVED"] else "DIAGNOSING",
            timeline=mock_data.get("timeline", []),
            hypotheses=[
                HypothesisItem(
                    hypothesis_id=h.hypothesis_id,
                    cause=h.cause,
                    service=h.service,
                    score=h.score,
                    confidence=h.confidence,
                    supporting_evidence=h.supporting_evidence or [],
                    contradicting_evidence=h.contradicting_evidence or [],
                    tests=h.tests or [],
                    status=h.status
                )
                for h in hypotheses
            ],
            root_cause=RootCauseInfo(
                hypothesis_id=leading_hyp.hypothesis_id,
                cause=leading_hyp.cause,
                service=leading_hyp.service,
                summary=f"Primary root cause identified as {leading_hyp.cause}",
                confidence=leading_hyp.confidence,
                score=leading_hyp.score,
                supporting_evidence=leading_hyp.supporting_evidence or [],
                contradicting_evidence=leading_hyp.contradicting_evidence or [],
                tests=leading_hyp.tests or [],
                status=leading_hyp.status
            ),
            evidence=[
                EvidenceItem(
                    evidence_id=e.evidence_id,
                    source=e.source,
                    timestamp=e.timestamp,
                    service=e.service,
                    observation=e.observation,
                    importance=e.importance,
                    supports=e.supports or [],
                    contradicts=e.contradicts or [],
                    confidence=e.confidence
                )
                for e in evidence
            ],
            remediation=RemediationAction(
                action_id=remediation.action_id,
                action=remediation.action,
                service=remediation.service,
                target_service=remediation.service,
                current_version=remediation.current_version,
                target_version=remediation.target_version,
                replicas=remediation.replicas,
                risk=remediation.risk,
                risk_level=remediation.risk,
                reversible=remediation.reversible,
                expected_effect=remediation.expected_effect,
                explanation=remediation.expected_effect,
                rollback_plan=remediation.rollback_plan or "Automatic rollback to previous known baseline if probes fail.",
                parameters=remediation.parameters or {},
                verification=remediation.verification or {"metric": "health", "threshold": "healthy"},
                requires_approval=remediation.requires_approval,
                status=remediation.status,
                health_before=rem_health_before,
                health_after=rem_health_after,
                pre_health=rem_health_before,
                post_health=rem_health_after,
                approved_at=remediation.approved_at,
                executed_at=remediation.executed_at
            ) if remediation else None,
            confidence=leading_hyp.confidence,
            requires_more_data=False
        )

    # If not yet diagnosed, return standard mock diagnosis preview for frontend
    mock_data = get_mock_diagnosis(incident_id)
    return DiagnosisResponse(**mock_data)
