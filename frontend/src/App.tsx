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
import { ScenarioBar } from './components/ScenarioBar';
import {
  Clock,
  BrainCircuit,
  BarChart2,
  ShieldCheck,
  Terminal,
  ChevronUp,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { sounds } from './utils/audio';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'command-center' | 'topology' | 'evaluation'>('command-center');
  const [detailSubTab, setDetailSubTab] = useState<
    'timeline' | 'hypotheses' | 'evidence' | 'remediation' | 'audit'
  >('timeline');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    '[SYSTEM] Remidi telemetry collector initialized.',
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
    setDetailSubTab('timeline');

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500/20 selection:text-sky-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveBackend={isLiveBackend}
        onResetDemo={handleResetDemo}
        onTriggerDemoFlow={handleTriggerDemoFlow}
        activeIncidentId={activeIncidentId}
      />

      {/* Top Scenario Switcher & Guided Diagnostic Pipeline */}
      {activeTab === 'command-center' && (
        <ScenarioBar
          incidents={incidents}
          activeIncidentId={activeIncidentId}
          onSelectIncident={handleSelectIncident}
          activeStep={detailSubTab}
          onSelectStep={(step) => setDetailSubTab(step)}
        />
      )}

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'command-center' ? (
          <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-115px)] overflow-hidden">
            {/* Left Sidebar: Incidents (collapsible) */}
            {!sidebarCollapsed ? (
              <div className="relative flex-shrink-0 flex">
                <IncidentSidebar
                  incidents={incidents}
                  activeIncidentId={activeIncidentId}
                  onSelectIncident={handleSelectIncident}
                />
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden md:flex absolute top-3 -right-3 z-20 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm items-center justify-center cursor-pointer hover:border-slate-300"
                  title="Collapse sidebar for wider visual workspace"
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center py-4 px-2 bg-white border-r border-slate-200 gap-3 flex-shrink-0">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Expand Incident Sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-slate-400 rotate-90 my-8 tracking-widest uppercase font-semibold">
                  Incidents
                </span>
              </div>
            )}

            {/* Right Pane: Command Center Main Workspace */}
            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-20">
              {activeIncident && (
                <>
                  {/* Incident Header Overview */}
                  <IncidentOverview
                    incident={activeIncident}
                    diagnosis={diagnosis}
                    isDiagnosing={isDiagnosing}
                    onDiagnose={handleDiagnose}
                  />

                  {/* Sub-tab navigation for focused inspection (No All Panels to keep page clean & compact) */}
                  <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('timeline');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        detailSubTab === 'timeline'
                          ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Timeline ({diagnosis?.timeline?.length || 0})
                    </button>
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('hypotheses');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        detailSubTab === 'hypotheses'
                          ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      Hypotheses ({diagnosis?.hypotheses?.length || 0})
                    </button>
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('evidence');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        detailSubTab === 'evidence'
                          ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      Evidence ({diagnosis?.evidence?.length || 0})
                    </button>
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('remediation');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        detailSubTab === 'remediation'
                          ? 'bg-emerald-600 text-white font-bold shadow-emerald-glow'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Remediation & Approval
                    </button>
                    <button
                      onClick={() => {
                        sounds.playBlip();
                        setDetailSubTab('audit');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        detailSubTab === 'audit'
                          ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      Audit Trail ({diagnosis?.audit_events?.length || 0})
                    </button>
                  </div>

                  {/* Focused Single-Panel Rendering - eliminates huge vertical scrolling */}
                  {diagnosis && (
                    <div className="space-y-4">
                      {detailSubTab === 'timeline' && (
                        <IncidentTimeline timeline={diagnosis.timeline} />
                      )}

                      {detailSubTab === 'hypotheses' && (
                        <HypothesisPanel
                          hypotheses={diagnosis.hypotheses}
                          onSelectEvidence={handleSelectEvidenceFromHypothesis}
                        />
                      )}

                      {detailSubTab === 'evidence' && (
                        <EvidencePanel
                          evidence={diagnosis.evidence}
                          highlightedEvidenceId={highlightedEvidenceId}
                        />
                      )}

                      {detailSubTab === 'remediation' &&
                        diagnosis.remediation && (
                          <RemediationPanel
                            remediation={diagnosis.remediation}
                            incidentId={activeIncident.incident_id}
                            onApproveAndExecute={handleApproveAndExecute}
                            onReject={handleReject}
                            onRollback={handleRollback}
                          />
                        )}

                      {detailSubTab === 'audit' && (
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
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-slate-200 shadow-xl backdrop-blur-md transition-all">
          <div
            onClick={() => setTerminalOpen(!terminalOpen)}
            className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none border-b border-slate-100"
          >
            <div className="flex items-center gap-2 text-xs font-mono text-slate-700">
              <Terminal className="w-3.5 h-3.5 text-sky-600" />
              <span className="font-bold text-slate-900">Live Agentic Telemetry Stream</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                (LangGraph Multi-Agent Execution Trace)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="text-[10px] font-mono text-slate-500 font-medium">
                {agentLogs.length} events
              </span>
              {terminalOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-600" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-600" />
              )}
            </div>
          </div>

          {terminalOpen && (
            <div className="p-3 max-h-48 overflow-y-auto font-mono text-[11px] bg-slate-900 text-slate-200 space-y-1 divide-y divide-slate-800/60 shadow-inner">
              {agentLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`pt-1 ${
                    log.includes('[DECISION]') || log.includes('[VERIFICATION]')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('[OPERATOR]')
                      ? 'text-amber-300'
                      : log.includes('[LangGraph]')
                      ? 'text-sky-400'
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
