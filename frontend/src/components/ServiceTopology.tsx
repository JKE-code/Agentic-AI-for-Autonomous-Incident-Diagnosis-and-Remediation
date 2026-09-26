import React, { useState, useMemo } from 'react';
import {
  Server,
  Database,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import type { Incident } from '../types';
import { sounds } from '../utils/audio';

interface ServiceTopologyProps {
  activeIncident: Incident;
}

interface ServiceNode {
  id: string;
  name: string;
  type: 'gateway' | 'service' | 'database';
  tier: 'ingress' | 'app' | 'data';
  x: number;
  y: number;
  version: string;
  dependencies: string[];
  metrics: {
    rps: number;
    errorRate: number;
    latencyP99: number;
    cpu: number;
  };
}

interface EdgeConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  rps: number;
  latencyMs: number;
  isFailing: boolean;
}

export const ServiceTopology: React.FC<ServiceTopologyProps> = ({
  activeIncident,
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('payment-service');
  const [tierFilter, setTierFilter] = useState<'all' | 'ingress' | 'app' | 'data'>('all');
  const [highlightFailurePath, setHighlightFailurePath] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const isResolved = activeIncident.status === 'RESOLVED';
  const isInc1 = activeIncident.incident_id === 'INC-001';
  const isInc2 = activeIncident.incident_id === 'INC-002';
  const isInc3 = activeIncident.incident_id === 'INC-003';

  // Dynamic service definition with canvas coordinates (x, y)
  const services: Record<string, ServiceNode> = useMemo(() => ({
    'api-gateway': {
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'gateway',
      tier: 'ingress',
      x: 380,
      y: 60,
      version: 'envoy-v1.28',
      dependencies: ['auth-service', 'order-service', 'payment-service'],
      metrics: {
        rps: isResolved ? 1250 : 840,
        errorRate: isResolved ? 0.05 : isInc1 ? 9.8 : 0.2,
        latencyP99: isResolved ? 48 : isInc1 ? 4200 : 75,
        cpu: isResolved ? 42 : isInc1 ? 78 : 38,
      },
    },
    'auth-service': {
      id: 'auth-service',
      name: 'Auth Service',
      type: 'service',
      tier: 'app',
      x: 140,
      y: 200,
      version: 'v1.8.2',
      dependencies: [],
      metrics: {
        rps: 310,
        errorRate: 0.01,
        latencyP99: 42,
        cpu: 28,
      },
    },
    'order-service': {
      id: 'order-service',
      name: 'Order Service',
      type: 'service',
      tier: 'app',
      x: 380,
      y: 200,
      version: 'v2.1.0',
      dependencies: ['orders-db', 'inventory-service'],
      metrics: {
        rps: 460,
        errorRate: isInc2 && !isResolved ? 14.2 : 0.08,
        latencyP99: isInc2 && !isResolved ? 9800 : 64,
        cpu: isInc2 && !isResolved ? 89 : 45,
      },
    },
    'payment-service': {
      id: 'payment-service',
      name: 'Payment Service',
      type: 'service',
      tier: 'app',
      x: 620,
      y: 200,
      version: isResolved ? 'v1.4.0 (Stable)' : 'v1.5.0 (Faulty)',
      dependencies: ['payment-db', 'orders-db'],
      metrics: {
        rps: isResolved ? 680 : 420,
        errorRate: isResolved ? 0.15 : isInc1 ? 18.72 : 0.1,
        latencyP99: isResolved ? 115 : isInc1 ? 4850 : 95,
        cpu: isResolved ? 52 : isInc1 ? 94 : 48,
      },
    },
    'inventory-service': {
      id: 'inventory-service',
      name: 'Inventory Service',
      type: 'service',
      tier: 'app',
      x: 180,
      y: 350,
      version: 'v1.3.2',
      dependencies: [],
      metrics: {
        rps: 290,
        errorRate: isInc3 && !isResolved ? 8.5 : 0.02,
        latencyP99: isInc3 && !isResolved ? 2400 : 54,
        cpu: isInc3 && !isResolved ? 98 : 34,
      },
    },
    'orders-db': {
      id: 'orders-db',
      name: 'Orders DB',
      type: 'database',
      tier: 'data',
      x: 420,
      y: 350,
      version: 'PostgreSQL 15',
      dependencies: [],
      metrics: {
        rps: 820,
        errorRate: isInc2 && !isResolved ? 12.0 : 0.0,
        latencyP99: isInc2 && !isResolved ? 4800 : 3.8,
        cpu: isInc2 && !isResolved ? 99 : 32,
      },
    },
    'payment-db': {
      id: 'payment-db',
      name: 'Payment DB',
      type: 'database',
      tier: 'data',
      x: 660,
      y: 350,
      version: 'PostgreSQL 15',
      dependencies: [],
      metrics: {
        rps: 650,
        errorRate: 0.0,
        latencyP99: 4.2,
        cpu: 28,
      },
    },
  }), [isResolved, isInc1, isInc2, isInc3]);

  // Edges connecting services
  const edges: EdgeConnection[] = useMemo(() => [
    {
      id: 'e1',
      from: 'api-gateway',
      to: 'auth-service',
      label: 'OAuth2 Token Validate',
      rps: 310,
      latencyMs: 42,
      isFailing: false,
    },
    {
      id: 'e2',
      from: 'api-gateway',
      to: 'order-service',
      label: 'POST /orders',
      rps: 460,
      latencyMs: isInc2 && !isResolved ? 4800 : 64,
      isFailing: isInc2 && !isResolved,
    },
    {
      id: 'e3',
      from: 'api-gateway',
      to: 'payment-service',
      label: 'POST /charge (Fault Storm)',
      rps: 420,
      latencyMs: isInc1 && !isResolved ? 4850 : 115,
      isFailing: isInc1 && !isResolved,
    },
    {
      id: 'e4',
      from: 'order-service',
      to: 'inventory-service',
      label: 'Check Stock',
      rps: 290,
      latencyMs: 54,
      isFailing: isInc3 && !isResolved,
    },
    {
      id: 'e5',
      from: 'order-service',
      to: 'orders-db',
      label: 'Connection Pool',
      rps: 820,
      latencyMs: isInc2 && !isResolved ? 4800 : 3.8,
      isFailing: isInc2 && !isResolved,
    },
    {
      id: 'e6',
      from: 'payment-service',
      to: 'orders-db',
      label: 'Update Order Paid',
      rps: 420,
      latencyMs: 4.5,
      isFailing: false,
    },
    {
      id: 'e7',
      from: 'payment-service',
      to: 'payment-db',
      label: 'Ledger Write',
      rps: 650,
      latencyMs: 4.2,
      isFailing: false,
    },
  ], [isInc1, isInc2, isInc3, isResolved]);

  const getNodeStatus = (nodeId: string): 'healthy' | 'critical' | 'warning' => {
    if (isResolved) return 'healthy';
    if (activeIncident.services.includes(nodeId)) {
      if (nodeId === 'payment-service' && isInc1) return 'critical';
      if (nodeId === 'orders-db' && isInc2) return 'critical';
      if (nodeId === 'inventory-service' && isInc3) return 'critical';
      return 'warning';
    }
    return 'healthy';
  };

  const selectedNodeData = services[selectedNode] || services['payment-service'];

  // Critical path nodes for active incident
  const criticalPathNodeIds = useMemo(() => {
    if (isInc1) return ['api-gateway', 'payment-service', 'orders-db'];
    if (isInc2) return ['api-gateway', 'order-service', 'orders-db'];
    if (isInc3) return ['order-service', 'inventory-service'];
    return activeIncident.services;
  }, [isInc1, isInc2, isInc3, activeIncident.services]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Banner & Flow Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Production Service Topology & Real-Time Flow Map
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                Live Trace Mesh
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Interactive trace flow showing animated RPC traffic packets, dependency cascades, and localized fault hotspots.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center flex-wrap gap-2 self-start md:self-auto text-xs">
          {/* Highlight Critical Failure Path Toggle */}
          <button
            onClick={() => {
              sounds.playBlip();
              setHighlightFailurePath(!highlightFailurePath);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer border ${
              highlightFailurePath
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Failure Path Flow</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                highlightFailurePath ? 'bg-rose-500 animate-ping' : 'bg-slate-300'
              }`}
            />
          </button>

          {/* Tier Filters */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            {(['all', 'ingress', 'app', 'data'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  sounds.playBlip();
                  setTierFilter(t);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize font-mono text-[11px] transition-all cursor-pointer ${
                  tierFilter === t
                    ? 'bg-white text-sky-800 font-bold shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive SVG Dependency Map */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between select-none">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.35) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Legend Overlay at Top Left */}
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200 text-[11px] font-mono shadow-2xs z-20 self-start">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Healthy ({isResolved ? '7/7' : '4/7'})
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Degraded
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Root Hotspot
            </span>
          </div>

          {/* Interactive SVG Graph Area */}
          <div className="relative w-full h-[460px] my-2">
            <svg className="w-full h-full" viewBox="0 0 800 440">
              <defs>
                {/* Arrow markers */}
                <marker
                  id="arrow-sky"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
                </marker>
                <marker
                  id="arrow-rose"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
                </marker>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
                </marker>

                {/* Pulse animations for traffic */}
                <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Draw Edges */}
              {edges.map((edge) => {
                const source = services[edge.from];
                const target = services[edge.to];
                if (!source || !target) return null;

                const isFailing = edge.isFailing;
                const isHighlighted =
                  highlightFailurePath &&
                  criticalPathNodeIds.includes(edge.from) &&
                  criticalPathNodeIds.includes(edge.to);

                const strokeColor = isResolved
                  ? '#16a34a'
                  : isFailing
                  ? '#e11d48'
                  : isHighlighted
                  ? '#0284c7'
                  : '#cbd5e1';

                const strokeWidth = isFailing || isHighlighted ? 2.5 : 1.5;
                const strokeDasharray = isFailing ? '6 4' : 'none';

                // Cubic Bezier curve path
                const deltaY = target.y - source.y;
                const pathD = `M ${source.x} ${source.y + 20} C ${source.x} ${
                  source.y + deltaY * 0.55
                }, ${target.x} ${target.y - deltaY * 0.45}, ${target.x} ${
                  target.y - 20
                }`;

                return (
                  <g key={edge.id} className="transition-all duration-300">
                    {/* Shadow / Glow Line */}
                    {isFailing && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#fecdd3"
                        strokeWidth="7"
                        opacity="0.6"
                      />
                    )}

                    {/* Main Path */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      markerEnd={
                        isResolved
                          ? 'url(#arrow-emerald)'
                          : isFailing
                          ? 'url(#arrow-rose)'
                          : 'url(#arrow-sky)'
                      }
                      className={isFailing ? 'animate-pulse' : ''}
                    />

                    {/* Animated Flow Packet */}
                    <circle r={isFailing ? 4 : 3} fill={isFailing ? '#e11d48' : isResolved ? '#16a34a' : '#0284c7'}>
                      <animateMotion
                        path={pathD}
                        dur={isFailing ? '1.4s' : '2.6s'}
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Midpoint Label badge */}
                    <foreignObject
                      x={(source.x + target.x) / 2 - 45}
                      y={(source.y + target.y) / 2 - 12}
                      width="90"
                      height="24"
                    >
                      <div
                        className={`text-[9px] font-mono text-center px-1.5 py-0.5 rounded-full border shadow-2xs whitespace-nowrap overflow-hidden text-ellipsis ${
                          isFailing
                            ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                            : isResolved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white/95 text-slate-600 border-slate-200'
                        }`}
                        title={`${edge.label} (${edge.latencyMs}ms)`}
                      >
                        {edge.latencyMs}ms
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Render Nodes inside foreignObject for maximum rich HTML/Tailwind interactivity */}
              {Object.values(services).map((node) => {
                const status = getNodeStatus(node.id);
                const isSelected = selectedNode === node.id;
                const isHovered = hoveredNode === node.id;
                const isCritical = status === 'critical';
                const isDegraded = status === 'warning';
                const isNodeFiltered =
                  tierFilter !== 'all' && node.tier !== tierFilter;

                return (
                  <foreignObject
                    key={node.id}
                    x={node.x - 75}
                    y={node.y - 35}
                    width="150"
                    height="70"
                    className={`transition-all duration-200 ${
                      isNodeFiltered ? 'opacity-25 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    <div
                      onClick={() => {
                        sounds.playBlip();
                        setSelectedNode(node.id);
                      }}
                      onMouseEnter={() => setHoveredNode(node.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`w-full h-full p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? 'ring-2 ring-sky-500 border-sky-600 bg-white shadow-sky-glow scale-102'
                          : isHovered
                          ? 'border-sky-400 bg-white shadow-sm'
                          : isCritical
                          ? 'border-rose-400 bg-rose-50/70 shadow-xs'
                          : isDegraded
                          ? 'border-amber-300 bg-amber-50/50 shadow-2xs'
                          : 'border-slate-200 bg-white shadow-2xs hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {node.type === 'database' ? (
                            <Database className="w-3.5 h-3.5 text-sky-700 flex-shrink-0" />
                          ) : (
                            <Server className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                          )}
                          <span className="text-[11px] font-bold text-slate-900 truncate">
                            {node.name}
                          </span>
                        </div>

                        {/* Status icon */}
                        {isCritical ? (
                          <Flame className="w-3.5 h-3.5 text-rose-600 animate-bounce flex-shrink-0" />
                        ) : isDegraded ? (
                          <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        )}
                      </div>

                      {/* Metrics bar */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                        <span className={node.metrics.errorRate > 1 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                          {node.metrics.errorRate > 0 ? `${node.metrics.errorRate}% err` : '0%'}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {node.metrics.latencyP99}ms
                        </span>
                      </div>
                    </div>
                  </foreignObject>
                );
              })}
            </svg>
          </div>

          {/* Interactive Helper Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Click any service node to inspect live telemetry & dependencies</span>
            <span className="flex items-center gap-1 text-sky-700 font-semibold">
              <Activity className="w-3 h-3" /> Selected: {selectedNodeData.name}
            </span>
          </div>
        </div>

        {/* Right Col: Focused Service Telemetry & Dependency Inspector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Service Telemetry Inspector
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {selectedNodeData.id}
                  </span>
                </div>
              </div>

              {getNodeStatus(selectedNodeData.id) === 'critical' ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-600" />
                  INCIDENT HOTSPOT
                </span>
              ) : isResolved ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  STABILIZED
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  HEALTHY
                </span>
              )}
            </div>

            {/* Service Specs Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Service Image / Build:</span>
                <span className="font-bold text-slate-900">{selectedNodeData.version}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tier Architecture:</span>
                <span className="capitalize font-semibold text-sky-700">{selectedNodeData.tier} Layer</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Load:</span>
                <span className="font-semibold text-slate-800">{selectedNodeData.metrics.rps} req/sec</span>
              </div>
            </div>

            {/* Real-Time Gauges */}
            <div className="space-y-3 font-mono text-xs">
              {/* Error Rate */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">HTTP 5xx Error Rate:</span>
                  <span
                    className={
                      selectedNodeData.metrics.errorRate > 1
                        ? 'text-rose-600 font-bold'
                        : 'text-emerald-700 font-semibold'
                    }
                  >
                    {selectedNodeData.metrics.errorRate}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedNodeData.metrics.errorRate > 1
                        ? 'bg-rose-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        selectedNodeData.metrics.errorRate * 5,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Latency */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">p99 Response Latency:</span>
                  <span
                    className={
                      selectedNodeData.metrics.latencyP99 > 500
                        ? 'text-rose-600 font-bold'
                        : 'text-slate-800 font-semibold'
                    }
                  >
                    {selectedNodeData.metrics.latencyP99} ms
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedNodeData.metrics.latencyP99 > 500
                        ? 'bg-rose-500'
                        : 'bg-sky-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (selectedNodeData.metrics.latencyP99 / 5000) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* CPU Saturation */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">CPU Saturation:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedNodeData.metrics.cpu}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedNodeData.metrics.cpu}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Direct Dependencies Map list */}
            {selectedNodeData.dependencies.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                  Downstream Dependencies ({selectedNodeData.dependencies.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNodeData.dependencies.map((depId) => (
                    <button
                      key={depId}
                      onClick={() => {
                        sounds.playBlip();
                        setSelectedNode(depId);
                      }}
                      className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                    >
                      <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                      <span>{depId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Incident Context Finding */}
            {selectedNode === 'payment-service' && !isResolved && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-600" /> Incident Hotspot
                </div>
                <p className="text-rose-700 leading-relaxed text-[11px]">
                  NullPointerException exception storm observed in PaymentGatewayClient.java:142
                  introduced in faulty deployment v1.5.0.
                </p>
              </div>
            )}

            {isResolved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Service Restored
                </div>
                <p className="text-emerald-700 leading-relaxed text-[11px]">
                  Remediation rollback applied. Telemetry probes confirm normal error rates &lt; 0.2%.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Container: Kubernetes Pod</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-400" /> 4 vCPU / 8GB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
