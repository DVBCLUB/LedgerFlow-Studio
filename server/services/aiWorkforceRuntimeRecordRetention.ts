import fs from 'node:fs/promises';
import path from 'node:path';
import type { AIWorkforceRuntimeRecordType } from './aiWorkforceRuntimeStore.ts';

function runtimeStoreFile() {
  return process.env.AI_WORKFORCE_RUNTIME_STORE_FILE || 'ai_workforce_runtime.local.json';
}

async function readStore(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, any> : {};
  } catch (error: any) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
}

async function writeStore(filePath: string, store: Record<string, any>) {
  await fs.mkdir(path.dirname(path.resolve(filePath)), { recursive: true });
  const tempPath = `${filePath}.retention.${process.pid}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2));
  await fs.rename(tempPath, filePath);
}

export async function pruneRuntimeRecordsByType(options: { type: AIWorkforceRuntimeRecordType; keep: number }) {
  const keep = Math.max(0, Math.floor(options.keep));
  const filePath = runtimeStoreFile();
  const store = await readStore(filePath);
  const records = Object.values(store)
    .filter((record: any) => record?.type === options.type)
    .sort((a: any, b: any) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const removed = records.slice(keep);
  for (const record of removed as any[]) {
    if (record?.id && store[record.id]) delete store[record.id];
  }
  if (removed.length) await writeStore(filePath, store);
  return { type: options.type, keep, kept: Math.min(records.length, keep), removed: removed.length };
}
