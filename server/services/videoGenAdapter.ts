/**
 * videoGenAdapter.ts
 * ============================================================
 * Real video-generation adapter (submit + poll) for the Asset Foundry.
 *
 *   - Runway Gen-3 (text-to-video)  — api.dev.runwayml.com
 *   - Kling AI (text2video)          — api.klingai.com
 *   - Luma Dream Machine             — api.lumalabs.ai
 *
 * Jobs are persisted to runtime/asset_foundry_jobs.json so polling survives
 * server restarts. On completion the MP4 URL is registered in the Asset
 * Registry and an `asset.render_completed` event is published.
 */

import fs from 'node:fs';
import path from 'node:path';
import { findMediaKey, postJson, getJson } from './mediaProviderClient.ts';
import { registerAsset } from './assetRegistry.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export type VideoProvider = 'runway' | 'kling' | 'luma';

export interface SubmitVideoInput {
  prompt: string;
  provider?: VideoProvider;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  durationSec?: number;
  imageCid?: string;
}

export interface VideoJob {
  jobId: string;
  provider: VideoProvider;
  providerTaskId: string;
  status: 'submitted' | 'processing' | 'completed' | 'failed';
  prompt: string;
  videoUrl?: string;
  assetCid?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

const JOBS_FILE = () => resolveRuntimeDirPath('asset_foundry_jobs.json');

function loadJobs(): VideoJob[] {
  try {
    if (!fs.existsSync(JOBS_FILE())) return [];
    const parsed = JSON.parse(fs.readFileSync(JOBS_FILE(), 'utf8'));
    return Array.isArray(parsed?.jobs) ? parsed.jobs : [];
  } catch {
    return [];
  }
}

function saveJobs(jobs: VideoJob[]): void {
  try {
    fs.mkdirSync(path.dirname(JOBS_FILE()), { recursive: true });
    fs.writeFileSync(JOBS_FILE(), JSON.stringify({ jobs, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {
    // Best-effort persistence.
  }
}

async function submitRunway(input: SubmitVideoInput, apiKey: string): Promise<string> {
  const res = await postJson('https://api.dev.runwayml.com/v1/text_to_video', {
    promptText: input.prompt,
    model: 'gen3a_turbo',
    ratio: ratioToRunway(input.aspectRatio),
    duration: input.durationSec || 5,
  }, { apiKey, authHeaders: { 'x-api-key': apiKey, 'X-Runway-Version': '2024-11-06' } });
  const id = res?.id;
  if (!id) throw new Error('Runway submit missing id');
  return id;
}

async function pollRunway(taskId: string, apiKey: string): Promise<{ status: VideoJob['status']; videoUrl?: string; error?: string }> {
  const res = await getJson(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, { apiKey, authHeaders: { 'x-api-key': apiKey, 'X-Runway-Version': '2024-11-06' } });
  const st = res?.status;
  if (st === 'SUCCEEDED') return { status: 'completed', videoUrl: Array.isArray(res.output) ? res.output[0] : res?.output };
  if (st === 'FAILED') return { status: 'failed', error: res?.failure || 'Runway task failed' };
  return { status: 'processing' };
}

async function submitKling(input: SubmitVideoInput, apiKey: string): Promise<string> {
  const res = await postJson('https://api.klingai.com/v1/videos/text2video', {
    model_name: 'kling-v1-5',
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio || '9:16',
    duration: input.durationSec ? String(input.durationSec) : '5',
  }, { apiKey });
  const id = res?.data?.task_id;
  if (!id) throw new Error('Kling submit missing task_id');
  return id;
}

async function pollKling(taskId: string, apiKey: string): Promise<{ status: VideoJob['status']; videoUrl?: string; error?: string }> {
  const res = await getJson(`https://api.klingai.com/v1/videos/text2video/${taskId}`, { apiKey });
  const st = res?.data?.task_status;
  if (st === 'succeed') return { status: 'completed', videoUrl: res?.data?.task_result?.videos?.[0]?.url };
  if (st === 'failed') return { status: 'failed', error: res?.data?.task_status_msg || 'Kling task failed' };
  return { status: 'processing' };
}

async function submitLuma(input: SubmitVideoInput, apiKey: string): Promise<string> {
  const res = await postJson('https://api.lumalabs.ai/dream-machine/v1/generations', {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio || '9:16',
    duration: input.durationSec || 5,
  }, { apiKey });
  const id = res?.id;
  if (!id) throw new Error('Luma submit missing id');
  return id;
}

async function pollLuma(taskId: string, apiKey: string): Promise<{ status: VideoJob['status']; videoUrl?: string; error?: string }> {
  const res = await getJson(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, { apiKey });
  const st = res?.state;
  if (st === 'completed') return { status: 'completed', videoUrl: res?.assets?.video };
  if (st === 'failed') return { status: 'failed', error: res?.failure_reason || 'Luma task failed' };
  return { status: 'processing' };
}

function ratioToRunway(ratio?: '16:9' | '9:16' | '1:1'): string {
  if (ratio === '9:16') return '720:1280';
  if (ratio === '1:1') return '768:768';
  return '1280:720';
}

export async function submitVideoJob(input: SubmitVideoInput): Promise<{ ok: boolean; status: 'submitted' | 'no_provider' | 'failed'; job?: VideoJob; error?: string }> {
  if (!input.prompt?.trim()) return { ok: false, status: 'failed', error: 'prompt is required' };
  const provider: VideoProvider = input.provider || 'runway';
  const key = await findMediaKey(provider);
  if (!key) {
    return { ok: false, status: 'no_provider', error: `Chưa cấu hình API key cho "${provider}" trong AI Key Vault.` };
  }

  try {
    let taskId: string;
    if (provider === 'kling') taskId = await submitKling(input, key.apiKey);
    else if (provider === 'luma') taskId = await submitLuma(input, key.apiKey);
    else taskId = await submitRunway(input, key.apiKey);

    const job: VideoJob = {
      jobId: `vjob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider,
      providerTaskId: taskId,
      status: 'submitted',
      prompt: input.prompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const jobs = loadJobs();
    jobs.unshift(job);
    saveJobs(jobs);

    void publishSystemEvent('asset.render_started', 'videoGenAdapter', `Video job submitted: ${provider}`, { jobId: job.jobId, provider });

    return { ok: true, status: 'submitted', job };
  } catch (err: any) {
    return { ok: false, status: 'failed', error: err.message };
  }
}

export async function pollVideoJob(input: { jobId: string }): Promise<{ ok: boolean; status: VideoJob['status'] | 'not_found' | 'failed'; job?: VideoJob; error?: string }> {
  const jobs = loadJobs();
  const job = jobs.find((j) => j.jobId === input.jobId);
  if (!job) return { ok: false, status: 'not_found', error: 'job not found' };

  const key = await findMediaKey(job.provider);
  if (!key) return { ok: false, status: 'failed', job, error: `API key cho "${job.provider}" không còn khả dụng.` };

  try {
    let result: { status: VideoJob['status']; videoUrl?: string; error?: string };
    if (job.provider === 'kling') result = await pollKling(job.providerTaskId, key.apiKey);
    else if (job.provider === 'luma') result = await pollLuma(job.providerTaskId, key.apiKey);
    else result = await pollRunway(job.providerTaskId, key.apiKey);

    job.status = result.status;
    job.updatedAt = new Date().toISOString();
    if (result.videoUrl) job.videoUrl = result.videoUrl;
    if (result.error) job.error = result.error;

    if (job.status === 'completed' && job.videoUrl && !job.assetCid) {
      const rec = registerAsset({
        kind: 'video',
        name: `video_${job.jobId}.mp4`,
        mimeType: 'video/mp4',
        remoteUrl: job.videoUrl,
        provenance: { source: 'videoGenAdapter', provider: job.provider, prompt: job.prompt },
      });
      job.assetCid = rec.cid;
      void publishSystemEvent('asset.render_completed', 'videoGenAdapter', `Video render completed: ${job.provider}`, { jobId: job.jobId, cid: rec.cid });
    } else if (job.status === 'failed') {
      void publishSystemEvent('asset.render_failed', 'videoGenAdapter', `Video render failed: ${job.provider}`, { jobId: job.jobId, error: job.error });
    }

    saveJobs(jobs);
    return { ok: true, status: job.status, job };
  } catch (err: any) {
    return { ok: false, status: 'failed', job, error: err.message };
  }
}

export function listVideoJobs(limit = 20): VideoJob[] {
  return loadJobs().slice(0, limit);
}

/**
 * Real-time provider webhook callback receiver. Matches by provider + task id,
 * updates the durable job, registers the completed video and emits events.
 * Lets cloud providers (Runway/Kling/Luma) push completion instead of polling.
 */
export async function onVideoWebhook(input: {
  provider: VideoProvider;
  providerTaskId: string;
  videoUrl?: string;
  status?: 'completed' | 'failed';
  error?: string;
}): Promise<{ ok: boolean; job?: VideoJob; error?: string }> {
  const jobs = loadJobs();
  const job = jobs.find((j) => j.provider === input.provider && j.providerTaskId === input.providerTaskId);
  if (!job) return { ok: false, error: 'job not found for providerTaskId' };

  job.status = input.status === 'failed' ? 'failed' : 'completed';
  job.updatedAt = new Date().toISOString();
  if (input.videoUrl) job.videoUrl = input.videoUrl;
  if (input.error) job.error = input.error;

  if (job.status === 'completed' && job.videoUrl && !job.assetCid) {
    const rec = registerAsset({
      kind: 'video',
      name: `video_${job.jobId}.mp4`,
      mimeType: 'video/mp4',
      remoteUrl: job.videoUrl,
      provenance: { source: 'videoGenAdapter', provider: job.provider, prompt: job.prompt },
    });
    job.assetCid = rec.cid;
    void publishSystemEvent('asset.render_completed', 'videoGenAdapter', `Video webhook completed: ${job.provider}`, { jobId: job.jobId, cid: rec.cid });
  } else if (job.status === 'failed') {
    void publishSystemEvent('asset.render_failed', 'videoGenAdapter', `Video webhook failed: ${job.provider}`, { jobId: job.jobId, error: job.error });
  }

  saveJobs(jobs);
  return { ok: true, job };
}
