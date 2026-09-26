from typing import List
from ai.models.schemas import Incident, Evidence
from ai.tools.dependencies import build_dependency_graph
from ai.reasoning.evidence import EvidenceAggregator

def run_dependency_investigator(incident: Incident, aggregator: EvidenceAggregator) -> List[Evidence]:
    """Analyzes topology graph to identify architectural dependencies and blast radius."""
    graph = build_dependency_graph(incident.dependencies)
    new_evidence = []
    
    # Identify services that have critical downstream dependencies
    for svc in incident.services:
        downstream = graph["downstream"].get(svc, [])
        upstream = graph["upstream"].get(svc, [])
        if downstream or upstream:
            obs = f"Topology mapping for {svc}: calls downstream [{', '.join(downstream) if downstream else 'none'}], called upstream by [{', '.join(upstream) if upstream else 'none'}]"
            ev = aggregator.add_evidence(
                source="dependencies",
                timestamp=incident.started_at,
                service=svc,
                observation=obs,
                importance=0.6,
                confidence=0.95,
                raw_ref={"downstream": downstream, "upstream": upstream}
            )
            new_evidence.append(ev)
            
    return new_evidence
