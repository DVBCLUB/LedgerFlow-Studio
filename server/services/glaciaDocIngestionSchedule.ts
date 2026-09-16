/**
 * server/services/glaciaDocIngestionSchedule.ts
 * Quản lý lịch trình cào và nạp tài liệu tự động (Continuous Documentation Ingestion Schedule).
 */

import fs from 'fs';
import path from 'path';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export interface DocIngestionTarget {
  id: string;
  name: string;
  url: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  maxPages: number;
  lastCrawledAt?: string;
  totalChunksIngested?: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  enabled: boolean;
}

const SCHEDULE_FILE = path.join(resolveRuntimeDirPath('glacia'), 'doc_ingestion_schedule.json');

const DEFAULT_TARGETS: DocIngestionTarget[] = [
  {
    id: 'blender_python_api',
    name: 'Blender 4.x Python API Reference',
    url: 'https://docs.blender.org/api/current/',
    category: 'blender_3d',
    frequency: 'weekly',
    maxPages: 25,
    status: 'idle',
    enabled: true,
  },
  {
    id: 'ffmpeg_filters_guide',
    name: 'FFmpeg Filters & Encoding Documentation',
    url: 'https://ffmpeg.org/ffmpeg-filters.html',
    category: 'video_ffmpeg',
    frequency: 'weekly',
    maxPages: 15,
    status: 'idle',
    enabled: true,
  },
  {
    id: 'godot_gdscript_docs',
    name: 'Godot 4 GDScript & Engine API',
    url: 'https://docs.godotengine.org/en/stable/',
    category: 'game_engine',
    frequency: 'weekly',
    maxPages: 20,
    status: 'idle',
    enabled: true,
  },
  {
    id: 'tailwind_css_docs',
    name: 'Tailwind CSS Documentation',
    url: 'https://tailwindcss.com/docs',
    category: 'fullstack_code',
    frequency: 'weekly',
    maxPages: 20,
    status: 'idle',
    enabled: true,
  },
];

function loadSchedule(): DocIngestionTarget[] {
  try {
    if (!fs.existsSync(SCHEDULE_FILE)) {
      const dir = path.dirname(SCHEDULE_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(DEFAULT_TARGETS, null, 2), 'utf8');
      return DEFAULT_TARGETS;
    }
    const raw = fs.readFileSync(SCHEDULE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TARGETS;
  }
}

function saveSchedule(targets: DocIngestionTarget[]): void {
  try {
    const dir = path.dirname(SCHEDULE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(targets, null, 2), 'utf8');
  } catch {}
}

export function listDocIngestionTargets(): DocIngestionTarget[] {
  return loadSchedule();
}

export function updateDocIngestionTarget(id: string, updates: Partial<DocIngestionTarget>): DocIngestionTarget | undefined {
  const targets = loadSchedule();
  const idx = targets.findIndex((t) => t.id === id);
  if (idx < 0) return undefined;
  targets[idx] = { ...targets[idx], ...updates };
  saveSchedule(targets);
  return targets[idx];
}

export function addDocIngestionTarget(target: Omit<DocIngestionTarget, 'id' | 'status'>): DocIngestionTarget {
  const targets = loadSchedule();
  const id = `target_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const full: DocIngestionTarget = { id, status: 'idle', ...target };
  targets.push(full);
  saveSchedule(targets);
  return full;
}
