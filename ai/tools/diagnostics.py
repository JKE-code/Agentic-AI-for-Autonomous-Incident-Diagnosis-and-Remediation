from typing import Dict, Any, List, Optional
from ai.models.schemas import Incident, LogEntry, MetricPoint, TraceSpan

class DiagnosticService:
    """Controlled diagnostic query engine to fetch supplemental telemetry when evidence is insufficient."""
    
    def __init__(self, incident: Incident):
        self.incident = incident
        
    def query_logs(self, service: Optional[str] = None, keyword: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for log in self.incident.logs:
            if service and log.service != service:
                continue
            if keyword and keyword.lower() not in log.message.lower():
                continue
            results.append(log.model_dump())
        return results

    def query_metrics(self, service: Optional[str] = None, metric_name: Optional[str] = None) -> List[Dict[str, Any]]:
        results = []
        for m in self.incident.metrics:
            if service and m.service != service:
                continue
            if metric_name and metric_name.lower() not in m.metric_name.lower():
                continue
            results.append(m.model_dump())
        return results

    def query_traces(self, service: Optional[str] = None, errors_only: bool = False) -> List[Dict[str, Any]]:
        results = []
        for t in self.incident.traces:
            if service and t.service != service:
                continue
            if errors_only and not (t.error or t.status_code >= 400):
                continue
            results.append(t.model_dump())
        return results

    def get_service_health(self, service: str) -> Dict[str, Any]:
        """Simulate probing current service health."""
        has_errors = any(l.service == service and l.level in ("ERROR", "FATAL") for l in self.incident.logs)
        metrics = [m for m in self.incident.metrics if m.service == service]
        return {
            "service": service,
            "status": "DEGRADED" if has_errors else "HEALTHY",
            "active_metrics_count": len(metrics)
        }
