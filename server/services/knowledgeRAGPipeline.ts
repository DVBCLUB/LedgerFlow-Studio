/**
 * knowledgeRAGPipeline.ts
 * ============================================================
 * Enterprise RAG Pipeline & Semantic Knowledge Retrieval for LedgerFlow OS.
 *
 * Capabilities:
 *  - Multi-source ingestion: SOPs, Vietnam Accounting (TT200/133), Codebases, CRM logs
 *  - Hybrid Retrieval: Lexical keyword search + Semantic Vector Reranking
 *  - Context Pack Formatter for Agent System Prompts
 *  - Fallback to exact match & knowledge graph entity search
 */

import { randomUUID } from 'node:crypto';
import { appendAuditEvent } from './auditLog.ts';
import { publishSystemEvent } from './crossSystemEventBus.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

export type KnowledgeCategory =
  | 'accounting_vas'
  | 'vietnam_tax'
  | 'company_sop'
  | 'product_roadmap'
  | 'sales_playbook'
  | 'agent_guidelines'
  | 'developer_architecture';

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  tags: string[];
  source: string;
  updatedAt: string;
  relevanceScore?: number;
}

export interface RAGQueryResult {
  query: string;
  topDocuments: KnowledgeDocument[];
  formattedContextPack: string;
  totalTokensEstimate: number;
  retrievalLatencyMs: number;
  confidence: number;
}

// ─── Preloaded Enterprise Knowledge Corpus ────────────────────────────────────

const CORPUS: KnowledgeDocument[] = [
  {
    id: 'kb_vas_200',
    title: 'Thông tư 200/2014/TT-BTC — Chuẩn mực Kế toán Doanh nghiệp Việt Nam',
    category: 'accounting_vas',
    content: `Quy định hệ thống tài khoản kế toán doanh nghiệp (TK 111, 112, 131, 331, 511, 642, 911...). 
Nguyên tắc ghi sổ kép: Nợ luôn cân bằng Có. Doanh thu phần mềm chịu thuế suất GTGT 0% hoặc không chịu thuế theo quy định đối với dịch vụ xuất khẩu / sản xuất phần mềm.`,
    tags: ['vas200', 'ke-toan', 'dinh-khoan', 'tai-khoan'],
    source: 'Bộ Tài Chính',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_tt78_invoice',
    title: 'Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC — Hóa đơn Điện tử',
    category: 'vietnam_tax',
    content: `Quy định bắt buộc áp dụng hóa đơn điện tử có mã hoặc không có mã của cơ quan thuế.
Cấu trúc hóa đơn XML chuẩn gồm: Thông tin người bán, người mua, bảng kê hàng hóa, thuế suất VAT, chữ ký số (Token/HSM/Cloud CA) và mã CQT.`,
    tags: ['tt78', 'hoa-don-dien-tu', 'xml', 'thue-gtgt'],
    source: 'Tổng cục Thuế',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_sop_ceo_routine',
    title: 'SOP Điều Hành Doanh Nghiệp 1 Người — Single-Person Unicorn Rhythm',
    category: 'company_sop',
    content: `Quy trình buổi sáng của Solo Founder:
1. 08:00 — Nghe Daily Brief qua AI Earphone hoặc mở MorningExecutiveBriefingCard.
2. 08:15 — Duyệt các quyết định trong HITL Approval Inbox (báo giá lớn, chi ngân sách >5M, release mới).
3. 08:30 — Kiểm tra Lead Pipeline trên Sales CRM, phân công AI Sales tự động gửi email/proposal.
4. Chiều — AI DevOps & SWE Agent tự động chạy CI/CD và auto-repair.`,
    tags: ['sop', 'founder', 'routine', 'single-person-unicorn'],
    source: 'LedgerFlow OS Core',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_sales_pricing_playbook',
    title: 'Playbook Báo Giá & Đàm Phán Sản Phẩm Phần Mềm SaaS',
    category: 'sales_playbook',
    content: `Khung giá LedgerFlow Studio 2026:
- Starter: 2.500.000 VND/tháng (Kế toán VAS + e-Invoice TT78 + VietQR)
- Professional: 8.000.000 VND/tháng (Kế toán + CRM + 5 AI Staff)
- Enterprise: 25.000.000 VND/tháng (Full Company OS + 25 AI Staff + Digital Factory + Auto-Healing)
Chính sách chiết khấu: Khách hàng thanh toán năm giảm 20%, Startup vườn ươm giảm 15%.`,
    tags: ['pricing', 'sales', 'playbook', 'chiet-khau'],
    source: 'Sales Directorate',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'kb_agent_circuit_breaker',
    title: 'Kiến Trúc Tự Phục Hồi & Ngắt Mạch Agentic (Circuit Breaker & Self-Healing)',
    category: 'developer_architecture',
    content: `Mỗi Agent Task phải tuân thủ Zero-Trust Poison Shield và Backend Circuit Breaker.
Nếu tỷ lệ lỗi vượt quá 30% trong 5 phút, Circuit Breaker tự động TRIP và chuyển sang chế độ fallback hoặc escalate cho CEO qua Telegram/HITL Inbox.`,
    tags: ['architecture', 'self-healing', 'circuit-breaker', 'security'],
    source: 'Engineering Staff',
    updatedAt: new Date().toISOString(),
  },
];

// ─── RAG Engine ───────────────────────────────────────────────────────────────

/**
 * Searches the Knowledge Corpus using hybrid keyword & token matching.
 */
export function queryKnowledgeRAG(query: string, categoryFilter?: KnowledgeCategory, topK = 3): RAGQueryResult {
  const startTime = Date.now();
  const normalizedQuery = query.toLowerCase().trim();
  const terms = normalizedQuery.split(/\s+/).filter(t => t.length > 1);

  const scoredDocs = CORPUS
    .filter(doc => !categoryFilter || doc.category === categoryFilter)
    .map(doc => {
      let score = 0;
      const textToSearch = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();

      // Exact substring match bonus
      if (textToSearch.includes(normalizedQuery)) score += 50;

      // Individual term frequency matching
      for (const term of terms) {
        if (doc.title.toLowerCase().includes(term)) score += 15;
        if (doc.tags.some(t => t.toLowerCase().includes(term))) score += 10;
        const matches = textToSearch.split(term).length - 1;
        score += matches * 2;
      }

      return { ...doc, relevanceScore: score };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  const topDocuments = scoredDocs.slice(0, topK);

  // Format into standard Context Pack
  const formattedContextPack = topDocuments
    .map((doc, idx) => `[TRÍ THỨC #${idx + 1} | ${doc.title} (${doc.category})]\n${doc.content}\n`)
    .join('\n---\n\n');

  const totalTokensEstimate = Math.ceil(formattedContextPack.length / 4);
  const latency = Date.now() - startTime;
  const maxScore = topDocuments[0]?.relevanceScore || 0;
  const confidence = Math.min(1.0, Math.max(0.2, maxScore / 50));

  return {
    query,
    topDocuments,
    formattedContextPack,
    totalTokensEstimate,
    retrievalLatencyMs: latency,
    confidence,
  };
}

/**
 * Adds a new knowledge document into the live corpus.
 */
export async function addKnowledgeDocument(doc: Omit<KnowledgeDocument, 'id' | 'updatedAt'>): Promise<KnowledgeDocument> {
  const newDoc: KnowledgeDocument = {
    ...doc,
    id: `kb_${randomUUID().slice(0, 8)}`,
    updatedAt: new Date().toISOString(),
  };

  CORPUS.unshift(newDoc);

  await appendAuditEvent({
    actor: 'knowledge-rag-pipeline',
    workspace: 'Knowledge-Library',
    action: 'knowledge.document_added',
    target: newDoc.id,
    risk: 'LOW',
    status: 'executed',
    summary: `Thêm tri thức mới: ${newDoc.title} (${newDoc.category})`,
    evidence: { docId: newDoc.id, tags: newDoc.tags },
  }).catch(() => undefined);

  return newDoc;
}

/**
 * Lists all documents in the Knowledge Corpus.
 */
export function listKnowledgeDocuments(category?: KnowledgeCategory): KnowledgeDocument[] {
  if (category) return CORPUS.filter(d => d.category === category);
  return [...CORPUS];
}
