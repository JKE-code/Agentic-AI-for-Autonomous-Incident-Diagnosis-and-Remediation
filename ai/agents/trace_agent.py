from typing import List
from ai.models.schemas import Incident, Evidence
from ai.tools.traces import analyze_traces
from ai.reasoning.evidence import EvidenceAggregator

def run_trace_investigator(incident: Incident, aggregator: EvidenceAggregator) -> List[Evidence]:
    """Analyzes distributed trace spans to isolate failure origin and timeout chains."""
    anomalies = analyze_traces(incident.traces)
    new_evidence = []
    
    if not anomalies:
        ev = aggregator.add_evidence(
            source="traces",
            timestamp=incident.started_at,
            service=incident.services[0] if incident.services else "system",
            observation="Distributed trace execution paths show no failing or stalled spans.",
            importance=0.25,
            confidence=0.85
        )
        new_evidence.append(ev)
        return new_evidence
        
    for anom in anomalies:
        if anom["type"] == "SPAN_ERROR":
            obs = f"Trace failure in {anom['service']} during '{anom['operation']}': HTTP {anom['status_code']} ({anom.get('error_message') or 'Internal Error'}) in {anom['duration_ms']:.1f}ms"
            importance = 0.93
        else:
            obs = f"Latency bottleneck in {anom['service']} during '{anom['operation']}': duration reached {anom['duration_ms']:.1f}ms"
            importance = 0.82
            
        ev = aggregator.add_evidence(
            source="traces",
            timestamp=incident.started_at,
            service=anom["service"],
            observation=obs,
            importance=importance,
            confidence=0.92,
            raw_ref=anom
        )
        new_evidence.append(ev)
        
    return new_evidence
