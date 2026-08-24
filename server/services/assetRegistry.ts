/**
 * assetRegistry.ts
 * ============================================================
 * Content-Addressed Multi-Modal Asset Registry — the backbone of the
 * Event-Driven Asset Graph (Autonomous Digital Factory).
 *
 * Every produced asset (image, audio, video, code, build, 3D model) is
 * registered as a node identified by a content hash (CID). Nodes link to
 * their dependencies (`dependsOn`) forming a DAG, exactly like Bazel's
 * action graph / Unreal's Derived Data Cache.
 *
 * Persists:
 *   - binary payloads  -> runtime/assets/<cid>
 *   - manifest graph   -> runtime/asset_registry.json (atomic write)
 *
 * Emits `asset.created` on the cross-system event bus so downstream
 * factories (video marketing, publishing, monetization) can react.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ensureRuntimeRootSync, resolveRuntimeDirPath } from './runtimePaths.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

export type AssetKind =
  | 'image'
  | 'sprite_sheet'
  | 'audio'
  | 'video'
  | 'code'
  | 'build'
  | 'document'
  | 'model_3d'
  | 'manifest'
  | 'other';

export interface AssetProvenance {
  /** Engine / adapter that produced this asset. */
  source: string;
  prompt?: string;
  provider?: string;
  model?: string;
  inputCids?: string[];
  [key: string]: unknown;
}

export interface AssetRecord {
  cid: string;
  kind: AssetKind;
  name: string;
  mimeType: string;
  sizeBytes: number;
  /** Local binary payload path (runtime/assets/<cid>), if materialized. */
  filePath?: string;
  /** Remote URL when the binary lives on a cloud provider CDN. */
  remoteUrl?: string;
  dependsOn: string[];
  provenance: AssetProvenance;
  createdAt: string;
}

const REGISTRY_FILE = () => resolveRuntimeDirPath('asset_registry.json');
const ASSETS_DIR = () => resolveRuntimeDirPath('assets');

let memoryCache: AssetRecord[] | null = null;

function ensureDirs(): void {
  ensureRuntimeRootSync();
  const dir = ASSETS_DIR();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadRegistry(): AssetRecord[] {
  if (memoryCache !== null) return memoryCache;
  ensureDirs();
  if (!fs.existsSync(REGISTRY_FILE())) {
    memoryCache = [];
    return memoryCache;
  }
  try {
    const raw = fs.readFileSync(REGISTRY_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    const list: AssetRecord[] = Array.isArray(parsed?.assets) ? parsed.assets : [];
    memoryCache = list;
    return list;
  } catch {
    memoryCache = [];
    return memoryCache;
  }
}

function saveRegistry(records: AssetRecord[]): void {
  ensureDirs();
  memoryCache = records;
  const file = REGISTRY_FILE();
  const tmp = `${file}.tmp`;
  try {
    fs.writeFileSync(tmp, JSON.stringify({ assets: records, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  } catch {
    // Fall back to direct write if rename fails (e.g. file-lock on Windows).
    try {
      fs.writeFileSync(file, JSON.stringify({ assets: records, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    } catch {
      // Keep the in-memory copy authoritative even if persistence fails.
    }
  }
}

/** Compute a stable content-addressed id for arbitrary bytes. */
export function computeCid(bytes: Buffer | string): string {
  const buf = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes, 'utf8');
  return `sha256-${crypto.createHash('sha256').update(buf).digest('hex')}`;
}

/**
 * Register an asset node in the graph.
 * - If `bytes` provided, materializes the payload locally and derives the CID from content.
 * - If only `remoteUrl` provided, derives a URL-addressed id (documented, not content-true).
 * Deduplicates: returning the existing node when the same CID already exists.
 */
export function registerAsset(input: {
  kind: AssetKind;
  name: string;
  mimeType: string;
  bytes?: Buffer;
  remoteUrl?: string;
  dependsOn?: string[];
  provenance: AssetProvenance;
}): AssetRecord {
  const records = loadRegistry();

  let cid: string;
  let filePath: string | undefined;
  let sizeBytes = 0;

  if (input.bytes) {
    cid = computeCid(input.bytes);
    sizeBytes = input.bytes.length;
    const target = path.join(ASSETS_DIR(), cid);
    if (!fs.existsSync(target)) {
      fs.writeFileSync(target, input.bytes);
    }
    filePath = target;
  } else if (input.remoteUrl) {
    cid = computeCid(`url:${input.remoteUrl}:${input.name}`);
    sizeBytes = 0;
  } else {
    cid = computeCid(`meta:${input.name}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`);
  }

  const existing = records.find((r) => r.cid === cid);
  if (existing) {
    // Merge new dependency edges (graph may gain edges without changing content).
    const mergedDependsOn = Array.from(new Set([...existing.dependsOn, ...(input.dependsOn || [])]));
    if (mergedDependsOn.length !== existing.dependsOn.length) {
      existing.dependsOn = mergedDependsOn;
      saveRegistry(records);
    }
    return existing;
  }

  const record: AssetRecord = {
    cid,
    kind: input.kind,
    name: input.name,
    mimeType: input.mimeType,
    sizeBytes,
    filePath,
    remoteUrl: input.remoteUrl,
    dependsOn: input.dependsOn || [],
    provenance: input.provenance,
    createdAt: new Date().toISOString(),
  };

  records.push(record);
  saveRegistry(records);

  void publishSystemEvent('asset.created', 'assetRegistry', `Asset created: ${input.name}`, {
    cid,
    kind: input.kind,
    name: input.name,
    sizeBytes,
  });

  return record;
}

export function listAssets(filter?: { kind?: AssetKind; limit?: number }): AssetRecord[] {
  const records = loadRegistry();
  let list = records;
  if (filter?.kind) list = list.filter((r) => r.kind === filter.kind);
  list = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return filter?.limit ? list.slice(0, filter.limit) : list;
}

export function getAsset(cid: string): AssetRecord | null {
  return loadRegistry().find((r) => r.cid === cid) || null;
}

/** Resolve the local binary path for a CID, if it was materialized. */
export function getAssetFilePath(cid: string): string | null {
  const rec = getAsset(cid);
  if (rec?.filePath && fs.existsSync(rec.filePath)) return rec.filePath;
  const fallback = path.join(ASSETS_DIR(), cid);
  return fs.existsSync(fallback) ? fallback : null;
}

/** Breadth-first traversal of the dependency DAG rooted at `cid`. */
export function getAssetGraph(cid: string, maxDepth = 12): AssetRecord[] {
  const records = loadRegistry();
  const byCid = new Map(records.map((r) => [r.cid, r]));
  const visited = new Set<string>();
  const queue = [cid];
  const result: AssetRecord[] = [];

  while (queue.length > 0 && visited.size < maxDepth * 50) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const rec = byCid.get(current);
    if (!rec) continue;
    result.push(rec);
    for (const dep of rec.dependsOn) {
      if (!visited.has(dep)) queue.push(dep);
    }
  }
  return result;
}

export function getAssetStats(): {
  totalAssets: number;
  totalBytes: number;
  byKind: Record<string, number>;
} {
  const records = loadRegistry();
  const byKind: Record<string, number> = {};
  let totalBytes = 0;
  for (const r of records) {
    byKind[r.kind] = (byKind[r.kind] || 0) + 1;
    totalBytes += r.sizeBytes;
  }
  return { totalAssets: records.length, totalBytes, byKind };
}
