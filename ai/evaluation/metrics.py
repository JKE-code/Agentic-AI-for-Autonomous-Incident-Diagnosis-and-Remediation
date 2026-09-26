from typing import List, Dict, Any

def compute_benchmark_metrics(
    eval_results: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes rigorous quantitative metrics over benchmark evaluation runs.
    """
    if not eval_results:
        return {}
        
    n = len(eval_results)
    top_1_correct = sum(1 for r in eval_results if r["top_1_correct"])
    top_3_correct = sum(1 for r in eval_results if r["top_3_correct"])
    remediation_correct = sum(1 for r in eval_results if r.get("remediation_correct", False))
    mttd_total = sum(r.get("diagnosis_time_seconds", 0.0) for r in eval_results)
    
    # Calibration metrics
    brier_sum = sum((r["confidence"] - (1.0 if r["top_1_correct"] else 0.0)) ** 2 for r in eval_results)
    
    return {
        "total_scenarios": n,
        "top_1_accuracy": round(top_1_correct / n, 4),
        "top_3_accuracy": round(top_3_correct / n, 4),
        "remediation_success_rate": round(remediation_correct / n, 4),
        "mean_time_to_diagnosis_ms": round((mttd_total / n) * 1000, 2),
        "brier_score": round(brier_sum / n, 4),
        "calibration_quality": "WELL_CALIBRATED" if (brier_sum / n) < 0.15 else "MODERATE"
    }
