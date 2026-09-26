import React, { useState } from 'react';
import {
  Activity,
  Server,
  BarChart3,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Radio,
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-6 py-2 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-700 via-sky-600 to-sky-500 text-white shadow-sky-glow">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Remidi</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                AI SRE
              </span>
            </h1>
          </div>
        </div>

        {/* Enterprise Navigation Segmented Bar */}
        <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => handleTabClick('command-center')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'command-center'
                ? 'bg-white text-sky-800 shadow-2xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-600" />
            Command Center
          </button>
          <button
            onClick={() => handleTabClick('topology')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'topology'
                ? 'bg-white text-sky-800 shadow-2xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-sky-600" />
            Topology Graph
          </button>
          <button
            onClick={() => handleTabClick('evaluation')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'evaluation'
                ? 'bg-white text-sky-800 shadow-2xs border border-slate-200/60 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-600" />
            Benchmark Suite
          </button>
        </nav>

        {/* Action Controls & Backend Status */}
        <div className="flex items-center gap-2">
          {/* Audio Feedback Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute audio cues' : 'Unmute audio cues'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-sky-600" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {/* Interactive Demo Flow */}
          {activeIncidentId === 'INC-001' && (
            <button
              onClick={handleDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-emerald-glow active:scale-98 cursor-pointer"
              title="Run 1-Click Interactive Walkthrough of payment failure diagnosis & remediation"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Demo Walkthrough</span>
            </button>
          )}

          {/* Reset State Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all active:scale-98 shadow-2xs cursor-pointer"
            title="Reset incident and database state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Backend Status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold ${
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
            <span>{isLiveBackend ? 'Backend :8000 Live' : 'Sandbox Mock'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
