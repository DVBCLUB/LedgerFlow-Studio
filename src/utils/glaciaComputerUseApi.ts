/**
 * src/utils/glaciaComputerUseApi.ts
 * Frontend API client for Glacia Computer Use & Vision-Action Loop
 */

export interface VisionActionStep {
  stepNumber: number;
  action: 'click' | 'type' | 'key_press' | 'scroll' | 'wait' | 'complete';
  targetDescription: string;
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  success: boolean;
  explanation: string;
  screenshotBase64Snippet?: string;
  timestamp: string;
}

export interface VisionActionLoopResult {
  success: boolean;
  goal: string;
  stepsExecuted: VisionActionStep[];
  totalSteps: number;
  finalOutcome: string;
  durationMs: number;
  replayScript?: string;
  timestamp: string;
}

export interface ComputerActionResult {
  success: boolean;
  action: string;
  details?: string;
  error?: string;
  timestamp: string;
}

export async function executeVisionLoop(params: {
  goal: string;
  maxSteps?: number;
  dryRun?: boolean;
  autonomyLevel?: number;
}): Promise<VisionActionLoopResult> {
  const res = await fetch('/api/glacia/computer/vision-loop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success && !data.result) {
    throw new Error(data.error || 'Failed to execute vision-action loop');
  }
  return data.result;
}

export async function fetchComputerUseHistory(): Promise<ComputerActionResult[]> {
  const res = await fetch('/api/glacia/computer/history');
  const data = await res.json();
  return data.history || [];
}

export async function clearComputerUseHistory(): Promise<boolean> {
  const res = await fetch('/api/glacia/computer/history', { method: 'DELETE' });
  const data = await res.json();
  return data.success || false;
}
