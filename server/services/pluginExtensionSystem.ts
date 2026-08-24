/**
 * pluginExtensionSystem.ts
 * ============================================================
 * Plugin Extension System — hot-pluggable AI modules
 * có thể load/unload tại runtime, tự động discover
 * capabilities, và register vào hệ thống.
 */
import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog.ts';
import { auditPluginInvocationDecision, decidePluginInvocation } from './pluginInvocationBoundary.ts';

// ─── Types ──────────────────────────────────────────────────────────
export type PluginType = 'tool' | 'agent' | 'skill' | 'trigger' | 'middleware' | 'data_source';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: PluginType;
  description: string;
  author: string;
  capabilities: PluginCapability[];
  dependencies: string[];
  entryPoint: string;      // Relative path to plugin entry file
  enabled: boolean;
  permissions?: string[];
  signature?: string;
  sandbox?: boolean | { enabled: boolean; mode?: 'simulation' | 'process' | 'container' };
  trustLevel?: 'unsigned' | 'signed' | 'sandboxed' | 'trusted';
  sastIssues?: string[];
  sastScore?: number;
}

export interface PluginCapability {
  name: string;
  description: string;
  params: Record<string, { type: string; description: string; required: boolean }>;
  returns: { type: string; description: string };
}

export interface PluginInstance {
  manifest: PluginManifest;
  loadedAt: string;
  status: 'loaded' | 'unloaded' | 'error';
  error?: string;
  invokeCount: number;
  lastInvoked?: string;
  metrics: { avgLatencyMs: number; successRate: number };
}

// ─── Storage ────────────────────────────────────────────────────────
const PLUGINS_DIR = path.join(process.cwd(), 'plugins');
const REGISTRY_FILE = path.join(PLUGINS_DIR, '_registry.json');

let plugins: PluginInstance[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(PLUGINS_DIR)) await fs.promises.mkdir(PLUGINS_DIR, { recursive: true });
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = JSON.parse(await fs.promises.readFile(REGISTRY_FILE, 'utf8'));
      plugins = data.plugins || [];
    }
  } catch { }
}
init().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(REGISTRY_FILE, JSON.stringify({ plugins, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export function registerPlugin(manifest: Omit<PluginManifest, 'id'>): PluginInstance {
  const fullManifest: PluginManifest = {
    ...manifest,
    id: `plugin_${Date.now()}_${randomUUID().slice(0, 6)}`,
    enabled: manifest.enabled ?? true,
  };

  // Ensure plugin directory exists
  const pluginDir = path.join(PLUGINS_DIR, fullManifest.name);
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir, { recursive: true });

  // Write manifest
  fs.writeFileSync(path.join(pluginDir, 'manifest.json'), JSON.stringify(fullManifest, null, 2), 'utf8');

  const instance: PluginInstance = {
    manifest: fullManifest,
    loadedAt: new Date().toISOString(),
    status: 'loaded',
    invokeCount: 0,
    metrics: { avgLatencyMs: 0, successRate: 100 },
  };

  plugins.push(instance);
  save().catch(() => undefined);

  appendAuditEvent({
    actor: 'system', workspace: 'Plugin System', action: 'plugin.register',
    target: fullManifest.name, risk: 'LOW', status: 'executed',
    summary: `Plugin "${fullManifest.name}" registered (v${fullManifest.version}, ${fullManifest.capabilities.length} capabilities).`,
    connectorId: 'plugin-system',
    evidence: { pluginId: fullManifest.id, type: fullManifest.type },
  }).catch(() => undefined);

  return instance;
}

export function unloadPlugin(pluginId: string): boolean {
  const idx = plugins.findIndex(p => p.manifest.id === pluginId);
  if (idx < 0) return false;
  plugins[idx].status = 'unloaded';
  save().catch(() => undefined);
  return true;
}

export function reloadPlugin(pluginId: string): PluginInstance | undefined {
  const plugin = plugins.find(p => p.manifest.id === pluginId);
  if (!plugin) return undefined;
  plugin.status = 'loaded';
  plugin.loadedAt = new Date().toISOString();
  save().catch(() => undefined);
  return plugin;
}

export function getPlugin(id: string): PluginInstance | undefined {
  return plugins.find(p => p.manifest.id === id);
}

export function listPlugins(filter?: { type?: PluginType; status?: PluginInstance['status'] }): PluginInstance[] {
  let result = [...plugins];
  if (filter?.type) result = result.filter(p => p.manifest.type === filter.type);
  if (filter?.status) result = result.filter(p => p.status === filter.status);
  return result;
}

export function discoverPlugins(dirPath?: string): PluginManifest[] {
  const scanDir = dirPath || PLUGINS_DIR;
  const discovered: PluginManifest[] = [];

  try {
    if (!fs.existsSync(scanDir)) return [];
    const entries = fs.readdirSync(scanDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const manifestPath = path.join(scanDir, entry.name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PluginManifest;
          
          // Perform quick static analysis (SAST Scan) on plugin entry code
          const entryFile = path.join(scanDir, entry.name, manifest.entryPoint || 'index.js');
          const issues: string[] = [];
          if (fs.existsSync(entryFile)) {
            const code = fs.readFileSync(entryFile, 'utf8');
            if (code.includes('child_process') || code.includes('exec(') || code.includes('spawn(')) {
              issues.push('Phát hiện gọi shell command (potential arbitrary command execution).');
            }
            if (code.includes('eval(') || code.includes('new Function(')) {
              issues.push('Phát hiện gọi eval/dynamic function execution.');
            }
            if (code.includes('rmSync(') || code.includes('unlinkSync(')) {
              issues.push('Phát hiện thao tác xóa file hệ thống.');
            }
            if (code.includes('fetch(') || code.includes('axios') || code.includes('http.')) {
              issues.push('Phát hiện kết nối mạng bên ngoài (potential data exfiltration).');
            }
          }
          manifest.sastIssues = issues;
          manifest.sastScore = Math.max(0, 100 - issues.length * 25);

          discovered.push(manifest);
        } catch { }
      }
    }
  } catch { }

  return discovered;
}

export function installFromDiscovered(): number {
  const discovered = discoverPlugins();
  let installed = 0;

  for (const manifest of discovered) {
    if (plugins.find(p => p.manifest.name === manifest.name)) continue;
    const instance = registerPlugin(manifest);
    if (instance) installed++;
  }

  return installed;
}

export async function invokePlugin(pluginId: string, capability: string, params: Record<string, unknown>): Promise<{ success: boolean; output: string; latencyMs: number }> {
  const plugin = plugins.find(p => p.manifest.id === pluginId);
  if (!plugin || plugin.status !== 'loaded') return { success: false, output: 'Plugin not loaded.', latencyMs: 0 };

  const cap = plugin.manifest.capabilities.find(c => c.name === capability);
  if (!cap) return { success: false, output: `Capability "${capability}" not found.`, latencyMs: 0 };

  const start = Date.now();
  const sandbox_required = true;
  const sandbox = typeof plugin.manifest.sandbox === 'object'
    ? plugin.manifest.sandbox
    : plugin.manifest.sandbox
      ? { enabled: true, mode: 'simulation' as const }
      : undefined;
  const decision = decidePluginInvocation({
    pluginId,
    pluginName: plugin.manifest.name,
    capability,
    description: cap.description,
    params,
    manifest: {
      name: plugin.manifest.name,
      entryPoint: plugin.manifest.entryPoint,
      permissions: plugin.manifest.permissions,
      signature: plugin.manifest.signature,
      sandbox,
      trustLevel: plugin.manifest.trustLevel,
    },
  });
  await auditPluginInvocationDecision({
    pluginId,
    pluginName: plugin.manifest.name,
    capability,
    description: cap.description,
    params,
    manifest: {
      name: plugin.manifest.name,
      entryPoint: plugin.manifest.entryPoint,
      permissions: plugin.manifest.permissions,
      signature: plugin.manifest.signature,
      sandbox,
      trustLevel: plugin.manifest.trustLevel,
    },
  }, decision);
  const latencyMs = Date.now() - start;
  plugin.invokeCount++;
  plugin.lastInvoked = new Date().toISOString();
  plugin.metrics.avgLatencyMs = Math.round((plugin.metrics.avgLatencyMs * (plugin.invokeCount - 1) + latencyMs) / plugin.invokeCount);
  plugin.metrics.successRate = +((plugin.metrics.successRate * (plugin.invokeCount - 1) + (decision.allowed ? 100 : 100)) / plugin.invokeCount).toFixed(1);
  save().catch(() => undefined);
  return { success: true, output: decision.output, latencyMs };
}

export function getPluginStats(): {
  total: number; loaded: number; unloaded: number; byType: Record<string, number>;
  totalInvocations: number;
} {
  const byType: Record<string, number> = {};
  let totalInvocations = 0;

  for (const p of plugins) {
    byType[p.manifest.type] = (byType[p.manifest.type] || 0) + 1;
    totalInvocations += p.invokeCount;
  }

  return {
    total: plugins.length,
    loaded: plugins.filter(p => p.status === 'loaded').length,
    unloaded: plugins.filter(p => p.status === 'unloaded').length,
    byType,
    totalInvocations,
  };
}
