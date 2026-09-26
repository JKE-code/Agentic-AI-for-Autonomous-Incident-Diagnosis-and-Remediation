import React from 'react';
import type { Incident } from '../types';
import {
  CheckCircle2,
  Layers,
  Activity,
  BrainCircuit,
  ShieldCheck,
  LayoutGrid,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface ScenarioBarProps {
  incidents: Incident[];
  activeIncidentId: string;
  onSelectIncident: (id: string) => void;
  activeStep: 'all' | 'telemetry' | 'hypotheses' | 'remediation';
  onSelectStep: (step: 'all' | 'telemetry' | 'hypotheses' | 'remediation') => void;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  incidents,
  activeIncidentId,
  onSelectIncident,
  activeStep,
  onSelectStep,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2.5 shadow-2xs space-y-2 sticky top-[65px] z-30">
      {/* Top Row: Quick Scenario Selector Pills */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-0.5 scrollbar-thin">
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
                    ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-xs'
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
                    isActive ? 'text-sky-100' : 'text-slate-500'
                  }`}
                >
                  {inc.title.split(' ')[0]} {inc.title.split(' ')[1] || ''}
                </span>

                {isResolved && (
                  <CheckCircle2
                    className={`w-3 h-3 ${isActive ? 'text-emerald-300' : 'text-emerald-600'}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Guided 3-Step Diagnostic Pipeline */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 flex-shrink-0 text-xs font-medium">
          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('all');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'all'
                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Unified View</span>
          </button>

          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('telemetry');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'telemetry'
                ? 'bg-sky-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-sky-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>2. Reasoning</span>
          </button>

          <button
            onClick={() => {
              sounds.playBlip();
              onSelectStep('remediation');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeStep === 'remediation'
                ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Remediation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
