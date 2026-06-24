import { readSoftwareFactoryStore, writeSoftwareFactoryStore } from "./softwareFactoryStore";

export type SoftwareFactoryAuditLevel = "info" | "success" | "warning" | "error";
export type SoftwareFactoryAuditArea = "run" | "execution" | "provider" | "asset" | "release" | "command" | "git" | "system";

export interface SoftwareFactoryAuditEvent {
  id: string;
  area: SoftwareFactoryAuditArea;
  level: SoftwareFactoryAuditLevel;
  title: string;
  detail: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SoftwareFactoryAuditInput {
  area: SoftwareFactoryAuditArea;
  level?: SoftwareFactoryAuditLevel;
  title: string;
  detail: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

const STORE_NAME = "audit-events";
const events = new Map<string, SoftwareFactoryAuditEvent>();

function now() {
  return new Date().toISOString();
}

function createId(prefix = "sfaudit") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function hydrate() {
  if (events.size > 0) return;
  for (const event of readSoftwareFactoryStore<SoftwareFactoryAuditEvent>(STORE_NAME)) {
    events.set(event.id, event);
  }
}

function persist() {
  writeSoftwareFactoryStore(STORE_NAME, Array.from(events.values()));
}

export function recordSoftwareFactoryAuditEvent(input: SoftwareFactoryAuditInput) {
  hydrate();
  const event: SoftwareFactoryAuditEvent = {
    id: createId(),
    area: input.area,
    level: input.level || "info",
    title: input.title,
    detail: input.detail,
    entityId: input.entityId,
    metadata: input.metadata,
    createdAt: now(),
  };
  events.set(event.id, event);
  persist();
  return event;
}

export function listSoftwareFactoryAuditEvents(area?: SoftwareFactoryAuditArea) {
  hydrate();
  const all = Array.from(events.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return area ? all.filter((event) => event.area === area) : all;
}

export function getSoftwareFactoryAuditEvent(id: string) {
  hydrate();
  return events.get(id) || null;
}

export function seedSoftwareFactoryAuditEvents() {
  hydrate();
  if (events.size > 0) return listSoftwareFactoryAuditEvents();
  recordSoftwareFactoryAuditEvent({ area: "system", level: "info", title: "Runtime initialized", detail: "Software Factory runtime store is ready." });
  recordSoftwareFactoryAuditEvent({ area: "provider", level: "success", title: "Provider profiles loaded", detail: "Provider runtime profiles are available for execution decisions." });
  recordSoftwareFactoryAuditEvent({ area: "command", level: "info", title: "Command catalog loaded", detail: "Workspace command catalog is available for typecheck, lint, test and build checks." });
  return listSoftwareFactoryAuditEvents();
}

export function getSoftwareFactoryAuditStats() {
  const all = listSoftwareFactoryAuditEvents();
  return {
    total: all.length,
    info: all.filter((event) => event.level === "info").length,
    success: all.filter((event) => event.level === "success").length,
    warning: all.filter((event) => event.level === "warning").length,
    error: all.filter((event) => event.level === "error").length,
    latest: all[0] || null,
  };
}
