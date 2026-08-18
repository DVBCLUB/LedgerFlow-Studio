/**
 * businessDataService.ts
 * ============================================================
 * Unified Business Data API — "trục xương sống" cho toàn công ty.
 *
 * Mọi bộ phận (Product/Marketing/Sales/Finance/Projects/Knowledge) và mọi AI
 * đọc/ghi qua 1 nơi này (thay vì localStorage rải rác). Dữ liệu local durable
 * + sync Supabase (best-effort). Handoff giữa bộ phận = truyền entity + link
 * qua trường id (campaign.product_id, lead.campaign_id, invoice.deal_id...).
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';
import { isSupabaseConfigured, supabaseAdmin } from './supabaseClient.ts';

export const BUSINESS_ENTITY_TYPES = [
  'product',
  'lead',
  'customer',
  'deal',
  'campaign',
  'invoice',
  'task',
  'knowledge',
] as const;

export type BusinessEntityType = (typeof BUSINESS_ENTITY_TYPES)[number];

export interface BusinessEntity {
  id: string;              // e.g. 'product_123' | 'lead_123'
  type: BusinessEntityType;
  data: Record<string, unknown>;  // fields tự do + link field (product_id, campaign_id, deal_id...)
  source: 'user' | 'ai' | 'workflow';
  createdAt: string;
  updatedAt: string;
}

const FILE = resolveRuntimePathFromEnv('BUSINESS_DATA_FILE', 'business_data.json');
const SQLITE_FILE = resolveRuntimePathFromEnv('BUSINESS_DATA_SQLITE_FILE', 'business_data.sqlite3');
const MAX_ENTITIES = 5000;

let cache: BusinessEntity[] | null = null;

// ─── SQLite (node:sqlite, Node ≥22) làm nguồn chính; JSON atomic làm backup ───
let sqliteDb: unknown = null;
let sqliteAttempted = false;

function getSqliteDb(): any | null {
  if (sqliteAttempted) return (sqliteDb as any) || null;
  sqliteAttempted = true;
  try {
    const req = typeof require === 'function' ? require : createRequire(import.meta.url);
    const { DatabaseSync } = req('node:sqlite') as { DatabaseSync: new (p: string) => any };
    const db = new DatabaseSync(SQLITE_FILE);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('CREATE TABLE IF NOT EXISTS business_doc (id INTEGER PRIMARY KEY CHECK (id = 1), doc TEXT NOT NULL)');
    sqliteDb = db;
    return db;
  } catch (err) {
    console.warn('[BusinessData] node:sqlite unavailable; using JSON store:', (err as Error).message);
    sqliteDb = null;
    return null;
  }
}

function readJsonArray(path: string): BusinessEntity[] | null {
  try {
    if (!fs.existsSync(path)) return null;
    const parsed = JSON.parse(fs.readFileSync(path, 'utf8'));
    return Array.isArray(parsed) ? (parsed as BusinessEntity[]) : null;
  } catch {
    return null;
  }
}

function load(): BusinessEntity[] {
  if (cache) return cache;
  const p = resolveRuntimeReadPathFromEnv('BUSINESS_DATA_FILE', 'business_data.json');
  const db = getSqliteDb();
  if (db) {
    try {
      const row = db.prepare('SELECT doc FROM business_doc WHERE id = 1').get() as { doc?: string } | undefined;
      if (row && row.doc) {
        const parsed = JSON.parse(row.doc);
        if (Array.isArray(parsed)) {
          cache = parsed as BusinessEntity[];
          return cache;
        }
      }
      // SQLite trống → migrate từ JSON file (nếu có).
      const fromJson = readJsonArray(p);
      if (fromJson && fromJson.length > 0) {
        cache = fromJson;
        save(cache);
        return cache;
      }
      cache = [];
      return cache;
    } catch (err) {
      console.error('[BusinessData] sqlite read failed; falling back to JSON:', err);
    }
  }
  // JSON fallback (atomic + .bak recovery)
  const main = readJsonArray(p);
  if (main) {
    cache = main;
    return cache;
  }
  // File chính thiếu/lỗi → phục hồi từ bản backup (.bak).
  const backup = readJsonArray(`${p}.bak`);
  if (backup) {
    console.warn('[BusinessData] main file missing/corrupt; recovered from .bak');
    cache = backup;
    save(cache);
    return cache;
  }
  cache = [];
  return cache;
}

function writeJsonAtomic(list: BusinessEntity[]): void {
  try {
    ensureRuntimeRootSync();
    const tmp = `${FILE}.tmp`;
    const bak = `${FILE}.bak`;
    // Giữ bản backup của file tốt trước khi ghi mới (atomic + chống mất dữ liệu khi crash).
    if (fs.existsSync(FILE)) {
      try {
        fs.copyFileSync(FILE, bak);
      } catch {
        // bỏ qua nếu copy backup lỗi — không chặn ghi dữ liệu chính.
      }
    }
    fs.writeFileSync(tmp, JSON.stringify(list, null, 2), 'utf8');
    fs.renameSync(tmp, FILE); // atomic replace trên cùng ổ đĩa
  } catch (err) {
    console.error('[BusinessData] persist failed:', err);
  }
}

function save(list: BusinessEntity[]): void {
  cache = list;
  const db = getSqliteDb();
  if (db) {
    try {
      db.prepare('INSERT INTO business_doc (id, doc) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET doc = excluded.doc')
        .run(JSON.stringify(list));
      // Vẫn ghi JSON atomic làm backup thứ cấp + khả năng hoàn nguyên.
      writeJsonAtomic(list);
      return;
    } catch (err) {
      console.error('[BusinessData] sqlite write failed; falling back to JSON:', err);
    }
  }
  writeJsonAtomic(list);
}

function newId(type: BusinessEntityType): string {
  return `${type}_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
}

export function listBusinessEntities(type?: BusinessEntityType, limit = 100): BusinessEntity[] {
  const list = load();
  const filtered = type ? list.filter((e) => e.type === type) : list;
  return filtered.slice(0, limit);
}

export function getBusinessEntity(id: string): BusinessEntity | undefined {
  return load().find((e) => e.id === id);
}

export function upsertBusinessEntity(input: {
  id?: string;
  type: BusinessEntityType;
  data: Record<string, unknown>;
  source?: BusinessEntity['source'];
}): BusinessEntity {
  const list = load();
  const now = new Date().toISOString();
  const id = input.id || newId(input.type);
  const existing = list.find((e) => e.id === id);
  if (existing) {
    existing.data = { ...existing.data, ...input.data };
    existing.updatedAt = now;
    if (input.source) existing.source = input.source;
    save(list);
    return existing;
  }
  const entity: BusinessEntity = {
    id,
    type: input.type,
    data: input.data,
    source: input.source || 'user',
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(entity);
  if (list.length > MAX_ENTITIES) list.length = MAX_ENTITIES;
  save(list);
  return entity;
}

export function deleteBusinessEntity(id: string): boolean {
  const list = load();
  const idx = list.findIndex((e) => e.id === id);
  if (idx < 0) return false;
  list.splice(idx, 1);
  save(list);
  return true;
}

export function setBusinessEntityStatus(id: string, status: string): BusinessEntity | undefined {
  const list = load();
  const entity = list.find((e) => e.id === id);
  if (!entity) return undefined;
  entity.data = { ...entity.data, status };
  entity.updatedAt = new Date().toISOString();
  save(list);
  return entity;
}

export function listBusinessStats() {
  const list = load();
  const byType: Record<string, number> = {};
  for (const e of list) byType[e.type] = (byType[e.type] || 0) + 1;
  return { total: list.length, byType };
}

export function searchBusinessEntities(query: string, filter?: { type?: BusinessEntityType; source?: string; limit?: number }): BusinessEntity[] {
  const list = load();
  const q = query.trim().toLowerCase();
  const limit = filter?.limit || 100;

  return list
    .filter((e) => {
      if (filter?.type && e.type !== filter.type) return false;
      if (filter?.source && e.source !== filter.source) return false;
      if (!q) return true;

      if (e.id && e.id.toLowerCase().includes(q)) return true;
      const dataStr = JSON.stringify(e.data || {}).toLowerCase();
      return dataStr.includes(q);
    })
    .slice(0, limit);
}

export function findEntityByField(type: BusinessEntityType, field: string, value: unknown): BusinessEntity | undefined {
  const list = load();
  const valStr = String(value).trim().toLowerCase();
  return list.find((e) => {
    if (e.type !== type) return false;
    const v = e.data[field];
    if (v === undefined || v === null) return false;
    return String(v).trim().toLowerCase() === valStr;
  });
}

export function getCompanyKPIs() {
  const list = load();
  let totalRevenueVnd = 0;
  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;
  let pendingInvoicesAmount = 0;
  let totalCustomers = 0;
  let totalProducts = 0;
  let totalCampaigns = 0;

  for (const e of list) {
    if (e.type === 'customer') totalCustomers++;
    if (e.type === 'product') totalProducts++;
    if (e.type === 'campaign') totalCampaigns++;

    if (e.type === 'invoice') {
      const amount = Number(e.data.amount || e.data.totalAmount || 0);
      const isPaid = e.data.status === 'paid' || e.data.isPaid === true;
      if (isPaid) {
        totalRevenueVnd += amount;
        paidInvoicesCount++;
      } else {
        pendingInvoicesCount++;
        pendingInvoicesAmount += amount;
      }
    }
  }

  return {
    totalRevenueVnd,
    paidInvoicesCount,
    pendingInvoicesCount,
    pendingInvoicesAmount,
    totalCustomers,
    totalProducts,
    totalCampaigns,
    totalEntities: list.length,
  };
}

export function exportEntitiesAsCsv(type?: BusinessEntityType): string {
  const list = type ? listBusinessEntities(type, 2000) : load();
  if (list.length === 0) return 'id,type,source,createdAt,updatedAt,data_summary\n';

  const headers = ['id', 'type', 'source', 'createdAt', 'updatedAt', 'data_summary'];
  const rows = list.map((e) => {
    const summary = JSON.stringify(e.data || {}).replace(/"/g, '""');
    return `"${e.id || ''}","${e.type || ''}","${e.source || 'user'}","${e.createdAt || ''}","${e.updatedAt || ''}","${summary}"`;
  });

  return [headers.join(','), ...rows].join('\n');
}

export function bulkImportBusinessEntities(
  items: Array<{ type: BusinessEntityType; data: Record<string, unknown>; source?: BusinessEntity['source']; id?: string }>
): { imported: number; updated: number; total: number } {
  let imported = 0;
  let updated = 0;
  for (const item of items) {
    const exists = item.id ? getBusinessEntity(item.id) : undefined;
    upsertBusinessEntity(item);
    if (exists) updated++;
    else imported++;
  }
  return { imported, updated, total: load().length };
}

export async function syncBusinessToSupabase(): Promise<{ synced: number; reason?: string }> {
  if (!isSupabaseConfigured()) return { synced: 0, reason: 'Supabase chưa cấu hình.' };
  const list = load();
  if (!list.length) return { synced: 0 };
  try {
    const sb = supabaseAdmin();
    const rows = list.map((e) => ({
      id: e.id,
      type: e.type,
      data: e.data,
      source: e.source,
      created_at: e.createdAt,
      updated_at: e.updatedAt,
    }));
    const { error } = await sb.from('business_entities').upsert(rows, { onConflict: 'id' });
    if (error) return { synced: 0, reason: error.message };
    return { synced: rows.length };
  } catch (err) {
    return { synced: 0, reason: err instanceof Error ? err.message : String(err) };
  }
}

