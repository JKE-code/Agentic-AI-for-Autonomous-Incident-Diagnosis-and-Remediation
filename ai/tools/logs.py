from typing import List, Dict, Any, Optional
from ai.models.schemas import LogEntry

def filter_logs(
    logs: List[LogEntry],
    service: Optional[str] = None,
    min_level: Optional[str] = None,
    keyword: Optional[str] = None
) -> List[LogEntry]:
    level_order = {"DEBUG": 0, "INFO": 1, "WARN": 2, "ERROR": 3, "FATAL": 4}
    min_rank = level_order.get(min_level, 0) if min_level else 0
    
    filtered = []
    for log in logs:
        if service and log.service != service:
            continue
        if level_order.get(log.level, 0) < min_rank:
            continue
        if keyword and keyword.lower() not in log.message.lower():
            continue
        filtered.append(log)
    return filtered

def extract_error_signatures(logs: List[LogEntry]) -> List[Dict[str, Any]]:
    """Identify clusters of error patterns, error codes, and exception types."""
    signatures = []
    for log in logs:
        if log.level in ("ERROR", "FATAL"):
            signatures.append({
                "service": log.service,
                "timestamp": log.timestamp,
                "level": log.level,
                "error_code": log.error_code,
                "message": log.message,
                "trace_id": log.trace_id
            })
    return signatures
