import React, { useState } from 'react';
import type { Evidence, EvidenceSource } from '../types';
import {
  FileText,
  BarChart2,
  GitBranch,
  Network,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Search,
} from 'lucide-react';
import { EvidenceBreakdownChart } from './charts/EvidenceBreakdownChart';

interface EvidencePanelProps {
  evidence: Evidence[];
  highlightedEvidenceId?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidence,
  highlightedEvidenceId,
}) => {
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedRawId, setExpandedRawId] = useState<string>('');

  const filteredEvidence = evidence.filter((ev) => {
    const matchesSource =
      selectedSource === 'all' || ev.source === selectedSource;
    const matchesQuery =
      ev.observation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.evidence_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesQuery;
  });

  const getSourceIcon = (source: EvidenceSource | string) => {
    switch (source) {
      case 'logs':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'metrics':
        return <BarChart2 className="w-3.5 h-3.5 text-sky-600" />;
      case 'traces':
        return <Network className="w-3.5 h-3.5 text-rose-600" />;
      case 'deployments':
        return <GitBranch className="w-3.5 h-3.5 text-sky-700" />;
      case 'dependencies':
        return <Network className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getSourceBadgeColor = (source: EvidenceSource | string) => {
    switch (source) {
      case 'logs':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'metrics':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'traces':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'deployments':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'dependencies':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Visual Multi-Modal Evidence Donut Chart */}
      {evidence.length > 0 && (
        <EvidenceBreakdownChart
          evidence={evidence}
          selectedSource={selectedSource}
          onSelectSource={(src) => setSelectedSource(src)}
        />
      )}

      {/* Evidence Cards List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Header and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-sky-600" />
              Evidence Observations ({filteredEvidence.length})
            </h3>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {['all', 'deployments', 'logs', 'metrics', 'traces', 'dependencies'].map(
            (src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer ${
                  selectedSource === src
                    ? 'bg-sky-600 text-white font-medium shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {src}
              </button>
            )
          )}
        </div>

        {/* Evidence Items List */}
        <div className="space-y-3">
          {filteredEvidence.map((ev, idx) => {
            const isHighlighted = highlightedEvidenceId === ev.evidence_id;
            const isRawOpen = expandedRawId === ev.evidence_id;

            return (
              <div
                key={ev.evidence_id}
                className={`p-4 rounded-xl border transition-all duration-200 stagger-item ${
                  isHighlighted
                    ? 'bg-sky-50/60 border-sky-400 ring-2 ring-sky-300 shadow-sky-glow scale-[1.01]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
                style={{ animationDelay: `${Math.min(idx * 40, 300)}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {ev.evidence_id}
                    </span>

                    <span
                      className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border font-medium shadow-2xs ${getSourceBadgeColor(
                        ev.source
                      )}`}
                    >
                      {getSourceIcon(ev.source)}
                      {ev.source}
                    </span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200">
                      svc: {ev.service}
                    </span>

                    {isHighlighted && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white shadow-sky-glow animate-pulse">
                        Correlated to Hypothesis
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(ev.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>

                    <span className="text-slate-600">
                      Importance: <strong className="text-slate-900">{(ev.importance * 100).toFixed(0)}%</strong>
                    </span>

                    <span className="text-slate-600">
                      Confidence: <strong className="text-emerald-700">{(ev.confidence * 100).toFixed(0)}%</strong>
                    </span>
                  </div>
                </div>

                {/* Observation Content */}
                <p className="text-xs md:text-sm text-slate-800 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-2 leading-relaxed">
                  {ev.observation}
                </p>

                {/* Supports & Contradicts Chips + Raw Data Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    {ev.supports && ev.supports.length > 0 && (
                      <div className="flex items-center gap-1 text-emerald-800 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span className="font-medium">Supports:</span>
                        {ev.supports.map((hyp) => (
                          <span
                            key={hyp}
                            className="font-mono px-1.5 py-0.2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold"
                          >
                            {hyp}
                          </span>
                        ))}
                      </div>
                    )}

                    {ev.contradicts && ev.contradicts.length > 0 && (
                      <div className="flex items-center gap-1 text-rose-700 text-[11px] ml-2">
                        <XCircle className="w-3 h-3 text-rose-500" />
                        <span className="font-medium">Contradicts:</span>
                        {ev.contradicts.map((hyp) => (
                          <span
                            key={hyp}
                            className="font-mono px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 text-rose-700 font-semibold"
                          >
                            {hyp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {ev.raw_data && (
                    <button
                      onClick={() =>
                        setExpandedRawId(isRawOpen ? '' : ev.evidence_id)
                      }
                      className="flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-mono transition-colors cursor-pointer btn-tactile"
                    >
                      {isRawOpen ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{isRawOpen ? 'Hide Raw Telemetry' : 'Inspect Raw Telemetry'}</span>
                    </button>
                  )}
                </div>

                {/* Raw Data JSON Viewer */}
                {isRawOpen && ev.raw_data && (
                  <div className="mt-3 p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto shadow-inner animate-slide-up scrollbar-thin">
                    <pre>{JSON.stringify(ev.raw_data, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
