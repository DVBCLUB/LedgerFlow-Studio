import React, { useEffect, useMemo, useState } from 'react';
import type { WorkCard } from '../../types/agentOps';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion, writeLocalStorageValue } from '../ai-nhan-su/storage';
import RAGSimulatorPanel from './RAGSimulatorPanel';
import InterAgentProtocolPanel from './InterAgentProtocolPanel';
import SwarmRelayOrchestratorPanel from './SwarmRelayOrchestratorPanel';
import { OperatingKnowledgeLayerPanel } from '../../components/operating-knowledge/OperatingKnowledgePanels';
import { Database, Zap, BookOpen, CheckCircle2, ShieldAlert, Sparkles, Plus, Upload, Trash2, Check, RefreshCw, Network, Search, Filter, Copy, Users, Bot, Layers } from 'lucide-react';
import { ExcelNumberInput } from '../../components/ui/ExcelNumberInput';
import { formatNumberVN } from '../../utils/excelFormatters';
import { useLanguage } from '../../context/LanguageContext';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';
const WORKBOARD_KEY = 'ledgerflow_aiops_cards_v1';

export type KnowledgeSource = 'Founder Note' | 'Process SOP' | 'Code Decision' | 'Accounting Rule' | 'Risk Note' | 'Customer Feedback' | 'Document Import';
export type KnowledgeTrust = 'Draft' | 'Approved' | 'Needs Review';

export type KnowledgeNote = {
  id: string;
  title: string;
  source: KnowledgeSource;
  trust: KnowledgeTrust;
  tags: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

const sourceOptions: KnowledgeSource[] = ['Founder Note', 'Process SOP', 'Code Decision', 'Accounting Rule', 'Risk Note', 'Customer Feedback', 'Document Import'];
const trustOptions: KnowledgeTrust[] = ['Approved', 'Needs Review', 'Draft'];

function emptyDraft(): Pick<KnowledgeNote, 'title' | 'source' | 'trust' | 'tags' | 'body'> {
  return {
    title: '',
    source: 'Founder Note',
    trust: 'Draft',
    tags: '',
    body: ''
  };
}

function trustTone(trust: KnowledgeTrust) {
  if (trust === 'Approved') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
  if (trust === 'Needs Review') return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
  return 'border-slate-700 bg-slate-800/60 text-slate-400';
}

function trustLabel(trust: KnowledgeTrust) {
  if (trust === 'Approved') return '✓ Đã duyệt';
  if (trust === 'Needs Review') return '⏳ Chờ duyệt';
  return '📝 Bản nháp';
}

function sourceLabel(source: KnowledgeSource) {
  switch (source) {
    case 'Founder Note': return '👑 Ghi chú Founder';
    case 'Process SOP': return '📋 SOP Quy trình';
    case 'Code Decision': return '⚙️ Quyết định Kỹ thuật';
    case 'Accounting Rule': return '📊 Quy tắc Kế toán VAS';
    case 'Risk Note': return '🛡️ Cảnh báo Rủi ro';
    case 'Customer Feedback': return '💬 Phản hồi Khách hàng';
    case 'Document Import': return '📄 Tài liệu Tải lên';
    default: return source;
  }
}

function buildRagContext(notes: KnowledgeNote[]) {
  return notes
    .slice(0, 15)
    .map((note, index) => [
      `#${index + 1} ${note.title}`,
      `Nguồn: ${sourceLabel(note.source)}`,
      `Trạng thái: ${trustLabel(note.trust)}`,
      `Thẻ: ${note.tags || 'không có'}`,
      note.body
    ].join('\n'))
    .join('\n\n---\n\n');
}

function makeWorkCard(note: KnowledgeNote): WorkCard {
  const needsFounderReview = note.source === 'Risk Note' || note.trust !== 'Approved';
  return {
    id: `kb-card-${Date.now()}`,
    title: `Soát xét tri thức: ${note.title}`,
    kind: 'Audit',
    owner: 'AI Chief of Staff',
    status: needsFounderReview ? 'Waiting Approval' : 'Inbox',
    risk: needsFounderReview ? 'MEDIUM' : 'LOW',
    request: `Soát xét ghi chú tri thức trước khi cấp quyền RAG cho AI. Nguồn: ${sourceLabel(note.source)}. Trạng thái: ${trustLabel(note.trust)}.`,
    plan: ['Đọc nội dung tri thức', 'Kiểm tra nguồn và độ tin cậy', 'Quyết định duyệt cho AI Gateway sử dụng', 'Cập nhật trạng thái Kho Tri thức'],
    tools: ['Kho Tri thức', 'Company Memory', 'Phê duyệt Founder'],
    approval: needsFounderReview ? 'Yêu cầu Founder phê duyệt trước khi AI sử dụng làm RAG context.' : 'Tri thức đã duyệt an toàn cho AI tra cứu.'
  };
}

function splitDocumentIntoChunks(text: string, chunkSize = 1200) {
  const paragraphs = text
    .split(/\n\s*\n/g)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    const compact = text.trim();
    if (!compact) return [];
    const chunks: string[] = [];
    for (let index = 0; index < compact.length; index += chunkSize) chunks.push(compact.slice(index, index + chunkSize).trim());
    return chunks.filter(Boolean);
  }

  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph;
    if (next.length > chunkSize && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function normalizeKnowledgeBody(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

const SAMPLE_SEED_NOTES: KnowledgeNote[] = [
  {
    id: 'kb-seed-1',
    title: 'Giao thức Tiếng nói chung giữa các AI Staff & Quy trình Handshake Inter-Agent',
    source: 'Founder Note',
    trust: 'Approved',
    tags: 'ai-staff, inter-agent, handshake, protocol, ssot',
    body: 'Mọi AI Agent (AI CFO, AI CMO, AI CTO, AI CPO) khi giao tiếp liên vai trò bắt buộc phải trao đổi theo định dạng JSON WorkCard chuẩn. Nội dung đề xuất phải căn cứ trực tiếp từ Kho Tri thức đã duyệt (SSOT). AI CFO chịu trách nhiệm tài chính, AI CTO thẩm định hạ tầng an toàn, AI CMO phát triển khách hàng, và Founder nắm Quyền Phủ quyết (Veto Gate) cuối cùng.',
    createdAt: '12/08/2026, 08:00:00',
    updatedAt: '12/08/2026, 08:00:00',
  },
  {
    id: 'kb-seed-2',
    title: 'SOP Quy trình Phê duyệt Chi phí & Ngân sách Cấp cao',
    source: 'Process SOP',
    trust: 'Approved',
    tags: 'tai-chinh, phe-duyet, ngan-sach, sop',
    body: 'Mọi khoản duyệt chi phí vượt 50.000.000 VNĐ bắt buộc phải qua bước Founder Approve trong Hồ sơ & Phê duyệt. Các chứng từ hợp lệ bao gồm hóa đơn GTGT điện tử, đề xuất chuyển khoản và bằng chứng bàn giao dịch vụ.',
    createdAt: '12/08/2026, 08:30:00',
    updatedAt: '12/08/2026, 08:30:00',
  },
  {
    id: 'kb-seed-3',
    title: 'Kiến trúc An toàn AI Gateway & Key Vault Security',
    source: 'Code Decision',
    trust: 'Approved',
    tags: 'ai, bao-mat, vault, gateway',
    body: 'Tuyệt đối không gọi trực tiếp API key của Gemini/OpenAI/Claude từ frontend client. Mọi luồng API phải qua AI Router ở backend (/api/ai/chat) với cơ chế tự động mã hóa AES-256, auto-lock khi hết phiên và che ẩn API Key.',
    createdAt: '12/08/2026, 09:15:00',
    updatedAt: '12/08/2026, 09:15:00',
  },
  {
    id: 'kb-seed-4',
    title: 'Định vị Sản phẩm Company OS & Khách hàng Cốt lõi',
    source: 'Founder Note',
    trust: 'Approved',
    tags: 'chien-luoc, company-os, saas, tam-nhin',
    body: 'LedgerFlow không phải là ERP kế toán xây dựng thuần túy. Sản phẩm là hệ điều hành doanh nghiệp công nghệ (Company OS) bao gồm Product Studio, Marketing & Growth, Sales CRM, AI Nhân sự và Analytics Sandbox.',
    createdAt: '12/08/2026, 10:00:00',
    updatedAt: '12/08/2026, 10:00:00',
  },
  {
    id: 'kb-seed-5',
    title: 'Quy chuẩn Kiểm soát Chứng từ Kế toán chuẩn VAS',
    source: 'Accounting Rule',
    trust: 'Approved',
    tags: 'ke-toan, vas, thue, kiem-toan',
    body: 'Kiểm tra định kỳ 100% chứng từ chi phí đầu vào trước khi lập báo cáo tài chính. Trường hợp thiếu hóa đơn đỏ hoặc chứng từ chưa hoàn ứng quá 30 ngày phải gắn cờ Red Flag trong Bảng kiểm toán nội bộ.',
    createdAt: '12/08/2026, 11:20:00',
    updatedAt: '12/08/2026, 11:20:00',
  },
  {
    id: 'kb-seed-6',
    title: 'Tiêu chuẩn Định dạng Báo cáo & Ô Nhập liệu Kế toán Excel Việt Nam',
    source: 'Accounting Rule',
    trust: 'Approved',
    tags: 'excel, dinh-dang, ke-toan, vas, UI',
    body: 'Tất cả các số liệu tài chính, dòng tiền và ô nhập liệu phải sử dụng định dạng chuẩn Kế toán Excel Việt Nam: Dấu chấm (.) phân cách hàng nghìn (ví dụ 1.030.000.000 đ), dấu phẩy (,) phân cách thập phân (ví dụ 6,4 tháng), và phông chữ mono nét căng.',
    createdAt: '12/08/2026, 14:00:00',
    updatedAt: '12/08/2026, 14:00:00',
  },
];

export default function KnowledgeBaseTab({ initialSubTab = 'library' }: { initialSubTab?: 'library' | 'rag_simulator' | 'operating_layer' | 'inter_agent_protocol' | 'swarm_orchestrator' }) {
  const { t } = useLanguage();
  useLocalStorageVersion();
  const rawNotes = readLocalStorageValue<KnowledgeNote[]>(KNOWLEDGE_KEY, []);
  
  // Auto seed if empty
  const notes = useMemo(() => {
    if (rawNotes.length === 0) {
      writeLocalStorageValue(KNOWLEDGE_KEY, SAMPLE_SEED_NOTES);
      return SAMPLE_SEED_NOTES;
    }
    return rawNotes;
  }, [rawNotes]);

  const [draft, setDraft] = useState(emptyDraft());
  const [subTab, setSubTab] = useState<'library' | 'rag_simulator' | 'operating_layer' | 'inter_agent_protocol' | 'swarm_orchestrator'>(initialSubTab);
  const [filter, setFilter] = useState<'all' | KnowledgeTrust>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [importTitle, setImportTitle] = useState('');
  const [importTags, setImportTags] = useState('');
  const [importText, setImportText] = useState('');
  const [chunkSize, setChunkSize] = useState<number>(1200);
  const [copiedContext, setCopiedContext] = useState(false);

  useEffect(() => {
    setSubTab(initialSubTab);
  }, [initialSubTab]);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return notes.filter((note) => {
      const trustMatch = filter === 'all' || note.trust === filter;
      const sourceMatch = selectedSource === 'all' || note.source === selectedSource;
      const queryMatch = !normalizedQuery || [note.title, note.source, note.trust, note.tags, note.body].join(' ').toLowerCase().includes(normalizedQuery);
      return trustMatch && sourceMatch && queryMatch;
    });
  }, [filter, selectedSource, notes, query]);

  const approvedCount = notes.filter((note) => note.trust === 'Approved').length;
  const reviewCount = notes.filter((note) => note.trust === 'Needs Review').length;
  const draftCount = notes.filter((note) => note.trust === 'Draft').length;
  const ragContext = buildRagContext(filteredNotes.filter((note) => note.trust === 'Approved'));

  const saveNote = () => {
    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title || !body) return;
    const now = new Date().toLocaleString('vi-VN');
    const note: KnowledgeNote = {
      id: `kb-${Date.now()}`,
      title,
      source: draft.source,
      trust: draft.trust,
      tags: draft.tags.trim(),
      body,
      createdAt: now,
      updatedAt: now
    };
    writeLocalStorageValue(KNOWLEDGE_KEY, [note, ...notes].slice(0, 250));
    appendAgentOpsAudit('KNOWLEDGE_NOTE_CREATED', note.id, `${note.source} · ${note.trust} · ${note.title}`);
    setDraft(emptyDraft());
  };

  const importDocument = () => {
    const title = importTitle.trim();
    const text = importText.trim();
    if (!title || !text) return;
    const chunks = splitDocumentIntoChunks(text, chunkSize);
    if (chunks.length === 0) return;
    const now = new Date().toLocaleString('vi-VN');
    const seenBodies = new Set(notes.map((note) => normalizeKnowledgeBody(note.body)));
    const importedNotes: KnowledgeNote[] = [];
    let skipped = 0;

    chunks.forEach((chunk, index) => {
      const normalized = normalizeKnowledgeBody(chunk);
      if (!normalized || seenBodies.has(normalized)) {
        skipped += 1;
        return;
      }
      seenBodies.add(normalized);
      importedNotes.push({
        id: `kb-import-${Date.now()}-${index + 1}`,
        title: chunks.length === 1 ? title : `${title} · đoạn ${index + 1}/${chunks.length}`,
        source: 'Document Import',
        trust: 'Needs Review',
        tags: [importTags.trim(), `doc:${title}`, `chunk:${index + 1}`].filter(Boolean).join(', '),
        body: chunk,
        createdAt: now,
        updatedAt: now
      });
    });

    if (importedNotes.length === 0) {
      appendAgentOpsAudit('KNOWLEDGE_DOCUMENT_IMPORT_SKIPPED', 'knowledge-base', `${title} · ${skipped} trùng lặp`);
      return;
    }
    writeLocalStorageValue(KNOWLEDGE_KEY, [...importedNotes, ...notes].slice(0, 300));
    appendAgentOpsAudit('KNOWLEDGE_DOCUMENT_IMPORTED', importedNotes[0].id, `${title} · ${importedNotes.length} đoạn · ${skipped} trùng lặp`);
    setImportTitle('');
    setImportTags('');
    setImportText('');
  };

  const updateTrust = (note: KnowledgeNote, trust: KnowledgeTrust) => {
    const next = notes.map((item) => item.id === note.id ? { ...item, trust, updatedAt: new Date().toLocaleString('vi-VN') } : item);
    writeLocalStorageValue(KNOWLEDGE_KEY, next);
    appendAgentOpsAudit('KNOWLEDGE_TRUST_UPDATED', note.id, `${note.title} -> ${trust}`);
  };

  const deleteNote = (note: KnowledgeNote) => {
    writeLocalStorageValue(KNOWLEDGE_KEY, notes.filter((item) => item.id !== note.id));
    appendAgentOpsAudit('KNOWLEDGE_NOTE_DELETED', note.id, note.title);
  };

  const copyRagContext = async () => {
    if (!ragContext) return;
    await navigator.clipboard.writeText(ragContext);
    setCopiedContext(true);
    setTimeout(() => setCopiedContext(false), 2000);
    appendAgentOpsAudit('KNOWLEDGE_RAG_CONTEXT_COPIED', 'knowledge-base', `${filteredNotes.length} notes, ${approvedCount} approved notes.`);
  };

  const sendToWorkboard = (note: KnowledgeNote) => {
    const card = makeWorkCard(note);
    appendLocalStorageArrayItem<WorkCard>(WORKBOARD_KEY, card, 150);
    appendAgentOpsAudit('KNOWLEDGE_SENT_TO_WORKBOARD', card.id, note.title);
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Top Header & Subtab Cockpit Switcher */}
      <section className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0 shadow-lg">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Kho Tri thức Doanh nghiệp</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Company Memory &amp; RAG SSOT
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Kho lưu trữ SOP, quyết định vận hành và quy tắc kế toán chuẩn VAS. Cung cấp RAG Context trực tiếp cho các AI Agent.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/70 border border-violet-500/30 px-3 py-1.5 font-mono">
              <Database className="h-4 w-4 text-violet-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Tổng Tri thức</span>
                <span className="text-xs font-black text-violet-300">{formatNumberVN(notes.length, 0)} Notes</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-950/70 border border-emerald-500/30 px-3 py-1.5 font-mono">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Đã duyệt RAG</span>
                <span className="text-xs font-black text-emerald-300">{formatNumberVN(approvedCount, 0)} Approved</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-950/70 border border-amber-500/30 px-3 py-1.5 font-mono">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Chờ Founder Duyệt</span>
                <span className="text-xs font-black text-amber-300">{formatNumberVN(reviewCount, 0)} Review</span>
              </div>
            </div>

            <button
              onClick={copyRagContext}
              disabled={!ragContext}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-md shadow-emerald-600/20 shrink-0 ml-2"
            >
              {copiedContext ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedContext ? 'Đã sao chép RAG Context' : 'Sao chép Context đã duyệt'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Tab Render */}
      {subTab === 'rag_simulator' && <RAGSimulatorPanel />}

      {subTab === 'operating_layer' && <OperatingKnowledgeLayerPanel />}

      {subTab === 'inter_agent_protocol' && <InterAgentProtocolPanel />}

      {subTab === 'swarm_orchestrator' && <SwarmRelayOrchestratorPanel />}

      {subTab === 'library' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] text-left">
          
          {/* Left Column: Form Add Note & Import Document */}
          <div className="space-y-5">
            {/* Form 1: Add New Knowledge Note */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-violet-400" />
                  Thêm Ghi chú Tri thức Mới
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase">Single Note Input</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tiêu đề Ghi chú / SOP / Quyết định:</label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Ví dụ: SOP Quy trình duyệt chi ngân sách > 50M..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-violet-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nguồn Tri thức:</label>
                    <select
                      value={draft.source}
                      onChange={(e) => setDraft({ ...draft, source: e.target.value as KnowledgeSource })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-violet-400 cursor-pointer"
                    >
                      {sourceOptions.map((src) => (
                        <option key={src} value={src}>{sourceLabel(src)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Trạng thái Phê duyệt:</label>
                    <select
                      value={draft.trust}
                      onChange={(e) => setDraft({ ...draft, trust: e.target.value as KnowledgeTrust })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-violet-400 cursor-pointer"
                    >
                      {trustOptions.map((tr) => (
                        <option key={tr} value={tr}>{trustLabel(tr)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Thẻ Từ khóa (Tags):</label>
                  <input
                    type="text"
                    value={draft.tags}
                    onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
                    placeholder="tai-chinh, phe-duyet, sop, bao-mat..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-violet-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nội dung Chi tiết Tri thức:</label>
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    placeholder="Nhập nội dung quy tắc, hướng dẫn hoặc nguyên tắc chi tiết..."
                    rows={5}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-100 leading-relaxed outline-none focus:border-violet-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveNote}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Lưu Ghi chú vào Kho Tri thức
                </button>
              </div>
            </div>

            {/* Form 2: Bulk Document Text Import */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  Tải lên Tài liệu SOP Dài (Auto Chunking)
                </h3>
                <span className="text-[10px] font-bold text-amber-300">Local Chunking</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Tải lên văn bản tài liệu dài. Hệ thống tự động chia thành các đoạn ngắn (chunks), lọc bỏ trùng lặp và đưa vào trạng thái <strong className="text-amber-300">Chờ duyệt (Needs Review)</strong>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tên Tài liệu / Nguồn Nguồn gốc:</label>
                  <input
                    type="text"
                    value={importTitle}
                    onChange={(e) => setImportTitle(e.target.value)}
                    placeholder="Ví dụ: Quy chế Quản lý Tài chính VAS 2026..."
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Thẻ Từ khóa (Tags Import):</label>
                    <input
                      type="text"
                      value={importTags}
                      onChange={(e) => setImportTags(e.target.value)}
                      placeholder="quy-che, ke-toan-vas, 2026"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Kích thước Đoạn (Chunk Size):</label>
                    <ExcelNumberInput
                      value={chunkSize}
                      onValueChange={(val) => setChunkSize(val || 1200)}
                      suffix="ký tự"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nội dung Văn bản Dài:</label>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Dán toàn bộ văn bản tài liệu dài ở đây..."
                    rows={6}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-100 leading-relaxed outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={importDocument}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-600/20"
                >
                  <Upload className="w-4 h-4" />
                  Tách Đoạn &amp; Lưu Chờ duyệt
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Knowledge Base List & Management */}
          <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-400" />
                  Danh mục Tri thức Doanh nghiệp ({filteredNotes.length})
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                  Chỉ những tri thức có cờ <strong className="text-emerald-400">✓ Đã duyệt (Approved)</strong> mới được cung cấp làm Context cho các Agent AI.
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid gap-2 sm:grid-cols-[1fr_170px_170px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tiêu đề, nội dung, tag..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-2 text-xs font-semibold text-slate-100 outline-none focus:border-violet-400"
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | KnowledgeTrust)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-violet-400 cursor-pointer"
              >
                <option value="all">Tất cả Trạng thái</option>
                {trustOptions.map((tr) => (
                  <option key={tr} value={tr}>{trustLabel(tr)}</option>
                ))}
              </select>

              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:border-violet-400 cursor-pointer"
              >
                <option value="all">Tất cả Nguồn tri thức</option>
                {sourceOptions.map((src) => (
                  <option key={src} value={src}>{sourceLabel(src)}</option>
                ))}
              </select>
            </div>

            {/* Note Cards List */}
            <div className="space-y-3.5 max-h-[820px] overflow-y-auto pr-1">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 hover:border-slate-700 transition"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{note.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          {sourceLabel(note.source)}
                        </span>
                        {note.tags && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{note.tags}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500">
                          Cập nhật: {note.updatedAt}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${trustTone(note.trust)}`}>
                      {trustLabel(note.trust)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-normal whitespace-pre-wrap bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {note.body}
                  </p>

                  {/* 1-Click Quick Trust Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500">Duyệt nhanh:</span>
                      {trustOptions.map((tr) => (
                        <button
                          key={tr}
                          type="button"
                          onClick={() => updateTrust(note, tr)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                            note.trust === tr
                              ? trustTone(tr)
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {trustLabel(tr)}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => sendToWorkboard(note)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-600 hover:text-white transition cursor-pointer"
                      >
                        Giao việc AI
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note)}
                        className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-600 hover:text-white transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredNotes.length === 0 && (
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400 font-medium">
                  Chưa tìm thấy ghi chú tri thức phù hợp. Hãy thêm ghi chú hoặc tải lên tài liệu mới.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
