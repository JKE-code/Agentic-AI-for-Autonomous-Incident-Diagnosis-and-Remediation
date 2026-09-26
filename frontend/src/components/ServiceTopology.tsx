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

    let borderClass = 'border-slate-200 bg-white shadow-2xs';
    let badge = (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Healthy
      </span>
    );

    if (status === 'critical') {
      borderClass = 'border-rose-300 bg-rose-50/40 ring-1 ring-rose-300 shadow-xs';
      badge = (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
          <Flame className="w-2.5 h-2.5" /> CRITICAL
        </span>
      );
    } else if (status === 'warning') {
      borderClass = 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300 shadow-xs';
      badge = (
        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
          <AlertTriangle className="w-2.5 h-2.5" /> Degraded
        </span>
      );
    }

    return (
      <div
        onClick={() => setSelectedNode(nodeId)}
        className={`p-3 rounded-xl border cursor-pointer transition-all hover:border-slate-400 ${borderClass} ${
          isSelected ? 'ring-2 ring-sky-500 border-sky-500 shadow-xs' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            {node.type === 'database' ? (
              <Database className="w-4 h-4 text-sky-700" />
            ) : (
              <Server className="w-4 h-4 text-sky-600" />
            )}
            <span className="text-xs font-bold text-slate-900">{node.name}</span>
          </div>
          {badge}
        </div>

        <div className="text-[10px] font-mono text-slate-500 mb-2 flex items-center justify-between">
          <span>{node.version}</span>
          <span className="text-slate-700 font-semibold">{node.metrics.rps} req/s</span>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Error:</span>
            <span
              className={
                node.metrics.errorRate > 1
                  ? 'text-rose-600 font-bold'
                  : 'text-emerald-700 font-medium'
              }
            >
              {node.metrics.errorRate}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">p99:</span>
            <span
              className={
                node.metrics.latencyP99 > 500
                  ? 'text-rose-600 font-bold'
                  : 'text-slate-700'
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
    <div className="space-y-6 animate-fade-in">
      {/* Topology Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-sky-600" />
            Production Service Topology & Dependency Map
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inter-service trace graph with active anomaly telemetry
            and failure cascades.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 font-medium">Operational</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-700 font-medium">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-rose-700 font-semibold">Critical Impact</span>
          </div>
        </div>
      </div>

      {/* Main Visual Topology Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Graph Diagram */}
        <div className="lg:col-span-2 bg-slate-50/80 border border-slate-200 rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(148,163,184,0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Level 1: Ingress Gateway */}
          <div className="w-64 mb-5 z-10">{renderNodeCard('api-gateway')}</div>

          {/* Connectors Down */}
          <div className="flex items-center justify-center w-full max-w-lg mb-5 text-slate-400">
            <div className="w-1/3 border-b-2 border-slate-300" />
            <div className="flex flex-col items-center">
              <ArrowDown className="w-5 h-5 text-sky-600" />
            </div>
            <div className="w-1/3 border-b-2 border-slate-300" />
          </div>

          {/* Level 2: Core Microservices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-5 z-10">
            <div>{renderNodeCard('auth-service')}</div>
            <div>{renderNodeCard('order-service')}</div>
            <div>{renderNodeCard('payment-service')}</div>
          </div>

          {/* Connectors to Level 3 */}
          <div className="flex items-center justify-around w-full max-w-xl mb-4 text-slate-400">
            <div className="w-12" />
            <ArrowDown className="w-4 h-4 text-slate-400" />
            <ArrowDown className="w-4 h-4 text-rose-500" />
          </div>

          {/* Level 3: Downstream & Databases */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl z-10">
            <div className="md:col-start-2">{renderNodeCard('inventory-service')}</div>
            <div>{renderNodeCard('payment-db')}</div>
          </div>

          {/* Level 4: Orders DB */}
          <div className="flex justify-center w-full mt-3">
            <ArrowDown className="w-4 h-4 text-slate-400 mb-2" />
          </div>
          <div className="w-64 z-10">{renderNodeCard('orders-db')}</div>
        </div>

        {/* Selected Node Telemetry Inspector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Service Telemetry
                </h3>
              </div>
              <span className="text-xs font-mono font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {selectedNodeData.id}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-1">
                  Active Build / Version:
                </span>
                <span className="text-xs font-mono font-semibold text-slate-900">
                  {selectedNodeData.version}
                </span>
              </div>

              {/* Gauges */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-500">HTTP Error Rate:</span>
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
                      className={`h-full rounded-full ${
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

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-500">p99 Latency:</span>
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
                      className={`h-full rounded-full ${
                        selectedNodeData.metrics.latencyP99 > 500
                          ? 'bg-amber-500'
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

                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-500">CPU Saturation:</span>
                    <span className="text-slate-800 font-semibold">
                      {selectedNodeData.metrics.cpu}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-600 h-full rounded-full"
                      style={{ width: `${selectedNodeData.metrics.cpu}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Diagnostics notes */}
              {selectedNode === 'payment-service' && !isResolved && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-600" /> Incident Hotspot
                  </div>
                  <p className="text-rose-700 leading-relaxed text-[11px]">
                    NPE exception cascade observed in PaymentGatewayClient.java
                    since payment-service:v1.5 was rolled out.
                  </p>
                </div>
              )}

              {isResolved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Node Healthy & Restored
                  </div>
                  <p className="text-emerald-700 leading-relaxed text-[11px]">
                    Service successfully restored to stable image v1.4. Telemetry
                    metrics within normal SLO bounds.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Container: Docker Engine</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-400" /> 4 vCPU / 8GB
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
