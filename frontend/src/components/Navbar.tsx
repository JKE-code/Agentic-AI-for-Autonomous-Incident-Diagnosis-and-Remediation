import React from 'react';
import {
  ShieldAlert,
  Activity,
  Server,
  BarChart3,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'command-center' | 'topology' | 'evaluation';
  setActiveTab: (tab: 'command-center' | 'topology' | 'evaluation') => void;
  isLiveBackend: boolean;
  onResetDemo: () => void;
  onTriggerDemoFlow: () => void;
  activeIncidentId: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isLiveBackend,
  onResetDemo,
  onTriggerDemoFlow,
  activeIncidentId,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 text-white">
            <ShieldAlert className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                AegisSRE
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Agentic AI
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              Autonomous Incident Diagnosis & Remediation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('command-center')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'command-center'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Command Center
          </button>
          <button
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'topology'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Server className="w-4 h-4" />
            Service Topology
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'evaluation'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Benchmark Eval
          </button>
        </nav>

        {/* Action Controls & Backend Status */}
        <div className="flex items-center gap-2.5">
          {/* Main Demo Flow Trigger */}
          {activeIncidentId === 'INC-001' && (
            <button
              onClick={onTriggerDemoFlow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
              title="Run 1-Click Interactive Walkthrough of payment failure diagnosis & remediation"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Demo Flow
            </button>
          )}

          {/* Reset Demo Button */}
          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 text-xs transition-colors"
            title="Reset incident state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          {/* Live Backend vs Mock Sandbox indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
              isLiveBackend
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveBackend ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isLiveBackend ? 'Backend :8000 Live' : 'Sandbox Mock Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
