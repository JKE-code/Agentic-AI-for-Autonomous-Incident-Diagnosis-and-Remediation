from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.db.database import get_db
from backend.schemas.api_models import IncidentSummary, IncidentResponse, DiagnosisResponse
from backend.services.incident_service import list_incidents, get_incident, diagnose_incident

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

@router.get("", response_model=List[IncidentSummary])
def get_all_incidents(db: Session = Depends(get_db)):
    incidents = list_incidents(db)
    return [
        IncidentSummary(
            incident_id=inc.incident_id,
            title=inc.title,
            severity=inc.severity,
            status=inc.status,
            started_at=inc.started_at,
            services=inc.services or []
        )
        for inc in incidents
    ]

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_by_id(incident_id: str, db: Session = Depends(get_db)):
    inc = get_incident(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return IncidentResponse(
        incident_id=inc.incident_id,
        title=inc.title,
        severity=inc.severity,
        status=inc.status,
        started_at=inc.started_at,
        services=inc.services or [],
        logs=inc.logs or [],
        metrics=inc.metrics or [],
        traces=inc.traces or [],
        deployments=inc.deployments or [],
        dependencies=inc.dependencies or []
    )

@router.post("/{incident_id}/diagnose", response_model=DiagnosisResponse)
async def trigger_diagnosis(incident_id: str, db: Session = Depends(get_db)):
    inc = get_incident(db, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    
    result = await diagnose_incident(db, incident_id)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to run diagnosis pipeline")
    return result

@router.post("/reset_all")
def reset_all(db: Session = Depends(get_db)):
    from backend.services.incident_service import reset_all_incidents
    reset_all_incidents(db)
    return {"status": "RESET_ALL", "message": "All incident scenarios and sandbox state reset"}

@router.post("/{incident_id}/reset")
def reset_single_incident(incident_id: str, db: Session = Depends(get_db)):
    from backend.services.incident_service import reset_incident
    success = reset_incident(db, incident_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return {"status": "RESET", "incident_id": incident_id, "message": f"Incident {incident_id} state reset to OPEN"}
