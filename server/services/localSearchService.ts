/**
 * localSearchService.ts
 * ============================================================
 * Pure JavaScript local code indexer and search engine.
 * Computes TF-IDF scores for file contents to enable semantic-like keyword search
 * without native C++ compilation requirements on Windows.
 * ============================================================
 */

import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "./safeFileManager";

export interface SearchMatch {
  relativePath: string;
  score: number;
  snippet: string;
}

interface DocIndex {
  relativePath: string;
  terms: Map<string, number>; // term -> count
  totalTerms: number;
  filenameTokens: Set<string>;
  pathTokens: Set<string>;
}

// In-memory index cache
let docIndexes: DocIndex[] = [];
let idfCache = new Map<string, number>();
let totalDocs = 0;
let isIndexing = false;

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".ai_backups",
  ".ai_context",
  "dist",
  "build",
  "coverage",
  ".cache",
]);

const ALLOWED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".go", ".rs", ".java", ".kt", ".swift",
  ".cpp", ".c", ".h", ".cs", ".rb", ".php",
  ".html", ".css", ".scss", ".json", ".yaml", ".yml",
  ".toml", ".xml", ".md", ".sh", ".sql", ".vue", ".svelte"
]);

/**
 * Tokenize content: lowercase, split into words/tokens.
 */
function tokenize(text: string): string[] {
  // Lowercase and extract alphanumeric tokens, including common code characters like _ and -
  return text
    .toLowerCase()
    .split(/[^a-z0-9_-]+/)
    .filter((token) => token.length > 1);
}

/**
 * Recursively find all source files in the workspace.
 */
async function scanFiles(dir: string, fileList: string[] = []): Promise<string[]> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const name = entry.name;
    if (name.startsWith(".") && name !== ".env") continue;
    if (EXCLUDE_DIRS.has(name)) continue;

    const fullPath = path.join(dir, name);

    if (entry.isDirectory()) {
      await scanFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(name).toLowerCase();
      if (ALLOWED_EXTENSIONS.has(ext)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

/**
 * Re-index the entire workspace.
 */
export async function buildSearchIndex(): Promise<{ durationMs: number; totalFiles: number }> {
  if (isIndexing) throw new Error("Index operation is already running.");
  isIndexing = true;
  const start = Date.now();

  const workspaceRoot = getWorkspaceRoot();
  docIndexes = [];
  idfCache.clear();

  try {
    const allFilePaths = await scanFiles(workspaceRoot);
    totalDocs = allFilePaths.length;

    // Build Term Frequency (TF) for each doc
    const termDocCount = new Map<string, number>();

    for (const filePath of allFilePaths) {
      try {
        const relativePath = path.relative(workspaceRoot, filePath);
        const stat = await fs.promises.stat(filePath);

        // Skip files larger than 300KB to keep indexing fast
        if (stat.size > 300 * 1024) continue;

        const content = await fs.promises.readFile(filePath, "utf-8");
        const tokens = tokenize(content);

        const terms = new Map<string, number>();
        for (const token of tokens) {
          terms.set(token, (terms.get(token) ?? 0) + 1);
        }

        const filename = path.basename(relativePath);
        const filenameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const filenameTokens = new Set(tokenize(filenameWithoutExt));
        const pathTokens = new Set(tokenize(relativePath));

        docIndexes.push({
          relativePath,
          terms,
          totalTerms: tokens.length,
          filenameTokens,
          pathTokens,
        });

        // Track unique terms per doc for IDF calculation
        for (const term of terms.keys()) {
          termDocCount.set(term, (termDocCount.get(term) ?? 0) + 1);
        }
      } catch {
        // Skip unreadable files
      }
    }

    // Compute IDF: log(totalDocs / termDocCount)
    for (const [term, docCount] of termDocCount.entries()) {
      const idf = Math.log(totalDocs / docCount);
      idfCache.set(term, idf);
    }

    const durationMs = Date.now() - start;
    return { durationMs, totalFiles: docIndexes.length };
  } finally {
    isIndexing = false;
  }
}

/**
 * Search the indexed codebase using a query string.
 */
export async function searchCodebase(query: string, limit = 10): Promise<SearchMatch[]> {
  // Lazy-index if empty
  if (docIndexes.length === 0) {
    await buildSearchIndex();
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Calculate TF-IDF query vector
  const queryTf = new Map<string, number>();
  for (const token of queryTokens) {
    queryTf.set(token, (queryTf.get(token) ?? 0) + 1);
  }

  const queryVector = new Map<string, number>();
  for (const [token, count] of queryTf.entries()) {
    const idf = idfCache.get(token) ?? Math.log(totalDocs || 1);
    queryVector.set(token, (count / queryTokens.length) * idf);
  }

  const matches: SearchMatch[] = [];
  const workspaceRoot = getWorkspaceRoot();

  // Score each indexed document using Cosine Similarity / Dot Product
  for (const doc of docIndexes) {
    let score = 0;
    let matchCount = 0;

    for (const [token, queryWeight] of queryVector.entries()) {
      const docTermCount = doc.terms.get(token) ?? 0;
      const isFilenameMatch = doc.filenameTokens.has(token);
      const isPathMatch = doc.pathTokens.has(token);

      if (docTermCount > 0 || isFilenameMatch || isPathMatch) {
        const docTf = docTermCount / (doc.totalTerms || 1);
        const idf = idfCache.get(token) ?? Math.log(totalDocs || 1);
        let docWeight = docTf * idf;

        // Apply weight boost: +5.0 * idf for filename match, +2.0 * idf for path match
        if (isFilenameMatch) {
          docWeight += 5.0 * idf;
        } else if (isPathMatch) {
          docWeight += 2.0 * idf;
        }

        score += queryWeight * docWeight;
        matchCount++;
      }
    }

    // Boost files where multiple query terms match
    if (matchCount > 1) {
      score *= (1 + 0.25 * (matchCount - 1));
    }

    if (score > 0) {
      matches.push({
        relativePath: doc.relativePath,
        score,
        snippet: "", // lazy loaded below
      });
    }
  }

  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);
  const topMatches = matches.slice(0, limit);

  // Generate snippet contexts for top matches
  for (const match of topMatches) {
    try {
      const fullPath = path.join(workspaceRoot, match.relativePath);
      const content = await fs.promises.readFile(fullPath, "utf-8");
      match.snippet = generateContextSnippet(content, queryTokens);
    } catch {
      // Ignored
    }
  }

  return topMatches;
}

/**
 * Generate a visual code snippet around matching terms.
 */
function generateContextSnippet(content: string, queryTokens: string[]): string {
  const lines = content.split("\n");
  let bestLineIdx = 0;
  let maxMatchCount = 0;

  // Find the line with the most query term hits
  for (let i = 0; i < lines.length; i++) {
    const lineLower = lines[i].toLowerCase();
    let hits = 0;
    for (const token of queryTokens) {
      if (lineLower.includes(token)) hits++;
    }
    if (hits > maxMatchCount) {
      maxMatchCount = hits;
      bestLineIdx = i;
    }
  }

  // Extract a 5-line window around the best line
  const start = Math.max(0, bestLineIdx - 2);
  const end = Math.min(lines.length - 1, bestLineIdx + 2);
  const snippetLines = lines.slice(start, end + 1).map((line, idx) => {
    const currentLineNum = start + idx + 1;
    const isTarget = currentLineNum === bestLineIdx + 1;
    const prefix = isTarget ? " > " : "   ";
    return `${prefix}${String(currentLineNum).padStart(4)}: ${line}`;
  });

  return snippetLines.join("\n");
}
