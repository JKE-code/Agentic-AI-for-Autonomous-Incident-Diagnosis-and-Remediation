import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import RemediationModel, ApprovalModel, IncidentModel
from backend.schemas.api_models import ApprovalRequest, ApprovalResponse
from backend.services.audit_service import log_audit_event
from backend.services.ai_client import resume_ai_workflow

router = APIRouter(prefix="/api/approvals", tags=["approvals"])

@router.post("/{action_id}/approve", response_model=ApprovalResponse)
async def approve_action(action_id: str, request: ApprovalRequest = ApprovalRequest(), db: Session = Depends(get_db)):
    rem = db.query(RemediationModel).filter(RemediationModel.action_id == action_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail=f"Remediation action {action_id} not found")

    rem.status = "APPROVED"
    now_iso = datetime.now(timezone.utc).isoformat()
    rem.approved_at = now_iso

    # Update parent incident status
    inc = db.query(IncidentModel).filter(IncidentModel.incident_id == rem.incident_id).first()
    if inc:
        inc.status = "APPROVED"

    approval_rec = ApprovalModel(
        approval_id=f"APP-{uuid.uuid4().hex[:8].upper()}",
        action_id=action_id,
        incident_id=rem.incident_id,
        actor=request.actor,
        approved=True,
        reason=request.reason,
        timestamp=now_iso
    )
    db.add(approval_rec)

    log_audit_event(
        db=db,
        incident_id=rem.incident_id,
        event="APPROVAL_GRANTED",
        actor=request.actor,
        action_id=action_id,
        details=f"Human operator '{request.actor}' granted approval for {rem.action} on {rem.service}. Reason: {request.reason}"
    )
    db.commit()

    # Notify LangGraph if running
    await resume_ai_workflow(f"{rem.incident_id}-graph", "approved")

    return ApprovalResponse(
        action_id=action_id,
        status="APPROVED",
        approved=True,
        actor=request.actor,
        timestamp=now_iso,
        message=f"Action {action_id} approved for execution in sandbox."
    )

@router.post("/{action_id}/reject", response_model=ApprovalResponse)
async def reject_action(action_id: str, request: ApprovalRequest = ApprovalRequest(), db: Session = Depends(get_db)):
    rem = db.query(RemediationModel).filter(RemediationModel.action_id == action_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail=f"Remediation action {action_id} not found")

    rem.status = "REJECTED"
    now_iso = datetime.now(timezone.utc).isoformat()

    inc = db.query(IncidentModel).filter(IncidentModel.incident_id == rem.incident_id).first()
    if inc:
        inc.status = "REJECTED"

    approval_rec = ApprovalModel(
        approval_id=f"APP-{uuid.uuid4().hex[:8].upper()}",
        action_id=action_id,
        incident_id=rem.incident_id,
        actor=request.actor,
        approved=False,
        reason=request.reason,
        timestamp=now_iso
    )
    db.add(approval_rec)

    log_audit_event(
        db=db,
        incident_id=rem.incident_id,
        event="APPROVAL_REJECTED",
        actor=request.actor,
        action_id=action_id,
        details=f"Human operator '{request.actor}' rejected action {rem.action} on {rem.service}. Reason: {request.reason}"
    )
    db.commit()

    await resume_ai_workflow(f"{rem.incident_id}-graph", "rejected")

    return ApprovalResponse(
        action_id=action_id,
        status="REJECTED",
        approved=False,
        actor=request.actor,
        timestamp=now_iso,
        message=f"Action {action_id} was rejected by operator."
    )
