import { cn } from '@/lib/utils';
import type { AnalyzeResponse, Action } from '@/types';
import { CheckCircle2, ShieldX, Flag, Eye, AlertCircle, Loader2 } from 'lucide-react';

interface ResultPanelProps {
  result: AnalyzeResponse | null;
  isScanning: boolean;
  error: string | null;
}

const ACTION_CONFIG: Record<Action, {
  bg: string; border: string; iconEl: React.ReactNode; badgeBg: string; badgeText: string;
}> = {
  allow: {
    bg: 'from-emerald-900/20 to-transparent', border: 'border-emerald-500/25',
    iconEl: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
    badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
    badgeText: 'text-emerald-300',
  },
  block: {
    bg: 'from-red-900/20 to-transparent', border: 'border-red-500/25',
    iconEl: <ShieldX className="w-7 h-7 text-red-400" />,
    badgeBg: 'bg-red-500/15 border-red-500/30',
    badgeText: 'text-red-300',
  },
  flag: {
    bg: 'from-amber-900/20 to-transparent', border: 'border-amber-500/25',
    iconEl: <Flag className="w-7 h-7 text-amber-400" />,
    badgeBg: 'bg-amber-500/15 border-amber-500/30',
    badgeText: 'text-amber-300',
  },
  monitor: {
    bg: 'from-violet-900/20 to-transparent', border: 'border-violet-500/25',
    iconEl: <Eye className="w-7 h-7 text-violet-400" />,
    badgeBg: 'bg-violet-500/15 border-violet-500/30',
    badgeText: 'text-violet-300',
  },
};

const AGENT_RESPONSES: Record<Action, string[]> = {
  block: [
    "⛔ Request blocked by PromptShield. The submitted prompt was identified as a potential injection attack and has been blocked to protect system integrity.",
    "🛡️ Security alert: This request has been intercepted. The AI agent cannot process prompts flagged as malicious by the injection firewall.",
  ],
  flag: [
    "🚩 This request was flagged for review. The prompt contains suspicious patterns but may be legitimate. Forwarded with monitoring enabled.",
    "⚠️ Flagged: Contains characteristics of potential social engineering. Proceeding with caution — security team notified.",
  ],
  monitor: [
    "👁️ This request has been allowed but is being monitored. Uses security-adjacent terminology that warrants tracking.",
  ],
  allow: [
    "✅ Prompt cleared. Your request has been forwarded to the AI agent without any restrictions.",
    "Great question! Machine learning is fascinating — models learn patterns from data through iterative optimization. Happy to help!",
  ],
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function ResultPanel({ result, isScanning, error }: ResultPanelProps) {
  // Empty state
  if (!result && !isScanning && !error) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-slate-600" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-pulse bg-indigo-500/5" />
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-400">Enter a prompt and click <strong className="text-slate-300">Scan Prompt</strong></p>
          <p className="text-xs text-slate-600 mt-1">Press Ctrl+Enter to scan instantly</p>
        </div>
      </div>
    );
  }

  // Scanning state
  if (isScanning) {
    return (
      <div className="glass-card rounded-2xl p-8 flex flex-col items-center justify-center gap-5 min-h-[200px]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-indigo-500/30 animate-ping [animation-delay:150ms]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-indigo-300 font-medium">Analyzing prompt…</p>
          <p className="text-xs text-slate-500 mt-1">USE embedding + cosine similarity</p>
        </div>
        <div className="w-full max-w-xs h-1 bg-white/6 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-red-500/20 flex items-start gap-4">
        <ShieldX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-300">Connection Error</p>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
          <p className="text-xs text-slate-500 mt-2">Make sure the Python backend is running: <code className="font-mono">python main.py</code></p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const cfg = ACTION_CONFIG[result.action] ?? ACTION_CONFIG.allow;
  const agentResp = randomPick(AGENT_RESPONSES[result.action] ?? AGENT_RESPONSES.allow);

  return (
    <div className="flex flex-col gap-4">
      {/* Verdict banner */}
      <div className={cn(
        'glass-card rounded-2xl p-5 border bg-gradient-to-br',
        cfg.bg, cfg.border,
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">{cfg.iconEl}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-white truncate">{result.category_meta?.label ?? result.category}</h3>
              <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', cfg.badgeBg, cfg.badgeText)}>
                {result.action_meta?.label ?? result.action.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{result.action_meta?.description}</p>
            {result.latency_ms !== undefined && (
              <p className="text-[10px] text-slate-600 mt-2">⚡ {result.latency_ms} ms inference</p>
            )}
          </div>
        </div>
      </div>

      {/* AI Agent Response */}
      <div className="glass-card rounded-2xl p-5 flex flex-col gap-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Agent Response</h4>
        <p className="text-sm text-slate-300 leading-relaxed">{agentResp}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <span className="text-[10px] text-slate-600 font-mono">{result.scan_id}</span>
        </div>
      </div>

      {/* Top matches */}
      {result.top_matches && result.top_matches.length > 0 && (
        <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nearest Dataset Matches</h4>
          <div className="flex flex-col gap-2">
            {result.top_matches.map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/8">
                <span className="text-xs font-bold text-slate-600 w-4 flex-shrink-0">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{m.prompt}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/6 text-slate-400">{m.category}</span>
                    <span className="text-[10px] text-slate-500">{m.score}% match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
