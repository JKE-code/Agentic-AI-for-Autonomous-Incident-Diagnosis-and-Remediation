from typing import List, Dict, Any, Optional
from ai.models.schemas import MetricPoint

def detect_metric_anomalies(metrics: List[MetricPoint]) -> List[Dict[str, Any]]:
    """Scan time-series metrics for threshold violations and sharp rate of change."""
    anomalies = []
    
    # Group by (service, metric_name)
    by_series: Dict[str, List[MetricPoint]] = {}
    for m in metrics:
        key = f"{m.service}::{m.metric_name}"
        by_series.setdefault(key, []).append(m)
        
    for key, series in by_series.items():
        service, metric_name = key.split("::")
        # Sort by timestamp
        sorted_series = sorted(series, key=lambda x: x.timestamp)
        if not sorted_series:
            continue
            
        values = [p.value for p in sorted_series]
        latest_val = values[-1]
        
        # Threshold checks
        if "cpu" in metric_name and latest_val > 80.0:
            anomalies.append({
                "service": service,
                "metric_name": metric_name,
                "current_value": latest_val,
                "unit": sorted_series[-1].unit,
                "severity": "CRITICAL" if latest_val > 95.0 else "WARN",
                "description": f"CPU saturation observed at {latest_val}%"
            })
            
        elif "error_rate" in metric_name and latest_val > 0.05:
            anomalies.append({
                "service": service,
                "metric_name": metric_name,
                "current_value": latest_val,
                "unit": sorted_series[-1].unit,
                "severity": "CRITICAL",
                "description": f"Error rate spike to {latest_val*100:.1f}%"
            })
            
        elif "connections" in metric_name and (latest_val >= 450 or "ratio" in metric_name and latest_val >= 0.9):
            anomalies.append({
                "service": service,
                "metric_name": metric_name,
                "current_value": latest_val,
                "unit": sorted_series[-1].unit,
                "severity": "CRITICAL",
                "description": f"DB connection pool near or at saturation: {latest_val}"
            })
            
        elif "memory_rss" in metric_name:
            # Check slope
            if len(values) >= 3 and values[-1] > values[0] * 1.5:
                growth_mb = (values[-1] - values[0]) / (1024 * 1024)
                anomalies.append({
                    "service": service,
                    "metric_name": metric_name,
                    "current_value": latest_val,
                    "unit": sorted_series[-1].unit,
                    "severity": "CRITICAL",
                    "description": f"Monotonic memory growth: +{growth_mb:.1f} MB indicates memory leak"
                })
                
        elif ("latency" in metric_name or "rtt" in metric_name) and latest_val > 500.0:
            anomalies.append({
                "service": service,
                "metric_name": metric_name,
                "current_value": latest_val,
                "unit": sorted_series[-1].unit,
                "severity": "HIGH",
                "description": f"High latency / RTT measured: {latest_val} ms"
            })
            
    return anomalies
