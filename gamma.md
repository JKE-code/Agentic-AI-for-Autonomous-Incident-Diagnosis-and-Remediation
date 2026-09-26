# Gamma.app Presentation Prompt

Copy and paste the entire prompt below directly into **[Gamma.app](https://gamma.app)** (choose **"Create new"** -> **"Paste in text"** -> **"Presentation"**).

---

```text
Create a clean, professional, high-impact 10-slide presentation for technical judges at a hackathon.
Topic: Agentic AI for Autonomous Incident Diagnosis and Remediation
Audience: Senior Software Engineers, Cloud Architects, and Site Reliability Engineers (including Microsoft judges).
Tone: Authoritative, modern, engineering-driven, concise, and compelling. Avoid marketing fluff; focus on architecture, causality, safety, and benchmark metrics.
Design Style: Sleek dark mode, cyber/observability aesthetic, sharp cards, minimal text, bold key metrics, and clear flowcharts.

---

### Slide 1: Title Slide
- Title: AURA-SRE: Autonomous Incident Diagnosis & Safe Remediation
- Subtitle: Evidence-Bounded Multi-Agent Reasoning for Production Telemetry & Automated Recovery
- Presenters: Autonomous SRE Team (Jayanth, Sahil, Karthik)
- Key Hook: Moving beyond passive alert summaries to hypothesis competition, causal verification, and risk-gated container rollbacks.

### Slide 2: The Problem: The Alert Deluge & Cascading Failures
- The Challenge: Modern cloud architectures generate gigabytes of logs, metrics, and trace spans per minute.
- Why Rules & Alertmanager Fail: Static threshold alerts (e.g., CPU > 90%, Ingress 504) trigger hundreds of noisy pages without isolating the root cause across multi-hop microservices.
- The SRE Bottleneck: Engineers waste 30–60 minutes manually cross-referencing deployment diffs, database connections, and trace waterfalls while downtime costs accumulate.
- Key Insight: Telemetry collection is solved; causal reasoning and safe autonomous remediation are the missing links.

### Slide 3: Our Innovation: Evidence-Bounded Agentic Diagnosis
- Core Differentiator: Unlike standard LLM chatbots that hallucinate root causes in paragraphs, our system is strictly evidence-bounded.
- 3 Foundational Pillars:
  1. Competing Hypothesis Tournament: The agent formulates mutually exclusive hypotheses (H₁, H₂, H₃) and maps supporting (E+) vs. contradicting (E-) telemetry.
  2. Epistemic Uncertainty Detection: When evidence is insufficient, it actively probes additional diagnostic spans rather than guessing.
  3. Reversible Sandbox Execution: Changes run in containerized sandboxes with automated health invariants and zero-lag rollback.

### Slide 4: System Architecture: 4 Specialized Agents in LangGraph
- Orchestration: Stateful LangGraph state machine with deterministic safety edges and checkpointers.
- The 4 Specialized Agents:
  1. Telemetry & Topology Correlator: Aligns logs, metrics, traces, and git deployments along a chronological timeline and dependency graph.
  2. Hypothesis Generator & Verifier: Evaluates competing root causes against evidence citations using calibrated Bayesian confidence.
  3. Remediation Planner & Safety Arbiter: Formulates minimal blast-radius runbooks with mandatory rollback specs.
  4. Sandbox Executor & Health Verifier: Executes changes, injects synthetic probes, and validates before-vs-after recovery metrics.

### Slide 5: Deep Dive: The Hypothesis Tournament & Calibrated Confidence
- Tournament Structure:
  - Hypothesis A: Bad Deployment v1.5 (Null Pointer defect)
  - Hypothesis B: DB Connection Pool Saturation
  - Hypothesis C: Network Bridge Degradation
- Dual-Sided Evidentiary Citations:
  - Supporting Evidence (+): Log stack trace at PaymentProcessor:84, Error rate surge to 18.7% post-release.
  - Contradicting Evidence (-): Database active connections steady at 22/100, query response time normal (14ms).
- Result: Calibrated Confidence Score (0.94) isolating the true root cause with zero guesswork.

### Slide 6: Safety First: Human-in-the-Loop & Guaranteed Rollback
- Deterministic Safety Whitelist: The LLM is strictly forbidden from executing arbitrary shell, SQL, or Docker commands.
- Constrained Action Enum:
  - rollback_deployment
  - restart_service
  - scale_service
  - clear_cache
  - disable_dependency
- Human-in-the-Loop (HITL) Gate: High-risk changes require interactive operator authorization displaying diff, blast-radius score, and rollback guarantees.
- Zero-Lag Auto-Rollback: If post-action health fails verification criteria within 5 seconds, the system automatically triggers rollback to the previous healthy state.

### Slide 7: Enterprise Integration: Built for the Microsoft Ecosystem
- Observability Ingestion: Formatted strictly according to OpenTelemetry standards, mapping directly to Azure Application Insights and Azure Monitor.
- Database Layer: SQLAlchemy abstraction layer allowing seamless transition from local SQLite to Azure Cosmos DB or Azure SQL Database.
- Compute Sandbox: Container lifecycle modeled on Azure Container Apps (ACA) revision rollbacks (`az containerapp revision set-active`).
- Strategic Positioning: We do not replace Azure Monitor—we provide the autonomous reasoning and remediation brain on top of it.

### Slide 8: Quantitative Evaluation: Agentic AI vs. Rules Baseline
- Benchmark Methodology: Rigorous evaluation across 6 standardized, labeled production incident scenarios (Bad Deployment, DB Leak, OOM Kill, Downstream Latency, CPU Saturation, Network Drops).
- Comparative Results:
  - Root Cause Top-1 Accuracy: Agentic AI 100.0% vs. Rules-Based Baseline 66.7% (+33.3% improvement)
  - Root Cause Top-3 Accuracy: Agentic AI 100.0% vs. Rules-Based Baseline 83.3%
  - Mean Time to Diagnosis (MTTD): 1.305 seconds (vs. 45+ minutes human average)
  - Spurious / Hallucinated Action Rate: 0.0% (guarded by evidence verification)

### Slide 9: Live Demo Walkthrough: Incident INC-001
- Step 1: Ingress error rate explodes to 18.7% following payment-service release.
- Step 2: Agent correlates deployment commit 8f2a1b with error spikes on the service topology map.
- Step 3: Hypothesis Tournament validates code defect; rules out DB and network causes with counter-evidence citations.
- Step 4: Operator reviews risk diff and clicks [Approve & Execute].
- Step 5: Sandbox rolls back to v1.4 $\rightarrow$ live health gauge drops error rate to 0.2% $\rightarrow$ incident marked RESOLVED with full audit trace.

### Slide 10: Conclusion & Business Impact
- Tangible Value:
  - 95%+ Reduction in Mean Time to Recovery (MTTR).
  - Eliminates on-call burnout from noisy false alerts.
  - 100% Auditable: Every diagnostic step, evidence citation, and operator approval is cryptographically logged in an immutable audit ledger.
- Future Roadmap: Multi-region canary rollouts, fine-tuned incident reasoning SLMs, and continuous post-mortem knowledge graph synthesis.
- Call to Action: Experience the live Incident Command Console at http://localhost:5173.
```
