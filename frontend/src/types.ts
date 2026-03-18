// ─────────────────────────────────────────────────────────────────────────────
// PromptShield shared TypeScript types
// ─────────────────────────────────────────────────────────────────────────────

export type Action = 'allow' | 'block' | 'flag' | 'monitor';
export type Severity = 'none' | 'low' | 'medium' | 'high' | 'critical';
export type PipelineStatus = 'idle' | 'active' | 'pass' | 'alert' | 'warning' | 'blocked';

export interface CategoryMeta {
  icon: string;
  label: string;
  severity: Severity;
  description: string;
  color: string;
}

export interface ActionMeta {
  icon: string;
  label: string;
  color: string;
  description: string;
}

export interface PipelineStage {
  status: PipelineStatus;
  label: string;
  detail: string;
}

export interface PipelineResult {
  user_input: PipelineStage;
  inspection: PipelineStage;
  detection: PipelineStage;
  policy: PipelineStage;
  ai_agent: PipelineStage;
}

export interface TopMatch {
  prompt: string;
  category: string;
  action: string;
  score: number;
}

export interface AnalyzeResponse {
  input_prompt: string;
  matched_prompt?: string;
  category: string;
  action: Action;
  risk_level: string;
  risk_percentage: number;
  confidence: number;
  category_meta: CategoryMeta;
  action_meta: ActionMeta;
  pipeline: PipelineResult;
  top_matches: TopMatch[];
  scan_id: string;
  latency_ms?: number;
}

export interface AnalyzeRequest {
  prompt: string;
}

export interface SecurityLogEntry {
  time: string;
  scan_id: string;
  prompt: string;
  category: string;
  category_label: string;
  action: Action;
  risk: number;
  confidence: number;
  is_malicious: boolean;
}
