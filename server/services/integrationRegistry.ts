import fs from "fs";
import path from "path";
import { getGitHubSummary } from "./githubConnector";

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

const REGISTRY_FILE = path.join(process.cwd(), "integration_registry.json");
const EVENTS_FILE = path.join(process.cwd(), "integration_events.log.json");

const defaultConnectors: IntegrationConnector[] = [
  {
    id: "ai-gateway",
    title: "AI Gateway",
    subtitle: "Nhiều provider, nhiều API key, fallback quota, vault bảo mật.",
    category: "ai",
    status: "connected",
    priority: "P0",
    enabled: true,
    notes: "Lớp AI trung tâm để các connector khác dùng chung, không hard-code một API cố định.",
    capabilities: ["Gemini / Groq / OpenRouter / Claude / Ollama", "Fallback nhiều key", "Vault, backup, auto-lock", "Usage log và preflight"],
    quickActions: [{ label: "Mở AI Gateway", hash: "/ai_settings" }],
  },
  {
    id: "github",
    title: "GitHub",
    subtitle: "Repo code, issue, pull request, Actions CI/CD, release note.",
    category: "devops",
    status: "manual",
    priority: "P0",
    enabled: true,
    url: "https://github.com/DVBCLUB/LedgerFlow-Studio",
    notes: "V2 đọc workflow run, issue, PR. Tạo issue cần GITHUB_TOKEN/GH_TOKEN trong môi trường local.",
    capabilities: ["Đọc repo và Actions", "Theo dõi CI xanh/đỏ", "Xem issue/PR mở", "Tạo issue phát triển nếu có token"],
    quickActions: [
      { label: "Mở repo", href: "https://github.com/DVBCLUB/LedgerFlow-Studio" },
      { label: "Mở Actions", href: "https://github.com/DVBCLUB/LedgerFlow-Studio/actions" },
      { label: "Mở Issues", href: "https://github.com/DVBCLUB/LedgerFlow-Studio/issues" },
    ],
  },
  {
    id: "vscode-cursor",
    title: "VS Code / Cursor / Copilot",
    subtitle: "Xưởng code chuyên dụng; LedgerFlow điều phối, sinh prompt và checklist.",
    category: "devops",
    status: "manual",
    priority: "P0",
    enabled: true,
    localCommand: "code .",
    notes: "Không clone VS Code trong app. Dùng app làm bộ não quản lý yêu cầu, IDE là nơi sửa sâu.",
    capabilities: ["Sinh prompt sửa code", "Checklist test", "File plan", "Handoff sang IDE có sẵn"],
    quickActions: [{ label: "Mẫu handoff", hash: "/integration_hub?focus=vscode-cursor" }],
  },
  {
    id: "google-workspace",
    title: "Google Workspace",
    subtitle: "Sheets, Drive, Gmail, Calendar cho dữ liệu, chứng từ, lịch và email.",
    category: "workspace",
    status: "planned",
    priority: "P1",
    enabled: false,
    notes: "Ưu tiên sau DevOps: đồng bộ bảng chi phí, chứng từ và báo cáo sếp.",
    capabilities: ["Import/export Google Sheets", "Lưu chứng từ Drive", "Gửi báo cáo Gmail", "Nhắc hạn Calendar"],
    quickActions: [
      { label: "Drive", href: "https://drive.google.com" },
      { label: "Sheets", href: "https://sheets.google.com" },
      { label: "Gmail", href: "https://mail.google.com" },
    ],
  },
  {
    id: "accounting-erp",
    title: "MISA / SmartPro / ERP Legacy",
    subtitle: "Kết nối hoặc hỗ trợ nhập liệu với phần mềm kế toán đang dùng.",
    category: "accounting",
    status: "planned",
    priority: "P1",
    enabled: false,
    notes: "Không thay SmartPro/MISA ngay. LedgerFlow đứng giữa để chuẩn hóa dữ liệu và kiểm soát chứng từ.",
    capabilities: ["Mapping tài khoản/khoản mục", "Xuất file trung gian Excel/CSV", "Checklist đối chiếu", "Hỗ trợ nhập liệu nhanh"],
    quickActions: [{ label: "Tạo checklist tích hợp", hash: "/integration_hub?focus=accounting-erp" }],
  },
  {
    id: "document-vault",
    title: "Document / Evidence Vault",
    subtitle: "Quản lý hồ sơ chứng từ, hợp đồng, hóa đơn, phiếu nhập kho.",
    category: "documents",
    status: "local",
    priority: "P0",
    enabled: true,
    notes: "Lõi nghiệp vụ xây dựng: chi phí phải bám chứng từ và trạng thái duyệt.",
    capabilities: ["Cây thư mục chứng từ", "Mã hồ sơ", "Trạng thái thiếu/đủ chứng từ", "Liên kết chi phí - file chứng từ"],
    quickActions: [{ label: "Quy hoạch chứng từ", hash: "/integration_hub?focus=document-vault" }],
  },
  {
    id: "automation",
    title: "n8n / Make / Zapier / Webhook",
    subtitle: "Tự động hóa liên nền tảng theo trigger/action có kiểm soát.",
    category: "automation",
    status: "planned",
    priority: "P2",
    enabled: false,
    notes: "Sau khi dữ liệu ổn mới bật tự động hóa để tránh tự động đẩy sai dữ liệu.",
    capabilities: ["Webhook inbound/outbound", "Nhắc hạn chứng từ", "Gửi báo cáo định kỳ", "Đồng bộ trạng thái task"],
    quickActions: [{ label: "Thiết kế workflow", hash: "/integration_hub?focus=automation" }],
  },
  {
    id: "data-hub",
    title: "Data Hub / Import Export",
    subtitle: "CSV, Excel, JSON, API staging để gom dữ liệu từ nhiều nơi.",
    category: "data",
    status: "local",
    priority: "P1",
    enabled: true,
    notes: "Dữ liệu đi qua staging trước khi vào sổ chính để dễ kiểm tra và rollback.",
    capabilities: ["Import Excel/CSV", "Chuẩn hóa cột", "Mapping nguồn dữ liệu", "Audit log dữ liệu vào/ra"],
    quickActions: [{ label: "Chuẩn hóa dữ liệu", hash: "/integration_hub?focus=data-hub" }],
  },
];

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

function mergeWithDefaults(saved: IntegrationConnector[]): IntegrationConnector[] {
  const savedById = new Map(saved.map((item) => [item.id, item]));
  const merged = defaultConnectors.map((item) => ({ ...item, ...(savedById.get(item.id) ?? {}) }));
  const custom = saved.filter((item) => !defaultConnectors.some((base) => base.id === item.id));
  return [...merged, ...custom].sort((a, b) => a.priority.localeCompare(b.priority) || a.title.localeCompare(b.title));
}

export async function listIntegrationConnectors(): Promise<IntegrationConnector[]> {
  const saved = await readJsonFile<IntegrationConnector[]>(REGISTRY_FILE, []);
  const merged = mergeWithDefaults(saved);
  await writeJsonFile(REGISTRY_FILE, merged);
  return merged;
}

export async function updateIntegrationConnector(id: string, patch: Partial<Pick<IntegrationConnector, "enabled" | "status" | "priority" | "url" | "localCommand" | "notes">>): Promise<IntegrationConnector> {
  const connectors = await listIntegrationConnectors();
  const index = connectors.findIndex((item) => item.id === id);
  if (index < 0) throw new Error(`Integration connector not found: ${id}`);
  connectors[index] = { ...connectors[index], ...patch };
  await writeJsonFile(REGISTRY_FILE, connectors);
  await appendIntegrationEvent({ connectorId: id, type: "config", level: "info", message: "Connector configuration updated." });
  return connectors[index];
}

export async function testIntegrationConnector(id: string): Promise<IntegrationConnector> {
  const connectors = await listIntegrationConnectors();
  const connector = connectors.find((item) => item.id === id);
  if (!connector) throw new Error(`Integration connector not found: ${id}`);

  let status: IntegrationStatus = connector.status;
  let message = "Connector is registered.";

  if (!connector.enabled) {
    status = "planned";
    message = "Connector is disabled; enable it before using automation.";
  } else if (connector.id === "ai-gateway") {
    status = "connected";
    message = "AI Gateway connector is available through the local backend.";
  } else if (connector.id === "github" && connector.url) {
    try {
      const summary = await getGitHubSummary(connector.url);
      status = "connected";
      message = `GitHub connected: ${summary.repo}, ${summary.latestRuns.length} workflow runs, ${summary.openIssues.length} issues, ${summary.openPullRequests.length} PRs.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "GitHub connector test failed.";
    }
  } else if (connector.id === "vscode-cursor") {
    status = "manual";
    message = connector.localCommand ? `IDE handoff command configured: ${connector.localCommand}` : "IDE handoff is manual until a local command is configured.";
  } else if (["document-vault", "data-hub"].includes(connector.id)) {
    status = "local";
    message = "Local-first connector is ready inside LedgerFlow.";
  } else {
    status = connector.status === "planned" ? "planned" : connector.status;
    message = "Connector is in roadmap mode; configure credentials/workflow before enabling real sync.";
  }

  const all = await listIntegrationConnectors();
  const idx = all.findIndex((item) => item.id === id);
  const updated: IntegrationConnector = { ...connector, status, lastCheckedAt: nowIso(), lastMessage: message };
  if (idx >= 0) {
    all[idx] = updated;
    await writeJsonFile(REGISTRY_FILE, all);
  }
  await appendIntegrationEvent({ connectorId: id, type: "test", level: status === "error" ? "error" : "success", message });
  return updated;
}

export async function appendIntegrationEvent(input: Omit<IntegrationEvent, "id" | "createdAt">): Promise<IntegrationEvent> {
  const events = await readJsonFile<IntegrationEvent[]>(EVENTS_FILE, []);
  const event: IntegrationEvent = {
    ...input,
    id: `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    createdAt: nowIso(),
  };
  events.unshift(event);
  await writeJsonFile(EVENTS_FILE, events.slice(0, 300));
  return event;
}

export async function readIntegrationEvents(limit = 100): Promise<IntegrationEvent[]> {
  const events = await readJsonFile<IntegrationEvent[]>(EVENTS_FILE, []);
  return events.slice(0, Math.max(1, Math.min(limit, 300)));
}

export async function clearIntegrationEvents(): Promise<void> {
  await writeJsonFile(EVENTS_FILE, []);
}
