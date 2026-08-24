/**
 * multiFactoryOrchestrationEngine.ts
 * ============================================================
 * Multi-Factory Orchestration Engine for LedgerFlow OS.
 *
 * Coordinates 4 specialized parallel Digital Factories:
 *  1. Software SWE Factory (Typescript/React/Vite/Express)
 *  2. Media & Video Production Factory (TikTok/Shorts/AI Voice/Veo)
 *  3. Game & ML Lab Factory (Phaser/ThreeJS/PyTorch)
 *  4. Marketing Content Factory (SEO Copy/Landing Pages/Lead Magnets)
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

export type FactoryPipelineType = 'software_swe' | 'video_production' | 'game_ml' | 'marketing_content';
export type PipelineStatus = 'IDLE' | 'RUNNING' | 'WAITING_HITL' | 'COMPLETED' | 'FAILED';

export interface FactoryPipelineJob {
  id: string;
  factory: FactoryPipelineType;
  title: string;
  assignedAgents: string[];
  status: PipelineStatus;
  progressPercent: number;
  qualityScore?: number; // 0 to 100
  startedAt: string;
  completedAt?: string;
  outputArtifactUri?: string;
}

const LIVE_PIPELINES: FactoryPipelineJob[] = [
  {
    id: 'pipe_swe_01',
    factory: 'software_swe',
    title: 'SWE Agent Loop: Auto-test & Build Packaging',
    assignedAgents: ['AI Dev', 'AI DevOps', 'AI QA'],
    status: 'RUNNING',
    progressPercent: 85,
    qualityScore: 96,
    startedAt: new Date(Date.now() - 120000).toISOString(),
    outputArtifactUri: 'dist/LedgerFlow-Studio-Setup.exe',
  },
  {
    id: 'pipe_video_01',
    factory: 'video_production',
    title: 'TikTok Viral Short: Hướng Dẫn Kế Toán Thông Tư 200',
    assignedAgents: ['AI Video', 'AI Marketer'],
    status: 'COMPLETED',
    progressPercent: 100,
    qualityScore: 92,
    startedAt: new Date(Date.now() - 900000).toISOString(),
    completedAt: new Date(Date.now() - 300000).toISOString(),
    outputArtifactUri: 'artifacts/media/short_tt200_final.mp4',
  },
  {
    id: 'pipe_content_01',
    factory: 'marketing_content',
    title: 'Landing Page Copy & SEO Playbook 2026',
    assignedAgents: ['AI Marketer', 'AI Research'],
    status: 'COMPLETED',
    progressPercent: 100,
    qualityScore: 94,
    startedAt: new Date(Date.now() - 1800000).toISOString(),
    completedAt: new Date(Date.now() - 600000).toISOString(),
    outputArtifactUri: 'artifacts/marketing/landing_page_copy.md',
  },
  {
    id: 'pipe_game_01',
    factory: 'game_ml',
    title: 'Playtest Simulator: Cyber Platformer Level 1-5',
    assignedAgents: ['AI Game Dev', 'AI Analyst'],
    status: 'IDLE',
    progressPercent: 0,
    startedAt: new Date().toISOString(),
  },
];

/**
 * Lists all active factory pipelines and their statuses.
 */
export function listFactoryPipelines(): FactoryPipelineJob[] {
  return [...LIVE_PIPELINES];
}

/**
 * Triggers a new parallel pipeline job.
 */
export async function triggerFactoryPipeline(factory: FactoryPipelineType, title: string, agents: string[]): Promise<FactoryPipelineJob> {
  const job: FactoryPipelineJob = {
    id: `pipe_${factory.slice(0, 3)}_${randomUUID().slice(0, 6)}`,
    factory,
    title,
    assignedAgents: agents,
    status: 'RUNNING',
    progressPercent: 10,
    startedAt: new Date().toISOString(),
  };

  LIVE_PIPELINES.unshift(job);

  await publishSystemEvent(
    'swarm.task_completed',
    'multi-factory-orchestration-engine',
    `Khởi chạy dây chuyền ${factory}: ${title}`,
    { jobId: job.id, factory }
  ).catch(() => undefined);

  return job;
}
