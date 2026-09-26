# Incident AI Investigation Engine

LangGraph-based multi-agent incident diagnosis and remediation service built for the hackathon architecture in [arc.md](../arc.md).

## Architecture Overview

```text
START
  │
  ▼
Incident Intake (Coordinator Agent)
  │
  ▼
Timeline Construction (Timeline Agent)
  │
  ├─────────────┬─────────────┬─────────────┬─────────────┐
  ▼             ▼             ▼             ▼             ▼
Logs         Metrics        Traces      Deployments   Dependencies
Agent          Agent          Agent          Agent          Agent
  │             │             │             │             │
  └─────────────┴─────────────┴─────────────┴─────────────┘
                               │
                               ▼
                     Evidence Aggregator
                               │
                               ▼
                   Hypothesis Generator (3–5 competing candidates)
                               │
                               ▼
                   Hypothesis Ranker (Hybrid 5-factor scoring)
                               │
                               ▼
                        Sufficiency Gate?
                        /               \
              [YES: Sufficient]   [NO: Insufficient]
                      │                   │
                      │                   ▼
                      │            Diagnostic Agent (Targeted queries)
                      │                   │
                      └───────────────────┘
                               │
                               ▼
                     Hypothesis Verifier (Falsification test suite)
                               │
                               ▼
                     Remediation Planner (Whitelisted safe actions)
                               │
                               ▼
                     Human Approval Gate (POST /resume)
```

## Endpoints (Port 8001)

- **GET `/health`**: Health status and model configuration.
- **GET `/scenarios`**: List available benchmark scenarios (`INC-001` through `INC-006`).
- **POST `/diagnose`**: Takes `{"incident_id": "INC-001"}` or raw Incident JSON; returns complete `DiagnosisResponse` (timeline, ranked hypotheses, verified root cause, evidence linkages, remediation plan, and audit events).
- **POST `/resume`**: Resumes workflow after human approval (`{"thread_id": "...", "approval": "approved"}`).
- **POST `/evaluate`**: Executes the 6-scenario benchmark comparing the Agentic System against the Rules Baseline.

## How to Run

1. Install requirements:
   ```bash
   pip install -r ai/requirements.txt
   ```
2. Start the AI service:
   ```bash
   uvicorn ai.service:app --host 0.0.0.0 --port 8001 --reload
   ```
3. Run the evaluation benchmark:
   ```bash
   python -m ai.evaluation.evaluator
   ```
4. Run tests:
   ```bash
   python -m unittest ai/test_ai_service.py
   ```
