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
  const getActorBadge = (actor: AuditActor) => {
    switch (actor) {
      case 'human':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <UserCheck className="w-2.5 h-2.5" />
            HUMAN
          </span>
        );
      case 'agent':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            <Bot className="w-2.5 h-2.5" />
            AGENT (LangGraph)
          </span>
        );
      case 'system':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <Terminal className="w-2.5 h-2.5" />
            SYSTEM
          </span>
        );
    }
  };

  const getEventIcon = (event: AuditEventType) => {
    switch (event) {
      case 'INCIDENT_CREATED':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
      case 'AGENT_STARTED':
      case 'EVIDENCE_COLLECTED':
      case 'HYPOTHESIS_CREATED':
      case 'HYPOTHESIS_VERIFIED':
        return <Bot className="w-3.5 h-3.5 text-indigo-400" />;
      case 'REMEDIATION_PROPOSED':
      case 'APPROVAL_REQUESTED':
        return <Layers className="w-3.5 h-3.5 text-amber-400" />;
      case 'APPROVAL_GRANTED':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ACTION_EXECUTED':
      case 'HEALTH_CHECK':
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
      case 'INCIDENT_RESOLVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Immutable Audit Trail & Compliance Log
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          {auditEvents.length} Verified Entries
        </span>
      </div>

      {/* Events timeline */}
      <div className="relative pl-6 space-y-3.5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {auditEvents.map((item, idx) => (
          <div key={item.audit_id || idx} className="relative group">
            {/* Dot */}
            <div className="absolute -left-6 top-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-slate-700 shadow-sm z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>

            {/* Entry Box */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-slate-900 border border-slate-800">
                    {getEventIcon(item.event)}
                  </span>
                  <span className="font-mono text-xs font-bold text-indigo-300">
                    {item.event}
                  </span>
                  {getActorBadge(item.actor)}
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500">#{item.audit_id}</span>
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

              <p className="text-xs text-slate-300 pl-7 leading-relaxed font-mono">
                {item.details}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
