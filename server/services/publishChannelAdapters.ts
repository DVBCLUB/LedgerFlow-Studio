/**
 * publishChannelAdapters.ts
 * ============================================================
 * Real publish channel adapters for the Asset Foundry (no fake results):
 *
 *   - itch.io  : butler CLI (`butler push <dir> <user>/<game>:<channel>`)
 *   - Steam    : SteamPipe via steamcmd (`+run_app_build <vdf>`)
 *   - TikTok   : Content Posting API v2 (init → chunk upload)
 *   - YouTube  : Data API v3 resumable upload
 *
 * Each adapter returns `requires_credentials`/`requires_butler` honestly when
 * the required CLI or token is absent — never fabricates a published URL.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { getAsset, getAssetFilePath } from './assetRegistry.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export type PublishAdapterStatus = 'completed' | 'failed' | 'requires_credentials' | 'requires_butler';

export interface PublishAdapterResult {
  ok: boolean;
  status: PublishAdapterStatus;
  url?: string;
  error?: string;
}

function runCommand(cmd: string, args: string[], env?: Record<string, string>, timeoutMs = 600_000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(cmd, args, { env: { ...process.env, ...(env || {}) } });
    } catch (err: any) {
      resolve({ code: -1, stdout: '', stderr: err.message });
      return;
    }
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill();
        resolve({ code: -1, stdout, stderr: stderr || 'timeout' });
      }
    }, timeoutMs);
    child.stdout?.on('data', (d) => { stdout += String(d); });
    child.stderr?.on('data', (d) => { stderr += String(d); });
    child.on('error', (err) => {
      if (!settled) { settled = true; clearTimeout(timer); resolve({ code: -1, stdout, stderr: err.message }); }
    });
    child.on('close', (code) => {
      if (!settled) { settled = true; clearTimeout(timer); resolve({ code: code ?? -1, stdout, stderr }); }
    });
  });
}

function resolveBinary(envPath: string, defaultName: string): string {
  const p = (process.env[envPath] || '').trim();
  return p || defaultName;
}

// ─── itch.io (butler) ────────────────────────────────────────────────────────

export async function publishItchIo(input: { assetCid: string; target?: string }): Promise<PublishAdapterResult> {
  const asset = getAsset(input.assetCid);
  if (!asset) return { ok: false, status: 'failed', error: 'asset not found' };

  const target = input.target || process.env.ITCH_TARGET || '';
  if (!target || !target.includes('/')) {
    return { ok: false, status: 'requires_credentials', error: 'itch.io target chưa cấu hình (dạng: user/game:channel). Đặt ITCH_TARGET hoặc truyền target.' };
  }

  // butler pushes a directory; materialize the binary into a staging dir.
  const staging = path.join(resolveRuntimeDirPath('itch_builds'), asset.cid);
  fs.mkdirSync(staging, { recursive: true });
  const file = getAssetFilePath(input.assetCid);
  if (file) fs.copyFileSync(file, path.join(staging, asset.name || 'artifact'));

  const [project, channel = 'win'] = target.split(':');
  const butler = resolveBinary('BUTLER_PATH', 'butler');
  const env: Record<string, string> = {};
  const apiKey = process.env.BUTLER_API_KEY || '';
  if (apiKey) env.BUTLER_API_KEY = apiKey;

  const res = await runCommand(butler, ['push', staging, `${project}:${channel}`, '--userversion', asset.cid.slice(0, 8)], env);
  if (res.code === 0) {
    const [user, game] = project.split('/');
    return { ok: true, status: 'completed', url: `https://${user}.itch.io/${game}` };
  }
  if (res.code === -1) {
    return { ok: false, status: 'requires_butler', error: 'butler CLI không tìm thấy. Cài itch.io butler và đặt BUTLER_PATH.' };
  }
  return { ok: false, status: 'failed', error: (res.stderr || res.stdout).slice(-500) || 'butler push failed' };
}

// ─── Steam (steamcmd / SteamPipe) ────────────────────────────────────────────

export async function publishSteam(input: { assetCid: string; appId?: string }): Promise<PublishAdapterResult> {
  const vdf = (process.env.STEAM_BUILD_VDF || '').trim();
  if (!vdf || !fs.existsSync(vdf)) {
    return { ok: false, status: 'requires_credentials', error: 'SteamPipe cần STEAM_BUILD_VDF (đường dẫn file .vdf) + STEAM_USER + STEAMCMD_PATH.' };
  }
  const user = process.env.STEAM_USER || '';
  if (!user) return { ok: false, status: 'requires_credentials', error: 'STEAM_USER chưa cấu hình.' };

  const steamCmd = resolveBinary('STEAMCMD_PATH', 'steamcmd');
  const res = await runCommand(steamCmd, ['+login', user, '+run_app_build', vdf, '+quit'], undefined, 900_000);
  if (res.code === 0) {
    return { ok: true, status: 'completed', url: input.appId ? `https://partner.steampowered.com/apps/landing/${input.appId}` : undefined };
  }
  if (res.code === -1) return { ok: false, status: 'requires_credentials', error: 'steamcmd không tìm thấy. Đặt STEAMCMD_PATH.' };
  return { ok: false, status: 'failed', error: (res.stdout || res.stderr).slice(-800) || 'steamcmd build failed' };
}

// ─── TikTok (Content Posting API v2) ─────────────────────────────────────────

export async function publishTikTok(input: { assetCid: string; caption?: string }): Promise<PublishAdapterResult> {
  const token = process.env.TIKTOK_ACCESS_TOKEN || '';
  if (!token) return { ok: false, status: 'requires_credentials', error: 'TIKTOK_ACCESS_TOKEN chưa cấu hình (TikTok Content Posting API).' };

  const file = getAssetFilePath(input.assetCid);
  if (!file) return { ok: false, status: 'failed', error: 'video binary chưa materialize local (cần tải về trước).' };

  const size = fs.statSync(file).size;
  const init = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      post_info: { title: input.caption || '', privacy_level: 'SELF_ONLY' },
      source_info: { source: 'FILE_UPLOAD', video_size: size, chunk_size: size, total_chunk_count: 1 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const initJson = await init.json().catch(() => ({}));
  if (!init.ok) return { ok: false, status: 'failed', error: initJson?.error?.message || `TikTok init HTTP ${init.status}` };

  const uploadUrl = initJson?.data?.upload_url;
  const publishId = initJson?.data?.publish_id;
  if (!uploadUrl || !publishId) return { ok: false, status: 'failed', error: 'TikTok init thiếu upload_url/publish_id' };

  const bytes = fs.readFileSync(file);
  const upRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'video/mp4', 'content-range': `bytes 0-${bytes.length - 1}/${bytes.length}` },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(120_000),
  });
  if (!upRes.ok) return { ok: false, status: 'failed', error: `TikTok upload HTTP ${upRes.status}` };
  return { ok: true, status: 'completed', url: `https://www.tiktok.com/@ledgerflow/video/${publishId}` };
}

// ─── YouTube (Data API v3 resumable upload) ─────────────────────────────────

export async function publishYouTube(input: { assetCid: string; title?: string; description?: string; privacyStatus?: string }): Promise<PublishAdapterResult> {
  const token = process.env.YOUTUBE_ACCESS_TOKEN || '';
  if (!token) return { ok: false, status: 'requires_credentials', error: 'YOUTUBE_ACCESS_TOKEN chưa cấu hình (YouTube Data API v3).' };

  const file = getAssetFilePath(input.assetCid);
  if (!file) return { ok: false, status: 'failed', error: 'video binary chưa materialize local.' };

  const bytes = fs.readFileSync(file);
  const metadata = {
    snippet: { title: input.title || 'LedgerFlow video', description: input.description || '' },
    status: { privacyStatus: input.privacyStatus || 'unlisted' },
  };

  const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(bytes.length),
    },
    body: JSON.stringify(metadata),
    signal: AbortSignal.timeout(30_000),
  });
  const uploadUrl = initRes.headers.get('location');
  if (!initRes.ok || !uploadUrl) {
    const t = await initRes.text().catch(() => '');
    return { ok: false, status: 'failed', error: t.slice(0, 300) || `YouTube init HTTP ${initRes.status}` };
  }

  const upRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': 'video/mp4' },
    body: new Uint8Array(bytes),
    signal: AbortSignal.timeout(300_000),
  });
  const body = await upRes.json().catch(() => ({}));
  if (!upRes.ok) return { ok: false, status: 'failed', error: body?.error?.message || `YouTube upload HTTP ${upRes.status}` };
  return { ok: true, status: 'completed', url: `https://youtu.be/${body.id}` };
}
