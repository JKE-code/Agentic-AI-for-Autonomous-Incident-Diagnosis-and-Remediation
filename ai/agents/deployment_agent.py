from typing import List
from ai.models.schemas import Incident, Evidence
from ai.tools.deployments import find_recent_deployments
from ai.reasoning.evidence import EvidenceAggregator

def run_deployment_investigator(incident: Incident, aggregator: EvidenceAggregator) -> List[Evidence]:
    """Inspects recent deployments and configuration changes around incident start."""
    deployments = find_recent_deployments(incident.deployments, incident.started_at)
    new_evidence = []
    
    suspect_deployments = [d for d in deployments if d["is_suspect"]]
    
    if not suspect_deployments:
        ev = aggregator.add_evidence(
            source="deployments",
            timestamp=incident.started_at,
            service=incident.services[0] if incident.services else "system",
            observation="No suspicious or recent deployments detected in the 120-minute lookback window prior to incident start.",
            importance=0.4,
            confidence=0.9
        )
        new_evidence.append(ev)
        return new_evidence
        
    for dep in suspect_deployments:
        delta_str = f"{abs(dep['temporal_proximity_seconds']):.0f}s" if dep["temporal_proximity_seconds"] is not None else "recent"
        obs = f"Recent deployment on {dep['service']}: version {dep['previous_version']} -> {dep['version']} deployed ~{delta_str} relative to incident. Changelog: {dep.get('changelog')}"
        ev = aggregator.add_evidence(
            source="deployments",
            timestamp=dep["deployed_at"],
            service=dep["service"],
            observation=obs,
            importance=0.96,
            confidence=0.96,
            raw_ref=dep
        )
        new_evidence.append(ev)
        
    return new_evidence
