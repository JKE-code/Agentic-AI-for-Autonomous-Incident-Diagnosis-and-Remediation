from typing import List
from ai.models.schemas import Incident, TimelineItem

def build_incident_timeline(incident: Incident) -> List[TimelineItem]:
    """
    Constructs a unified, chronological timeline across deployments, logs,
    metric anomalies, and trace failures.
    """
    items: List[TimelineItem] = []
    
    # 1. Deployment events
    for dep in incident.deployments:
        items.append(TimelineItem(
            timestamp=dep.deployed_at,
            source="deployments",
            service=dep.service,
            summary=f"Deployment {dep.version} ({dep.status}): {dep.changelog or 'Release'}",
            anomaly=False
        ))
        
    # 2. Key log events (warnings, errors, fatal)
    for log in incident.logs:
        if log.level in ("WARN", "ERROR", "FATAL"):
            items.append(TimelineItem(
                timestamp=log.timestamp,
                source="logs",
                service=log.service,
                summary=f"[{log.level}] {log.message}",
                anomaly=(log.level in ("ERROR", "FATAL"))
            ))
            
    # 3. Critical metric anomalies
    for m in incident.metrics:
        # Include significant threshold points
        if ("error_rate" in m.metric_name and m.value > 0.05) or \
           ("cpu" in m.metric_name and m.value > 85.0) or \
           ("connections" in m.metric_name and m.value >= 400) or \
           ("latency" in m.metric_name and m.value > 1000.0) or \
           ("rtt" in m.metric_name and m.value > 500.0):
            items.append(TimelineItem(
                timestamp=m.timestamp,
                source="metrics",
                service=m.service,
                summary=f"Metric anomaly: {m.metric_name} = {m.value} {m.unit}",
                anomaly=True
            ))
            
    # 4. Trace failures
    for tr in incident.traces:
        if tr.error or tr.status_code >= 400:
            items.append(TimelineItem(
                timestamp=tr.timestamp,
                source="traces",
                service=tr.service,
                summary=f"Trace {tr.trace_id} failed: {tr.operation} (status {tr.status_code}, {tr.duration_ms}ms) - {tr.error_message or 'Failed'}",
                anomaly=True
            ))
            
    # Sort chronologically
    items.sort(key=lambda x: x.timestamp)
    return items
