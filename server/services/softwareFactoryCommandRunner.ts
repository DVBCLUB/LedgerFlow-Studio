import { exec } from "child_process";
import { readSoftwareFactoryStore, writeSoftwareFactoryStore } from "./softwareFactoryStore";

export type SoftwareFactoryCommandKind = "typecheck" | "lint" | "test" | "build" | "preview";
export type SoftwareFactoryCommandStatus = "queued" | "running" | "complete" | "failed";

export interface SoftwareFactoryCommandRecord {
  id: string;
  kind: SoftwareFactoryCommandKind;
  command: string;
  status: SoftwareFactoryCommandStatus;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  createdAt: string;
  updatedAt: string;
}

const STORE_NAME = "command-runs";
const records = new Map<string, SoftwareFactoryCommandRecord>();
const commandCatalog: Record<SoftwareFactoryCommandKind, string[]> = {
  typecheck: ["npm run typecheck", "npm run check", "npx tsc --noEmit"],
  lint: ["npm run lint"],
  test: ["npm test", "npm run test"],
  build: ["npm run build"],
  preview: ["npm run preview"],
};

function now() {
  return new Date().toISOString();
}

function createId(prefix = "sfc") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hydrate() {
  if (records.size > 0) return;
  for (const record of readSoftwareFactoryStore<SoftwareFactoryCommandRecord>(STORE_NAME)) {
    records.set(record.id, record);
  }
}

function persist() {
  writeSoftwareFactoryStore(STORE_NAME, Array.from(records.values()));
}

function runShellCommand(command: string): Promise<{ exitCode: number; stdout: string; stderr: string; durationMs: number }> {
  const started = Date.now();
  return new Promise((resolve) => {
    exec(command, { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024, timeout: 120_000 }, (error, stdout, stderr) => {
      resolve({
        exitCode: typeof (error as any)?.code === "number" ? (error as any).code : error ? 1 : 0,
        stdout: stdout.slice(-8000),
        stderr: stderr.slice(-8000),
        durationMs: Date.now() - started,
      });
    });
  });
}

export function listSoftwareFactoryCommandCatalog() {
  return Object.entries(commandCatalog).map(([kind, commands]) => ({ kind, commands }));
}

export function listSoftwareFactoryCommandRuns() {
  hydrate();
  return Array.from(records.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSoftwareFactoryCommandRun(id: string) {
  hydrate();
  return records.get(id) || null;
}

export async function runSoftwareFactoryCommand(kind: SoftwareFactoryCommandKind, commandIndex = 0) {
  hydrate();
  const commands = commandCatalog[kind];
  const command = commands?.[commandIndex];
  if (!command) return null;

  const timestamp = now();
  const record: SoftwareFactoryCommandRecord = {
    id: createId(),
    kind,
    command,
    status: "running",
    exitCode: null,
    stdout: "",
    stderr: "",
    durationMs: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  records.set(record.id, record);
  persist();

  const result = await runShellCommand(command);
  const updated: SoftwareFactoryCommandRecord = {
    ...record,
    status: result.exitCode === 0 ? "complete" : "failed",
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
    updatedAt: now(),
  };
  records.set(updated.id, updated);
  persist();
  return updated;
}

export function getSoftwareFactoryCommandStats() {
  const all = listSoftwareFactoryCommandRuns();
  return {
    total: all.length,
    complete: all.filter((item) => item.status === "complete").length,
    failed: all.filter((item) => item.status === "failed").length,
    running: all.filter((item) => item.status === "running").length,
    latest: all[0] || null,
  };
}
