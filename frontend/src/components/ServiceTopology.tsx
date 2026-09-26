import React, { useState } from 'react';
import {
  Server,
  Database,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import type { Incident } from '../types';

interface ServiceTopologyProps {
  activeIncident: Incident;
}

interface ServiceNode {
  id: string;
  name: string;
  type: 'gateway' | 'service' | 'database';
  version: string;
  metrics: {
    rps: number;
    errorRate: number;
    latencyP99: number;
    cpu: number;
  };
}

export const ServiceTopology: React.FC<ServiceTopologyProps> = ({
  activeIncident,
}) => {
  const [selectedNode, setSelectedNode] = useState<string>('payment-service');

  const isResolved = activeIncident.status === 'RESOLVED';

  const servicesData: Record<string, ServiceNode> = {
    'api-gateway': {
      id: 'api-gateway',
      name: 'API Gateway',
      type: 'gateway',
      version: 'v2.4.1',
      metrics: {
        rps: isResolved ? 1250 : 840,
        errorRate: isResolved ? 0.05 : 9.8,
        latencyP99: isResolved ? 65 : 4200,
        cpu: isResolved ? 42 : 78,
      },
    },
    'auth-service': {
      id: 'auth-service',
      name: 'auth-service',
      type: 'service',
      version: 'v1.8.0',
      metrics: {
        rps: 310,
        errorRate: 0.01,
        latencyP99: 45,
        cpu: 31,
      },
    },
    'order-service': {
      id: 'order-service',
      name: 'order-service',
      type: 'service',
      version: 'v2.1.0',
      metrics: {
        rps: 420,
        errorRate: activeIncident.incident_id === 'INC-002' && !isResolved ? 14.2 : 0.08,
        latencyP99: activeIncident.incident_id === 'INC-002' && !isResolved ? 9800 : 78,
        cpu: 48,
      },
    },
    'payment-service': {
      id: 'payment-service',
      name: 'payment-service',
      type: 'service',
      version: isResolved ? 'v1.4.0 (Rolled Back)' : 'v1.5.0 (Faulty)',
      metrics: {
        rps: isResolved ? 680 : 420,
        errorRate: isResolved ? 0.15 : 18.72,
        latencyP99: isResolved ? 115 : 4850,
        cpu: isResolved ? 52 : 94,
      },
    },
    'inventory-service': {
      id: 'inventory-service',
      name: 'inventory-service',
      type: 'service',
      version: 'v1.3.2',
      metrics: {
        rps: 290,
        errorRate: 0.02,
        latencyP99: 58,
        cpu: 35,
      },
    },
    'payment-db': {
      id: 'payment-db',
      name: 'payment-db (PostgreSQL)',
      type: 'database',
      version: 'pg-15.4',
      metrics: {
        rps: 650,
        errorRate: 0.0,
        latencyP99: 4.2,
        cpu: 28,
      },
    },
    'orders-db': {
      id: 'orders-db',
      name: 'orders-db (PostgreSQL)',
      type: 'database',
      version: 'pg-15.4',
      metrics: {
        rps: 820,
        errorRate: activeIncident.incident_id === 'INC-002' && !isResolved ? 12.0 : 0.0,
        latencyP99: activeIncident.incident_id === 'INC-002' && !isResolved ? 4800 : 3.2,
        cpu: activeIncident.incident_id === 'INC-002' && !isResolved ? 99 : 32,
      },
    },
  };

  const getNodeStatus = (nodeId: string) => {
    if (isResolved) return 'healthy';
    if (activeIncident.services.includes(nodeId)) {
      if (nodeId === 'payment-service' || nodeId === 'orders-db') {
        return activeIncident.severity === 'CRITICAL' ? 'critical' : 'warning';
      }
      return 'warning';
    }
    return 'healthy';
  };

  const renderNodeCard = (nodeId: string) => {
    const node = servicesData[nodeId];
    if (!node) return null;
    const status = getNodeStatus(nodeId);
    const isSelected = selectedNode === nodeId;

    let borderClass = 'border-slate-800 bg-slate-900/60';
    let badge = (
      <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
        <CheckCircle2 className="w-2.5 h-2.5" /> Healthy
      </span>
    );

    if (status === 'critical') {
      borderClass =
        'border-red-500/80 bg-red-950/30 ring-2 ring-red-500/30 shadow-lg shadow-red-950/50';
      badge = (
        <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/80 border border-red-500/50 px-1.5 py-0.5 rounded animate-pulse">
          <Flame className="w-2.5 h-2.5" /> CRITICAL
        </span>
      );
    } else if (status === 'warning') {
      borderClass =
        'border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/30';
      badge = (
        <span className="flex items-center gap-1 text-[10px] text-amber-300 bg-amber-950/60 border border-amber-500/40 px-1.5 py-0.5 rounded">
          <AlertTriangle className="w-2.5 h-2.5" /> Degraded
        </span>
      );
    }

    return (
      <div
        onClick={() => setSelectedNode(nodeId)}
        className={`p-3 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${borderClass} ${
          isSelected ? 'ring-2 ring-indigo-500 shadow-md shadow-indigo-950' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {node.type === 'database' ? (
              <Database className="w-4 h-4 text-purple-400" />
            ) : (
              <Server className="w-4 h-4 text-indigo-400" />
            )}
            <span className="text-xs font-bold text-slate-100">{node.name}</span>
          </div>
          {badge}
        </div>

        <div className="text-[10px] font-mono text-slate-400 mb-2 flex items-center justify-between">
          <span>{node.version}</span>
          <span className="text-slate-300">{node.metrics.rps} req/s</span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1 border-t border-slate-800/60">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Error:</span>
            <span
              className={
                node.metrics.errorRate > 1
                  ? 'text-red-400 font-bold'
                  : 'text-emerald-400'
              }
            >
              {node.metrics.errorRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">p99:</span>
            <span
              className={
                node.metrics.latencyP99 > 500
                  ? 'text-red-400 font-bold'
                  : 'text-slate-300'
              }
            >
              {node.metrics.latencyP99}ms
            </span>
          </div>
        </div>
      </div>
    );
  };

  const selectedNodeData = servicesData[selectedNode];

  return (
    <div className="space-y-6">
      {/* Topology Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Production Service Topology & Dependency Map
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inter-service trace graph with active anomaly telemetry
            and failure cascades.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Operational</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-300">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 font-semibold">Critical Impact</span>
          </div>
        </div>
      </div>

      {/* Main Visual Topology Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph Diagram */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Level 1: Ingress Gateway */}
          <div className="w-64 mb-6 z-10">{renderNodeCard('api-gateway')}</div>

          {/* Connectors Down */}
          <div className="flex items-center justify-center w-full max-w-lg mb-6 text-slate-600">
            <div className="w-1/3 border-b-2 border-slate-700/60" />
            <div className="flex flex-col items-center">
              <ArrowDown className="w-5 h-5 text-indigo-400 animate-bounce" />
            </div>
            <div className="w-1/3 border-b-2 border-slate-700/60" />
          </div>

          {/* Level 2: Core Microservices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-6 z-10">
            <div>{renderNodeCard('auth-service')}</div>
            <div>{renderNodeCard('order-service')}</div>
            <div>{renderNodeCard('payment-service')}</div>
          </div>

          {/* Connectors to Level 3 */}
          <div className="flex items-center justify-around w-full max-w-xl mb-4 text-slate-600">
            <div className="w-12" />
            <ArrowDown className="w-4 h-4 text-slate-500" />
            <ArrowDown className="w-4 h-4 text-red-400" />
          </div>

          {/* Level 3: Downstream & Databases */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl z-10">
            <div className="md:col-start-2">{renderNodeCard('inventory-service')}</div>
            <div>{renderNodeCard('payment-db')}</div>
          </div>

          {/* Level 4: Orders DB */}
          <div className="flex justify-center w-full mt-4">
            <ArrowDown className="w-4 h-4 text-slate-500 mb-2" />
          </div>
          <div className="w-64 z-10">{renderNodeCard('orders-db')}</div>
        </div>

        {/* Selected Node Telemetry Inspector */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Service Telemetry
                </h3>
              </div>
              <span className="text-xs font-mono text-indigo-400">
                {selectedNodeData.id}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Active Image / Build:
                </span>
                <span className="text-xs font-mono font-semibold text-slate-200">
                  {selectedNodeData.version}
                </span>
              </div>

              {/* Gauges */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">HTTP Error Rate:</span>
                    <span
                      className={
                        selectedNodeData.metrics.errorRate > 1
                          ? 'text-red-400 font-bold'
                          : 'text-emerald-400'
                      }
                    >
                      {selectedNodeData.metrics.errorRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedNodeData.metrics.errorRate > 1
                          ? 'bg-red-500'
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

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">p99 Latency:</span>
                    <span
                      className={
                        selectedNodeData.metrics.latencyP99 > 500
                          ? 'text-red-400 font-bold'
                          : 'text-slate-200'
                      }
                    >
                      {selectedNodeData.metrics.latencyP99} ms
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedNodeData.metrics.latencyP99 > 500
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
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

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400">CPU Saturation:</span>
                    <span className="text-slate-200">
                      {selectedNodeData.metrics.cpu}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full"
                      style={{ width: `${selectedNodeData.metrics.cpu}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Diagnostics notes */}
              {selectedNode === 'payment-service' && !isResolved && (
                <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-red-300 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" /> Incident Root Cause Hotspot
                  </div>
                  <p className="text-red-200/80 leading-relaxed text-[11px]">
                    NPE exception cascade observed in PaymentGatewayClient.java
                    since payment-service:v1.5 was rolled out.
                  </p>
                </div>
              )}

              {isResolved && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Node Healthy & Restored
                  </div>
                  <p className="text-emerald-200/80 leading-relaxed text-[11px]">
                    Service successfully restored to stable image v1.4. Telemetry
                    metrics within normal SLO bounds.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Container: Docker Engine</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3" /> 4 vCPU / 8GB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
