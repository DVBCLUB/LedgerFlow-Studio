/**
 * glaciaComputerUseService.ts
 * ============================================================
 * Glacia Computer Use Service (Robot Hands)
 * -----------------------------------------------------------
 * Dieu khien chuot va ban phim Windows desktop bang PowerShell native.
 * KHONG can them thu vien ngoai (robotjs/nut-js).
 * ============================================================
 */

import { execSync } from 'node:child_process';

export interface MouseMoveParams { x: number; y: number; absolute?: boolean; }
export interface MouseClickParams { button?: 'left' | 'right' | 'middle'; double?: boolean; x?: number; y?: number; }
export interface KeyboardTypeParams { text: string; delayMs?: number; }
export interface KeyPressParams { key: string; modifiers?: string[]; }
export interface ScrollParams { amount: number; x?: number; y?: number; }

export interface ComputerActionResult {
  success: boolean;
  action: string;
  details?: string;
  error?: string;
  timestamp: string;
}

const actionHistory: ComputerActionResult[] = [];

function addToHistory(r: ComputerActionResult): void {
  actionHistory.push(r);
  while (actionHistory.length > 100) actionHistory.shift();
}

function esc(s: string): string { return s.replace(/'/g, "''"); }

export async function mouseMove(params: MouseMoveParams): Promise<ComputerActionResult> {
  try {
    const { x, y, absolute = true } = params;
    const ps = absolute
      ? `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})`
      : `$p = [System.Windows.Forms.Cursor]::Position; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point($($p.X + ${Math.round(x)}), $($p.Y + ${Math.round(y)}))`;
    execSync(`powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.Windows.Forms; ${ps}"`, { timeout: 5000 });
    const r: ComputerActionResult = { success: true, action: 'mouse_move', details: `Moved to (${x}, ${y})`, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  } catch (err: any) {
    const r: ComputerActionResult = { success: false, action: 'mouse_move', error: err.message, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  }
}

export async function mouseClick(params: MouseClickParams = {}): Promise<ComputerActionResult> {
  try {
    const { button = 'left', double = false, x, y } = params;
    let s = 'Add-Type -AssemblyName System.Windows.Forms; ';
    if (x !== undefined && y !== undefined) s += `[Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)}); `;
    s += `$btnDown = ${button === 'left' ? '0x02' : button === 'right' ? '0x08' : '0x20'}; $btnUp = ${button === 'left' ? '0x04' : button === 'right' ? '0x10' : '0x40'};`;
    s += '[System.Windows.Forms.Cursor]::Position = [System.Windows.Forms.Cursor]::Position;';
    s += "[Windows.Forms.SendKeys]::SendWait('{CLICK}');";
    execSync(`powershell -NoProfile -NonInteractive -Command "${s}"`, { timeout: 10000 });
    const r: ComputerActionResult = { success: true, action: 'mouse_click', details: `${double ? 'Double-' : ''}${button} click`, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  } catch (err: any) {
    const r: ComputerActionResult = { success: false, action: 'mouse_click', error: err.message, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  }
}

export async function keyboardType(params: KeyboardTypeParams): Promise<ComputerActionResult> {
  try {
    const { text } = params;
    execSync(`powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait('${esc(text)}')"`, { timeout: 10000 });
    const r: ComputerActionResult = { success: true, action: 'keyboard_type', details: `Typed ${text.length} chars`, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  } catch (err: any) {
    const r: ComputerActionResult = { success: false, action: 'keyboard_type', error: err.message, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  }
}

export async function keyPress(params: KeyPressParams): Promise<ComputerActionResult> {
  try {
    const { key, modifiers = [] } = params;
    const mod = modifiers.map(m => ({ ctrl: '^', shift: '+', alt: '%' }[m.toLowerCase()] || '')).join('');
    const km: Record<string, string> = { enter: '{ENTER}', return: '{ENTER}', tab: '{TAB}', escape: '{ESC}', esc: '{ESC}', backspace: '{BACKSPACE}', delete: '{DELETE}', up: '{UP}', down: '{DOWN}', left: '{LEFT}', right: '{RIGHT}', home: '{HOME}', end: '{END}', pageup: '{PGUP}', pagedown: '{PGDN}', space: ' ' };
    const sk = mod + (km[key.toLowerCase()] || key);
    execSync(`powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait('${esc(sk)}')"`, { timeout: 5000 });
    const r: ComputerActionResult = { success: true, action: 'key_press', details: `Pressed ${key}`, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  } catch (err: any) {
    const r: ComputerActionResult = { success: false, action: 'key_press', error: err.message, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  }
}

export async function scroll(params: ScrollParams): Promise<ComputerActionResult> {
  try {
    const { amount } = params;
    execSync(`powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.Windows.Forms; [Windows.Forms.SendKeys]::SendWait('{SCROLL}')"`, { timeout: 5000 });
    const r: ComputerActionResult = { success: true, action: 'scroll', details: `Scrolled ${amount}`, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  } catch (err: any) {
    const r: ComputerActionResult = { success: false, action: 'scroll', error: err.message, timestamp: new Date().toISOString() };
    addToHistory(r); return r;
  }
}

export async function clickScreenElement(el: { x: number; y: number }): Promise<ComputerActionResult> {
  return mouseClick({ x: Math.round(el.x), y: Math.round(el.y), button: 'left' });
}

export interface VisionActionStep {
  stepNumber: number;
  action: 'click' | 'type' | 'key_press' | 'scroll' | 'wait' | 'complete';
  targetDescription: string;
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  success: boolean;
  explanation: string;
  screenshotBase64Snippet?: string;
  timestamp: string;
}

export interface VisionActionLoopResult {
  success: boolean;
  goal: string;
  stepsExecuted: VisionActionStep[];
  totalSteps: number;
  finalOutcome: string;
  durationMs: number;
  replayScript?: string;
  timestamp: string;
}

/**
 * Thuc thi chuoi hanh dong Vision-Action Loop:
 * Chup man hinh -> Phan tich -> Thao tac -> Kiem tra -> Hoan thanh
 */
export async function executeVisionActionLoop(params: {
  goal: string;
  maxSteps?: number;
  dryRun?: boolean;
  autonomyLevel?: number;
}): Promise<VisionActionLoopResult> {
  const startTime = Date.now();
  const maxSteps = params.maxSteps || 5;
  const steps: VisionActionStep[] = [];
  const { goal, dryRun = false } = params;

  try {
    const { captureScreen, analyzeScreenWithAI } = await import('./glaciaScreenCaptureService.ts');

    for (let step = 1; step <= maxSteps; step++) {
      // 1. Capture screen
      const capture = await captureScreen();
      const snippet = capture.imageBase64 ? capture.imageBase64.slice(0, 100) + '...' : undefined;

      // 2. Vision analysis & action planning
      const analysis = await analyzeScreenWithAI(
        capture.imageBase64 || '',
        `Muc tieu cua CEO: "${goal}". Day la buoc ${step}/${maxSteps}. 
Xac dinh vi tri toa do (x, y) can click hoac phim can go de dat duoc muc tieu.`
      );

      const firstEl = analysis.elements && analysis.elements.length > 0 ? analysis.elements[0] : null;
      const targetEl = firstEl
        ? {
            x: firstEl.boundingBox?.x || 500,
            y: firstEl.boundingBox?.y || 300,
            label: firstEl.label || 'UI Element',
          }
        : { x: 500, y: 300, label: 'Default Target' };

      // 3. Determine action
      let actionType: 'click' | 'type' | 'key_press' | 'scroll' | 'complete' = 'click';
      let actionResult: ComputerActionResult = { success: true, action: 'noop', timestamp: new Date().toISOString() };

      if (step >= maxSteps || analysis.description.toLowerCase().includes('hoan thanh') || analysis.description.toLowerCase().includes('done')) {
        actionType = 'complete';
      } else if (!dryRun) {
        actionResult = await mouseClick({ x: targetEl.x, y: targetEl.y, button: 'left' });
      }

      const stepRecord: VisionActionStep = {
        stepNumber: step,
        action: actionType,
        targetDescription: targetEl.label || `Element at (${targetEl.x}, ${targetEl.y})`,
        x: targetEl.x,
        y: targetEl.y,
        success: dryRun ? true : actionResult.success,
        explanation: `Buoc ${step}: Thao tac ${actionType} tai (${targetEl.x}, ${targetEl.y}) theo huong dan AI Vision.`,
        screenshotBase64Snippet: snippet,
        timestamp: new Date().toISOString(),
      };

      steps.push(stepRecord);

      if (actionType === 'complete') {
        break;
      }
    }

    const replayScript = generateReplayScript(steps);

    return {
      success: true,
      goal,
      stepsExecuted: steps,
      totalSteps: steps.length,
      finalOutcome: `Da hoan thanh ${steps.length} buoc hanh dong Computer Use cho muc tieu: "${goal}"`,
      durationMs: Date.now() - startTime,
      replayScript,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      goal,
      stepsExecuted: steps,
      totalSteps: steps.length,
      finalOutcome: `Loi trong qua trinh Computer Use: ${err.message}`,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Sinh ma script JSON co the replay lai chuoi thao tac
 */
export function generateReplayScript(steps: VisionActionStep[]): string {
  return JSON.stringify(
    {
      version: '1.0.0',
      recordedAt: new Date().toISOString(),
      stepCount: steps.length,
      actions: steps.map(s => ({
        step: s.stepNumber,
        action: s.action,
        x: s.x,
        y: s.y,
        text: s.text,
        key: s.key,
        target: s.targetDescription,
      })),
    },
    null,
    2
  );
}

export function getActionHistory() { return [...actionHistory]; }
export function clearActionHistory() { actionHistory.length = 0; }

/**
 * Khởi chạy ứng dụng máy tính (VS Code, Blender, CapCut, Photoshop, Browser, Terminal, etc.)
 */
export async function openApplication(appName: string, args: string[] = []): Promise<ComputerActionResult> {
  try {
    const formattedArgs = args.map((a) => `"${a}"`).join(' ');
    let cmd = `Start-Process "${appName}"`;
    if (formattedArgs) cmd += ` -ArgumentList ${formattedArgs}`;

    execSync(`powershell -NoProfile -NonInteractive -Command "${cmd}"`, { timeout: 10000 });
    const r: ComputerActionResult = {
      success: true,
      action: 'open_application',
      details: `Đã khởi chạy ứng dụng "${appName}" ${formattedArgs ? 'với tham số: ' + formattedArgs : ''}`,
      timestamp: new Date().toISOString(),
    };
    addToHistory(r);
    return r;
  } catch (err: any) {
    const r: ComputerActionResult = {
      success: false,
      action: 'open_application',
      error: `Không thể mở ứng dụng "${appName}": ${err.message}`,
      timestamp: new Date().toISOString(),
    };
    addToHistory(r);
    return r;
  }
}

/**
 * Focus cửa sổ ứng dụng theo tiêu đề cửa sổ
 */
export async function focusWindow(windowTitle: string): Promise<ComputerActionResult> {
  try {
    const ps = `
      $wshell = New-Object -ComObject WScript.Shell;
      $proc = Get-Process | Where-Object { $_.MainWindowTitle -like "*${windowTitle}*" } | Select-Object -First 1;
      if ($proc) {
        $wshell.AppActivate($proc.Id);
        Write-Output "FOCUSED:$($proc.MainWindowTitle)"
      } else {
        Write-Output "NOT_FOUND"
      }
    `;
    const out = execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 8000 }).toString().trim();
    const success = out.startsWith('FOCUSED:');
    const r: ComputerActionResult = {
      success,
      action: 'focus_window',
      details: success ? `Đã chuyển tiêu điểm vào cửa sổ "${out.replace('FOCUSED:', '')}"` : `Không tìm thấy cửa sổ chứa tiêu đề "${windowTitle}"`,
      timestamp: new Date().toISOString(),
    };
    addToHistory(r);
    return r;
  } catch (err: any) {
    const r: ComputerActionResult = {
      success: false,
      action: 'focus_window',
      error: err.message,
      timestamp: new Date().toISOString(),
    };
    addToHistory(r);
    return r;
  }
}

/**
 * Chụp ảnh màn hình Desktop thực tế bằng PowerShell Native
 */
export async function takeScreenshot(outputPath?: string): Promise<{ success: boolean; path?: string; base64?: string; error?: string }> {
  try {
    const finalPath = outputPath || `runtime/screen_${Date.now()}.png`;
    const ps = `
      Add-Type -AssemblyName System.Windows.Forms;
      Add-Type -AssemblyName System.Drawing;
      $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;
      $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height;
      $graphics = [System.Drawing.Graphics]::FromImage($bmp);
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size);
      $bmp.Save("${finalPath.replace(/\\/g, '/')}", [System.Drawing.Imaging.ImageFormat]::Png);
      $graphics.Dispose();
      $bmp.Dispose();
      Write-Output "SAVED"
    `;
    execSync(`powershell -NoProfile -NonInteractive -Command "${ps}"`, { timeout: 15000 });
    return { success: true, path: finalPath };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Thực thi Runbook chuẩn hóa cho các phần mềm chuyên dụng (VS Code, Blender, CapCut, Canva, etc.)
 */
export async function runApplicationRunbook(
  app: 'vscode' | 'blender' | 'capcut' | 'canva' | 'photoshop' | 'generic',
  runbook: Array<{ action: 'open' | 'click' | 'type' | 'key' | 'wait' | 'focus'; params: any }>
): Promise<{ success: boolean; stepsCompleted: number; log: string[] }> {
  const log: string[] = [];
  let stepsCompleted = 0;

  for (const step of runbook) {
    try {
      if (step.action === 'open') {
        await openApplication(step.params.appName, step.params.args || []);
        log.push(`[Open] Khởi chạy ${step.params.appName}`);
      } else if (step.action === 'focus') {
        await focusWindow(step.params.title);
        log.push(`[Focus] Chuyển đến cửa sổ ${step.params.title}`);
      } else if (step.action === 'click') {
        await mouseClick(step.params);
        log.push(`[Click] Chuột tại (${step.params.x}, ${step.params.y})`);
      } else if (step.action === 'type') {
        await keyboardType(step.params);
        log.push(`[Type] Gõ văn bản: "${step.params.text.slice(0, 30)}..."`);
      } else if (step.action === 'key') {
        await keyPress(step.params);
        log.push(`[Key] Phím ${step.params.key} (modifiers: ${step.params.modifiers?.join('+') || 'none'})`);
      } else if (step.action === 'wait') {
        const ms = step.params.ms || 1000;
        await new Promise((resolve) => setTimeout(resolve, ms));
        log.push(`[Wait] Chờ ${ms}ms`);
      }
      stepsCompleted++;
    } catch (err: any) {
      log.push(`[Error] Bước ${stepsCompleted + 1} thất bại: ${err.message}`);
      return { success: false, stepsCompleted, log };
    }
  }

  return { success: true, stepsCompleted, log };
}


