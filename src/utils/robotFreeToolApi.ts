/**
 * robotFreeToolApi.ts
 * ============================================================
 * API client for Free Tool Robot Bridge ($0 Operator).
 * Blender, FFmpeg, Canva/Photopea graphic design automation.
 */

const API_BASE = 'http://127.0.0.1:3000';

// ─── Types ────────────────────────────────────────────────────

export interface RobotExecutionPlan {
  id: string;
  toolType: 'blender' | 'ffmpeg' | 'canva' | 'photopea' | 'shell';
  scriptContent: string;
  scriptFile: string;
  outputPath: string;
  estimatedDurationSec: number;
}

export interface BlenderSpec {
  characterName: string;
  archetype?: 'humanoid' | 'chibi_mascot' | 'cyber_robot' | 'stylized_avatar';
  height?: number;
  headScale?: number;
  primaryColor?: string;
  secondaryColor?: string;
  metallic?: number;
  roughness?: number;
  exportFormat?: 'gltf' | 'glb' | 'obj' | 'fbx';
  outputFilename?: string;
  includeRig?: boolean;
}

export interface FfmpegSpec {
  outputName: string;
  totalDurationSec?: number;
  scenesCount?: number;
  hasVoiceNarration?: boolean;
}

export interface GraphicSpec {
  title: string;
  bgColor?: string;
  textColor?: string;
}

export interface RobotExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

// ─── API Functions ─────────────────────────────────────────────

async function apiPost<T>(path: string, body: any): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json?.success ? json.plan ?? json.script ?? json.result : null;
  } catch {
    return null;
  }
}

// ── Blender ──

export async function createBlenderPlan(spec: BlenderSpec): Promise<RobotExecutionPlan | null> {
  return apiPost<RobotExecutionPlan>('/api/robot/free/blender/plan', {
    characterName: spec.characterName,
    archetype: spec.archetype || 'humanoid',
    height: spec.height || 1.7,
    headScale: spec.headScale || 0.25,
    primaryColor: spec.primaryColor || '#2196F3',
    secondaryColor: spec.secondaryColor || '#FF5722',
    metallic: spec.metallic ?? 0.1,
    roughness: spec.roughness ?? 0.6,
    exportFormat: spec.exportFormat || 'glb',
    outputFilename: spec.outputFilename || spec.characterName,
    includeRig: spec.includeRig !== false,
  });
}

export async function previewBlenderScript(spec: BlenderSpec): Promise<string | null> {
  return apiPost<string>('/api/robot/free/blender/preview', spec);
}

// ── FFmpeg ──

export async function createFfmpegPlan(spec: FfmpegSpec): Promise<RobotExecutionPlan | null> {
  return apiPost<RobotExecutionPlan>('/api/robot/free/ffmpeg/plan', spec);
}

export async function previewFfmpegScript(spec: FfmpegSpec): Promise<any | null> {
  return apiPost<any>('/api/robot/free/ffmpeg/preview', spec);
}

// ── Graphic Design (Canva/Photopea) ──

export async function createGraphicPlan(spec: GraphicSpec): Promise<RobotExecutionPlan | null> {
  return apiPost<RobotExecutionPlan>('/api/robot/free/graphic/plan', spec);
}

export async function previewGraphicPlan(spec: GraphicSpec): Promise<any | null> {
  return apiPost<any>('/api/robot/free/graphic/preview', spec);
}

// ── Execute ──

export async function executeRobotPlan(plan: RobotExecutionPlan): Promise<RobotExecutionResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/robot/free/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    return json?.result ?? null;
  } catch {
    return null;
  }
}

// ── Execution History ──

export interface ExecutionHistoryEntry {
  id: string;
  toolType: string;
  summary: string;
  success: boolean;
  output: string;
  error?: string;
  executedAt: string;
}

export interface SimulationResult {
  planId: string;
  toolType: string;
  outputPreview: string;
  estimatedFileSize: string;
  estimatedDurationSec: number;
  rollbackPlan: string;
  warnings: string[];
  status: 'simulated';
}

export async function fetchExecutionHistory(limit = 50): Promise<ExecutionHistoryEntry[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/robot/free/history?limit=${limit}`);
    const json = await res.json();
    return json?.success ? json.history : null;
  } catch {
    return null;
  }
}

export async function clearExecutionHistoryApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/robot/free/history`, { method: 'DELETE' });
    const json = await res.json();
    return json?.success === true;
  } catch {
    return false;
  }
}

// ── Simulation Sandbox ──

export async function simulateRobotPlan(plan: RobotExecutionPlan): Promise<SimulationResult | null> {
  try {
    const res = await fetch(`${API_BASE}/api/robot/free/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    return json?.success ? json.simulation : null;
  } catch {
    return null;
  }
}
