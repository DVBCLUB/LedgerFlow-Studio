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

import type { ChatMessage, CallAIOptions } from "./aiClient.ts";
import type { FileContext } from "./safeFileManager.ts";

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
  /** Optional custom limit on character count for context optimization */
  maxCharLimit?: number;
  /** Approved local RAG knowledge notes to filter and inject */
  knowledgeNotes?: Array<{ title: string; body: string; tags?: string; source?: string }>;
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
 * Clean tokenizer matching localSearchService
 */
function tokenizeText(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9_-]+/).filter((token) => token.length > 1);
}

/**
 * Optimize coding files context window by scoring relevance to the instruction.
 * Always keeps the targetFile first, and ranks other files by token overlap density.
 */
export function optimizeCodingContext(
  instruction: string,
  files: FileContext[],
  targetFile?: string,
  maxCharLimit = 30000
): { optimizedFiles: FileContext[]; excludedCount: number } {
  const totalLength = files.reduce((sum, f) => sum + (f.content || "").length, 0);
  if (totalLength <= maxCharLimit) {
    return { optimizedFiles: files, excludedCount: 0 };
  }

  const queryTokens = tokenizeText(instruction);

  const scoredFiles = files.map((file) => {
    let score = 0;
    const isTarget = Boolean(targetFile && file.relativePath.includes(targetFile));

    if (queryTokens.length > 0 && file.content) {
      const fileTokens = tokenizeText(file.content);
      const tokenCounts = new Map<string, number>();
      for (const t of fileTokens) {
        tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);
      }

      for (const q of queryTokens) {
        if (tokenCounts.has(q)) {
          score += tokenCounts.get(q)!;
        }
      }
    }

    return {
      file,
      score,
      isTarget,
    };
  });

  scoredFiles.sort((a, b) => {
    if (a.isTarget && !b.isTarget) return -1;
    if (!a.isTarget && b.isTarget) return 1;
    return b.score - a.score;
  });

  const optimizedFiles: FileContext[] = [];
  let currentLength = 0;
  let excludedCount = 0;

  for (const item of scoredFiles) {
    const fileLen = (item.file.content || "").length;
    if (item.isTarget || currentLength + fileLen <= maxCharLimit) {
      optimizedFiles.push(item.file);
      currentLength += fileLen;
    } else {
      excludedCount++;
    }
  }

  return { optimizedFiles, excludedCount };
}

/**
 * Build the messages array to send to the AI router for a coding task.
 */
export function buildCodingPrompt(options: CodingContextOptions): ChatMessage[] {
  const { instruction, files, task = "general", systemContext, targetFile, diffMode, maxCharLimit, knowledgeNotes } = options;

  const detectedTask = task === "general" ? detectTaskFromInstruction(instruction) : task;

  const { optimizedFiles, excludedCount } = optimizeCodingContext(instruction, files, targetFile, maxCharLimit);

  // Filter and select top relevant knowledge notes from local storage array
  const relevantNotes = rankAndSelectKnowledgeNotes(instruction, optimizedFiles, knowledgeNotes);
  let knowledgeNotesSection = "";
  if (relevantNotes.length > 0) {
    knowledgeNotesSection = "## Company Memory / Local RAG Notes\n" +
      relevantNotes.map((note, index) => {
        return `### Note #${index + 1}: ${note.title} (Source: ${note.source || 'General'})\nTags: ${note.tags || 'none'}\n\n${note.body}`;
      }).join("\n\n---\n\n");
  }

  const systemMessage = buildSystemMessage(detectedTask, optimizedFiles.length, systemContext, diffMode, knowledgeNotesSection);
  let userMessage = buildUserMessage(instruction, optimizedFiles, targetFile, diffMode);

  if (excludedCount > 0) {
    userMessage = `> [NOTE] Context window optimized. Excluded ${excludedCount} less relevant source files to fit within web chat limits.\n\n${userMessage}`;
  }

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

/**
 * Rank and select local RAG knowledge notes based on keyword overlap
 */
export function rankAndSelectKnowledgeNotes(
  instruction: string,
  files: FileContext[],
  notes?: Array<{ title: string; body: string; tags?: string; source?: string }>,
  maxNotes = 5
): Array<{ title: string; body: string; tags?: string; source?: string }> {
  if (!notes || notes.length === 0) return [];

  let queryText = instruction;
  for (const f of files) {
    queryText += " " + f.relativePath + " " + (f.content || "").slice(0, 500);
  }

  const queryTokens = tokenizeText(queryText);
  if (queryTokens.length === 0) {
    return notes.slice(0, maxNotes);
  }

  const scoredNotes = notes.map((note) => {
    let score = 0;
    const noteText = `${note.title} ${note.body} ${note.tags || ""} ${note.source || ""}`;
    const noteTokens = tokenizeText(noteText);
    const tokenCounts = new Map<string, number>();
    for (const t of noteTokens) {
      tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);
    }

    for (const q of queryTokens) {
      if (tokenCounts.has(q)) {
        score += tokenCounts.get(q)!;
      }
    }

    return { note, score };
  });

  scoredNotes.sort((a, b) => b.score - a.score);

  // Only return notes that match at least 1 keyword (score > 0)
  const matchingNotes = scoredNotes.filter((item) => item.score > 0);
  return matchingNotes.slice(0, maxNotes).map((item) => item.note);
}

function buildSystemMessage(
  task: CodingTask,
  fileCount: number,
  systemContext?: string,
  diffMode?: boolean,
  knowledgeNotesSection?: string
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

  if (knowledgeNotesSection) {
    parts.push("", knowledgeNotesSection);
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
