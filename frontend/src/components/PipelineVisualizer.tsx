import { cn } from '@/lib/utils';
import { MessageSquare, ScanSearch, AlertTriangle, Shield, Bot } from 'lucide-react';
import type { PipelineResult, PipelineStatus } from '@/types';

interface PipelineVisualizerProps {
  pipeline: PipelineResult | null;
  isScanning: boolean;
}

interface StageConfig {
  key: keyof PipelineResult;
  label: string;
  icon: React.ReactNode;
}

const STAGES: StageConfig[] = [
  { key: 'user_input', label: 'User Input',   icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'inspection', label: 'Inspection',   icon: <ScanSearch    className="w-4 h-4" /> },
  { key: 'detection',  label: 'Detection',    icon: <AlertTriangle className="w-4 h-4" /> },
  { key: 'policy',     label: 'Policy',       icon: <Shield        className="w-4 h-4" /> },
  { key: 'ai_agent',   label: 'AI Agent',     icon: <Bot           className="w-4 h-4" /> },
];

const STATUS_STYLES: Record<PipelineStatus | 'idle', { node: string; dot: string; connector: string }> = {
  idle:    { node: 'border-white/10 bg-white/4',            dot: 'bg-slate-600',    connector: 'bg-white/10' },
  active:  { node: 'border-indigo-500/50 bg-indigo-900/20', dot: 'bg-indigo-400 animate-pulse', connector: 'bg-indigo-500/30' },
  pass:    { node: 'border-emerald-500/40 bg-emerald-900/15',dot: 'bg-emerald-400', connector: 'bg-emerald-500/40' },
  alert:   { node: 'border-red-500/40 bg-red-900/15',        dot: 'bg-red-400',     connector: 'bg-red-500/40' },
  warning: { node: 'border-amber-500/40 bg-amber-900/15',    dot: 'bg-amber-400',   connector: 'bg-amber-500/40' },
  blocked: { node: 'border-red-500/60 bg-red-900/20',        dot: 'bg-red-500',     connector: 'bg-red-500/20' },
};

function PipelineConnector({ leftStatus }: { leftStatus: PipelineStatus | 'idle'; rightStatus: PipelineStatus | 'idle' }) {
  const isActive = leftStatus !== 'idle' && leftStatus !== 'active';
  const isDanger = leftStatus === 'alert' || leftStatus === 'blocked' || leftStatus === 'warning';

  return (
    <div className="relative flex-1 h-0.5 mx-1">
      <div className={cn(
        'absolute inset-0 rounded-full transition-all duration-500',
        isActive
          ? isDanger ? 'bg-red-500/30' : 'bg-emerald-500/30'
          : 'bg-white/8',
      )} />
      {isActive && (
        <div className={cn(
          'absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full',
          isDanger ? 'bg-red-400' : 'bg-emerald-400',
          'animate-[slide-right_1.5s_ease-in-out_infinite]',
        )} />
      )}
    </div>
  );
}

export function PipelineVisualizer({ pipeline, isScanning }: PipelineVisualizerProps) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Detection Pipeline</h3>
        {isScanning && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span className="text-xs text-indigo-400">Scanning</span>
          </div>
        )}
      </div>

      {/* Horizontal pipeline nodes */}
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const stageData = pipeline?.[stage.key];
          const status: PipelineStatus | 'idle' = stageData?.status ?? 'idle';
          const styles = STATUS_STYLES[status];

          return (
            <div key={stage.key} className="flex items-center flex-1">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div className={cn(
                  'w-10 h-10 rounded-xl border flex items-center justify-center text-slate-300',
                  'transition-all duration-400',
                  styles.node,
                )}>
                  {stage.icon}
                </div>
                <div className={cn('w-1.5 h-1.5 rounded-full transition-all duration-400', styles.dot)} />
                <span className="text-[10px] text-slate-500 text-center leading-tight hidden sm:block">{stage.label}</span>
              </div>

              {/* Connector (not after last) */}
              {i < STAGES.length - 1 && (
                <PipelineConnector
                  leftStatus={status}
                  rightStatus={pipeline?.[STAGES[i + 1].key]?.status ?? 'idle'}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Stage detail cards (only when pipeline is available) */}
      {pipeline && (
        <div className="grid grid-cols-1 gap-1.5 mt-1">
          {STAGES.map(stage => {
            const s = pipeline[stage.key];
            const styles = STATUS_STYLES[s.status ?? 'idle'];
            return (
              <div key={stage.key} className={cn(
                'flex items-start gap-3 px-3 py-2 rounded-lg border transition-all duration-300',
                styles.node,
              )}>
                <div className={cn('mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0', styles.dot)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200">{s.label}</span>
                    <span className="text-[10px] text-slate-500 capitalize">{s.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{s.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
