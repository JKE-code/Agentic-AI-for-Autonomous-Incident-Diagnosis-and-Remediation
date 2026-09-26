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
import { HypothesisChart } from './charts/HypothesisChart';

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
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          VERIFIED ROOT CAUSE
        </span>
      );
    } else if (s === 'DISPROVEN' || s === 'RULED_OUT') {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          <XCircle className="w-3 h-3 text-slate-400" />
          RULED OUT
        </span>
      );
    } else {
      return (
        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
          <Clock className="w-3 h-3 text-sky-600" />
          INVESTIGATING
        </span>
      );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Visual Chart at Top */}
      {hypotheses.length > 0 && (
        <HypothesisChart
          hypotheses={hypotheses}
          selectedId={expandedId}
          onSelectHypothesis={(id) => {
            sounds.playBlip();
            setExpandedId(id);
          }}
        />
      )}

      {/* Hypothesis Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Detailed Hypothesis Cards & Verification Tests
            </h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
            {hypotheses.length} Candidate Models
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
                    ? 'bg-sky-50/20 border-sky-300 shadow-2xs'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {/* Header / Summary row */}
                <div
                  onClick={() => toggleExpand(hyp.hypothesis_id)}
                  className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 select-none"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">
                        #{index + 1} {hyp.hypothesis_id}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                        <Layers className="w-2.5 h-2.5 text-slate-400" />
                        {hyp.service}
                      </span>
                      {getStatusBadge(hyp.status)}
                      {isTopRanked && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                          <Sparkles className="w-2.5 h-2.5 text-sky-600" />
                          Top Confidence
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs md:text-sm font-semibold text-slate-900">
                      {hyp.cause}
                    </h4>
                  </div>

                  {/* Score & Confidence meters */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Posterior Score
                      </div>
                      <div className="text-sm font-bold font-mono text-sky-700">
                        {(hyp.score * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono">
                        Confidence
                      </div>
                      <div className="text-sm font-bold font-mono text-emerald-700">
                        {(hyp.confidence * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
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
                  <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-sky-600 h-full transition-all duration-500"
                      style={{ width: `${hyp.score * 100}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full opacity-80 transition-all duration-500"
                      style={{ width: `${Math.max(0, (hyp.confidence - hyp.score) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-3 animate-fade-in">
                    {/* Evidence Association */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                        <div className="font-semibold text-emerald-800 text-[11px] mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Supporting Evidence ({hyp.supporting_evidence?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(!hyp.supporting_evidence || hyp.supporting_evidence.length === 0) ? (
                            <span className="text-[11px] text-slate-400">None observed</span>
                          ) : (
                            hyp.supporting_evidence.map((evId) => (
                              <button
                                key={evId}
                                onClick={() => onSelectEvidence && onSelectEvidence(evId)}
                                className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-colors cursor-pointer font-medium"
                              >
                                {evId}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="font-semibold text-slate-700 text-[11px] mb-1.5 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> Contradicting Evidence ({hyp.contradicting_evidence?.length || 0})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(!hyp.contradicting_evidence || hyp.contradicting_evidence.length === 0) ? (
                            <span className="text-[11px] text-slate-400">None observed</span>
                          ) : (
                            hyp.contradicting_evidence.map((evId) => (
                              <button
                                key={evId}
                                onClick={() => onSelectEvidence && onSelectEvidence(evId)}
                                className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer font-medium"
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
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                          Formal Verification Tests Executed
                        </span>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {hyp.tests.map((test, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <span className="text-sky-600 font-mono text-[11px] mt-0.5">
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
    </div>
  );
};
