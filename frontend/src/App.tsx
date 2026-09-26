import React, { useState, useEffect } from 'react';
import type { Incident, Diagnosis, SystemEvaluation } from './types';
import { apiService } from './services/api';
import { Navbar } from './components/Navbar';
import { IncidentSidebar } from './components/IncidentSidebar';
import { IncidentOverview } from './components/IncidentOverview';
import { IncidentTimeline } from './components/IncidentTimeline';
import { HypothesisPanel } from './components/HypothesisPanel';
import { EvidencePanel } from './components/EvidencePanel';
import { RemediationPanel } from './components/RemediationPanel';
import { AuditTrail } from './components/AuditTrail';
import { ServiceTopology } from './components/ServiceTopology';
import { EvaluationDashboard } from './components/EvaluationDashboard';
import {
  Activity,
  Clock,
  BrainCircuit,
  BarChart2,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command-center' | 'topology' | 'evaluation'>('command-center');
  const [detailSubTab, setDetailSubTab] = useState<
    'all' | 'timeline' | 'hypotheses' | 'evidence' | 'remediation' | 'audit'
  >('all');

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncidentId, setActiveIncidentId] = useState<string>('INC-001');
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [evaluation, setEvaluation] = useState<SystemEvaluation | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState<boolean>(false);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState<string>('');

  // Initial data loading
  useEffect(() => {
    loadData();
    const interval = setInterval(checkBackend, 5000);
    return () => clearInterval(interval);
  }, []);

  // When active incident changes, fetch its diagnosis
  useEffect(() => {
    if (activeIncidentId) {
      loadIncidentDiagnosis(activeIncidentId);
    }
  }, [activeIncidentId]);

  const checkBackend = async () => {
    const live = await apiService.checkBackendHealth();
    setIsLiveBackend(live);
  };

  const loadData = async () => {
    await checkBackend();
    const incList = await apiService.getIncidents();
    setIncidents(incList);
    const evalData = await apiService.getEvaluation();
    setEvaluation(evalData);
    if (incList.length > 0) {
      const active = incList.find((i) => i.incident_id === activeIncidentId) || incList[0];
      setActiveIncidentId(active.incident_id);
      loadIncidentDiagnosis(active.incident_id);
    }
  };

  const loadIncidentDiagnosis = async (incId: string) => {
    const diag = await apiService.getDiagnosis(incId);
    setDiagnosis(diag);
  };

  const handleDiagnose = async () => {
    if (!activeIncidentId) return;
    setIsDiagnosing(true);
    await new Promise((r) => setTimeout(r, 1200)); // Smooth simulation
    const updatedDiag = await apiService.diagnoseIncident(activeIncidentId);
    setDiagnosis({ ...updatedDiag });
    setIsDiagnosing(false);

    // Refresh incident list status
    const updatedList = await apiService.getIncidents();
    setIncidents(updatedList);
  };

  const handleApproveAndExecute = async (actionId: string) => {
    if (!activeIncidentId) return;
    await apiService.approveAction(actionId, activeIncidentId);
    await apiService.executeRemediation(actionId, activeIncidentId);

    // Refresh active diagnosis and incidents
    const updatedDiag = await apiService.getDiagnosis(activeIncidentId);
    setDiagnosis(updatedDiag ? { ...updatedDiag } : null);
    const incList = await apiService.getIncidents();
    setIncidents([...incList]);
  };

  const handleReject = async (actionId: string) => {
    if (!activeIncidentId) return;
    await apiService.rejectAction(actionId, activeIncidentId);
    const updatedDiag = await apiService.getDiagnosis(activeIncidentId);
    setDiagnosis(updatedDiag ? { ...updatedDiag } : null);
  };

  const handleRollback = async (actionId: string) => {
    if (!activeIncidentId) return;
    await apiService.rollbackRemediation(actionId, activeIncidentId);
    const updatedDiag = await apiService.getDiagnosis(activeIncidentId);
    setDiagnosis(updatedDiag ? { ...updatedDiag } : null);
  };

  const handleResetDemo = () => {
    apiService.resetDemoState();
    loadData();
  };

  const handleTriggerDemoFlow = async () => {
    setActiveIncidentId('INC-001');
    setActiveTab('command-center');
    setDetailSubTab('all');

    // 1. Re-diagnose
    await handleDiagnose();

    // 2. Scroll or switch to remediation
    setDetailSubTab('remediation');
  };

  const handleSelectEvidenceFromHypothesis = (evId: string) => {
    setHighlightedEvidenceId(evId);
    setDetailSubTab('evidence');
  };

  const activeIncident =
    incidents.find((i) => i.incident_id === activeIncidentId) || incidents[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveBackend={isLiveBackend}
        onResetDemo={handleResetDemo}
        onTriggerDemoFlow={handleTriggerDemoFlow}
        activeIncidentId={activeIncidentId}
      />

      {/* Main View Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'command-center' ? (
          <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-65px)] overflow-hidden">
            {/* Left Sidebar: Incidents */}
            <IncidentSidebar
              incidents={incidents}
              activeIncidentId={activeIncidentId}
              onSelectIncident={(id) => {
                setActiveIncidentId(id);
                setHighlightedEvidenceId('');
              }}
            />

            {/* Right Pane: Command Center Main Workspace */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {activeIncident && (
                <>
                  {/* Incident Header Overview */}
                  <IncidentOverview
                    incident={activeIncident}
                    diagnosis={diagnosis}
                    isDiagnosing={isDiagnosing}
                    onDiagnose={handleDiagnose}
                  />

                  {/* Sub-tab navigation for focused inspection */}
                  <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 text-xs font-medium overflow-x-auto">
                    <button
                      onClick={() => setDetailSubTab('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'all'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      All Views
                    </button>
                    <button
                      onClick={() => setDetailSubTab('timeline')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'timeline'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Timeline
                    </button>
                    <button
                      onClick={() => setDetailSubTab('hypotheses')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'hypotheses'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                      Hypotheses ({diagnosis?.hypotheses?.length || 0})
                    </button>
                    <button
                      onClick={() => setDetailSubTab('evidence')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'evidence'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
                      Evidence ({diagnosis?.evidence?.length || 0})
                    </button>
                    <button
                      onClick={() => setDetailSubTab('remediation')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'remediation'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Remediation & Approval
                    </button>
                    <button
                      onClick={() => setDetailSubTab('audit')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'audit'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                      Audit Trail ({diagnosis?.audit_events?.length || 0})
                    </button>
                  </div>

                  {/* Sub-tab view rendering */}
                  {diagnosis && (
                    <div className="space-y-6">
                      {(detailSubTab === 'all' || detailSubTab === 'timeline') && (
                        <IncidentTimeline timeline={diagnosis.timeline} />
                      )}

                      {(detailSubTab === 'all' || detailSubTab === 'hypotheses') && (
                        <HypothesisPanel
                          hypotheses={diagnosis.hypotheses}
                          onSelectEvidence={handleSelectEvidenceFromHypothesis}
                        />
                      )}

                      {(detailSubTab === 'all' || detailSubTab === 'evidence') && (
                        <EvidencePanel
                          evidence={diagnosis.evidence}
                          highlightedEvidenceId={highlightedEvidenceId}
                        />
                      )}

                      {(detailSubTab === 'all' || detailSubTab === 'remediation') &&
                        diagnosis.remediation && (
                          <RemediationPanel
                            remediation={diagnosis.remediation}
                            incidentId={activeIncident.incident_id}
                            onApproveAndExecute={handleApproveAndExecute}
                            onReject={handleReject}
                            onRollback={handleRollback}
                          />
                        )}

                      {(detailSubTab === 'all' || detailSubTab === 'audit') && (
                        <AuditTrail auditEvents={diagnosis.audit_events} />
                      )}
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        ) : activeTab === 'topology' ? (
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {activeIncident && <ServiceTopology activeIncident={activeIncident} />}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {evaluation && <EvaluationDashboard evaluation={evaluation} />}
          </main>
        )}
      </div>
    </div>
  );
};

export default App;
