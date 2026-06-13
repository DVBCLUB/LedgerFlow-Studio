import fs from "fs";
import path from "path";

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
}

const AUDIT_FILE = path.join(process.cwd(), "ledgerflow_audit.log.json");
const MAX_AUDIT_EVENTS = 500;

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
  const events = await readJsonFile<AuditLogEntry[]>(AUDIT_FILE, []);
  const entry: AuditLogEntry = {
    ...input,
    id: `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
  };
  events.unshift(entry);
  await writeJsonFile(AUDIT_FILE, events.slice(0, MAX_AUDIT_EVENTS));
  return entry;
}

export async function readAuditEvents(limit = 100): Promise<AuditLogEntry[]> {
  const events = await readJsonFile<AuditLogEntry[]>(AUDIT_FILE, []);
  return events.slice(0, Math.max(1, Math.min(limit, MAX_AUDIT_EVENTS)));
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
