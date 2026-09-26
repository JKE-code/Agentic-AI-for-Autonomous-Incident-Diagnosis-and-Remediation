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
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { sounds } from './utils/audio';

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

  // Live Agent Terminal Drawer State
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [agentLogs, setAgentLogs] = useState<string[]>([
    '[SYSTEM] AegisSRE telemetry collector initialized.',
    '[SYSTEM] Connected to FastAPI backend at http://localhost:8000.',
    '[ORCHESTRATOR] Ready for multi-agent investigation dispatch.',
  ]);

  const addAgentLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setAgentLogs((prev) => [...prev.slice(-30), `[${time}] ${msg}`]);
  };

  // Initial data loading
  useEffect(() => {
    loadData();
    const interval = setInterval(checkBackend, 4000);
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

  const handleSelectIncident = (id: string) => {
    setActiveIncidentId(id);
    setHighlightedEvidenceId('');
    const inc = incidents.find((i) => i.incident_id === id);
    if (inc?.severity === 'CRITICAL') {
      sounds.playAlertPing();
    } else {
      sounds.playBlip();
    }
    addAgentLog(`Incident selected: #${id} (${inc?.title || 'Unknown'})`);
  };

  const handleDiagnose = async () => {
    if (!activeIncidentId) return;
    setIsDiagnosing(true);
    setTerminalOpen(true);
    addAgentLog(`[LangGraph] Dispatched incident intake node for #${activeIncidentId}`);
    await new Promise((r) => setTimeout(r, 400));
    addAgentLog(`[LogAgent] Analyzing stack traces and new exception signatures...`);
    await new Promise((r) => setTimeout(r, 400));
    addAgentLog(`[MetricsAgent] Correlating temporal error spike with deployment window...`);
    await new Promise((r) => setTimeout(r, 400));
    addAgentLog(`[TraceAgent] Localizing broken span downstream dependencies...`);
    await new Promise((r) => setTimeout(r, 400));
    addAgentLog(`[HypothesisRanker] Bayesian belief update: HYP-001 posterior score = 0.92`);

    const updatedDiag = await apiService.diagnoseIncident(activeIncidentId);
    setDiagnosis({ ...updatedDiag });
    setIsDiagnosing(false);
    sounds.playSuccessChime();
    addAgentLog(`[DECISION] Primary root cause verified with ${(updatedDiag.confidence * 100).toFixed(0)}% confidence.`);

    // Refresh incident list status
    const updatedList = await apiService.getIncidents();
    setIncidents(updatedList);
  };

  const handleApproveAndExecute = async (actionId: string) => {
    if (!activeIncidentId) return;
    setTerminalOpen(true);
    addAgentLog(`[OPERATOR] Approval granted for remediation ${actionId}`);
    addAgentLog(`[SANDBOX] Dispatching container rollback in isolated sandbox environment...`);

    await apiService.approveAction(actionId, activeIncidentId);
    await apiService.executeRemediation(actionId, activeIncidentId);

    addAgentLog(`[VERIFICATION] Probing telemetry: Error rate dropped to < 0.2%, p99 latency < 150ms.`);
    addAgentLog(`[ORCHESTRATOR] Incident #${activeIncidentId} transitioned to RESOLVED.`);

    // Refresh active diagnosis and incidents
    const updatedDiag = await apiService.getDiagnosis(activeIncidentId);
    setDiagnosis(updatedDiag ? { ...updatedDiag } : null);
    const incList = await apiService.getIncidents();
    setIncidents([...incList]);
  };

  const handleReject = async (actionId: string) => {
    if (!activeIncidentId) return;
    addAgentLog(`[OPERATOR] Rejected remediation ${actionId}. Manual escalation initiated.`);
    await apiService.rejectAction(actionId, activeIncidentId);
    const updatedDiag = await apiService.getDiagnosis(activeIncidentId);
    setDiagnosis(updatedDiag ? { ...updatedDiag } : null);
  };

  const handleRollback = async (actionId: string) => {
    if (!activeIncidentId) return;
    addAgentLog(`[OPERATOR] Triggered manual emergency rollback on ${actionId}.`);
    await apiService.rollbackRemediation(actionId, activeIncidentId);
    const updatedDiag = await apiService.getDiagnosis(activeIncidentId);
    setDiagnosis(updatedDiag ? { ...updatedDiag } : null);
  };

  const handleResetDemo = async () => {
    addAgentLog(`[SYSTEM] Full system reset initiated. Resetting SQLite tables and sandbox state...`);
    await apiService.resetAll();
    await loadData();
    sounds.playBlip();
    addAgentLog(`[SYSTEM] Reset completed. All 6 scenarios ready.`);
  };

  const handleTriggerDemoFlow = async () => {
    setActiveIncidentId('INC-001');
    setActiveTab('command-center');
    setDetailSubTab('all');

    addAgentLog(`[DEMO] Triggering end-to-end incident walkthrough for INC-001...`);
    await handleDiagnose();
    setDetailSubTab('remediation');
  };

  const handleSelectEvidenceFromHypothesis = (evId: string) => {
    setHighlightedEvidenceId(evId);
    setDetailSubTab('evidence');
    sounds.playBlip();
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
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'command-center' ? (
          <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-65px)] overflow-hidden">
            {/* Left Sidebar: Incidents */}
            <IncidentSidebar
              incidents={incidents}
              activeIncidentId={activeIncidentId}
              onSelectIncident={handleSelectIncident}
            />

            {/* Right Pane: Command Center Main Workspace */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-16">
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
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('all');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'all'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5" />
                      All Panels
                    </button>
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('timeline');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        detailSubTab === 'timeline'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Timeline ({diagnosis?.timeline?.length || 0})
                    </button>
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('hypotheses');
                      }}
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
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('evidence');
                      }}
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
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('remediation');
                      }}
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
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('audit');
                      }}
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
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-16">
            {activeIncident && <ServiceTopology activeIncident={activeIncident} />}
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-16">
            {evaluation && <EvaluationDashboard evaluation={evaluation} />}
          </main>
        )}

        {/* Live Multi-Agent Execution Terminal Drawer */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 shadow-2xl backdrop-blur-md transition-all">
          <div
            onClick={() => setTerminalOpen(!terminalOpen)}
            className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 select-none border-b border-slate-900"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-slate-200">Live Agentic Telemetry Stream</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                (LangGraph Multi-Agent Execution Trace)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[10px] font-mono text-slate-500">
                {agentLogs.length} events
              </span>
              {terminalOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </div>
          </div>

          {terminalOpen && (
            <div className="p-3 max-h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1 bg-slate-950/90 divide-y divide-slate-900/40">
              {agentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`pt-1 ${
                    log.includes('[DECISION]') || log.includes('[VERIFICATION]')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('[OPERATOR]')
                      ? 'text-amber-300'
                      : log.includes('[LangGraph]')
                      ? 'text-indigo-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
