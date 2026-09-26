from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.db.models import RemediationModel
from backend.schemas.api_models import ExecutionResult, RollbackResult
from backend.services.sandbox_service import execute_sandbox_action, rollback_sandbox_action

router = APIRouter(prefix="/api/remediations", tags=["remediations"])

@router.post("/{action_id}/execute", response_model=ExecutionResult)
def execute_remediation(action_id: str, db: Session = Depends(get_db)):
    rem = db.query(RemediationModel).filter(RemediationModel.action_id == action_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail=f"Remediation {action_id} not found")

    # Safety check: must be approved if requires_approval
    if rem.requires_approval and rem.status not in ["APPROVED"]:
        raise HTTPException(
            status_code=403,
            detail=f"Action {action_id} requires explicit human approval before sandbox execution. Current status: {rem.status}"
        )

    verified, pre_health, post_health, message = execute_sandbox_action(db, rem, actor="human")

    rem_dict = {
        "action_id": rem.action_id,
        "action": rem.action,
        "service": rem.service,
        "target_service": rem.service,
        "current_version": rem.current_version,
        "target_version": rem.target_version,
        "replicas": rem.replicas,
        "risk": rem.risk,
        "risk_level": rem.risk,
        "status": rem.status,
        "expected_effect": rem.expected_effect,
        "explanation": rem.expected_effect,
        "rollback_plan": rem.rollback_plan or "Drain traffic to backup sandbox if verification fails.",
        "verification": rem.verification,
        "health_before": pre_health,
        "health_after": post_health,
        "pre_health": pre_health,
        "post_health": post_health,
        "approved_at": rem.approved_at,
        "executed_at": rem.executed_at
    }

    return ExecutionResult(
        action_id=action_id,
        status=rem.status,
        pre_health=pre_health,
        post_health=post_health,
        health_before=pre_health,
        health_after=post_health,
        verified=verified,
        message=message,
        auto_rollback=(not verified),
        remediation=rem_dict
    )

@router.post("/{action_id}/rollback", response_model=RollbackResult)
def trigger_manual_rollback(action_id: str, db: Session = Depends(get_db)):
    rem = db.query(RemediationModel).filter(RemediationModel.action_id == action_id).first()
    if not rem:
        raise HTTPException(status_code=404, detail=f"Remediation {action_id} not found")

    success, post_health = rollback_sandbox_action(db, rem, actor="human (manual rollback)")

    return RollbackResult(
        action_id=action_id,
        status="ROLLED_BACK",
        post_health=post_health,
        message="Manual rollback executed successfully."
    )
