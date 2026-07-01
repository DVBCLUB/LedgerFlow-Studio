import fs from "fs";
import { signRecord, verifyRecord } from "./signedRecords.ts";
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from "./runtimePaths.ts";

export type AuditActor = "founder" | "ai-agent" | "system" | "connector";
export type AuditRisk = "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
export type AuditStatus = "planned" | "sandbox" | "pending_approval" | "approved" | "rejected" | "executed" | "failed";

export interface AuditLogEntry {
  id: string;
  createdAt: string;
  actor: AuditActor;
  workspace: string;
  action: string;
  target: string;
  risk: AuditRisk;
  status: AuditStatus;
  summary: string;
  evidence?: Record<string, unknown>;
  approvalId?: string;
  connectorId?: string;
  previousSignature?: string;
  signature?: string;
}

const MAX_AUDIT_EVENTS = 500;
let auditWriteQueue = Promise.resolve();

function auditFilePath() {
  return resolveRuntimePathFromEnv("AUDIT_LOG_FILE", "ledgerflow_audit.log.json");
}

function nowIso(): string {
  return new Date().toISOString();
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(await fs.promises.readFile(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, payload: unknown): Promise<void> {
  await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8");
}

export async function appendAuditEvent(input: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry> {
  let entry!: AuditLogEntry;
  const operation = async () => {
    ensureRuntimeRootSync();
    const events = await readJsonFile<AuditLogEntry[]>(resolveRuntimeReadPathFromEnv("AUDIT_LOG_FILE", "ledgerflow_audit.log.json"), []);
    const unsigned: AuditLogEntry = { ...input, id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`, createdAt: nowIso(), previousSignature: events[0]?.signature };
    entry = { ...unsigned, signature: signRecord(unsigned) };
    events.unshift(entry);
    await writeJsonFile(auditFilePath(), events.slice(0, MAX_AUDIT_EVENTS));
  };
  const queued = auditWriteQueue.then(operation, operation);
  auditWriteQueue = queued.catch(() => undefined);
  await queued;
  return entry;
}

export async function readAuditEvents(limit = 100): Promise<AuditLogEntry[]> {
  await auditWriteQueue.catch(() => undefined);
  const events = await readJsonFile<AuditLogEntry[]>(resolveRuntimeReadPathFromEnv("AUDIT_LOG_FILE", "ledgerflow_audit.log.json"), []);
  return events.slice(0, Math.max(1, Math.min(limit, MAX_AUDIT_EVENTS)));
}

export async function verifyAuditChain(limit = MAX_AUDIT_EVENTS) {
  const events = await readAuditEvents(limit);
  const failures: string[] = [];
  events.forEach((entry, index) => {
    const { signature = '', ...unsigned } = entry;
    if (!signature || !verifyRecord(unsigned, signature)) failures.push(entry.id);
    const older = events[index + 1];
    if (older && entry.previousSignature !== older.signature) failures.push(`${entry.id}:chain`);
  });
  return { valid: failures.length === 0, checked: events.length, failures: [...new Set(failures)] };
}

export function integrationLevelToAuditRisk(level: "info" | "success" | "warning" | "error"): AuditRisk {
  if (level === "error") return "HIGH";
  if (level === "warning") return "MEDIUM";
  return "LOW";
}

export function integrationTypeToAuditStatus(type: "status" | "test" | "config" | "handoff" | "note", level: "info" | "success" | "warning" | "error"): AuditStatus {
  if (level === "error") return "failed";
  if (type === "handoff") return "executed";
  if (type === "config") return "approved";
  if (type === "test") return "sandbox";
  return "planned";
}
