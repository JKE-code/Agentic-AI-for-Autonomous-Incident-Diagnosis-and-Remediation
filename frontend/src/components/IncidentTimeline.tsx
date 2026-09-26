import React from 'react';
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
} from 'lucide-react';

interface IncidentTimelineProps {
  timeline: TimelineItem[];
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ timeline }) => {
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
      return 'border-sky-200 bg-sky-50/40 hover:bg-sky-50/80';
    } else if (t.includes('metric') || t.includes('trace')) {
      return 'border-rose-100 bg-rose-50/30 hover:bg-rose-50/60';
    } else if (t.includes('anomaly')) {
      return 'border-amber-100 bg-amber-50/30 hover:bg-amber-50/60';
    } else if (t.includes('agent') || t.includes('ai')) {
      return 'border-sky-200 bg-sky-50/30 hover:bg-sky-50/60';
    } else {
      return 'border-slate-200 bg-slate-50/60 hover:bg-white';
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
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Incident Causal Timeline
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
          {timeline.length} Events
        </span>
      </div>

      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {timeline.map((item, idx) => {
          const type = item.source || item.type || 'metric';
          const title = item.title || item.event || 'Telemetry Event';
          const description = item.description || (item.title && item.event ? item.event : '');
          const time = item.timeDisplay || formatTime(item.timestamp);

          return (
            <div key={item.id || idx} className="relative group transition-all">
              {/* Timeline Node Dot */}
              <div className="absolute -left-6 top-2 flex items-center justify-center w-5 h-5 rounded-full bg-white border-2 border-sky-600 shadow-xs z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
              </div>

              {/* Event Card */}
              <div
                className={`p-3 rounded-xl border transition-all ${getCardStyle(type)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                      {getTimelineIcon(type, item.severity)}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.service && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium">
                        <Layers className="w-2.5 h-2.5 text-slate-400" />
                        {item.service}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
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
