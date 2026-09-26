from typing import List, Dict, Any, Optional
from datetime import datetime
from ai.models.schemas import DeploymentEvent

def find_recent_deployments(
    deployments: List[DeploymentEvent],
    incident_started_at: str,
    lookback_minutes: int = 120
) -> List[Dict[str, Any]]:
    """Find deployments that occurred just prior to or during the incident."""
    results = []
    try:
        inc_time = datetime.fromisoformat(incident_started_at.replace("Z", "+00:00"))
    except Exception:
        inc_time = None
        
    for dep in deployments:
        dep_dict = {
            "deployment_id": dep.deployment_id,
            "service": dep.service,
            "version": dep.version,
            "previous_version": dep.previous_version,
            "deployed_at": dep.deployed_at,
            "status": dep.status,
            "changelog": dep.changelog,
            "temporal_proximity_seconds": None,
            "is_suspect": False
        }
        
        if inc_time:
            try:
                d_time = datetime.fromisoformat(dep.deployed_at.replace("Z", "+00:00"))
                delta_sec = (inc_time - d_time).total_seconds()
                dep_dict["temporal_proximity_seconds"] = delta_sec
                # Suspect if deployed between 30 min before and 5 min after incident start
                if -300 <= delta_sec <= (lookback_minutes * 60):
                    dep_dict["is_suspect"] = True
            except Exception:
                pass
                
        results.append(dep_dict)
        
    return sorted(results, key=lambda x: x["temporal_proximity_seconds"] or 999999)
