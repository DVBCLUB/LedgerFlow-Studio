import type { GlaciaRsiCycle } from '../../server/services/glaciaRecursiveImprovementEngine';
export type { GlaciaRsiCycle };
export type RsiScore = { caseId: string; score: number };
export type RsiSnapshot = { paused: boolean; busy: boolean; cycles: GlaciaRsiCycle[];
  limits: { maxDepth: number; dailyCycles: number; maxCycles: number; minGain: number } };

async function request<T>(suffix: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/glacia/rsi${suffix}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.success !== true) throw new Error(data?.error || `RSI HTTP ${response.status}`);
  return data;
}
export const fetchGlaciaRsi = () => request<RsiSnapshot>('/cycles');
export const createGlaciaRsi = (input: { observation: string; sourceContext?: string; preferLocal: boolean;
  parentId?: string; baseline: RsiScore[]; baselineRevision: string }) => request<{ cycle: GlaciaRsiCycle }>('/cycles', input);
export const reviewGlaciaRsi = (id: string, input: { decision: 'approved' | 'rejected'; fingerprint: string; note: string }) =>
  request<{ cycle: GlaciaRsiCycle }>(`/cycles/${encodeURIComponent(id)}/review`, input);
export const evaluateGlaciaRsi = (id: string, input: { fingerprint: string; candidate: RsiScore[];
  candidateRevision: string; evidenceRef: string; lesson: string }) => request<{ cycle: GlaciaRsiCycle }>(`/cycles/${encodeURIComponent(id)}/evaluate`, input);
export const pauseGlaciaRsi = (paused: boolean) => request<RsiSnapshot>('/pause', { paused });
