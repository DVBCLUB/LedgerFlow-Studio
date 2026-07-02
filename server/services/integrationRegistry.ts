import fs from "fs";
import { appendAuditEvent, integrationLevelToAuditRisk, integrationTypeToAuditStatus } from "./auditLog";
import { getGitHubSummary } from "./githubConnector";
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from "./runtimePaths";

export type IntegrationStatus = "connected" | "local" | "manual" | "planned" | "error";
export type IntegrationCategory = "ai" | "devops" | "workspace" | "accounting" | "documents" | "automation" | "data";
export type IntegrationPriority = "P0" | "P1" | "P2" | "P3";

export interface IntegrationConnector {
  id: string;
  title: string;
  subtitle: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  priority: IntegrationPriority;
  enabled: boolean;
  url?: string;
  localCommand?: string;
  notes: string;
  capabilities: string[];
  quickActions: Array<{ label: string; href?: string; hash?: string }>;
  lastCheckedAt?: string;
  lastMessage?: string;
}

export interface IntegrationEvent {
  id: string;
  connectorId: string;
  type: "status" | "test" | "config" | "handoff" | "note";
  message: string;
  level: "info" | "success" | "warning" | "error";
  createdAt: string;
}

const REGISTRY_FILE = resolveRuntimePathFromEnv("INTEGRATION_REGISTRY_FILE", "integration_registry.json");
const EVENTS_FILE = resolveRuntimePathFromEnv("INTEGRATION_EVENTS_FILE", "integration_events.log.json");

const defaultConnectors: IntegrationConnector[] = [
  {
    id: "ai-gateway",
    title: "AI Gateway",
    subtitle: "Provider AI dùng chung cho các tác vụ cần AI.",
    category: "ai",
    status: "manual",
    priority: "P0",
    enabled: true,
    notes: "Chỉ cấu hình khi cần dùng AI.",
    capabilities: ["Quản lý provider", "Kiểm tra key", "Vault backend"],
    quickActions: [{ label: "AI settings", hash: "/ai_settings" }],
  },
  {
    id: "github",
    title: "GitHub",
    subtitle: "Lưu code, xem diff, issue và CI.",
    category: "devops",
    status: "manual",
    priority: "P0",
    enabled: true,
    url: "https://github.com/DVBCLUB/LedgerFlow-Studio",
    notes: "Dùng để review code và theo dõi thay đổi.",
    capabilities: ["Repo", "Issues", "Actions"],
    quickActions: [
      { label: "Repo", href: "https://github.com/DVBCLUB/LedgerFlow-Studio" },
      { label: "Actions", href: "https://github.com/DVBCLUB/LedgerFlow-Studio/actions" },
    ],
  },
  {
    id: "replit-local",
    title: "Replit / Local",
    subtitle: "Chạy preview và xem lỗi terminal.",
    category: "devops",
    status: "manual",
    priority: "P0",
    enabled: true,
    notes: "Dùng để chạy app, review giao diện và đọc lỗi.",
    capabilities: ["Preview", "Terminal", "Logs"],
    quickActions: [],
  },
  {
    id: "data-hub",
    title: "Data Hub",
    subtitle: "Import/export dữ liệu khi cần.",
    category: "data",
    status: "local",
    priority: "P1",
    enabled: true,
    notes: "Chỉ mở khi cần xử lý dữ liệu.",
    capabilities: ["CSV", "Excel", "JSON"],
    quickActions: [],
  },
  {
    id: "automation",
    title: "Automation",
    subtitle: "Webhook/n8n/Make cho tác vụ lặp lại.",
    category: "automation",
    status: "planned",
    priority: "P2",
    enabled: false,
    notes: "Ẩn khỏi luồng chính cho đến khi cần tự động hóa thật.",
    capabilities: ["Webhook", "Reminder", "Scheduled sync"],
    quickActions: [],
  },
];

type SavedConnectorPatch = Partial<Pick<IntegrationConnector, "enabled" | "status" | "priority" | "url" | "localCommand" | "lastCheckedAt" | "lastMessage">>;

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

function savedPatch(item: IntegrationConnector | undefined): SavedConnectorPatch {
  if (!item) return {};
  return {
    enabled: item.enabled,
    status: item.status,
    priority: item.priority,
    url: item.url,
    localCommand: item.localCommand,
    lastCheckedAt: item.lastCheckedAt,
    lastMessage: item.lastMessage,
  };
}

function mergeWithDefaults(saved: IntegrationConnector[]): IntegrationConnector[] {
  const savedById = new Map(saved.map((item) => [item.id, item]));
  return defaultConnectors
    .map((item) => ({ ...item, ...savedPatch(savedById.get(item.id)) }))
    .sort((a, b) => a.priority.localeCompare(b.priority) || a.title.localeCompare(b.title));
}

export async function listIntegrationConnectors(): Promise<IntegrationConnector[]> {
  const saved = await readJsonFile<IntegrationConnector[]>(resolveRuntimeReadPathFromEnv("INTEGRATION_REGISTRY_FILE", "integration_registry.json"), []);
  const merged = mergeWithDefaults(saved);
  ensureRuntimeRootSync();
  await writeJsonFile(REGISTRY_FILE, merged);
  return merged;
}

export async function updateIntegrationConnector(id: string, patch: Partial<Pick<IntegrationConnector, "enabled" | "status" | "priority" | "url" | "localCommand" | "notes">>): Promise<IntegrationConnector> {
  const connectors = await listIntegrationConnectors();
  const index = connectors.findIndex((item) => item.id === id);
  if (index < 0) throw new Error(`Integration connector not found: ${id}`);

  const safePatch: SavedConnectorPatch = {
    enabled: patch.enabled,
    status: patch.status,
    priority: patch.priority,
    url: patch.url,
    localCommand: patch.localCommand,
  };
  connectors[index] = { ...connectors[index], ...safePatch };
  ensureRuntimeRootSync();
  await writeJsonFile(REGISTRY_FILE, connectors);
  await appendIntegrationEvent({ connectorId: id, type: "config", level: "info", message: "Connector updated." });
  return connectors[index];
}

export async function testIntegrationConnector(id: string): Promise<IntegrationConnector> {
  const connectors = await listIntegrationConnectors();
  const connector = connectors.find((item) => item.id === id);
  if (!connector) throw new Error(`Integration connector not found: ${id}`);

  let status: IntegrationStatus = connector.enabled ? connector.status : "planned";
  let message = connector.enabled ? "Connector is ready." : "Connector is disabled.";

  if (connector.id === "github" && connector.url && connector.enabled) {
    try {
      const summary = await getGitHubSummary(connector.url);
      status = "connected";
      message = `GitHub ready: ${summary.repo}.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "GitHub check failed.";
    }
  } else if (connector.id === "ai-gateway") {
    status = "manual";
    message = "AI Gateway is available when provider keys are configured.";
  } else if (connector.id === "replit-local") {
    status = "manual";
    message = "Use Replit or local terminal for preview and logs.";
  } else if (connector.id === "data-hub") {
    status = "local";
    message = "Local data tools are available.";
  }

  const all = await listIntegrationConnectors();
  const idx = all.findIndex((item) => item.id === id);
  const updated: IntegrationConnector = { ...connector, status, lastCheckedAt: nowIso(), lastMessage: message };
  if (idx >= 0) {
    all[idx] = updated;
    ensureRuntimeRootSync();
    await writeJsonFile(REGISTRY_FILE, all);
  }
  await appendIntegrationEvent({ connectorId: id, type: "test", level: status === "error" ? "error" : "success", message });
  return updated;
}

export async function appendIntegrationEvent(input: Omit<IntegrationEvent, "id" | "createdAt">): Promise<IntegrationEvent> {
  const events = await readJsonFile<IntegrationEvent[]>(resolveRuntimeReadPathFromEnv("INTEGRATION_EVENTS_FILE", "integration_events.log.json"), []);
  const event: IntegrationEvent = {
    ...input,
    id: `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
  };
  events.unshift(event);
  ensureRuntimeRootSync();
  await writeJsonFile(EVENTS_FILE, events.slice(0, 300));
  await appendAuditEvent({
    actor: "connector",
    workspace: "Integration Hub",
    action: input.type,
    target: input.connectorId,
    risk: integrationLevelToAuditRisk(input.level),
    status: integrationTypeToAuditStatus(input.type, input.level),
    summary: input.message,
    connectorId: input.connectorId,
    evidence: { integrationEventId: event.id, level: input.level, type: input.type },
  }).catch(() => undefined);
  return event;
}

export async function readIntegrationEvents(limit = 100): Promise<IntegrationEvent[]> {
  const events = await readJsonFile<IntegrationEvent[]>(resolveRuntimeReadPathFromEnv("INTEGRATION_EVENTS_FILE", "integration_events.log.json"), []);
  return events.slice(0, Math.max(1, Math.min(limit, 300)));
}

export async function clearIntegrationEvents(): Promise<void> {
  ensureRuntimeRootSync();
  await writeJsonFile(EVENTS_FILE, []);
}
