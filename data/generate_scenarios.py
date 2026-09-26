import os
import json
from datetime import datetime, timedelta

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
SCENARIOS_DIR = os.path.join(DATA_DIR, "scenarios")
GROUND_TRUTH_DIR = os.path.join(DATA_DIR, "ground_truth")

os.makedirs(SCENARIOS_DIR, exist_ok=True)
os.makedirs(GROUND_TRUTH_DIR, exist_ok=True)

COMMON_DEPENDENCIES = [
    {"source": "api-gateway", "target": "auth-service", "type": "sync_http", "critical": True},
    {"source": "api-gateway", "target": "order-service", "type": "sync_http", "critical": True},
    {"source": "api-gateway", "target": "payment-service", "type": "sync_http", "critical": True},
    {"source": "order-service", "target": "inventory-service", "type": "sync_http", "critical": True},
    {"source": "order-service", "target": "orders-db", "type": "database", "critical": True},
    {"source": "order-service", "target": "payment-service", "type": "sync_http", "critical": True},
    {"source": "payment-service", "target": "payment-db", "type": "database", "critical": True},
    {"source": "payment-service", "target": "external-payment-provider", "type": "external_api", "critical": False}
]

def make_iso(base_time: datetime, offset_seconds: int) -> str:
    return (base_time + timedelta(seconds=offset_seconds)).strftime("%Y-%m-%dT%H:%M:%SZ")

def generate_scenario_1():
    # INC-001: Bad Deployment
    base = datetime(2026, 9, 26, 10, 40, 0)
    incident = {
        "incident_id": "INC-001",
        "title": "Payment failures and HTTP 500 spike after deployment",
        "severity": "CRITICAL",
        "started_at": make_iso(base, 62), # 10:41:02
        "services": ["api-gateway", "payment-service", "payment-db"],
        "logs": [
            {"timestamp": make_iso(base, 0), "service": "payment-service", "level": "INFO", "message": "payment-service v1.4 healthy, handling 240 req/min"},
            {"timestamp": make_iso(base, 62), "service": "payment-service", "level": "INFO", "message": "Deployment v1.5 activation complete. Starting worker processes."},
            {"timestamp": make_iso(base, 75), "service": "payment-service", "level": "WARN", "message": "Deprecated payment schema detected in request payload"},
            {"timestamp": make_iso(base, 80), "service": "payment-service", "level": "ERROR", "message": "NullPointerException at com.pay.handler.v15.CheckoutHandler.processPayment (CheckoutHandler.java:142)", "trace_id": "tr-pay-001", "error_code": "ERR_NULL_PTR"},
            {"timestamp": make_iso(base, 90), "service": "payment-service", "level": "FATAL", "message": "Failed to serialize payment token: Incompatible schema version v1.5", "trace_id": "tr-pay-002", "error_code": "ERR_SCHEMA_INCOMPAT"},
            {"timestamp": make_iso(base, 105), "service": "api-gateway", "level": "ERROR", "message": "Upstream service payment-service returned HTTP 500 Internal Server Error", "trace_id": "tr-gw-101"},
            {"timestamp": make_iso(base, 120), "service": "payment-service", "level": "ERROR", "message": "High failure rate: 42/50 checkout requests failing in v1.5 container", "error_code": "ERR_CHECKOUT_FAILED"}
        ],
        "metrics": [
            {"timestamp": make_iso(base, 0), "service": "payment-service", "metric_name": "error_rate", "value": 0.002, "unit": "percentage"},
            {"timestamp": make_iso(base, 60), "service": "payment-service", "metric_name": "error_rate", "value": 0.005, "unit": "percentage"},
            {"timestamp": make_iso(base, 90), "service": "payment-service", "metric_name": "error_rate", "value": 0.187, "unit": "percentage"},
            {"timestamp": make_iso(base, 120), "service": "payment-service", "metric_name": "error_rate", "value": 0.235, "unit": "percentage"},
            {"timestamp": make_iso(base, 0), "service": "payment-service", "metric_name": "latency_p95", "value": 45.0, "unit": "ms"},
            {"timestamp": make_iso(base, 90), "service": "payment-service", "metric_name": "latency_p95", "value": 1150.0, "unit": "ms"},
            {"timestamp": make_iso(base, 90), "service": "payment-service", "metric_name": "cpu_utilization", "value": 24.5, "unit": "percentage"},
            {"timestamp": make_iso(base, 90), "service": "payment-db", "metric_name": "db_connections", "value": 15.0, "unit": "count"}
        ],
        "traces": [
            {"trace_id": "tr-pay-001", "span_id": "sp-gw-1", "parent_span_id": None, "service": "api-gateway", "operation": "POST /api/pay", "duration_ms": 1180.0, "status_code": 500, "timestamp": make_iso(base, 80), "error": True, "error_message": "Upstream 500"},
            {"trace_id": "tr-pay-001", "span_id": "sp-pay-1", "parent_span_id": "sp-gw-1", "service": "payment-service", "operation": "CheckoutHandler.processPayment", "duration_ms": 1160.0, "status_code": 500, "timestamp": make_iso(base, 80), "error": True, "error_message": "NullPointerException at CheckoutHandler.java:142"},
            {"trace_id": "tr-pay-001", "span_id": "sp-db-1", "parent_span_id": "sp-pay-1", "service": "payment-db", "operation": "SELECT account_balance", "duration_ms": 4.5, "status_code": 200, "timestamp": make_iso(base, 80), "error": False}
        ],
        "deployments": [
            {"deployment_id": "dep-092", "service": "payment-service", "version": "v1.4", "previous_version": "v1.3", "deployed_at": make_iso(base, -86400), "status": "SUCCESS", "commit_hash": "a4f891b", "changelog": "Standard billing maintenance"},
            {"deployment_id": "dep-093", "service": "payment-service", "version": "v1.5", "previous_version": "v1.4", "deployed_at": make_iso(base, 62), "status": "SUCCESS", "commit_hash": "c91e48f", "changelog": "New payment serialization logic and updated SDK"}
        ],
        "dependencies": COMMON_DEPENDENCIES
    }
    gt = {
        "scenario_id": "INC-001",
        "root_cause": "BAD_DEPLOYMENT",
        "affected_service": "payment-service",
        "expected_remediation": "rollback_deployment",
        "remediation_parameters": {"service": "payment-service", "target_version": "v1.4"},
        "key_evidence_signatures": ["deployment_47s_before_spike", "v1.5_NullPointerException", "error_rate_18pct"]
    }
    return incident, gt

def generate_scenario_2():
    # INC-002: Database Connection Exhaustion
    base = datetime(2026, 9, 26, 11, 15, 0)
    incident = {
        "incident_id": "INC-002",
        "title": "Database timeouts and connection pool exhaustion in orders service",
        "severity": "CRITICAL",
        "started_at": make_iso(base, 90),
        "services": ["order-service", "orders-db", "api-gateway"],
        "logs": [
            {"timestamp": make_iso(base, 30), "service": "orders-db", "level": "WARN", "message": "Connection pool usage exceeded 85% (425/500 connections in use)"},
            {"timestamp": make_iso(base, 90), "service": "orders-db", "level": "FATAL", "message": "max_connections reached (500/500). Rejecting incoming client sockets", "error_code": "ERR_TOO_MANY_CONNECTIONS"},
            {"timestamp": make_iso(base, 95), "service": "order-service", "level": "ERROR", "message": "HikariPool-1 - Connection is not available, request timed out after 30000ms", "trace_id": "tr-db-timeout-1", "error_code": "SQL_POOL_EXHAUSTED"},
            {"timestamp": make_iso(base, 110), "service": "order-service", "level": "ERROR", "message": "Unable to acquire JDBC Connection to orders-db. Transaction rollback initiated", "trace_id": "tr-db-timeout-2"},
            {"timestamp": make_iso(base, 130), "service": "api-gateway", "level": "ERROR", "message": "Order creation failed: HTTP 504 Gateway Timeout from order-service", "trace_id": "tr-gw-202"}
        ],
        "metrics": [
            {"timestamp": make_iso(base, 0), "service": "orders-db", "metric_name": "db_connections_active", "value": 180.0, "unit": "count"},
            {"timestamp": make_iso(base, 60), "service": "orders-db", "metric_name": "db_connections_active", "value": 410.0, "unit": "count"},
            {"timestamp": make_iso(base, 90), "service": "orders-db", "metric_name": "db_connections_active", "value": 500.0, "unit": "count"},
            {"timestamp": make_iso(base, 120), "service": "orders-db", "metric_name": "db_connections_active", "value": 500.0, "unit": "count"},
            {"timestamp": make_iso(base, 90), "service": "orders-db", "metric_name": "pool_exhaustion_ratio", "value": 1.0, "unit": "ratio"},
            {"timestamp": make_iso(base, 90), "service": "order-service", "metric_name": "db_query_latency_p95", "value": 31200.0, "unit": "ms"},
            {"timestamp": make_iso(base, 90), "service": "order-service", "metric_name": "cpu_utilization", "value": 18.0, "unit": "percentage"}
        ],
        "traces": [
            {"trace_id": "tr-db-timeout-1", "span_id": "sp-gw-2", "parent_span_id": None, "service": "api-gateway", "operation": "POST /api/orders", "duration_ms": 30200.0, "status_code": 504, "timestamp": make_iso(base, 95), "error": True, "error_message": "Gateway Timeout"},
            {"trace_id": "tr-db-timeout-1", "span_id": "sp-ord-2", "parent_span_id": "sp-gw-2", "service": "order-service", "operation": "CreateOrderHandler", "duration_ms": 30150.0, "status_code": 500, "timestamp": make_iso(base, 95), "error": True, "error_message": "HikariPool-1 connection acquisition timeout"},
            {"trace_id": "tr-db-timeout-1", "span_id": "sp-db-2", "parent_span_id": "sp-ord-2", "service": "orders-db", "operation": "TCP_CONNECT orders-db:5432", "duration_ms": 30000.0, "status_code": 503, "timestamp": make_iso(base, 95), "error": True, "error_message": "Connection refused / max_connections reached"}
        ],
        "deployments": [
            {"deployment_id": "dep-081", "service": "order-service", "version": "v2.1", "previous_version": "v2.0", "deployed_at": make_iso(base, -259200), "status": "SUCCESS", "commit_hash": "f128bc0", "changelog": "Routine order validation patch"}
        ],
        "dependencies": COMMON_DEPENDENCIES
    }
    gt = {
        "scenario_id": "INC-002",
        "root_cause": "DB_CONNECTION_EXHAUSTION",
        "affected_service": "orders-db",
        "expected_remediation": "restart_service",
        "remediation_parameters": {"service": "orders-db"},
        "key_evidence_signatures": ["max_connections_reached_500", "HikariPool_timeout_30s", "db_connections_100pct"]
    }
    return incident, gt

def generate_scenario_3():
    # INC-003: Memory Leak
    base = datetime(2026, 9, 26, 12, 0, 0)
    incident = {
        "incident_id": "INC-003",
        "title": "Payment service memory leak leading to OOM crash",
        "severity": "CRITICAL",
        "started_at": make_iso(base, 180),
        "services": ["payment-service", "api-gateway"],
        "logs": [
            {"timestamp": make_iso(base, 60), "service": "payment-service", "level": "WARN", "message": "JVM GC pause time elevated: Full GC took 1420ms, reclaimed only 12MB"},
            {"timestamp": make_iso(base, 120), "service": "payment-service", "level": "WARN", "message": "High heap memory utilization: 92% of 3072MB allocated"},
            {"timestamp": make_iso(base, 180), "service": "payment-service", "level": "FATAL", "message": "java.lang.OutOfMemoryError: Java heap space at com.pay.cache.UnboundedTokenStore.put", "error_code": "ERR_OOM"},
            {"timestamp": make_iso(base, 185), "service": "payment-service", "level": "FATAL", "message": "Container received SIGKILL: Out of memory (OOMKilled by Linux kernel cgroup memory controller)"},
            {"timestamp": make_iso(base, 195), "service": "api-gateway", "level": "ERROR", "message": "Connection refused to payment-service:8080 (container crashed)"}
        ],
        "metrics": [
            {"timestamp": make_iso(base, 0), "service": "payment-service", "metric_name": "memory_rss_bytes", "value": 1288490188.0, "unit": "bytes"}, # 1.2 GB
            {"timestamp": make_iso(base, 60), "service": "payment-service", "metric_name": "memory_rss_bytes", "value": 1825361100.0, "unit": "bytes"}, # 1.7 GB
            {"timestamp": make_iso(base, 120), "service": "payment-service", "metric_name": "memory_rss_bytes", "value": 2469606195.0, "unit": "bytes"}, # 2.3 GB
            {"timestamp": make_iso(base, 180), "service": "payment-service", "metric_name": "memory_rss_bytes", "value": 3113851289.0, "unit": "bytes"}, # 2.9 GB
            {"timestamp": make_iso(base, 180), "service": "payment-service", "metric_name": "memory_limit_bytes", "value": 3221225472.0, "unit": "bytes"}, # 3.0 GB
            {"timestamp": make_iso(base, 180), "service": "payment-service", "metric_name": "gc_pause_seconds", "value": 2.45, "unit": "seconds"},
            {"timestamp": make_iso(base, 180), "service": "payment-service", "metric_name": "cpu_utilization", "value": 32.0, "unit": "percentage"}
        ],
        "traces": [
            {"trace_id": "tr-oom-1", "span_id": "sp-gw-3", "parent_span_id": None, "service": "api-gateway", "operation": "POST /api/pay", "duration_ms": 2500.0, "status_code": 502, "timestamp": make_iso(base, 186), "error": True, "error_message": "502 Bad Gateway: Connection reset by peer"}
        ],
        "deployments": [],
        "dependencies": COMMON_DEPENDENCIES
    }
    gt = {
        "scenario_id": "INC-003",
        "root_cause": "MEMORY_LEAK",
        "affected_service": "payment-service",
        "expected_remediation": "restart_service",
        "remediation_parameters": {"service": "payment-service"},
        "key_evidence_signatures": ["monotonic_memory_rss_growth", "java_OutOfMemoryError", "cgroup_OOMKilled"]
    }
    return incident, gt

def generate_scenario_4():
    # INC-004: Downstream Dependency Failure
    base = datetime(2026, 9, 26, 12, 30, 0)
    incident = {
        "incident_id": "INC-004",
        "title": "External payment provider gateway outage",
        "severity": "HIGH",
        "started_at": make_iso(base, 45),
        "services": ["payment-service", "external-payment-provider", "api-gateway"],
        "logs": [
            {"timestamp": make_iso(base, 45), "service": "payment-service", "level": "WARN", "message": "Downstream call to api.stripe-mock.internal timed out after 5000ms"},
            {"timestamp": make_iso(base, 55), "service": "payment-service", "level": "ERROR", "message": "Circuit breaker OPEN for external-payment-provider (failure rate 88% > threshold 50%)", "error_code": "CIRCUIT_BREAKER_OPEN"},
            {"timestamp": make_iso(base, 70), "service": "payment-service", "level": "ERROR", "message": "External payment authorization failed: 504 Gateway Timeout from upstream bank partner", "trace_id": "tr-ext-401"},
            {"timestamp": make_iso(base, 80), "service": "payment-service", "level": "INFO", "message": "Internal payment-service local worker threads healthy, CPU 15%, memory 22%"}
        ],
        "metrics": [
            {"timestamp": make_iso(base, 0), "service": "payment-service", "metric_name": "external_call_latency_p95", "value": 180.0, "unit": "ms"},
            {"timestamp": make_iso(base, 45), "service": "payment-service", "metric_name": "external_call_latency_p95", "value": 4950.0, "unit": "ms"},
            {"timestamp": make_iso(base, 75), "service": "payment-service", "metric_name": "external_call_error_rate", "value": 0.92, "unit": "percentage"},
            {"timestamp": make_iso(base, 75), "service": "payment-service", "metric_name": "cpu_utilization", "value": 15.2, "unit": "percentage"},
            {"timestamp": make_iso(base, 75), "service": "payment-service", "metric_name": "memory_rss_bytes", "value": 524288000.0, "unit": "bytes"}
        ],
        "traces": [
            {"trace_id": "tr-ext-401", "span_id": "sp-gw-4", "parent_span_id": None, "service": "api-gateway", "operation": "POST /api/pay/authorize", "duration_ms": 5050.0, "status_code": 504, "timestamp": make_iso(base, 70), "error": True, "error_message": "Gateway Timeout"},
            {"trace_id": "tr-ext-401", "span_id": "sp-pay-4", "parent_span_id": "sp-gw-4", "service": "payment-service", "operation": "AuthorizePayment", "duration_ms": 5020.0, "status_code": 504, "timestamp": make_iso(base, 70), "error": True, "error_message": "External provider timeout"},
            {"trace_id": "tr-ext-401", "span_id": "sp-ext-4", "parent_span_id": "sp-pay-4", "service": "external-payment-provider", "operation": "POST https://partner.bank.api/v1/charge", "duration_ms": 5000.0, "status_code": 504, "timestamp": make_iso(base, 70), "error": True, "error_message": "SocketTimeoutException: Read timed out"}
        ],
        "deployments": [],
        "dependencies": COMMON_DEPENDENCIES
    }
    gt = {
        "scenario_id": "INC-004",
        "root_cause": "DOWNSTREAM_FAILURE",
        "affected_service": "external-payment-provider",
        "expected_remediation": "disable_dependency",
        "remediation_parameters": {"service": "payment-service", "dependency": "external-payment-provider"},
        "key_evidence_signatures": ["external_provider_504_timeout", "circuit_breaker_open", "internal_service_cpu_healthy"]
    }
    return incident, gt

def generate_scenario_5():
    # INC-005: CPU Saturation
    base = datetime(2026, 9, 26, 12, 45, 0)
    incident = {
        "incident_id": "INC-005",
        "title": "CPU saturation and queue buildup in order service",
        "severity": "HIGH",
        "started_at": make_iso(base, 50),
        "services": ["order-service", "api-gateway"],
        "logs": [
            {"timestamp": make_iso(base, 40), "service": "order-service", "level": "WARN", "message": "Worker thread pool exhaustion warning: 96/100 worker threads busy"},
            {"timestamp": make_iso(base, 55), "service": "order-service", "level": "WARN", "message": "Request queue size backing up: queue depth 380 items (normal < 10)"},
            {"timestamp": make_iso(base, 75), "service": "order-service", "level": "ERROR", "message": "Request rejected due to thread pool saturation: ThreadPoolExecutor rejected ExecutionException", "error_code": "ERR_THREAD_SATURATION"},
            {"timestamp": make_iso(base, 90), "service": "api-gateway", "level": "ERROR", "message": "HTTP 503 Service Unavailable received from order-service"}
        ],
        "metrics": [
            {"timestamp": make_iso(base, 0), "service": "order-service", "metric_name": "cpu_utilization", "value": 28.0, "unit": "percentage"},
            {"timestamp": make_iso(base, 40), "service": "order-service", "metric_name": "cpu_utilization", "value": 78.5, "unit": "percentage"},
            {"timestamp": make_iso(base, 60), "service": "order-service", "metric_name": "cpu_utilization", "value": 98.4, "unit": "percentage"},
            {"timestamp": make_iso(base, 90), "service": "order-service", "metric_name": "cpu_utilization", "value": 99.1, "unit": "percentage"},
            {"timestamp": make_iso(base, 90), "service": "order-service", "metric_name": "queue_depth", "value": 420.0, "unit": "count"},
            {"timestamp": make_iso(base, 90), "service": "order-service", "metric_name": "latency_p95", "value": 1850.0, "unit": "ms"},
            {"timestamp": make_iso(base, 90), "service": "orders-db", "metric_name": "cpu_utilization", "value": 14.0, "unit": "percentage"}
        ],
        "traces": [
            {"trace_id": "tr-cpu-501", "span_id": "sp-gw-5", "parent_span_id": None, "service": "api-gateway", "operation": "POST /api/orders/batch", "duration_ms": 1900.0, "status_code": 503, "timestamp": make_iso(base, 75), "error": True, "error_message": "Service Unavailable"},
            {"trace_id": "tr-cpu-501", "span_id": "sp-ord-5", "parent_span_id": "sp-gw-5", "service": "order-service", "operation": "BatchOrderProcessor", "duration_ms": 1880.0, "status_code": 503, "timestamp": make_iso(base, 75), "error": True, "error_message": "Thread pool rejected task"}
        ],
        "deployments": [],
        "dependencies": COMMON_DEPENDENCIES
    }
    gt = {
        "scenario_id": "INC-005",
        "root_cause": "CPU_SATURATION",
        "affected_service": "order-service",
        "expected_remediation": "scale_service",
        "remediation_parameters": {"service": "order-service", "replicas": 4},
        "key_evidence_signatures": ["order_service_cpu_99pct", "queue_depth_420", "thread_pool_exhaustion"]
    }
    return incident, gt

def generate_scenario_6():
    # INC-006: Network Latency
    base = datetime(2026, 9, 26, 13, 0, 0)
    incident = {
        "incident_id": "INC-006",
        "title": "Inter-service network latency spike between API Gateway and Order Service",
        "severity": "MEDIUM",
        "started_at": make_iso(base, 35),
        "services": ["api-gateway", "order-service"],
        "logs": [
            {"timestamp": make_iso(base, 35), "service": "api-gateway", "level": "WARN", "message": "High TCP RTT observed connecting to order-service pod subnet (rtt=850ms)"},
            {"timestamp": make_iso(base, 50), "service": "api-gateway", "level": "WARN", "message": "Client request roundtrip degraded to 920ms despite backend processing taking only 12ms"},
            {"timestamp": make_iso(base, 65), "service": "order-service", "level": "INFO", "message": "Local order processing nominal (average CPU 16%, internal dispatch 11ms)"}
        ],
        "metrics": [
            {"timestamp": make_iso(base, 0), "service": "api-gateway", "metric_name": "network_rtt_order_service", "value": 2.1, "unit": "ms"},
            {"timestamp": make_iso(base, 40), "service": "api-gateway", "metric_name": "network_rtt_order_service", "value": 850.0, "unit": "ms"},
            {"timestamp": make_iso(base, 60), "service": "api-gateway", "metric_name": "network_packet_retransmit_rate", "value": 0.14, "unit": "percentage"},
            {"timestamp": make_iso(base, 60), "service": "order-service", "metric_name": "cpu_utilization", "value": 16.0, "unit": "percentage"},
            {"timestamp": make_iso(base, 60), "service": "order-service", "metric_name": "memory_rss_bytes", "value": 419430400.0, "unit": "bytes"}
        ],
        "traces": [
            {"trace_id": "tr-net-601", "span_id": "sp-gw-6", "parent_span_id": None, "service": "api-gateway", "operation": "GET /api/orders/user/991", "duration_ms": 865.0, "status_code": 200, "timestamp": make_iso(base, 50), "error": False},
            {"trace_id": "tr-net-601", "span_id": "sp-ord-6", "parent_span_id": "sp-gw-6", "service": "order-service", "operation": "GetOrdersByUser", "duration_ms": 12.0, "status_code": 200, "timestamp": make_iso(base, 50), "error": False}
        ],
        "deployments": [],
        "dependencies": COMMON_DEPENDENCIES
    }
    gt = {
        "scenario_id": "INC-006",
        "root_cause": "NETWORK_LATENCY",
        "affected_service": "order-service",
        "expected_remediation": "restart_service",
        "remediation_parameters": {"service": "order-service"},
        "key_evidence_signatures": ["network_rtt_850ms", "transit_time_delta_853ms", "internal_service_execution_fast_12ms"]
    }
    return incident, gt

def main():
    generators = [
        generate_scenario_1,
        generate_scenario_2,
        generate_scenario_3,
        generate_scenario_4,
        generate_scenario_5,
        generate_scenario_6
    ]

    for gen in generators:
        incident, gt = gen()
        inc_id = incident["incident_id"]
        
        inc_path = os.path.join(SCENARIOS_DIR, f"{inc_id}.json")
        with open(inc_path, "w", encoding="utf-8") as f:
            json.dump(incident, f, indent=2)
            
        gt_path = os.path.join(GROUND_TRUTH_DIR, f"{inc_id}_gt.json")
        with open(gt_path, "w", encoding="utf-8") as f:
            json.dump(gt, f, indent=2)
            
        print(f"Generated {inc_id} -> scenario and ground_truth.")

if __name__ == "__main__":
    main()
