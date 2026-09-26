import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from backend.db.models import AuditEventModel

def log_audit_event(
    db: Session,
    incident_id: str,
    event: str,
    actor: str = "system",
    action_id: Optional[str] = None,
    details: str = "",
    extra_metadata: Optional[Dict[str, Any]] = None
) -> AuditEventModel:
    audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
    timestamp = datetime.now(timezone.utc).isoformat()
    
    event_record = AuditEventModel(
        audit_id=audit_id,
        incident_id=incident_id,
        timestamp=timestamp,
        actor=actor,
        event=event,
        action_id=action_id,
        details=details,
        extra_metadata=extra_metadata or {}
    )
    db.add(event_record)
    db.commit()
    db.refresh(event_record)
    return event_record

def get_audit_trail(db: Session, incident_id: str) -> List[AuditEventModel]:
    return (
        db.query(AuditEventModel)
        .filter(AuditEventModel.incident_id == incident_id)
        .order_by(AuditEventModel.timestamp.asc())
        .all()
    )
