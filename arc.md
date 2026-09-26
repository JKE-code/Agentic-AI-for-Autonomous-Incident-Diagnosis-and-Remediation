You have about **150 minutes from 11:30 to 2:00 PM**. So the architecture needs to look advanced to judges while remaining mechanically simple enough that three AI coding agents can finish it today.

The right design is **not** a giant autonomous AI platform. It is a tightly controlled **LangGraph investigation workflow + synthetic observability environment + sandbox executor + React incident console**.

Also: **do not spend a single minute trying to use Microsoft Foundry.** You have no Azure subscription, tenant, deployment, or API access. Use your Gemini API. Current Gemini API documentation lists `gemini-3.8-flash` as a stable model and explicitly positions it for agentic/software-engineering workloads. ([Google AI for Developers][1])

LangGraph is particularly appropriate here because it is designed for stateful agents, deterministic/agentic workflows, persistence, streaming, and human-in-the-loop control. ([LangChain][2])

# 1. Final architecture

```text
                         ┌───────────────────────────┐
                         │       REACT FRONTEND      │
                         │                           │
                         │ Incident Dashboard        │
                         │ Timeline                  │
                         │ Evidence                  │
                         │ Hypotheses                │
                         │ Remediation               │
                         │ Approval                  │
                         │ Audit Trail               │
                         │ Evaluation                │
                         └─────────────┬─────────────┘
                                       │ REST
                                       ▼
                         ┌───────────────────────────┐
                         │       FASTAPI BACKEND     │
                         │                           │
                         │ Incident API              │
                         │ Diagnosis API             │
                         │ Approval API              │
                         │ Sandbox API               │
                         │ Audit API                 │
                         │ Evaluation API             │
                         │ SQLite                    │
                         └──────┬─────────────┬──────┘
                                │             │
                    REST/Adapter│             │Sandbox API
                                ▼             ▼
                 ┌────────────────────┐   ┌────────────────────┐
                 │   LANGGRAPH AI     │   │ CONTAINER SANDBOX  │
                 │                    │   │                    │
                 │ Incident Manager   │   │ api-service        │
                 │ Timeline Agent     │   │ order-service      │
                 │ Log Agent          │   │ payment-service    │
                 │ Metrics Agent      │   │ database simulator │
                 │ Trace Agent        │   │ health endpoints   │
                 │ Deployment Agent   │   └────────────────────┘
                 │ Dependency Agent   │
                 │                    │
                 │ Hypothesis Engine  │
                 │ Verification Agent│
                 │ Remediation Agent  │
                 │ Safety Gate        │
                 └──────────┬─────────┘
                            │
                     Gemini 3.8 Flash
                            │
                            ▼
                 ┌────────────────────┐
                 │ SYNTHETIC TELEMETRY│
                 │                    │
                 │ logs/              │
                 │ metrics/           │
                 │ traces/            │
                 │ deployments/       │
                 │ dependencies/      │
                 │ scenarios/         │
                 └────────────────────┘

                         ┌───────────────┐
                         │   LANGSMITH   │
                         │ optional      │
                         │ agent traces  │
                         └───────────────┘
```

The important architectural decision is this:

**The LLM never directly controls the infrastructure.**

It can propose:

```json
{
  "action": "rollback_deployment",
  "service": "payment-service",
  "target_version": "v1.4"
}
```

It cannot generate:

```bash
rm -rf /
docker exec ...
kubectl ...
```

The backend's action executor maps an allowed action enum to a predefined safe function.

That is your safety story.

---

# 2. Repository structure

Use this exact structure.

```text
incident-ai/
│
├── ai/
│   ├── agents/
│   │   ├── coordinator.py
│   │   ├── timeline_agent.py
│   │   ├── log_agent.py
│   │   ├── metrics_agent.py
│   │   ├── trace_agent.py
│   │   ├── deployment_agent.py
│   │   ├── dependency_agent.py
│   │   ├── hypothesis_agent.py
│   │   ├── verifier_agent.py
│   │   └── remediation_agent.py
│   │
│   ├── graph/
│   │   ├── state.py
│   │   ├── graph.py
│   │   └── nodes.py
│   │
│   ├── reasoning/
│   │   ├── scorer.py
│   │   ├── confidence.py
│   │   └── evidence.py
│   │
│   ├── tools/
│   │   ├── logs.py
│   │   ├── metrics.py
│   │   ├── traces.py
│   │   ├── deployments.py
│   │   ├── dependencies.py
│   │   └── diagnostics.py
│   │
│   ├── models/
│   │   ├── llm.py
│   │   └── schemas.py
│   │
│   ├── evaluation/
│   │   ├── evaluator.py
│   │   ├── baseline.py
│   │   └── metrics.py
│   │
│   ├── service.py
│   └── requirements.txt
│
├── backend/
│   ├── api/
│   │   ├── incidents.py
│   │   ├── diagnosis.py
│   │   ├── approvals.py
│   │   ├── remediation.py
│   │   ├── audit.py
│   │   └── evaluation.py
│   │
│   ├── services/
│   │   ├── incident_service.py
│   │   ├── audit_service.py
│   │   ├── sandbox_service.py
│   │   └── ai_client.py
│   │
│   ├── db/
│   │   ├── database.py
│   │   └── models.py
│   │
│   ├── schemas/
│   │   └── api_models.py
│   │
│   ├── mock/
│   │   └── ai_mock.py
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── mock/
│   ├── package.json
│   └── ...
│
├── sandbox/
│   ├── docker-compose.yml
│   ├── services/
│   │   ├── api/
│   │   ├── order/
│   │   └── payment/
│   └── scenarios/
│
├── data/
│   ├── scenarios/
│   ├── logs/
│   ├── metrics/
│   ├── traces/
│   ├── deployments/
│   ├── dependencies/
│   └── ground_truth/
│
├── shared/
│   └── contracts/
│       ├── incident.schema.json
│       ├── evidence.schema.json
│       ├── diagnosis.schema.json
│       ├── remediation.schema.json
│       └── audit.schema.json
│
├── docker-compose.yml
└── README.md
```

## Ownership

```text
SAHIL       → /ai + /data + /shared
JAYANTH     → /backend + backend/mock
KARTHIK     → /frontend
```

Nobody casually edits another person's directory.

The only shared dependency is:

```text
/shared/contracts
```

Those JSON contracts become the treaty between the three teams.

---

# 3. Synthetic production environment

Because the organizers give you no data, you need to manufacture a believable production system.

Use this topology:

```text
                   ┌──────────────┐
                   │ API Gateway  │
                   └──────┬───────┘
                          │
             ┌────────────┼─────────────┐
             │            │             │
             ▼            ▼             ▼
        auth-service  order-service  payment-service
                          │             │
                          ▼             ▼
                    inventory-service   payment-db
                          │
                          ▼
                       orders-db
```

You don't need real Kubernetes, Kafka, Prometheus, Jaeger, etc.

Fake them.

The observability data is simply structured JSON.

That gives you:

```text
logs
metrics
traces
deployments
dependencies
```

without wasting 45 minutes building fucking infrastructure.

---

# 4. Incident scenarios

Create **6 scenarios**.

### Scenario 1 — Bad Deployment

```text
payment-service
v1.4 → v1.5
```

After deployment:

```text
HTTP 500 ↑
error rate ↑
payment latency ↑
traces fail inside payment-service
```

Ground truth:

```text
BAD_DEPLOYMENT
```

Remediation:

```text
rollback v1.5 → v1.4
```

---

### Scenario 2 — Database Connection Exhaustion

```text
orders-db connections = 100%
```

Symptoms:

```text
DB timeout
API latency ↑
connection pool errors
```

Root cause:

```text
DB_CONNECTION_EXHAUSTION
```

Remediation:

```text
restart_service
```

or:

```text
scale_db_connections
```

within your simulated environment.

---

### Scenario 3 — Memory Leak

```text
payment-service RSS:
1.2GB
1.7GB
2.3GB
2.9GB
```

Eventually:

```text
OOM
```

Root cause:

```text
MEMORY_LEAK
```

Remediation:

```text
restart_service
```

---

### Scenario 4 — Downstream Dependency Failure

```text
payment-service
        ↓
external-payment-provider
```

Provider latency explodes.

Root cause:

```text
DOWNSTREAM_FAILURE
```

Remediation:

```text
disable_provider / fallback_provider
```

---

### Scenario 5 — CPU Saturation

```text
order-service CPU = 97%
```

Consequences:

```text
queue length ↑
latency ↑
5xx ↑
```

Root cause:

```text
CPU_SATURATION
```

Remediation:

```text
scale_service
```

---

### Scenario 6 — Network Latency

```text
service A → service B
```

Trace spans show:

```text
network latency ↑
```

while CPU/database remain normal.

Root cause:

```text
NETWORK_LATENCY
```

Remediation:

```text
restart_service
```

or simulated routing change.

---

# 5. Your hidden ground truth

Do **not** pass ground truth to the AI.

Separate:

```text
data/scenarios/
```

from:

```text
data/ground_truth/
```

Example:

```json
{
  "scenario_id": "INC-001",
  "root_cause": "BAD_DEPLOYMENT",
  "affected_service": "payment-service",
  "expected_remediation": "rollback_deployment"
}
```

The AI never sees this.

The evaluator does.

That allows:

```text
AI Diagnosis
       ↓
Evaluator
       ↓
compare with hidden ground truth
```

This satisfies the evaluation requirement honestly for a synthetic benchmark.

---

# 6. Standard incident JSON

Every incident should follow the same structure.

```json
{
  "incident_id": "INC-001",
  "title": "Payment failures after deployment",
  "severity": "CRITICAL",
  "started_at": "2026-09-26T10:41:00Z",
  "services": [
    "api-gateway",
    "payment-service",
    "orders-db"
  ],
  "logs": [],
  "metrics": [],
  "traces": [],
  "deployments": [],
  "dependencies": []
}
```

Everything downstream consumes this structure.

---

# 7. Evidence object

Every agent produces evidence in exactly this format.

```json
{
  "evidence_id": "E-019",
  "source": "logs",
  "timestamp": "2026-09-26T10:43:21Z",
  "service": "payment-service",
  "observation": "HTTP 500 errors increased from 0.2% to 18.7%",
  "importance": 0.94,
  "supports": [
    "HYP-001"
  ],
  "contradicts": [],
  "confidence": 0.91
}
```

The critical part is:

```text
supports
contradicts
confidence
```

That makes your system look like actual evidence-based reasoning rather than an LLM hallucinating a paragraph.

---

# 8. Hypothesis representation

```json
{
  "hypothesis_id": "HYP-001",
  "cause": "Bad deployment of payment-service",
  "service": "payment-service",
  "score": 0.87,
  "confidence": 0.91,
  "supporting_evidence": [
    "E-001",
    "E-004",
    "E-008"
  ],
  "contradicting_evidence": [
    "E-011"
  ],
  "tests": [
    "compare deployment timestamp with error spike",
    "inspect payment-service traces",
    "compare v1.4 and v1.5 health"
  ],
  "status": "VERIFIED"
}
```

---

# 9. LangGraph architecture

This is the heart of your project.

Do **not** make every agent an independent looping autonomous agent.

That becomes slow and unpredictable.

Use a **controlled state graph containing specialized agents**.

```text
START
  │
  ▼
Incident Intake
  │
  ▼
Build Initial Timeline
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
                  Hypothesis Generator
                              │
                              ▼
                  Hypothesis Ranker
                              │
                              ▼
                       Sufficiency?
                       /         \
                     YES          NO
                      │            │
                      │            ▼
                      │      Diagnostic Agent
                      │            │
                      │            ▼
                      │      Gather More Data
                      │            │
                      │            └──────┐
                      │                   │
                      └───────────────────┘
                              │
                              ▼
                    Hypothesis Verifier
                              │
                              ▼
                      Root Cause Decision
                              │
                              ▼
                    Remediation Planner
                              │
                              ▼
                       Safety Policy
                              │
                              ▼
                      HUMAN APPROVAL
                       /          \
                    APPROVE       REJECT
                      │             │
                      ▼             ▼
               Sandbox Execute    END
                      │
                      ▼
                  Health Check
                   /       \
                PASS       FAIL
                 │           │
                 ▼           ▼
              Resolve     Rollback
                             │
                             ▼
                        Health Check
                             │
                             ▼
                            END
```

That graph directly maps to the problem statement.

---

# 10. What each agent actually does

## Incident Coordinator

Input:

```text
incident
```

Produces:

```text
incident summary
affected services
time window
initial investigation plan
```

It does not diagnose.

Its job is orchestration.

---

## Timeline Agent

Sort:

```text
deployment
metric anomaly
log anomaly
trace anomaly
health event
```

into a unified timeline.

Example:

```text
10:41:00 deployment v1.5
10:42:08 latency ↑
10:42:13 500 errors ↑
10:42:21 payment traces failing
```

This is extremely important because temporal correlation is part of your causal argument.

---

## Log Agent

Analyzes:

```text
error frequency
error patterns
stack traces
new error signatures
service-specific anomalies
```

Output only structured evidence.

---

## Metrics Agent

Analyzes:

```text
CPU
memory
latency
throughput
error rate
queue size
DB connections
```

It should identify:

```text
absolute anomaly
rate of change
correlation with incident
```

---

## Trace Agent

Find:

```text
root span
failing child span
slow dependency
timeout chain
cross-service propagation
```

Example:

```text
api-gateway
    ↓ 34ms
order-service
    ↓ 43ms
payment-service
    ↓ 2400ms
external-payment-provider
```

That strongly supports a downstream failure.

---

## Deployment Agent

Looks for:

```text
new version
deployment timestamp
rollback history
configuration change
```

This is how you prove:

```text
deployment happened 90 seconds before incident
```

instead of merely saying:

> "Maybe deployment caused it."

---

## Dependency Agent

Builds:

```text
service graph
```

and identifies:

```text
affected downstream dependencies
```

This prevents the LLM from blaming the wrong service.

---

# 11. Hypothesis generation

Don't ask:

> "What is the root cause?"

Instead:

```text
Generate 3–5 competing hypotheses.
```

Example:

```text
H1 BAD_DEPLOYMENT
H2 DB_CONNECTION_EXHAUSTION
H3 DOWNSTREAM_FAILURE
H4 CPU_SATURATION
```

Then every hypothesis gets evidence.

This is much more defensible.

---

# 12. Hypothesis scoring

Don't let Gemini invent probability from thin air.

Use hybrid scoring.

For example:

```text
Final Score =
    0.35 LLM evidence assessment
  + 0.25 temporal correlation
  + 0.20 cross-signal agreement
  + 0.10 service dependency relevance
  + 0.10 deterministic rules score
```

Then normalize.

Example:

```text
H1 Bad deployment          0.87
H2 DB exhaustion           0.41
H3 Downstream failure      0.22
H4 CPU saturation          0.08
```

The LLM provides semantic reasoning.

Your deterministic layer provides structure.

That is the **hybrid reasoning pipeline** judges are looking for.

---

# 13. Evidence insufficiency gate

This is one of your strongest bonus implementations.

Use a deterministic gate.

Example:

```text
IF
    supporting_evidence < 2
OR
    independent_signal_types < 2
OR
    top_score < 0.65
OR
    score_margin(top1, top2) < 0.10
THEN
    request_more_data
```

Instead of hallucinating:

```text
"We are not confident enough.
Requesting deployment history and DB metrics."
```

Then your diagnostic agent executes additional tools.

---

# 14. Diagnostic tools

Give the diagnostic agent controlled tools:

```text
query_logs()
query_metrics()
query_traces()
get_deployments()
get_dependencies()
get_service_health()
get_config_history()
```

Example:

```python
query_metrics(
    service="payment-service",
    metric="error_rate",
    start="10:35",
    end="10:50"
)
```

The model chooses **what data it needs**, but the tool determines **what it can access**.

Again: controlled autonomy.

---

# 15. Verification agent

This is where your architecture becomes much stronger.

The verifier receives:

```text
hypothesis
supporting evidence
contradicting evidence
```

Then asks:

```text
Does the evidence actually establish this hypothesis?
What diagnostic test could falsify it?
```

Example:

```text
Hypothesis:
Bad deployment

Test:
Compare deployment timestamp with first error spike.

Result:
Deployment = 10:41:02
Error spike = 10:41:47

Result:
PASS
```

Then:

```text
HYP-001 → VERIFIED
```

This is much better than simply ranking hypotheses.

---

# 16. Remediation planner

Once verified:

```text
ROOT CAUSE
      ↓
REMEDIATION
```

Example:

```json
{
  "action_id": "ACT-001",
  "action": "rollback_deployment",
  "service": "payment-service",
  "current_version": "v1.5",
  "target_version": "v1.4",
  "risk": "MEDIUM",
  "reversible": true,
  "expected_effect": "Restore previous healthy deployment",
  "verification": {
    "metric": "error_rate",
    "threshold": "< 2%"
  },
  "requires_approval": true
}
```

---

# 17. Safety policy

This component should be **deterministic code**, not an LLM.

Whitelist:

```text
restart_service
rollback_deployment
scale_service
clear_cache
disable_dependency
```

Reject:

```text
arbitrary_shell_command
arbitrary_docker_command
arbitrary_SQL
file deletion
unknown_action
```

Pseudo-flow:

```text
LLM proposes action
        ↓
Pydantic schema validation
        ↓
Action whitelist
        ↓
Risk classification
        ↓
Approval requirement
        ↓
Human
```

That is a strong safety design.

---

# 18. Approval workflow

Frontend gets:

```text
ROOT CAUSE:
Bad deployment

REMEDIATION:
Rollback payment-service v1.5 → v1.4

RISK:
Medium

EXPECTED RESULT:
Error rate < 2%

ROLLBACK:
Available automatically if verification fails
```

Buttons:

```text
[ APPROVE & EXECUTE ]
[ REJECT ]
```

Approval goes to backend:

```http
POST /api/approvals/ACT-001
```

Backend records:

```text
who
when
action
reason
incident
```

Then executes.

---

# 19. Sandbox

Use Docker.

But don't build a miniature AWS.

Create:

```text
sandbox/
    api-service
    order-service
    payment-service
```

Every service exposes:

```http
/health
```

and optionally:

```http
/metrics
```

The sandbox maintains state such as:

```json
{
  "payment-service": {
    "version": "v1.5",
    "healthy": false,
    "error_rate": 0.18
  }
}
```

Rollback changes:

```text
v1.5 → v1.4
```

Then:

```text
health_check()
```

returns:

```json
{
  "healthy": true,
  "error_rate": 0.004
}
```

This creates the exact demo:

```text
INCIDENT
   ↓
AI investigates
   ↓
Root cause found
   ↓
Human approves
   ↓
Rollback executed
   ↓
Health improves
```

That is the demo you want.

---

# 20. Automatic verification

After remediation:

```text
capture pre-action state
        ↓
execute action
        ↓
wait 2–5 seconds
        ↓
health check
        ↓
compare metrics
```

Example:

```text
Before:
error rate = 18.7%

After:
error rate = 0.4%

Status:
REMEDIATION SUCCESSFUL
```

If:

```text
after_error_rate > before_error_rate
```

then:

```text
FAIL
 ↓
ROLLBACK
 ↓
VERIFY
```

Store both states.

---

# 21. Audit trail

Every important event becomes:

```json
{
  "audit_id": "AUD-019",
  "incident_id": "INC-001",
  "timestamp": "2026-09-26T10:49:20Z",
  "actor": "human",
  "event": "APPROVAL_GRANTED",
  "action_id": "ACT-001",
  "details": "Rollback approved"
}
```

Events:

```text
INCIDENT_CREATED
AGENT_STARTED
EVIDENCE_COLLECTED
HYPOTHESIS_CREATED
HYPOTHESIS_VERIFIED
REMEDIATION_PROPOSED
APPROVAL_REQUESTED
APPROVAL_GRANTED
ACTION_EXECUTED
HEALTH_CHECK
ROLLBACK_EXECUTED
INCIDENT_RESOLVED
```

Frontend gets a beautiful chronological audit timeline.

---

# 22. SQLite schema

You only need these tables:

```text
incidents
evidence
hypotheses
remediations
approvals
audit_events
evaluations
```

Don't create 25 tables.

---

# 23. Evaluation system

Because your dataset is synthetic, explicitly call it:

> Synthetic Incident Benchmark

Run all six incidents.

Compare:

```text
Agentic System
vs
Rules-Based Baseline
```

Metrics:

```text
Root Cause Top-1 Accuracy
Root Cause Top-3 Accuracy
Mean Time To Diagnosis
Remediation Success Rate
Evidence Sufficiency Detection
Confidence Calibration
```

For calibration:

```text
confidence = predicted confidence
correct = whether top hypothesis matches ground truth
```

You can compute a simple:

```text
Brier Score
ECE
```

You don't need a PhD thesis on calibration.

---

# 24. Rules-based baseline

This can be ridiculously simple but useful.

Example:

```python
if deployment_recent and error_rate_high:
    score["BAD_DEPLOYMENT"] += 0.8

if db_connections > 0.95 and db_timeout_errors:
    score["DB_CONNECTION_EXHAUSTION"] += 0.9

if memory_slope_high and oom_detected:
    score["MEMORY_LEAK"] += 0.9

if dependency_latency_high and timeout_traces:
    score["DOWNSTREAM_FAILURE"] += 0.9
```

Then:

```text
RULES BASELINE
Top-1 accuracy: X%

AGENTIC SYSTEM
Top-1 accuracy: Y%
```

Do not fake the numbers. Actually run the six scenarios.

---

# 25. Frontend architecture

Karthik does **not** need to build a generic AI chatbot.

Build an **Incident Command Center**.

Main layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ INCIDENT COMMAND CENTER                      SYSTEM HEALTH  │
├───────────────┬─────────────────────────────────────────────┤
│ INCIDENTS     │ INCIDENT #INC-001                           │
│               │                                             │
│ ● INC-001     │ CRITICAL                                    │
│ ○ INC-002     │ Payment failures                            │
│ ○ INC-003     │                                             │
│               │ ┌─────────────────────────────────────────┐ │
│               │ │ INCIDENT TIMELINE                       │ │
│               │ │                                         │ │
│               │ │ 10:41 Deployment v1.5                   │ │
│               │ │ 10:42 Error rate ↑                      │ │
│               │ │ 10:43 Latency ↑                         │ │
│               │ │ 10:44 Trace failures                    │ │
│               │ └─────────────────────────────────────────┘ │
│               │                                             │
│               │ HYPOTHESES                                  │
│               │                                             │
│               │ 87% Bad Deployment                          │
│               │ 41% DB Exhaustion                           │
│               │ 22% Downstream Failure                      │
│               │                                             │
│               │ EVIDENCE                                    │
│               │                                             │
│               │ logs   metrics   traces   deployment         │
│               │                                             │
│               │ REMEDIATION                                 │
│               │                                             │
│               │ Rollback payment-service                    │
│               │                                             │
│               │ [ APPROVE & EXECUTE ]                       │
│               │                                             │
│               │ AUDIT TRAIL                                 │
│               │ ✓ Investigation                             │
│               │ ✓ Root Cause Verified                       │
│               │ ✓ Approval                                  │
│               │ ✓ Execution                                 │
│               │ ✓ Health Improved                           │
└───────────────┴─────────────────────────────────────────────┘
```

Tabs:

```text
Overview
Timeline
Evidence
Hypotheses
Remediation
Audit
Evaluation
```

No chat window unless there is spare time.

---

# 26. Sahil's exact task

Paste this into your Antigravity agent.

```text
You are the AI/ML/LLM engineer for a hackathon project.

You own ONLY:
- /ai
- /data
- /shared/contracts

Do NOT modify /backend or /frontend.

Project:
Agentic AI for Autonomous Incident Diagnosis and Remediation.

Goal:
Build a LangGraph-based multi-agent investigation system that analyzes synthetic production incidents containing:
- logs
- metrics
- traces
- deployment history
- service dependencies

The system must:
1. Build a unified incident timeline.
2. Run specialized investigation agents for logs, metrics, traces, deployments, and dependencies.
3. Generate multiple competing root-cause hypotheses.
4. Attach explicit evidence to each hypothesis.
5. Rank hypotheses using hybrid reasoning:
   LLM assessment + deterministic signals + temporal correlation + cross-signal agreement.
6. Detect insufficient evidence instead of guessing.
7. Request additional diagnostic data when evidence is insufficient.
8. Verify the leading hypothesis using explicit tests.
9. Generate a structured remediation plan.
10. Never generate arbitrary shell/infrastructure commands.
11. Produce structured JSON only at agent boundaries.
12. Support human approval and resume after approval.
13. Support post-remediation health verification and rollback.
14. Emit a complete audit event stream.
15. Provide evaluation against hidden synthetic ground truth.

Use:
- Python
- LangGraph
- LangChain where useful
- Gemini API
- Pydantic
- optional LangSmith tracing

Use gemini-3.8-flash as the default LLM.

Architecture:
START
→ intake
→ timeline
→ parallel specialized investigators
→ evidence aggregation
→ hypothesis generation
→ hypothesis ranking
→ sufficiency gate
→ additional diagnostics if required
→ verifier
→ remediation planner
→ safety policy
→ human approval interrupt
→ sandbox execution
→ health verification
→ rollback on failure

Create a typed LangGraph state in /ai/graph/state.py.

Create specialized agents in /ai/agents.

Create deterministic reasoning utilities in /ai/reasoning.

Create read-only telemetry tools in /ai/tools.

Create hidden synthetic benchmark scenarios in /data.

Create six scenarios:
1 BAD_DEPLOYMENT
2 DB_CONNECTION_EXHAUSTION
3 MEMORY_LEAK
4 DOWNSTREAM_FAILURE
5 CPU_SATURATION
6 NETWORK_LATENCY

Each scenario must contain realistic logs, metrics, traces, deployment events, and dependency metadata.

Create a separate /data/ground_truth directory that the AI must NEVER load during diagnosis.

Create JSON schemas in /shared/contracts:
incident
evidence
diagnosis
remediation
audit

Important:
Do not hardcode the ground truth into prompts.
Do not let the LLM directly execute commands.
Do not build infrastructure-heavy observability systems.
Use JSON files as the observability backend.
Make everything deterministic and reproducible.

Expose the AI system through a small FastAPI service in /ai/service.py.

Endpoints:
POST /diagnose
POST /resume
GET /health

The service should accept an incident_id and return the standardized diagnosis contract.

Add mock fallback behavior so the backend can integrate before the real graph is ready.

Implement evaluation:
- top-1 root cause accuracy
- top-3 root cause accuracy
- diagnosis time
- remediation success
- evidence sufficiency detection
- confidence calibration
- comparison against rules-based baseline

Do not over-engineer.
The deadline is 2 PM today.
Prioritize a complete working vertical slice over sophisticated abstractions.
```

---

# 27. Jayanth's exact task

Paste this into his Antigravity agent.

```text
You are the backend engineer.

You own ONLY:
- /backend

Do NOT modify /ai or /frontend.

Build a FastAPI backend for:
Agentic AI for Autonomous Incident Diagnosis and Remediation.

The backend must act as the integration layer between:
Frontend
AI service
Sandbox
SQLite

Use:
- FastAPI
- Pydantic
- SQLite
- SQLAlchemy or sqlite3
- HTTP client for AI service
- Docker subprocess/API for sandbox where practical

Create:

/backend/api
/backend/services
/backend/db
/backend/schemas
/backend/mock

Endpoints:

GET  /api/incidents
GET  /api/incidents/{incident_id}
POST /api/incidents/{incident_id}/diagnose

GET  /api/diagnoses/{incident_id}

POST /api/approvals/{action_id}/approve
POST /api/approvals/{action_id}/reject

POST /api/remediations/{action_id}/execute
POST /api/remediations/{action_id}/rollback

GET /api/audit/{incident_id}
GET /api/evaluation
GET /api/health

The AI service is expected at:
http://localhost:8001

Support an environment variable:
AI_SERVICE_URL

For development, create a mock AI adapter so the backend works even if the AI service is unavailable.

Use ONLY the contracts in:
../shared/contracts

Do not invent different response structures.

SQLite tables:
incidents
evidence
hypotheses
remediations
approvals
audit_events
evaluations

Every important operation must create an audit event.

Safety rules:
- Never execute arbitrary commands from the LLM.
- Only execute whitelisted remediation actions.
- Validate action using Pydantic.
- Risky actions require explicit approval.
- Store approval timestamp and action metadata.
- Store pre-action health state.
- Store post-action health state.
- If approved action fails verification, invoke rollback.
- Record rollback in audit trail.

Allowed action enum:
restart_service
rollback_deployment
scale_service
clear_cache
disable_dependency

The executor should map those enum values to deterministic Python functions.

Create sandbox_service.py with mock mode first.
Support real Docker sandbox integration if available.

Create mock responses so frontend development can proceed independently.

Do not build authentication, user accounts, Redis, Kafka, Kubernetes, or microservice complexity.

Priority:
1 API working
2 approval workflow
3 audit trail
4 sandbox execution
5 rollback
6 evaluation endpoint

The final backend must be runnable with:
uvicorn backend.main:app --reload --port 8000
```

---

# 28. Karthik's exact task

Paste this into his Antigravity agent.

```text
You are the frontend engineer.

You own ONLY:
- /frontend

Do NOT modify /backend or /ai.

Build a production-style Incident Command Center for:
Agentic AI for Autonomous Incident Diagnosis and Remediation.

Use the fastest reliable stack:
React + Vite + TypeScript
Tailwind CSS
Axios/fetch

Backend:
http://localhost:8000

Create an interface containing:

1. Incident list/sidebar
2. Incident overview
3. Severity indicator
4. Incident timeline
5. Service topology/affected services
6. Evidence panel
7. Ranked root-cause hypotheses
8. Confidence values
9. Supporting and contradicting evidence
10. Verification status
11. Remediation plan
12. Risk level
13. Human approval control
14. Execution status
15. Health before/after remediation
16. Rollback status
17. Complete audit trail
18. Evaluation dashboard

Main demo flow:

Incident:
Payment failures after deployment

Display:
Deployment v1.5
→ error rate rises
→ latency rises
→ traces fail
→ AI generates hypotheses
→ bad deployment ranked first
→ evidence displayed
→ hypothesis verified
→ remediation proposed
→ approval requested
→ user clicks APPROVE & EXECUTE
→ sandbox executes rollback
→ health recovers
→ incident becomes RESOLVED

Do not build a generic chatbot.

Use cards, timeline components, status badges, tables, and simple charts.

Create frontend mock data so the UI works before backend integration.

All data structures must match:
../shared/contracts

Create an API service layer:
src/services/api.ts

Create TypeScript types:
src/types/

Do not hardcode the final API URLs inside components.

Priority:
1 beautiful incident dashboard
2 hypothesis visualization
3 remediation approval interaction
4 audit timeline
5 evaluation page

Use mock mode if backend is unavailable.
```

---

# 29. Shared contract rule

Before all three agents start substantial coding, create this:

```text
/shared/contracts/
```

and freeze these interfaces:

```text
Incident
Evidence
Hypothesis
Diagnosis
Remediation
AuditEvent
```

Nobody changes those casually.

That prevents this horror:

```text
Frontend expects:
confidence

Backend sends:
score

AI sends:
probability

Everyone discovers this at 1:57 PM.
```

---

# 30. AI service contract

Frontend never talks directly to Gemini.

Backend talks to:

```http
POST /diagnose
```

Request:

```json
{
  "incident_id": "INC-001"
}
```

Response:

```json
{
  "incident_id": "INC-001",
  "status": "DIAGNOSIS_COMPLETE",
  "timeline": [],
  "hypotheses": [],
  "root_cause": {},
  "evidence": [],
  "remediation": {},
  "confidence": 0.91,
  "requires_more_data": false,
  "audit_events": []
}
```

For approval:

```http
POST /resume
```

```json
{
  "thread_id": "INC-001-graph",
  "approval": "approved"
}
```

This allows LangGraph to pause at the human gate and resume later.

---

# 31. Why LangGraph rather than a pile of agents

Your architecture should be described to judges as:

> "A deterministic stateful orchestration graph containing specialized autonomous investigation agents."

That distinction matters.

The LLM performs:

```text
reasoning
hypothesis generation
evidence interpretation
diagnostic planning
remediation explanation
```

The graph controls:

```text
state
ordering
parallel investigation
loops
approval
execution
rollback
termination
```

The backend controls:

```text
permissions
audit
API
database
sandbox
```

This separation is exactly what makes the system defensible.

LangGraph is explicitly designed around stateful agent orchestration and human-in-the-loop workflows. ([LangChain][2])

---

# 32. LangSmith

Use LangSmith if your account is already available.

Trace:

```text
incident
  ↓
coordinator
  ↓
log agent
metrics agent
trace agent
  ↓
hypothesis generation
  ↓
verification
  ↓
remediation
```

Then during judging you can literally show:

```text
Agent execution trace
```

which gives you a nice observability-on-the-observability-system joke.

But **LangSmith must remain optional**.

Your system must work without it.

---

# 33. Gemini configuration

Use:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.8-flash
```

Don't hardcode the key.

Current Gemini documentation lists `gemini-3.8-flash` as a stable endpoint and describes the model family as suitable for agentic and multi-step workloads. ([Google AI for Developers][1])

Use one model rather than trying to orchestrate five different LLMs.

You have limited time and credits.

---

# 34. The actual demo

This should be your 3-minute judge demonstration.

### Step 1

Select:

```text
INC-001
Payment failures after deployment
CRITICAL
```

### Step 2

Click:

```text
Investigate Incident
```

### Step 3

Show the timeline:

```text
10:41 Deployment v1.5
10:42 Error rate spike
10:42 Latency spike
10:43 Payment traces failing
```

### Step 4

Show agents:

```text
✓ Log analysis
✓ Metric analysis
✓ Trace analysis
✓ Deployment analysis
✓ Dependency analysis
```

### Step 5

Show hypotheses:

```text
87% Bad Deployment
41% DB Connection Exhaustion
22% Downstream Failure
08% CPU Saturation
```

### Step 6

Show evidence:

```text
Deployment occurred 47 seconds before error spike
New errors only occur on payment-service v1.5
Trace failures originate inside payment-service
Previous version had normal health
```

### Step 7

Show:

```text
ROOT CAUSE VERIFIED
```

### Step 8

Remediation:

```text
Rollback payment-service
v1.5 → v1.4

Risk: MEDIUM
Reversible: YES
Human approval: REQUIRED
```

### Step 9

Click:

```text
APPROVE & EXECUTE
```

### Step 10

Sandbox:

```text
Before
Error Rate: 18.7%

Rollback

After
Error Rate: 0.4%

Health: RECOVERED
```

### Step 11

Open audit trail:

```text
Investigation started
Evidence collected
Hypothesis verified
Remediation proposed
Human approved
Rollback executed
Health verified
Incident resolved
```

Then show evaluation:

```text
Agentic system
vs
Rules baseline
```

That is the whole product in one sequence.

---

# 35. What to absolutely NOT build

Delete these ideas from your brain for today:

```text
Kubernetes
Prometheus
Grafana
Jaeger
real distributed tracing infrastructure
vector database
RAG
multi-model orchestration
MCP ecosystem
real cloud deployment
authentication
user management
real production integrations
```

None of that earns enough points per minute.

Your simulated telemetry is perfectly valid because the problem explicitly permits a **provided or simulated environment**.

---

# 36. Priority order from now until 2 PM

### 11:30–11:45

Freeze:

```text
contracts
repo structure
incident schemas
API schemas
```

### 11:45–12:30

Parallel:

```text
Sahil  → LangGraph + scenarios
Jayanth → FastAPI + SQLite + approval
Karthik → Dashboard + mocks
```

### 12:30–12:50

Integrate:

```text
AI → Backend
Backend → Frontend
```

### 12:50–1:10

Implement:

```text
sandbox execution
rollback
audit
```

### 1:10–1:25

Run all scenarios.

Fix anything that explodes.

### 1:25–1:40

Evaluation:

```text
agent
vs rules
```

### 1:40–1:50

Polish UI and demo flow.

### 1:50–2:00

Freeze.

No new features.

No "bro let's just add one more agent."

That sentence has murdered more hackathon projects than bad code ever did.

---

# 37. Final responsibility map

```text
SAHIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI / ML / AGENTS

LangGraph
Gemini
specialized agents
hypothesis reasoning
evidence engine
confidence
diagnostics
verification
remediation planning
evaluation
synthetic scenarios
ground truth
AI service


JAYANTH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKEND / SYSTEM

FastAPI
SQLite
API contracts
AI adapter
approval workflow
safety policy
sandbox
action execution
rollback
audit trail
evaluation API


KARTHIK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FRONTEND

React
dashboard
incident list
timeline
evidence
hypotheses
confidence visualization
remediation panel
approval UI
health before/after
audit trail
evaluation dashboard
mock mode
```

And the architectural philosophy is:

```text
LLM = reasoning
LangGraph = orchestration
Backend = control
Docker = sandbox
SQLite = memory/audit
React = operator interface
Synthetic scenarios = benchmark
Rules engine = baseline
Gemini = intelligence
Human = final authority
```

That is the system I would build under today's deadline.

[1]: https://ai.google.dev/gemini-api/docs/models?utm_source=chatgpt.com "Models  |  Gemini API  |  Google AI for Developers"
[2]: https://langchain-ai.github.io/langgraph/reference/?utm_source=chatgpt.com "langgraph | LangChain Reference"
