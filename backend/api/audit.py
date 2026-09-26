from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.schemas.api_models import AuditEventItem
from backend.services.audit_service import get_audit_trail

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("/{incident_id}", response_model=List[AuditEventItem])
def get_incident_audit(incident_id: str, db: Session = Depends(get_db)):
    events = get_audit_trail(db, incident_id)
    return [
        AuditEventItem(
            audit_id=ev.audit_id,
            incident_id=ev.incident_id,
            timestamp=ev.timestamp,
            actor=ev.actor,
            event=ev.event,
            action_id=ev.action_id,
            details=ev.details,
            metadata=ev.extra_metadata or {}
        )
        for ev in events
    ]
