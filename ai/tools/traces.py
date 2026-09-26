from typing import List, Dict, Any
from ai.models.schemas import TraceSpan

def analyze_traces(traces: List[TraceSpan]) -> List[Dict[str, Any]]:
    """Identify failing root/child spans, latency bottlenecks, and timeouts."""
    anomalies = []
    
    # Group by trace_id
    by_trace: Dict[str, List[TraceSpan]] = {}
    for span in traces:
        by_trace.setdefault(span.trace_id, []).append(span)
        
    for trace_id, spans in by_trace.items():
        # Find root span (no parent_span_id or earliest)
        root_spans = [s for s in spans if s.parent_span_id is None]
        failing_spans = [s for s in spans if s.error or s.status_code >= 400]
        slow_spans = [s for s in spans if s.duration_ms > 1000.0]
        
        for fs in failing_spans:
            anomalies.append({
                "trace_id": trace_id,
                "service": fs.service,
                "operation": fs.operation,
                "status_code": fs.status_code,
                "duration_ms": fs.duration_ms,
                "error_message": fs.error_message,
                "is_leaf_failure": not any(s.parent_span_id == fs.span_id and s.error for s in spans),
                "type": "SPAN_ERROR"
            })
            
        for ss in slow_spans:
            if ss not in failing_spans:
                anomalies.append({
                    "trace_id": trace_id,
                    "service": ss.service,
                    "operation": ss.operation,
                    "status_code": ss.status_code,
                    "duration_ms": ss.duration_ms,
                    "type": "LATENCY_BOTTLENECK"
                })
                
    return anomalies
