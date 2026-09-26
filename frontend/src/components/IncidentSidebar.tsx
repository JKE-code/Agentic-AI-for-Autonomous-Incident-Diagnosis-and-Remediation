import React, { useState } from 'react';
import type { Incident, IncidentSeverity } from '../types';
import {
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Activity,
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
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            <Flame className="w-2.5 h-2.5" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  const getStatusIndicator = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'RESOLVED') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-700">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Resolved
        </span>
      );
    } else if (s === 'DIAGNOSING' || s === 'INVESTIGATING') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-sky-700">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          Investigating
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-600">
          <Activity className="w-3 h-3 text-slate-400" />
          Active
        </span>
      );
    }
  };

  return (
    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header and Search */}
      <div className="p-3.5 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Active Incidents
            </h2>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
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
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 transition-colors shadow-2xs"
          />
        </div>

        {/* Severity pill filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2 py-0.5 rounded-md font-mono transition-colors ${
                filterSeverity === sev
                  ? 'bg-sky-600 text-white font-medium shadow-2xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
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
                    ? 'bg-sky-50/70 border-sky-300 shadow-xs ring-1 ring-sky-300/40'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-sky-700">
                    #{incident.incident_id}
                  </span>
                  {getSeverityBadge(incident.severity)}
                </div>

                <h3 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1.5">
                  {incident.title}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
                  {getStatusIndicator(incident.status)}
                  <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500">
                    <Clock className="w-2.5 h-2.5" />
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
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200"
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
