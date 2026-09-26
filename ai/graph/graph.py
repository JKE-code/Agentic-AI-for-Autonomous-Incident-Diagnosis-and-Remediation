import logging
from typing import Literal
from langgraph.graph import StateGraph, START, END
from ai.graph.state import IncidentInvestigationState
from ai.graph.nodes import (
    intake_node,
    timeline_node,
    investigators_node,
    hypothesis_node,
    ranking_node,
    diagnostic_node,
    verifier_node,
    remediation_node
)

logger = logging.getLogger("ai.graph")

def sufficiency_condition(state: IncidentInvestigationState) -> Literal["diagnostics", "verifier"]:
    """Conditional router based on evidence sufficiency evaluation."""
    if state.get("requires_more_data") and state.get("diagnostics_iterations", 0) < 1:
        logger.info("Sufficiency gate: Insufficient evidence detected. Routing to diagnostic agent.")
        return "diagnostics"
    return "verifier"

def create_investigation_graph():
    """Builds and compiles the full LangGraph incident investigation workflow."""
    builder = StateGraph(IncidentInvestigationState)
    
    # Add nodes
    builder.add_node("intake", intake_node)
    builder.add_node("timeline", timeline_node)
    builder.add_node("investigators", investigators_node)
    builder.add_node("hypotheses", hypothesis_node)
    builder.add_node("ranking", ranking_node)
    builder.add_node("diagnostics", diagnostic_node)
    builder.add_node("verifier", verifier_node)
    builder.add_node("remediation", remediation_node)
    
    # Edges
    builder.add_edge(START, "intake")
    builder.add_edge("intake", "timeline")
    builder.add_edge("timeline", "investigators")
    builder.add_edge("investigators", "hypotheses")
    builder.add_edge("hypotheses", "ranking")
    
    # Conditional edge for sufficiency gate / active diagnostics
    builder.add_conditional_edges(
        "ranking",
        sufficiency_condition,
        {
            "diagnostics": "diagnostics",
            "verifier": "verifier"
        }
    )
    
    builder.add_edge("diagnostics", "ranking")
    builder.add_edge("verifier", "remediation")
    builder.add_edge("remediation", END)
    
    return builder.compile()

# Global compiled graph instance
investigation_graph = create_investigation_graph()
