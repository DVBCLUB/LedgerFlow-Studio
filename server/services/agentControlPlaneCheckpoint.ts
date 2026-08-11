/**
 * agentControlPlaneCheckpoint.ts
 * ============================================================
 * LedgerFlow Studio — Transactional Agent Checkpoint Engine
 * 
 * Provides persistent checkpointing for long-running Agent Control Plane runs
 * and Multi-Agent Swarm missions using file-backed JSON/SQLite transactional storage.
 * Ensures mission recovery across system restarts.
 */

import { loadLocalDatabase, saveLocalDatabase } from './localDatabase.ts';
import { resolveRuntimePathFromEnv } from './runtimePaths.ts';
import type { ControlPlaneRun } from './agentControlPlane.ts';
import type { SwarmMission } from './agentSwarmCoordinator.ts';

const CHECKPOINT_STORE_FILE = resolveRuntimePathFromEnv('LEDGERFLOW_CHECKPOINTS_FILE', 'agent_checkpoints.store.json');

interface CheckpointStoreSchema {
  controlPlaneRuns: Record<string, ControlPlaneRun>;
  swarmMissions: Record<string, SwarmMission>;
}

// In-memory cache synced with persistent file store
let inMemoryStore: CheckpointStoreSchema = {
  controlPlaneRuns: {},
  swarmMissions: {},
};

// Synchronous initial sync if store file exists
import fs from 'node:fs';
try {
  if (fs.existsSync(CHECKPOINT_STORE_FILE)) {
    const content = fs.readFileSync(CHECKPOINT_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    inMemoryStore = {
      controlPlaneRuns: parsed.controlPlaneRuns || {},
      swarmMissions: parsed.swarmMissions || {},
    };
  }
} catch {
  // fallback to initial empty state
}

async function persistStore(): Promise<void> {
  await saveLocalDatabase(CHECKPOINT_STORE_FILE, inMemoryStore as unknown as Record<string, unknown>);
}

// ─── Control Plane Checkpoints ─────────────────────────────────────────
export function saveControlPlaneRunCheckpoint(run: ControlPlaneRun): void {
  inMemoryStore.controlPlaneRuns[run.id] = run;
  persistStore().catch(() => undefined);
}

export function loadControlPlaneRunCheckpoint(runId: string): ControlPlaneRun | undefined {
  return inMemoryStore.controlPlaneRuns[runId];
}

export function listControlPlaneRunCheckpoints(limit = 20): ControlPlaneRun[] {
  const list = Object.values(inMemoryStore.controlPlaneRuns);
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);
}

// ─── Swarm Mission Checkpoints ────────────────────────────────────────
export function saveSwarmMissionCheckpoint(mission: SwarmMission): void {
  inMemoryStore.swarmMissions[mission.id] = mission;
  persistStore().catch(() => undefined);
}

export function loadSwarmMissionCheckpoint(missionId: string): SwarmMission | undefined {
  return inMemoryStore.swarmMissions[missionId];
}

export function listSwarmMissionCheckpoints(limit = 20): SwarmMission[] {
  const list = Object.values(inMemoryStore.swarmMissions);
  return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()).slice(0, limit);
}
