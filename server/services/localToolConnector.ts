import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const DEFAULT_REPO = process.env.GITHUB_REPO || "DVBCLUB/LedgerFlow-Studio";
const PROJECT_ROOT = process.cwd();

export type LocalToolId = "vscode" | "cursor" | "github" | "actions" | "terminal";

export interface LocalToolStatus {
  id: LocalToolId;
  label: string;
  available: boolean;
  command?: string;
  message: string;
}

export interface LocalToolSummary {
  projectRoot: string;
  repo: string;
  repoUrl: string;
  actionsUrl: string;
  tools: LocalToolStatus[];
  safeCommands: Array<{ label: string; command: string; purpose: string }>;
  checkedAt: string;
}

export interface OpenLocalToolResult {
  opened: boolean;
  success: boolean;
  message: string;
}

function normalizeRepo(value = DEFAULT_REPO): string {
  return value.replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
}

function githubUrl(repo = DEFAULT_REPO): string {
  return `https://github.com/${normalizeRepo(repo)}`;
}

function actionsUrl(repo = DEFAULT_REPO): string {
  return `${githubUrl(repo)}/actions`;
}

async function commandWorks(command: string, args: string[] = ["--version"]): Promise<boolean> {
  try {
    await execFileAsync(command, args, { timeout: 3_000, windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

async function detectCommand(primary: string, windowsFallback?: string): Promise<string | undefined> {
  if (await commandWorks(primary)) return primary;
  if (process.platform === "win32" && windowsFallback && (await commandWorks(windowsFallback))) return windowsFallback;
  return undefined;
}

async function openUrl(url: string): Promise<void> {
  if (!/^https:\/\/github\.com\//.test(url)) {
    throw new Error("Chỉ cho phép mở nhanh URL GitHub trong Local Tools Connector.");
  }

  if (process.platform === "win32") {
    await execFileAsync("cmd", ["/c", "start", "", url], { windowsHide: true });
    return;
  }

  if (process.platform === "darwin") {
    await execFileAsync("open", [url]);
    return;
  }

  await execFileAsync("xdg-open", [url]);
}

async function openEditor(command: string): Promise<void> {
  await execFileAsync(command, [PROJECT_ROOT], { cwd: PROJECT_ROOT, timeout: 5_000, windowsHide: true });
}

export async function getLocalToolSummary(): Promise<LocalToolSummary> {
  const vscode = await detectCommand("code", "code.cmd");
  const cursor = await detectCommand("cursor", "cursor.cmd");
  const terminalAvailable = true;
  const repo = normalizeRepo();

  return {
    projectRoot: PROJECT_ROOT,
    repo,
    repoUrl: githubUrl(repo),
    actionsUrl: actionsUrl(repo),
    tools: [
      {
        id: "vscode",
        label: "VS Code",
        available: Boolean(vscode),
        command: vscode,
        message: vscode ? "Có thể mở repo bằng VS Code CLI." : "Chưa phát hiện lệnh code. Mở VS Code rồi bật Shell Command: code.",
      },
      {
        id: "cursor",
        label: "Cursor",
        available: Boolean(cursor),
        command: cursor,
        message: cursor ? "Có thể mở repo bằng Cursor CLI." : "Chưa phát hiện lệnh cursor. Có thể copy prompt thủ công vào Cursor.",
      },
      {
        id: "github",
        label: "GitHub Repo",
        available: true,
        command: githubUrl(repo),
        message: "Có thể mở repo GitHub bằng trình duyệt.",
      },
      {
        id: "actions",
        label: "GitHub Actions",
        available: true,
        command: actionsUrl(repo),
        message: "Có thể mở CI/CD GitHub Actions bằng trình duyệt.",
      },
      {
        id: "terminal",
        label: "Terminal commands",
        available: terminalAvailable,
        message: "LedgerFlow chỉ sinh lệnh an toàn để bạn copy/chạy thủ công, không tự chạy lệnh nguy hiểm.",
      },
    ],
    safeCommands: getSafeLocalCommands(),
    checkedAt: new Date().toISOString(),
  };
}

export function getSafeLocalCommands(): Array<{ label: string; command: string; purpose: string }> {
  return [
    { label: "Cài dependencies", command: "npm install", purpose: "Cài/gỡ package theo lockfile hiện tại." },
    { label: "Chạy dev server", command: "npm run dev", purpose: "Mở app local để test giao diện." },
    { label: "Build kiểm tra", command: "npm run build", purpose: "Bắt lỗi TypeScript/Vite trước khi push." },
    { label: "AI Doctor", command: "npm run ai:doctor", purpose: "Kiểm tra trạng thái AI Gateway/Vault/Provider." },
    { label: "Git status", command: "git status", purpose: "Xem file thay đổi trước khi commit." },
    { label: "Git pull", command: "git pull", purpose: "Kéo code mới nhất từ GitHub." },
  ];
}

export async function openLocalTool(tool: Exclude<LocalToolId, "terminal">): Promise<OpenLocalToolResult> {
  const summary = await getLocalToolSummary();
  const target = summary.tools.find((entry) => entry.id === tool);
  if (!target) throw new Error("Local tool không hợp lệ.");
  if (!target.available) throw new Error(target.message);

  if (tool === "github") {
    await openUrl(summary.repoUrl);
    return { opened: true, success: true, message: "Đã mở GitHub repo." };
  }

  if (tool === "actions") {
    await openUrl(summary.actionsUrl);
    return { opened: true, success: true, message: "Đã mở GitHub Actions." };
  }

  if (tool === "vscode" || tool === "cursor") {
    if (!target.command) throw new Error(target.message);
    await openEditor(target.command);
    return { opened: true, success: true, message: `Đã yêu cầu mở ${target.label} tại ${path.basename(PROJECT_ROOT)}.` };
  }

  return { opened: false, success: false, message: "Tool này chưa hỗ trợ mở tự động." };
}
