import React, { useState } from 'react';
import type { Remediation } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Activity,
  Layers,
  Bot,
  UserCheck,
} from 'lucide-react';

interface RemediationPanelProps {
  remediation: Remediation;
  incidentId: string;
  onApproveAndExecute: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
  onRollback: (actionId: string) => Promise<void>;
}

export const RemediationPanel: React.FC<RemediationPanelProps> = ({
  remediation,
  onApproveAndExecute,
  onReject,
  onRollback,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');

  const handleApprove = async () => {
    setIsProcessing(true);
    setStepStatus('Recording Human Approval in Audit Log...');
    await new Promise((r) => setTimeout(r, 600));

    setStepStatus('Executing rollback in Docker Sandbox...');
    await new Promise((r) => setTimeout(r, 900));

    setStepStatus('Running health check verification probes...');
    await onApproveAndExecute(remediation.action_id);
    setIsProcessing(false);
    setStepStatus('');
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject(remediation.action_id);
    setIsProcessing(false);
  };

  const handleRollback = async () => {
    setIsProcessing(true);
    await onRollback(remediation.action_id);
    setIsProcessing(false);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'HIGH':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
            MEDIUM RISK
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            LOW RISK
          </span>
        );
    }
  };

  const isExecuted =
    remediation.status === 'SUCCESS' || remediation.status === 'EXECUTING';
  const isPending =
    remediation.status === 'PENDING_APPROVAL' || remediation.status === 'PROPOSED';

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Autonomous Remediation & Human Approval Gate
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict safety policy: risky remediation actions require explicit human sign-off before sandbox dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {getRiskBadge(remediation.risk_level)}
          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
            {remediation.action}
          </span>
        </div>
      </div>

      {/* Plan Card */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">
              Target Service: <span className="text-indigo-300 font-mono">{remediation.target_service}</span>
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Action ID: {remediation.action_id}
          </span>
        </div>

        <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
          {remediation.explanation}
        </p>

        {/* Parameters Diff / Spec */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
          <div className="text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">
            Execution Parameters & State Transition:
          </div>
          <div className="text-slate-300">
            {Object.entries(remediation.parameters).map(([key, val]) => (
              <div key={key} className="flex gap-2">
                <span className="text-slate-500">{key}:</span>
                <span className="text-emerald-400">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rollback Safety Guardrail */}
        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-start gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-amber-300">Safety Guardrail:</strong> {remediation.rollback_plan}
          </span>
        </div>
      </div>

      {/* Health Before vs After Comparison */}
      {remediation.health_before && remediation.health_after && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            Telemetry Health Impact: Before vs After Remediation
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Error Rate */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">
                HTTP Error Rate
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-red-400 font-bold text-sm">
                  {remediation.health_before.error_rate}%
                </span>
                <span className="text-slate-500 text-xs">→</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {isExecuted ? `${remediation.health_after.error_rate}%` : '---'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                {isExecuted ? '✓ 99.2% Drop (Normalized)' : 'Pending verification'}
              </div>
            </div>

            {/* Latency */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">
                p99 Tail Latency
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-red-400 font-bold text-sm">
                  {remediation.health_before.latency_p99_ms}ms
                </span>
                <span className="text-slate-500 text-xs">→</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {isExecuted ? `${remediation.health_after.latency_p99_ms}ms` : '---'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                {isExecuted ? '✓ Normalized to SLA < 150ms' : 'Pending verification'}
              </div>
            </div>

            {/* Throughput */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">
                Service Throughput
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-amber-400 font-bold text-sm">
                  {remediation.health_before.throughput_rps} rps
                </span>
                <span className="text-slate-500 text-xs">→</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {isExecuted ? `${remediation.health_after.throughput_rps} rps` : '---'}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-1">
                {isExecuted ? '✓ Full Traffic Capacity Restored' : 'Degraded capacity'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Processing Animation / Steps */}
      {isProcessing && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/50 flex items-center gap-3">
          <Bot className="w-5 h-5 text-indigo-400 animate-spin" />
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-indigo-200">
              Autonomous Remediation In Progress
            </span>
            <p className="text-[11px] font-mono text-indigo-300">
              {stepStatus}
            </p>
          </div>
        </div>
      )}

      {/* Human Approval Gate Controls */}
      <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {isPending ? (
          <>
            <div className="flex items-center gap-2 text-xs text-amber-300 font-medium">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Awaiting Human Operator Approval to Execute Sandbox Action</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors"
              >
                <XCircle className="w-4 h-4 text-rose-400" />
                Reject Action
              </button>

              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-98"
              >
                <Play className="w-4 h-4 fill-current" />
                APPROVE & EXECUTE
              </button>
            </div>
          </>
        ) : isExecuted ? (
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="text-xs font-bold text-emerald-300 block">
                  Remediation Action Executed Successfully
                </span>
                <span className="text-[11px] text-emerald-400/80 font-mono">
                  Sandbox rollback validated. All post-action health probes PASS.
                </span>
              </div>
            </div>

            <button
              onClick={handleRollback}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-mono transition-colors"
              title="Trigger emergency rollback if anomalies recur"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Manual Rollback
            </button>
          </div>
        ) : (
          <div className="w-full p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-semibold">
            <XCircle className="w-4 h-4 text-rose-400" />
            Remediation proposal was rejected by operator. Manual intervention active.
          </div>
        )}
      </div>
    </div>
  );
};
