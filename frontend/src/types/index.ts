export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'DIAGNOSING' | 'DIAGNOSED' | 'APPROVED' | 'MITIGATING' | 'REMEDIATING' | 'REJECTED' | 'RESOLVED';

export interface Incident {
  incident_id: string;
  title: string;
  severity: IncidentSeverity;
  status: string;
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
  source: EvidenceSource | string;
  timestamp: string;
  service: string;
  observation: string;
  importance: number;
  supports: string[];
  contradicts: string[];
  confidence: number;
  raw_data?: Record<string, any>;
}

export type HypothesisStatus = 'VERIFIED' | 'DISPROVEN' | 'RULED_OUT' | 'INVESTIGATING';

export interface Hypothesis {
  hypothesis_id: string;
  cause: string;
  service: string;
  score: number;
  confidence: number;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  tests: string[];
  status: HypothesisStatus | string;
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
  error_rate: number;
  latency_p99_ms?: number;
  latency_ms?: number;
  throughput_rps: number;
  status?: string;
}

export interface VerificationRule {
  metric: string;
  threshold: string;
}

export interface Remediation {
  action_id: string;
  incident_id?: string;
  action: RemediationActionType | string;
  service?: string;
  target_service?: string;
  current_version?: string | null;
  target_version?: string | null;
  replicas?: number | null;
  parameters?: Record<string, any>;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  status: RemediationStatus | string;
  expected_effect?: string;
  explanation?: string;
  rollback_plan?: string;
  verification?: VerificationRule;
  requires_approval?: boolean;
  health_before?: ServiceHealthMetric;
  health_after?: ServiceHealthMetric;
  pre_health?: ServiceHealthMetric;
  post_health?: ServiceHealthMetric;
  approved_at?: string;
  executed_at?: string;
}

export type AuditActor = 'system' | 'agent' | 'ai' | 'human';

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
  actor: AuditActor | string;
  event: AuditEventType | string;
  action_id?: string | null;
  details: string;
  metadata?: Record<string, any>;
}

export interface TimelineItem {
  id?: string;
  timestamp: string;
  timeDisplay?: string;
  title?: string;
  event?: string;
  description?: string;
  source?: string;
  type?: 'deployment' | 'anomaly' | 'metric' | 'log' | 'trace' | 'agent' | 'action' | string;
  service?: string;
  severity?: 'critical' | 'warning' | 'info';
}

export interface Diagnosis {
  incident_id: string;
  status: string;
  timeline: TimelineItem[];
  hypotheses: Hypothesis[];
  root_cause: {
    hypothesis_id?: string;
    cause?: string;
    service?: string;
    summary?: string;
    score?: number;
    confidence?: number;
    supporting_evidence?: string[];
    contradicting_evidence?: string[];
    tests?: string[];
    status?: string;
  } | null;
  evidence: Evidence[];
  remediation: Remediation | null;
  confidence: number;
  requires_more_data: boolean;
  audit_events: AuditEvent[];
}

export interface ScenarioBreakdownItem {
  scenario_id: string;
  title: string;
  ground_truth_cause: string;
  predicted_cause: string;
  top1_correct: boolean;
  top3_correct: boolean;
  diagnosis_time_ms: number;
  remediation_successful: boolean;
  confidence: number;
}

export interface MetricBlock {
  top1_accuracy?: number;
  top_1_accuracy?: number;
  top3_accuracy?: number;
  top_3_accuracy?: number;
  mttd_seconds: number;
  remediation_success_rate: number;
  evidence_sufficiency_rate?: number;
  evidence_sufficiency?: number;
  confidence_calibration_brier?: number;
  confidence_calibration_ece?: number;
  brier_score?: number;
}

export interface SystemEvaluation {
  benchmark_name?: string;
  scenarios_evaluated: number;
  agentic_metrics: MetricBlock;
  rules_baseline_metrics: MetricBlock;
  scenario_breakdown?: ScenarioBreakdownItem[];
  scenarios?: any[];
}
