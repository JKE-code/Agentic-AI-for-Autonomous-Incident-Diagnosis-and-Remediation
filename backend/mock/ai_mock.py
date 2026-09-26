from typing import Dict, Any

MOCK_DIAGNOSES: Dict[str, Dict[str, Any]] = {
    "INC-001": {
        "incident_id": "INC-001",
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T10:41:00Z", "service": "payment-service", "event": "Deployment v1.5 finished", "source": "deployments"},
            {"timestamp": "2026-09-26T10:42:15Z", "service": "payment-service", "event": "HTTP 500 error rate surged from 0.1% to 18.7%", "source": "metrics"},
            {"timestamp": "2026-09-26T10:43:00Z", "service": "api-gateway", "event": "Elevated 502/504 errors on /checkout endpoint", "source": "logs"},
            {"timestamp": "2026-09-26T10:43:40Z", "service": "payment-service", "event": "NullPointer in PaymentProcessor.execute()", "source": "logs"},
            {"timestamp": "2026-09-26T10:44:10Z", "service": "payment-service", "event": "Trace span error status 500 on POST /process-payment", "source": "traces"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": "HYP-001",
                "cause": "Bad deployment of payment-service v1.5 containing unhandled null reference",
                "service": "payment-service",
                "score": 0.92,
                "confidence": 0.94,
                "supporting_evidence": ["E-001", "E-002", "E-003", "E-004"],
                "contradicting_evidence": [],
                "tests": ["Compare deployment timestamp with error spike", "Verify trace stacktrace", "Check rollback safety"],
                "status": "VERIFIED"
            },
            {
                "hypothesis_id": "HYP-002",
                "cause": "Database connection pool exhaustion on payment-db",
                "service": "payment-db",
                "score": 0.35,
                "confidence": 0.30,
                "supporting_evidence": [],
                "contradicting_evidence": ["E-005"],
                "tests": ["Check active DB connection counts"],
                "status": "RULED_OUT"
            },
            {
                "hypothesis_id": "HYP-003",
                "cause": "Upstream API Gateway configuration mismatch",
                "service": "api-gateway",
                "score": 0.18,
                "confidence": 0.20,
                "supporting_evidence": [],
                "contradicting_evidence": ["E-001"],
                "tests": ["Inspect gateway routing tables"],
                "status": "RULED_OUT"
            }
        ],
        "root_cause": {
            "hypothesis_id": "HYP-001",
            "cause": "BAD_DEPLOYMENT",
            "service": "payment-service",
            "summary": "Deployment v1.5 introduced a null pointer defect triggering 18.7% 500 errors on payment execution immediately post-release."
        },
        "evidence": [
            {
                "evidence_id": "E-001",
                "source": "deployments",
                "timestamp": "2026-09-26T10:41:00Z",
                "service": "payment-service",
                "observation": "payment-service deployed release v1.5 (commit 8f2a1b) at 10:41:00Z",
                "importance": 0.95,
                "supports": ["HYP-001"],
                "contradicts": ["HYP-003"],
                "confidence": 0.98
            },
            {
                "evidence_id": "E-002",
                "source": "metrics",
                "timestamp": "2026-09-26T10:42:15Z",
                "service": "payment-service",
                "observation": "HTTP 500 error rate surged from 0.1% to 18.7% within 75s of deployment",
                "importance": 0.92,
                "supports": ["HYP-001"],
                "contradicts": [],
                "confidence": 0.95
            },
            {
                "evidence_id": "E-003",
                "source": "logs",
                "timestamp": "2026-09-26T10:43:40Z",
                "service": "payment-service",
                "observation": "java.lang.NullPointerException at PaymentProcessor.execute(PaymentProcessor.java:84)",
                "importance": 0.96,
                "supports": ["HYP-001"],
                "contradicts": [],
                "confidence": 0.99
            },
            {
                "evidence_id": "E-004",
                "source": "traces",
                "timestamp": "2026-09-26T10:44:10Z",
                "service": "payment-service",
                "observation": "Spans for /process-payment fail with code 500 immediately at internal call",
                "importance": 0.88,
                "supports": ["HYP-001"],
                "contradicts": [],
                "confidence": 0.92
            },
            {
                "evidence_id": "E-005",
                "source": "metrics",
                "timestamp": "2026-09-26T10:43:00Z",
                "service": "payment-db",
                "observation": "Database connections steady at 22/100, query response time normal (14ms)",
                "importance": 0.80,
                "supports": [],
                "contradicts": ["HYP-002"],
                "confidence": 0.90
            }
        ],
        "remediation": {
            "action_id": "ACT-001",
            "action": "rollback_deployment",
            "service": "payment-service",
            "target_service": "payment-service",
            "current_version": "v1.5",
            "target_version": "v1.4",
            "risk": "MEDIUM",
            "risk_level": "MEDIUM",
            "reversible": True,
            "expected_effect": "Revert payment-service to stable v1.4; reduce error rate from 18.7% to < 0.2%",
            "explanation": "Rollback payment-service image from faulty v1.5 back to verified stable release v1.4. This restores the functional payment gateway configuration and halts the NullPointerException error storm.",
            "rollback_plan": "If rollback fails verification, drain traffic to backup payment sandbox and alert on-call engineer.",
            "verification": {
                "metric": "error_rate",
                "threshold": "< 2%"
            },
            "health_before": {
                "error_rate": 18.72,
                "latency_p99_ms": 4850,
                "throughput_rps": 420
            },
            "health_after": {
                "error_rate": 0.15,
                "latency_p99_ms": 115,
                "throughput_rps": 680
            },
            "pre_health": {
                "error_rate": 18.72,
                "latency_p99_ms": 4850,
                "throughput_rps": 420
            },
            "post_health": {
                "error_rate": 0.15,
                "latency_p99_ms": 115,
                "throughput_rps": 680
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.94,
        "requires_more_data": False,
        "audit_events": []
    },
    "INC-002": {
        "incident_id": "INC-002",
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T11:10:00Z", "service": "orders-db", "event": "DB Connection count exceeded 95%", "source": "metrics"},
            {"timestamp": "2026-09-26T11:11:30Z", "service": "order-service", "event": "ConnectionPoolTimeoutException waiting for connection", "source": "logs"},
            {"timestamp": "2026-09-26T11:12:00Z", "service": "order-service", "event": "P99 order creation latency reached 4800ms", "source": "traces"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": "HYP-201",
                "cause": "Database connection pool exhaustion on orders-db",
                "service": "orders-db",
                "score": 0.94,
                "confidence": 0.96,
                "supporting_evidence": ["E-201", "E-202"],
                "contradicting_evidence": [],
                "tests": ["Inspect idle connection leak", "Check connection pool ceiling"],
                "status": "VERIFIED"
            }
        ],
        "root_cause": {
            "hypothesis_id": "HYP-201",
            "cause": "DB_CONNECTION_EXHAUSTION",
            "service": "orders-db",
            "summary": "Connection leak in unclosed transactions caused pool saturation at 100/100 connections."
        },
        "evidence": [
            {
                "evidence_id": "E-201",
                "source": "metrics",
                "timestamp": "2026-09-26T11:10:00Z",
                "service": "orders-db",
                "observation": "Active connections: 98/100 (98% saturation)",
                "importance": 0.95,
                "supports": ["HYP-201"],
                "contradicts": [],
                "confidence": 0.98
            },
            {
                "evidence_id": "E-202",
                "source": "logs",
                "timestamp": "2026-09-26T11:11:30Z",
                "service": "order-service",
                "observation": "Timeout: connection acquisition timed out after 30000ms",
                "importance": 0.94,
                "supports": ["HYP-201"],
                "contradicts": [],
                "confidence": 0.97
            }
        ],
        "remediation": {
            "action_id": "ACT-002",
            "action": "restart_service",
            "service": "order-service",
            "target_service": "order-service",
            "risk": "MEDIUM",
            "risk_level": "MEDIUM",
            "reversible": True,
            "expected_effect": "Recycle leaked connections and re-initialize connection pool to orders-db",
            "explanation": "Restart order-service to release abandoned DB connections and reset connection pool to orders-db.",
            "rollback_plan": "If connection saturation returns, scale orders-db connection limits and pool size.",
            "verification": {
                "metric": "db_connections",
                "threshold": "< 40%"
            },
            "health_before": {
                "error_rate": 8.20,
                "latency_p99_ms": 3200,
                "throughput_rps": 310
            },
            "health_after": {
                "error_rate": 0.08,
                "latency_p99_ms": 92,
                "throughput_rps": 620
            },
            "pre_health": {
                "error_rate": 8.20,
                "latency_p99_ms": 3200,
                "throughput_rps": 310
            },
            "post_health": {
                "error_rate": 0.08,
                "latency_p99_ms": 92,
                "throughput_rps": 620
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.96,
        "requires_more_data": False,
        "audit_events": []
    },
    "INC-003": {
        "incident_id": "INC-003",
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T09:00:00Z", "service": "payment-service", "event": "Heap memory steadily climbing (slope +15MB/min)", "source": "metrics"},
            {"timestamp": "2026-09-26T09:45:00Z", "service": "payment-service", "event": "JVM Garbage collection pause exceeded 4200ms", "source": "metrics"},
            {"timestamp": "2026-09-26T09:48:12Z", "service": "payment-service", "event": "Container OOMKilled (Exit Code 137)", "source": "logs"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": "HYP-301",
                "cause": "Unbounded cache growth causing memory leak and OOM termination",
                "service": "payment-service",
                "score": 0.95,
                "confidence": 0.96,
                "supporting_evidence": ["E-301", "E-302"],
                "contradicting_evidence": [],
                "tests": ["Analyze heap profile", "Confirm OOM kill event"],
                "status": "VERIFIED"
            }
        ],
        "root_cause": {
            "hypothesis_id": "HYP-301",
            "cause": "MEMORY_LEAK",
            "service": "payment-service",
            "summary": "Memory leak in transaction cache caused progressive heap exhaustion culminating in OOM kill."
        },
        "evidence": [
            {
                "evidence_id": "E-301",
                "source": "metrics",
                "timestamp": "2026-09-26T09:00:00Z",
                "service": "payment-service",
                "observation": "Memory utilization continuously climbed from 35% to 99% without deallocating",
                "importance": 0.96,
                "supports": ["HYP-301"],
                "contradicts": [],
                "confidence": 0.98
            },
            {
                "evidence_id": "E-302",
                "source": "logs",
                "timestamp": "2026-09-26T09:48:12Z",
                "service": "payment-service",
                "observation": "kernel: Out of memory: Killed process payment-service (exit 137)",
                "importance": 0.99,
                "supports": ["HYP-301"],
                "contradicts": [],
                "confidence": 1.0
            }
        ],
        "remediation": {
            "action_id": "ACT-003",
            "action": "restart_service",
            "service": "payment-service",
            "target_service": "payment-service",
            "risk": "LOW",
            "risk_level": "LOW",
            "reversible": True,
            "expected_effect": "Reboot container to clear exhausted heap; temporarily mitigate OOM loop",
            "explanation": "Restart payment-service to reclaim heap memory and clear corrupted cache buffers.",
            "rollback_plan": "Scale memory allocation limit and deploy heap dump sidecar.",
            "verification": {
                "metric": "memory_utilization",
                "threshold": "< 50%"
            },
            "health_before": {
                "error_rate": 12.40,
                "latency_p99_ms": 2900,
                "throughput_rps": 280
            },
            "health_after": {
                "error_rate": 0.10,
                "latency_p99_ms": 105,
                "throughput_rps": 640
            },
            "pre_health": {
                "error_rate": 12.40,
                "latency_p99_ms": 2900,
                "throughput_rps": 280
            },
            "post_health": {
                "error_rate": 0.10,
                "latency_p99_ms": 105,
                "throughput_rps": 640
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.96,
        "requires_more_data": False,
        "audit_events": []
    },
    "INC-004": {
        "incident_id": "INC-004",
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T08:15:00Z", "service": "external-payment-provider", "event": "Third-party gateway latency increased to 12000ms", "source": "traces"},
            {"timestamp": "2026-09-26T08:16:30Z", "service": "payment-service", "event": "Thread pool saturation awaiting external response", "source": "metrics"},
            {"timestamp": "2026-09-26T08:17:00Z", "service": "payment-service", "event": "GatewayTimeout on outbound API calls", "source": "logs"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": "HYP-401",
                "cause": "External payment gateway outage causing cascading upstream timeouts",
                "service": "payment-service",
                "score": 0.93,
                "confidence": 0.95,
                "supporting_evidence": ["E-401"],
                "contradicting_evidence": [],
                "tests": ["Check external provider health dashboard", "Trace outbound call durations"],
                "status": "VERIFIED"
            }
        ],
        "root_cause": {
            "hypothesis_id": "HYP-401",
            "cause": "DOWNSTREAM_FAILURE",
            "service": "payment-service",
            "summary": "External payment vendor API degraded, causing thread pool depletion."
        },
        "evidence": [
            {
                "evidence_id": "E-401",
                "source": "traces",
                "timestamp": "2026-09-26T08:15:00Z",
                "service": "payment-service",
                "observation": "Spans calling external vendor timeout after 10000ms threshold",
                "importance": 0.94,
                "supports": ["HYP-401"],
                "contradicts": [],
                "confidence": 0.97
            }
        ],
        "remediation": {
            "action_id": "ACT-004",
            "action": "disable_dependency",
            "service": "payment-service",
            "target_service": "payment-service",
            "risk": "HIGH",
            "risk_level": "HIGH",
            "reversible": True,
            "expected_effect": "Fail-fast on primary provider and reroute to secondary backup payment provider",
            "explanation": "Trip circuit breaker to fail-fast on degraded external payment vendor and divert to secondary provider.",
            "rollback_plan": "Re-enable primary provider once vendor status returns to healthy.",
            "verification": {
                "metric": "payment_success_rate",
                "threshold": "> 95%"
            },
            "health_before": {
                "error_rate": 14.80,
                "latency_p99_ms": 5200,
                "throughput_rps": 250
            },
            "health_after": {
                "error_rate": 0.18,
                "latency_p99_ms": 135,
                "throughput_rps": 590
            },
            "pre_health": {
                "error_rate": 14.80,
                "latency_p99_ms": 5200,
                "throughput_rps": 250
            },
            "post_health": {
                "error_rate": 0.18,
                "latency_p99_ms": 135,
                "throughput_rps": 590
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.95,
        "requires_more_data": False,
        "audit_events": []
    },
    "INC-005": {
        "incident_id": "INC-005",
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T12:00:00Z", "service": "order-service", "event": "CPU usage spiked to 97%", "source": "metrics"},
            {"timestamp": "2026-09-26T12:01:10Z", "service": "order-service", "event": "Incoming order queue length increased to 4200", "source": "metrics"},
            {"timestamp": "2026-09-26T12:02:00Z", "service": "order-service", "event": "P99 latency degraded from 80ms to 2400ms", "source": "traces"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": "HYP-501",
                "cause": "CPU saturation under flash traffic surge causing request queueing",
                "service": "order-service",
                "score": 0.96,
                "confidence": 0.97,
                "supporting_evidence": ["E-501", "E-502"],
                "contradicting_evidence": [],
                "tests": ["Check replica count vs CPU threshold", "Inspect request queue depth"],
                "status": "VERIFIED"
            }
        ],
        "root_cause": {
            "hypothesis_id": "HYP-501",
            "cause": "CPU_SATURATION",
            "service": "order-service",
            "summary": "Flash traffic surge overwhelmed existing single replica of order-service."
        },
        "evidence": [
            {
                "evidence_id": "E-501",
                "source": "metrics",
                "timestamp": "2026-09-26T12:00:00Z",
                "service": "order-service",
                "observation": "CPU utilization reached 97.4% on single container pod",
                "importance": 0.95,
                "supports": ["HYP-501"],
                "contradicts": [],
                "confidence": 0.98
            },
            {
                "evidence_id": "E-502",
                "source": "metrics",
                "timestamp": "2026-09-26T12:01:10Z",
                "service": "order-service",
                "observation": "Pending task queue grew from 12 to 4200 items",
                "importance": 0.90,
                "supports": ["HYP-501"],
                "contradicts": [],
                "confidence": 0.95
            }
        ],
        "remediation": {
            "action_id": "ACT-005",
            "action": "scale_service",
            "service": "order-service",
            "target_service": "order-service",
            "replicas": 4,
            "risk": "LOW",
            "risk_level": "LOW",
            "reversible": True,
            "expected_effect": "Horizontally scale order-service from 1 to 4 replicas; drop CPU to < 40%",
            "explanation": "Scale order-service horizontally to 4 replicas to relieve CPU saturation and drain pending queue.",
            "rollback_plan": "Scale back down once order queue depth drops below 100.",
            "verification": {
                "metric": "cpu_utilization",
                "threshold": "< 50%"
            },
            "health_before": {
                "error_rate": 9.50,
                "latency_p99_ms": 2400,
                "throughput_rps": 350
            },
            "health_after": {
                "error_rate": 0.05,
                "latency_p99_ms": 78,
                "throughput_rps": 750
            },
            "pre_health": {
                "error_rate": 9.50,
                "latency_p99_ms": 2400,
                "throughput_rps": 350
            },
            "post_health": {
                "error_rate": 0.05,
                "latency_p99_ms": 78,
                "throughput_rps": 750
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.97,
        "requires_more_data": False,
        "audit_events": []
    },
    "INC-006": {
        "incident_id": "INC-006",
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T07:20:00Z", "service": "api-gateway", "event": "RTT to inventory-service jumped from 4ms to 850ms", "source": "metrics"},
            {"timestamp": "2026-09-26T07:21:00Z", "service": "api-gateway", "event": "TCP retransmission rate rose to 12%", "source": "logs"},
            {"timestamp": "2026-09-26T07:22:00Z", "service": "inventory-service", "event": "Node CPU and memory remain normal (< 25%)", "source": "metrics"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": "HYP-601",
                "cause": "Inter-service network routing latency degradation",
                "service": "inventory-service",
                "score": 0.88,
                "confidence": 0.90,
                "supporting_evidence": ["E-601"],
                "contradicting_evidence": [],
                "tests": ["Ping RTT check", "Verify node interface packet drops"],
                "status": "VERIFIED"
            }
        ],
        "root_cause": {
            "hypothesis_id": "HYP-601",
            "cause": "NETWORK_LATENCY",
            "service": "inventory-service",
            "summary": "Virtual bridge interface degradation causing 850ms round-trip latency."
        },
        "evidence": [
            {
                "evidence_id": "E-601",
                "source": "metrics",
                "timestamp": "2026-09-26T07:20:00Z",
                "service": "api-gateway",
                "observation": "Inter-service network latency increased from 4ms to 850ms",
                "importance": 0.91,
                "supports": ["HYP-601"],
                "contradicts": [],
                "confidence": 0.93
            }
        ],
        "remediation": {
            "action_id": "ACT-006",
            "action": "restart_service",
            "service": "inventory-service",
            "target_service": "inventory-service",
            "risk": "LOW",
            "risk_level": "LOW",
            "reversible": True,
            "expected_effect": "Cycle network virtual socket interface and clear socket table",
            "explanation": "Restart inventory-service container to flush virtual bridge network routing cache.",
            "rollback_plan": "Reroute traffic to secondary AZ instance if latency persists.",
            "verification": {
                "metric": "network_latency",
                "threshold": "< 20ms"
            },
            "health_before": {
                "error_rate": 4.50,
                "latency_p99_ms": 850,
                "throughput_rps": 500
            },
            "health_after": {
                "error_rate": 0.02,
                "latency_p99_ms": 12,
                "throughput_rps": 720
            },
            "pre_health": {
                "error_rate": 4.50,
                "latency_p99_ms": 850,
                "throughput_rps": 500
            },
            "post_health": {
                "error_rate": 0.02,
                "latency_p99_ms": 12,
                "throughput_rps": 720
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.90,
        "requires_more_data": False,
        "audit_events": []
    }
}

def get_mock_diagnosis(incident_id: str) -> Dict[str, Any]:
    if incident_id in MOCK_DIAGNOSES:
        return MOCK_DIAGNOSES[incident_id]
    
    # Generic fallback
    return {
        "incident_id": incident_id,
        "status": "DIAGNOSIS_COMPLETE",
        "timeline": [
            {"timestamp": "2026-09-26T10:00:00Z", "service": "api-gateway", "event": "Elevated error rate detected", "source": "metrics"}
        ],
        "hypotheses": [
            {
                "hypothesis_id": f"HYP-{incident_id}-01",
                "cause": "Transient workload degradation",
                "service": "api-gateway",
                "score": 0.85,
                "confidence": 0.88,
                "supporting_evidence": ["E-GEN-01"],
                "contradicting_evidence": [],
                "tests": ["Check endpoint response times"],
                "status": "VERIFIED"
            }
        ],
        "root_cause": {
            "hypothesis_id": f"HYP-{incident_id}-01",
            "cause": "TRANSIENT_DEGRADATION",
            "service": "api-gateway",
            "summary": "Elevated traffic created brief queuing delay on api-gateway."
        },
        "evidence": [
            {
                "evidence_id": "E-GEN-01",
                "source": "metrics",
                "timestamp": "2026-09-26T10:00:00Z",
                "service": "api-gateway",
                "observation": "Error rate elevated above baseline",
                "importance": 0.85,
                "supports": [f"HYP-{incident_id}-01"],
                "contradicts": [],
                "confidence": 0.88
            }
        ],
        "remediation": {
            "action_id": f"ACT-{incident_id}",
            "action": "restart_service",
            "service": "api-gateway",
            "risk": "LOW",
            "reversible": True,
            "expected_effect": "Restart container to clear transient socket contention",
            "verification": {
                "metric": "error_rate",
                "threshold": "< 1%"
            },
            "requires_approval": True,
            "status": "PENDING_APPROVAL"
        },
        "confidence": 0.88,
        "requires_more_data": False,
        "audit_events": []
    }
