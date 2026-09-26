import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { Incident } from '../../types';
import { Activity, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

interface TelemetryChartProps {
  incident: Incident;
  isResolved: boolean;
}

interface TelemetryPoint {
  time: string;
  errorRate: number;
  latencyMs: number;
  throughputRps: number;
  event?: string;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  incident,
  isResolved,
}) => {
  const [metricView, setMetricView] = useState<'both' | 'error' | 'latency'>('both');

  // Generate dynamic telemetry timeline based on incident and resolved state
  const getTelemetryData = (): TelemetryPoint[] => {
    const isInc1 = incident.incident_id === 'INC-001';
    const isInc2 = incident.incident_id === 'INC-002';
    const isInc3 = incident.incident_id === 'INC-003';

    const peakError = isInc1 ? 18.7 : isInc2 ? 24.2 : isInc3 ? 14.5 : 12.0;
    const peakLatency = isInc1 ? 4850 : isInc2 ? 3920 : isInc3 ? 2400 : 1800;

    return [
      { time: '10:38', errorRate: 0.12, latencyMs: 95, throughputRps: 520 },
      { time: '10:40', errorRate: 0.18, latencyMs: 110, throughputRps: 535 },
      { time: '10:41', errorRate: 0.85, latencyMs: 310, throughputRps: 510, event: 'Deploy Triggered' },
      { time: '10:42', errorRate: Math.round(peakError * 0.65 * 10) / 10, latencyMs: Math.round(peakLatency * 0.6), throughputRps: 460, event: 'Anomaly Detected' },
      { time: '10:43', errorRate: peakError, latencyMs: peakLatency, throughputRps: 340, event: 'SLA Breached' },
      { time: '10:44', errorRate: Math.round(peakError * 0.95 * 10) / 10, latencyMs: Math.round(peakLatency * 0.95), throughputRps: 330, event: 'Agentic Intake' },
      { time: '10:45', errorRate: isResolved ? 4.2 : peakError, latencyMs: isResolved ? 620 : peakLatency, throughputRps: isResolved ? 480 : 310, event: isResolved ? 'Remediation Executed' : undefined },
      { time: '10:46', errorRate: isResolved ? 0.35 : peakError, latencyMs: isResolved ? 165 : peakLatency, throughputRps: isResolved ? 580 : 300 },
      { time: '10:47', errorRate: isResolved ? 0.15 : Math.round(peakError * 0.98 * 10) / 10, latencyMs: isResolved ? 115 : peakLatency, throughputRps: isResolved ? 680 : 290, event: isResolved ? 'Health Probes Green' : undefined },
    ];
  };

  const data = getTelemetryData();

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Real-Time Telemetry & SLA Breach Timeline
                {isResolved ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    RECOVERY CONFIRMED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    ACTIVE SPIKE
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500">
                Visualizing correlated HTTP 5xx error budget burn and downstream p99 latency curve
              </p>
            </div>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto text-xs font-medium">
          <button
            onClick={() => setMetricView('both')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              metricView === 'both'
                ? 'bg-white text-sky-800 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Combined View
          </button>
          <button
            onClick={() => setMetricView('error')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              metricView === 'error'
                ? 'bg-white text-rose-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Error Rate %
          </button>
          <button
            onClick={() => setMetricView('latency')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              metricView === 'latency'
                ? 'bg-white text-sky-800 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            p99 Latency ms
          </button>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              {/* Sky Blue Gradient for Error Area */}
              <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isResolved ? '#0284c7' : '#e11d48'} stopOpacity={0.25} />
                <stop offset="95%" stopColor={isResolved ? '#0284c7' : '#e11d48'} stopOpacity={0.0} />
              </linearGradient>
              {/* Grass Green Gradient for Recovery */}
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
            />
            {/* Primary Y-Axis for Error Rate */}
            {(metricView === 'both' || metricView === 'error') && (
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                unit="%"
                domain={[0, 'dataMax + 4']}
              />
            )}
            {/* Secondary Y-Axis for Latency */}
            {(metricView === 'both' || metricView === 'latency') && (
              <YAxis
                yAxisId={metricView === 'latency' ? 'left' : 'right'}
                orientation={metricView === 'latency' ? 'left' : 'right'}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                unit="ms"
                domain={[0, 'dataMax + 500']}
              />
            )}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as TelemetryPoint;
                  return (
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-xs space-y-1.5 font-sans z-50">
                      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1 font-mono text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Clock className="w-3 h-3 text-sky-600" /> {label}
                        </span>
                        {pt.event && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                            {pt.event}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] pt-1">
                        <span className="text-slate-500">Error Rate:</span>
                        <span className={`font-bold text-right ${pt.errorRate > 1.0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {pt.errorRate}%
                        </span>
                        <span className="text-slate-500">p99 Latency:</span>
                        <span className={`font-bold text-right ${pt.latencyMs > 500 ? 'text-amber-600' : 'text-sky-700'}`}>
                          {pt.latencyMs} ms
                        </span>
                        <span className="text-slate-500">Throughput:</span>
                        <span className="font-semibold text-slate-700 text-right">
                          {pt.throughputRps} rps
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* SLA Reference Line */}
            <ReferenceLine
              yAxisId="left"
              y={1.0}
              stroke="#16a34a"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'SLA Threshold (1.0%)',
                fill: '#15803d',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />

            {(metricView === 'both' || metricView === 'error') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="errorRate"
                name="Error Rate (%)"
                stroke={isResolved ? '#0284c7' : '#e11d48'}
                strokeWidth={2.5}
                fill="url(#errorGradient)"
                activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {(metricView === 'both' || metricView === 'latency') && (
              <Line
                yAxisId={metricView === 'latency' ? 'left' : 'right'}
                type="monotone"
                dataKey="latencyMs"
                name="p99 Latency (ms)"
                stroke="#0284c7"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 font-mono text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px]">Onset Anomaly:</span>
          <span className="font-bold text-slate-800">10:41:00 UTC</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px]">Peak Impact:</span>
          <span className="font-bold text-rose-600">{data[4]?.errorRate}% / {data[4]?.latencyMs}ms</span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-[11px]">Post-Remedy State:</span>
          <span className={`font-bold ${isResolved ? 'text-emerald-700' : 'text-slate-500'}`}>
            {isResolved ? '0.15% (Nominal)' : 'Awaiting Fix'}
          </span>
        </div>
      </div>
    </div>
  );
};
