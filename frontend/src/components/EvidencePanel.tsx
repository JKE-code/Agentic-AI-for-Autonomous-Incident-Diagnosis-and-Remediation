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
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'metrics':
        return <BarChart2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'traces':
        return <Network className="w-3.5 h-3.5 text-rose-400" />;
      case 'deployments':
        return <GitBranch className="w-3.5 h-3.5 text-purple-400" />;
      case 'dependencies':
        return <Network className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getSourceBadgeColor = (source: EvidenceSource | string) => {
    switch (source) {
      case 'logs':
        return 'bg-amber-950/40 text-amber-300 border-amber-500/30';
      case 'metrics':
        return 'bg-blue-950/40 text-blue-300 border-blue-500/30';
      case 'traces':
        return 'bg-rose-950/40 text-rose-300 border-rose-500/30';
      case 'deployments':
        return 'bg-purple-950/40 text-purple-300 border-purple-500/30';
      case 'dependencies':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm">
      {/* Header and Source Filter Chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            Causal Multi-Modal Evidence Panel
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated findings across logs, metrics, traces, deployments, and dependency health.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-56">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
        {['all', 'deployments', 'logs', 'metrics', 'traces', 'dependencies'].map(
          (src) => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors ${
                selectedSource === src
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {src}
            </button>
          )
        )}
      </div>

      {/* Evidence Items List */}
      <div className="space-y-3">
        {filteredEvidence.map((ev) => {
          const isHighlighted = highlightedEvidenceId === ev.evidence_id;
          const isRawOpen = expandedRawId === ev.evidence_id;

          return (
            <div
              key={ev.evidence_id}
              className={`p-4 rounded-xl border transition-all ${
                isHighlighted
                  ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {ev.evidence_id}
                  </span>

                  <span
                    className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border font-medium ${getSourceBadgeColor(
                      ev.source
                    )}`}
                  >
                    {getSourceIcon(ev.source)}
                    {ev.source}
                  </span>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    svc: {ev.service}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {new Date(ev.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>

                  <span className="text-slate-400">
                    Importance: <strong className="text-indigo-300">{(ev.importance * 100).toFixed(0)}%</strong>
                  </span>

                  <span className="text-slate-400">
                    Confidence: <strong className="text-emerald-400">{(ev.confidence * 100).toFixed(0)}%</strong>
                  </span>
                </div>
              </div>

              {/* Observation Content */}
              <p className="text-xs md:text-sm text-slate-200 font-mono bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80 mb-2 leading-relaxed">
                {ev.observation}
              </p>

              {/* Supports & Contradicts Chips + Raw Data Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  {ev.supports.length > 0 && (
                    <div className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>Supports:</span>
                      {ev.supports.map((hyp) => (
                        <span
                          key={hyp}
                          className="font-mono px-1.5 py-0.2 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                        >
                          {hyp}
                        </span>
                      ))}
                    </div>
                  )}

                  {ev.contradicts.length > 0 && (
                    <div className="flex items-center gap-1 text-rose-400 text-[11px] ml-2">
                      <XCircle className="w-3 h-3 text-rose-400" />
                      <span>Contradicts:</span>
                      {ev.contradicts.map((hyp) => (
                        <span
                          key={hyp}
                          className="font-mono px-1.5 py-0.2 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300"
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
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono transition-colors"
                  >
                    {isRawOpen ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {isRawOpen ? 'Hide Raw Telemetry' : 'Inspect Raw Telemetry'}
                  </button>
                )}
              </div>

              {/* Raw Data JSON Viewer */}
              {isRawOpen && ev.raw_data && (
                <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  <pre>{JSON.stringify(ev.raw_data, null, 2)}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
