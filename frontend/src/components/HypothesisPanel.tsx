import React, { useState } from 'react';
import type { Hypothesis } from '../types';
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface HypothesisPanelProps {
  hypotheses: Hypothesis[];
  onSelectEvidence?: (evidenceId: string) => void;
}

export const HypothesisPanel: React.FC<HypothesisPanelProps> = ({
  hypotheses,
  onSelectEvidence,
}) => {
  const [expandedId, setExpandedId] = useState<string>(
    hypotheses[0]?.hypothesis_id || ''
  );

  const toggleExpand = (id: string) => {
    sounds.playBlip();
    setExpandedId((prev) => (prev === id ? '' : id));
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'VERIFIED') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          VERIFIED ROOT CAUSE
        </span>
      );
    } else if (s === 'DISPROVEN' || s === 'RULED_OUT') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
          <XCircle className="w-3 h-3 text-slate-500" />
          RULED OUT
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Clock className="w-3 h-3 text-amber-400" />
          INVESTIGATING
        </span>
      );
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm animate-fade-in">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Ranked Root-Cause Hypotheses
          </h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Bayesian Evidence Weighting
        </span>
      </div>

      <div className="space-y-3">
        {hypotheses.map((hyp, index) => {
          const isTopRanked = index === 0 && hyp.status === 'VERIFIED';
          const isExpanded = expandedId === hyp.hypothesis_id;

          return (
            <div
              key={hyp.hypothesis_id}
              className={`rounded-xl border transition-all duration-200 ${
                isTopRanked
                  ? 'bg-purple-950/20 border-purple-500/40 shadow-sm shadow-purple-950/40'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Header / Summary row */}
              <div
                onClick={() => toggleExpand(hyp.hypothesis_id)}
                className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                      #{index + 1} {hyp.hypothesis_id}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700">
                      <Layers className="w-2.5 h-2.5" />
                      {hyp.service}
                    </span>
                    {getStatusBadge(hyp.status)}
                    {isTopRanked && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        Top Confidence
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs md:text-sm font-semibold text-slate-100">
                    {hyp.cause}
                  </h4>
                </div>

                {/* Score & Confidence meters */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">
                      Posterior Score
                    </div>
                    <div className="text-sm font-bold font-mono text-purple-400">
                      {(hyp.score * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono">
                      Confidence
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {(hyp.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="px-4 pb-2">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-purple-500 h-full transition-all duration-500"
                    style={{ width: `${hyp.score * 100}%` }}
                  />
                  <div
                    className="bg-emerald-500 h-full opacity-70 transition-all duration-500"
                    style={{ width: `${Math.max(0, (hyp.confidence - hyp.score) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3 animate-fade-in">
                  {/* Evidence Association */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                      <div className="font-semibold text-emerald-300 text-[11px] mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Supporting Evidence ({hyp.supporting_evidence?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(!hyp.supporting_evidence || hyp.supporting_evidence.length === 0) ? (
                          <span className="text-[11px] text-slate-500">None observed</span>
                        ) : (
                          hyp.supporting_evidence.map((evId) => (
                            <button
                              key={evId}
                              onClick={() => onSelectEvidence && onSelectEvidence(evId)}
                              className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/60 transition-colors"
                            >
                              {evId}
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                      <div className="font-semibold text-rose-300 text-[11px] mb-1.5 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Contradicting Evidence ({hyp.contradicting_evidence?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(!hyp.contradicting_evidence || hyp.contradicting_evidence.length === 0) ? (
                          <span className="text-[11px] text-slate-500">None observed</span>
                        ) : (
                          hyp.contradicting_evidence.map((evId) => (
                            <button
                              key={evId}
                              onClick={() => onSelectEvidence && onSelectEvidence(evId)}
                              className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/40 hover:bg-rose-900/60 transition-colors"
                            >
                              {evId}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Tests */}
                  {hyp.tests && hyp.tests.length > 0 && (
                    <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Formal Verification Tests Executed
                      </span>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {hyp.tests.map((test, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2">
                            <span className="text-purple-400 font-mono text-[11px] mt-0.5">
                              [{tIdx + 1}]
                            </span>
                            <span>{test}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
