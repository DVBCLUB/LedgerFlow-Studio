/**
 * robotExecutionHistory.ts
 * ============================================================
 * Persistent storage for robot execution history.
 * Saves execution results to a runtime JSON file so history
 * survives page reloads and app restarts.
 */

import fs from 'node:fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';

export interface ExecutionHistoryEntry {
  id: string;
  toolType: 'blender' | 'ffmpeg' | 'canva' | 'photopea' | 'shell';
  summary: string;
  success: boolean;
  output: string;
  error?: string;
  executedAt: string;
}

const HISTORY_FILE = resolveRuntimePathFromEnv('ROBOT_EXECUTION_HISTORY_FILE', 'robot_execution_history.json');
const MAX_ENTRIES = 100;

let historyCache: ExecutionHistoryEntry[] | null = null;

function loadHistory(): ExecutionHistoryEntry[] {
  if (historyCache) return historyCache;
  try {
    const p = resolveRuntimeReadPathFromEnv('ROBOT_EXECUTION_HISTORY_FILE', 'robot_execution_history.json');
    if (!fs.existsSync(p)) {
      historyCache = [];
      return historyCache;
    }
    const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
    historyCache = Array.isArray(parsed) ? parsed : [];
    return historyCache;
  } catch {
    historyCache = [];
    return historyCache;
  }
}

function saveHistory(entries: ExecutionHistoryEntry[]): void {
  historyCache = entries;
  try {
    ensureRuntimeRootSync();
    const tmp = `${HISTORY_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(entries, null, 2), 'utf8');
    fs.renameSync(tmp, HISTORY_FILE);
  } catch (err) {
    console.error('[RobotExecutionHistory] persist failed:', err);
  }
}

export function getExecutionHistory(limit = 50): ExecutionHistoryEntry[] {
  const entries = loadHistory();
  return entries.slice(-limit).reverse();
}

export function appendExecutionHistory(entry: ExecutionHistoryEntry): void {
  const entries = loadHistory();
  entries.push(entry);
  // Trim oldest entries beyond max
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
  saveHistory(entries);
  // Broadcast to WebSocket clients
  try {
    const { broadcastRobotHistoryUpdate } = require('./robotHistoryWebSocketServer.ts');
    broadcastRobotHistoryUpdate(entry);
  } catch { /* WebSocket server may not be started yet */ }
}

export function clearExecutionHistory(): void {
  saveHistory([]);
}
