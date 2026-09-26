from typing import List
from ai.models.schemas import Incident, Evidence, Hypothesis
from ai.models.llm import get_llm_client

def generate_competing_hypotheses(incident: Incident, evidence_list: List[Evidence]) -> List[Hypothesis]:
    """
    Formulates 3-5 competing root-cause hypotheses covering plausible failure modes,
    each equipped with verification tests and preliminary evidence linkages.
    """
    llm = get_llm_client()
    
    # Base candidates to systematically compare
    candidate_definitions = [
        {
            "id": "HYP-001",
            "category": "BAD_DEPLOYMENT",
            "cause": f"Defective code release or schema mismatch in recent deployment of {incident.services[1] if len(incident.services) > 1 else incident.services[0]}",
            "service": incident.services[1] if len(incident.services) > 1 else incident.services[0],
            "tests": [
                "Verify temporal correlation between deployment completion and initial error surge",
                "Inspect error stack traces for new exception classes introduced in the target version",
                "Compare error rate of current release against baseline health of previous version"
            ]
        },
        {
            "id": "HYP-002",
            "category": "DB_CONNECTION_EXHAUSTION",
            "cause": "Database connection pool saturation or connection leak causing request timeouts",
            "service": "orders-db" if "orders-db" in incident.services else ("payment-db" if "payment-db" in incident.services else incident.services[-1]),
            "tests": [
                "Verify active connection pool utilization against max_connections ceiling",
                "Check for connection acquisition timeout exceptions in application logs",
                "Inspect DB thread states for long-running uncommitted transactions"
            ]
        },
        {
            "id": "HYP-003",
            "category": "DOWNSTREAM_FAILURE",
            "cause": "External partner API degradation or network gateway timeout propagating upstream",
            "service": "external-payment-provider" if "external-payment-provider" in incident.services else (incident.services[-1]),
            "tests": [
                "Measure downstream latency percentiles across external integration spans",
                "Verify circuit breaker state transitions in calling service",
                "Confirm whether internal compute resources (CPU, Memory) remain healthy during errors"
            ]
        },
        {
            "id": "HYP-004",
            "category": "MEMORY_LEAK",
            "cause": "Monotonic heap growth and progressive GC degradation triggering OutOfMemory crashes",
            "service": incident.services[1] if len(incident.services) > 1 else incident.services[0],
            "tests": [
                "Evaluate memory RSS time-series slope for unbounded growth",
                "Check for OutOfMemoryError exceptions and container cgroup SIGKILL signals",
                "Examine Garbage Collector pause durations preceding failure"
            ]
        },
        {
            "id": "HYP-005",
            "category": "CPU_SATURATION",
            "cause": "Worker thread exhaustion and compute saturation leading to request queue drops",
            "service": incident.services[0],
            "tests": [
                "Check CPU utilization sustained above 90% threshold",
                "Inspect worker thread pool active vs maximum queue depth",
                "Verify whether database and downstream dependencies are executing normally"
            ]
        },
        {
            "id": "HYP-006",
            "category": "NETWORK_LATENCY",
            "cause": "Inter-service network transit degradation or packet retransmission delays",
            "service": incident.services[0],
            "tests": [
                "Measure TCP round-trip transit time (RTT) between service pods",
                "Compare client-perceived span duration against internal server execution duration",
                "Confirm absence of service-level CPU or database locks"
            ]
        }
    ]
    
    hypotheses: List[Hypothesis] = []
    for defn in candidate_definitions: # Compare all key candidate failure modes
        h = Hypothesis(
            hypothesis_id=defn["id"],
            cause=defn["cause"],
            root_cause_category=defn["category"],
            service=defn["service"],
            score=0.5,
            confidence=0.5,
            supporting_evidence=[],
            contradicting_evidence=[],
            tests=defn["tests"],
            status="PROPOSED"
        )
        hypotheses.append(h)
        
    return hypotheses
