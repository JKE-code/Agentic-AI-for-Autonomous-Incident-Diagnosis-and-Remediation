import React from 'react';
import type { Incident, Diagnosis } from '../types';
import {
  Flame,
  CheckCircle2,
  Clock,
  Cpu,
  Bot,
  ArrowRight,
  Server,
  Activity,
  TrendingDown,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface IncidentOverviewProps {
  incident: Incident;
  diagnosis: Diagnosis | null;
  isDiagnosing: boolean;
  onDiagnose: () => void;
}

export const IncidentOverview: React.FC<IncidentOverviewProps> = ({
  incident,
  diagnosis,
  isDiagnosing,
  onDiagnose,
}) => {
  const isResolved =
    incident.status === 'RESOLVED' || diagnosis?.remediation?.status === 'SUCCESS';

  const handleDiagnoseClick = () => {
    sounds.playBlip();
    onDiagnose();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden backdrop-blur-sm animate-fade-in">
      {/* Background ambient radar glow */}
      <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-br from-indigo-500/15 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
        {/* Title and Identification */}
        <div className="space-y-2.5 max-w-3xl flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950/70 border border-indigo-500/30 px-2.5 py-0.5 rounded-lg shadow-sm">
              #{incident.incident_id}
            </span>

            <span
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                incident.severity === 'CRITICAL'
                  ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                  : incident.severity === 'HIGH'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              {incident.severity}
            </span>

            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : incident.status === 'DIAGNOSING' || isDiagnosing
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {isResolved ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              )}
              STATUS: {isResolved ? 'RESOLVED' : incident.status}
            </span>

            <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Started:{' '}
              {new Date(incident.started_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {incident.title}
          </h2>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {incident.description ||
              'Autonomous telemetry investigation running causal anomaly localization across distributed trace graph.'}
          </p>

          {/* Affected Services & Sparkline Visual */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Server className="w-3.5 h-3.5" /> Affected Services:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {incident.services.map((svc) => (
                  <span
                    key={svc}
                    className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 border border-slate-700 font-medium"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>

            {/* Sparkline Visual */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-[11px] font-mono">
                <span className="text-slate-400 mr-2">Error Curve:</span>
                <span className={isResolved ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {isResolved ? '0.15% (Resolved)' : '18.72% (Critical)'}
                </span>
              </div>
              <svg className="w-20 h-5" viewBox="0 0 100 24">
                {isResolved ? (
                  <path
                    d="M0 20 L20 19 L40 4 L60 5 L80 18 L100 20"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d="M0 20 L30 19 L50 4 L75 3 L100 2"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}
              </svg>
              {isResolved && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" /> -99.2%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis Button & Verified Root Cause */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto flex-shrink-0">
          <button
            onClick={handleDiagnoseClick}
            disabled={isDiagnosing}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all shadow-md ${
              isDiagnosing
                ? 'bg-indigo-700/60 text-indigo-200 cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-98'
            }`}
          >
            {isDiagnosing ? (
              <>
                <Bot className="w-4 h-4 animate-spin text-indigo-300" />
                <span>Multi-Agent Investigating...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Re-run Autonomous Diagnosis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Root cause quick status preview */}
          {diagnosis?.root_cause && (
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-medium truncate max-w-[210px]">
                  Cause: {diagnosis.root_cause.service || diagnosis.root_cause.cause}
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {(diagnosis.confidence * 100).toFixed(0)}% conf
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
