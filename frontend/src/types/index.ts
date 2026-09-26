export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'REMEDIATING' | 'RESOLVED';

export interface Incident {
  incident_id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  started_at: string;
  resolved_at?: string;
  services: string[];
  description?: string;
  logs?: any[];
  metrics?: any[];
  traces?: any[];
  deployments?: any[];
  dependencies?: any[];
}

export type EvidenceSource = 'logs' | 'metrics' | 'traces' | 'deployments' | 'dependencies';

export interface Evidence {
  evidence_id: string;
  source: EvidenceSource;
  timestamp: string;
  service: string;
  observation: string;
  importance: number;
  supports: string[];
  contradicts: string[];
  confidence: number;
  raw_data?: Record<string, any>;
}

export type HypothesisStatus = 'VERIFIED' | 'DISPROVEN' | 'INVESTIGATING';

export interface Hypothesis {
  hypothesis_id: string;
  cause: string;
  service: string;
  score: number;
  confidence: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  tests: string[];
  status: HypothesisStatus;
}

export type RemediationActionType =
  | 'rollback_deployment'
  | 'restart_service'
  | 'scale_service'
  | 'clear_cache'
  | 'disable_dependency';

export type RemediationStatus =
  | 'PROPOSED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTING'
  | 'SUCCESS'
  | 'FAILED'
  | 'ROLLED_BACK';

export interface ServiceHealthMetric {
  error_rate: number; // percentage (e.g., 18.7%)
  latency_p99_ms: number;
  throughput_rps: number;
}

export interface Remediation {
  action_id: string;
  incident_id: string;
  action: RemediationActionType;
  target_service: string;
  parameters: Record<string, any>;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  status: RemediationStatus;
  explanation: string;
  rollback_plan: string;
  health_before?: ServiceHealthMetric;
  health_after?: ServiceHealthMetric;
  approved_at?: string;
  executed_at?: string;
}

export type AuditActor = 'system' | 'agent' | 'human';

export type AuditEventType =
  | 'INCIDENT_CREATED'
  | 'AGENT_STARTED'
  | 'EVIDENCE_COLLECTED'
  | 'HYPOTHESIS_CREATED'
  | 'HYPOTHESIS_VERIFIED'
  | 'REMEDIATION_PROPOSED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'ACTION_EXECUTED'
  | 'HEALTH_CHECK'
  | 'ROLLBACK_EXECUTED'
  | 'INCIDENT_RESOLVED';

export interface AuditEvent {
  audit_id: string;
  incident_id: string;
  timestamp: string;
  actor: AuditActor;
  event: AuditEventType;
  action_id?: string;
  details: string;
}

export interface TimelineItem {
  id: string;
  timestamp: string;
  timeDisplay: string;
  title: string;
  description: string;
  type: 'deployment' | 'anomaly' | 'metric' | 'log' | 'trace' | 'agent' | 'action';
  service?: string;
  severity?: 'critical' | 'warning' | 'info';
}

export interface Diagnosis {
  incident_id: string;
  status: string;
  timeline: TimelineItem[];
  hypotheses: Hypothesis[];
  root_cause: Hypothesis;
  evidence: Evidence[];
  remediation: Remediation;
  confidence: number;
  requires_more_data: boolean;
  audit_events: AuditEvent[];
}

export interface EvaluationScenario {
  scenario_id: string;
  title: string;
  category: 'BAD_DEPLOYMENT' | 'DB_CONNECTION_EXHAUSTION' | 'MEMORY_LEAK' | 'DOWNSTREAM_FAILURE' | 'CPU_SATURATION' | 'NETWORK_LATENCY';
  ground_truth_cause: string;
  agentic_pred: string;
  rules_pred: string;
  agentic_time: string;
  rules_time: string;
  agentic_match: boolean;
  rules_match: boolean;
  confidence: number;
}

export interface SystemEvaluation {
  scenarios_evaluated: number;
  agentic_metrics: {
    top_1_accuracy: number;
    top_3_accuracy: number;
    mttd_seconds: number;
    remediation_success_rate: number;
    evidence_sufficiency: number;
    confidence_calibration_ece: number;
    brier_score: number;
  };
  rules_baseline_metrics: {
    top_1_accuracy: number;
    top_3_accuracy: number;
    mttd_seconds: number;
    remediation_success_rate: number;
    evidence_sufficiency: number;
    confidence_calibration_ece: number;
    brier_score: number;
  };
  scenarios: EvaluationScenario[];
}
