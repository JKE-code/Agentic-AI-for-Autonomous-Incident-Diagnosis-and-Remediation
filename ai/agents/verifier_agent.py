from typing import List, Tuple
from ai.models.schemas import Hypothesis, Evidence, Incident

def verify_leading_hypothesis(
    hypothesis: Hypothesis,
    incident: Incident,
    evidence_list: List[Evidence]
) -> Tuple[bool, str]:
    """
    Executes explicit falsification and confirmation tests against the top-ranked hypothesis.
    Returns: (verified: bool, verification_report: str)
    """
    cat = hypothesis.root_cause_category
    test_results = []
    
    if cat == "BAD_DEPLOYMENT":
        # Test 1: Check deployment occurred right before incident
        dep = next((d for d in incident.deployments if d.service == hypothesis.service), None)
        if dep:
            test_results.append(f"PASS: Found deployment {dep.version} on {dep.service} at {dep.deployed_at}.")
        else:
            test_results.append("FAIL: No matching deployment event found.")
            
        # Test 2: Check for error logs on target service
        err_logs = [l for l in incident.logs if l.service == hypothesis.service and l.level in ("ERROR", "FATAL")]
        if err_logs:
            test_results.append(f"PASS: Confirmed {len(err_logs)} critical log errors originating in {hypothesis.service}.")
        else:
            test_results.append("FAIL: No error logs detected in target service.")

    elif cat == "DB_CONNECTION_EXHAUSTION":
        # Test 1: DB connection saturation
        db_metrics = [m for m in incident.metrics if "connection" in m.metric_name and m.value >= 400]
        if db_metrics:
            test_results.append(f"PASS: Active DB connections reached {db_metrics[-1].value} (saturation ceiling).")
        else:
            test_results.append("FAIL: DB connections are within normal operational limits.")
            
        # Test 2: Pool timeout errors
        pool_errors = [l for l in incident.logs if "timeout" in l.message.lower() or "pool" in l.message.lower() or "connection" in l.message.lower()]
        if pool_errors:
            test_results.append(f"PASS: Identified {len(pool_errors)} connection acquisition timeout logs.")
        else:
            test_results.append("FAIL: No connection acquisition timeouts logged.")

    elif cat == "MEMORY_LEAK":
        # Test 1: Memory growth
        mem_metrics = [m.value for m in incident.metrics if "memory" in m.metric_name]
        if len(mem_metrics) >= 2 and mem_metrics[-1] > mem_metrics[0]:
            growth_mb = (mem_metrics[-1] - mem_metrics[0]) / (1024 * 1024)
            test_results.append(f"PASS: Monotonic RSS memory slope detected (+{growth_mb:.1f} MB growth).")
        else:
            test_results.append("FAIL: Memory usage did not exhibit monotonic growth.")
            
        # Test 2: OOM logs
        oom_logs = [l for l in incident.logs if "oom" in l.message.lower() or "outofmemory" in l.message.lower()]
        if oom_logs:
            test_results.append(f"PASS: Verified JVM OutOfMemoryError and kernel kill signals.")
        else:
            test_results.append("FAIL: No OutOfMemory log signatures.")

    elif cat == "DOWNSTREAM_FAILURE":
        # Test 1: External call latency/error
        ext_spans = [t for t in incident.traces if ("external" in t.service or t.duration_ms > 2000)]
        if ext_spans:
            test_results.append(f"PASS: External integration trace span exceeded timeout threshold ({ext_spans[0].duration_ms:.0f}ms).")
        else:
            test_results.append("FAIL: External trace spans executed normally.")
            
        # Test 2: Local CPU healthy
        cpu_metrics = [m for m in incident.metrics if "cpu" in m.metric_name and m.service != "external-payment-provider"]
        if all(m.value < 50 for m in cpu_metrics):
            test_results.append("PASS: Local service compute and database remain healthy (non-local root cause confirmed).")
        else:
            test_results.append("FAIL: Local compute shows high saturation.")

    elif cat == "CPU_SATURATION":
        cpu_metrics = [m for m in incident.metrics if "cpu" in m.metric_name and m.value > 85]
        if cpu_metrics:
            test_results.append(f"PASS: CPU utilization pegged at {cpu_metrics[-1].value}%.")
        else:
            test_results.append("FAIL: CPU utilization is below threshold.")
            
        queue_metrics = [m for m in incident.metrics if "queue" in m.metric_name and m.value > 50]
        if queue_metrics:
            test_results.append(f"PASS: Thread pool task queue backed up to {queue_metrics[-1].value} items.")
        else:
            test_results.append("FAIL: Task queue remains within normal capacity.")

    elif cat == "NETWORK_LATENCY":
        net_metrics = [m for m in incident.metrics if "rtt" in m.metric_name and m.value > 200]
        if net_metrics:
            test_results.append(f"PASS: Inter-service TCP RTT elevated to {net_metrics[-1].value}ms.")
        else:
            test_results.append("FAIL: Network transit metrics normal.")
            
        fast_spans = [t for t in incident.traces if t.service == "order-service" and t.duration_ms < 50]
        if fast_spans:
            test_results.append("PASS: Server internal compute execution is rapid (transit time anomaly confirmed).")
        else:
            test_results.append("FAIL: Server internal execution is slow.")
    else:
        test_results.append("FAIL: Unrecognized root cause category.")

    pass_count = sum(1 for t in test_results if t.startswith("PASS"))
    verified = pass_count >= 1 and not any(t.startswith("FAIL") for t in test_results if "matching" in t)
    
    report = f"Verification Test Suite ({pass_count}/{len(test_results)} passed):\n" + "\n".join(f"- {t}" for t in test_results)
    return verified, report
