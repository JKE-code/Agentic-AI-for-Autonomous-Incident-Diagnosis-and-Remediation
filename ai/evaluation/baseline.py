from typing import Dict, Any, List
from ai.models.schemas import Incident

def run_rules_baseline(incident: Incident) -> Dict[str, Any]:
    """
    Standard deterministic heuristic rules-based baseline model.
    Evaluates raw telemetry without LLM semantic reasoning or multi-agent graph.
    """
    scores: Dict[str, float] = {
        "BAD_DEPLOYMENT": 0.05,
        "DB_CONNECTION_EXHAUSTION": 0.05,
        "MEMORY_LEAK": 0.05,
        "DOWNSTREAM_FAILURE": 0.05,
        "CPU_SATURATION": 0.05,
        "NETWORK_LATENCY": 0.05
    }
    
    # 1. Rule: Recent deployment + error rate
    has_recent_dep = len(incident.deployments) > 0
    high_err = any(m.value > 0.05 for m in incident.metrics if "error_rate" in m.metric_name)
    if has_recent_dep and high_err:
        scores["BAD_DEPLOYMENT"] += 0.80
        
    # 2. Rule: DB connections + timeouts
    db_conn_high = any(m.value >= 400 for m in incident.metrics if "connection" in m.metric_name)
    db_err = any("connection" in l.message.lower() or "pool" in l.message.lower() for l in incident.logs)
    if db_conn_high and db_err:
        scores["DB_CONNECTION_EXHAUSTION"] += 0.85
        
    # 3. Rule: Memory slope + OOM
    mem_pts = [m.value for m in incident.metrics if "memory" in m.metric_name]
    mem_slope = len(mem_pts) >= 2 and mem_pts[-1] > mem_pts[0]
    oom_log = any("oom" in l.message.lower() or "outofmemory" in l.message.lower() for l in incident.logs)
    if mem_slope and oom_log:
        scores["MEMORY_LEAK"] += 0.85
        
    # 4. Rule: Downstream latency + timeout traces
    ext_trace = any(t.duration_ms > 2000 for t in incident.traces if "external" in t.service)
    ext_log = any("circuit" in l.message.lower() or "partner" in l.message.lower() for l in incident.logs)
    if ext_trace and ext_log:
        scores["DOWNSTREAM_FAILURE"] += 0.85
        
    # 5. Rule: High CPU
    cpu_high = any(m.value > 85.0 for m in incident.metrics if "cpu" in m.metric_name)
    queue_high = any(m.value > 100 for m in incident.metrics if "queue" in m.metric_name)
    if cpu_high and queue_high:
        scores["CPU_SATURATION"] += 0.85
        
    # 6. Rule: Network RTT
    rtt_high = any(m.value > 200.0 for m in incident.metrics if "rtt" in m.metric_name)
    if rtt_high:
        scores["NETWORK_LATENCY"] += 0.70
        
    # Rank candidates
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    top_cause, top_score = ranked[0]
    
    return {
        "model": "rules_baseline",
        "top_1_prediction": top_cause,
        "top_3_predictions": [r[0] for r in ranked[:3]],
        "confidence": min(0.95, top_score),
        "all_scores": dict(ranked)
    }
