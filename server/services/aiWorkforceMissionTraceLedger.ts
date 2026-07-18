import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export interface MissionTraceStep {
  stepId: string;
  type: 'plan' | 'tool_call' | 'approval' | 'artifact' | 'rollback';
  description: string;
  timestamp: string;
  payload?: any;
  latencyMs?: number;
}

export interface MissionTrace {
  traceId: string;
  runId: string;
  input: string;
  contextUsed: string[];
  steps: MissionTraceStep[];
  costUsd: number;
  totalLatencyMs: number;
  output: string;
  status: 'success' | 'failed' | 'rolled_back';
  startedAt: string;
  completedAt?: string;
}

const TRACE_DIR = path.join(process.cwd(), 'runtime', 'mission_traces');

function ensureDir() {
  if (!fs.existsSync(TRACE_DIR)) {
    fs.mkdirSync(TRACE_DIR, { recursive: true });
  }
}

export function recordMissionTrace(trace: Omit<MissionTrace, 'traceId'>): MissionTrace {
  ensureDir();
  const traceId = `trace_${randomUUID()}`;
  const fullTrace: MissionTrace = { ...trace, traceId };
  
  fs.writeFileSync(
    path.join(TRACE_DIR, `${traceId}.json`),
    JSON.stringify(fullTrace, null, 2),
    'utf-8'
  );
  
  return fullTrace;
}

export function getMissionTrace(traceId: string): MissionTrace | null {
  ensureDir();
  const filePath = path.join(TRACE_DIR, `${traceId}.json`);
  if (!fs.existsSync(filePath)) return null;
  
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as MissionTrace;
  } catch {
    return null;
  }
}

export function listMissionTraces(limit = 50): MissionTrace[] {
  ensureDir();
  const files = fs.readdirSync(TRACE_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const fullPath = path.join(TRACE_DIR, f);
      const stat = fs.statSync(fullPath);
      return { file: fullPath, mtime: stat.mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit);

  const traces: MissionTrace[] = [];
  for (const { file } of files) {
    try {
      const data = fs.readFileSync(file, 'utf-8');
      traces.push(JSON.parse(data) as MissionTrace);
    } catch {
      // ignore parse errors
    }
  }
  return traces;
}

export function appendMissionTraceStep(traceId: string, step: Omit<MissionTraceStep, 'stepId'>): MissionTrace | null {
  const trace = getMissionTrace(traceId);
  if (!trace) return null;
  
  const newStep: MissionTraceStep = { ...step, stepId: `step_${randomUUID()}` };
  trace.steps.push(newStep);
  
  fs.writeFileSync(
    path.join(TRACE_DIR, `${traceId}.json`),
    JSON.stringify(trace, null, 2),
    'utf-8'
  );
  return trace;
}
