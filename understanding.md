# SRE Autonomous Incident Diagnosis & Remediation
## Comprehensive Engineering & Pitch Guide for Judges

> **Author**: Jayanth (Backend & System Integration Engineer)  
> **Target Audience**: Hackathon Technical Judges (Microsoft Engineers & Cloud Architects)  
> **Core System**: AURA-SRE (Autonomous Resolution Agent for Site Reliability Engineering)

---

## 1. The 30-Second Elevator Pitch
> *"Modern production systems generate overwhelming amounts of observability telemetry, but during a major outage, collecting data isn't the problem—reasoning across it is.  
> We built **AURA-SRE**, an evidence-bounded multi-agent SRE system. Instead of asking an LLM to guess a root cause in a paragraph, our system runs a **Hypothesis Tournament** testing competing explanations against correlated logs, metrics, trace spans, and deployment diffs.  
> It tracks supporting and contradicting evidence, detects uncertainty, proposes minimal-risk reversible runbooks guarded by human approval, executes them in a sandbox, and automatically rolls back if health verification invariants aren't met."*

---

## 2. Full Architecture & Component Breakdown

The system is architected as three completely decoupled, production-grade layers communicating via frozen JSON contracts:

```
┌────────────────────────────────────────────────────────┐
│               REACT COMMAND CONSOLE (Port 5173)        │
│  Topology Map • Timeline • Hypotheses • Approval • Log │
└───────────────────────────┬────────────────────────────┘
                            │ REST (FastAPI endpoints)
                            ▼
┌────────────────────────────────────────────────────────┐
│               FASTAPI BACKEND & DB (Port 8000)         │
│   Incident Lifecycle • SQLite DB • Safety Whitelist    │
│   Health Check Verifier • Auto-Rollback • Audit Trail  │
└───────────────────────────┬────────────────────────────┘
                            │ Async HTTP Client (REST)
                            ▼
┌────────────────────────────────────────────────────────┐
│             LANGGRAPH AI SERVICE (Port 8001)           │
│   Gemini 3.8 Flash • Stateful Multi-Agent Graph        │
│   Hypothesis Tournament • Evidence Citations (E+/E-)   │
└────────────────────────────────────────────────────────┘
```

### Component 1: Frontend (`/frontend`)
- **Stack**: React 19, Vite, TypeScript, TailwindCSS v4, Recharts, Lucide Icons.
- **Port**: `http://localhost:5173`
- **Role**: SRE Operator Dashboard. Visualizes the dynamic service topology graph, multi-modal timeline, hypothesis cards with supporting/contradicting evidence badges, interactive approval modal, and live before/after health gauges.

### Component 2: Backend & Safety Gateway (`/backend`)
- **Stack**: Python 3.11/3.14, FastAPI, SQLAlchemy, SQLite, Pydantic v2.
- **Port**: `http://localhost:8000`
- **Role**: The integration and safety engine.
  - Manages incident state machine (`OPEN` $\rightarrow$ `DIAGNOSING` $\rightarrow$ `DIAGNOSED` $\rightarrow$ `APPROVED` $\rightarrow$ `RESOLVED` / `ROLLED_BACK`).
  - Persists state across 7 SQLite tables (`incidents`, `evidence`, `hypotheses`, `remediations`, `approvals`, `audit_events`, `evaluations`).
  - Enforces the **Deterministic Action Whitelist**: Translates typed LLM intent into verified Python functions; the LLM *never* touches the shell directly.
  - Controls the sandbox environment, executes health metric verification, and automatically invokes zero-downtime rollback if health metrics fail.

### Component 3: AI Investigation Engine (`/ai`)
- **Stack**: LangGraph (StateGraph), Google GenAI SDK (`gemini-3.8-flash`), LangChain Core.
- **Port**: `http://localhost:8001`
- **Role**: Autonomous multi-agent reasoning engine. Runs a stateful investigation graph with checkpointer and human-in-the-loop pause capability.

### Component 4: Shared Contracts (`/shared/contracts/`)
- Frozen JSON Schemas defining the exact API specifications:
  - `incident.schema.json`
  - `evidence.schema.json`
  - `hypothesis.schema.json`
  - `diagnosis.schema.json`
  - `remediation.schema.json`
  - `audit.schema.json`

---

## 3. The 4 Specialized Agents & How They Work

Instead of a single chaotic LLM prompt, we employ **4 specialized agents** coordinated inside a LangGraph state machine:

### Agent 1: Telemetry & Topology Correlator ("What happened & Where?")
- **Input**: Raw unstructured logs, Prometheus time-series metrics, OpenTelemetry distributed trace spans, and git deployment commits.
- **Function**:
  1. Aligns events across all microservices on a common millisecond-precision clock.
  2. Traverses the Directed Acyclic Graph (DAG) of service dependencies (`api-gateway` $\rightarrow$ `order-service` $\rightarrow$ `payment-service` $\rightarrow$ `databases`).
  3. Separates the **symptom** (e.g. API Gateway 504 timeout) from the **propagation origin** (e.g. Payment Service null pointer exception).
- **Output**: Chronological incident timeline and affected node cluster.

### Agent 2: Hypothesis Generator & Evidence Verifier ("Why did it happen?")
- **Function**: Runs an **Evidence-Bounded Hypothesis Tournament**.
  - Formulates 3–6 competing, mutually distinct hypotheses ($H_1, H_2, H_3...$).
  - For each candidate hypothesis, actively cites:
    - **Supporting Evidence ($E^+$)**: Telemetry that proves the hypothesis.
    - **Contradicting Evidence ($E^-$)**: Telemetry that disproves or rules it out.
  - Computes a calibrated Bayesian confidence score:
    $$\text{Score}(H_i) = \frac{\sum w_j E^+_{ij}}{\sum w_j E^+_{ij} + \sum u_k E^-_{ik} + \lambda}$$
  - **Dynamic Inquiry Loop (Bonus #2)**: If confidence is below threshold ($\tau < 0.70$) or critical signals are missing, the agent emits targeted diagnostic queries (e.g. inspecting thread dumps or slow query logs) rather than hallucinating.
- **Output**: Ranked root-cause dossier with cited evidence IDs and confidence scores.

### Agent 3: Remediation Planning Agent ("How do we safely fix it?")
- **Function**:
  - Matches verified root cause to the minimal blast-radius remediation action.
  - Generates the expected recovery effect (e.g. error rate drop to $< 2\%$).
  - **Mandatory Invariant**: Every proposed action *must* include an automated inverse rollback spec (e.g., Action: `rollback to v1.4`, Rollback: `re-deploy v1.5`).
  - Flags risk tier (`LOW`, `MEDIUM`, `HIGH`). High/Medium risks are locked behind the Human Approval Gate.
- **Output**: Structured Remediation Plan adhering to `remediation.schema.json`.

### Agent 4: Sandbox Executor & Causal Health Verifier ("Did the fix work?")
- **Function**:
  - Executes the approved plan inside an isolated container sandbox.
  - Takes a **Pre-Action Health Snapshot** (error rate, CPU, memory, latency).
  - Executes the deterministic operation.
  - Takes a **Post-Action Health Snapshot** after synthetic traffic probing.
  - **Causal Verification**: If metrics recover $\rightarrow$ Marks `VERIFIED` & `RESOLVED`.
  - **Automated Rollback**: If metrics remain degraded or worsen $\rightarrow$ Immediately executes the rollback script, restores pre-action baseline, and logs `ROLLBACK_EXECUTED`.

---

## 4. End-to-End Walkthrough: What Happens Behind the Scenes

When an operator opens the dashboard and clicks **"Investigate & Diagnose"**:

1. **Frontend Request**:
   - `POST http://localhost:8000/api/incidents/INC-001/diagnose`
2. **Backend Processing**:
   - Backend transitions incident state to `DIAGNOSING`.
   - Logs audit event: `AGENT_STARTED`.
   - Asynchronously forwards telemetry payload to AI service at `http://localhost:8001/diagnose`.
3. **LangGraph Execution**:
   - Node 1: `intake` receives incident data.
   - Node 2: Specialist agents (`log_agent`, `metrics_agent`, `trace_agent`, `deployment_agent`, `dependency_agent`) analyze respective streams in parallel.
   - Node 3: `evidence_aggregator` compiles evidence list with importance weights.
   - Node 4: `hypothesis_generator` uses Gemini 3.8 Flash to propose competing explanations.
   - Node 5: `hypothesis_verifier` tests each hypothesis against supporting/contradicting evidence.
   - Node 6: `check_confidence` conditional edge checks if confidence is sufficient.
   - Node 7: `remediation_planner` drafts the safe action plan and rollback instructions.
4. **Backend Persistence**:
   - AI service returns `DiagnosisResponse`.
   - Backend commits evidence, hypotheses, and remediation records to SQLite.
   - Logs audit events: `EVIDENCE_COLLECTED`, `HYPOTHESIS_VERIFIED`, `REMEDIATION_PROPOSED`.
   - Incident transitions to `DIAGNOSED` (awaiting operator review).
5. **Operator Approval**:
   - Operator clicks **"Approve & Execute"** $\rightarrow$ `POST /api/approvals/ACT-001/approve`.
   - Backend records `APPROVAL_GRANTED` with operator identity and timestamp.
   - Calls `/resume` on LangGraph to resume checkpointed workflow.
6. **Sandbox Execution & Verification**:
   - Operator triggers execution $\rightarrow$ `POST /api/remediations/ACT-001/execute`.
   - Backend maps action enum (`rollback_deployment`) to safe Python function.
   - Pre-health error rate: `18.7%`.
   - Target version restored: `v1.5` $\rightarrow$ `v1.4`.
   - Post-health error rate: `0.2%`.
   - Health criteria (`error_rate < 2%`) passed $\rightarrow$ Incident marked `RESOLVED`.
   - Full trace logged to immutable audit ledger.

---

## 5. Our 6 Production Incident Scenarios

We evaluated our system against 6 real-world failure patterns:

| Scenario ID | Failure Pattern | Primary Symptom | True Root Cause | Safe Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **INC-001** | Bad Microservice Release | Payment 500 error spike post-release | `BAD_DEPLOYMENT` (Null pointer in `payment-service` v1.5) | `rollback_deployment` to `v1.4` |
| **INC-002** | Database Connection Exhaustion | Order API latency spikes to 4800ms | `DB_CONNECTION_EXHAUSTION` (Leaked unclosed DB transactions) | `restart_service` on `order-service` |
| **INC-003** | Memory Leak / OOM Kill Loop | Payment pod crashlooping (exit 137) | `MEMORY_LEAK` (Unbounded cache growth in transaction manager) | `restart_service` + cache clear |
| **INC-004** | Downstream Dependency Failure | Ingress gateway timeouts | `DOWNSTREAM_FAILURE` (External payment provider 12s latency) | `disable_dependency` & failover |
| **INC-005** | CPU Saturation under Flash Traffic | Pending order queue backlog (4200 items) | `CPU_SATURATION` (Order service CPU 97.4%) | `scale_service` to 4 replicas |
| **INC-006** | Network Latency Degradation | Inter-service RTT rose from 4ms to 850ms | `NETWORK_LATENCY` (Virtual bridge socket buffer saturation) | `restart_service` on `inventory-service` |

---

## 6. Quantitative Evaluation & Baseline Comparison

We implemented a built-in benchmarking harness comparing our **Agentic AI** directly against a **Rules-Based Baseline** (standard PromQL / static threshold rules):

| Metric | Agentic Multi-Agent AI | Rules-Based Baseline | Delta / Advantage |
| :--- | :--- | :--- | :--- |
| **Root Cause Top-1 Accuracy** | **100.0%** (6/6) | **66.7%** (4/6) | **+33.3%** accuracy boost |
| **Root Cause Top-3 Accuracy** | **100.0%** (6/6) | **83.3%** (5/6) | **+16.7%** accuracy boost |
| **Mean Time to Diagnosis (MTTD)** | **1.305 seconds** | **0.150 seconds** | Sub-2-second deep causal diagnosis |
| **Remediation Success Rate** | **100.0%** | **50.0%** | Rules baseline triggered wrong reboot on bad deployment |
| **Evidence Sufficiency Detection** | **100.0%** | **0.0%** | Static rules cannot recognize missing context |
| **Confidence Calibration (Brier)** | **0.038** (Well-calibrated) | **0.285** (Overconfident) | High probability correlates with ground truth |

### Why Rules Baselines Fail on Cascading Outages:
- In **INC-001**, static threshold rules fired on "Ingress API 504 timeout" and recommended restarting `api-gateway` (which does not fix the bug).
- The **Agentic AI** traced backward across the service topology graph, correlated the git deployment timestamp with the error spike, examined the stack trace, and correctly identified `payment-service` code defect as the root cause.

---

## 7. How to Ace Judge Questions (Microsoft-Specific Strategy)

### Q1: "Why did you build this when Microsoft already has Azure Monitor, Application Insights, and Sentinel?"
> **Your Answer**:  
> *"We see Azure Monitor and Application Insights as foundational observability infrastructure rather than competitors. Azure Monitor is world-class at collecting and querying logs and metrics.  
> However, our system explores the **reasoning and remediation layer on top**: hypothesis generation, causal tournament testing, uncertainty detection, and controlled containerized remediation. We don't replace Azure Monitor—we are the AI SRE engineer that analyzes Azure Monitor telemetry to solve outages in seconds."*

### Q2: "How is your architecture enterprise-ready for Microsoft Azure?"
> **Your Answer**:  
> *"Our architecture was designed with a dual-mode enterprise bridge:  
> 1. **Telemetry Ingestion**: Strictly adheres to the OpenTelemetry schema, making it 100% plug-and-play with **Azure Application Insights**.  
> 2. **Database**: Built on SQLAlchemy, allowing seamless switching from local SQLite to **Azure Cosmos DB** or **Azure SQL Database** via connection string.  
> 3. **Sandbox Execution**: Our container rollback model mirrors **Azure Container Apps (ACA)** revision management (`az containerapp revision set-active`).  
> We kept local SQLite and container simulation in the prototype to guarantee complete, zero-cost reproducibility for the hackathon evaluation."*

### Q3: "What prevents the LLM from hallucinating and executing a destructive command like `rm -rf /` or dropping a database?"
> **Your Answer**:  
> *"The LLM **never** has shell or command execution access. It can only propose strongly typed intent via a Pydantic schema enum: `rollback_deployment`, `restart_service`, `scale_service`, `clear_cache`, or `disable_dependency`.  
> The backend validates the enum against a deterministic safety whitelist, enforces Human-in-the-Loop approval with a blast-radius risk score, executes only predefined Python functions in a container sandbox, and automatically rolls back if health verification fails."*

### Q4: "Why LangGraph instead of raw agents or AutoGen/CrewAI?"
> **Your Answer**:  
> *"Unconstrained autonomous agent loops are unpredictable, slow, and prone to endless cycling. LangGraph provides a **stateful, deterministic orchestration graph**. It allows specialized agents to run parallel investigations while guaranteeing strict state transitions, persistence, and checkpointing for Human-in-the-Loop pause and resume."*

---

## 8. Live Demonstration Script for Judges

Follow this exact sequence during your live presentation:

1. **Open the Dashboard**:
   - Navigate to `http://localhost:5173`.
   - Point out the clean dark-mode Incident Command Center layout.
2. **Select Incident INC-001**:
   - Highlight the alert badge: `CRITICAL - Payment failures and HTTP 500 error spike post-release`.
   - Point to the **Service Topology Graph**: show `api-gateway` in amber (degraded) and `payment-service` in red (root failure).
3. **Click "Investigate & Diagnose"**:
   - Watch the multi-agent graph execute live.
   - Point out the **Incident Timeline**: show how the deployment at `10:41:00Z` directly precedes the error surge at `10:42:15Z`.
4. **Showcase the Hypothesis Tournament**:
   - Point to **Hypothesis 1 (84% score)**: `Bad deployment of payment-service v1.5`.
   - Highlight the **Supporting Evidence (E+)**: Log stack trace citing `NullPointerException` at line 84.
   - Highlight the **Contradicting Evidence (E-)**: Show how the DB exhaustion hypothesis was ruled out because active DB connections remained normal (22/100).
5. **Execute Safe Remediation**:
   - Point to the **Remediation Plan**: Action: `rollback_deployment` from `v1.5` to `v1.4` (Risk: `MEDIUM`).
   - Click **"Approve & Execute"**: Demonstrate the Human-in-the-Loop safety gate.
6. **Verify Health Improvement**:
   - Point to the **Health Comparison Gauge**:
     - Error rate drops from **18.7%** $\rightarrow$ **0.2%**.
     - Status turns green: **`VERIFIED & RESOLVED`**.
7. **Show the Audit Trail & Benchmark**:
   - Click **Audit Trail**: Show the immutable chronological log from intake to resolution.
   - Click **System Evaluation**: Show the benchmark matrix proving 100% accuracy vs. 66.7% for the rules baseline.
