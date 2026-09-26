import React, { useState } from 'react';
import type { TimelineItem } from '../types';
import {
  GitCommit,
  TrendingUp,
  AlertTriangle,
  FileCode2,
  Bot,
  Clock,
  Layers,
  Activity,
  Filter,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface IncidentTimelineProps {
  timeline: TimelineItem[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTimeline = timeline.filter((item) => {
    if (filterType === 'all') return true;
    const t = (item.source || item.type || '').toLowerCase();
    return t.includes(filterType);
  });

  const getTimelineIcon = (type?: string, severity?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('deploy')) {
      return <GitCommit className="w-4 h-4 text-sky-600" />;
    } else if (t.includes('metric')) {
      return <TrendingUp className="w-4 h-4 text-rose-600" />;
    } else if (t.includes('anomaly')) {
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    } else if (t.includes('trace') || t.includes('span')) {
      return <FileCode2 className="w-4 h-4 text-rose-600" />;
    } else if (t.includes('agent') || t.includes('ai') || t.includes('hypo')) {
      return <Bot className="w-4 h-4 text-sky-600" />;
    } else if (severity === 'critical') {
      return <AlertTriangle className="w-4 h-4 text-rose-600" />;
    } else {
      return <Activity className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getCardStyle = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('deploy')) {
      return 'border-sky-200 bg-sky-50/40 hover:bg-sky-50/80 hover:border-sky-300';
    } else if (t.includes('metric') || t.includes('trace')) {
      return 'border-rose-100 bg-rose-50/30 hover:bg-rose-50/60 hover:border-rose-200';
    } else if (t.includes('anomaly')) {
      return 'border-amber-100 bg-amber-50/30 hover:bg-amber-50/60 hover:border-amber-200';
    } else if (t.includes('agent') || t.includes('ai')) {
      return 'border-sky-200 bg-sky-50/30 hover:bg-sky-50/60 hover:border-sky-300';
    } else {
      return 'border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300';
    }
  };

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
      }
    } catch {
      // fallback
    }
    return ts;
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs animate-slide-up space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Incident Causal Timeline
          </h3>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            {filteredTimeline.length} of {timeline.length} Events
          </span>
        </div>

        {/* Quick Timeline Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-slate-400" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'deploy', label: 'Deploy' },
            { id: 'metric', label: 'Metrics' },
            { id: 'anomaly', label: 'Anomalies' },
            { id: 'agent', label: 'Agents' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => {
                sounds.playBlip();
                setFilterType(f.id);
              }}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono transition-all duration-150 cursor-pointer btn-tactile ${
                filterType === f.id
                  ? 'bg-sky-600 text-white font-bold shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {filteredTimeline.map((item, idx) => {
          const type = item.source || item.type || 'metric';
          const title = item.title || item.event || 'Telemetry Event';
          const description = item.description || (item.title && item.event ? item.event : '');
          const time = item.timeDisplay || formatTime(item.timestamp);
          const isCritical = item.severity === 'critical' || type.includes('anomaly');

          return (
            <div
              key={item.id || idx}
              className="relative group transition-all stagger-item"
              style={{ animationDelay: `${Math.min(idx * 35, 300)}ms` }}
            >
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-6 top-2 flex items-center justify-center w-5 h-5 rounded-full bg-white border-2 shadow-2xs z-10 transition-transform duration-200 group-hover:scale-110 ${
                  isCritical
                    ? 'border-rose-500'
                    : type.includes('deploy')
                    ? 'border-sky-600'
                    : 'border-emerald-600'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCritical
                      ? 'bg-rose-500 animate-pulse'
                      : type.includes('deploy')
                      ? 'bg-sky-600'
                      : 'bg-emerald-600'
                  }`}
                />
              </div>

              {/* Event Card with subtle hover lift and slide */}
              <div
                className={`p-3.5 rounded-xl border transition-all duration-200 group-hover:translate-x-1 group-hover:shadow-xs ${getCardStyle(
                  type
                )}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                      {getTimelineIcon(type, item.severity)}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.service && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium shadow-2xs">
                        <Layers className="w-2.5 h-2.5 text-slate-400" />
                        {item.service}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {time}
                    </span>
                  </div>
                </div>

                {description && (
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
