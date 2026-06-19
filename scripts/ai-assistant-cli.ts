#!/usr/bin/env ts-node
/**
 * ai-assistant-cli.ts
 * ============================================================
 * Command-line interface for the AI Coding Assistant.
 *
 * Usage (direct):
 *   npx ts-node scripts/ai-assistant-cli.ts <command> [options]
 *
 * Usage (via daemon — daemon must be running on port 3001):
 *   npx ts-node scripts/ai-assistant-cli.ts --daemon ask "question"
 *
 * Commands:
 *   ask <question>           — Ask AI a question
 *   read <file>              — Read and display a file
 *   ls [dir]                 — List files in directory
 *   edit <file> <instruction> — AI edit suggestion for a file
 *   apply <file>             — Apply last AI suggestion to file
 *   rollback <file>          — Rollback file to last backup
 *   create <file> <desc>     — Create new file with AI
 *   status                   — Show AI provider status
 *   export <file> [out]      — Export AI context for VS Code/Cursor
 * ============================================================
 */

import { Command } from "commander";
import path from "path";
import fs from "fs";
import readline from "readline";

const DAEMON_URL = process.env.ASSISTANT_URL ?? "http://127.0.0.1:3001";
const WORKSPACE_ROOT = process.env.ASSISTANT_WORKSPACE ?? process.cwd();

// ---------------------------------------------------------------------------
// CLI Setup
// ---------------------------------------------------------------------------

const program = new Command();

program
  .name("ai-assistant")
  .description("Local AI Coding Assistant — Multi-LLM powered code editor")
  .version("1.0.0")
  .option("--daemon", "Route commands through the running daemon instead of direct call");

// ── ask ──────────────────────────────────────────────────────────────────────
program
  .command("ask <question...>")
  .description("Ask AI a question")
  .option("-m, --model <model>", "Model tier: 'pro' or 'fast'", "fast")
  .option("-t, --task <task>", "Task hint: coding|analytics|marketing|general", "general")
  .action(async (words: string[], opts) => {
    const question = words.join(" ");
    await daemonPost("/api/ask", {
      question,
      task: opts.task,
      model: opts.model === "pro" ? "ai-assistant-pro" : "ai-assistant",
    }, (data) => {
      printAIResponse(data.answer, data.modelUsed);
    });
  });

// ── read ──────────────────────────────────────────────────────────────────────
program
  .command("read <file>")
  .description("Read a file and display its content")
  .option("-n, --lines <n>", "Maximum lines to show", "50")
  .action(async (file: string, opts) => {
    await daemonPost("/api/read", { file }, (data) => {
      const ctx = data.files[0];
      if (!ctx) return console.log("❌ File not found.");

      console.log(`\n📄 ${ctx.relativePath}`);
      console.log(`   Language: ${ctx.language} | Size: ${ctx.sizeBytes} bytes`);
      console.log(`   Modified: ${ctx.modifiedAt}\n`);
      console.log("─".repeat(60));

      const lines = ctx.content.split("\n");
      const maxLines = parseInt(opts.lines, 10);
      const display = lines.slice(0, maxLines);
      console.log(display.join("\n"));

      if (lines.length > maxLines) {
        console.log(`\n... (${lines.length - maxLines} more lines — use -n to increase)`);
      }
    });
  });

// ── ls ───────────────────────────────────────────────────────────────────────
program
  .command("ls [dir]")
  .description("List files in a directory")
  .option("-r, --recursive", "Recurse into subdirectories")
  .action(async (dir = ".", opts) => {
    await daemonPost("/api/read", { directory: dir, recursive: opts.recursive }, (data) => {
      console.log(`\n📂 ${dir}/\n`);
      for (const f of data.files) {
        const kb = Math.round(f.sizeBytes / 1024);
        console.log(`  ${f.relativePath.padEnd(50)} ${f.language.padEnd(20)} ${kb} KB`);
      }
      console.log(`\n${data.files.length} file(s)`);
    });
  });

// ── edit ─────────────────────────────────────────────────────────────────────
program
  .command("edit <file> <instruction...>")
  .description("Ask AI to suggest edits for a file (preview only — use 'apply' to write)")
  .option("-m, --model <model>", "Model tier: 'pro' or 'fast'", "pro")
  .option("--apply", "Apply immediately after generating (skip confirmation)")
  .action(async (file: string, words: string[], opts) => {
    const instruction = words.join(" ");
    const model = opts.model === "pro" ? "ai-assistant-pro" : "ai-assistant";

    console.log(`\n🔍 Reading ${file}...`);
    console.log(`🤖 Asking AI: "${instruction}" (model: ${model})\n`);

    await daemonPost("/api/edit", { file, instruction, model }, async (data) => {
      console.log("─".repeat(60));
      console.log(`✨ AI Suggestion (${data.modelUsed ?? "AI"})`);
      console.log("─".repeat(60));

      if (data.explanation) {
        console.log(`\n${data.explanation}\n`);
      }

      if (data.primaryCode) {
        const lines = data.primaryCode.code.split("\n");
        const preview = lines.slice(0, 40).join("\n");
        console.log(`\`\`\`${data.primaryCode.language}`);
        console.log(preview);
        if (lines.length > 40) console.log(`... (${lines.length - 40} more lines)`);
        console.log("```");
      }

      console.log("\n─".repeat(60));

      if (opts.apply) {
        console.log(`\n💾 Applying changes (--apply flag set)...`);
        await applyFile(file);
      } else {
        console.log(`\nTo apply: ai-assistant apply ${file}`);
        console.log(`To rollback after apply: ai-assistant rollback ${file}`);
      }
    });
  });

// ── apply ────────────────────────────────────────────────────────────────────
program
  .command("apply <file>")
  .description("Apply the last AI suggestion to a file (creates backup first)")
  .option("--strategy <s>", "Backup strategy: auto|git-commit|file-copy", "auto")
  .option("--yes, -y", "Skip confirmation prompt")
  .action(async (file: string, opts) => {
    if (!opts.yes) {
      const confirmed = await confirm(
        `\n⚠️  Apply AI changes to "${file}"? This will modify the file on disk (backup will be created). [y/N] `
      );
      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }
    }

    await applyFile(file, opts.strategy);
  });

// ── rollback ──────────────────────────────────────────────────────────────────
program
  .command("rollback <file>")
  .description("Rollback a file to its last AI backup")
  .option("--yes, -y", "Skip confirmation prompt")
  .action(async (file: string, opts) => {
    if (!opts.yes) {
      const confirmed = await confirm(
        `\n⚠️  Rollback "${file}" to the last backup? [y/N] `
      );
      if (!confirmed) {
        console.log("Cancelled.");
        return;
      }
    }

    await daemonPost("/api/rollback", { file }, (data) => {
      console.log(`\n${data.message ?? "✅ Rolled back."}`);
    });
  });

// ── create ───────────────────────────────────────────────────────────────────
program
  .command("create <file> <description...>")
  .description("Create a new file with AI-generated content")
  .option("-m, --model <model>", "Model tier: 'pro' or 'fast'", "pro")
  .action(async (file: string, words: string[], opts) => {
    const description = words.join(" ");
    const model = opts.model === "pro" ? "ai-assistant-pro" : "ai-assistant";

    console.log(`\n🤖 Generating "${file}"...`);

    await daemonPost("/api/create", { file, instruction: description, model }, (data) => {
      console.log(`\n✅ ${data.message}`);
      if (data.explanation) console.log(`\n${data.explanation}`);
    });
  });

// ── status ───────────────────────────────────────────────────────────────────
program
  .command("status")
  .description("Show AI provider status and key health")
  .action(async () => {
    await daemonGet("/api/status", (data) => {
      const d = data.diagnostics;
      console.log(`\n🤖 AI Router — ${d.ok ? "✅ Online" : "⚠️  Degraded"}`);
      console.log(`   Checked: ${d.checkedAt}`);
      console.log(`   Enabled keys: ${d.totalEnabledKeys}\n`);
      console.log("─".repeat(60));

      for (const r of d.results) {
        const icon = r.status === "ok" ? "🟢" : r.status === "quota" ? "🟡" : "🔴";
        const latency = r.latencyMs ? ` (${r.latencyMs}ms)` : "";
        console.log(`${icon} ${r.provider}/${r.label}${latency}`);
        if (r.message) console.log(`   ${r.message}`);
      }
      console.log();
    });
  });

// ── export ───────────────────────────────────────────────────────────────────
program
  .command("export <file> [output]")
  .description("Export a file as a VS Code / Cursor context file (.context.json)")
  .action(async (file: string, outputPath?: string) => {
    await daemonPost("/api/read", { file }, async (data) => {
      const ctx = data.files[0];
      if (!ctx) return console.log("❌ File not found.");

      const contextFile = {
        version: 1,
        generatedAt: new Date().toISOString(),
        workspaceRoot: WORKSPACE_ROOT,
        files: [
          {
            path: ctx.relativePath,
            content: ctx.content,
            language: ctx.language,
          },
        ],
        suggestedCode: null,
        diff: null,
      };

      const outPath = outputPath ?? `${ctx.relativePath}.context.json`;
      const absOut = path.resolve(WORKSPACE_ROOT, outPath);

      fs.mkdirSync(path.dirname(absOut), { recursive: true });
      fs.writeFileSync(absOut, JSON.stringify(contextFile, null, 2), "utf-8");

      console.log(`\n✅ Context exported to: ${outPath}`);
      console.log(`   Open in VS Code: code ${outPath}`);
    });
  });

// ── interactive REPL ──────────────────────────────────────────────────────────
program
  .command("chat")
  .description("Start an interactive chat session with AI")
  .action(async () => {
    await startInteractiveChat();
  });

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

async function daemonPost(
  endpoint: string,
  body: Record<string, unknown>,
  onSuccess: (data: any) => void | Promise<void>
): Promise<void> {
  try {
    const response = await fetch(`${DAEMON_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json() as any;

    if (!response.ok || !data.ok) {
      console.error(`\n❌ Error: ${data.error ?? `HTTP ${response.status}`}`);
      if (response.status === 503) {
        console.error(`   Hint: Check AI keys — run: ai-assistant status`);
      }
      process.exit(1);
    }

    await onSuccess(data);
  } catch (err: any) {
    if (err.code === "ECONNREFUSED") {
      console.error(`\n❌ Cannot connect to AI Assistant Daemon at ${DAEMON_URL}`);
      console.error(`   Start it with: npm run assistant:start`);
      process.exit(1);
    }
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}

async function daemonGet(
  endpoint: string,
  onSuccess: (data: any) => void | Promise<void>
): Promise<void> {
  try {
    const response = await fetch(`${DAEMON_URL}${endpoint}`);
    const data = await response.json() as any;
    if (!response.ok || !data.ok) {
      console.error(`\n❌ Error: ${data.error ?? `HTTP ${response.status}`}`);
      process.exit(1);
    }
    await onSuccess(data);
  } catch (err: any) {
    if (err.code === "ECONNREFUSED") {
      console.error(`\n❌ Daemon not running. Start with: npm run assistant:start`);
      process.exit(1);
    }
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  }
}

async function applyFile(file: string, strategy = "auto"): Promise<void> {
  await daemonPost("/api/apply", { file, backupStrategy: strategy }, (data) => {
    console.log(`\n${data.message}`);
    const b = data.backup;
    if (b.strategy === "git-commit") {
      console.log(`   Git commit: ${b.commitHash?.slice(0, 7)}`);
    } else {
      console.log(`   Backup copy: ${b.backupCopyPath}`);
    }
  });
}

function printAIResponse(content: string, modelUsed?: string): void {
  console.log(`\n${"─".repeat(60)}`);
  if (modelUsed) console.log(`🤖 ${modelUsed}\n`);
  console.log(content);
  console.log("─".repeat(60) + "\n");
}

async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

async function startInteractiveChat(): Promise<void> {
  console.log("\n🤖 AI Coding Assistant — Interactive Chat");
  console.log("   Type your question and press Enter. Type 'exit' to quit.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const askQuestion = (): void => {
    rl.question("You: ", async (input) => {
      const text = input.trim();
      if (!text || text === "exit" || text === "quit") {
        console.log("\nGoodbye! 👋");
        rl.close();
        return;
      }

      await daemonPost("/api/ask", { question: text, task: "general" }, (data) => {
        console.log(`\nAI (${data.modelUsed ?? ""}): ${data.answer}\n`);
      });

      askQuestion();
    });
  };

  askQuestion();
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

program.parse(process.argv);

// Show help if no args
if (process.argv.length <= 2) {
  program.help();
}
