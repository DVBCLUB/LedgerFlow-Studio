/**
 * safeFileManager.ts
 * ============================================================
 * Safe read/write/rollback manager for the AI Coding Assistant.
 *
 * Contract:
 *  1. Always backup BEFORE writing AI-generated code.
 *  2. Validate paths stay within the configured workspace root.
 *  3. Support rollback to the last backup at any time.
 *
 * Backup strategies (tried in order):
 *  A. git-commit  — git add + commit with ai-backup message (best)
 *  B. file-copy   — copy to .ai_backups/<timestamp>/ (always works)
 * ============================================================
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BackupStrategyType = "git-commit" | "file-copy" | "auto";

export interface FileContext {
  /** Absolute path to the file */
  absolutePath: string;
  /** Relative path from workspace root */
  relativePath: string;
  /** File contents as string */
  content: string;
  /** Detected language from extension */
  language: string;
  /** File size in bytes */
  sizeBytes: number;
  /** Last modified timestamp */
  modifiedAt: string;
}

export interface BackupRecord {
  id: string;
  createdAt: string;
  absolutePath: string;
  relativePath: string;
  strategy: "git-commit" | "file-copy";
  /** Git commit hash (if strategy=git-commit) */
  commitHash?: string;
  /** Absolute path to the backup copy (if strategy=file-copy) */
  backupCopyPath?: string;
  /** Content snapshot for file-copy rollback */
  contentSnapshot?: string;
}

export interface SafeWriteResult {
  ok: boolean;
  backup: BackupRecord;
  bytesWritten: number;
}

export interface RollbackResult {
  ok: boolean;
  restoredFrom: "git-commit" | "file-copy";
  message: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Workspace root — all file access is sandboxed to this directory */
const WORKSPACE_ROOT = process.env.ASSISTANT_WORKSPACE
  ? path.resolve(process.env.ASSISTANT_WORKSPACE)
  : path.resolve(process.cwd());

/** Maximum file size allowed for reading (default 500 KB) */
const MAX_FILE_SIZE_BYTES = parseInt(process.env.MAX_FILE_SIZE_KB ?? "500", 10) * 1024;

/** Directory for file-copy backups */
const BACKUP_DIR = path.join(WORKSPACE_ROOT, ".ai_backups");

/** In-memory backup registry (latest backup per file path) */
const backupRegistry = new Map<string, BackupRecord>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Read a file and return its context (content + metadata).
 * Validates the path is within the workspace root.
 */
export async function readFileForAI(filePath: string): Promise<FileContext> {
  const absolutePath = resolveAndValidate(filePath);
  const stat = await fs.promises.stat(absolutePath);

  if (!stat.isFile()) {
    throw new Error(`Path is not a file: ${filePath}`);
  }
  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `File too large (${Math.round(stat.size / 1024)} KB). Max: ${MAX_FILE_SIZE_BYTES / 1024} KB. Set MAX_FILE_SIZE_KB env to override.`
    );
  }

  const content = await fs.promises.readFile(absolutePath, "utf-8");
  const relativePath = path.relative(WORKSPACE_ROOT, absolutePath);

  return {
    absolutePath,
    relativePath,
    content,
    language: detectLanguage(absolutePath),
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
  };
}

/**
 * Read multiple files from a directory (non-recursive by default).
 * Only reads text files, skips binary/hidden files.
 */
export async function readDirectoryForAI(
  dirPath: string,
  options: { recursive?: boolean; extensions?: string[] } = {}
): Promise<FileContext[]> {
  const absoluteDir = resolveAndValidate(dirPath);
  const stat = await fs.promises.stat(absoluteDir);

  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${dirPath}`);
  }

  const entries = await fs.promises.readdir(absoluteDir, { withFileTypes: true });
  const results: FileContext[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // skip hidden files
    const entryPath = path.join(absoluteDir, entry.name);

    if (entry.isDirectory() && options.recursive) {
      const sub = await readDirectoryForAI(entryPath, options);
      results.push(...sub);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (options.extensions && !options.extensions.includes(ext)) continue;
      if (BINARY_EXTENSIONS.has(ext)) continue;

      try {
        const ctx = await readFileForAI(entryPath);
        results.push(ctx);
      } catch {
        // Skip files that are too large or unreadable
      }
    }
  }

  return results;
}

/**
 * Core safe write: backup first, then write new content.
 *
 * @param filePath  Target file path (relative or absolute within workspace)
 * @param newContent New content to write
 * @param strategy  Backup strategy: "auto" uses file-copy; git-commit is explicit opt-in
 */
export async function backupAndWrite(
  filePath: string,
  newContent: string,
  strategy: BackupStrategyType = "auto"
): Promise<SafeWriteResult> {
  const absolutePath = resolveAndValidate(filePath);

  // Ensure the target file exists before writing (must be an edit, not creation)
  const exists = fs.existsSync(absolutePath);
  if (!exists) {
    throw new Error(
      `Target file does not exist: ${filePath}. Use createFile() for new files.`
    );
  }

  // ── Step 1: Create backup ──────────────────────────────────────────────
  const backup = await createBackup(absolutePath, strategy);
  backupRegistry.set(absolutePath, backup);

  // ── Step 2: Write new content ─────────────────────────────────────────
  await fs.promises.writeFile(absolutePath, newContent, "utf-8");
  const stat = await fs.promises.stat(absolutePath);

  return { ok: true, backup, bytesWritten: stat.size };
}

/**
 * Create a new file (no backup needed — git will track it as new).
 */
export async function createFile(
  filePath: string,
  content: string
): Promise<{ ok: boolean; absolutePath: string }> {
  const absolutePath = resolveAndValidate(filePath);

  if (fs.existsSync(absolutePath)) {
    throw new Error(
      `File already exists: ${filePath}. Use backupAndWrite() to edit existing files.`
    );
  }

  await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.promises.writeFile(absolutePath, content, "utf-8");

  return { ok: true, absolutePath };
}

/**
 * Rollback a file to its last backup.
 */
export async function rollbackFile(filePath: string): Promise<RollbackResult> {
  const absolutePath = resolveAndValidate(filePath);
  const backup = backupRegistry.get(absolutePath);

  if (!backup) {
    throw new Error(
      `No backup found for: ${filePath}. No AI edits have been applied to this file in the current session.`
    );
  }

  if (backup.strategy === "git-commit" && backup.commitHash) {
    return rollbackViaGit(absolutePath, backup);
  }

  if (backup.strategy === "file-copy" && backup.contentSnapshot !== undefined) {
    return rollbackViaFileCopy(absolutePath, backup);
  }

  throw new Error(`Backup record is incomplete. Cannot rollback: ${filePath}`);
}

/**
 * Write changes to multiple files transactionally (creates backups first).
 */
export async function backupAndWriteMultiple(
  files: { filePath: string; newContent: string }[],
  strategy: BackupStrategyType = "auto"
): Promise<SafeWriteResult[]> {
  const backupsCreated: { absolutePath: string; backup: BackupRecord }[] = [];

  try {
    // ── Step 1: Create backups for all files ──
    for (const f of files) {
      const absolutePath = resolveAndValidate(f.filePath);
      const exists = fs.existsSync(absolutePath);
      if (!exists) {
        throw new Error(
          `Target file does not exist: ${f.filePath}. Use createFile() for new files.`
        );
      }
      const backup = await createBackup(absolutePath, strategy);
      backupsCreated.push({ absolutePath, backup });
    }

    // ── Step 2: Register all backups in registry ──
    for (const item of backupsCreated) {
      backupRegistry.set(item.absolutePath, item.backup);
    }

    // ── Step 3: Write contents to all files ──
    const results: SafeWriteResult[] = [];
    for (const f of files) {
      const absolutePath = resolveAndValidate(f.filePath);
      await fs.promises.writeFile(absolutePath, f.newContent, "utf-8");
      const stat = await fs.promises.stat(absolutePath);

      const backupItem = backupsCreated.find((b) => b.absolutePath === absolutePath);
      if (backupItem) {
        results.push({
          ok: true,
          backup: backupItem.backup,
          bytesWritten: stat.size,
        });
      }
    }

    return results;
  } catch (error) {
    // ── Step 4: Transaction failed -> Rollback any modified/backed-up files immediately ──
    console.error("[SafeFileManager] Write transaction failed. Rolling back changes...", error);
    for (const item of backupsCreated) {
      try {
        if (item.backup.strategy === "git-commit" && item.backup.commitHash) {
          await rollbackViaGit(item.absolutePath, item.backup);
        } else if (item.backup.strategy === "file-copy" && item.backup.contentSnapshot !== undefined) {
          await rollbackViaFileCopy(item.absolutePath, item.backup);
        }
      } catch (rollbackErr) {
        console.error(`[SafeFileManager] Failed to rollback file ${item.absolutePath}:`, rollbackErr);
      }
    }
    throw error;
  }
}

/**
 * Rollback multiple files in a single operation.
 */
export async function rollbackMultiple(filePaths: string[]): Promise<RollbackResult[]> {
  const results: RollbackResult[] = [];
  for (const fp of filePaths) {
    const res = await rollbackFile(fp);
    results.push(res);
  }
  return results;
}

/**
 * List all backups for a given file.
 */
export async function listBackups(filePath: string): Promise<BackupRecord[]> {
  const absolutePath = resolveAndValidate(filePath);
  const registry = backupRegistry.get(absolutePath);
  if (registry) return [registry];

  // Also scan .ai_backups directory for file-copy backups
  const results: BackupRecord[] = await scanBackupDirectory(absolutePath);
  return results;
}

/**
 * Get the workspace root path (for display / diagnostics).
 */
export function getWorkspaceRoot(): string {
  return WORKSPACE_ROOT;
}

/**
 * Validate a path is within the workspace and return the absolute form.
 */
export function resolveAndValidate(filePath: string): string {
  const resolved = path.resolve(WORKSPACE_ROOT, filePath);

  // Security: ensure path stays inside workspace root
  const relative = path.relative(WORKSPACE_ROOT, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(
      `Access denied: "${filePath}" is outside the workspace root "${WORKSPACE_ROOT}". ` +
        `Set ASSISTANT_WORKSPACE env variable to configure the allowed directory.`
    );
  }

  return resolved;
}

// ---------------------------------------------------------------------------
// Internal — Backup creation
// ---------------------------------------------------------------------------

async function createBackup(
  absolutePath: string,
  strategy: BackupStrategyType
): Promise<BackupRecord> {
  const id = `backup-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const createdAt = new Date().toISOString();
  const relativePath = path.relative(WORKSPACE_ROOT, absolutePath);

  if (strategy === "git-commit") {
    try {
      const hash = await gitCommitBackup(absolutePath, relativePath);
      return { id, createdAt, absolutePath, relativePath, strategy: "git-commit", commitHash: hash };
    } catch (gitErr: any) {
      throw new Error(`Git backup failed: ${gitErr.message}. Use strategy "file-copy" or "auto".`);
    }
  }

  // File-copy backup
  const snapshot = await fs.promises.readFile(absolutePath, "utf-8");
  const backupCopyPath = await copyToBackupDir(absolutePath, relativePath);

  return {
    id,
    createdAt,
    absolutePath,
    relativePath,
    strategy: "file-copy",
    backupCopyPath,
    contentSnapshot: snapshot,
  };
}

async function gitCommitBackup(absolutePath: string, relativePath: string): Promise<string> {
  // Dynamically import simple-git so startup doesn't fail if it's not installed yet
  let simpleGit: any;
  try {
    const mod = await import("simple-git");
    simpleGit = mod.default ?? mod.simpleGit;
  } catch {
    throw new Error("simple-git not installed. Run: npm install simple-git");
  }

  const git = simpleGit(WORKSPACE_ROOT);

  // Check this is a git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) throw new Error(`${WORKSPACE_ROOT} is not a git repository.`);

  // Stage only the target file
  await git.add(relativePath);

  // Check if there's actually a diff staged (avoid empty commits)
  const diffStat = await git.diff(["--cached", "--stat"]);
  if (!diffStat || diffStat.trim() === "") {
    // File is unchanged — no need to commit
    const log = await git.log({ maxCount: 1 });
    return log.latest?.hash ?? "HEAD";
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const commitResult = await git.commit(
    `ai-backup: pre-AI-edit ${relativePath} @ ${timestamp}`,
    { "--no-verify": null }
  );

  return commitResult.commit || "committed";
}

async function copyToBackupDir(absolutePath: string, relativePath: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, timestamp, relativePath);

  await fs.promises.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.promises.copyFile(absolutePath, backupPath);

  return backupPath;
}

// ---------------------------------------------------------------------------
// Internal — Rollback
// ---------------------------------------------------------------------------

async function rollbackViaGit(absolutePath: string, backup: BackupRecord): Promise<RollbackResult> {
  let simpleGit: any;
  try {
    const mod = await import("simple-git");
    simpleGit = mod.default ?? mod.simpleGit;
  } catch {
    throw new Error("simple-git not installed.");
  }

  const git = simpleGit(WORKSPACE_ROOT);

  // Restore specific file from the backup commit
  await git.checkout([`${backup.commitHash}`, "--", backup.relativePath]);

  // Clean up registry
  backupRegistry.delete(absolutePath);

  return {
    ok: true,
    restoredFrom: "git-commit",
    message: `✅ Rolled back "${backup.relativePath}" to commit ${backup.commitHash?.slice(0, 7)}.`,
  };
}

async function rollbackViaFileCopy(
  absolutePath: string,
  backup: BackupRecord
): Promise<RollbackResult> {
  if (backup.contentSnapshot === undefined) {
    throw new Error("No content snapshot available for file-copy rollback.");
  }

  await fs.promises.writeFile(absolutePath, backup.contentSnapshot, "utf-8");

  // Clean up registry
  backupRegistry.delete(absolutePath);

  return {
    ok: true,
    restoredFrom: "file-copy",
    message: `✅ Rolled back "${backup.relativePath}" from backup copy at ${backup.createdAt}.`,
  };
}

async function scanBackupDirectory(absolutePath: string): Promise<BackupRecord[]> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const results: BackupRecord[] = [];
  const relative = path.relative(WORKSPACE_ROOT, absolutePath);

  try {
    const timestamps = await fs.promises.readdir(BACKUP_DIR);
    for (const ts of timestamps.reverse()) {
      const candidate = path.join(BACKUP_DIR, ts, relative);
      if (fs.existsSync(candidate)) {
        results.push({
          id: `scan-${ts}`,
          createdAt: ts,
          absolutePath,
          relativePath: relative,
          strategy: "file-copy",
          backupCopyPath: candidate,
        });
      }
    }
  } catch {
    // Best-effort scan
  }

  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE[ext] ?? "plaintext";
}

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".mjs": "javascript",
  ".cjs": "javascript",
  ".py": "python",
  ".go": "go",
  ".rs": "rust",
  ".java": "java",
  ".kt": "kotlin",
  ".swift": "swift",
  ".c": "c",
  ".cpp": "cpp",
  ".h": "c",
  ".cs": "csharp",
  ".rb": "ruby",
  ".php": "php",
  ".html": "html",
  ".css": "css",
  ".scss": "scss",
  ".less": "less",
  ".json": "json",
  ".jsonc": "jsonc",
  ".yaml": "yaml",
  ".yml": "yaml",
  ".toml": "toml",
  ".xml": "xml",
  ".md": "markdown",
  ".mdx": "mdx",
  ".sh": "shellscript",
  ".bash": "shellscript",
  ".zsh": "shellscript",
  ".ps1": "powershell",
  ".sql": "sql",
  ".vue": "vue",
  ".svelte": "svelte",
  ".graphql": "graphql",
  ".gql": "graphql",
  ".proto": "protobuf",
  ".dockerfile": "dockerfile",
  ".env": "dotenv",
};

const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp", ".svg",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".zip", ".tar", ".gz", ".rar", ".7z",
  ".exe", ".dll", ".so", ".dylib", ".bin",
  ".mp3", ".mp4", ".wav", ".avi", ".mov", ".mkv",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".ico", ".icns",
]);
