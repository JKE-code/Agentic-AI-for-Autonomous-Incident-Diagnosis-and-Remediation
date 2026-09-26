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
    if hypotheses:
        leading_hyp = sorted(hypotheses, key=lambda h: h.score, reverse=True)[0]
        return DiagnosisResponse(
            incident_id=incident_id,
            status="DIAGNOSIS_COMPLETE" if inc.status in ["DIAGNOSED", "MITIGATING", "RESOLVED"] else "DIAGNOSING",
            timeline=[],
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
                summary=f"Primary root cause identified as {leading_hyp.cause}"
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
                current_version=remediation.current_version,
                target_version=remediation.target_version,
                replicas=remediation.replicas,
                risk=remediation.risk,
                reversible=remediation.reversible,
                expected_effect=remediation.expected_effect,
                verification=remediation.verification or {"metric": "health", "threshold": "healthy"},
                requires_approval=remediation.requires_approval,
                status=remediation.status
            ) if remediation else None,
            confidence=leading_hyp.confidence,
            requires_more_data=False
        )

    # If not yet diagnosed, return standard mock diagnosis preview for frontend
    mock_data = get_mock_diagnosis(incident_id)
    return DiagnosisResponse(**mock_data)
