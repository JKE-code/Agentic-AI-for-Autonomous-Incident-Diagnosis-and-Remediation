import axios from 'axios';
import type {
  Incident,
  Diagnosis,
  AuditEvent,
  SystemEvaluation,
  Remediation,
} from '../types';
import { MOCK_INCIDENTS, MOCK_DIAGNOSES, MOCK_EVALUATION } from '../mock/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory local state cache for smooth demo progression when backend is offline
const localState = {
  incidents: JSON.parse(JSON.stringify(MOCK_INCIDENTS)) as Incident[],
  diagnoses: JSON.parse(JSON.stringify(MOCK_DIAGNOSES)) as Record<string, Diagnosis>,
  evaluation: JSON.parse(JSON.stringify(MOCK_EVALUATION)) as SystemEvaluation,
  backendConnected: false,
};

export const apiService = {
  async checkBackendHealth(): Promise<boolean> {
    try {
      const res = await client.get('/api/health');
      localState.backendConnected = res.status === 200;
      return localState.backendConnected;
    } catch {
      localState.backendConnected = false;
      return false;
    }
  },

  isLive(): boolean {
    return localState.backendConnected;
  },

  async getIncidents(): Promise<Incident[]> {
    try {
      const res = await client.get<Incident[]>('/api/incidents');
      localState.backendConnected = true;
      return res.data;
    } catch {
      return [...localState.incidents];
    }
  },

  async getIncident(id: string): Promise<Incident | null> {
    try {
      const res = await client.get<Incident>(`/api/incidents/${id}`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const found = localState.incidents.find((i) => i.incident_id === id);
      return found || null;
    }
  },

  async diagnoseIncident(id: string): Promise<Diagnosis> {
    try {
      const res = await client.post<Diagnosis>(`/api/incidents/${id}/diagnose`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[id] || localState.diagnoses['INC-001'];
      // Update incident status to INVESTIGATING
      const incident = localState.incidents.find((i) => i.incident_id === id);
      if (incident && incident.status === 'OPEN') {
        incident.status = 'INVESTIGATING';
      }
      return diagnosis;
    }
  },

  async getDiagnosis(incidentId: string): Promise<Diagnosis | null> {
    try {
      const res = await client.get<Diagnosis>(`/api/diagnoses/${incidentId}`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      return localState.diagnoses[incidentId] || localState.diagnoses['INC-001'] || null;
    }
  },

  async approveAction(actionId: string, incidentId: string): Promise<Remediation> {
    try {
      const res = await client.post<Remediation>(`/api/approvals/${actionId}/approve`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'APPROVED';
        diagnosis.remediation.approved_at = new Date().toISOString();

        const auditItem: AuditEvent = {
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'human',
          event: 'APPROVAL_GRANTED',
          action_id: actionId,
          details: `Remediation action ${actionId} approved by engineer. Queued for automated sandbox execution.`,
        };
        diagnosis.audit_events.push(auditItem);
        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async rejectAction(actionId: string, incidentId: string): Promise<Remediation> {
    try {
      const res = await client.post<Remediation>(`/api/approvals/${actionId}/reject`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'REJECTED';

        const auditItem: AuditEvent = {
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'human',
          event: 'APPROVAL_REJECTED',
          action_id: actionId,
          details: `Remediation action ${actionId} rejected by engineer. Human operator taking manual control.`,
        };
        diagnosis.audit_events.push(auditItem);
        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async executeRemediation(actionId: string, incidentId: string): Promise<Remediation> {
    try {
      const res = await client.post<Remediation>(`/api/remediations/${actionId}/execute`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'SUCCESS';
        diagnosis.remediation.executed_at = new Date().toISOString();

        // Update incident status to RESOLVED
        const inc = localState.incidents.find((i) => i.incident_id === incidentId);
        if (inc) {
          inc.status = 'RESOLVED';
          inc.resolved_at = new Date().toISOString();
        }

        // Add execution and health-check audit events
        diagnosis.audit_events.push({
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'agent',
          event: 'ACTION_EXECUTED',
          action_id: actionId,
          details: `Executed ${diagnosis.remediation.action} on ${diagnosis.remediation.target_service}. Rolling back to v1.4.`,
        });

        diagnosis.audit_events.push({
          audit_id: `AUD-${(Date.now() + 1).toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date(Date.now() + 3000).toISOString(),
          actor: 'system',
          event: 'HEALTH_CHECK',
          details: 'Post-remediation health check: Error rate dropped from 18.72% to 0.15%. Latency normalised to 115ms (PASS).',
        });

        diagnosis.audit_events.push({
          audit_id: `AUD-${(Date.now() + 2).toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date(Date.now() + 4000).toISOString(),
          actor: 'system',
          event: 'INCIDENT_RESOLVED',
          details: 'Incident INC-001 autonomously resolved and closed with 100% SLA compliance.',
        });

        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async rollbackRemediation(actionId: string, incidentId: string): Promise<Remediation> {
    try {
      const res = await client.post<Remediation>(`/api/remediations/${actionId}/rollback`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'ROLLED_BACK';

        diagnosis.audit_events.push({
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'system',
          event: 'ROLLBACK_EXECUTED',
          action_id: actionId,
          details: 'Automatic rollback executed due to post-action health verification failure.',
        });

        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async getAuditTrail(incidentId: string): Promise<AuditEvent[]> {
    try {
      const res = await client.get<AuditEvent[]>(`/api/audit/${incidentId}`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      return diagnosis ? diagnosis.audit_events : [];
    }
  },

  async getEvaluation(): Promise<SystemEvaluation> {
    try {
      const res = await client.get<SystemEvaluation>('/api/evaluation');
      localState.backendConnected = true;
      return res.data;
    } catch {
      return localState.evaluation;
    }
  },

  resetDemoState() {
    localState.incidents = JSON.parse(JSON.stringify(MOCK_INCIDENTS));
    localState.diagnoses = JSON.parse(JSON.stringify(MOCK_DIAGNOSES));
    localState.evaluation = JSON.parse(JSON.stringify(MOCK_EVALUATION));
  },
};
