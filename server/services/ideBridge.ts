/**
 * ideBridge.ts
 * ============================================================
 * IDE Bridge — cầu nối an toàn giữa LedgerFlow và các IDE/tool
 * local. Hỗ trợ mở project trong VS Code / Cursor, sinh handoff
 * prompt, tạo checklist test và điều phối tác vụ phát triển.
 *
 * Nguyên tắc an toàn:
 * - Không tự chạy lệnh build/push/delete nếu chưa có approval
 * - Chỉ mở tool ở chế độ "xem", không tự sửa file
 * - Mọi handoff đều ghi audit log
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { appendAuditEvent } from './auditLog.ts';
import { updateContractHealth } from './connectorContract.ts';
import type { ConnectorHandoffRequest, ConnectorHandoffResult } from './connectorContract.ts';

// ─── Supported IDE targets ────────────────────────────────────────────
export const IDE_TARGETS = ['vscode', 'cursor', 'github', 'terminal', 'windsurf', 'copilot'] as const;
export type IDETarget = (typeof IDE_TARGETS)[number];

export interface IDECheckResult {
  target: IDETarget;
  available: boolean;
  path?: string;
  version?: string;
  message: string;
  projectRoot: string;
}

export interface IDEHandoffPrompt {
  target: IDETarget;
  title: string;
  promptMarkdown: string;
  safeCommands: string[];
  testChecklist: string[];
  filePlan: string[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  approvalRequired: boolean;
}

export interface IDEOpenResult {
  ok: boolean;
  target: IDETarget;
  opened: boolean;
  command: string;
  message: string;
}

// ─── Detect local tools ──────────────────────────────────────────────
const WORKSPACE_ROOT = process.cwd();

export function checkIDE(target: IDETarget): IDECheckResult {
  const root = WORKSPACE_ROOT;
  const base: Omit<IDECheckResult, 'path' | 'version'> = {
    target,
    available: false,
    message: '',
    projectRoot: root,
  };

  try {
    switch (target) {
      case 'vscode': {
        const codePaths = [
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd',
          'C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd',
          '/usr/local/bin/code',
        ];
        for (const p of codePaths) {
          const resolved = p.replace('%USERNAME%', process.env.USERNAME || process.env.USER || '');
          if (fs.existsSync(resolved)) {
            return { ...base, available: true, path: resolved, message: 'VS Code đã sẵn sàng.' };
          }
        }
        // Fallback: thử chạy `code --version`
        try {
          const ver = execSync('code --version', { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'pipe'] }).trim().split('\n')[0];
          return { ...base, available: true, path: 'code', version: ver, message: `VS Code ${ver}` };
        } catch {
          return { ...base, message: 'Không tìm thấy VS Code. Cài từ https://code.visualstudio.com' };
        }
      }

      case 'cursor': {
        const cursorPaths = [
          'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\cursor\\Cursor.exe',
          'C:\\Users\\%USERNAME%\\AppData\\Local\\cursor\\Cursor.exe',
          '/Applications/Cursor.app/Contents/MacOS/Cursor',
        ];
        for (const p of cursorPaths) {
          const resolved = p.replace('%USERNAME%', process.env.USERNAME || process.env.USER || '');
          if (fs.existsSync(resolved)) {
            return { ...base, available: true, path: resolved, message: 'Cursor IDE đã sẵn sàng.' };
          }
        }
        // Fallback qua CLI
        try {
          execSync('cursor --version', { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'pipe'] });
          return { ...base, available: true, path: 'cursor', message: 'Cursor IDE (CLI) đã sẵn sàng.' };
        } catch {
          return { ...base, message: 'Không tìm thấy Cursor. Cài từ https://cursor.com' };
        }
      }

      case 'github': {
        const ghPaths = [
          'C:\\Program Files\\GitHub CLI\\gh.exe',
          '/usr/local/bin/gh',
        ];
        for (const p of ghPaths) {
          if (fs.existsSync(p)) {
            try {
              const ver = execSync(`"${p}" --version`, { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
              return { ...base, available: true, path: p, version: ver.split('\n')[0], message: 'GitHub CLI đã sẵn sàng.' };
            } catch { continue; }
          }
        }
        // Fallback qua PATH
        try {
          const ver = execSync('gh --version', { encoding: 'utf8', timeout: 4000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
          return { ...base, available: true, path: 'gh', version: ver.split('\n')[0], message: 'GitHub CLI đã sẵn sàng.' };
        } catch {
          return { ...base, message: 'Không tìm thấy GitHub CLI. Cài từ https://cli.github.com' };
        }
      }

      case 'terminal': {
        return { ...base, available: true, message: 'Terminal (PowerShell) đã sẵn sàng.', path: 'powershell.exe' };
      }

      case 'windsurf':
      case 'copilot': {
        // IDE mới hơn — fallback về terminal handoff
        return { ...base, available: false, message: `${target} chưa được cấu hình đường dẫn local. Dùng handoff prompt thay vì mở trực tiếp.` };
      }

      default:
        return { ...base, message: `Không hỗ trợ IDE: ${target}` };
    }
  } catch (err: any) {
    return { ...base, message: `Lỗi kiểm tra ${target}: ${err.message}` };
  }
}

export function checkAllIDEs(): IDECheckResult[] {
  return IDE_TARGETS.map(t => checkIDE(t));
}

// ─── Open IDE ────────────────────────────────────────────────────────
export function openIDE(target: IDETarget, filePath?: string): IDEOpenResult {
  const check = checkIDE(target);
  if (!check.available) {
    return { ok: false, target, opened: false, command: '', message: check.message };
  }

  const root = WORKSPACE_ROOT;
  let command = '';

  try {
    switch (target) {
      case 'vscode': {
        const codePath = check.path || 'code';
        command = filePath ? `"${codePath}" "${filePath}"` : `"${codePath}" "${root}"`;
        execSync(command, { timeout: 8000, stdio: 'ignore', windowsHide: true });
        break;
      }
      case 'cursor': {
        const cursorPath = check.path || 'cursor';
        command = filePath ? `"${cursorPath}" "${filePath}"` : `"${cursorPath}" "${root}"`;
        execSync(command, { timeout: 8000, stdio: 'ignore', windowsHide: true });
        break;
      }
      case 'github': {
        const ghPath = check.path || 'gh';
        command = `"${ghPath}" repo view --web`;
        execSync(command, { timeout: 8000, stdio: 'ignore', windowsHide: true });
        break;
      }
      default:
        return { ok: false, target, opened: false, command: '', message: `Không thể mở ${target} tự động. Dùng handoff prompt.` };
    }

    // Ghi audit
    appendAuditEvent({
      actor: 'founder',
      workspace: 'IDE Bridge',
      action: 'ide.open',
      target: target,
      risk: 'LOW',
      status: 'executed',
      summary: `Mở ${target}${filePath ? ` với file ${filePath}` : ''}`,
      connectorId: 'ide-bridge',
      evidence: { command, filePath, projectRoot: root },
    }).catch(() => undefined);

    return { ok: true, target, opened: true, command, message: `Đã mở ${target}.` };
  } catch (err: any) {
    return { ok: false, target, opened: false, command, message: `Lỗi mở ${target}: ${err.message}` };
  }
}

// ─── Sinh handoff prompt ─────────────────────────────────────────────
export function generateHandoffPrompt(
  target: IDETarget,
  task: string,
  files?: string[],
  context?: string
): IDEHandoffPrompt {
  const filePlan = files ?? [];
  const risk = task.toLowerCase().includes('delete') || task.toLowerCase().includes('push')
    ? 'HIGH'
    : task.toLowerCase().includes('build') || task.toLowerCase().includes('update')
      ? 'MEDIUM'
      : 'LOW';

  const safeCommands: string[] = [];
  const testChecklist: string[] = [];
  const promptParts: string[] = [];

  switch (target) {
    case 'vscode':
    case 'cursor':
      promptParts.push(`## Tác vụ phát triển: ${task}\n`);
      if (context) promptParts.push(`### Ngữ cảnh\n${context}\n`);
      if (filePlan.length > 0) promptParts.push(`### File liên quan\n${filePlan.map(f => `- \`${f}\``).join('\n')}\n`);
      promptParts.push(`### Checklist kiểm tra`);
      promptParts.push(`- [ ] Đọc và hiểu yêu cầu`);
      promptParts.push(`- [ ] Kiểm tra các file liên quan`);
      promptParts.push(`- [ ] Thực hiện thay đổi trong ${target === 'cursor' ? 'Cursor' : 'VS Code'}`);
      promptParts.push(`- [ ] Chạy \`npm run lint\` để kiểm tra type`);
      promptParts.push(`- [ ] Chạy \`npm test\` nếu có test`);
      promptParts.push(`- [ ] Review diff trước khi commit`);
      if (risk !== 'LOW') promptParts.push(`- [ ] Quay lại LedgerFlow Control Plane để duyệt thay đổi`);

      safeCommands.push('npm run lint', 'npm test', 'git diff', 'git status');
      testChecklist.push('Kiểm tra type (tsc --noEmit)', 'Chạy unit test', 'Kiểm tra build', 'Review diff');
      break;

    case 'github':
      promptParts.push(`## Yêu cầu GitHub: ${task}\n`);
      if (context) promptParts.push(`### Ngữ cảnh\n${context}\n`);
      promptParts.push(`### Hành động đề xuất`);
      promptParts.push(`1. Mở repo trên GitHub`);
      promptParts.push(`2. Kiểm tra CI/CD status trong Actions`);
      promptParts.push(`3. Tạo issue hoặc PR nếu cần`);
      promptParts.push(`4. Gán label \`ledgerflow\` cho tracking`);

      safeCommands.push('gh issue list', 'gh pr list', 'gh run list', 'gh repo view --web');
      testChecklist.push('Kiểm tra CI xanh/đỏ', 'Đọc log workflow fail', 'Xác nhận issue/PR được tạo');
      break;

    case 'terminal':
      promptParts.push(`## Lệnh terminal: ${task}\n`);
      const lines = task.split('\n').filter(l => l.trim());
      promptParts.push(`### Lệnh đề xuất (chạy thủ công sau khi duyệt):`);
      for (const line of lines) {
        promptParts.push(`\`\`\`powershell\n${line.trim()}\n\`\`\``);
        safeCommands.push(line.trim());
      }
      if (risk !== 'LOW') promptParts.push(`\n⚠️ **CẢNH BÁO**: Tác vụ này có rủi ro ${risk}. Hãy review kỹ trước khi chạy.`);
      testChecklist.push('Kiểm tra output lệnh', 'Xác nhận không có side-effect ngoài ý muốn');
      break;

    default:
      promptParts.push(`## Handoff sang ${target}: ${task}`);
      safeCommands.push('npm run lint');
      testChecklist.push('Kiểm tra type', 'Kiểm tra build');
      break;
  }

  // Tạo file checklist
  const checklistContent = testChecklist.map((item, i) => `${i + 1}. ${item}`).join('\n');

  return {
    target,
    title: task.slice(0, 80),
    promptMarkdown: promptParts.join('\n'),
    safeCommands,
    testChecklist,
    filePlan,
    risk,
    approvalRequired: risk === 'HIGH',
  };
}

// ─── Thực thi handoff ─────────────────────────────────────────────────
export async function executeHandoff(request: ConnectorHandoffRequest): Promise<ConnectorHandoffResult> {
  const now = new Date().toISOString();
  const base: Omit<ConnectorHandoffResult, 'evidence' | 'message' | 'error'> = {
    ok: false,
    connectorId: request.connectorId,
    capabilityId: request.capabilityId,
    executedAt: now,
  };

  if (request.connectorId === 'ide-bridge' || request.connectorId === 'vscode-cursor') {
    const action = request.payload.action as string | undefined;
    const target = request.payload.target as IDETarget | undefined;

    if (action === 'check') {
      const results = target ? [checkIDE(target)] : checkAllIDEs();
      return {
        ...base,
        ok: true,
        evidence: { results },
        message: `Đã kiểm tra ${results.length} IDE targets.`,
      };
    }

    if (action === 'open' && target) {
      const filePath = request.payload.filePath as string | undefined;
      const result = openIDE(target, filePath);
      return {
        ...base,
        ok: result.ok,
        evidence: { result },
        message: result.message,
        error: result.ok ? undefined : result.message,
      };
    }

    if (action === 'handoff' || action === 'prompt') {
      const task = request.payload.task as string;
      const files = request.payload.files as string[] | undefined;
      const context = request.payload.context as string | undefined;
      const prompt = generateHandoffPrompt(target || 'vscode', task || 'Chưa có mô tả', files, context);
      return {
        ...base,
        ok: true,
        evidence: { prompt },
        message: `Đã sinh handoff prompt cho ${prompt.target}.`,
      };
    }

    return { ...base, evidence: {}, error: `Hành động không được hỗ trợ: ${action}`, message: 'Handoff thất bại.' };
  }

  // Fallback: mở URL nếu connector có url
  const quickActions = request.payload as any;
  if (quickActions?.href) {
    try {
      // Trên Windows, dùng start để mở URL
      const cmd = process.platform === 'win32'
        ? `start "" "${quickActions.href}"`
        : `open "${quickActions.href}"`;
      execSync(cmd, { timeout: 5000, stdio: 'ignore', windowsHide: true });

      return {
        ...base,
        ok: true,
        evidence: { href: quickActions.href },
        message: `Đã mở ${quickActions.href}`,
      };
    } catch (err: any) {
      return { ...base, error: err.message, message: 'Không mở được URL.', evidence: { href: quickActions.href } };
    }
  }

  return { ...base, error: 'Không xác định được hành động handoff.', message: 'Handoff thất bại.', evidence: {} };
}

// ─── Health check cho IDE bridge ──────────────────────────────────────
export function checkIDEBridgeHealth(): { ok: boolean; available: IDETarget[]; unavailable: IDETarget[] } {
  const results = checkAllIDEs();
  const available = results.filter(r => r.available).map(r => r.target);
  const unavailable = results.filter(r => !r.available).map(r => r.target);
  const ok = available.length > 0;

  updateContractHealth('vscode-cursor', {
    ok,
    message: ok
      ? `${available.join(', ')} sẵn sàng.`
      : 'Không tìm thấy IDE nào.',
    detail: { results },
  });

  return { ok, available, unavailable };
}
