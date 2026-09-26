from typing import List, Dict, Any, Set
from ai.models.schemas import Evidence, Hypothesis

class EvidenceAggregator:
    def __init__(self):
        self.evidence_counter = 1
        self.items: List[Evidence] = []

    def add_evidence(
        self,
        source: str,
        timestamp: str,
        service: str,
        observation: str,
        importance: float,
        supports: List[str] = None,
        contradicts: List[str] = None,
        confidence: float = 0.9,
        raw_ref: Dict[str, Any] = None
    ) -> Evidence:
        ev_id = f"E-{self.evidence_counter:03d}"
        self.evidence_counter += 1
        
        evidence = Evidence(
            evidence_id=ev_id,
            source=source,
            timestamp=timestamp,
            service=service,
            observation=observation,
            importance=round(importance, 2),
            supports=supports or [],
            contradicts=contradicts or [],
            confidence=round(confidence, 2),
            raw_ref=raw_ref
        )
        self.items.append(evidence)
        return evidence

    def link_hypotheses(self, hypotheses: List[Hypothesis]):
        """Map evidence objects to hypotheses based on matching root cause signatures."""
        for ev in self.items:
            obs_lower = ev.observation.lower()
            
            for hyp in hypotheses:
                cat = hyp.root_cause_category
                # Match signals
                matches = False
                if cat == "BAD_DEPLOYMENT" and ("deploy" in obs_lower or "version" in obs_lower or "v1.5" in obs_lower):
                    matches = True
                elif cat == "DB_CONNECTION_EXHAUSTION" and ("connection" in obs_lower or "database" in obs_lower or "pool" in obs_lower):
                    matches = True
                elif cat == "MEMORY_LEAK" and ("memory" in obs_lower or "oom" in obs_lower or "gc" in obs_lower):
                    matches = True
                elif cat == "DOWNSTREAM_FAILURE" and ("external" in obs_lower or "circuit" in obs_lower or "partner" in obs_lower):
                    matches = True
                elif cat == "CPU_SATURATION" and ("cpu" in obs_lower or "thread" in obs_lower or "queue" in obs_lower):
                    matches = True
                elif cat == "NETWORK_LATENCY" and ("rtt" in obs_lower or "transit" in obs_lower or "packet" in obs_lower or "network" in obs_lower):
                    matches = True
                    
                if matches and hyp.hypothesis_id not in ev.supports:
                    ev.supports.append(hyp.hypothesis_id)
                    if ev.evidence_id not in hyp.supporting_evidence:
                        hyp.supporting_evidence.append(ev.evidence_id)
                elif not matches and ev.importance > 0.8:
                    # Contradicts if the evidence strongly points to another specific service/failure mode
                    pass
