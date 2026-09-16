/**
 * server/services/glaciaLiveSandboxRunner.ts
 * ============================================================================
 * Glacia Live Visual Code & Graphics Sandbox Runner
 * ============================================================================
 * Môi trường thực thi mã nguồn độc lập an toàn trong Node/Browser sandbox:
 * JavaScript, TypeScript, React JSX, Three.js 3D Shaders, Canvas 2D và Web APIs.
 */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { resolveRuntimeDirPath } from './runtimePaths.ts';

export type SandboxEnvironment = 'javascript' | 'typescript' | 'react_jsx' | 'threejs_3d' | 'canvas_2d';

export interface SandboxExecutionRequest {
  code: string;
  environment?: SandboxEnvironment;
  timeoutMs?: number;
  inputPayload?: Record<string, any>;
}

export interface SandboxConsoleLog {
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface SandboxExecutionResult {
  executionId: string;
  environment: SandboxEnvironment;
  success: boolean;
  returnValue: any;
  logs: SandboxConsoleLog[];
  durationMs: number;
  memoryUsageKb: number;
  renderedHtml?: string;
  error?: string;
  executedAt: string;
}

const SANDBOX_HISTORY_FILE = path.join(resolveRuntimeDirPath('glacia'), 'sandbox_execution_history.json');

function ensureDir() {
  try {
    const dir = path.dirname(SANDBOX_HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {}
}

function loadHistory(): SandboxExecutionResult[] {
  ensureDir();
  try {
    if (!fs.existsSync(SANDBOX_HISTORY_FILE)) return [];
    const raw = fs.readFileSync(SANDBOX_HISTORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveHistory(history: SandboxExecutionResult[]): void {
  ensureDir();
  try {
    fs.writeFileSync(SANDBOX_HISTORY_FILE, JSON.stringify(history.slice(0, 50), null, 2), 'utf8');
  } catch {}
}

/**
 * Tạo tài liệu HTML Preview độc lập cho React, Canvas hoặc Three.js
 */
export function buildSandboxHtmlPreview(code: string, environment: SandboxEnvironment): string {
  if (environment === 'canvas_2d') {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>body{margin:0;background:#020617;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden;}</style></head>
<body>
<canvas id="glacia-canvas" width="600" height="400" style="border:1px solid #1e293b;border-radius:12px;box-shadow:0 0 20px rgba(56,189,248,0.2);"></canvas>
<script>
const canvas = document.getElementById('glacia-canvas');
const ctx = canvas.getContext('2d');
try {
  ${code}
} catch (e) {
  ctx.fillStyle = '#ef4444';
  ctx.font = '14px monospace';
  ctx.fillText('Lỗi Canvas: ' + e.message, 20, 40);
}
</script>
</body>
</html>`.trim();
  }

  if (environment === 'threejs_3d') {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>body{margin:0;background:#020617;overflow:hidden;}</style><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script></head>
<body>
<div id="canvas-container"></div>
<script>
try {
  ${code}
} catch (e) {
  document.body.innerHTML = '<div style="color:#ef4444;font-family:monospace;padding:20px;">Lỗi Three.js: ' + e.message + '</div>';
}
</script>
</body>
</html>`.trim();
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><style>body{margin:0;background:#020617;color:#f8fafc;font-family:system-ui,sans-serif;padding:20px;}</style></head>
<body>
<div id="root"></div>
<script>
try {
  ${code}
} catch (e) {
  document.getElementById('root').innerHTML = '<div style="color:#ef4444;font-family:monospace;">Lỗi Runtime: ' + e.message + '</div>';
}
</script>
</body>
</html>`.trim();
}

/**
 * Thực thi code an toàn trong VM Sandbox
 */
export async function executeLiveSandboxCode(req: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const environment = req.environment || 'javascript';
  const timeoutMs = req.timeoutMs || 3000;
  const logs: SandboxConsoleLog[] = [];
  const start = Date.now();

  const renderedHtml = ['react_jsx', 'threejs_3d', 'canvas_2d'].includes(environment)
    ? buildSandboxHtmlPreview(req.code, environment)
    : undefined;

  let returnValue: any = null;
  let error: string | undefined = undefined;
  let success = true;

  // Xây dựng sandbox context an toàn
  const customConsole = {
    log: (...args: any[]) => logs.push({ level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() }),
    info: (...args: any[]) => logs.push({ level: 'info', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() }),
    warn: (...args: any[]) => logs.push({ level: 'warn', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() }),
    error: (...args: any[]) => logs.push({ level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '), timestamp: new Date().toISOString() }),
  };

  const sandboxContext = {
    console: customConsole,
    input: req.inputPayload || {},
    Math,
    Date,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Buffer: { from: Buffer.from },
    setTimeout: (fn: Function) => fn(),
  };

  try {
    const script = new vm.Script(`
      (function() {
        ${req.code}
      })()
    `);
    const context = vm.createContext(sandboxContext);
    returnValue = script.runInContext(context, { timeout: timeoutMs });
  } catch (err: any) {
    success = false;
    error = err.message || 'Execution error';
    logs.push({ level: 'error', message: error || '', timestamp: new Date().toISOString() });
  }

  const durationMs = Date.now() - start;
  const memoryUsageKb = Math.round(process.memoryUsage().heapUsed / 1024);

  const result: SandboxExecutionResult = {
    executionId,
    environment,
    success,
    returnValue: typeof returnValue === 'function' ? '[Function]' : returnValue,
    logs,
    durationMs,
    memoryUsageKb,
    renderedHtml,
    error,
    executedAt: new Date().toISOString(),
  };

  const history = loadHistory();
  history.unshift(result);
  saveHistory(history);

  return result;
}

/**
 * Lấy lịch sử thực thi Sandbox
 */
export function getSandboxExecutionHistory(): SandboxExecutionResult[] {
  return loadHistory();
}
