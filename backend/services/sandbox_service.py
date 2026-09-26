import time
import subprocess
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.db.models import RemediationModel, IncidentModel
from backend.services.audit_service import log_audit_event
from backend.schemas.api_models import ActionEnum

import copy

INITIAL_SANDBOX_STATE: Dict[str, Dict[str, Any]] = {
    "payment-service": {
        "version": "v1.5",
        "healthy": False,
        "error_rate": 0.187,
        "replicas": 1,
        "memory_mb": 940,
        "cpu_percent": 34.0,
        "cache_entries": 15000,
        "dependencies_enabled": {"payment-db": True, "external-payment-provider": True}
    },
    "order-service": {
        "version": "v2.0",
        "healthy": False,
        "error_rate": 0.082,
        "replicas": 1,
        "memory_mb": 420,
        "cpu_percent": 97.4,
        "db_connections": 98,
        "cache_entries": 8000,
        "dependencies_enabled": {"orders-db": True}
    },
    "inventory-service": {
        "version": "v1.2",
        "healthy": False,
        "error_rate": 0.015,
        "replicas": 2,
        "memory_mb": 310,
        "cpu_percent": 18.0,
        "network_latency_ms": 850.0,
        "cache_entries": 4000,
        "dependencies_enabled": {}
    },
    "api-gateway": {
        "version": "v3.1",
        "healthy": True,
        "error_rate": 0.045,
        "replicas": 2,
        "memory_mb": 250,
        "cpu_percent": 22.0,
        "cache_entries": 1200,
        "dependencies_enabled": {}
    }
}

SANDBOX_STATE: Dict[str, Dict[str, Any]] = copy.deepcopy(INITIAL_SANDBOX_STATE)

def reset_sandbox():
    global SANDBOX_STATE
    SANDBOX_STATE = copy.deepcopy(INITIAL_SANDBOX_STATE)

def is_docker_available() -> bool:
    try:
        res = subprocess.run(["docker", "ps"], capture_output=True, timeout=2)
        return res.returncode == 0
    except Exception:
        return False

# --- Whitelisted Deterministic Action Functions ---

def fn_rollback_deployment(service: str, target_version: str) -> Dict[str, Any]:
    svc = SANDBOX_STATE.setdefault(service, {})
    prev_version = svc.get("version", "unknown")
    svc["version"] = target_version or "v1.4"
    svc["error_rate"] = 0.002
    svc["healthy"] = True
    return {
        "executed": True,
        "action": "rollback_deployment",
        "service": service,
        "from_version": prev_version,
        "to_version": svc["version"],
        "error_rate": svc["error_rate"]
    }

def fn_restart_service(service: str) -> Dict[str, Any]:
    svc = SANDBOX_STATE.setdefault(service, {})
    svc["healthy"] = True
    svc["error_rate"] = 0.001
    svc["memory_mb"] = 280
    svc["db_connections"] = 12
    svc["network_latency_ms"] = 4.0
    return {
        "executed": True,
        "action": "restart_service",
        "service": service,
        "memory_mb": svc["memory_mb"],
        "db_connections": svc.get("db_connections", 0)
    }

def fn_scale_service(service: str, replicas: int) -> Dict[str, Any]:
    svc = SANDBOX_STATE.setdefault(service, {})
    new_replicas = replicas or 3
    svc["replicas"] = new_replicas
    svc["cpu_percent"] = max(18.0, svc.get("cpu_percent", 80.0) / new_replicas)
    svc["error_rate"] = 0.003
    svc["healthy"] = True
    return {
        "executed": True,
        "action": "scale_service",
        "service": service,
        "replicas": new_replicas,
        "cpu_percent": svc["cpu_percent"]
    }

def fn_clear_cache(service: str) -> Dict[str, Any]:
    svc = SANDBOX_STATE.setdefault(service, {})
    svc["cache_entries"] = 0
    svc["memory_mb"] = max(200, svc.get("memory_mb", 500) // 2)
    svc["healthy"] = True
    return {
        "executed": True,
        "action": "clear_cache",
        "service": service,
        "cache_entries": 0
    }

def fn_disable_dependency(service: str, dependency: str) -> Dict[str, Any]:
    svc = SANDBOX_STATE.setdefault(service, {})
    deps = svc.setdefault("dependencies_enabled", {})
    deps[dependency or "external-payment-provider"] = False
    svc["error_rate"] = 0.005
    svc["healthy"] = True
    return {
        "executed": True,
        "action": "disable_dependency",
        "service": service,
        "dependency_disabled": dependency or "external-payment-provider"
    }

ACTION_DISPATCHER = {
    ActionEnum.rollback_deployment: fn_rollback_deployment,
    ActionEnum.restart_service: fn_restart_service,
    ActionEnum.scale_service: fn_scale_service,
    ActionEnum.clear_cache: fn_clear_cache,
    ActionEnum.disable_dependency: fn_disable_dependency,
}

def capture_health_state(service: str) -> Dict[str, Any]:
    state = SANDBOX_STATE.get(service, {})
    return {
        "service": service,
        "healthy": state.get("healthy", False),
        "error_rate": state.get("error_rate", 0.0),
        "cpu_percent": state.get("cpu_percent", 0.0),
        "memory_mb": state.get("memory_mb", 0),
        "version": state.get("version", "v1.0"),
        "replicas": state.get("replicas", 1)
    }

def execute_sandbox_action(
    db: Session,
    remediation: RemediationModel,
    actor: str = "human"
) -> Tuple[bool, Dict[str, Any], Dict[str, Any], str]:
    """
    Executes a whitelisted action inside the sandbox.
    Captures pre/post health, verifies health invariant, and marks status.
    """
    service_name = remediation.service
    action_type = remediation.action

    # 1. Capture Pre-action Health
    pre_health = capture_health_state(service_name)
    
    log_audit_event(
        db=db,
        incident_id=remediation.incident_id,
        event="ACTION_EXECUTED",
        actor=actor,
        action_id=remediation.action_id,
        details=f"Executing {action_type} on {service_name}",
        extra_metadata={"pre_health": pre_health, "action": action_type}
    )

    # 2. Dispatch to deterministic safe function
    try:
        action_enum = ActionEnum(action_type)
    except ValueError:
        return False, pre_health, pre_health, f"Action {action_type} is not whitelisted"

    if action_enum == ActionEnum.rollback_deployment:
        fn_rollback_deployment(service_name, remediation.target_version or "v1.4")
    elif action_enum == ActionEnum.restart_service:
        fn_restart_service(service_name)
    elif action_enum == ActionEnum.scale_service:
        fn_scale_service(service_name, remediation.replicas or 3)
    elif action_enum == ActionEnum.clear_cache:
        fn_clear_cache(service_name)
    elif action_enum == ActionEnum.disable_dependency:
        fn_disable_dependency(service_name, "external-payment-provider")

    # Brief delay for synthetic state convergence
    time.sleep(0.5)

    # 3. Capture Post-action Health
    post_health = capture_health_state(service_name)

    # 4. Verify Health Metric
    verification_spec = remediation.verification or {}
    metric_name = verification_spec.get("metric", "error_rate")
    
    # Check verification criteria
    verified = post_health.get("healthy", False)
    if metric_name == "error_rate":
        verified = post_health.get("error_rate", 1.0) < 0.05
    elif metric_name == "cpu_utilization":
        verified = post_health.get("cpu_percent", 100.0) < 60.0
    elif metric_name == "memory_utilization":
        verified = post_health.get("memory_mb", 1000) < 500

    log_audit_event(
        db=db,
        incident_id=remediation.incident_id,
        event="HEALTH_CHECK",
        actor="system",
        action_id=remediation.action_id,
        details=f"Health check for {service_name}: {'PASSED' if verified else 'FAILED'}",
        extra_metadata={"post_health": post_health, "verified": verified}
    )

    if verified:
        remediation.status = "VERIFIED"
        # Mark incident resolved
        inc = db.query(IncidentModel).filter(IncidentModel.incident_id == remediation.incident_id).first()
        if inc:
            inc.status = "RESOLVED"
            log_audit_event(
                db=db,
                incident_id=inc.incident_id,
                event="INCIDENT_RESOLVED",
                actor="system",
                action_id=remediation.action_id,
                details=f"Incident {inc.incident_id} successfully mitigated and verified in sandbox."
            )
        db.commit()
        return True, pre_health, post_health, "Remediation verified successfully"
    else:
        # Automatic Rollback
        remediation.status = "FAILED"
        db.commit()
        rollback_success, post_rollback_health = rollback_sandbox_action(db, remediation, actor="system (auto-rollback)")
        return False, pre_health, post_rollback_health, "Health check failed; auto-rollback executed"

def rollback_sandbox_action(
    db: Session,
    remediation: RemediationModel,
    actor: str = "human"
) -> Tuple[bool, Dict[str, Any]]:
    """
    Rolls back the executed remediation to previous known state.
    """
    service_name = remediation.service
    svc = SANDBOX_STATE.setdefault(service_name, {})
    
    # Restore previous configuration
    if remediation.current_version:
        svc["version"] = remediation.current_version
    svc["healthy"] = False
    svc["error_rate"] = 0.15

    post_health = capture_health_state(service_name)
    remediation.status = "ROLLED_BACK"
    
    log_audit_event(
        db=db,
        incident_id=remediation.incident_id,
        event="ROLLBACK_EXECUTED",
        actor=actor,
        action_id=remediation.action_id,
        details=f"Rollback completed for {service_name}. Restored pre-action baseline.",
        extra_metadata={"post_health": post_health}
    )
    db.commit()
    return True, post_health
