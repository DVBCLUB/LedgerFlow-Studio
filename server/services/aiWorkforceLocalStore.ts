import fs from 'node:fs/promises';
import path from 'node:path';

export interface AIWorkforceLocalStoreDriver<State extends Record<string, unknown>> {
  name: 'json-file';
  read(): Promise<State>;
  write(state: State): Promise<void>;
  clear(): Promise<void>;
  path(): string;
}

export interface JsonFileLocalStoreOptions<State extends Record<string, unknown>> {
  filePath: () => string;
  emptyState: () => State;
  normalizeState?: (parsed: unknown) => State;
  serializeState?: (state: State) => unknown;
}

export interface AIWorkforceLocalStore<State extends Record<string, unknown>> {
  driver: AIWorkforceLocalStoreDriver<State>;
  read(): Promise<State>;
  mutate<Result>(mutator: (state: State) => Result | Promise<Result>): Promise<Result>;
  clear(): Promise<void>;
  stats(): Promise<{
    driver: string;
    file: string;
    collections: string[];
    bytes: number;
    updatedAt: string | null;
  }>;
}

function safeJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function createJsonFileLocalStore<State extends Record<string, unknown>>(options: JsonFileLocalStoreOptions<State>): AIWorkforceLocalStore<State> {
  let saveQueue = Promise.resolve();

  const normalize = options.normalizeState || ((parsed: unknown) => ({ ...options.emptyState(), ...safeJsonObject(parsed) }) as State);
  const serialize = options.serializeState || ((state: State) => state);

  function storageFile() {
    return path.resolve(process.cwd(), options.filePath());
  }

  async function read(): Promise<State> {
    try {
      const parsed = JSON.parse(await fs.readFile(storageFile(), 'utf8'));
      return normalize(parsed);
    } catch (error: any) {
      if (error?.code === 'ENOENT') return options.emptyState();
      throw error;
    }
  }

  async function write(state: State) {
    const file = storageFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tempFile = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
    try {
      await fs.writeFile(tempFile, JSON.stringify(serialize(state), null, 2), 'utf8');
      await fs.rename(tempFile, file);
    } finally {
      await fs.rm(tempFile, { force: true }).catch(() => undefined);
    }
  }

  async function clear() {
    await fs.rm(storageFile(), { force: true }).catch(() => undefined);
  }

  function queued<Result>(operation: () => Promise<Result>) {
    const next = saveQueue.then(operation, operation);
    saveQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  const driver: AIWorkforceLocalStoreDriver<State> = {
    name: 'json-file',
    read,
    write,
    clear,
    path: storageFile,
  };

  return {
    driver,
    async read() {
      await saveQueue.catch(() => undefined);
      return read();
    },
    mutate<Result>(mutator: (state: State) => Result | Promise<Result>) {
      return queued(async () => {
        const state = await read();
        const result = await mutator(state);
        await write(state);
        return result;
      });
    },
    async clear() {
      await saveQueue.catch(() => undefined);
      await clear();
    },
    async stats() {
      await saveQueue.catch(() => undefined);
      const file = storageFile();
      let bytes = 0;
      let updatedAt: string | null = null;
      try {
        const stat = await fs.stat(file);
        bytes = stat.size;
        updatedAt = stat.mtime.toISOString();
      } catch (error: any) {
        if (error?.code !== 'ENOENT') throw error;
      }
      const state = await read();
      return {
        driver: driver.name,
        file,
        collections: Object.keys(state).sort(),
        bytes,
        updatedAt,
      };
    },
  };
}
