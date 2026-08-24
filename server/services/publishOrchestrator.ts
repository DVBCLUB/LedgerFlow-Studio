/**
 * publishOrchestrator.ts
 * ============================================================
 * Cross-factory publish orchestrator. Records publish intents to a durable
 * registry and dispatches to real channel adapters where credentials exist:
 *
 *   - github_release : real (GitHub REST API, GITHUB_TOKEN)
 *   - itch_io        : requires butler CLI (honest no-op when missing)
 *   - steam / tiktok / youtube : requires credentials (honest no-op)
 *
 * Emits `asset.publish_requested` / `asset.publish_completed` on the bus so
 * the monetization layer can react.
 */

import fs from 'node:fs';
import path from 'node:path';
import { getAsset, getAssetFilePath } from './assetRegistry.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';
import { publishItchIo, publishSteam, publishTikTok, publishYouTube, type PublishAdapterResult } from './publishChannelAdapters.ts';

export type PublishChannel = 'github_release' | 'itch_io' | 'steam' | 'tiktok' | 'youtube';

export interface PublishInput {
  assetCid: string;
  channel: PublishChannel;
  title: string;
  repo?: string; // owner/repo (github_release)
  tagName?: string;
  releaseNotes?: string;
  itchTarget?: string; // user/game:channel
  steamAppId?: string;
  tiktokCaption?: string;
  youtubeTitle?: string;
  youtubeDescription?: string;
  youtubePrivacy?: string;
}

export interface PublishRecord {
  id: string;
  channel: PublishChannel;
  assetCid: string;
  title: string;
  status: 'requested' | 'published' | 'failed';
  url?: string;
  error?: string;
  createdAt: string;
}

const REGISTRY_FILE = () => resolveRuntimeDirPath('publish_registry.json');

function loadPublishes(): PublishRecord[] {
  try {
    if (!fs.existsSync(REGISTRY_FILE())) return [];
    const parsed = JSON.parse(fs.readFileSync(REGISTRY_FILE(), 'utf8'));
    return Array.isArray(parsed?.publishes) ? parsed.publishes : [];
  } catch {
    return [];
  }
}

function savePublishes(records: PublishRecord[]): void {
  try {
    fs.mkdirSync(path.dirname(REGISTRY_FILE()), { recursive: true });
    fs.writeFileSync(REGISTRY_FILE(), JSON.stringify({ publishes: records, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {
    // best effort
  }
}

export function listPublishes(limit = 50): PublishRecord[] {
  return loadPublishes().slice(0, limit);
}

// ─── GitHub Releases adapter (real) ──────────────────────────────────────────

async function publishGitHubRelease(input: PublishInput, token: string): Promise<{ url?: string }> {
  const repo = input.repo || process.env.GITHUB_REPO || '';
  if (!repo || !repo.includes('/')) throw new Error('repo (owner/repo) is required for github_release');
  const filePath = getAssetFilePath(input.assetCid);
  if (!filePath) throw new Error('Asset binary not available locally for upload');

  const authHeaders = { authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' };
  const tag = input.tagName || `release-${Date.now()}`;
  const name = input.title || tag;

  // 1) Create release.
  const createRes = await fetch(`https://api.github.com/repos/${repo}/releases`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...authHeaders },
    body: JSON.stringify({ tag_name: tag, name, body: input.releaseNotes || 'Published by LedgerFlow Asset Foundry.' }),
    signal: AbortSignal.timeout(60_000),
  });
  const createJson = await createRes.json().catch(() => ({}));
  if (!createRes.ok) throw new Error(`GitHub release create failed: ${createJson?.message || `HTTP ${createRes.status}`}`);
  const releaseId = createJson?.id;
  const uploadUrl = createJson?.upload_url?.split('{')[0];

  // 2) Upload asset binary.
  const fileName = path.basename(filePath);
  const bytes = fs.readFileSync(filePath);
  const uploadRes = await fetch(`${uploadUrl}?name=${encodeURIComponent(fileName)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/octet-stream', ...authHeaders },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(120_000),
  });
  const uploadJson = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) throw new Error(`GitHub asset upload failed: ${uploadJson?.message || `HTTP ${uploadRes.status}`}`);

  return { url: createJson?.html_url || uploadJson?.browser_download_url };
}

export async function publishAsset(input: PublishInput): Promise<{ ok: boolean; status: PublishRecord['status']; record?: PublishRecord; error?: string }> {
  if (!input.assetCid || !getAsset(input.assetCid)) return { ok: false, status: 'failed', error: 'asset not found' };

  const record: PublishRecord = {
    id: `pub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    channel: input.channel,
    assetCid: input.assetCid,
    title: input.title,
    status: 'requested',
    createdAt: new Date().toISOString(),
  };
  const records = loadPublishes();
  records.unshift(record);
  savePublishes(records);

  void publishSystemEvent('asset.publish_requested', 'publishOrchestrator', `Publish requested: ${input.channel}`, { publishId: record.id, assetCid: input.assetCid });

  try {
    let result: PublishAdapterResult;
    if (input.channel === 'github_release') {
      const token = process.env.GITHUB_TOKEN || '';
      if (!token) throw new Error('GITHUB_TOKEN chưa cấu hình. Đặt biến môi trường GITHUB_TOKEN.');
      const { url } = await publishGitHubRelease(input, token);
      result = { ok: true, status: 'completed', url };
    } else if (input.channel === 'itch_io') {
      result = await publishItchIo({ assetCid: input.assetCid, target: input.itchTarget });
    } else if (input.channel === 'steam') {
      result = await publishSteam({ assetCid: input.assetCid, appId: input.steamAppId });
    } else if (input.channel === 'tiktok') {
      result = await publishTikTok({ assetCid: input.assetCid, caption: input.tiktokCaption });
    } else {
      result = await publishYouTube({ assetCid: input.assetCid, title: input.youtubeTitle, description: input.youtubeDescription, privacyStatus: input.youtubePrivacy });
    }

    if (result.ok) {
      record.status = 'published';
      record.url = result.url;
    } else {
      record.status = 'failed';
      record.error = result.error || 'publish failed';
    }
  } catch (err: any) {
    record.status = 'failed';
    record.error = err.message;
  }

  savePublishes(records);
  if (record.status === 'published') {
    void publishSystemEvent('asset.publish_completed', 'publishOrchestrator', `Published: ${input.title}`, { publishId: record.id, channel: input.channel, url: record.url });
  }
  return { ok: record.status === 'published', status: record.status, record };
}
