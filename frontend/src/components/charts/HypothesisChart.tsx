import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import type { Hypothesis } from '../../types';
import { BrainCircuit, CheckCircle2, XCircle } from 'lucide-react';

interface HypothesisChartProps {
  hypotheses: Hypothesis[];
  selectedId?: string;
  onSelectHypothesis?: (hypId: string) => void;
}

export const HypothesisChart: React.FC<HypothesisChartProps> = ({
  hypotheses,
  selectedId,
  onSelectHypothesis,
}) => {
  // Format data for Recharts horizontal bar chart
  const data = hypotheses.map((h, idx) => {
    const isVerified = h.status === 'VERIFIED';
    const isRuledOut = h.status === 'DISPROVEN' || h.status === 'RULED_OUT';
    
    // Short label for the Y-Axis
    const shortLabel = `#${idx + 1} ${h.service}: ${h.cause.length > 28 ? h.cause.slice(0, 25) + '...' : h.cause}`;

    return {
      id: h.hypothesis_id,
      name: shortLabel,
      fullCause: h.cause,
      service: h.service,
      scorePct: Math.round(h.score * 100),
      confidencePct: Math.round(h.confidence * 100),
      status: h.status,
      isVerified,
      isRuledOut,
      supportingCount: h.supporting_evidence?.length || 0,
      contradictingCount: h.contradicting_evidence?.length || 0,
    };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Bayesian Root-Cause Likelihood Distribution
            </h3>
            <p className="text-[11px] text-slate-500">
              Posterior probability ranking computed across multi-modal evidence signals
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Verified (High)
          </span>
          <span className="flex items-center gap-1.5 text-slate-500 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
            Ruled Out
          </span>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            onClick={(state: any) => {
              if (state && state.activePayload && state.activePayload.length) {
                const item = state.activePayload[0].payload;
                if (onSelectHypothesis) onSelectHypothesis(item.id);
              }
            }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              tick={{ fontSize: 11, fill: '#1e293b', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1.5 font-sans z-50 max-w-xs">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                        <span className="font-mono font-bold text-sky-800">{d.id}</span>
                        {d.isVerified ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" /> RULED OUT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 font-medium leading-tight">
                        {d.fullCause}
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px] border-t border-slate-100">
                        <div>
                          <span className="text-slate-500 block">Posterior Score:</span>
                          <span className="font-bold text-emerald-700 text-xs">{d.scorePct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Confidence:</span>
                          <span className="font-bold text-sky-700 text-xs">{d.confidencePct}%</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        Evidence: <strong className="text-emerald-700">{d.supportingCount} supporting</strong>,{' '}
                        <strong className="text-rose-600">{d.contradictingCount} contradicting</strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="scorePct" name="Likelihood Score" radius={[0, 6, 6, 0]} cursor="pointer">
              {data.map((entry) => (
                <Cell
                  key={entry.id}
                  fill={
                    entry.isVerified
                      ? '#16a34a' // Grass green for verified
                      : entry.isRuledOut
                      ? '#cbd5e1' // Slate for ruled out
                      : '#0284c7' // Sky blue for investigating
                  }
                  stroke={entry.id === selectedId ? '#0284c7' : 'transparent'}
                  strokeWidth={entry.id === selectedId ? 2 : 0}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
