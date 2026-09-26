from typing import List, Dict, Any, Optional
from ai.models.schemas import Hypothesis, Evidence, Incident

def calculate_temporal_correlation(hyp: Hypothesis, incident: Incident, evidence_list: List[Evidence]) -> float:
    """Calculate temporal alignment score between incident start and signals."""
    supporting = [e for e in evidence_list if e.evidence_id in hyp.supporting_evidence]
    if not supporting:
        return 0.1
    # Check if any deployment or critical signal happened right before or around start
    if hyp.root_cause_category == "BAD_DEPLOYMENT":
        for dep in incident.deployments:
            if dep.service == hyp.service:
                return 0.95
    return 0.7 if len(supporting) >= 2 else 0.4

def calculate_cross_signal_agreement(hyp: Hypothesis, evidence_list: List[Evidence]) -> float:
    """Measure how many distinct observability signals (logs, metrics, traces, deployments) support this."""
    supporting = [e for e in evidence_list if e.evidence_id in hyp.supporting_evidence]
    sources = set(e.source for e in supporting)
    # If 3 or more distinct sources support it, agreement is near 1.0
    if len(sources) >= 3:
        return 1.0
    elif len(sources) == 2:
        return 0.75
    elif len(sources) == 1:
        return 0.4
    return 0.1

def calculate_dependency_relevance(hyp: Hypothesis, incident: Incident) -> float:
    """Evaluate whether the hypothesis service is in the critical incident path."""
    if hyp.service in incident.services:
        return 0.9
    for edge in incident.dependencies:
        if edge.source == hyp.service or edge.target == hyp.service:
            return 0.75
    return 0.3

def calculate_deterministic_rules_score(hyp: Hypothesis, incident: Incident, evidence_list: List[Evidence]) -> float:
    """Evaluate deterministic heuristic rules for each category."""
    cat = hyp.root_cause_category
    
    if cat == "BAD_DEPLOYMENT":
        has_dep = any(d.service == hyp.service for d in incident.deployments)
        has_err = any(l.service == hyp.service and l.level in ("ERROR", "FATAL") for l in incident.logs)
        return 0.95 if (has_dep and has_err) else 0.2
        
    elif cat == "DB_CONNECTION_EXHAUSTION":
        db_sat = any("connections" in m.metric_name and m.value >= 400 for m in incident.metrics)
        db_err = any("connection" in l.message.lower() or "pool" in l.message.lower() for l in incident.logs)
        return 0.95 if (db_sat and db_err) else 0.2
        
    elif cat == "MEMORY_LEAK":
        oom_err = any("outofmemory" in l.message.lower() or "oom" in l.message.lower() for l in incident.logs)
        mem_metrics = [m.value for m in incident.metrics if "memory" in m.metric_name]
        growing = len(mem_metrics) >= 2 and mem_metrics[-1] > mem_metrics[0]
        return 0.95 if (oom_err or growing) else 0.2
        
    elif cat == "DOWNSTREAM_FAILURE":
        ext_err = any("timeout" in l.message.lower() or "circuit" in l.message.lower() for l in incident.logs)
        ext_traces = any(t.duration_ms > 2000 and "external" in t.service for t in incident.traces)
        return 0.95 if (ext_err or ext_traces) else 0.2
        
    elif cat == "CPU_SATURATION":
        cpu_sat = any("cpu" in m.metric_name and m.value > 85.0 for m in incident.metrics)
        queue_backlog = any("queue" in m.metric_name and m.value > 100 for m in incident.metrics)
        return 0.95 if (cpu_sat or queue_backlog) else 0.2
        
    elif cat == "NETWORK_LATENCY":
        net_high = any("rtt" in m.metric_name and m.value > 200 for m in incident.metrics)
        low_cpu = any("cpu" in m.metric_name and m.value < 40 for m in incident.metrics)
        return 0.90 if (net_high and low_cpu) else 0.2
        
    return 0.3

def compute_hybrid_score(
    hyp: Hypothesis,
    incident: Incident,
    evidence_list: List[Evidence],
    llm_assessment_score: Optional[float] = None
) -> Dict[str, float]:
    """
    Computes hybrid score according to arc.md specification:
      0.35 LLM evidence assessment
    + 0.25 temporal correlation
    + 0.20 cross-signal agreement
    + 0.10 service dependency relevance
    + 0.10 deterministic rules score
    """
    s_llm = llm_assessment_score if llm_assessment_score is not None else hyp.score
    s_temp = calculate_temporal_correlation(hyp, incident, evidence_list)
    s_agree = calculate_cross_signal_agreement(hyp, evidence_list)
    s_dep = calculate_dependency_relevance(hyp, incident)
    s_rules = calculate_deterministic_rules_score(hyp, incident, evidence_list)
    
    total = (
        0.35 * s_llm +
        0.25 * s_temp +
        0.20 * s_agree +
        0.10 * s_dep +
        0.10 * s_rules
    )
    
    # Bound between 0.05 and 0.98
    final_score = max(0.05, min(0.98, total))
    
    return {
        "final_score": round(final_score, 4),
        "llm_score": round(s_llm, 4),
        "temporal_score": round(s_temp, 4),
        "cross_signal_score": round(s_agree, 4),
        "dependency_score": round(s_dep, 4),
        "rules_score": round(s_rules, 4)
    }

def rank_and_normalize_hypotheses(
    hypotheses: List[Hypothesis],
    incident: Incident,
    evidence_list: List[Evidence]
) -> List[Hypothesis]:
    """Apply hybrid scoring to each hypothesis, sort descending, and normalize scores."""
    scored: List[Hypothesis] = []
    
    for h in hypotheses:
        breakdown = compute_hybrid_score(h, incident, evidence_list)
        h_copy = h.model_copy()
        h_copy.score = breakdown["final_score"]
        # Confidence reflects strength of evidence and rules alignment
        h_copy.confidence = round(min(0.96, (breakdown["rules_score"] * 0.5 + breakdown["cross_signal_score"] * 0.5)), 4)
        scored.append(h_copy)
        
    scored.sort(key=lambda x: x.score, reverse=True)
    return scored
