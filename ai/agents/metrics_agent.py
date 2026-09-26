from typing import List
from ai.models.schemas import Incident, Evidence
from ai.tools.metrics import detect_metric_anomalies
from ai.reasoning.evidence import EvidenceAggregator

def run_metrics_investigator(incident: Incident, aggregator: EvidenceAggregator) -> List[Evidence]:
    """Analyzes system and application telemetry metrics for critical threshold anomalies."""
    anomalies = detect_metric_anomalies(incident.metrics)
    new_evidence = []
    
    if not anomalies:
        ev = aggregator.add_evidence(
            source="metrics",
            timestamp=incident.started_at,
            service=incident.services[0] if incident.services else "system",
            observation="All reported metrics (CPU, memory, latency, error rate) within nominal operating thresholds.",
            importance=0.3,
            confidence=0.88
        )
        new_evidence.append(ev)
        return new_evidence
        
    for anom in anomalies:
        importance = 0.95 if anom.get("severity") == "CRITICAL" else 0.75
        ev = aggregator.add_evidence(
            source="metrics",
            timestamp=incident.started_at,
            service=anom["service"],
            observation=f"Metric anomaly on {anom['service']}: {anom['description']} ({anom['metric_name']} = {anom['current_value']} {anom.get('unit', '')})",
            importance=importance,
            confidence=0.95,
            raw_ref=anom
        )
        new_evidence.append(ev)
        
    return new_evidence
