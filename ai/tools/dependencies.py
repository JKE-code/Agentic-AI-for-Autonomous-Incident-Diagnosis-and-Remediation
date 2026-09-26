from typing import List, Dict, Set, Any
from ai.models.schemas import DependencyEdge

def build_dependency_graph(dependencies: List[DependencyEdge]) -> Dict[str, Dict[str, List[str]]]:
    """Build directed adjacency graph of callers (upstream) and callees (downstream)."""
    downstream: Dict[str, List[str]] = {}
    upstream: Dict[str, List[str]] = {}
    
    for edge in dependencies:
        downstream.setdefault(edge.source, []).append(edge.target)
        upstream.setdefault(edge.target, []).append(edge.source)
        
    return {"downstream": downstream, "upstream": upstream}

def get_affected_path(
    failing_service: str,
    dependencies: List[DependencyEdge]
) -> Dict[str, Any]:
    """Find all services directly and indirectly impacted by a failing service."""
    graph = build_dependency_graph(dependencies)
    upstream_map = graph["upstream"]
    
    impacted: Set[str] = set()
    queue = [failing_service]
    
    while queue:
        curr = queue.pop(0)
        for caller in upstream_map.get(curr, []):
            if caller not in impacted:
                impacted.add(caller)
                queue.append(caller)
                
    return {
        "root_suspect": failing_service,
        "impacted_callers": list(impacted),
        "direct_dependencies": graph["downstream"].get(failing_service, [])
    }
