/**
 * autoRepairEngine.ts
 * ============================================================
 * Compiler feedback loop execution engine for the AI Coding Assistant.
 * Runs `tsc` builds and eslint dynamically, parses compile-time errors,
 * and calls the LLM router in a loop to automatically fix errors.
 * ============================================================
 */

import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "./safeFileManager";
import { callAI } from "./aiClient";
import { parseAICodeResponse, buildCodingPrompt } from "./codingContext";

export interface AutoRepairProgress {
  active: boolean;
  loop: number;
  maxLoops: number;
  status: "checking" | "failed" | "fixing" | "success" | "idle";
  message: string;
}

export let activeRepairProgress: AutoRepairProgress = {
  active: false,
  loop: 0,
  maxLoops: 0,
  status: "idle",
  message: "",
};

function updateProgress(progress: Partial<AutoRepairProgress>) {
  activeRepairProgress = { ...activeRepairProgress, ...progress };
  console.log(`[AutoRepair Progress] Loop ${activeRepairProgress.loop}: ${activeRepairProgress.status} - ${activeRepairProgress.message}`);
}

interface ValidationResult {
  ok: boolean;
  errors?: string;
  output?: string;
}

interface ValidationCommand {
  label: string;
  file: string;
  args: string[];
}

function runCommand(check: ValidationCommand, cwd: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    execFile(check.file, check.args, { cwd, windowsHide: true }, (error, stdout, stderr) => {
      const output = `${stdout || ""}${stderr || ""}`.trim();
      const displayCommand = `${check.file} ${check.args.join(" ")}`;
      if (error) {
        resolve({ ok: false, errors: output || `Command failed: ${displayCommand}` });
        return;
      }
      resolve({ ok: true, output: output || `${displayCommand} clean` });
    });
  });
}

function detectValidationCommands(cwd: string): ValidationCommand[] {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  const commands: ValidationCommand[] = [];

  try {
    const packageJsonPath = path.join(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      return [{ label: "TypeScript", file: npxCommand, args: ["tsc", "--noEmit"] }];
    }

    const raw = fs.readFileSync(packageJsonPath, "utf-8");
    const parsed = JSON.parse(raw) as { scripts?: Record<string, string> };
    const scripts = parsed.scripts ?? {};

    if (scripts.lint) {
      commands.push({ label: "Lint", file: npmCommand, args: ["run", "lint"] });
    } else {
      commands.push({ label: "TypeScript", file: npxCommand, args: ["tsc", "--noEmit"] });
    }
  } catch {
    commands.push({ label: "TypeScript", file: npxCommand, args: ["tsc", "--noEmit"] });
  }

  return commands;
}

/**
 * Execute local compiler/linter checks and aggregate failures.
 */
export function runBuildCheck(): Promise<ValidationResult> {
  return runValidationChecks();
}

export async function runValidationChecks(): Promise<ValidationResult> {
  const cwd = getWorkspaceRoot();
  const commands = detectValidationCommands(cwd);
  const errors: string[] = [];
  const output: string[] = [];

  for (const check of commands) {
    const result = await runCommand(check, cwd);
    if (!result.ok) {
      errors.push(`### ${check.label}\n${result.errors || "Unknown error"}`);
    } else if (result.output) {
      output.push(`${check.label}: ${result.output}`);
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors: errors.join("\n\n"),
    };
  }

  return {
    ok: true,
    output: output.join("\n") || "Validation clean",
  };
}

/**
 * Orchestrate the compiler feedback loop.
 *
 * @param files             The files that were changed and need check/repair
 * @param originalPrompt    The instruction the user gave originally
 * @param applyFileFn       A callback function to write the corrected code block to disk
 * @param getLatestCodeFn   A callback function to read current file content
 * @param maxRetries        Maximum repair loops (default 2)
 */
export async function runAutoRepairLoop(
  files: { filePath: string; relativePath: string }[],
  originalPrompt: string,
  applyFileFn: (filePath: string, content: string) => Promise<void>,
  getLatestCodeFn: (filePath: string) => Promise<string>,
  maxRetries = 2
): Promise<{ ok: boolean; message: string; loops: number; steps: Array<{ loop: number; errors: string; fixedFiles: string[] }> }> {
  let loops = 0;
  const steps: Array<{ loop: number; errors: string; fixedFiles: string[] }> = [];

  updateProgress({
    active: true,
    loop: 0,
    maxLoops: maxRetries,
    status: "checking",
    message: "Đang khởi chạy kiểm tra lỗi biên dịch (compiler/linter)...",
  });

  try {
    while (loops < maxRetries) {
      updateProgress({
        loop: loops + 1,
        status: "checking",
        message: `Đang chạy kiểm tra lỗi biên dịch (vòng lặp ${loops + 1}/${maxRetries})...`,
      });

      console.log(`[AutoRepair] Running compiler/linter checks (Loop ${loops + 1}/${maxRetries})...`);
      const check = await runValidationChecks();

      if (check.ok) {
        updateProgress({
          active: false,
          status: "success",
          message: `Sửa lỗi biên dịch thành công sau ${loops} vòng lặp.`,
        });
        return {
          ok: true,
          message: `✅ Sửa lỗi compiler/linter thành công sau ${loops} vòng lặp.`,
          loops,
          steps,
        };
      }

      loops++;
      console.warn(`[AutoRepair] Validation failed with errors:\n${check.errors}`);

      updateProgress({
        loop: loops,
        status: "fixing",
        message: `Phát hiện lỗi compiler. Đang gửi log lỗi đến AI để tìm phương án sửa đổi...`,
      });

      const currentStep = {
        loop: loops,
        errors: check.errors || "",
        fixedFiles: [] as string[],
      };
      steps.push(currentStep);

      // Read current content of target files to provide as context
      const currentFilesCtx = [];
      for (const f of files) {
        try {
          const content = await getLatestCodeFn(f.filePath);
          currentFilesCtx.push({
            absolutePath: f.filePath,
            relativePath: f.relativePath,
            content,
            language: f.filePath.endsWith(".tsx") ? "typescriptreact" : "typescript",
            sizeBytes: content.length,
            modifiedAt: new Date().toISOString(),
          });
        } catch {
          // Skip
        }
      }

      // Build repair prompt
      const repairPrompt =
        `Mã nguồn hiện tại sau khi chỉnh sửa bị lỗi kiểm tra cục bộ (compiler/linter). Hãy sửa lại code để giải quyết các lỗi này.\n\n` +
        `**Lỗi từ compiler/linter cục bộ:**\n\`\`\`\n${check.errors}\n\`\`\`\n\n` +
        `**Yêu cầu gốc ban đầu:** "${originalPrompt}"\n\n` +
        `Hãy trả về nội dung của các file đã được SỬA LỖI hoàn chỉnh trong các code block tương ứng.`;

      const messages = buildCodingPrompt({
        instruction: repairPrompt,
        files: currentFilesCtx,
        task: "fix",
      });

      console.log("[AutoRepair] Calling AI router to fix errors...");
      const aiResult = await callAI(messages, {
        task: "coding",
        model: "ai-assistant-pro", // Use pro model for complex debugging
        temperature: 0.1, // low temperature for precise fixes
        maxTokens: 4096,
      });

      // Parse files returned
      const parsed = parseAICodeResponse(aiResult.content);

      if (parsed.codeBlocks.length === 0) {
        console.warn("[AutoRepair] AI did not return any code blocks for repair. Aborting.");
        updateProgress({
          status: "failed",
          message: "AI không trả về khối mã nguồn sửa đổi nào. Hủy tiến trình.",
        });
        break;
      }

      // Write repaired code blocks back to target files
      for (const block of parsed.codeBlocks) {
        // Find matching file
        const matchedFile = files.find(
          (f) =>
            block.targetFile?.includes(f.relativePath) ||
            f.relativePath.endsWith(block.targetFile ?? "") ||
            // Fallback to first target file if single block
            (parsed.codeBlocks.length === 1 && files.length === 1)
        );

        if (matchedFile) {
          console.log(`[AutoRepair] Writing repaired code to ${matchedFile.relativePath}...`);
          updateProgress({
            status: "fixing",
            message: `Đang ghi file sửa lỗi: ${matchedFile.relativePath}...`,
          });
          await applyFileFn(matchedFile.filePath, block.code);
          currentStep.fixedFiles.push(matchedFile.relativePath);
        }
      }
    }

    // Final confirmation compiler/linter check
    updateProgress({
      status: "checking",
      message: "Đang chạy kiểm tra biên dịch cuối cùng để xác nhận...",
    });

    const finalCheck = await runValidationChecks();
    if (finalCheck.ok) {
      updateProgress({
        active: false,
        status: "success",
        message: `Sửa lỗi biên dịch thành công sau ${loops} vòng lặp.`,
      });
      return {
        ok: true,
        message: `✅ Sửa lỗi compiler/linter thành công sau ${loops} vòng lặp.`,
        loops,
        steps,
      };
    }

    // Record final state failure if we reached maximum retries
    steps.push({
      loop: loops + 1,
      errors: finalCheck.errors || "",
      fixedFiles: [],
    });

    updateProgress({
      active: false,
      status: "failed",
      message: "Tự động sửa lỗi thất bại. Vẫn còn lỗi biên dịch.",
    });

    return {
      ok: false,
      message: `❌ Không thể tự động sửa hết lỗi compiler/linter sau ${loops} vòng lặp. Lỗi còn lại:\n${finalCheck.errors}`,
      loops,
      steps,
    };
  } catch (err: any) {
    updateProgress({
      active: false,
      status: "failed",
      message: `Lỗi bất ngờ trong Auto-Repair: ${err.message || err}`,
    });
    throw err;
  }
}
