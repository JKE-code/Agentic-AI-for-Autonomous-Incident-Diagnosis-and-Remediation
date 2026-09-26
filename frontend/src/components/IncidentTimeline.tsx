import React from 'react';
import type { TimelineItem } from '../types';
import {
  GitCommit,
  TrendingUp,
  AlertTriangle,
  FileCode2,
  Bot,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface IncidentTimelineProps {
  timeline: TimelineItem[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
  const getTimelineIcon = (type: string, severity?: string) => {
    switch (type) {
      case 'deployment':
        return <GitCommit className="w-4 h-4 text-purple-400" />;
      case 'metric':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'anomaly':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'trace':
        return <FileCode2 className="w-4 h-4 text-rose-400" />;
      case 'agent':
        return <Bot className="w-4 h-4 text-indigo-400" />;
      default:
        return severity === 'critical' ? (
          <AlertTriangle className="w-4 h-4 text-red-400" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        );
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'deployment':
        return 'border-purple-500/40 bg-purple-950/20';
      case 'metric':
        return 'border-red-500/40 bg-red-950/20';
      case 'anomaly':
        return 'border-amber-500/40 bg-amber-950/20';
      case 'trace':
        return 'border-rose-500/40 bg-rose-950/20';
      case 'agent':
        return 'border-indigo-500/40 bg-indigo-950/20';
      default:
        return 'border-slate-800 bg-slate-900/40';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Incident Causal Timeline
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {timeline.length} Temporal Events
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-purple-500 before:via-red-500 before:to-indigo-500">
        {timeline.map((item, idx) => (
          <div key={item.id || idx} className="relative group">
            {/* Timeline Node Dot */}
            <div className="absolute -left-6 top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border-2 border-indigo-400 shadow-sm z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            </div>

            {/* Event Card */}
            <div
              className={`p-3.5 rounded-xl border transition-all hover:border-slate-700 ${getBorderColor(
                item.type
              )}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-slate-950/80 border border-slate-800">
                    {getTimelineIcon(item.type, item.severity)}
                  </span>
                  <span className="text-xs font-bold text-slate-100">
                    {item.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {item.service && (
                    <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/90 text-indigo-300 border border-slate-800">
                      <Layers className="w-2.5 h-2.5" />
                      {item.service}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.timeDisplay || item.timestamp}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 pl-7 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
