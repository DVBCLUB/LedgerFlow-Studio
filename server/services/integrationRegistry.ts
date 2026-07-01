import fs from "fs";
import { appendAuditEvent, integrationLevelToAuditRisk, integrationTypeToAuditStatus } from "./auditLog";
import { getGitHubSummary } from "./githubConnector";
import { GoogleWorkspaceConnector } from "./googleWorkspaceConnector";
import { Microsoft365Connector } from "./microsoft365Connector";
import { NotionConnector } from "./notionConnector";
import { N8nConnector } from "./n8nConnector";
import { MediaSyncConnector } from "./mediaSyncConnector";
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
    status: "local",
    priority: "P1",
    enabled: true,
    notes: "Đồng bộ cục bộ giả lập qua thư mục .google_drive: xuất bảng chi phí ra Sheets, lưu chứng từ Drive, lưu Gmail logs.",
    capabilities: ["Import/export Google Sheets", "Lưu chứng từ Drive", "Gửi báo cáo Gmail", "Nhắc hạn Calendar"],
    quickActions: [
      { label: "Drive", href: "https://drive.google.com" },
      { label: "Sheets", href: "https://sheets.google.com" },
      { label: "Gmail", href: "https://mail.google.com" },
    ],
  },
  {
    id: "microsoft-365",
    title: "Microsoft 365 Office",
    subtitle: "Excel, OneDrive, Outlook cho lưu trữ, báo cáo và email.",
    category: "workspace",
    status: "local",
    priority: "P1",
    enabled: true,
    notes: "Đồng bộ cục bộ giả lập qua thư mục .microsoft_365: xuất báo cáo Excel, OneDrive, Outlook logs.",
    capabilities: ["Import/export Microsoft Excel", "OneDrive File Storage Sync", "Outlook email logger"],
    quickActions: [
      { label: "OneDrive", href: "https://onedrive.live.com" },
      { label: "Excel Web", href: "https://excel.new" },
      { label: "Outlook", href: "https://outlook.live.com" }
    ],
  },
  {
    id: "notion",
    title: "Notion Workspace",
    subtitle: "Đồng bộ hóa ghi chú, cơ sở dữ liệu, quy trình sản phẩm.",
    category: "workspace",
    status: "local",
    priority: "P1",
    enabled: true,
    notes: "Lưu trang markdown và cơ sở dữ liệu JSON cục bộ giả lập trong thư mục .notion_workspace.",
    capabilities: ["Tạo/cập nhật trang Notion Page (Markdown)", "Đồng bộ Notion Databases (JSON)", "Lập tài liệu quy trình sản phẩm"],
    quickActions: [{ label: "Notion Web", href: "https://notion.so" }],
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
    status: "local",
    priority: "P2",
    enabled: true,
    notes: "Quy trình tự động hóa n8n: Đồng bộ workflow blueprints, giả lập trigger và theo dõi lượt chạy cục bộ trong thư mục .n8n_workflows.",
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
  {
    id: "media-pipeline",
    title: "Media & Video Pipeline",
    subtitle: "Lịch biên tập và theo dõi xuất bản video (TikTok, YouTube, Facebook).",
    category: "data",
    status: "local",
    priority: "P1",
    enabled: true,
    notes: "Quản lý kịch bản video ngắn, lập lịch xuất bản và ghi nhận thống kê lượt xem cục bộ tại .media_pipeline.",
    capabilities: ["Lập lịch xuất bản video (TikTok/YouTube Shorts/Reels)", "Theo dõi lượt xem và tương tác", "Tự động ghi nhận log upload"],
    quickActions: [
      { label: "TikTok Web", href: "https://tiktok.com" },
      { label: "YouTube Creator Studio", href: "https://studio.youtube.com" }
    ],
  },
  {
    id: "web-ai-sync",
    title: "ChatGPT & Gemini Web Sync",
    subtitle: "Đồng bộ hội thoại từ giao diện Web ChatGPT/Gemini (không cần API key).",
    category: "ai",
    status: "manual",
    priority: "P1",
    enabled: false,
    notes: "Giải pháp đồng bộ cục bộ bảo mật, hỗ trợ kéo thả file xuất dữ liệu (Data Export JSON) hoặc chạy script tự động bằng Chrome cookies.",
    capabilities: ["Nhập file JSON/ZIP từ ChatGPT", "Nhập dữ liệu hội thoại Gemini", "Quản lý và lưu trữ hội thoại", "Trích xuất làm giàu thư viện Prompt"],
    quickActions: [{ label: "Đồng bộ dữ liệu", hash: "/integration_hub?focus=web-ai-sync" }],
  },
  {
    id: "chatgpt-web",
    title: "ChatGPT Web Client",
    subtitle: "Sử dụng trực tiếp qua giao diện Web ChatGPT không cần API key.",
    category: "ai",
    status: "manual",
    priority: "P0",
    enabled: true,
    url: "https://chatgpt.com",
    notes: "Tối ưu hóa chi phí bằng cách dán các Prompt tác chiến trực tiếp vào web.",
    capabilities: ["Trò chuyện miễn phí", "Hỗ trợ gộp prompt dài", "Sử dụng GPT-4o và GPT-4o mini"],
    quickActions: [{ label: "Mở ChatGPT Web", href: "https://chatgpt.com" }],
  },
  {
    id: "claude-web",
    title: "Claude AI Web Client",
    subtitle: "Giao diện Web của Anthropic Claude, thích hợp cho tác vụ coding và logic phức tạp.",
    category: "ai",
    status: "manual",
    priority: "P0",
    enabled: true,
    url: "https://claude.ai",
    notes: "Claude cực kỳ xuất sắc trong phân tích thiết kế hệ thống và sửa lỗi mã nguồn.",
    capabilities: ["Sinh mã nguồn chính xác", "Đọc hiểu tệp tin đính kèm", "Tối ưu hóa thuật toán phức tạp"],
    quickActions: [{ label: "Mở Claude Web", href: "https://claude.ai" }],
  },
  {
    id: "gemini-web",
    title: "Gemini Web Client",
    subtitle: "Giao diện Web Google Gemini, phân tích dữ liệu lớn và trích xuất thông tin.",
    category: "ai",
    status: "manual",
    priority: "P0",
    enabled: true,
    url: "https://gemini.google.com",
    notes: "Mô hình Gemini có cửa sổ ngữ cảnh khổng lồ, phù hợp xử lý tài liệu VAS lớn.",
    capabilities: ["Đồng bộ Google Workspace", "Cửa sổ ngữ cảnh cực lớn", "Phân tích file Excel/PDF kế toán"],
    quickActions: [{ label: "Mở Gemini Web", href: "https://gemini.google.com" }],
  },
  {
    id: "copilot-web",
    title: "Microsoft Copilot Web",
    subtitle: "Giao diện Microsoft Copilot Web đồng bộ tìm kiếm Bing.",
    category: "ai",
    status: "manual",
    priority: "P1",
    enabled: true,
    url: "https://copilot.microsoft.com",
    notes: "Thích hợp cho tra cứu thông tư pháp lý thời gian thực nhờ kết nối Bing Search.",
    capabilities: ["Tra cứu web thời gian thực", "Tạo ảnh minh họa DALL-E 3", "Tóm tắt tài liệu văn phòng"],
    quickActions: [{ label: "Mở Copilot Web", href: "https://copilot.microsoft.com" }],
  },
  {
    id: "canva-capcut",
    title: "Canva & CapCut Suite",
    subtitle: "Bộ công cụ thiết kế mỹ thuật giao diện và biên tập video ngắn.",
    category: "workspace",
    status: "manual",
    priority: "P1",
    enabled: true,
    notes: "Hỗ trợ founder xây dựng hình ảnh và dựng video truyền thông đăng TikTok/Reels.",
    capabilities: ["Thiết kế Flat UI templates", "Biên tập cắt ghép video ngắn", "Tạo giọng đọc AI thuyết minh"],
    quickActions: [
      { label: "Mở Canva", href: "https://canva.com" },
      { label: "Mở CapCut Web", href: "https://capcut.com" }
    ],
  },
  {
    id: "vercel-deploy",
    title: "Vercel & Cloud Hosting",
    subtitle: "Nền tảng deploy giao diện web MVP của sản phẩm nhanh chóng.",
    category: "devops",
    status: "manual",
    priority: "P1",
    enabled: true,
    notes: "Hỗ trợ đưa bản MVP lên internet với chi phí 0đ thông qua Git integration.",
    capabilities: ["Deploy React/Next.js/HTML", "Tự động build từ Git commits", "Cấp chứng chỉ SSL miễn phí"],
    quickActions: [{ label: "Mở Vercel", href: "https://vercel.com" }],
  },
  {
    id: "telegram-bot",
    title: "Telegram Notification Bot",
    subtitle: "Thông báo biến động số dư và tiến độ công việc AI Agents.",
    category: "automation",
    status: "planned",
    priority: "P2",
    enabled: false,
    notes: "Tự động đẩy thông báo từ LedgerFlow Studio về Telegram cá nhân của founder.",
    capabilities: ["Báo cáo số dư tài khoản", "Cảnh báo lỗi AI Gateway", "Nhắc nhở công việc đến hạn"],
    quickActions: [{ label: "Quy hoạch Telegram Bot", hash: "/integration_hub?focus=telegram-bot" }],
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
  connectors[index] = { ...connectors[index], ...patch };
  ensureRuntimeRootSync();
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
  } else if (connector.id === "google-workspace") {
    try {
      const details = await GoogleWorkspaceConnector.testConnection();
      status = "local";
      message = `Google Workspace Sandbox connected successfully. Local path: ${details.localPath}. Found ${details.driveFilesCount} Drive files, ${details.sheetsCount} Sheets, ${details.emailsSentCount} Gmail records.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "Failed to initialize Google Workspace sandbox.";
    }
  } else if (connector.id === "microsoft-365") {
    try {
      const details = await Microsoft365Connector.testConnection();
      status = "local";
      message = `Microsoft 365 Sandbox connected successfully. Local path: ${details.localPath}. Found ${details.oneDriveFilesCount} OneDrive files, ${details.excelFilesCount} Excel reports, ${details.emailsSentCount} Outlook logs.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "Failed to initialize Microsoft 365 sandbox.";
    }
  } else if (connector.id === "notion") {
    try {
      const details = await NotionConnector.testConnection();
      status = "local";
      message = `Notion Workspace Sandbox connected successfully. Local path: ${details.localPath}. Found ${details.pagesCount} Page files, ${details.databasesCount} Database files.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "Failed to initialize Notion sandbox.";
    }
  } else if (connector.id === "automation") {
    try {
      const details = await N8nConnector.testConnection();
      status = "local";
      message = `n8n Automation Sandbox connected successfully. Local path: ${details.localPath}. Registered: ${details.templatesCount} workflows, executing logs: ${details.executionsCount}.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "Failed to initialize n8n sandbox.";
    }
  } else if (connector.id === "media-pipeline") {
    try {
      const details = await MediaSyncConnector.testConnection();
      status = "local";
      message = `Media Pipeline Sync connected successfully. Local path: ${details.localPath}. Scheduled: ${details.scheduledCount}, Published: ${details.publishedCount}, Total views: ${details.totalViews.toLocaleString()}.`;
    } catch (err: any) {
      status = "error";
      message = err.message || "Failed to initialize Media Pipeline sandbox.";
    }
  } else if (["document-vault", "data-hub"].includes(connector.id)) {
    status = "local";
    message = "Local-first connector is ready inside LedgerFlow.";
  } else if (connector.id === "web-ai-sync") {
    status = "manual";
    message = "Web Sync Connector đang chạy chế độ thủ công: Sẵn sàng nhập file conversations.json từ ChatGPT/Gemini.";
  } else if (["chatgpt-web", "claude-web", "gemini-web", "copilot-web"].includes(connector.id)) {
    status = "manual";
    message = `Handoff Web Chat hoạt động ở chế độ thủ công: Sẵn sàng sao chép prompt và mở liên kết ${connector.url}.`;
  } else if (connector.id === "canva-capcut") {
    status = "manual";
    message = "Bộ công cụ Canva & CapCut Web sẵn sàng để thiết kế media và UI.";
  } else if (connector.id === "vercel-deploy") {
    status = "manual";
    message = "Vercel Integration sẵn sàng nhận mã nguồn để deploy MVP.";
  } else if (connector.id === "telegram-bot") {
    status = connector.enabled ? "connected" : "planned";
    message = connector.enabled ? "Telegram Bot đã thiết lập webhook nhận tin báo." : "Telegram Bot đang lên kế hoạch cấu hình webhook.";
  } else {
    status = connector.status === "planned" ? "planned" : connector.status;
    message = "Connector is in roadmap mode; configure credentials/workflow before enabling real sync.";
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
