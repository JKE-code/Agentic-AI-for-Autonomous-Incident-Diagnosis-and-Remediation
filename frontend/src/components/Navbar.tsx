import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Server,
  BarChart3,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { sounds } from '../utils/audio';

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
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
    if (next) sounds.playBlip();
  };

  const handleTabClick = (tab: 'command-center' | 'topology' | 'evaluation') => {
    sounds.playBlip();
    setActiveTab(tab);
  };

  const handleReset = () => {
    sounds.playBlip();
    onResetDemo();
  };

  const handleDemo = () => {
    sounds.playBlip();
    onTriggerDemoFlow();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-2.5 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-sky-600 text-white shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                AegisSRE
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                  Agentic AI Console
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-mono hidden sm:block">
              Autonomous Incident Diagnosis & Remediation Platform
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          <button
            onClick={() => handleTabClick('command-center')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'command-center'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            Command Center
          </button>
          <button
            onClick={() => handleTabClick('topology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'topology'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Server className="w-4 h-4" />
            Service Topology
          </button>
          <button
            onClick={() => handleTabClick('evaluation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'evaluation'
                ? 'bg-sky-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Benchmark Eval
          </button>
        </nav>

        {/* Action Controls & Backend Status */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 transition-colors"
            title={soundEnabled ? 'Mute audio feedback' : 'Unmute audio feedback'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Main Demo Flow Trigger */}
          {activeIncidentId === 'INC-001' && (
            <button
              onClick={handleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-98"
              title="Run 1-Click Interactive Walkthrough of payment failure diagnosis & remediation"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Demo Flow
            </button>
          )}

          {/* Reset All Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors active:scale-98 shadow-2xs"
            title="Reset incident and database state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset State
          </button>

          {/* Live Backend vs Mock Sandbox indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium ${
              isLiveBackend
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveBackend ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'
              }`}
            />
            <span>{isLiveBackend ? 'FastAPI :8000 Live' : 'Sandbox Mock Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
