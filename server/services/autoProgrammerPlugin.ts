/**
 * autoProgrammerPlugin.ts
 * ============================================================
 * AUTO-PROGRAMMER PLUGIN - Autonomous Code Generation Engine
 * Generates complete playable games, software blueprints, and
 * video production scripts using the Multi-Model AI Router.
 * ============================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { routeToBestModel } from './aiMultiModelRouter.ts';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv } from './runtimePaths.ts';

// --- Types ---

export type ProjectType = 'game' | 'software' | 'video';

export interface AutoProgramRequest {
  projectType: ProjectType;
  title?: string;
  description?: string;
  genre?: string;
  appType?: string;
  targetAudience?: string;
  aspectRatio?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AutoProgramResult {
  id: string;
  projectType: ProjectType;
  title: string;
  status: 'generating' | 'completed' | 'failed';
  content: string;
  modelUsed: string;
  capabilityUsed: string;
  latencyMs: number;
  estimatedCostUsd: number;
  metadata: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface AutoProgramSession {
  id: string;
  name: string;
  projectType: ProjectType;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  results: AutoProgramResult[];
  currentResult?: AutoProgramResult;
  createdAt: string;
  updatedAt: string;
}

// --- Prompts ---

const GAME_GENERATION_PROMPT = `You are GLACIA GAME ENGINE, an autonomous game programming AI.
Generate a complete, playable HTML5 game. The game MUST be a single self-contained HTML file.
Include: Canvas-based rendering with 60 FPS game loop, Player controls (keyboard + touch),
Score/health system, Particle effects, WebAudio API sound effects (no external assets),
Responsive design. Return ONLY the complete HTML code wrapped in \`\`\`html blocks.`;

const SOFTWARE_GENERATION_PROMPT = `You are GLACIA SOFTWARE ARCHITECT, an autonomous fullstack programming AI.
Generate a complete software application blueprint.
Include: Architecture overview, Tech stack recommendations, Complete React/TypeScript code,
REST API endpoints, Database schema, State management approach. Return structured blueprint.`;

const VIDEO_SCRIPT_PROMPT = `You are GLACIA VIDEO STUDIO, an autonomous video production AI.
Generate a complete viral video production script.
Include: 5-stage storyboard (Hook, Problem, Solution, Social Proof, CTA),
Voiceover script for each scene, Visual descriptions, AI video generation prompts,
Sound effect cues, Transition effects, SEO viral tags. Return structured JSON storyboard.`;

// --- Storage ---

interface StoreData {
  sessions: Record<string, AutoProgramSession>;
}

let store: StoreData = { sessions: {} };
let writeQueue = Promise.resolve();

function storagePath(): string {
  return resolveRuntimePathFromEnv('AUTO_PROGRAMMER_STORE_FILE', 'auto_programmer_sessions.json');
}

async function loadStore(): Promise<void> {
  try {
    const filePath = storagePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      store = { sessions: parsed.sessions || {} };
    }
  } catch {
    store = { sessions: {} };
  }
}

async function saveStore(): Promise<void> {
  ensureRuntimeRootSync();
  const target = storagePath();
  writeQueue = writeQueue.then(() =>
    fs.promises.writeFile(target, JSON.stringify(store, null, 2), 'utf8')
  );
  await writeQueue;
}

// --- Project Prompts Map ---

const PROJECT_PROMPTS: Record<ProjectType, { systemPrompt: string; taskType: string; capability: string }> = {
  game: {
    systemPrompt: GAME_GENERATION_PROMPT,
    taskType: 'game_dev',
    capability: 'game_dev',
  },
  software: {
    systemPrompt: SOFTWARE_GENERATION_PROMPT,
    taskType: 'coding',
    capability: 'code_generation',
  },
  video: {
    systemPrompt: VIDEO_SCRIPT_PROMPT,
    taskType: 'video_script',
    capability: 'video_script',
  },
};

// --- Main Generation Function ---

export async function generateProject(request: AutoProgramRequest): Promise<AutoProgramResult> {
  const startTime = Date.now();
  const id = `proj-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const projectPrompt = PROJECT_PROMPTS[request.projectType];

  const userMessage = buildUserPrompt(request);

  const result: AutoProgramResult = {
    id,
    projectType: request.projectType,
    title: request.title || `${request.projectType}-${Date.now().toString(36)}`,
    status: 'generating',
    content: '',
    modelUsed: '',
    capabilityUsed: projectPrompt.capability,
    latencyMs: 0,
    estimatedCostUsd: 0,
    metadata: { ...request } as any,
    createdAt: new Date().toISOString(),
  };

  await saveSession(result);

  try {
    const response = await routeToBestModel({
      messages: [
        { role: 'system', content: projectPrompt.systemPrompt },
        { role: 'user', content: userMessage },
      ],
      taskType: projectPrompt.taskType,
      options: {
        temperature: request.temperature,
        maxTokens: request.maxTokens || 8192,
      },
    });

    result.status = 'completed';
    result.content = response.content;
    result.modelUsed = response.modelUsed;
    result.capabilityUsed = response.capabilityUsed;
    result.latencyMs = response.latencyMs;
    result.estimatedCostUsd = response.estimatedCostUsd;
    result.completedAt = new Date().toISOString();

    await saveProjectOutput(id, result);
    await saveSession(result);

    return result;
  } catch (error: any) {
    result.status = 'failed';
    result.content = `Error: ${error.message || 'Unknown error'}`;
    result.completedAt = new Date().toISOString();
    await saveSession(result);
    return result;
  }
}

function buildUserPrompt(request: AutoProgramRequest): string {
  const lines: string[] = [];

  if (request.title) lines.push(`Title: ${request.title}`);
  if (request.description) lines.push(`Description: ${request.description}`);

  switch (request.projectType) {
    case 'game':
      lines.push(`Genre: ${request.genre || 'space_shooter'}`);
      lines.push('Requirements: Complete playable HTML5 game with canvas rendering,');
      lines.push('60 FPS game loop, keyboard/touch controls, score system, particle effects,');
      lines.push('WebAudio SFX. Must be a single self-contained HTML file.');
      break;
    case 'software':
      lines.push(`App Type: ${request.appType || 'saas_dashboard'}`);
      lines.push('Requirements: Fullstack blueprint with React/TypeScript frontend,');
      lines.push('Express backend, REST API, and database schema.');
      break;
    case 'video':
      lines.push(`Target Audience: ${request.targetAudience || 'general_public'}`);
      lines.push(`Aspect Ratio: ${request.aspectRatio || '16:9'}`);
      lines.push('Requirements: 5-stage viral storyboard with full script, visual descriptions,');
      lines.push('AI video prompts, sound cues, transitions, and SEO tags.');
      break;
  }

  return lines.join('\n');
}

async function saveSession(result: AutoProgramResult): Promise<void> {
  await loadStore();
  let session = store.sessions[result.id];
  if (!session) {
    session = {
      id: result.id,
      name: result.title,
      projectType: result.projectType,
      status: result.status === 'completed' ? 'completed' : result.status === 'failed' ? 'failed' : 'generating',
      results: [],
      createdAt: result.createdAt,
      updatedAt: new Date().toISOString(),
    };
    store.sessions[result.id] = session;
  }
  session.status = result.status === 'completed' ? 'completed' : result.status === 'failed' ? 'failed' : 'generating';
  session.currentResult = result;
  session.results.push(result);
  session.updatedAt = new Date().toISOString();
  await saveStore();
}

async function saveProjectOutput(id: string, result: AutoProgramResult): Promise<void> {
  ensureRuntimeRootSync();
  const outputDir = resolveRuntimePathFromEnv('AUTO_PROGRAMMER_OUTPUT_DIR', 'auto_programmer_outputs');
  const storeDir = path.dirname(storagePath());
  const fullDir = path.resolve(storeDir, '..', outputDir);
  fs.mkdirSync(fullDir, { recursive: true });
  const filePath = path.join(fullDir, `${id}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(result, null, 2), 'utf8');
}

// --- Public API Functions ---

export async function getProjectResult(id: string): Promise<AutoProgramResult | null> {
  await loadStore();
  const session = store.sessions[id];
  return session?.currentResult || null;
}

export async function listSessions(projectType?: ProjectType): Promise<AutoProgramSession[]> {
  await loadStore();
  const sessions = Object.values(store.sessions);
  if (projectType) {
    return sessions.filter(s => s.projectType === projectType);
  }
  return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function deleteSession(id: string): Promise<boolean> {
  await loadStore();
  if (store.sessions[id]) {
    delete store.sessions[id];
    await saveStore();
    return true;
  }
  return false;
}

export function getProjectStats(): { totalSessions: number; byType: Record<string, number> } {
  const sessions = Object.values(store.sessions);
  const byType: Record<string, number> = {};
  for (const s of sessions) {
    byType[s.projectType] = (byType[s.projectType] || 0) + 1;
  }
  return {
    totalSessions: sessions.length,
    byType,
  };
}
