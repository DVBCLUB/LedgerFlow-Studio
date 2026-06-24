/**
 * aiPromptLibrary.ts
 * ============================================================
 * AI Prompt Library — curated, searchable, versioned
 * prompt templates với hiệu quả tracking
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  systemPrompt: string;
  userPromptTemplate: string;  // with {{variables}}
  variables: Array<{ name: string; description: string; required: boolean; defaultValue?: string }>;
  version: number;
  author: string;
  usageCount: number;
  successRate: number;
  avgLatencyMs: number;
  avgTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptRun {
  id: string;
  templateId: string;
  templateName: string;
  variables: Record<string, string>;
  output: string;
  success: boolean;
  latencyMs: number;
  tokens: number;
  rating: number;  // 1-5
  runAt: string;
}

// ─── Default Templates ──────────────────────────────────────────────
const DEFAULT_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'successRate' | 'avgLatencyMs' | 'avgTokens'>[] = [
  {
    name: 'code-generator', description: 'Generate TypeScript code from description',
    category: 'coding', tags: ['code', 'typescript', 'generation'],
    systemPrompt: 'You are an expert TypeScript developer. Write clean, type-safe code.',
    userPromptTemplate: 'Write {{language}} code for: {{description}}\n\nRequirements:\n{{requirements}}\n\nReturn only the code in a ``` block.',
    variables: [{ name: 'language', description: 'Programming language', required: true, defaultValue: 'TypeScript' }, { name: 'description', description: 'What to build', required: true }, { name: 'requirements', description: 'Specific requirements', required: false, defaultValue: '' }],
    version: 1, author: 'system',
  },
  {
    name: 'code-reviewer', description: 'Review code for issues',
    category: 'coding', tags: ['review', 'security', 'quality'],
    systemPrompt: 'You are a senior code reviewer. Check for bugs, security, performance.',
    userPromptTemplate: 'Review this code:\n\n```{{language}}\n{{code}}\n```\n\nFocus on: {{focus}}\n\nList findings with severity and fix suggestions.',
    variables: [{ name: 'language', description: 'Language', required: true, defaultValue: 'typescript' }, { name: 'code', description: 'Code to review', required: true }, { name: 'focus', description: 'Focus areas', required: false, defaultValue: 'security, performance, readability' }],
    version: 1, author: 'system',
  },
  {
    name: 'explain-code', description: 'Explain what code does',
    category: 'education', tags: ['explain', 'tutorial', 'learning'],
    systemPrompt: 'You are a patient coding teacher. Explain code simply and clearly.',
    userPromptTemplate: 'Explain this code like I am a {{audience}}:\n\n```{{language}}\n{{code}}\n```\n\n{{context}}',
    variables: [{ name: 'audience', description: 'Target audience', required: false, defaultValue: 'beginner' }, { name: 'language', description: 'Language', required: true, defaultValue: 'typescript' }, { name: 'code', description: 'Code to explain', required: true }, { name: 'context', description: 'Additional context', required: false, defaultValue: '' }],
    version: 1, author: 'system',
  },
  {
    name: 'write-tests', description: 'Generate unit tests',
    category: 'testing', tags: ['test', 'unit-test', 'coverage'],
    systemPrompt: 'You are a QA engineer. Write thorough, edge-case-covering tests.',
    userPromptTemplate: 'Write {{framework}} tests for:\n\n```{{language}}\n{{code}}\n```\n\nCover:\n- Happy path\n- Edge cases\n- Error handling\n- {{extraCases}}',
    variables: [{ name: 'framework', description: 'Test framework', required: true, defaultValue: 'vitest' }, { name: 'language', description: 'Language', required: true, defaultValue: 'typescript' }, { name: 'code', description: 'Code to test', required: true }, { name: 'extraCases', description: 'Additional test cases', required: false, defaultValue: '' }],
    version: 1, author: 'system',
  },
  {
    name: 'refactor-code', description: 'Refactor and improve code',
    category: 'coding', tags: ['refactor', 'improvement', 'optimization'],
    systemPrompt: 'You are a code optimization expert. Improve code structure and performance.',
    userPromptTemplate: 'Refactor this {{language}} code:\n\n```\n{{code}}\n```\n\nGoals:\n- {{goals}}\n\nReturn the refactored code with explanation of changes.',
    variables: [{ name: 'language', description: 'Language', required: true, defaultValue: 'typescript' }, { name: 'code', description: 'Code to refactor', required: true }, { name: 'goals', description: 'Refactoring goals', required: false, defaultValue: 'improve readability, reduce complexity, optimize performance' }],
    version: 1, author: 'system',
  },
  {
    name: 'write-readme', description: 'Generate project README',
    category: 'documentation', tags: ['readme', 'documentation', 'project'],
    systemPrompt: 'You are a technical writer. Write clear, comprehensive documentation.',
    userPromptTemplate: 'Write a README.md for:\n\nProject: {{projectName}}\nDescription: {{description}}\nTech stack: {{techStack}}\n\nInclude: Overview, Features, Setup, Usage, API, Contributing.',
    variables: [{ name: 'projectName', description: 'Project name', required: true }, { name: 'description', description: 'Project description', required: true }, { name: 'techStack', description: 'Technology stack', required: false, defaultValue: 'TypeScript, Node.js, Express' }],
    version: 1, author: 'system',
  },
];

// ─── Storage ────────────────────────────────────────────────────────
const TEMPLATES_FILE = path.join(process.cwd(), 'prompt_templates.json');
const RUNS_FILE = path.join(process.cwd(), 'prompt_runs.json');

let templates: PromptTemplate[] = [];
let runs: PromptRun[] = [];

async function init(): Promise<void> {
  try {
    if (fs.existsSync(TEMPLATES_FILE)) templates = JSON.parse(await fs.promises.readFile(TEMPLATES_FILE, 'utf8'));
    if (fs.existsSync(RUNS_FILE)) runs = JSON.parse(await fs.promises.readFile(RUNS_FILE, 'utf8'));
    if (templates.length === 0) {
      const now = new Date().toISOString();
      templates = DEFAULT_TEMPLATES.map(t => ({ ...t, id: `pt_${Date.now()}_${randomUUID().slice(0, 4)}`, createdAt: now, updatedAt: now, usageCount: 0, successRate: 100, avgLatencyMs: 0, avgTokens: 0 }));
      await saveTemplates();
    }
  } catch { }
}
init().catch(() => undefined);

async function saveTemplates(): Promise<void> { await fs.promises.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8'); }
async function saveRuns(): Promise<void> { await fs.promises.writeFile(RUNS_FILE, JSON.stringify(runs.slice(-200), null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export function getTemplates(filter?: { category?: string; tags?: string[] }): PromptTemplate[] {
  let result = [...templates];
  if (filter?.category) result = result.filter(t => t.category === filter.category);
  if (filter?.tags?.length) result = result.filter(t => filter.tags!.some(tag => t.tags.includes(tag)));
  result.sort((a, b) => b.usageCount - a.usageCount || b.successRate - a.successRate);
  return result;
}

export function getTemplate(id: string): PromptTemplate | undefined { return templates.find(t => t.id === id); }

export function searchTemplates(query: string): PromptTemplate[] {
  const q = query.toLowerCase();
  return templates.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.includes(q)) ||
    t.category.includes(q)
  );
}

export function createTemplate(input: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'successRate' | 'avgLatencyMs' | 'avgTokens'>): PromptTemplate {
  const now = new Date().toISOString();
  const tpl: PromptTemplate = { ...input, id: `pt_${Date.now()}_${randomUUID().slice(0, 4)}`, createdAt: now, updatedAt: now, usageCount: 0, successRate: 100, avgLatencyMs: 0, avgTokens: 0 };
  templates.push(tpl);
  saveTemplates().catch(() => undefined);
  return tpl;
}

export function deleteTemplate(id: string): boolean {
  const idx = templates.findIndex(t => t.id === id);
  if (idx < 0) return false;
  templates.splice(idx, 1);
  saveTemplates().catch(() => undefined);
  return true;
}

export function renderPrompt(templateId: string, variables: Record<string, string>): string | undefined {
  const tpl = templates.find(t => t.id === templateId);
  if (!tpl) return undefined;
  let rendered = tpl.userPromptTemplate;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return rendered;
}

export async function executePrompt(
  templateId: string,
  variables: Record<string, string>,
  options?: { rating?: number },
): Promise<PromptRun | undefined> {
  const tpl = templates.find(t => t.id === templateId);
  if (!tpl) return undefined;

  const rendered = renderPrompt(templateId, variables);
  if (!rendered) return undefined;

  const start = Date.now();
  let output = '';
  let success = false;

  try {
    const result = await dispatchTextThroughFabric(rendered, tpl.systemPrompt, { domain: 'general', localFallback: true });
    output = result.winner?.contentPreview || '';
    success = result.status === 'completed';
  } catch { output = 'Prompt execution failed.'; }

  const latencyMs = Date.now() - start;

  const run: PromptRun = {
    id: `pr_${Date.now()}_${randomUUID().slice(0, 6)}`,
    templateId, templateName: tpl.name,
    variables, output, success, latencyMs,
    tokens: Math.ceil((rendered.length + output.length) / 4),
    rating: options?.rating || 0,
    runAt: new Date().toISOString(),
  };

  runs.push(run);

  // Update template metrics
  tpl.usageCount++;
  tpl.successRate = +((tpl.successRate * (tpl.usageCount - 1) + (success ? 100 : 0)) / tpl.usageCount).toFixed(1);
  tpl.avgLatencyMs = Math.round((tpl.avgLatencyMs * (tpl.usageCount - 1) + latencyMs) / tpl.usageCount);
  tpl.avgTokens = Math.round((tpl.avgTokens * (tpl.usageCount - 1) + run.tokens) / tpl.usageCount);
  tpl.updatedAt = new Date().toISOString();

  if (tpl.usageCount % 5 === 0) saveTemplates().catch(() => undefined);
  if (runs.length % 20 === 0) saveRuns().catch(() => undefined);

  return run;
}

export function getRun(id: string): PromptRun | undefined { return runs.find(r => r.id === id); }
export function listRuns(templateId?: string, limit = 50): PromptRun[] {
  let result = [...runs];
  if (templateId) result = result.filter(r => r.templateId === templateId);
  return result.slice(-limit).reverse();
}

export function getLibraryStats(): {
  totalTemplates: number; totalRuns: number;
  avgSuccessRate: number; totalTokens: number;
  topTemplate: { name: string; usage: number } | null;
} {
  const sorted = [...templates].sort((a, b) => b.usageCount - a.usageCount);
  return {
    totalTemplates: templates.length,
    totalRuns: runs.length,
    avgSuccessRate: templates.length > 0 ? +(templates.reduce((s, t) => s + t.successRate, 0) / templates.length).toFixed(1) : 0,
    totalTokens: runs.reduce((s, r) => s + r.tokens, 0),
    topTemplate: sorted.length > 0 ? { name: sorted[0].name, usage: sorted[0].usageCount } : null,
  };
}

export function getCategories(): string[] {
  return [...new Set(templates.map(t => t.category))];
}
