import { cn } from '@/lib/utils';
import type { Action } from '@/types';

interface RiskMeterProps {
  riskPercent: number;
  confidence: number;
  action: Action;
  riskLevel: string;
}

const ACTION_COLORS: Record<Action, { bar: string; text: string; glow: string }> = {
  block:   { bar: 'from-red-600 to-rose-500',    text: 'text-red-400',    glow: 'shadow-red-900/40' },
  flag:    { bar: 'from-amber-500 to-orange-400', text: 'text-amber-400',  glow: 'shadow-amber-900/40' },
  monitor: { bar: 'from-violet-500 to-purple-400',text: 'text-violet-400', glow: 'shadow-violet-900/40' },
  allow:   { bar: 'from-emerald-500 to-green-400',text: 'text-emerald-400',glow: 'shadow-emerald-900/40' },
};

function RiskBar({ percent, action }: { percent: number; action: Action }) {
  const colors = ACTION_COLORS[action] ?? ACTION_COLORS.allow;
  return (
    <div className="relative h-3 w-full rounded-full bg-white/6 overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
          colors.bar,
        )}
        style={{ width: `${percent}%` }}
      />
      {/* Pulse line at the tip when high risk */}
      {percent > 60 && (
        <div
          className="absolute top-0 h-full w-0.5 bg-white/40 animate-pulse rounded-full"
          style={{ left: `${percent}%` }}
        />
      )}
    </div>
  );
}

function ConfidenceRing({ confidence, action }: { confidence: number; action: Action }) {
  const r = 38;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (confidence / 100) * circumference;
  const colors = ACTION_COLORS[action] ?? ACTION_COLORS.allow;

  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
        {/* Track */}
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        {/* Fill */}
        <circle
          cx="44" cy="44" r={r}
          fill="none"
          stroke="url(#confGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={action === 'block' ? '#dc2626' : action === 'flag' ? '#f59e0b' : action === 'monitor' ? '#8b5cf6' : '#10b981'} />
            <stop offset="100%" stopColor={action === 'block' ? '#f43f5e' : action === 'flag' ? '#fb923c' : action === 'monitor' ? '#a855f7' : '#34d399'} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-xl font-bold tabular-nums', colors.text)}>{confidence}%</span>
        <span className="text-[10px] text-slate-500">confidence</span>
      </div>
    </div>
  );
}

export function RiskMeter({ riskPercent, confidence, action, riskLevel }: RiskMeterProps) {
  const colors = ACTION_COLORS[action] ?? ACTION_COLORS.allow;

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Threat Metrics</h3>

      {/* Threat level bar */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Threat Level</span>
          <div className="flex items-center gap-2">
            <span className={cn('text-xs font-semibold capitalize', colors.text)}>{riskLevel}</span>
            <span className={cn('text-sm font-bold tabular-nums', colors.text)}>{riskPercent}%</span>
          </div>
        </div>
        <RiskBar percent={riskPercent} action={action} />
      </div>

      {/* Confidence ring */}
      <div className="flex items-center gap-4">
        <ConfidenceRing confidence={confidence} action={action} />
        <div className="flex flex-col gap-1">
          <p className="text-xs text-slate-500">Match Confidence</p>
          <p className="text-xs text-slate-300">
            {confidence >= 80
              ? 'High certainty match'
              : confidence >= 50
              ? 'Moderate match'
              : 'Low confidence — review manually'}
          </p>
        </div>
      </div>
    </div>
  );
}
