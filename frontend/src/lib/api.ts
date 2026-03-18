import axios from 'axios';
import type { AnalyzeRequest, AnalyzeResponse } from '@/types';

// In dev, Vite proxy forwards /api → http://localhost:8000
// In production, set VITE_API_URL in .env
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000, // 30 s — model startup can be slow on first call
});

/**
 * POST /api/analyze
 * Sends a prompt to the FastAPI backend and returns the full classification result.
 */
export async function analyzePrompt(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const { data } = await client.post<AnalyzeResponse>('/api/analyze', req);
  return data;
}

/**
 * GET /api/categories
 * Returns all category metadata for the reference panel.
 */
export async function fetchCategories(): Promise<Record<string, import('@/types').CategoryMeta>> {
  const { data } = await client.get('/api/categories');
  return data;
}

/**
 * GET /api/stats
 * Returns session + dataset statistics.
 */
export async function fetchStats(): Promise<Record<string, unknown>> {
  const { data } = await client.get('/api/stats');
  return data;
}

/**
 * GET /api/health
 * Checks if the backend and model are ready.
 */
export async function checkHealth(): Promise<{ status: string; embeddings: number }> {
  const { data } = await client.get('/api/health');
  return data;
}
