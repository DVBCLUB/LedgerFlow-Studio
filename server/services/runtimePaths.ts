import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_RUNTIME_DIR = 'runtime';

function cwd() {
  return process.cwd();
}

export function runtimeRoot(): string {
  const configured = (process.env.LEDGERFLOW_RUNTIME_DIR || '').trim();
  if (configured) return path.resolve(cwd(), configured);
  return path.resolve(cwd(), DEFAULT_RUNTIME_DIR);
}

export function ensureRuntimeRootSync(): string {
  const root = runtimeRoot();
  fs.mkdirSync(root, { recursive: true });
  return root;
}

export function resolveRuntimeFilePath(fileName: string): string {
  return path.resolve(runtimeRoot(), fileName);
}

export function resolveRuntimeDirPath(dirName: string): string {
  return path.resolve(runtimeRoot(), dirName);
}

export function resolveRuntimePathFromEnv(envVar: string, defaultFileName: string): string {
  const override = (process.env[envVar] || '').trim();
  if (override) return path.resolve(cwd(), override);
  return resolveRuntimeFilePath(defaultFileName);
}

export function resolveRuntimeReadPathFromEnv(envVar: string, defaultFileName: string): string {
  const preferred = resolveRuntimePathFromEnv(envVar, defaultFileName);
  if (fs.existsSync(preferred)) return preferred;

  // Backward compatibility: read from legacy root location if present.
  const legacy = path.resolve(cwd(), defaultFileName);
  if (fs.existsSync(legacy)) return legacy;
  return preferred;
}

export function resolveRuntimeReadDirFromEnv(envVar: string, defaultDirName: string): string {
  const override = (process.env[envVar] || '').trim();
  const preferred = override ? path.resolve(cwd(), override) : resolveRuntimeDirPath(defaultDirName);
  if (fs.existsSync(preferred)) return preferred;

  const legacy = path.resolve(cwd(), defaultDirName);
  if (fs.existsSync(legacy)) return legacy;
  return preferred;
}
