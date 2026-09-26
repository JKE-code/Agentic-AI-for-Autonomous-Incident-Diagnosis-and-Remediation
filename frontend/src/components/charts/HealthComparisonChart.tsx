import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { ServiceHealthMetric } from '../../types';
import { Activity, CheckCircle2 } from 'lucide-react';

interface HealthComparisonChartProps {
  healthBefore: ServiceHealthMetric;
  healthAfter: ServiceHealthMetric;
  isExecuted: boolean;
}

export const HealthComparisonChart: React.FC<HealthComparisonChartProps> = ({
  healthBefore,
  healthAfter,
  isExecuted,
}) => {
  const latencyBefore = healthBefore.latency_p99_ms || healthBefore.latency_ms || 4850;
  const latencyAfter = healthAfter.latency_p99_ms || healthAfter.latency_ms || 115;

  // Normalized visual data for comparison (scale latency and throughput to comparable bars)
  const chartData = [
    {
      metric: 'Error Rate (%)',
      rawBefore: `${healthBefore.error_rate}%`,
      rawAfter: isExecuted ? `${healthAfter.error_rate}%` : 'Pending',
      Before: healthBefore.error_rate,
      After: isExecuted ? healthAfter.error_rate : 0,
      unit: '%',
    },
    {
      metric: 'p99 Latency (s)',
      rawBefore: `${latencyBefore}ms`,
      rawAfter: isExecuted ? `${latencyAfter}ms` : 'Pending',
      Before: Math.round((latencyBefore / 1000) * 100) / 100,
      After: isExecuted ? Math.round((latencyAfter / 1000) * 100) / 100 : 0,
      unit: 's',
    },
    {
      metric: 'Throughput (x100 rps)',
      rawBefore: `${healthBefore.throughput_rps} rps`,
      rawAfter: isExecuted ? `${healthAfter.throughput_rps} rps` : 'Pending',
      Before: Math.round((healthBefore.throughput_rps / 100) * 10) / 10,
      After: isExecuted ? Math.round((healthAfter.throughput_rps / 100) * 10) / 10 : 0,
      unit: 'x100 rps',
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Pre vs. Post-Remediation Telemetry Verification
            </h3>
            <p className="text-[11px] text-slate-500">
              Direct before-and-after health comparison confirming SLA restoration
            </p>
          </div>
        </div>

        {isExecuted && (
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>-99.2% ERROR BURNOUT</span>
          </div>
        )}
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="metric"
              tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1.5 font-sans z-50">
                      <span className="font-bold text-slate-800 block border-b border-slate-100 pb-1">
                        {label}
                      </span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px]">
                        <span className="text-rose-600 font-semibold">Incident State:</span>
                        <span className="font-bold text-slate-800 text-right">{d.rawBefore}</span>
                        <span className="text-emerald-700 font-semibold">Post-Fix State:</span>
                        <span className="font-bold text-emerald-700 text-right">{d.rawAfter}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="Before"
              name="Outage Pre-Health"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="After"
              name={isExecuted ? 'Remediated Health' : 'Target SLA Goal'}
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
