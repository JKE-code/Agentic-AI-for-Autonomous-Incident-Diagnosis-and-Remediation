from typing import List
from ai.models.schemas import Incident, Evidence
from ai.tools.logs import extract_error_signatures
from ai.reasoning.evidence import EvidenceAggregator

def run_log_investigator(incident: Incident, aggregator: EvidenceAggregator) -> List[Evidence]:
    """Analyzes logs for error spikes, uncaught exceptions, and fatal crashes."""
    signatures = extract_error_signatures(incident.logs)
    new_evidence = []
    
    if not signatures:
        ev = aggregator.add_evidence(
            source="logs",
            timestamp=incident.started_at,
            service=incident.services[0] if incident.services else "system",
            observation="No critical error signatures or fatal exceptions observed in logs.",
            importance=0.3,
            confidence=0.85
        )
        new_evidence.append(ev)
        return new_evidence
        
    # Group by service
    by_svc = {}
    for sig in signatures:
        by_svc.setdefault(sig["service"], []).append(sig)
        
    for svc, sigs in by_svc.items():
        sample = sigs[0]
        count = len(sigs)
        desc = f"Service {svc} emitted {count} critical log error(s). Primary pattern: '{sample['message']}'"
        if sample.get("error_code"):
            desc += f" [Code: {sample['error_code']}]"
            
        ev = aggregator.add_evidence(
            source="logs",
            timestamp=sample["timestamp"],
            service=svc,
            observation=desc,
            importance=0.92,
            confidence=0.94,
            raw_ref={"error_count": count, "sample": sample}
        )
        new_evidence.append(ev)
        
    return new_evidence
