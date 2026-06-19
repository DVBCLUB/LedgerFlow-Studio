/**
 * assistant-daemon.ts
 * ============================================================
 * Standalone Express daemon for the AI Coding Assistant.
 *
 * Runs on port 3001 (separate from LedgerFlow main app on 3000).
 * Receives commands from Telegram webhook, CLI, or REST API calls.
 *
 * Endpoints:
 *   GET  /health                   â€” Health check + AI router status
 *   POST /api/ask                  â€” Ask AI without file context
 *   POST /api/read                 â€” Read a file and return its content
 *   POST /api/edit                 â€” Read file + ask AI to edit, return preview
 *   POST /api/apply                â€” Apply the last AI suggestion to a file
 *   POST /api/rollback             â€” Rollback a file to its last backup
 *   POST /api/create               â€” Create a new file with AI-generated content
 *   GET  /api/backups              â€” List backups for a file
 *   GET  /api/status               â€” AI router key status + diagnostics
 *   POST /webhook/telegram         â€” Telegram bot webhook receiver
 * ============================================================
 */

import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import { callAI, streamAI } from "./services/aiClient";
import { diagnoseAIRouter } from "./services/aiRouter";
import {
  readFileForAI,
  readDirectoryForAI,
  backupAndWrite,
  createFile,
  rollbackFile,
  listBackups,
  getWorkspaceRoot,
  resolveAndValidate,
  backupAndWriteMultiple,
} from "./services/safeFileManager";
import {
  buildCodingPrompt,
  getCodingAIOptions,
  parseAICodeResponse,
  detectTaskFromInstruction,
  type CodingContextOptions,
} from "./services/codingContext";
import { createTelegramHandler, startTelegramPolling } from "./services/telegramBot";
import type { PendingSuggestion } from "./services/assistant-daemon.types";
import { buildSearchIndex, searchCodebase } from "./services/localSearchService";
import { runAutoRepairLoop } from "./services/autoRepairEngine";
import { getAgentRole, listAgentRoles } from "./services/agentRoles";
import { executeWebAIAutomation } from "./services/webAiAutomator";
import { WebAiSessionManager } from "./services/webAiSessionManager";

// ---------------------------------------------------------------------------
// In-memory session store: last AI suggestion per file (for apply/rollback)
// PendingSuggestion type is defined in ./services/assistant-daemon.types.ts
// ---------------------------------------------------------------------------

const pendingSuggestions = new Map<string, PendingSuggestion>();

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();
const PORT = parseInt(process.env.ASSISTANT_PORT ?? "3001", 10);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS for local dev tools (VS Code extensions, Cursor, etc.)
app.use((_req: Request, res: Response, next: NextFunction) => {
  const origin = _req.headers.origin ?? "";
  // Allow all localhost origins (any port) for local dev tools
  if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (_req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** GET /health â€” Health check */
app.get("/health", async (_req: Request, res: Response) => {
  const diagnostics = await diagnoseAIRouter().catch(() => null);
  res.json({
    ok: true,
    service: "AI Coding Assistant Daemon",
    version: "1.0.0",
    workspaceRoot: getWorkspaceRoot(),
    aiRouter: diagnostics
      ? { ok: diagnostics.ok, enabledKeys: diagnostics.totalEnabledKeys }
      : { ok: false, enabledKeys: 0 },
    timestamp: new Date().toISOString(),
  });
});

/** GET /api/status â€” Detailed AI provider diagnostics */
app.get("/api/status", async (_req: Request, res: Response) => {
  try {
    const diagnostics = await diagnoseAIRouter();
    res.json({ ok: true, diagnostics });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/backups?file=<path> â€” List backups for a file */
app.get("/api/backups", async (req: Request, res: Response) => {
  const file = req.query.file as string;
  if (!file) return res.status(400).json({ ok: false, error: "Missing ?file= query param" });

  try {
    const backups = await listBackups(file);
    res.json({ ok: true, file, backups });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/read â€” Read file(s) for inspection */
app.post("/api/read", async (req: Request, res: Response) => {
  const { file, directory, recursive, extensions } = req.body as {
    file?: string;
    directory?: string;
    recursive?: boolean;
    extensions?: string[];
  };

  try {
    if (file) {
      const ctx = await readFileForAI(file);
      return res.json({ ok: true, files: [ctx] });
    }
    if (directory) {
      const files = await readDirectoryForAI(directory, { recursive, extensions });
      return res.json({ ok: true, files });
    }
    res.status(400).json({ ok: false, error: "Provide either 'file' or 'directory' in request body." });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/ask â€” Ask AI a question without file context */
app.post("/api/ask", async (req: Request, res: Response) => {
  const { question, task, model, stream: useStream } = req.body as {
    question: string;
    task?: string;
    model?: "ai-assistant" | "ai-assistant-pro";
    stream?: boolean;
  };

  if (!question?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'question' in request body." });
  }

  const messages = [{ role: "user" as const, content: question }];
  const options = { task: (task as any) ?? "general", model, temperature: 0.5 };

  if (useStream) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
      for await (const chunk of streamAI(messages, options)) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  } else {
    try {
      const result = await callAI(messages, options);
      res.json({ ok: true, answer: result.content, modelUsed: result.modelUsed });
    } catch (err: any) {
      res.status(503).json({ ok: false, error: err.message });
    }
  }
});

/** POST /api/edit — Read file(s) + generate AI edit suggestion */
app.post("/api/edit", async (req: Request, res: Response) => {
  const { file, files, instruction, task, model, agentRole } = req.body as {
    file?: string | string[];
    files?: string[];
    instruction: string;
    task?: string;
    model?: "ai-assistant" | "ai-assistant-pro";
    agentRole?: string;
  };

  const filePaths: string[] = [];
  if (files && Array.isArray(files)) {
    filePaths.push(...files);
  } else if (file) {
    if (Array.isArray(file)) {
      filePaths.push(...file);
    } else {
      filePaths.push(file);
    }
  }

  if (filePaths.length === 0) return res.status(400).json({ ok: false, error: "Missing 'file' or 'files' in request body." });
  if (!instruction?.trim()) return res.status(400).json({ ok: false, error: "Missing 'instruction' in request body." });

  try {
    // 1. Read files context
    const filesCtx = [];
    for (const fp of filePaths) {
      const ctx = await readFileForAI(fp);
      filesCtx.push(ctx);
    }

    // 2. Build system context from Agent Role if selected
    let roleContext = "";
    if (agentRole) {
      const roleDef = getAgentRole(agentRole);
      if (roleDef) {
        roleContext = `## Role Persona: ${roleDef.id}\n${roleDef.systemPrompt}\n\n`;
      }
    }

    // 3. Build AI prompt
    const detectedTask = (task as any) ?? detectTaskFromInstruction(instruction);
    const contextOpts: CodingContextOptions = {
      instruction,
      files: filesCtx,
      task: detectedTask,
      targetFile: filePaths[0], // primary target
      systemContext: roleContext || undefined,
    };
    const messages = buildCodingPrompt(contextOpts);
    const aiOptions = { ...getCodingAIOptions(detectedTask), model: model ?? undefined };

    // 4. Call AI with fallback
    const result = await callAI(messages, aiOptions);

    // 5. Parse code blocks from response
    const parsed = parseAICodeResponse(result.content, filePaths[0]);

    // 6. Store suggestions in session for each parsed block matching target files
    for (const block of parsed.codeBlocks) {
      // Find matching relative path
      const matchedFilePath = filePaths.find(
        (fp) => block.targetFile?.includes(fp) || fp.endsWith(block.targetFile ?? "")
      ) ?? filePaths[0]; // fallback to first target file

      if (matchedFilePath) {
        const absolutePath = resolveAndValidate(matchedFilePath);
        try {
          const originalCtx = filesCtx.find(f => f.absolutePath === absolutePath) ?? await readFileForAI(matchedFilePath);
          pendingSuggestions.set(absolutePath, {
            filePath: absolutePath,
            originalContent: originalCtx.content,
            suggestedContent: block.code,
            explanation: parsed.explanation,
            modelUsed: result.modelUsed,
            createdAt: new Date().toISOString(),
          });
        } catch {
          // Ignore if file read fails
        }
      }
    }

    res.json({
      ok: true,
      files: filePaths,
      instruction,
      taskDetected: detectedTask,
      modelUsed: result.modelUsed,
      explanation: parsed.explanation,
      codeBlocks: parsed.codeBlocks,
      primaryCode: parsed.primaryCode,
      hasPendingSuggestion: parsed.codeBlocks.length > 0,
      rawResponse: result.content,
    });
  } catch (err: any) {
    res.status(err.message.includes("Access denied") ? 403 : 503).json({
      ok: false,
      error: err.message,
    });
  }
});

/** POST /api/apply — Apply reviewed pending suggestions to one or more files */
app.post("/api/apply", async (req: Request, res: Response) => {
  const { file, files, backupStrategy, autoRepair, originalPrompt } = req.body as {
    file?: string | string[];
    files?: string[];
    backupStrategy?: "auto" | "git-commit" | "file-copy";
    autoRepair?: boolean;
    originalPrompt?: string;
  };

  const targets: string[] = [];
  if (files && Array.isArray(files)) {
    targets.push(...files);
  } else if (file) {
    if (Array.isArray(file)) {
      targets.push(...file);
    } else {
      targets.push(file);
    }
  }

  if (targets.length === 0) {
    return res.status(400).json({ ok: false, error: "Missing 'file' or 'files' in request body." });
  }

  try {
    const existingJobs: { filePath: string; relativePath: string; newContent: string }[] = [];
    const newJobs: { filePath: string; relativePath: string; newContent: string }[] = [];

    for (const target of targets) {
      const absolutePath = resolveAndValidate(target);
      const pending = pendingSuggestions.get(absolutePath);
      if (!pending) {
        return res.status(404).json({
          ok: false,
          error: `No reviewed AI suggestion for "${target}". Create or edit a preview first.`,
        });
      }
      
      const job = {
        filePath: absolutePath,
        relativePath: target,
        newContent: pending.suggestedContent,
      };

      if (fs.existsSync(absolutePath)) {
        existingJobs.push(job);
      } else {
        newJobs.push(job);
      }
    }

    const writeResults: any[] = [];

    // Apply backups and write existing files transactionally
    if (existingJobs.length > 0) {
      const results = await backupAndWriteMultiple(
        existingJobs.map(job => ({ filePath: job.filePath, newContent: job.newContent })),
        backupStrategy ?? "auto"
      );
      writeResults.push(...results);
    }

    // Create new files directly
    for (const job of newJobs) {
      await createFile(job.relativePath, job.newContent);
      writeResults.push({
        ok: true,
        bytesWritten: Buffer.byteLength(job.newContent, "utf-8"),
        backup: {
          id: "new-file-creation",
          strategy: "file-creation",
          createdAt: new Date().toISOString(),
        }
      });
    }

    const allJobs = [...existingJobs, ...newJobs];

    // Clear pending suggestions
    for (const job of allJobs) {
      pendingSuggestions.delete(job.filePath);
    }

    // Auto-repair loop if enabled
    let repairStatus: any = null;
    if (autoRepair) {
      repairStatus = await runAutoRepairLoop(
        allJobs.map(job => ({ filePath: job.filePath, relativePath: job.relativePath })),
        originalPrompt ?? "Sửa đổi code theo yêu cầu",
        async (filePath, newContent) => {
          // Direct write during repair (backup is already done in write transaction)
          await fs.promises.writeFile(filePath, newContent, "utf-8");
        },
        async (filePath) => {
          return fs.promises.readFile(filePath, "utf-8");
        }
      );
    }

    res.json({
      ok: true,
      applied: allJobs.map(job => job.relativePath),
      results: writeResults.map(r => ({
        ok: r.ok,
        bytesWritten: r.bytesWritten,
        backup: {
          id: r.backup.id,
          strategy: r.backup.strategy,
          commitHash: r.backup.commitHash,
          backupCopyPath: r.backup.backupCopyPath,
          createdAt: r.backup.createdAt,
        }
      })),
      repairStatus,
      message: `✅ Applied changes to ${allJobs.length} file(s).` + (repairStatus ? ` Repair status: ${repairStatus.message}` : ""),
    });
  } catch (err: any) {
    res.status(err.message.includes("Access denied") ? 403 : 500).json({
      ok: false,
      error: err.message,
    });
  }
});

/** POST /api/search — Search codebase using TF-IDF */
app.post("/api/search", async (req: Request, res: Response) => {
  const { query, limit } = req.body as { query: string; limit?: number };
  if (!query?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'query' in request body." });
  }

  try {
    const results = await searchCodebase(query, limit);
    res.json({ ok: true, results });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/search/reindex — Rebuild search index */
app.post("/api/search/reindex", async (_req: Request, res: Response) => {
  try {
    const stats = await buildSearchIndex();
    res.json({ ok: true, message: "Reindexed successfully.", ...stats });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/ide/selection — Replace a specific selection/range in a file */
app.post("/api/ide/selection", async (req: Request, res: Response) => {
  const { file, selectedText, startLine, endLine, instruction } = req.body as {
    file: string;
    selectedText: string;
    startLine: number;
    endLine: number;
    instruction: string;
  };

  if (!file?.trim()) return res.status(400).json({ ok: false, error: "Missing 'file' in request body." });
  if (startLine === undefined || endLine === undefined) {
    return res.status(400).json({ ok: false, error: "Missing 'startLine' or 'endLine' in request body." });
  }
  if (!instruction?.trim()) return res.status(400).json({ ok: false, error: "Missing 'instruction' in request body." });

  try {
    const fileCtx = await readFileForAI(file);
    const lines = fileCtx.content.split("\n");

    const beforeLines = lines.slice(0, startLine - 1);
    const afterLines = lines.slice(endLine);

    const messages = buildCodingPrompt({
      instruction: `Edit the following selected code block: "${instruction}"`,
      files: [{
        absolutePath: fileCtx.absolutePath,
        relativePath: fileCtx.relativePath,
        content: selectedText,
        language: fileCtx.language,
        sizeBytes: selectedText.length,
        modifiedAt: fileCtx.modifiedAt
      }],
      task: "refactor",
    });

    const result = await callAI(messages, { task: "coding", model: "ai-assistant", temperature: 0.2 });
    const parsed = parseAICodeResponse(result.content);

    if (!parsed.primaryCode) {
      return res.status(422).json({ ok: false, error: "AI did not return replacement code." });
    }

    const newFileContent = [...beforeLines, parsed.primaryCode.code, ...afterLines].join("\n");
    pendingSuggestions.set(fileCtx.absolutePath, {
      filePath: fileCtx.absolutePath,
      originalContent: fileCtx.content,
      suggestedContent: newFileContent,
      explanation: parsed.explanation,
      modelUsed: result.modelUsed,
      createdAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      file,
      suggestedCode: parsed.primaryCode.code,
      explanation: parsed.explanation,
      hasPendingSuggestion: true,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/roles — List available AI agent roles */
app.get("/api/roles", (_req: Request, res: Response) => {
  res.json({ ok: true, roles: listAgentRoles() });
});

/** GET /api/roles/:id — Get one AI agent role including system prompt */
app.get("/api/roles/:id", (req: Request, res: Response) => {
  const role = getAgentRole(req.params.id);
  if (!role) {
    return res.status(404).json({ ok: false, error: "Agent role not found." });
  }
  res.json({ ok: true, role });
});

/** POST /api/rollback â€” Rollback a file to its last backup */
app.post("/api/rollback", async (req: Request, res: Response) => {
  const { file } = req.body as { file: string };

  if (!file?.trim()) return res.status(400).json({ ok: false, error: "Missing 'file' in request body." });

  try {
    const result = await rollbackFile(file);
    res.json({ ok: true, file, ...result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** POST /api/create â€” Create a new file with AI-generated content */
app.post("/api/create", async (req: Request, res: Response) => {
  const { file, instruction, task, context: extraContext } = req.body as {
    file: string;
    instruction: string;
    task?: string;
    context?: string;
  };

  if (!file?.trim()) return res.status(400).json({ ok: false, error: "Missing 'file' in request body." });
  if (!instruction?.trim()) return res.status(400).json({ ok: false, error: "Missing 'instruction' in request body." });

  try {
    const detectedTask = (task as any) ?? detectTaskFromInstruction(instruction);
    const messages = buildCodingPrompt({
      instruction: `Create the file "${file}" with the following requirement:\n\n${instruction}`,
      files: [],
      task: detectedTask,
      targetFile: file,
      systemContext: extraContext,
    });

    const result = await callAI(messages, getCodingAIOptions(detectedTask));
    const parsed = parseAICodeResponse(result.content, file);

    if (!parsed.primaryCode) {
      return res.status(422).json({
        ok: false,
        error: "AI did not return a code block. Try a more specific instruction.",
        rawResponse: result.content,
      });
    }

    const absolutePath = resolveAndValidate(file);
    if (fs.existsSync(absolutePath)) {
      return res.status(409).json({ ok: false, error: `File already exists: ${file}. Use /api/edit instead.` });
    }
    pendingSuggestions.set(absolutePath, {
      filePath: absolutePath,
      originalContent: "",
      suggestedContent: parsed.primaryCode.code,
      explanation: parsed.explanation,
      modelUsed: result.modelUsed,
      createdAt: new Date().toISOString(),
    });

    res.json({
      ok: true,
      file,
      modelUsed: result.modelUsed,
      explanation: parsed.explanation,
      hasPendingSuggestion: true,
      message: `Prepared "${file}" for review. Apply the pending suggestion to create it.`,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** GET /api/web-ai/profiles — List registered browser profiles */
app.get("/api/web-ai/profiles", async (_req: Request, res: Response) => {
  try {
    const profiles = await WebAiSessionManager.listProfiles();
    res.json({ ok: true, profiles });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/profiles — Register a new browser profile */
app.post("/api/web-ai/profiles", async (req: Request, res: Response) => {
  const { name, platform } = req.body as { name: string; platform: string };
  if (!name?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'name' in request body." });
  }
  if (!platform?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'platform' in request body." });
  }

  try {
    const newProfile = await WebAiSessionManager.createProfile(name.trim(), platform.trim());
    res.json({ ok: true, profile: newProfile });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** DELETE /api/web-ai/profiles/:id — Delete a browser profile context */
app.delete("/api/web-ai/profiles/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ ok: false, error: "Missing profile 'id' path parameter." });
  }

  try {
    const success = await WebAiSessionManager.deleteProfile(id);
    if (!success) {
      return res.status(404).json({ ok: false, error: "Profile not found." });
    }
    res.json({ ok: true, message: "Profile deleted successfully." });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/** POST /api/web-ai/execute — Execute prompt on a web AI platform via browser automation */
app.post("/api/web-ai/execute", async (req: Request, res: Response) => {
  const { prompt, platform, file, profileId, headless } = req.body as {
    prompt: string;
    platform: string;
    file?: string | string[];
    profileId?: string;
    headless?: boolean;
  };

  if (!prompt?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'prompt' in request body." });
  }
  if (!platform?.trim()) {
    return res.status(400).json({ ok: false, error: "Missing 'platform' in request body." });
  }

  const filePaths: string[] = [];
  if (file) {
    if (Array.isArray(file)) {
      filePaths.push(...file);
    } else {
      filePaths.push(file);
    }
  }

  try {
    const result = await executeWebAIAutomation(platform, prompt, filePaths[0], { profileId, headless });

    // Store suggestions in session for each parsed block
    for (const block of result.codeBlocks) {
      const matchedFilePath = filePaths.find(
        (fp) => block.targetFile?.includes(fp) || fp.endsWith(block.targetFile ?? "")
      ) ?? filePaths[0];

      if (matchedFilePath) {
        const absolutePath = resolveAndValidate(matchedFilePath);
        let originalContent = "";
        try {
          const originalCtx = await readFileForAI(matchedFilePath);
          originalContent = originalCtx.content;
        } catch {
          // File might be new
        }

        pendingSuggestions.set(absolutePath, {
          filePath: absolutePath,
          originalContent,
          suggestedContent: block.code,
          explanation: result.text,
          modelUsed: result.modelUsed,
          createdAt: new Date().toISOString(),
        });
      }
    }

    res.json({
      ok: true,
      text: result.text,
      codeBlocks: result.codeBlocks,
      modelUsed: result.modelUsed,
      hasPendingSuggestion: result.codeBlocks.length > 0,
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Telegram Webhook
// ---------------------------------------------------------------------------

/** POST /webhook/telegram â€” Receive updates from Telegram */
app.post("/webhook/telegram", async (req: Request, res: Response) => {
  // Respond immediately (Telegram requires 200 within 1s)
  res.sendStatus(200);

  try {
    const handler = createTelegramHandler({ pendingSuggestions });
    await handler(req.body);
  } catch (err: any) {
    console.error("[Telegram Webhook]", err.message);
  }
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[Assistant Daemon Error]", err);
  res.status(500).json({ ok: false, error: err.message });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

export function startAssistantDaemon(): void {
  const server = app.listen(PORT, "127.0.0.1", () => {
    console.log(`\nđŸ¤– AI Coding Assistant Daemon running at http://127.0.0.1:${PORT}`);
    console.log(`   Workspace root: ${getWorkspaceRoot()}`);
    console.log(`   Endpoints:`);
    console.log(`     GET  http://127.0.0.1:${PORT}/health`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/ask`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/edit`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/apply`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/rollback`);
    console.log(`     POST http://127.0.0.1:${PORT}/api/create`);
    console.log(`     GET  http://127.0.0.1:${PORT}/api/status`);
    console.log(`     POST http://127.0.0.1:${PORT}/webhook/telegram\n`);
  });

  // Auto-start Telegram polling if configured
  const telegramMode = process.env.TELEGRAM_MODE ?? "polling";
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (telegramToken && telegramMode === "polling") {
    console.log(`[Telegram] Starting polling mode...`);
    startTelegramPolling({ pendingSuggestions }).catch((err: Error) => {
      console.error(`[Telegram] Polling failed:`, err.message);
    });
  } else if (telegramToken && telegramMode === "webhook") {
    console.log(`[Telegram] Webhook mode â€” set your webhook URL to: <your-public-url>/webhook/telegram`);
  } else if (!telegramToken) {
    console.log(`[Telegram] TELEGRAM_BOT_TOKEN not set â€” bot disabled. Set it in .env to enable.`);
  }

  return server as any;
}

// Allow running standalone with ESM: tsx server/assistant-daemon.ts
// ESM-compatible check: import.meta.url ends with the actual file path
const isEntryPoint = process.argv[1]?.replace(/\\/g, "/").endsWith("server/assistant-daemon.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("assistant-daemon.js");
if (isEntryPoint) {
  startAssistantDaemon();
}

export default app;
