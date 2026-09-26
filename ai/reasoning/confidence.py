from typing import List, Dict, Any, Tuple
from ai.models.schemas import Hypothesis, Evidence

def evaluate_evidence_sufficiency(
    hypotheses: List[Hypothesis],
    evidence_list: List[Evidence]
) -> Tuple[bool, List[str]]:
    """
    Deterministic gate to detect when observability evidence is insufficient.
    Returns: (is_sufficient: bool, missing_reasons: List[str])
    """
    if not hypotheses:
        return False, ["No hypotheses available for evaluation."]
        
    top_hyp = hypotheses[0]
    supporting = [e for e in evidence_list if e.evidence_id in top_hyp.supporting_evidence]
    distinct_sources = set(e.source for e in supporting)
    
    missing_reasons = []
    
    if len(supporting) < 2:
        missing_reasons.append(f"Insufficient supporting evidence items ({len(supporting)} < 2)")
        
    if len(distinct_sources) < 2:
        missing_reasons.append(f"Insufficient independent signal types ({len(distinct_sources)} < 2)")
        
    if top_hyp.score < 0.65:
        missing_reasons.append(f"Top hypothesis score {top_hyp.score:.2f} is below sufficiency threshold 0.65")
        
    if len(hypotheses) >= 2:
        margin = top_hyp.score - hypotheses[1].score
        if margin < 0.10:
            missing_reasons.append(f"Ambiguous top candidates: score margin between top-1 ({top_hyp.score:.2f}) and top-2 ({hypotheses[1].score:.2f}) is only {margin:.2f} < 0.10")
            
    is_sufficient = len(missing_reasons) == 0
    return is_sufficient, missing_reasons

def compute_calibration_metrics(predictions: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calculate Brier score and Expected Calibration Error (ECE) across benchmark predictions.
    Each item: {"confidence": float, "correct": bool}
    """
    if not predictions:
        return {"brier_score": 0.0, "ece": 0.0}
        
    # Brier Score = (1/N) * sum((confidence - actual)^2) where actual in {0, 1}
    brier_sum = 0.0
    for p in predictions:
        actual = 1.0 if p["correct"] else 0.0
        conf = p["confidence"]
        brier_sum += (conf - actual) ** 2
    brier_score = brier_sum / len(predictions)
    
    # ECE with 5 bins
    bins = 5
    bin_size = 1.0 / bins
    ece = 0.0
    
    for b in range(bins):
        bin_lower = b * bin_size
        bin_upper = (b + 1) * bin_size
        
        in_bin = [p for p in predictions if bin_lower <= p["confidence"] < bin_upper or (b == bins - 1 and p["confidence"] == 1.0)]
        if not in_bin:
            continue
            
        avg_conf = sum(p["confidence"] for p in in_bin) / len(in_bin)
        avg_acc = sum(1.0 for p in in_bin if p["correct"]) / len(in_bin)
        ece += (len(in_bin) / len(predictions)) * abs(avg_acc - avg_conf)
        
    return {
        "brier_score": round(brier_score, 4),
        "ece": round(ece, 4)
    }
