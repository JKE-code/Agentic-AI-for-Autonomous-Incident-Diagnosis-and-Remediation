import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import type { Evidence } from '../../types';
import { Layers, FileText, BarChart2, Network, GitBranch } from 'lucide-react';

interface EvidenceBreakdownChartProps {
  evidence: Evidence[];
  selectedSource: string;
  onSelectSource: (source: string) => void;
}

export const EvidenceBreakdownChart: React.FC<EvidenceBreakdownChartProps> = ({
  evidence,
  selectedSource,
  onSelectSource,
}) => {
  // Aggregate count by source
  const sourceColors: Record<string, string> = {
    deployments: '#0284c7', // Sky blue
    logs: '#d97706',        // Amber
    metrics: '#0ea5e9',     // Cyan
    traces: '#6366f1',      // Indigo
    dependencies: '#16a34a',// Grass green
    other: '#64748b',
  };

  const sourceLabels: Record<string, string> = {
    deployments: 'Git Deployments',
    logs: 'App Logs & Traces',
    metrics: 'Telemetry Metrics',
    traces: 'Distributed Spans',
    dependencies: 'Downstream Health',
  };

  const sourceCounts: Record<string, number> = {};
  evidence.forEach((e) => {
    const s = e.source.toLowerCase();
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });

  const chartData = Object.entries(sourceCounts).map(([src, count]) => ({
    name: sourceLabels[src] || src,
    key: src,
    value: count,
    color: sourceColors[src] || '#64748b',
    pct: Math.round((count / (evidence.length || 1)) * 100),
  }));

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'deployments':
        return <GitBranch className="w-3 h-3 text-sky-700" />;
      case 'logs':
        return <FileText className="w-3 h-3 text-amber-600" />;
      case 'metrics':
        return <BarChart2 className="w-3 h-3 text-sky-600" />;
      case 'traces':
      case 'dependencies':
        return <Network className="w-3 h-3 text-emerald-600" />;
      default:
        return <Layers className="w-3 h-3 text-slate-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Multi-Modal Evidence Synthesis
            </h3>
            <p className="text-[11px] text-slate-500">
              Cross-telemetry breakdown across {evidence.length} ingested signal observations
            </p>
          </div>
        </div>

        {selectedSource !== 'all' && (
          <button
            onClick={() => onSelectSource('all')}
            className="text-[11px] font-mono text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors self-start sm:self-auto cursor-pointer"
          >
            Reset to All ({evidence.length})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Donut Chart */}
        <div className="h-44 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={68}
                paddingAngle={3}
                dataKey="value"
                cursor="pointer"
                onClick={(entry: any) => onSelectSource(entry?.key || 'all')}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    stroke={selectedSource === entry.key ? '#0f172a' : '#ffffff'}
                    strokeWidth={selectedSource === entry.key ? 2 : 1}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-lg text-xs space-y-1 font-sans z-50">
                        <span className="font-bold text-slate-800 block">{d.name}</span>
                        <div className="font-mono text-[11px] text-slate-600">
                          <span>{d.value} items ({d.pct}% of total signals)</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-slate-800 font-mono">
              {evidence.length}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Signals</span>
          </div>
        </div>

        {/* Clickable Legend Grid */}
        <div className="space-y-1.5">
          {chartData.map((item) => {
            const isSelected = selectedSource === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectSource(item.key)}
                className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 border-sky-300 shadow-2xs font-semibold'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="flex items-center gap-1.5 text-slate-700">
                    {getSourceIcon(item.key)}
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">{item.pct}%</span>
                  <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                    {item.value}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
