## Why NOT PS3? ##

This is where I'd be very specific.

PS3 is excellent, but Microsoft's existing product ecosystem overlaps with almost every minimum requirement.

Your PS3 requires:

ingest security telemetry

Microsoft Sentinel already does this.

correlate security events

Sentinel/Defender already do this.

construct incident timeline / attack story

Microsoft security products already provide incident investigation and attack-story capabilities.

MITRE ATT&CK mapping

Microsoft security tooling already provides ATT&CK mapping.

explainable alerts

Security Copilot and Defender provide AI-assisted investigation/explanation.

recommend containment

Microsoft's security ecosystem provides response/remediation capabilities.

threat hunting

Microsoft provides AI-assisted threat-hunting capabilities.

So your PS3 could easily become:

Microsoft Security Copilot
       ↓
but we made a smaller version

That's a difficult differentiation story.

Microsoft's current documentation describes Security Copilot integration with Sentinel, and Microsoft's newer security agents include capabilities for threat detection, investigation and threat hunting.

## PS1 has overlap too — but your research angle is clearer. ##

Your differentiation becomes:

Evidence-bounded autonomous diagnosis with explicit hypothesis competition, uncertainty detection, reversible remediation and post-remediation causal validation.

That's not merely:
"AI finds incident."

I'd position it as:

Autonomous Incident Investigator
Evidence-Bounded Agentic Diagnosis & Safe Remediation
One-line description

An agentic SRE system that investigates production incidents by testing competing root-cause hypotheses against correlated observability evidence, then safely validates approved remediation in a reversible sandbox.

That sentence itself answers a lot of the judge's questions.

Your "Why did you choose this?" answer

I'd prepare:

"We chose this problem because modern production systems generate enormous amounts of observability data, but the difficult part isn't collecting telemetry—it's reasoning across it. We wanted to investigate whether an agent could move beyond alert summarization and actually test competing hypotheses, recognize insufficient evidence, and safely validate a remediation. The controlled sandbox gives us measurable ground truth and lets us evaluate the complete diagnosis-to-recovery loop."

That's strong.

## Your "What is unique?" answer ##

"Our focus isn't simply automated root-cause prediction. We make the reasoning evidence-bounded. The system generates competing hypotheses, explicitly tracks supporting and contradicting evidence, requests additional telemetry when confidence is insufficient, and cannot execute risky remediation without approval. After remediation, it verifies whether the predicted health improvement actually occurred and rolls back when it didn't."

That is your core differentiator.

## Your "Why not Microsoft Azure Monitor?" ##

Use this:

"We see Azure Monitor and Application Insights as foundational observability infrastructure rather than competitors. Our project explores the reasoning and experimentation layer on top: hypothesis generation, evidence verification, uncertainty handling and controlled remediation. We're deliberately not claiming to replace Microsoft's production observability products."

That's exactly the kind of answer I'd want your team to give.

## And your cost strategy ##

I would not promise the judges that everything is free.

Instead say:

"The prototype is designed to be reproducible with an open-source local stack, while Microsoft Foundry, Azure Monitor and Azure Container Apps are used where they add enterprise capabilities. Cloud usage is kept within available credits/free grants for the demonstration."

That's accurate.

The Azure Container Apps free grant is particularly useful for your sandbox.

For Foundry, remember:

Agent Service ≠ free LLM inference.

The current pricing documentation explicitly says model token consumption is charged separately.