import { useState, useCallback, useRef } from 'react';
import { analyzePrompt } from '@/lib/api';
import type { AnalyzeResponse, SecurityLogEntry } from '@/types';

interface UsePromptAnalysisReturn {
  result: AnalyzeResponse | null;
  isScanning: boolean;
  error: string | null;
  logs: SecurityLogEntry[];
  sessionStats: { total: number; blocked: number; flagged: number };
  scan: (prompt: string) => Promise<void>;
  clearLogs: () => void;
  clearResult: () => void;
}

const MALICIOUS_CATEGORIES = new Set([
  'Override', 'Exfiltration', 'Tool Misuse',
  'prompt_injection', 'instruction_override', 'data_exfiltration',
  'social_engineering', 'obfuscation_attack', 'multi_step_attack',
  'indirect_injection', 'roleplay_jailbreak',
]);

export function usePromptAnalysis(): UsePromptAnalysisReturn {
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [sessionStats, setSessionStats] = useState({ total: 0, blocked: 0, flagged: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const scan = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return;

    // Cancel any in-flight request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const data = await analyzePrompt({ prompt });

      setResult(data);

      // Build log entry
      const now = new Date();
      const logEntry: SecurityLogEntry = {
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        scan_id: data.scan_id,
        prompt: data.input_prompt,
        category: data.category,
        category_label: data.category_meta?.label ?? data.category,
        action: data.action,
        risk: data.risk_percentage,
        confidence: data.confidence,
        is_malicious: MALICIOUS_CATEGORIES.has(data.category),
      };

      setLogs(prev => [logEntry, ...prev]);

      // Update session counts
      setSessionStats(prev => ({
        total: prev.total + 1,
        blocked: prev.blocked + (data.action === 'block' ? 1 : 0),
        flagged: prev.flagged + (data.action === 'flag' ? 1 : 0),
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error
        ? err.message
        : 'Failed to connect to PromptShield API. Make sure the backend is running.';
      setError(msg);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);
  const clearResult = useCallback(() => { setResult(null); setError(null); }, []);

  return { result, isScanning, error, logs, sessionStats, scan, clearLogs, clearResult };
}
