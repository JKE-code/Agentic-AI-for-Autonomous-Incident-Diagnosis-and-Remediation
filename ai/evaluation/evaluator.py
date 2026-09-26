import os
import json
import time
from typing import Dict, Any, List
from ai.models.schemas import Incident
from ai.graph.graph import investigation_graph
from ai.evaluation.baseline import run_rules_baseline
from ai.evaluation.metrics import compute_benchmark_metrics

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCENARIOS_DIR = os.path.join(BASE_DIR, "data", "scenarios")
GROUND_TRUTH_DIR = os.path.join(BASE_DIR, "data", "ground_truth")

def load_all_scenarios_and_truth() -> List[Dict[str, Any]]:
    items = []
    if not os.path.exists(SCENARIOS_DIR) or not os.path.exists(GROUND_TRUTH_DIR):
        return items
        
    for fname in os.listdir(SCENARIOS_DIR):
        if fname.endswith(".json"):
            scenario_id = fname.replace(".json", "")
            scen_path = os.path.join(SCENARIOS_DIR, fname)
            gt_path = os.path.join(GROUND_TRUTH_DIR, f"{scenario_id}_gt.json")
            
            if os.path.exists(gt_path):
                with open(scen_path, "r", encoding="utf-8") as f:
                    scen_data = json.load(f)
                with open(gt_path, "r", encoding="utf-8") as f:
                    gt_data = json.load(f)
                    
                items.append({
                    "scenario_id": scenario_id,
                    "incident": Incident(**scen_data),
                    "ground_truth": gt_data
                })
    items.sort(key=lambda x: x["scenario_id"])
    return items

def run_evaluation_suite() -> Dict[str, Any]:
    dataset = load_all_scenarios_and_truth()
    
    agent_results = []
    baseline_results = []
    
    for item in dataset:
        inc = item["incident"]
        gt = item["ground_truth"]
        expected_cause = gt["root_cause"]
        expected_action = gt.get("expected_remediation")
        
        # 1. Run Agentic System
        t0 = time.time()
        init_state = {"incident": inc, "thread_id": f"eval-{inc.incident_id}"}
        agent_final = investigation_graph.invoke(init_state)
        t_agent = time.time() - t0
        
        top_hyp = agent_final.get("root_cause")
        hypotheses = agent_final.get("hypotheses", [])
        remediation = agent_final.get("remediation")
        
        agent_pred_top1 = top_hyp.root_cause_category if top_hyp else "UNKNOWN"
        agent_pred_top3 = [h.root_cause_category for h in hypotheses[:3]]
        agent_conf = top_hyp.confidence if top_hyp else 0.5
        agent_action = remediation.action if remediation else None
        
        agent_results.append({
            "scenario_id": inc.incident_id,
            "expected_cause": expected_cause,
            "predicted_cause": agent_pred_top1,
            "top_1_correct": (agent_pred_top1 == expected_cause),
            "top_3_correct": (expected_cause in agent_pred_top3),
            "remediation_correct": (agent_action == expected_action),
            "confidence": agent_conf,
            "diagnosis_time_seconds": t_agent
        })
        
        # 2. Run Baseline
        t0 = time.time()
        base_out = run_rules_baseline(inc)
        t_base = time.time() - t0
        
        base_pred_top1 = base_out["top_1_prediction"]
        base_pred_top3 = base_out["top_3_predictions"]
        base_conf = base_out["confidence"]
        
        baseline_results.append({
            "scenario_id": inc.incident_id,
            "expected_cause": expected_cause,
            "predicted_cause": base_pred_top1,
            "top_1_correct": (base_pred_top1 == expected_cause),
            "top_3_correct": (expected_cause in base_pred_top3),
            "remediation_correct": False, # Baseline cannot generate structured remediations
            "confidence": base_conf,
            "diagnosis_time_seconds": t_base
        })
        
    agent_metrics = compute_benchmark_metrics(agent_results)
    baseline_metrics = compute_benchmark_metrics(baseline_results)
    
    return {
        "benchmark_name": "Synthetic Incident Benchmark (6 Scenarios)",
        "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "agentic_system": {
            "metrics": agent_metrics,
            "breakdown": agent_results
        },
        "rules_baseline": {
            "metrics": baseline_metrics,
            "breakdown": baseline_results
        },
        "comparison_summary": {
            "top_1_delta": round(agent_metrics.get("top_1_accuracy", 0) - baseline_metrics.get("top_1_accuracy", 0), 4),
            "top_3_delta": round(agent_metrics.get("top_3_accuracy", 0) - baseline_metrics.get("top_3_accuracy", 0), 4),
            "remediation_generation": "Supported in Agentic Graph, Unsupported in Baseline"
        }
    }

if __name__ == "__main__":
    res = run_evaluation_suite()
    print(json.dumps(res, indent=2))
