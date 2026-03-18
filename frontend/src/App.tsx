import { usePromptAnalysis } from '@/hooks/usePromptAnalysis';
import { PromptInput } from '@/components/PromptInput';
import { RiskMeter } from '@/components/RiskMeter';
import { PipelineVisualizer } from '@/components/PipelineVisualizer';
import { ResultPanel } from '@/components/ResultPanel';

import { Shield, Zap, CircleDot, Activity, Info, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';

export default function App() {
  const { result, isScanning, error, scan, clearResult, sessionStats } = usePromptAnalysis();
  const [modelReady, setModelReady] = useState(false);

  // Poll for backend readiness
  useEffect(() => {
    let stopped = false;
    async function check() {
      try {
        const h = await checkHealth();
        if (h.status === 'ready') {
          setModelReady(true);
          stopped = true;
        }
      } catch {
        // backend not up yet
      }
    }
    check();
    const interval = setInterval(() => {
      if (!stopped) check(); else clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative flex flex-col text-slate-100">
      {/* Dynamic Background Noise/Glow based on state */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        {result?.action === 'block' && (
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 
                          bg-red-600/10 rounded-full blur-[120px] transition-all duration-1000" />
        )}
        {result?.action === 'allow' && (
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 
                          bg-emerald-600/10 rounded-full blur-[120px] transition-all duration-1000" />
        )}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 
                            flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="w-4 h-4 text-white" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#0a0f1c] rounded-full flex items-center justify-center">
                <div className={cn('w-1.5 h-1.5 rounded-full', modelReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400 animate-pulse')} />
              </div>
            </div>
            <div>
              <h1 className="text-[15px] font-bold tracking-tight">Prompt<span className="text-indigo-400">Shield</span> <span className="text-xs font-mono text-slate-500 border border-slate-700/50 rounded px-1 ml-1 bg-white/5">v3.0</span></h1>
            </div>
          </div>

          {/* Stats / Tools */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-400" /> <span className="tabular-nums text-slate-200">{sessionStats.total}</span> Scans</span>
              <span className="flex items-center gap-1.5"><CircleDot className="w-3.5 h-3.5 text-red-400" /> <span className="tabular-nums text-slate-200">{sessionStats.blocked}</span> Blocked</span>
              <span className="flex items-center gap-1.5"><CircleDot className="w-3.5 h-3.5 text-amber-400" /> <span className="tabular-nums text-slate-200">{sessionStats.flagged}</span> Flagged</span>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-300">
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      {!result && !isScanning && !error && (
        <section className="pt-20 pb-12 px-6 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-6">
            <Zap className="w-3.5 h-3.5" /> Fast AI-powered inference
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Detect & Neutralize <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400">Prompt Injection</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-lg">
            Universal Sentence Encoder embeddings • Sub-200ms vector search • 13 Threat Categories • Realtime Policy Enforcement
          </p>
        </section>
      )}

      {/* Main Grid */}
      <main className={cn(
        "flex-1 w-full max-w-[1400px] mx-auto px-6 grid gap-6",
        "grid-cols-1 lg:grid-cols-12",
        (!result && !isScanning && !error) ? "pt-4" : "pt-8"
      )}>
        
        {/* Left Column Component Stack */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <PromptInput onScan={scan} isScanning={isScanning} onClear={clearResult} />
          
          {/* We only show the risk meter if we have a result */}
          {result && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
              <RiskMeter 
                riskPercent={result.risk_percentage} 
                confidence={result.confidence} 
                action={result.action}
                riskLevel={result.risk_level}
              />
            </div>
          )}

          {/* If no result, show an info box */}
          {(!result && !isScanning) && (
            <div className="glass-card rounded-2xl p-5 border-dashed border-white/10 flex items-start gap-4 text-slate-400">
              <Info className="w-5 h-5 flex-shrink-0 text-indigo-400" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-slate-300 mb-1">How it works</p>
                PromptShield converts text into high-dimensional vectors (512d) using Google's Universal Sentence Encoder. 
                Incoming prompts are compared against an in-memory database of thousands of known injection patterns using highly optimized cosine similarity, classifying threats with extreme speed.
              </div>
            </div>
          )}
        </div>

        {/* Right Column Component Stack */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <PipelineVisualizer pipeline={result?.pipeline ?? null} isScanning={isScanning} />
          
          <div className={cn(
             "transition-all duration-700 delay-100",
             (result || isScanning || error) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
             {(result || isScanning || error) && (
                <ResultPanel result={result} isScanning={isScanning} error={error} />
             )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-white/5 text-center px-6">
        <p className="text-xs text-slate-600">PromptShield v3.0 Framework-Driven Migration &copy; 2026</p>
      </footer>
    </div>
  );
}
