/**
 * buildEngine.ts
 * ============================================================
 * Build, checksum, sign & package engine for the Asset Foundry.
 *
 *   - buildSourceBundle  : esbuild → single bundle registered as `build` asset
 *   - computeAssetChecksum: SHA-256 of the binary (or canonical metadata)
 *   - signAsset / verifyAssetSignature : HMAC via signedRecords (reuses pillar)
 *   - packageRelease     : copy binaries + manifest.json into runtime/releases/<name>
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { registerAsset, getAsset, getAssetFilePath } from './assetRegistry.ts';
import { signRecord, verifyRecord } from './signedRecords.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export interface BuildInput {
  sourceDir: string;
  entryFile: string;
  outName?: string;
  platform?: 'node' | 'browser';
  minify?: boolean;
}

export interface BuildResult {
  ok: boolean;
  status: 'completed' | 'failed' | 'esbuild_missing';
  cid?: string;
  filePath?: string;
  bytes?: number;
  error?: string;
}

export async function buildSourceBundle(input: BuildInput): Promise<BuildResult> {
  const entry = path.resolve(input.sourceDir || process.cwd(), input.entryFile);
  if (!fs.existsSync(entry)) {
    return { ok: false, status: 'failed', error: `entryFile not found: ${entry}` };
  }
  const outName = input.outName || `bundle_${Date.now()}.js`;

  let esbuild: any;
  try {
    const mod: any = await import('esbuild');
    esbuild = mod.default || mod;
  } catch {
    return { ok: false, status: 'esbuild_missing', error: 'esbuild không khả dụng' };
  }

  const outfile = path.join(resolveRuntimeDirPath('assets'), outName);
  void publishSystemEvent('asset.render_started', 'buildEngine', `Building ${outName}`, { entry });

  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      outfile,
      platform: input.platform || 'node',
      format: input.platform === 'browser' ? 'iife' : 'cjs',
      minify: input.minify ?? true,
      sourcemap: false,
    });
    const bytes = fs.readFileSync(outfile);
    const rec = registerAsset({
      kind: 'build',
      name: outName,
      mimeType: 'application/javascript',
      bytes,
      provenance: { source: 'buildEngine', prompt: entry },
    });
    void publishSystemEvent('asset.render_completed', 'buildEngine', `Build completed: ${outName}`, { cid: rec.cid, sizeBytes: bytes.length });
    return { ok: true, status: 'completed', cid: rec.cid, filePath: rec.filePath, bytes: bytes.length };
  } catch (err: any) {
    void publishSystemEvent('asset.render_failed', 'buildEngine', `Build failed: ${outName}`, { error: err.message });
    return { ok: false, status: 'failed', error: err.message };
  }
}

export function computeAssetChecksum(cid: string): { ok: boolean; checksum?: string; error?: string } {
  const file = getAssetFilePath(cid);
  if (file) {
    return { ok: true, checksum: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') };
  }
  const asset = getAsset(cid);
  if (!asset) return { ok: false, error: 'asset not found' };
  // remote / metadata-only: hash canonical metadata (documented, not content-true).
  const meta = { cid, name: asset.name, remoteUrl: asset.remoteUrl, mimeType: asset.mimeType };
  return { ok: true, checksum: crypto.createHash('sha256').update(JSON.stringify(meta)).digest('hex') };
}

export function signAsset(cid: string): { ok: boolean; signature?: string; error?: string } {
  const chk = computeAssetChecksum(cid);
  if (!chk.ok || !chk.checksum) return { ok: false, error: chk.error || 'checksum failed' };
  return { ok: true, signature: signRecord({ cid, checksum: chk.checksum }) };
}

export function verifyAssetSignature(cid: string, signature: string): { ok: boolean; valid: boolean; error?: string } {
  const chk = computeAssetChecksum(cid);
  if (!chk.ok || !chk.checksum) return { ok: false, valid: false, error: chk.error || 'checksum failed' };
  return { ok: true, valid: verifyRecord({ cid, checksum: chk.checksum }, signature) };
}

export function packageRelease(input: { assetCids: string[]; outName: string }): { ok: boolean; status: string; cid?: string; dirPath?: string; error?: string } {
  if (!input.assetCids?.length) return { ok: false, status: 'failed', error: 'assetCids is required' };
  const dir = resolveRuntimeDirPath(path.join('releases', input.outName));
  fs.mkdirSync(dir, { recursive: true });

  const manifest: Array<{ cid: string; name: string; checksum?: string }> = [];
  for (const cid of input.assetCids) {
    const asset = getAsset(cid);
    if (!asset) return { ok: false, status: 'failed', error: `asset not found: ${cid}` };
    const chk = computeAssetChecksum(cid).checksum;
    manifest.push({ cid, name: asset.name, checksum: chk });
    const file = getAssetFilePath(cid);
    if (file) {
      fs.copyFileSync(file, path.join(dir, asset.name || cid));
    }
  }

  const manifestBytes = Buffer.from(JSON.stringify({ outName: input.outName, assets: manifest, createdAt: new Date().toISOString() }, null, 2), 'utf8');
  fs.writeFileSync(path.join(dir, 'manifest.json'), manifestBytes);

  const rec = registerAsset({
    kind: 'manifest',
    name: `release_${input.outName}.json`,
    mimeType: 'application/json',
    bytes: manifestBytes,
    dependsOn: input.assetCids,
    provenance: { source: 'buildEngine', inputCids: input.assetCids },
  });
  void publishSystemEvent('asset.created', 'buildEngine', `Packaged release: ${input.outName}`, { cid: rec.cid });
  return { ok: true, status: 'completed', cid: rec.cid, dirPath: dir };
}
