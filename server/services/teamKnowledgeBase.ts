/**
 * teamKnowledgeBase.ts
 * Team Knowledge Base — shared AI-curated knowledge wiki
 * với versioning, search, và auto-linking.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { searchSimilar, insertDocument, createNamespace } from './vectorEmbeddingStore';
import { appendAuditEvent } from './auditLog';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export interface KBArticle {
  id: string; title: string; content: string; category: string;
  tags: string[]; author: string; version: number;
  relatedArticles: string[]; views: number; helpfulCount: number;
  createdAt: string; updatedAt: string;
}

export interface KBCategory { name: string; description: string; articleCount: number; }

// ─── Storage ────────────────────────────────────────────────────────
const KB_DIR = path.join(process.cwd(), 'knowledge_base');
const INDEX_FILE = path.join(KB_DIR, '_index.json');

let articles: KBArticle[] = [];

async function init(): Promise<void> {
  try {
    if (!fs.existsSync(KB_DIR)) await fs.promises.mkdir(KB_DIR, { recursive: true });
    if (fs.existsSync(INDEX_FILE)) articles = JSON.parse(await fs.promises.readFile(INDEX_FILE, 'utf8'));
    // Seed vector namespace
    createNamespace('knowledge_base');
  } catch { }
}
init().catch(() => undefined);

async function saveIndex(): Promise<void> { await fs.promises.writeFile(INDEX_FILE, JSON.stringify(articles, null, 2), 'utf8'); }

// ─── Core API ───────────────────────────────────────────────────────

export async function createArticle(input: {
  title: string; content: string; category?: string; tags?: string[]; author?: string;
  autoRelated?: boolean;
}): Promise<KBArticle> {
  const now = new Date().toISOString();

  // Find related articles via vector search
  let relatedArticles: string[] = [];
  if (input.autoRelated !== false) {
    const similar = searchSimilar('knowledge_base', input.title + ' ' + input.content.slice(0, 500), 5);
    relatedArticles = similar.map(r => r.document.id);
  }

  // AI-generated summary if content is long
  let enhancedContent = input.content;
  if (input.content.length > 2000) {
    try {
      const result = await dispatchTextThroughFabric(
        `Write a comprehensive knowledge base article about: ${input.title}\n\nContent to refine:\n${input.content.slice(0, 3000)}\n\nExpand and structure with ## sections. Keep all technical details.`,
        undefined, { domain: 'general', localFallback: true }
      );
      if (result.winner?.contentPreview) enhancedContent = result.winner.contentPreview;
    } catch { }
  }

  const article: KBArticle = {
    id: `kb_${Date.now()}_${randomUUID().slice(0, 6)}`,
    title: input.title.slice(0, 200), content: enhancedContent,
    category: input.category || 'General', tags: input.tags || [],
    author: input.author || 'system', version: 1,
    relatedArticles, views: 0, helpfulCount: 0,
    createdAt: now, updatedAt: now,
  };

  articles.push(article);

  // Index in vector store
  insertDocument('knowledge_base', `${article.title}\n${article.content.slice(0, 1000)}`, { articleId: article.id, category: article.category });

  // Save to file
  const fileName = `${article.id}.md`;
  await fs.promises.writeFile(path.join(KB_DIR, fileName), `# ${article.title}\n\n${article.content}\n\n---\nTags: ${article.tags.join(', ')} | Category: ${article.category} | Created: ${now}`, 'utf8');

  saveIndex().catch(() => undefined);

  await appendAuditEvent({ actor: input.author || 'system', workspace: 'Knowledge Base', action: 'kb.create', target: article.title, risk: 'LOW', status: 'executed', summary: `Created KB: ${article.title}`, connectorId: 'knowledge-base', evidence: { articleId: article.id, category: article.category } }).catch(() => undefined);

  return article;
}

export function getArticle(id: string): KBArticle | undefined { return articles.find(a => a.id === id); }

export function searchArticles(query: string): KBArticle[] {
  const semanticResults = searchSimilar('knowledge_base', query, 10);
  const semanticIds = new Set(semanticResults.map(r => r.document.id));

  // Keyword search as fallback
  const q = query.toLowerCase();
  const keywordResults = articles.filter(a =>
    semanticIds.has(a.id) ||
    a.title.toLowerCase().includes(q) ||
    a.tags.some(t => t.includes(q)) ||
    a.category.toLowerCase().includes(q)
  );
  keywordResults.sort((a, b) => (b.views + b.helpfulCount * 2) - (a.views + a.helpfulCount * 2));
  return keywordResults.slice(0, 20);
}

export function listArticles(filter?: { category?: string; tag?: string; limit?: number }): KBArticle[] {
  let result = [...articles];
  if (filter?.category) result = result.filter(a => a.category === filter.category);
  if (filter?.tag) result = result.filter(a => a.tags.includes(filter.tag!));
  result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return result.slice(0, filter?.limit || 50);
}

export function updateArticle(id: string, patch: Partial<Pick<KBArticle, 'title' | 'content' | 'category' | 'tags'>>): KBArticle | undefined {
  const article = articles.find(a => a.id === id);
  if (!article) return undefined;
  Object.assign(article, patch, { updatedAt: new Date().toISOString(), version: article.version + 1 });
  saveIndex().catch(() => undefined);
  return article;
}

export function recordView(id: string): void {
  const article = articles.find(a => a.id === id);
  if (article) article.views++;
}

export function recordHelpful(id: string): void {
  const article = articles.find(a => a.id === id);
  if (article) article.helpfulCount++;
}

export function getCategories(): KBCategory[] {
  const map = new Map<string, number>();
  for (const a of articles) map.set(a.category, (map.get(a.category) || 0) + 1);
  return Array.from(map.entries()).map(([name, count]) => ({ name, description: '', articleCount: count }));
}

export function deleteArticle(id: string): boolean {
  const idx = articles.findIndex(a => a.id === id);
  if (idx < 0) return false;
  articles.splice(idx, 1);
  const file = path.join(KB_DIR, `${id}.md`);
  try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch { }
  saveIndex().catch(() => undefined);
  return true;
}

export function getKBStats(): { total: number; totalViews: number; avgHelpful: number; topCategory: string } {
  const cats = getCategories();
  return {
    total: articles.length,
    totalViews: articles.reduce((s, a) => s + a.views, 0),
    avgHelpful: articles.length > 0 ? Math.round(articles.reduce((s, a) => s + a.helpfulCount, 0) / articles.length) : 0,
    topCategory: cats.sort((a, b) => b.articleCount - a.articleCount)[0]?.name || 'None',
  };
}
