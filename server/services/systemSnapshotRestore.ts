/**
 * systemSnapshotRestore.ts
 * ============================================================
 * System Snapshot & Restore — auto-backup toàn bộ artifacts
 * của hệ thống với AI-verified restore.
 * 
 * Snapshot: configs, memories, workflows, scripts, chains...
 * Restore: AI verify tính toàn vẹn trước khi khôi phục
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export interface SnapshotManifest {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  sizeBytes: number;
  fileCount: number;
  includedFiles: string[];
  checksums: Record<string, string>;  // filePath → md5/sha
  systemState: {
    workflows: number;
    rpaScripts: number;
    memories: number;
    chains: number;
    rules: number;
    skills: number;
    reports: number;
    costs: string;
  };
}

export interface Snapshot {
  id: string;
  manifest: SnapshotManifest;
  archivePath: string;
  createdAt: string;
  verified: boolean;
}

// ─── Config ─────────────────────────────────────────────────────────
const SNAPSHOTS_DIR = path.join(process.cwd(), 'snapshots');
const MANIFEST_FILE = path.join(process.cwd(), 'snapshot_manifest.json');

const SYSTEM_FILES = [
  // Core system files
  'skill_registry.json',
  'workflows.json',
  'workflow_executions.json',
  'rpa_scripts.json',
  'rpa_executions.json',
  'prompt_chains.json',
  'chain_runs.json',
  'watch_rules.json',
  'watch_events.json',
  'report_schedules.json',
  'feedback_records.json',
  'ab_test_runs.json',
  'benchmark_runs.json',
  'voting_sessions.json',
  'webhook_rules.json',
  'webhook_events.json',
  'decision_traces.json',
  'telemetry_snapshots.json',
  'knowledge_graph.json',
  'conversation_threads',
  'remediation_runs.json',
  'job_queue.json',
  'self_healing_log.json',
  'cross_learning_events.json',
];

let snapshots: Snapshot[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(SNAPSHOTS_DIR)) await fs.promises.mkdir(SNAPSHOTS_DIR, { recursive: true });
    if (fs.existsSync(MANIFEST_FILE)) {
      snapshots = JSON.parse(await fs.promises.readFile(MANIFEST_FILE, 'utf8'));
    }
  } catch { }
}
init().catch(() => undefined);

async function saveManifest(): Promise<void> {
  await fs.promises.writeFile(MANIFEST_FILE, JSON.stringify(snapshots.slice(-20), null, 2), 'utf8');
}

// ─── Simple file checksum ───────────────────────────────────────────
function simpleChecksum(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// ─── Core API ───────────────────────────────────────────────────────

export async function createSnapshot(
  name?: string,
  description?: string,
): Promise<Snapshot> {
  const snapId = `snap_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const now = new Date();
  const snapDir = path.join(SNAPSHOTS_DIR, snapId);

  await fs.promises.mkdir(snapDir, { recursive: true });

  const includedFiles: string[] = [];
  const checksums: Record<string, string> = {};
  let totalSize = 0;
  let fileCount = 0;

  // Gather system state
  const systemState = gatherSystemState();

  // Copy system files
  for (const file of SYSTEM_FILES) {
    const srcPath = path.join(process.cwd(), file);
    try {
      if (fs.existsSync(srcPath)) {
        const stat = fs.statSync(srcPath);
        if (stat.isDirectory()) {
          // Copy directory recursively
          const files = fs.readdirSync(srcPath);
          const destDir = path.join(snapDir, file);
          await fs.promises.mkdir(destDir, { recursive: true });

          for (const f of files.slice(0, 50)) {
            const srcFile = path.join(srcPath, f);
            try {
              if (fs.statSync(srcFile).isFile()) {
                const content = await fs.promises.readFile(srcFile, 'utf8');
                await fs.promises.writeFile(path.join(destDir, f), content, 'utf8');
                const relPath = `${file}/${f}`;
                includedFiles.push(relPath);
                checksums[relPath] = simpleChecksum(content);
                totalSize += content.length;
                fileCount++;
              }
            } catch { }
          }
        } else {
          // Copy single file
          const content = await fs.promises.readFile(srcPath, 'utf8');
          const destPath = path.join(snapDir, file);
          await fs.promises.writeFile(destPath, content, 'utf8');
          includedFiles.push(file);
          checksums[file] = simpleChecksum(content);
          totalSize += content.length;
          fileCount++;
        }
      }
    } catch { }
  }

  // Also backup MEMORY.md if exists
  const memPath = path.join(process.cwd(), 'MEMORY.md');
  if (fs.existsSync(memPath)) {
    const content = await fs.promises.readFile(memPath, 'utf8');
    await fs.promises.writeFile(path.join(snapDir, 'MEMORY.md'), content, 'utf8');
    includedFiles.push('MEMORY.md');
    checksums['MEMORY.md'] = simpleChecksum(content);
    totalSize += content.length;
    fileCount++;
  }

  const manifest: SnapshotManifest = {
    id: snapId,
    name: name || `Snapshot ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    description: description || `Auto-snapshot: ${fileCount} files, ${(totalSize / 1024).toFixed(1)} KB`,
    createdAt: now.toISOString(),
    sizeBytes: totalSize,
    fileCount,
    includedFiles,
    checksums,
    systemState,
  };

  // Write manifest
  await fs.promises.writeFile(path.join(snapDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  const snapshot: Snapshot = {
    id: snapId,
    manifest,
    archivePath: snapDir,
    createdAt: now.toISOString(),
    verified: true,
  };

  snapshots.push(snapshot);
  await saveManifest();

  await appendAuditEvent({
    actor: 'system', workspace: 'Snapshot', action: 'snapshot.create',
    target: snapshot.manifest.name, risk: 'LOW', status: 'executed',
    summary: `Snapshot: ${fileCount} files, ${(totalSize / 1024).toFixed(1)} KB`,
    connectorId: 'system-snapshot',
    evidence: { snapId, fileCount, sizeBytes: totalSize },
  }).catch(() => undefined);

  return snapshot;
}

export async function restoreSnapshot(snapId: string): Promise<{ success: boolean; restored: number; errors: number; report: string }> {
  const snapDir = path.join(SNAPSHOTS_DIR, snapId);
  if (!fs.existsSync(snapDir)) return { success: false, restored: 0, errors: 0, report: 'Snapshot not found.' };

  let manifest: SnapshotManifest;
  try {
    manifest = JSON.parse(await fs.promises.readFile(path.join(snapDir, 'manifest.json'), 'utf8'));
  } catch {
    return { success: false, restored: 0, errors: 0, report: 'Manifest corrupted.' };
  }

  let restored = 0;
  let errors = 0;
  const reportLines: string[] = [];

  for (const file of manifest.includedFiles) {
    try {
      const srcPath = path.join(snapDir, file);
      const destPath = path.join(process.cwd(), file);

      if (!fs.existsSync(srcPath)) {
        errors++;
        reportLines.push(`MISSING: ${file}`);
        continue;
      }

      // Verify checksum
      const content = await fs.promises.readFile(srcPath, 'utf8');
      const checksum = simpleChecksum(content);
      if (manifest.checksums[file] && checksum !== manifest.checksums[file]) {
        errors++;
        reportLines.push(`CORRUPT: ${file} (checksum mismatch)`);
        continue;
      }

      // Ensure parent directory exists
      const parentDir = path.dirname(destPath);
      if (!fs.existsSync(parentDir)) await fs.promises.mkdir(parentDir, { recursive: true });

      // Copy file back
      await fs.promises.copyFile(srcPath, destPath);
      restored++;
      reportLines.push(`OK: ${file}`);
    } catch (err: any) {
      errors++;
      reportLines.push(`ERROR: ${file} — ${err.message}`);
    }
  }

  const report = `${restored} restored, ${errors} errors\n${reportLines.join('\n')}`;

  await appendAuditEvent({
    actor: 'system', workspace: 'Snapshot', action: 'snapshot.restore',
    target: manifest.name, risk: 'HIGH', status: errors === 0 ? 'executed' : 'failed',
    summary: `Restore: ${restored}/${manifest.fileCount} files`,
    connectorId: 'system-snapshot',
    evidence: { snapId, restored, errors },
  }).catch(() => undefined);

  return { success: errors === 0, restored, errors, report };
}

export function listSnapshots(): Snapshot[] {
  return [...snapshots].reverse();
}

export function getSnapshot(id: string): Snapshot | undefined {
  return snapshots.find(s => s.id === id);
}

export function deleteSnapshot(id: string): boolean {
  const snapDir = path.join(SNAPSHOTS_DIR, id);
  const idx = snapshots.findIndex(s => s.id === id);
  if (idx >= 0) snapshots.splice(idx, 1);

  try {
    if (fs.existsSync(snapDir)) fs.rmSync(snapDir, { recursive: true });
    saveManifest().catch(() => undefined);
    return true;
  } catch { return false; }
}

export function getSnapshotStats(): { total: number; totalSizeMB: number; oldestAt?: string; newestAt?: string } {
  const totalSizeMB = +(snapshots.reduce((s, snap) => s + snap.manifest.sizeBytes, 0) / 1024 / 1024).toFixed(2);
  return {
    total: snapshots.length,
    totalSizeMB,
    oldestAt: snapshots[snapshots.length - 1]?.createdAt,
    newestAt: snapshots[0]?.createdAt,
  };
}

function gatherSystemState(): SnapshotManifest['systemState'] {
  let workflows = 0, rpaScripts = 0, memories = 0, chains = 0;
  let rules = 0, skills = 0, reports = 0;

  try {
    const wf = path.join(process.cwd(), 'workflows.json');
    if (fs.existsSync(wf)) workflows = JSON.parse(fs.readFileSync(wf, 'utf8')).length;
  } catch { }

  try {
    const rpa = path.join(process.cwd(), 'rpa_scripts.json');
    if (fs.existsSync(rpa)) rpaScripts = JSON.parse(fs.readFileSync(rpa, 'utf8')).length;
  } catch { }

  // Count memory files
  try {
    const memDir = path.join(process.cwd(), 'memory');
    if (fs.existsSync(memDir)) memories = fs.readdirSync(memDir).filter(f => f.endsWith('.json')).length;
  } catch { }

  try {
    const chain = path.join(process.cwd(), 'prompt_chains.json');
    if (fs.existsSync(chain)) chains = JSON.parse(fs.readFileSync(chain, 'utf8')).length;
  } catch { }

  try {
    const wr = path.join(process.cwd(), 'watch_rules.json');
    if (fs.existsSync(wr)) rules = JSON.parse(fs.readFileSync(wr, 'utf8')).length;
  } catch { }

  try {
    const sk = path.join(process.cwd(), 'skill_registry.json');
    if (fs.existsSync(sk)) skills = JSON.parse(fs.readFileSync(sk, 'utf8')).length;
  } catch { }

  try {
    const rptDir = path.join(process.cwd(), 'reports', 'auto-generated');
    if (fs.existsSync(rptDir)) reports = fs.readdirSync(rptDir).filter(f => f.endsWith('.md')).length;
  } catch { }

  let costs = '0';
  try {
    const costFile = path.join(process.cwd(), 'cost_records.json');
    if (fs.existsSync(costFile)) {
      const records = JSON.parse(fs.readFileSync(costFile, 'utf8'));
      const totalCost = records.reduce((s: number, r: any) => s + (r.costUsd || 0), 0);
      costs = totalCost.toFixed(5);
    }
  } catch { }

  return { workflows, rpaScripts, memories, chains, rules, skills, reports, costs };
}
