import { exec } from "child_process";
import { createSoftwareFactoryAsset, type SoftwareFactoryAssetRecord } from "./softwareFactoryAssetService";
import { appendSoftwareFactoryExecutionLog, getSoftwareFactoryExecution } from "./softwareFactoryExecutionService";
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
  linkedAssetId?: string;
  linkedExecutionId?: string;
  linkedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareFactoryCommandLinkResult {
  command: SoftwareFactoryCommandRecord;
  asset: SoftwareFactoryAssetRecord;
  executionLinked: boolean;
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

function buildCommandAssetContent(record: SoftwareFactoryCommandRecord) {
  return [
    `# Command result: ${record.kind}`,
    "",
    `Command: ${record.command}`,
    `Status: ${record.status}`,
    `Exit code: ${record.exitCode ?? "pending"}`,
    `Duration: ${record.durationMs}ms`,
    `Updated: ${record.updatedAt}`,
    "",
    "## stdout",
    "```text",
    record.stdout || "No stdout.",
    "```",
    "",
    "## stderr",
    "```text",
    record.stderr || "No stderr.",
    "```",
  ].join("\n");
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

export function linkSoftwareFactoryCommandResult(commandId: string, executionId?: string): SoftwareFactoryCommandLinkResult | null {
  hydrate();
  const record = records.get(commandId);
  if (!record) return null;
  const execution = executionId ? getSoftwareFactoryExecution(executionId) : null;
  const runId = execution?.runId || "command-run";
  const asset = createSoftwareFactoryAsset({
    runId,
    kind: "log",
    title: `${record.kind} command result`,
    fileName: `${record.kind}-command-result.md`,
    content: buildCommandAssetContent(record),
    notes: `Linked from command ${record.id}`,
  });
  const timestamp = now();
  const updated: SoftwareFactoryCommandRecord = {
    ...record,
    linkedAssetId: asset.id,
    linkedExecutionId: execution?.id,
    linkedAt: timestamp,
    updatedAt: timestamp,
  };
  records.set(updated.id, updated);
  persist();
  const executionLinked = execution ? Boolean(appendSoftwareFactoryExecutionLog(execution.id, `linked command ${record.id} to asset ${asset.id}`)) : false;
  return { command: updated, asset, executionLinked };
}

export function getSoftwareFactoryCommandStats() {
  const all = listSoftwareFactoryCommandRuns();
  return {
    total: all.length,
    complete: all.filter((item) => item.status === "complete").length,
    failed: all.filter((item) => item.status === "failed").length,
    running: all.filter((item) => item.status === "running").length,
    linked: all.filter((item) => item.linkedAssetId).length,
    latest: all[0] || null,
  };
}
