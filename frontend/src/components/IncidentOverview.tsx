import React, { useState } from 'react';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import { TelemetryChart } from './charts/TelemetryChart';

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
  const [showTelemetryChart, setShowTelemetryChart] = useState(true);

  const isResolved =
    incident.status === 'RESOLVED' || diagnosis?.remediation?.status === 'SUCCESS';

  const handleDiagnoseClick = () => {
    sounds.playBlip();
    onDiagnose();
  };

  return (
    <div className="space-y-4">
      {/* Overview Card with subtle gradient aura */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-bl from-sky-100/50 via-emerald-50/20 to-transparent pointer-events-none rounded-tr-2xl" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          {/* Title and Identification */}
          <div className="space-y-2.5 max-w-3xl flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
                #{incident.incident_id}
              </span>

              <span
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  incident.severity === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : incident.severity === 'HIGH'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-sky-50 text-sky-700 border-sky-200'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                {incident.severity}
              </span>

              <span
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border shadow-2xs ${
                  isResolved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
                    : incident.status === 'DIAGNOSING' || isDiagnosing
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isResolved ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                )}
                STATUS: {isResolved ? 'RESOLVED' : incident.status}
              </span>

              <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Started:{' '}
                {new Date(incident.started_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {incident.title}
            </h2>

            <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-2xl">
              {incident.description ||
                'Autonomous telemetry investigation running causal anomaly localization across distributed trace graph.'}
            </p>

            {/* Affected Services & Sparkline Visual */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-slate-400" /> Affected Services:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {incident.services.map((svc) => (
                    <span
                      key={svc}
                      className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium hover:bg-slate-200 transition-colors"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggle Telemetry Chart button */}
              <button
                onClick={() => {
                  sounds.playBlip();
                  setShowTelemetryChart(!showTelemetryChart);
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all cursor-pointer btn-tactile"
              >
                <Activity className="w-3.5 h-3.5 text-sky-600" />
                <span>{showTelemetryChart ? 'Hide Visual Chart' : 'Show Visual Telemetry Chart'}</span>
                {showTelemetryChart ? (
                  <ChevronUp className="w-3.5 h-3.5 text-sky-600 transition-transform" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-sky-600 transition-transform" />
                )}
              </button>
            </div>
          </div>

          {/* Diagnosis Button & Verified Root Cause */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto flex-shrink-0">
            <button
              onClick={handleDiagnoseClick}
              disabled={isDiagnosing}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 cursor-pointer btn-enterprise ${
                isDiagnosing
                  ? 'bg-sky-500 text-white cursor-wait animate-pulse'
                  : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-glow'
              }`}
            >
              {isDiagnosing ? (
                <>
                  <Bot className="w-4 h-4 animate-spin text-white" />
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
              <div className="p-2.5 rounded-xl bg-slate-50 border border-emerald-200/80 text-xs flex items-center justify-between gap-3 shadow-2xs hover:bg-emerald-50/20 transition-colors">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-700 font-medium truncate max-w-[210px]">
                    Cause: {diagnosis.root_cause.service || diagnosis.root_cause.cause}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                  {(diagnosis.confidence * 100).toFixed(0)}% conf
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Real-Time Telemetry Chart */}
      {showTelemetryChart && (
        <div className="animate-slide-up">
          <TelemetryChart incident={incident} isResolved={isResolved} />
        </div>
      )}
    </div>
  );
};
