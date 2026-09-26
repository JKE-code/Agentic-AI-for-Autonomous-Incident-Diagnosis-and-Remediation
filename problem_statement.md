# Problem Statement: Agentic AI for Autonomous Incident Diagnosis and Remediation

**Difficulty**: Hard  
**Domain**: AI / AIOps  
**Tags**: Advanced AI, Agentic Systems, AIOps, Observability, Incident Management  

---

## Overview
Design an AI system that investigates simulated production incidents by analyzing logs, metrics, traces, deployment history, and service dependencies. The system should form and test hypotheses, identify likely root causes, and propose or execute approved remediation steps in a sandbox. All actions must be auditable and guarded by human approval for risky changes.

---

## Minimum Requirements
1. **Multi-Source Ingestion**: Ingest sample logs, metrics, traces, and service/deployment metadata from a provided or simulated environment.
2. **Timeline & Correlation**: Correlate events across services and construct a chronological incident timeline along with a service dependency map.
3. **Hypothesis Formation & Ranking**: Use an LLM, ML model, or hybrid reasoning pipeline to formulate and rank competing root-cause hypotheses supported by cited evidence.
4. **Remediation Planning & Explanation**: Recommend an actionable remediation plan and explain the concrete evidence behind each recommendation.
5. **Sandboxed Execution & Safety Guardrails**: Provide a sandboxed action workflow with human approval gates, automated rollback support, and an immutable audit trail.
6. **Evaluation & Benchmarking**: Evaluate the system against labeled incident scenarios using quantitative metrics such as root-cause accuracy (Top-1, Top-3) and time to diagnosis (MTTD/MTTR).

---

## Bonus Points
- **Specialized Multi-Agent Architecture**: Employ specialized agents for investigation, verification, and remediation planning.
- **Uncertainty & Insufficient Evidence Detection**: Detect when observability evidence is insufficient and actively request additional diagnostic data rather than guessing or hallucinating.
- **Closed-Loop Sandbox Validation**: Run safe, reversible remediations in a containerized test environment (Docker / Azure Container Apps) and verify whether post-remediation service health improves.
- **Confidence Calibration & Baseline Comparison**: Include well-calibrated confidence scores and evaluate performance directly against a rules-based / heuristic baseline.

---

## Core Competencies Tested
- Agentic AI & Tool-Using Reasoning
- Observability Data Analysis (OpenTelemetry, Logs, Metrics, Distributed Traces)
- Causal Reasoning & Hypothesis Testing
- Safety Controls, Approval Gates & Rollback Mechanisms
- Rigorous Evaluation Design & Baseline Benchmarking
- Reliable System Integration & Extensibility