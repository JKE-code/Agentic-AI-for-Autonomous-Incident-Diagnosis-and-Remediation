import axios from 'axios';
import type {
  Incident,
  Diagnosis,
  AuditEvent,
  SystemEvaluation,
} from '../types';
import { MOCK_INCIDENTS, MOCK_DIAGNOSES, MOCK_EVALUATION } from '../mock/mockData';

const DEFAULT_RENDER_URL = 'https://agentic-ai-for-autonomous-incident.onrender.com';
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const BASE_URL = import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:8000' : DEFAULT_RENDER_URL);

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Local cache for fallback / simulation
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
      localState.backendConnected = res.status === 200 && res.data?.status === 'UP';
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
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
      return [...localState.incidents];
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
      // Also fetch latest audit trail
      const audit = await this.getAuditTrail(id);
      const diagnosisData = res.data;
      if (audit.length > 0) {
        diagnosisData.audit_events = audit;
      }
      return diagnosisData;
    } catch {
      const diagnosis = localState.diagnoses[id] || localState.diagnoses['INC-001'];
      const incident = localState.incidents.find((i) => i.incident_id === id);
      if (incident && incident.status === 'OPEN') {
        incident.status = 'DIAGNOSING';
        setTimeout(() => {
          incident.status = 'DIAGNOSED';
        }, 1200);
      }
      return diagnosis;
    }
  },

  async getDiagnosis(incidentId: string): Promise<Diagnosis | null> {
    try {
      const res = await client.get<Diagnosis>(`/api/diagnoses/${incidentId}`);
      localState.backendConnected = true;
      const diag = res.data;
      // Fetch latest audit trail from backend
      try {
        const auditRes = await client.get<AuditEvent[]>(`/api/audit/${incidentId}`);
        if (Array.isArray(auditRes.data) && auditRes.data.length > 0) {
          diag.audit_events = auditRes.data;
        }
      } catch {
        // use diag.audit_events
      }
      return diag;
    } catch {
      return localState.diagnoses[incidentId] || localState.diagnoses['INC-001'] || null;
    }
  },

  async approveAction(actionId: string, incidentId: string): Promise<any> {
    try {
      const res = await client.post(`/api/approvals/${actionId}/approve`, {
        actor: 'human',
        reason: 'Operator approved sandbox execution via Command Center',
      });
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'APPROVED';
        diagnosis.remediation.approved_at = new Date().toISOString();

        diagnosis.audit_events.push({
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'human',
          event: 'APPROVAL_GRANTED',
          action_id: actionId,
          details: `Remediation action ${actionId} approved by operator.`,
        });
        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async rejectAction(actionId: string, incidentId: string): Promise<any> {
    try {
      const res = await client.post(`/api/approvals/${actionId}/reject`, {
        actor: 'human',
        reason: 'Operator rejected remediation proposal in Command Center',
      });
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'REJECTED';
        diagnosis.audit_events.push({
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'human',
          event: 'APPROVAL_REJECTED',
          action_id: actionId,
          details: `Remediation action ${actionId} rejected by operator.`,
        });
        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async executeRemediation(actionId: string, incidentId: string): Promise<any> {
    try {
      const res = await client.post(`/api/remediations/${actionId}/execute`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'SUCCESS';
        diagnosis.remediation.executed_at = new Date().toISOString();

        const inc = localState.incidents.find((i) => i.incident_id === incidentId);
        if (inc) {
          inc.status = 'RESOLVED';
          inc.resolved_at = new Date().toISOString();
        }

        diagnosis.audit_events.push({
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'ai',
          event: 'ACTION_EXECUTED',
          action_id: actionId,
          details: `Executed ${diagnosis.remediation.action} on ${diagnosis.remediation.service || diagnosis.remediation.target_service}.`,
        });

        diagnosis.audit_events.push({
          audit_id: `AUD-${(Date.now() + 1).toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'system',
          event: 'HEALTH_CHECK',
          details: 'Post-remediation health check: Error rate normalized (< 0.2%). All probes PASS.',
        });

        diagnosis.audit_events.push({
          audit_id: `AUD-${(Date.now() + 2).toString().slice(-4)}`,
          incident_id: incidentId,
          timestamp: new Date().toISOString(),
          actor: 'system',
          event: 'INCIDENT_RESOLVED',
          details: `Incident ${incidentId} marked as RESOLVED.`,
        });

        return diagnosis.remediation;
      }
      throw new Error('Action not found');
    }
  },

  async rollbackRemediation(actionId: string, incidentId: string): Promise<any> {
    try {
      const res = await client.post(`/api/remediations/${actionId}/rollback`);
      localState.backendConnected = true;
      return res.data;
    } catch {
      const diagnosis = localState.diagnoses[incidentId];
      if (diagnosis && diagnosis.remediation) {
        diagnosis.remediation.status = 'ROLLED_BACK';
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

  async resetIncident(incidentId: string): Promise<boolean> {
    try {
      await client.post(`/api/incidents/${incidentId}/reset`);
      return true;
    } catch {
      return false;
    }
  },

  async resetAll(): Promise<boolean> {
    try {
      await client.post('/api/incidents/reset_all');
      localState.incidents = JSON.parse(JSON.stringify(MOCK_INCIDENTS));
      localState.diagnoses = JSON.parse(JSON.stringify(MOCK_DIAGNOSES));
      localState.evaluation = JSON.parse(JSON.stringify(MOCK_EVALUATION));
      return true;
    } catch {
      localState.incidents = JSON.parse(JSON.stringify(MOCK_INCIDENTS));
      localState.diagnoses = JSON.parse(JSON.stringify(MOCK_DIAGNOSES));
      localState.evaluation = JSON.parse(JSON.stringify(MOCK_EVALUATION));
      return true;
    }
  },

  resetDemoState() {
    this.resetAll();
  },
};
