/**
 * codingContext.ts
 * ============================================================
 * Builds structured AI prompt messages for coding tasks.
 *
 * Features:
 *  - Auto-detect coding task type (fix, refactor, generate, review)
 *  - Inject file content into the message context
 *  - Format AI output instructions (return code blocks)
 *  - Extract code blocks from AI responses
 *  - Generate unified diff for apply preview
 * ============================================================
 */

import type { ChatMessage, CallAIOptions } from "./aiClient";
import type { FileContext } from "./safeFileManager";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CodingTask = "fix" | "refactor" | "generate" | "review" | "explain" | "test" | "general";

export interface CodingContextOptions {
  instruction: string;
  files: FileContext[];
  task?: CodingTask;
  /** Extra system instructions (e.g. project conventions) */
  systemContext?: string;
  /** Target file path for output (if single-file edit) */
  targetFile?: string;
  /** If true, ask AI to return a unified diff instead of full file */
  diffMode?: boolean;
}

export interface ExtractedCode {
  /** Language of the code block */
  language: string;
  /** The code content */
  code: string;
  /** Target file path (if AI specified one) */
  targetFile?: string;
}

export interface AICodeResponse {
  /** Raw AI response text */
  rawResponse: string;
  /** All extracted code blocks */
  codeBlocks: ExtractedCode[];
  /** Primary code block (first one, or one matching targetFile) */
  primaryCode?: ExtractedCode;
  /** Explanation / non-code text from AI */
  explanation: string;
  /** True if response contains an actual diff (---/+++) */
  hasDiff: boolean;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the messages array to send to the AI router for a coding task.
 */
export function buildCodingPrompt(options: CodingContextOptions): ChatMessage[] {
  const { instruction, files, task = "general", systemContext, targetFile, diffMode } = options;

  const detectedTask = task === "general" ? detectTaskFromInstruction(instruction) : task;

  const systemMessage = buildSystemMessage(detectedTask, files.length, systemContext, diffMode);
  const userMessage = buildUserMessage(instruction, files, targetFile, diffMode);

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
}

/**
 * Get the recommended CallAIOptions for a coding task.
 */
export function getCodingAIOptions(task: CodingTask = "general"): CallAIOptions {
  const isComplex = ["refactor", "generate", "test"].includes(task);
  return {
    task: "coding",
    model: isComplex ? "ai-assistant-pro" : "ai-assistant",
    temperature: task === "review" || task === "explain" ? 0.3 : 0.2,
    maxTokens: isComplex ? 4096 : 2048,
  };
}

/**
 * Parse the raw AI response to extract code blocks and explanation.
 */
export function parseAICodeResponse(
  rawResponse: string,
  targetFile?: string
): AICodeResponse {
  const codeBlocks = extractCodeBlocks(rawResponse);
  const explanation = stripCodeBlocks(rawResponse).trim();
  const hasDiff = rawResponse.includes("--- a/") || rawResponse.includes("+++ b/");

  // Find the primary code block
  let primaryCode: ExtractedCode | undefined;

  if (targetFile) {
    // Prefer a block annotated with the target filename
    const ext = targetFile.split(".").pop()?.toLowerCase() ?? "";
    primaryCode = codeBlocks.find(
      (b) =>
        b.targetFile?.includes(targetFile) ||
        b.language === extensionToLanguage(ext)
    );
  }

  if (!primaryCode && codeBlocks.length > 0) {
    primaryCode = codeBlocks[0];
  }

  return { rawResponse, codeBlocks, primaryCode, explanation, hasDiff };
}

/**
 * Auto-detect the coding task from a natural language instruction.
 */
export function detectTaskFromInstruction(instruction: string): CodingTask {
  const text = instruction.toLowerCase();

  if (/\b(fix|sửa|lỗi|bug|error|không chạy|crash|fail|wrong)\b/.test(text)) return "fix";
  if (/\b(refactor|tái cấu trúc|clean|improve|optimize|cải thiện)\b/.test(text)) return "refactor";
  if (/\b(generate|create|add|thêm|tạo|viết|write|implement|xây dựng)\b/.test(text)) return "generate";
  if (/\b(review|kiểm tra|check|audit|analyze|phân tích)\b/.test(text)) return "review";
  if (/\b(explain|giải thích|hiểu|understand|how does|làm thế nào)\b/.test(text)) return "explain";
  if (/\b(test|unit test|viết test|spec|jest|mocha)\b/.test(text)) return "test";

  return "general";
}

// ---------------------------------------------------------------------------
// Internal — Prompt builders
// ---------------------------------------------------------------------------

function buildSystemMessage(
  task: CodingTask,
  fileCount: number,
  systemContext?: string,
  diffMode?: boolean
): string {
  const taskInstructions: Record<CodingTask, string> = {
    fix: "Your task is to identify and fix bugs or errors in the provided code. Focus on correctness and minimal changes.",
    refactor: "Your task is to refactor the code to improve readability, maintainability, and performance. Preserve existing functionality.",
    generate: "Your task is to generate new code or add features as requested. Follow the existing code style and conventions.",
    review: "Your task is to review the code and provide actionable feedback on quality, bugs, security, and best practices.",
    explain: "Your task is to explain what the code does in clear, simple language. Use examples where helpful.",
    test: "Your task is to write comprehensive unit tests for the provided code. Cover edge cases and common scenarios.",
    general: "You are an expert software engineer. Help with the coding task as requested.",
  };

  const outputFormat = diffMode
    ? `## Output Format
Return your changes as a unified diff format:
\`\`\`diff
--- a/path/to/file
+++ b/path/to/file
@@ -line,count +line,count @@
 context
-removed line
+added line
 context
\`\`\``
    : `## Output Format
- Return the COMPLETE modified file content in a properly labeled code block.
- Use the format: \`\`\`<language>\\n<code>\\n\`\`\`
- If modifying a specific file, include the filename as a comment at the top.
- Provide a brief explanation BEFORE the code block.
- Do NOT truncate or abbreviate the code with "..." — always return the complete file.`;

  const parts = [
    "You are an expert AI coding assistant integrated into a local development environment.",
    "",
    `## Task Type: ${task.toUpperCase()}`,
    taskInstructions[task],
    "",
    outputFormat,
    "",
    "## Rules",
    "- Preserve existing code style (indentation, naming conventions).",
    "- Do not introduce unnecessary dependencies.",
    "- If you are unsure, explain your reasoning and ask for clarification.",
    fileCount > 0
      ? `- You have been given ${fileCount} file(s) for context. Base your changes on the LATEST content provided.`
      : "",
  ];

  if (systemContext) {
    parts.push("", "## Project Context", systemContext);
  }

  return parts.filter((p) => p !== undefined).join("\n");
}

function buildUserMessage(
  instruction: string,
  files: FileContext[],
  targetFile?: string,
  _diffMode?: boolean
): string {
  const parts: string[] = [];

  parts.push(`## Instruction\n${instruction}`);

  if (files.length > 0) {
    parts.push("\n## Files");

    for (const file of files) {
      const isTarget = targetFile && file.relativePath.includes(targetFile);
      const label = isTarget ? `[TARGET] ${file.relativePath}` : file.relativePath;

      parts.push(
        `\n### ${label}`,
        `> Language: ${file.language} | Size: ${formatBytes(file.sizeBytes)} | Modified: ${file.modifiedAt}`,
        "",
        "```" + file.language,
        file.content,
        "```"
      );
    }
  }

  if (targetFile && !files.some((f) => f.relativePath.includes(targetFile))) {
    parts.push(`\n> Target output file: ${targetFile}`);
  }

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Internal — Code block extraction
// ---------------------------------------------------------------------------

function extractCodeBlocks(text: string): ExtractedCode[] {
  const blocks: ExtractedCode[] = [];
  // Match ``` fenced code blocks with optional language
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const language = match[1]?.toLowerCase() ?? "plaintext";
    const code = match[2] ?? "";

    // Try to extract filename from first-line comment
    const firstLine = code.split("\n")[0].trim();
    let targetFile: string | undefined;

    // Patterns: // filename.ts | # filename.py | // file: path/to/file | /* path: path */
    const fileComment = firstLine.match(
      /^(?:\/\/|#|\/\*)\s*(?:(?:file|path|filename)?:\s*)?([\w./\\-]+\.\w+)(?:\s*\*\/)?/i
    );
    if (fileComment) {
      targetFile = fileComment[1];
    }

    if (code.trim()) {
      blocks.push({ language, code: code.trim(), targetFile });
    }
  }

  return blocks;
}

function stripCodeBlocks(text: string): string {
  return text.replace(/```[\w]*\n[\s\S]*?```/g, "").replace(/\n{3,}/g, "\n\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extensionToLanguage(ext: string): string {
  const map: Record<string, string> = {
    ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx",
    py: "python", go: "go", rs: "rust", java: "java",
    cs: "csharp", rb: "ruby", php: "php", html: "html",
    css: "css", scss: "scss", json: "json", yaml: "yaml",
    yml: "yaml", md: "markdown", sh: "bash", sql: "sql",
    vue: "vue", svelte: "svelte",
  };
  return map[ext] ?? ext;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}
