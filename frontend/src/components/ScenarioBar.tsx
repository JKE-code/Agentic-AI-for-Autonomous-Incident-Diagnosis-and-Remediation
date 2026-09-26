import React from 'react';
import type { Incident } from '../types';
import {
  CheckCircle2,
  Layers,
  Activity,
  BrainCircuit,
  BarChart2,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type DiagnosticStep = 'timeline' | 'hypotheses' | 'evidence' | 'remediation' | 'audit';

interface ScenarioBarProps {
  incidents: Incident[];
  activeIncidentId: string;
  onSelectIncident: (id: string) => void;
  activeStep: DiagnosticStep;
  onSelectStep: (step: DiagnosticStep) => void;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  incidents,
  activeIncidentId,
  onSelectIncident,
  activeStep,
  onSelectStep,
}) => {
  return (
    <div className="bg-white border-b border-slate-200/90 px-4 py-2 shadow-2xs space-y-2 sticky top-[57px] z-30">
      {/* Top Row: Quick Scenario Selector Pills & Step Switcher */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-0.5 scrollbar-thin">
        {/* Scenario Pills */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            Scenarios:
          </span>

          {incidents.map((inc) => {
            const isActive = inc.incident_id === activeIncidentId;
            const isResolved = inc.status === 'RESOLVED';
            const isCritical = inc.severity === 'CRITICAL';

            return (
              <button
                key={inc.incident_id}
                onClick={() => {
                  sounds.playBlip();
                  onSelectIncident(inc.incident_id);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer flex-shrink-0 border ${
                  isActive
                    ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sky-glow'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Severity indicator */}
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isResolved
                      ? 'bg-emerald-400'
                      : isCritical
                      ? 'bg-rose-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />

                <span className="font-bold">{inc.incident_id}</span>
                <span
                  className={`hidden md:inline font-sans text-[11px] truncate max-w-[130px] ${
                    isActive ? 'text-sky-100 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {inc.title.split(' ')[0]} {inc.title.split(' ')[1] || ''}
                </span>

                {isResolved && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-300' : 'text-emerald-600'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Focused Diagnostic Step Pipeline (No 'All Panels' to prevent page vertical bloat) */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex-shrink-0 text-xs font-semibold">
          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('timeline');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'timeline'
                ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>1. Telemetry</span>
          </button>

          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('hypotheses');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'hypotheses'
                ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>2. Hypotheses</span>
          </button>

          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('evidence');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'evidence'
                ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>3. Evidence</span>
          </button>

          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('remediation');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'remediation'
                ? 'bg-emerald-600 text-white font-bold shadow-emerald-glow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Remediation</span>
          </button>

          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('audit');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'audit'
                ? 'bg-sky-600 text-white font-bold shadow-sky-glow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>5. Audit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
