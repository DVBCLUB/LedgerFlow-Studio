/**
 * telegramBot.ts
 * ============================================================
 * Telegram bot handler for the AI Coding Assistant.
 *
 * Supports two modes (configure via env):
 *   TELEGRAM_MODE=webhook  — receive updates via POST /webhook/telegram
 *   TELEGRAM_MODE=polling  — long-poll Telegram API directly (dev mode)
 *
 * Bot commands:
 *   /start              — Introduction and command list
 *   /status             — AI router provider status
 *   /ask <question>     — Ask AI anything
 *   /read <file>        — Read and preview a file
 *   /edit <file> <msg>  — Ask AI to edit a file (returns preview)
 *   /apply              — Apply the last AI suggestion
 *   /rollback <file>    — Rollback file to last backup
 *   /create <file> <msg>— Ask AI to create a new file
 *   /ls [dir]           — List files in a directory
 * ============================================================
 */

import type { PendingSuggestion } from "./assistant-daemon.types";
import { callAI } from "./aiClient";
import { diagnoseAIRouter } from "./aiRouter";
import {
  readFileForAI,
  readDirectoryForAI,
  backupAndWrite,
  createFile,
  rollbackFile,
  resolveAndValidate,
} from "./safeFileManager";
import {
  buildCodingPrompt,
  getCodingAIOptions,
  parseAICodeResponse,
  detectTaskFromInstruction,
} from "./codingContext";
import path from "path";
import fs from "fs";
import { tryHandleTelegramMissionCommand } from "./telegramMissionCommands";
import { subscribe } from "./agentEventBus.ts";
import { getAgentRun, approveAgentRunStep, rejectAgentRunStep } from "./agentRuntime.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TelegramHandlerContext {
  pendingSuggestions: Map<string, PendingSuggestion>;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: { id: number; type: string };
  text?: string;
  document?: { file_id: string; file_name?: string };
}

interface TelegramUser {
  id: number;
  is_bot?: boolean;
  username?: string;
  first_name?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const ALLOWED_CHAT_IDS = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? "")
  .split(",")
  .map((s) => parseInt(s.trim(), 10))
  .filter(Boolean);
const MAX_MESSAGE_LENGTH = 4000; // Telegram max is 4096

// ---------------------------------------------------------------------------
// Public: Factory for webhook handler
// ---------------------------------------------------------------------------

export function createTelegramHandler(ctx: TelegramHandlerContext) {
  return async (update: TelegramUpdate): Promise<void> => {
    // 1. Process Callback Queries (Approve/Reject from Telegram inline buttons)
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data ?? "";
      const chatId = cb.message?.chat.id ?? 0;
      const userId = cb.from.id;

      // Whitelist check
      if (ALLOWED_CHAT_IDS.length > 0 && !ALLOWED_CHAT_IDS.includes(userId)) {
        await sendMessage(chatId, "⛔ Unauthorized. You cannot approve or reject steps.");
        return;
      }

      if (data.startsWith("approve_step:") || data.startsWith("reject_step:")) {
        const parts = data.split(":");
        const action = parts[0];
        const runId = parts[1];
        const stepId = parts[2];
        const fingerprint = parts[3];

        try {
          if (action === "approve_step") {
            const run = await getAgentRun(runId);
            const step = run?.steps.find(s => s.id === stepId);
            const signature = step?.approvalSignature || "";
            await approveAgentRunStep(runId, {
              stepId,
              fingerprint,
              signature,
              phrase: "APPROVE AGENT STEP"
            });
            await sendMessage(chatId, `✅ *Đã duyệt thành công* bước \`${step?.toolId || 'step'}\` cho Mission \`${runId}\`.`);
          } else {
            await rejectAgentRunStep(runId, {
              stepId,
              fingerprint,
              reason: "Founder từ chối qua Telegram."
            });
            await sendMessage(chatId, `❌ *Đã từ chối* bước chạy cho Mission \`${runId}\`.`);
          }
        } catch (err: any) {
          await sendMessage(chatId, `❌ *Lỗi thực thi phê duyệt:* ${err.message}`);
        }
      }

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: cb.id })
      }).catch(() => undefined);
      return;
    }

    // 2. Process Standard text messages
    const message = update.message;
    if (!message?.text) return;

    const chatId = message.chat.id;
    const userId = message.from?.id ?? 0;

    // Security: whitelist check
    if (ALLOWED_CHAT_IDS.length > 0 && !ALLOWED_CHAT_IDS.includes(userId)) {
      await sendMessage(chatId, "⛔ Unauthorized. Your user ID is not in the allowed list.");
      return;
    }

    const text = message.text.trim();
    const [command, ...args] = text.split(/\s+/);

    try {
      if (await tryHandleTelegramMissionCommand(chatId, text, sendMessage)) {
        return;
      }
      switch (command.toLowerCase()) {
        case "/start":
        case "/help":
          await handleStart(chatId);
          break;

        case "/status":
          await handleStatus(chatId);
          break;

        case "/ask": {
          const question = args.join(" ");
          await handleAsk(chatId, question);
          break;
        }

        case "/read": {
          const file = args[0];
          await handleRead(chatId, file);
          break;
        }

        case "/ls": {
          const dir = args[0] ?? ".";
          await handleLs(chatId, dir);
          break;
        }

        case "/edit": {
          const file = args[0];
          const instruction = args.slice(1).join(" ");
          await handleEdit(chatId, file, instruction, ctx);
          break;
        }

        case "/apply": {
          const file = args[0];
          await handleApply(chatId, file, ctx);
          break;
        }

        case "/rollback": {
          const file = args[0];
          await handleRollback(chatId, file);
          break;
        }

        case "/create": {
          const file = args[0];
          const instruction = args.slice(1).join(" ");
          await handleCreate(chatId, file, instruction, ctx);
          break;
        }

        default:
          // If no command, treat as /ask
          if (!text.startsWith("/")) {
            await handleAsk(chatId, text);
          } else {
            await sendMessage(chatId, `❓ Unknown command: ${command}\n\nType /help to see available commands.`);
          }
      }
    } catch (err: any) {
      await sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  };
}

// ---------------------------------------------------------------------------
// Public: Start polling mode (for local dev without webhook)
// ---------------------------------------------------------------------------

export async function startTelegramPolling(ctx: TelegramHandlerContext): Promise<void> {
  if (!BOT_TOKEN) {
    console.warn("[Telegram] TELEGRAM_BOT_TOKEN not set. Polling disabled.");
    return;
  }

  console.log("[Telegram] Starting long-polling mode...");

  let offset = 0;
  const handler = createTelegramHandler(ctx);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const updates = await getUpdates(offset, 30);
      for (const update of updates) {
        offset = update.update_id + 1;
        handler(update).catch((e) => console.error("[Telegram Poll]", e));
      }
    } catch (err: any) {
      console.error("[Telegram Poll error]", err.message);
      await sleep(5000);
    }
  }
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function handleStart(chatId: number): Promise<void> {
  await sendMessage(
    chatId,
    `🤖 *AI Coding Assistant*

Tôi có thể giúp bạn đọc, sửa và tạo file code bằng AI.

*Các lệnh:*
\`/ask <câu hỏi>\` — Hỏi AI bất kỳ điều gì
\`/read <file>\` — Đọc nội dung file
\`/ls [thư_mục]\` — Liệt kê file trong thư mục
\`/edit <file> <hướng_dẫn>\` — Yêu cầu AI sửa file
\`/apply <file>\` — Áp dụng đề xuất AI lên file
\`/rollback <file>\` — Hoàn tác về bản backup trước
\`/create <file> <mô_tả>\` — Tạo file mới bằng AI
\`/status\` — Xem trạng thái các AI provider

*Ví dụ:*
\`/edit src/utils/helper.ts Thêm kiểm tra null cho tham số đầu vào\``,
    { parse_mode: "Markdown" }
  );
}

async function handleStatus(chatId: number): Promise<void> {
  await sendMessage(chatId, "🔍 Đang kiểm tra các AI provider...");

  try {
    const diagnostics = await diagnoseAIRouter();
    const lines = [
      diagnostics.ok ? "✅ *AI Router — Online*" : "⚠️ *AI Router — Degraded*",
      `Total enabled keys: ${diagnostics.totalEnabledKeys}`,
      "",
      ...diagnostics.results.map((r) => {
        const icon = r.status === "ok" ? "🟢" : r.status === "quota" ? "🟡" : "🔴";
        const latency = r.latencyMs ? ` (${r.latencyMs}ms)` : "";
        return `${icon} ${r.provider}/${r.label}${latency}`;
      }),
    ];
    await sendMessage(chatId, lines.join("\n"), { parse_mode: "Markdown" });
  } catch (err: any) {
    await sendMessage(chatId, `❌ Status check failed: ${err.message}`);
  }
}

async function handleAsk(chatId: number, question: string): Promise<void> {
  if (!question?.trim()) {
    return sendMessage(chatId, "❓ Vui lòng nhập câu hỏi. VD: `/ask Giải thích về React hooks`");
  }

  await sendMessage(chatId, "💭 Đang hỏi AI...");

  const result = await callAI([{ role: "user", content: question }], {
    task: "general",
    temperature: 0.5,
  });

  await sendLongMessage(chatId, `🤖 *${result.modelUsed ?? "AI"}:*\n\n${result.content}`, {
    parse_mode: "Markdown",
  });
}

async function handleRead(chatId: number, filePath: string): Promise<void> {
  if (!filePath) {
    return sendMessage(chatId, "❓ Vui lòng chỉ định file. VD: `/read src/App.tsx`");
  }

  try {
    const ctx = await readFileForAI(filePath);
    const preview = ctx.content.length > 2000 ? ctx.content.slice(0, 2000) + "\n\n... (truncated)" : ctx.content;

    await sendMessage(
      chatId,
      `📄 *${ctx.relativePath}*\n> ${ctx.language} | ${Math.round(ctx.sizeBytes / 1024)} KB\n\n\`\`\`${ctx.language}\n${preview}\n\`\`\``,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await sendMessage(chatId, `❌ ${err.message}`);
  }
}

async function handleLs(chatId: number, dirPath: string): Promise<void> {
  try {
    const files = await readDirectoryForAI(dirPath, { recursive: false });
    if (files.length === 0) {
      return sendMessage(chatId, `📂 Thư mục trống: \`${dirPath}\``);
    }

    const lines = files.map((f) => `• \`${f.relativePath}\` (${f.language})`);
    await sendMessage(chatId, `📂 *${dirPath}/*\n\n${lines.join("\n")}`, { parse_mode: "Markdown" });
  } catch (err: any) {
    await sendMessage(chatId, `❌ ${err.message}`);
  }
}

async function handleEdit(
  chatId: number,
  filePath: string,
  instruction: string,
  ctx: TelegramHandlerContext
): Promise<void> {
  if (!filePath || !instruction) {
    return sendMessage(
      chatId,
      "❓ Cú pháp: `/edit <file> <hướng_dẫn>`\nVD: `/edit src/App.tsx Thêm error boundary`"
    );
  }

  await sendMessage(chatId, `🔍 Đang đọc \`${filePath}\`...`);

  try {
    const fileCtx = await readFileForAI(filePath);
    await sendMessage(chatId, `🤖 Đang yêu cầu AI sửa file... (${fileCtx.sizeBytes} bytes)`);

    const detectedTask = detectTaskFromInstruction(instruction);
    const messages = buildCodingPrompt({
      instruction,
      files: [fileCtx],
      task: detectedTask,
      targetFile: filePath,
    });

    const result = await callAI(messages, getCodingAIOptions(detectedTask));
    const parsed = parseAICodeResponse(result.content, filePath);

    if (!parsed.primaryCode) {
      return sendMessage(chatId, `⚠️ AI không trả về code block. Phản hồi:\n\n${parsed.explanation}`);
    }

    // Store suggestion
    ctx.pendingSuggestions.set(fileCtx.absolutePath, {
      filePath: fileCtx.absolutePath,
      originalContent: fileCtx.content,
      suggestedContent: parsed.primaryCode.code,
      explanation: parsed.explanation,
      modelUsed: result.modelUsed,
      createdAt: new Date().toISOString(),
    });

    const previewLines = parsed.primaryCode.code.split("\n").slice(0, 30).join("\n");
    const truncated = parsed.primaryCode.code.split("\n").length > 30 ? "\n... (preview truncated)" : "";

    await sendLongMessage(
      chatId,
      `✨ *AI đề xuất (${result.modelUsed ?? "AI"}):*\n\n${parsed.explanation}\n\n` +
        `\`\`\`${parsed.primaryCode.language}\n${previewLines}${truncated}\n\`\`\`\n\n` +
        `📌 Dùng \`/apply ${filePath}\` để áp dụng, hoặc \`/rollback ${filePath}\` để hoàn tác sau khi apply.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await sendMessage(chatId, `❌ ${err.message}`);
  }
}

async function handleApply(
  chatId: number,
  filePath: string,
  ctx: TelegramHandlerContext
): Promise<void> {
  if (!filePath) {
    return sendMessage(chatId, "❓ Cú pháp: `/apply <file>`\nVD: `/apply src/App.tsx`");
  }

  try {
    const absolutePath = resolveAndValidate(filePath);
    const pending = ctx.pendingSuggestions.get(absolutePath);

    if (!pending) {
      return sendMessage(
        chatId,
        `⚠️ Không có đề xuất AI đang chờ cho \`${filePath}\`.\nHãy dùng \`/edit\` trước.`
      );
    }

    await sendMessage(chatId, `💾 Đang tạo backup và áp dụng thay đổi...`);

    const exists = fs.existsSync(absolutePath);
    const writeResult = exists
      ? await backupAndWrite(filePath, pending.suggestedContent, "auto")
      : {
          ok: true,
          backup: { id: "new-file-creation", strategy: "file-creation" as const, createdAt: new Date().toISOString() },
          bytesWritten: Buffer.byteLength(pending.suggestedContent, "utf-8"),
        };
    if (!exists) await createFile(filePath, pending.suggestedContent);
    ctx.pendingSuggestions.delete(absolutePath);

    const backupInfo = writeResult.backup.strategy === "git-commit"
      ? `Git commit: \`${writeResult.backup.commitHash?.slice(0, 7)}\``
      : writeResult.backup.strategy === "file-creation"
        ? "New file (no previous content)"
        : `File backup: \`${writeResult.backup.backupCopyPath}\``;

    await sendMessage(
      chatId,
      `✅ *Đã apply thành công!*\n\n` +
        `📄 File: \`${filePath}\`\n` +
        `📦 Backup: ${backupInfo}\n` +
        `📏 ${writeResult.bytesWritten} bytes\n\n` +
        `Dùng \`/rollback ${filePath}\` nếu muốn hoàn tác.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await sendMessage(chatId, `❌ ${err.message}`);
  }
}

async function handleRollback(chatId: number, filePath: string): Promise<void> {
  if (!filePath) {
    return sendMessage(chatId, "❓ Cú pháp: `/rollback <file>`\nVD: `/rollback src/App.tsx`");
  }

  try {
    await sendMessage(chatId, `⏪ Đang rollback \`${filePath}\`...`);
    const result = await rollbackFile(filePath);
    await sendMessage(chatId, result.message);
  } catch (err: any) {
    await sendMessage(chatId, `❌ ${err.message}`);
  }
}

async function handleCreate(
  chatId: number,
  filePath: string,
  instruction: string,
  ctx: TelegramHandlerContext
): Promise<void> {
  if (!filePath || !instruction) {
    return sendMessage(
      chatId,
      "❓ Cú pháp: `/create <file> <mô_tả>`\nVD: `/create src/utils/dateHelper.ts Tạo các hàm format ngày tháng`"
    );
  }

  await sendMessage(chatId, `🤖 Đang tạo file \`${filePath}\`...`);

  try {
    const messages = buildCodingPrompt({
      instruction: `Create the file "${filePath}" with: ${instruction}`,
      files: [],
      task: "generate",
      targetFile: filePath,
    });

    const result = await callAI(messages, getCodingAIOptions("generate"));
    const parsed = parseAICodeResponse(result.content, filePath);

    if (!parsed.primaryCode) {
      return sendMessage(chatId, `⚠️ AI không trả về code. Thử hướng dẫn cụ thể hơn.`);
    }

    const absolutePath = resolveAndValidate(filePath);
    if (fs.existsSync(absolutePath)) {
      return sendMessage(chatId, `File already exists: \`${filePath}\`. Use \`/edit\` instead.`);
    }
    ctx.pendingSuggestions.set(absolutePath, {
      filePath: absolutePath,
      originalContent: "",
      suggestedContent: parsed.primaryCode.code,
      explanation: parsed.explanation,
      modelUsed: result.modelUsed,
      createdAt: new Date().toISOString(),
    });

    await sendMessage(
      chatId,
      `✅ *Đã tạo bản xem trước!*\n\n` +
        `📄 \`${filePath}\`\n` +
        `🤖 ${result.modelUsed ?? "AI"}\n\n` +
        `${parsed.explanation}\n\nDùng \`/apply ${filePath}\` để tạo file.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await sendMessage(chatId, `❌ ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Telegram API helpers
// ---------------------------------------------------------------------------

async function sendMessage(
  chatId: number,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  if (!BOT_TOKEN) return; // Silently skip if bot not configured

  const safeText = text.slice(0, MAX_MESSAGE_LENGTH);
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: safeText, ...extra }),
  });
}

async function sendLongMessage(
  chatId: number,
  text: string,
  extra: Record<string, unknown> = {}
): Promise<void> {
  if (text.length <= MAX_MESSAGE_LENGTH) {
    return sendMessage(chatId, text, extra);
  }

  // Split into chunks
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, MAX_MESSAGE_LENGTH));
    remaining = remaining.slice(MAX_MESSAGE_LENGTH);
  }

  for (const chunk of chunks) {
    await sendMessage(chatId, chunk, extra);
    await sleep(300); // Avoid Telegram rate limit
  }
}

async function getUpdates(offset: number, timeout = 30): Promise<TelegramUpdate[]> {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=${timeout}`,
    { signal: AbortSignal.timeout((timeout + 5) * 1000) }
  );

  if (!response.ok) {
    throw new Error(`Telegram getUpdates failed: HTTP ${response.status}`);
  }

  const data = await response.json() as { ok: boolean; result: TelegramUpdate[] };
  if (!data.ok) throw new Error(`Telegram API error`);

  return data.result ?? [];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Telegram Notification & Event Subscriptions
// ---------------------------------------------------------------------------

export async function sendTelegramNotification(
  text: string,
  replyMarkup?: Record<string, unknown>
): Promise<void> {
  if (ALLOWED_CHAT_IDS.length === 0) return;
  for (const chatId of ALLOWED_CHAT_IDS) {
    try {
      await sendMessage(chatId, text, replyMarkup);
    } catch (err) {
      console.error("[Telegram Notification Error]", err);
    }
  }
}

// Subscribe to approval requested events
subscribe("agent.step.approval_required" as any, async (event) => {
  const { runId, stepId, toolId, fingerprint } = event.payload as { runId: string; stepId: string; toolId: string; fingerprint: string };
  try {
    const run = await getAgentRun(runId);
    const step = run?.steps.find(s => s.id === stepId);
    if (!run || !step) return;

    await sendTelegramNotification(
      `⚠️ *YÊU CẦU PHÊ DUYỆT BƯỚC CHẠY AGENT*\n\n` +
      `🧭 *Goal:* ${run.goal}\n` +
      `🛠️ *Công cụ:* \`${toolId}\` (Rủi ro: \`${step.risk}\`)\n` +
      `📝 *Nội dung:* ${step.title}\n` +
      `🔑 *Fingerprint:* \`${fingerprint}\`\n\n` +
      `Founder vui lòng duyệt nhanh bằng cách bấm nút bên dưới:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Duyệt chạy ✅", callback_data: `approve_step:${runId}:${stepId}:${fingerprint}` },
              { text: "Từ chối ❌", callback_data: `reject_step:${runId}:${stepId}:${fingerprint}` }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error("[Telegram Approval Sub Error]", err);
  }
});
