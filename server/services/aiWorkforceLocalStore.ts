import fs from 'node:fs/promises';
import path from 'node:path';

export type AIWorkforceLocalStoreDriverName = 'json-file' | 'sqlite-ready';

export interface AIWorkforceLocalStoreDriver<State extends Record<string, unknown>> {
  name: AIWorkforceLocalStoreDriverName;
  read(): Promise<State>;
  write(state: State): Promise<void>;
  clear(): Promise<void>;
  path(): string;
  collections?(): Promise<string[]> | string[];
  bytes?(): Promise<number> | number;
  updatedAt?(): Promise<string | null> | string | null;
}

export interface JsonFileLocalStoreOptions<State extends Record<string, unknown>> {
  filePath: () => string;
  emptyState: () => State;
  normalizeState?: (parsed: unknown) => State;
  serializeState?: (state: State) => unknown;
}

export interface SQLiteReadyLocalStoreEngine {
  path(): string;
  ensureSchema(): Promise<void>;
  readJson(key: string): Promise<unknown | null>;
  writeJson(key: string, value: unknown): Promise<void>;
  deleteKey(key: string): Promise<void>;
  stats?(): Promise<{ bytes?: number; updatedAt?: string | null }>;
}

export interface SQLiteReadyLocalStoreOptions<State extends Record<string, unknown>> {
  key: string;
  engine: SQLiteReadyLocalStoreEngine;
  emptyState: () => State;
  normalizeState?: (parsed: unknown) => State;
  serializeState?: (state: State) => unknown;
}

export interface ConfiguredAIWorkforceLocalStoreOptions<State extends Record<string, unknown>> extends JsonFileLocalStoreOptions<State> {
  key: string;
  driverName?: AIWorkforceLocalStoreDriverName;
  sqliteReadyEngine?: SQLiteReadyLocalStoreEngine;
}

export interface AIWorkforceLocalStoreSnapshot<State extends Record<string, unknown>> {
  version: 1;
  exportedAt: string;
  driver: AIWorkforceLocalStoreDriverName;
  file: string;
  state: State;
}

export interface AIWorkforceLocalStoreMigrationPlan {
  fromDriver: AIWorkforceLocalStoreDriverName;
  toDriver: AIWorkforceLocalStoreDriverName;
  requiresExternalEngine: boolean;
  steps: string[];
}

export interface AIWorkforceLocalStore<State extends Record<string, unknown>> {
  driver: AIWorkforceLocalStoreDriver<State>;
  read(): Promise<State>;
  mutate<Result>(mutator: (state: State) => Result | Promise<Result>): Promise<Result>;
  clear(): Promise<void>;
  exportSnapshot(): Promise<AIWorkforceLocalStoreSnapshot<State>>;
  importSnapshot(snapshot: AIWorkforceLocalStoreSnapshot<State> | State): Promise<State>;
  migrationPlan(targetDriver: AIWorkforceLocalStoreDriverName): AIWorkforceLocalStoreMigrationPlan;
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

function defaultNormalize<State extends Record<string, unknown>>(emptyState: () => State) {
  return (parsed: unknown) => ({ ...emptyState(), ...safeJsonObject(parsed) }) as State;
}

function isSnapshot<State extends Record<string, unknown>>(value: AIWorkforceLocalStoreSnapshot<State> | State): value is AIWorkforceLocalStoreSnapshot<State> {
  return Boolean(value && typeof value === 'object' && (value as AIWorkforceLocalStoreSnapshot<State>).version === 1 && (value as AIWorkforceLocalStoreSnapshot<State>).state);
}

export function resolveAIWorkforceLocalStoreDriverName(value = process.env.AI_WORKFORCE_STORAGE_DRIVER): AIWorkforceLocalStoreDriverName {
  if (!value || value === 'json' || value === 'json-file') return 'json-file';
  if (value === 'sqlite' || value === 'sqlite-ready') return 'sqlite-ready';
  throw new Error(`Unsupported AI Workforce storage driver: ${value}. Expected json-file or sqlite-ready.`);
}

export function buildAIWorkforceLocalStoreMigrationPlan(fromDriver: AIWorkforceLocalStoreDriverName, toDriver: AIWorkforceLocalStoreDriverName): AIWorkforceLocalStoreMigrationPlan {
  const sameDriver = fromDriver === toDriver;
  return {
    fromDriver,
    toDriver,
    requiresExternalEngine: toDriver === 'sqlite-ready',
    steps: sameDriver
      ? ['No migration is required because source and target storage drivers match.']
      : [
        'Export a versioned AIWorkforceLocalStoreSnapshot from the source store.',
        'Validate the snapshot version and normalized state shape.',
        toDriver === 'sqlite-ready' ? 'Initialize the SQLite/SQLCipher engine and ensure schema exists.' : 'Initialize the JSON file driver path.',
        'Import the snapshot state into the target store through the same local-first facade.',
        'Run runtime dashboard smoke checks and compare storage stats before switching traffic.',
      ],
  };
}

function createQueuedLocalStore<State extends Record<string, unknown>>(driver: AIWorkforceLocalStoreDriver<State>): AIWorkforceLocalStore<State> {
  let saveQueue = Promise.resolve();

  function queued<Result>(operation: () => Promise<Result>) {
    const next = saveQueue.then(operation, operation);
    saveQueue = next.then(() => undefined, () => undefined);
    return next;
  }

  return {
    driver,
    async read() {
      await saveQueue.catch(() => undefined);
      return driver.read();
    },
    mutate<Result>(mutator: (state: State) => Result | Promise<Result>) {
      return queued(async () => {
        const state = await driver.read();
        const result = await mutator(state);
        await driver.write(state);
        return result;
      });
    },
    async clear() {
      await saveQueue.catch(() => undefined);
      await driver.clear();
    },
    async exportSnapshot() {
      await saveQueue.catch(() => undefined);
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        driver: driver.name,
        file: driver.path(),
        state: await driver.read(),
      };
    },
    importSnapshot(snapshot: AIWorkforceLocalStoreSnapshot<State> | State) {
      return queued(async () => {
        const state = isSnapshot(snapshot) ? snapshot.state : snapshot;
        await driver.write(state);
        return state;
      });
    },
    migrationPlan(targetDriver: AIWorkforceLocalStoreDriverName) {
      return buildAIWorkforceLocalStoreMigrationPlan(driver.name, targetDriver);
    },
    async stats() {
      await saveQueue.catch(() => undefined);
      const state = await driver.read();
      const collections = driver.collections ? await driver.collections() : Object.keys(state).sort();
      const bytes = driver.bytes ? await driver.bytes() : 0;
      const updatedAt = driver.updatedAt ? await driver.updatedAt() : null;
      return {
        driver: driver.name,
        file: driver.path(),
        collections,
        bytes,
        updatedAt,
      };
    },
  };
}

export function createJsonFileLocalStore<State extends Record<string, unknown>>(options: JsonFileLocalStoreOptions<State>): AIWorkforceLocalStore<State> {
  const normalize = options.normalizeState || defaultNormalize(options.emptyState);
  const serialize = options.serializeState || ((state: State) => state);

  function storageFile() {
    return path.resolve(process.cwd(), options.filePath());
  }

  const driver: AIWorkforceLocalStoreDriver<State> = {
    name: 'json-file',
    async read(): Promise<State> {
      try {
        const parsed = JSON.parse(await fs.readFile(storageFile(), 'utf8'));
        return normalize(parsed);
      } catch (error: any) {
        if (error?.code === 'ENOENT') return options.emptyState();
        throw error;
      }
    },
    async write(state: State) {
      const file = storageFile();
      await fs.mkdir(path.dirname(file), { recursive: true });
      const tempFile = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
      try {
        await fs.writeFile(tempFile, JSON.stringify(serialize(state), null, 2), 'utf8');
        await fs.rename(tempFile, file);
      } finally {
        await fs.rm(tempFile, { force: true }).catch(() => undefined);
      }
    },
    async clear() {
      await fs.rm(storageFile(), { force: true }).catch(() => undefined);
    },
    path: storageFile,
    async bytes() {
      try {
        return (await fs.stat(storageFile())).size;
      } catch (error: any) {
        if (error?.code === 'ENOENT') return 0;
        throw error;
      }
    },
    async updatedAt() {
      try {
        return (await fs.stat(storageFile())).mtime.toISOString();
      } catch (error: any) {
        if (error?.code === 'ENOENT') return null;
        throw error;
      }
    },
  };

  return createQueuedLocalStore(driver);
}

export function createSQLiteReadyLocalStore<State extends Record<string, unknown>>(options: SQLiteReadyLocalStoreOptions<State>): AIWorkforceLocalStore<State> {
  const normalize = options.normalizeState || defaultNormalize(options.emptyState);
  const serialize = options.serializeState || ((state: State) => state);

  const driver: AIWorkforceLocalStoreDriver<State> = {
    name: 'sqlite-ready',
    async read() {
      await options.engine.ensureSchema();
      const parsed = await options.engine.readJson(options.key);
      if (parsed === null || parsed === undefined) return options.emptyState();
      return normalize(parsed);
    },
    async write(state: State) {
      await options.engine.ensureSchema();
      await options.engine.writeJson(options.key, serialize(state));
    },
    async clear() {
      await options.engine.ensureSchema();
      await options.engine.deleteKey(options.key);
    },
    path: () => options.engine.path(),
    collections: async () => Object.keys(await driver.read()).sort(),
    async bytes() {
      return (await options.engine.stats?.())?.bytes || 0;
    },
    async updatedAt() {
      return (await options.engine.stats?.())?.updatedAt || null;
    },
  };

  return createQueuedLocalStore(driver);
}

export function createConfiguredAIWorkforceLocalStore<State extends Record<string, unknown>>(options: ConfiguredAIWorkforceLocalStoreOptions<State>): AIWorkforceLocalStore<State> {
  const driverName = options.driverName || resolveAIWorkforceLocalStoreDriverName();
  if (driverName === 'json-file') return createJsonFileLocalStore(options);
  if (!options.sqliteReadyEngine) {
    throw new Error('AI_WORKFORCE_STORAGE_DRIVER=sqlite-ready requires a SQLiteReadyLocalStoreEngine.');
  }
  return createSQLiteReadyLocalStore({
    key: options.key,
    engine: options.sqliteReadyEngine,
    emptyState: options.emptyState,
    normalizeState: options.normalizeState,
    serializeState: options.serializeState,
  });
}
