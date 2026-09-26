from typing import Optional
from ai.models.schemas import Hypothesis, RemediationPlan, RemediationVerification, Incident

def plan_remediation(
    hypothesis: Hypothesis,
    incident: Incident
) -> Optional[RemediationPlan]:
    """
    Formulates a safe, reversible, whitelisted remediation action tailored to the verified root cause.
    Never outputs arbitrary shell or container execution commands.
    """
    cat = hypothesis.root_cause_category
    
    if cat == "BAD_DEPLOYMENT":
        service_deps = [d for d in incident.deployments if d.service == hypothesis.service]
        dep = service_deps[-1] if service_deps else None
        curr_ver = dep.version if dep else "v1.5"
        prev_ver = dep.previous_version if dep and dep.previous_version else "v1.4"
        
        return RemediationPlan(
            action_id="ACT-001",
            action="rollback_deployment",
            service=hypothesis.service,
            current_version=curr_ver,
            target_version=prev_ver,
            parameters={"target_version": prev_ver},
            risk="MEDIUM",
            reversible=True,
            expected_effect=f"Rollback {hypothesis.service} to known-good version {prev_ver} to restore standard error rate and latency.",
            verification=RemediationVerification(metric="error_rate", threshold="< 0.02"),
            requires_approval=True
        )
        
    elif cat == "DB_CONNECTION_EXHAUSTION":
        return RemediationPlan(
            action_id="ACT-002",
            action="restart_service",
            service=hypothesis.service,
            parameters={"graceful": True, "flush_pool": True},
            risk="HIGH",
            reversible=True,
            expected_effect=f"Restart {hypothesis.service} to terminate orphaned database sessions and reset connection pool.",
            verification=RemediationVerification(metric="db_connections_active", threshold="< 250"),
            requires_approval=True
        )
        
    elif cat == "MEMORY_LEAK":
        return RemediationPlan(
            action_id="ACT-003",
            action="restart_service",
            service=hypothesis.service,
            parameters={"rolling": True},
            risk="MEDIUM",
            reversible=True,
            expected_effect=f"Perform rolling restart of {hypothesis.service} containers to clear allocated heap memory and restore service health.",
            verification=RemediationVerification(metric="memory_rss_bytes", threshold="< 1500000000"),
            requires_approval=True
        )
        
    elif cat == "DOWNSTREAM_FAILURE":
        return RemediationPlan(
            action_id="ACT-004",
            action="disable_dependency",
            service=hypothesis.service,
            parameters={"fallback_provider": "stripe-backup", "circuit_breaker_trip": True},
            risk="MEDIUM",
            reversible=True,
            expected_effect=f"Engage circuit breaker and route traffic away from degraded downstream provider {hypothesis.service}.",
            verification=RemediationVerification(metric="external_call_error_rate", threshold="< 0.05"),
            requires_approval=True
        )
        
    elif cat == "CPU_SATURATION":
        return RemediationPlan(
            action_id="ACT-005",
            action="scale_service",
            service=hypothesis.service,
            parameters={"replicas": 4},
            risk="LOW",
            reversible=True,
            expected_effect=f"Scale {hypothesis.service} replica count from 1 to 4 to distribute batch execution workload and drain queue.",
            verification=RemediationVerification(metric="cpu_utilization", threshold="< 70.0"),
            requires_approval=True
        )
        
    elif cat == "NETWORK_LATENCY":
        return RemediationPlan(
            action_id="ACT-006",
            action="restart_service",
            service=hypothesis.service,
            parameters={"rebind_cni_interfaces": True},
            risk="LOW",
            reversible=True,
            expected_effect=f"Recycle networking endpoints and re-establish keepalive connections for {hypothesis.service}.",
            verification=RemediationVerification(metric="network_rtt", threshold="< 20.0"),
            requires_approval=True
        )
        
    return None
