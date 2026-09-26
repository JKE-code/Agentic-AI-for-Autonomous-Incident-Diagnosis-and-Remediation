import React from 'react';
import type { AuditEvent, AuditActor, AuditEventType } from '../types';
import {
  ShieldAlert,
  UserCheck,
  Bot,
  Terminal,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface AuditTrailProps {
  auditEvents: AuditEvent[];
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ auditEvents }) => {
  const getActorBadge = (actor: AuditActor | string) => {
    switch (actor) {
      case 'human':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
            HUMAN
          </span>
        );
      case 'agent':
      case 'ai':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
            <Bot className="w-2.5 h-2.5 text-sky-600" />
            AGENT (LangGraph)
          </span>
        );
      case 'system':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Terminal className="w-2.5 h-2.5 text-slate-500" />
            SYSTEM
          </span>
        );
    }
  };

  const getEventIcon = (event: AuditEventType | string) => {
    switch (event) {
      case 'INCIDENT_CREATED':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />;
      case 'AGENT_STARTED':
      case 'EVIDENCE_COLLECTED':
      case 'HYPOTHESIS_CREATED':
      case 'HYPOTHESIS_VERIFIED':
        return <Bot className="w-3.5 h-3.5 text-sky-600" />;
      case 'REMEDIATION_PROPOSED':
      case 'APPROVAL_REQUESTED':
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
      case 'APPROVAL_GRANTED':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'ACTION_EXECUTED':
      case 'HEALTH_CHECK':
        return <Activity className="w-3.5 h-3.5 text-sky-600" />;
      case 'INCIDENT_RESOLVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Immutable Audit Trail & Compliance Log
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
          {auditEvents.length} Entries
        </span>
      </div>

      {/* Events timeline */}
      <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {auditEvents.map((item, idx) => (
          <div
            key={item.audit_id || idx}
            className="relative group stagger-item"
            style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
          >
            {/* Dot */}
            <div className="absolute -left-6 top-2 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-slate-300 shadow-2xs z-10 group-hover:scale-110 group-hover:border-sky-500 transition-transform">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-sky-600 transition-colors" />
            </div>

            {/* Entry Box */}
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 hover:bg-white hover:translate-x-0.5 transition-all duration-150 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                    {getEventIcon(item.event)}
                  </span>
                  <span className="font-mono text-xs font-bold text-sky-900">
                    {item.event}
                  </span>
                  {getActorBadge(item.actor)}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                  <span className="bg-white px-1.5 py-0.2 rounded border border-slate-200">#{item.audit_id}</span>
                  <span>•</span>
                  <span>
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 pl-7 leading-relaxed font-mono">
                {item.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
