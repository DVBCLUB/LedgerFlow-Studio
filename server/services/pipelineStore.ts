import fs from 'node:fs';
import path from 'node:path';
import type { Pipeline } from './pipelineOrchestrator';

let saveQueue = Promise.resolve();

function getStorageFile() {
  return path.resolve(process.cwd(), process.env.AGENT_PIPELINE_STORE_FILE || 'agent_pipelines.local.json');
}

async function readStore(): Promise<Record<string, Pipeline>> {
  const storageFile = getStorageFile();
  try {
    const parsed = JSON.parse(await fs.promises.readFile(storageFile, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error: any) {
    if (error?.code === 'ENOENT') return {};
    throw error;
  }
}

export function saveLocalPipeline(pipeline: Pipeline): Promise<void> {
  const operation = async () => {
    const storageFile = getStorageFile();
    const store = await readStore();
    store[pipeline.id] = pipeline;
    const tempFile = `${storageFile}.${process.pid}.${Date.now()}.tmp`;
    try {
      await fs.promises.writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8');
      await fs.promises.rename(tempFile, storageFile);
    } finally {
      await fs.promises.rm(tempFile, { force: true }).catch(() => undefined);
    }
  };
  const queued = saveQueue.then(operation, operation);
  saveQueue = queued.catch(() => undefined);
  return queued;
}

export async function getLocalPipeline(id: string): Promise<Pipeline | null> {
  const pending = saveQueue;
  await pending.catch(() => undefined);
  return (await readStore())[id] || null;
}
