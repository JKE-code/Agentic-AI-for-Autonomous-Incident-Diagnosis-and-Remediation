import React, { useState } from 'react';
import type { Incident, IncidentSeverity } from '../types';
import {
  AlertCircle,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
} from 'lucide-react';

interface IncidentSidebarProps {
  incidents: Incident[];
  activeIncidentId: string;
  onSelectIncident: (id: string) => void;
}

export const IncidentSidebar: React.FC<IncidentSidebarProps> = ({
  incidents,
  activeIncidentId,
  onSelectIncident,
}) => {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      inc.incident_id.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity =
      filterSeverity === 'ALL' || inc.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
            <Flame className="w-2.5 h-2.5 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
            <AlertTriangle className="w-2.5 h-2.5" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            LOW
          </span>
        );
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Resolved
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="flex items-center gap-1 text-[11px] text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Investigating
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] text-rose-400">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Active
          </span>
        );
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 bg-slate-900/60 border-r border-slate-800/80 flex flex-col h-[calc(100vh-65px)]">
      {/* Header and Search */}
      <div className="p-3.5 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Active Incidents
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {filteredIncidents.length} total
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search incident by ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Severity pill filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                filterSeverity === sev
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No incidents found matching criteria.
          </div>
        ) : (
          filteredIncidents.map((incident) => {
            const isActive = incident.incident_id === activeIncidentId;
            return (
              <div
                key={incident.incident_id}
                onClick={() => onSelectIncident(incident.incident_id)}
                className={`p-3 rounded-xl cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm shadow-indigo-950/40 ring-1 ring-indigo-500/20'
                    : 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    #{incident.incident_id}
                  </span>
                  {getSeverityBadge(incident.severity)}
                </div>

                <h3 className="text-xs font-semibold text-slate-200 line-clamp-1 mb-1.5">
                  {incident.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  {getStatusIndicator(incident.status)}
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    {new Date(incident.started_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Affected Services tags */}
                <div className="flex flex-wrap gap-1">
                  {incident.services.map((svc) => (
                    <span
                      key={svc}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700/60"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
