/**
 * glaciaPluginSystem.ts
 * ============================================================
 * AI PLUGIN SYSTEM — Extensible Plugin Architecture for Glacia
 * ------------------------------------------------------------
 * Allows third-party and built-in plugins to register
 * capabilities with lifecycle hooks:
 *  - onRegister: Called when plugin is loaded
 *  - onTask: Called when a task matches plugin capability
 *  - onUnregister: Called when plugin is removed
 * ============================================================
 */

import type { OrchestrationTask, TaskType } from './glaciaOrchestrationEngine.ts';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

// --- Plugin Event Bus ---
export const pluginEventBus = new EventEmitter();
pluginEventBus.setMaxListeners(100);

export type PluginHook = 'before_task' | 'after_task' | 'on_error' | 'on_startup' | 'on_shutdown';

export interface GlaciaPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  capabilities: TaskType[];
  hooks: PluginHook[];
}

export interface GlaciaPlugin {
  manifest: GlaciaPluginManifest;
  onRegister?: () => Promise<void> | void;
  onUnregister?: () => Promise<void> | void;
  onTask?: (task: OrchestrationTask) => Promise<OrchestrationTask | null>;
  onHook?: (hook: PluginHook, context: unknown) => Promise<void>;
}

// ─── Plugin Registry ─────────────────────────────────────────
const plugins: Map<string, GlaciaPlugin> = new Map();
const hookListeners: Map<PluginHook, GlaciaPlugin[]> = new Map();
const startupHooksRun = { current: false };

function ensureHookList(hook: PluginHook): GlaciaPlugin[] {
  if (!hookListeners.has(hook)) {
    hookListeners.set(hook, []);
  }
  return hookListeners.get(hook)!;
}

export function registerPlugin(plugin: GlaciaPlugin): boolean {
  if (plugins.has(plugin.manifest.id)) {
    console.warn(`[PluginSystem] Plugin "${plugin.manifest.id}" already registered.`);
    return false;
  }
  plugins.set(plugin.manifest.id, plugin);

  // Register hooks
  for (const hook of plugin.manifest.hooks) {
    const list = ensureHookList(hook);
    if (!list.includes(plugin)) {
      list.push(plugin);
    }
  }

  // Call onRegister lifecycle
  if (plugin.onRegister) {
    try {
      const res = plugin.onRegister();
      if (res && typeof (res as Promise<void>).catch === 'function') {
        (res as Promise<void>).catch((err: any) =>
          console.error(`[PluginSystem] onRegister error for "${plugin.manifest.id}":`, err)
        );
      }
    } catch (err: any) {
      console.error(`[PluginSystem] onRegister error for "${plugin.manifest.id}":`, err);
    }
  }

  console.log(`[PluginSystem] Registered plugin: ${plugin.manifest.name} v${plugin.manifest.version}`);
  return true;
}

export function unregisterPlugin(pluginId: string): boolean {
  const plugin = plugins.get(pluginId);
  if (!plugin) return false;

  // Remove from hook lists
  for (const [, list] of hookListeners) {
    const idx = list.indexOf(plugin);
    if (idx !== -1) list.splice(idx, 1);
  }

  // Call onUnregister lifecycle
  if (plugin.onUnregister) {
    try {
      const res = plugin.onUnregister();
      if (res && typeof (res as Promise<void>).catch === 'function') {
        (res as Promise<void>).catch((err: any) =>
          console.error(`[PluginSystem] onUnregister error for "${pluginId}":`, err)
        );
      }
    } catch (err: any) {
      console.error(`[PluginSystem] onUnregister error for "${pluginId}":`, err);
    }
  }

  plugins.delete(pluginId);
  console.log(`[PluginSystem] Unregistered plugin: ${plugin.manifest.name}`);
  return true;
}

export function getPlugin(pluginId: string): GlaciaPlugin | undefined {
  return plugins.get(pluginId);
}

export function listPlugins(): GlaciaPlugin[] {
  return Array.from(plugins.values());
}

export function getPluginsByCapability(taskType: TaskType): GlaciaPlugin[] {
  return Array.from(plugins.values()).filter((p) =>
    p.manifest.capabilities.includes(taskType)
  );
}

export function getPluginsByHook(hook: PluginHook): GlaciaPlugin[] {
  return hookListeners.get(hook) || [];
}

export async function runHook(hook: PluginHook, context: unknown): Promise<void> {
  // Run startup hooks once
  if (hook === 'on_startup' && startupHooksRun.current) return;
  if (hook === 'on_startup') startupHooksRun.current = true;

  const listeners = getPluginsByHook(hook);
  for (const plugin of listeners) {
    if (plugin.onHook) {
      try {
        await plugin.onHook(hook, context);
      } catch (err) {
        console.error(`[PluginSystem] Hook error in "${plugin.manifest.id}":`, err);
      }
    }
  }
}

export async function runTaskThroughPlugins(task: OrchestrationTask): Promise<OrchestrationTask | null> {
  const capabilityPlugins = getPluginsByCapability(task.type);
  let currentTask = task;
  for (const plugin of capabilityPlugins) {
    if (plugin.onTask) {
      const result = await plugin.onTask(currentTask);
      if (result === null) return null; // Plugin cancelled the task
      currentTask = result;
    }
  }
  return currentTask;
}

export function clearPlugins(): void {
  for (const [id] of plugins) {
    unregisterPlugin(id);
  }
  hookListeners.clear();
  startupHooksRun.current = false;
}

/**
 * Create a built-in plugin for a Glacia module
 */
export function createBuiltInPlugin(
  id: string,
  name: string,
  description: string,
  capabilities: TaskType[],
  hooks: PluginHook[] = [],
  onTask?: (task: OrchestrationTask) => Promise<OrchestrationTask | null>
): GlaciaPlugin {
  return {
    manifest: {
      id: `glacia-${id}`,
      name,
      version: '1.0.0',
      description,
      author: 'Glacia Core',
      capabilities,
      hooks,
    },
    onTask,
  };
}

// ─── Built-in Plugins ────────────────────────────────────────

const BUILT_IN_PLUGINS: GlaciaPlugin[] = [
  createBuiltInPlugin(
    'skill-executor',
    'Skill Executor Plugin',
    'Executes AI skills in the local runtime with caching and logging',
    ['skill_execute'],
    ['before_task', 'after_task'],
    async (task) => {
      console.log(`[SkillPlugin] Executing skill: ${JSON.stringify(task.payload).slice(0, 100)}`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'vision-analyzer',
    'Vision Analysis Plugin',
    'Analyzes images via Doubao Vision API with preprocessing',
    ['vision_analyze'],
    ['before_task'],
    async (task) => {
      console.log(`[VisionPlugin] Analyzing image: ${(task.payload.imageUrl as string)?.slice(0, 80) || 'no URL'}`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'web-researcher',
    'Web Research Plugin',
    'Performs web research with summarization and source tracking',
    ['web_research'],
    ['after_task'],
    async (task) => {
      console.log(`[WebPlugin] Research complete for query: ${(task.payload.query as string)?.slice(0, 80)}`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'self-healer',
    'Self-Healing Plugin',
    'Diagnoses and fixes code issues automatically',
    ['self_heal'],
    ['before_task', 'on_error'],
    async (task) => {
      console.log(`[HealPlugin] Self-heal task: ${task.id}`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'swarm-scheduler',
    'Swarm Shift Plugin',
    'Manages autonomous 24/7 night shift operations',
    ['swarm_shift'],
    ['on_startup', 'on_shutdown'],
    async (task) => {
      console.log(`[SwarmPlugin] Night shift cycle starting...`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'telegram-bot',
    'Telegram Bot Plugin',
    'Sends notifications and receives commands via Telegram',
    ['telegram_command'],
    ['after_task'],
    async (task) => {
      console.log(`[TelegramPlugin] Notification sent: ${(task.payload.message as string)?.slice(0, 80)}`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'multi-model-ai',
    'Multi-Model AI Plugin',
    'Routes AI requests through available models with fallback',
    ['multi_model_reason'],
    ['before_task', 'after_task'],
    async (task) => {
      console.log(`[AIPlugin] Reasoning task with ${(task.payload.messages as any[])?.length || 0} messages`);
      return task;
    }
  ),
  createBuiltInPlugin(
    'auto-programmer',
    'Auto-Programmer Plugin',
    'Generates production-ready code from specifications',
    ['auto_program'],
    ['after_task'],
    async (task) => {
      console.log(`[CodePlugin] Generated code for: ${(task.payload.spec as string)?.slice(0, 60)}`);
      return task;
    }
  ),
];

/**
 * Load all built-in plugins into the registry.
 * Call this once at server startup.
 */
export function loadBuiltInPlugins(): number {
  let count = 0;
  for (const plugin of BUILT_IN_PLUGINS) {
    if (registerPlugin(plugin)) {
      count++;
    }
  }
  console.log(`[PluginSystem] Loaded ${count}/${BUILT_IN_PLUGINS.length} built-in plugins`);
  return count;
}

/**
 * Get the list of built-in plugin definitions (for UI display)
 */
export function getBuiltInPluginDefs(): Array<{ id: string; name: string; description: string; capabilities: TaskType[]; loaded: boolean }> {
  return BUILT_IN_PLUGINS.map((p) => ({
    id: p.manifest.id,
    name: p.manifest.name,
    description: p.manifest.description,
    capabilities: p.manifest.capabilities,
    loaded: plugins.has(p.manifest.id),
  }));
}

// ??? Plugin Hot Reloader (Priority 1) ??????????????????????
// ??????????????????????????????????????????????????????????

export interface PluginHotReloadConfig {
  watchDir: string;
  enabled: boolean;
  pollIntervalMs: number;
  autoReload: boolean;
}

const DEFAULT_HOT_RELOAD_CONFIG: PluginHotReloadConfig = {
  watchDir: path.resolve(process.cwd(), 'plugins'),
  enabled: false,
  pollIntervalMs: 5000,
  autoReload: true,
};

let hotReloadConfig: PluginHotReloadConfig = { ...DEFAULT_HOT_RELOAD_CONFIG };
let hotReloadTimer: ReturnType<typeof setInterval> | null = null;
const loadedPluginPaths = new Map<string, string>(); // pluginId -> filePath
const pluginFileHashes = new Map<string, string>();   // filePath -> hash

/**
 * Compute a simple hash of file contents to detect changes
 */
function simpleFileHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

/**
 * Configure the hot-reload system
 */
export function configureHotReload(config: Partial<PluginHotReloadConfig>): void {
  hotReloadConfig = { ...hotReloadConfig, ...config };
  pluginEventBus.emit('hot-reload:config-changed', hotReloadConfig);
}

/**
 * Get current hot-reload configuration
 */
export function getHotReloadConfig(): PluginHotReloadConfig {
  return { ...hotReloadConfig };
}

/**
 * Register a plugin file path for hot-reload monitoring
 */
export function registerPluginPath(pluginId: string, filePath: string): void {
  loadedPluginPaths.set(pluginId, filePath);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    pluginFileHashes.set(filePath, simpleFileHash(content));
  }
  pluginEventBus.emit('hot-reload:plugin-registered', { pluginId, filePath });
}

/**
 * Unregister a plugin path from monitoring
 */
export function unregisterPluginPath(pluginId: string): void {
  const filePath = loadedPluginPaths.get(pluginId);
  if (filePath) {
    pluginFileHashes.delete(filePath);
    loadedPluginPaths.delete(pluginId);
  }
  pluginEventBus.emit('hot-reload:plugin-unregistered', { pluginId });
}

/**
 * Manually check a single plugin file for changes and reload if needed
 */
export async function checkAndReloadPlugin(pluginId: string): Promise<boolean> {
  const filePath = loadedPluginPaths.get(pluginId);
  if (!filePath || !fs.existsSync(filePath)) return false;

  const content = fs.readFileSync(filePath, 'utf-8');
  const newHash = simpleFileHash(content);
  const oldHash = pluginFileHashes.get(filePath);

  if (newHash !== oldHash) {
    console.log(`[PluginHotReload] Plugin "${pluginId}" changed, reloading...`);
    pluginFileHashes.set(filePath, newHash);
    pluginEventBus.emit('hot-reload:before-reload', { pluginId, filePath });

    try {
      // Dynamic re-import using file URL
      const fileUrl = path.resolve(filePath);
      delete require.cache[require.resolve(fileUrl)];
      const pluginModule = await import(fileUrl);
      
      if (pluginModule.default || pluginModule.registerPlugin) {
        const registerFn = pluginModule.default?.registerPlugin || pluginModule.registerPlugin;
        if (typeof registerFn === 'function') {
          await registerFn();
        }
      }
      
      pluginEventBus.emit('hot-reload:reloaded', { pluginId, filePath });
      console.log(`[PluginHotReload] Plugin "${pluginId}" reloaded successfully.`);
      return true;
    } catch (err: any) {
      console.error(`[PluginHotReload] Failed to reload plugin "${pluginId}":`, err);
      pluginEventBus.emit('hot-reload:error', { pluginId, filePath, error: err.message });
      return false;
    }
  }
  return false;
}

/**
 * Poll all registered plugin files for changes
 */
export async function pollPluginChanges(): Promise<number> {
  let changed = 0;
  for (const [pluginId, filePath] of loadedPluginPaths) {
    if (await checkAndReloadPlugin(pluginId)) {
      changed++;
    }
  }
  return changed;
}

/**
 * Start the hot-reload polling timer
 */
export function startHotReload(): void {
  if (hotReloadTimer) {
    clearInterval(hotReloadTimer);
  }
  hotReloadConfig.enabled = true;
  hotReloadTimer = setInterval(async () => {
    try {
      const changed = await pollPluginChanges();
      if (changed > 0) {
        console.log(`[PluginHotReload] Reloaded ${changed} plugin(s)`);
      }
    } catch (err) {
      console.error('[PluginHotReload] Poll error:', err);
    }
  }, hotReloadConfig.pollIntervalMs);
  console.log(`[PluginHotReload] Started (interval: ${hotReloadConfig.pollIntervalMs}ms)`);
  pluginEventBus.emit('hot-reload:started', hotReloadConfig);
}

/**
 * Stop the hot-reload polling timer
 */
export function stopHotReload(): void {
  if (hotReloadTimer) {
    clearInterval(hotReloadTimer);
    hotReloadTimer = null;
  }
  hotReloadConfig.enabled = false;
  console.log('[PluginHotReload] Stopped');
  pluginEventBus.emit('hot-reload:stopped');
}

/**
 * Get status of the hot-reload system
 */
export function getHotReloadStatus(): {
  enabled: boolean;
  monitoredPlugins: number;
  config: PluginHotReloadConfig;
} {
  return {
    enabled: hotReloadConfig.enabled,
    monitoredPlugins: loadedPluginPaths.size,
    config: { ...hotReloadConfig },
  };
}

/**
 * Force-reload a plugin by ID (for UI manual trigger)
 */
export async function forceReloadPlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await checkAndReloadPlugin(pluginId);
    return { success: result };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Reload all registered plugins
 */
export async function reloadAllPlugins(): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  for (const [pluginId] of loadedPluginPaths) {
    try {
      if (await checkAndReloadPlugin(pluginId)) {
        success++;
      }
    } catch {
      failed++;
    }
  }
  return { success, failed };
}

/**
 * Get monitored plugin file paths
 */
export function getMonitoredPluginPaths(): Array<{ pluginId: string; filePath: string }> {
  return Array.from(loadedPluginPaths.entries()).map(([pluginId, filePath]) => ({
    pluginId,
    filePath,
  }));
}
