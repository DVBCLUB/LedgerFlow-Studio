import { useEffect, useMemo, useState } from 'react';

type WorkStatus = 'Inbox' | 'Planning' | 'Waiting Approval' | 'Ready' | 'Done';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type WorkKind = 'Q&A' | 'Code' | 'Design' | 'Data' | 'Marketing' | 'Integration';

type WorkCard = {
  id: string;
  title: string;
  kind: WorkKind;
  owner: string;
  status: WorkStatus;
  risk: RiskLevel;
  request: string;
  plan: string[];
  tools: string[];
  approval: string;
};

type KnowledgeItem = {
  id: string;
  title: string;
  category: string;
  source: string;
  tags: string;
  content: string;
  priority: 'Cao' | 'Vừa' | 'Thấp';
  createdAt: string;
};

type AuditEntry = {
  id: string;
  at: string;
  action: string;
  cardId: string;
  detail: string;
};

type ReviewDeskResultEvent = {
  sourceCardId?: string;
  at?: string;
  result?: {
    repo?: string;
    branchName?: string;
    commitSha?: string;
    pullRequestNumber?: number;
    pullRequestUrl?: string;
    changedFiles?: string[];
  };
};

type CiFixPackage = {
  id: string;
  sourceCardId?: string;
  repo: string;
  branchName: string;
  pullRequestNumber: number;
  pullRequestUrl: string;
  workflowRunUrl: string;
  workflowName: string;
  status: string;
  conclusion: string | null;
  createdAt: string;
  prompt: string;
};

const initialCards: WorkCard[] = [
  {
    id: 'wb-001',
    title: 'Rà soát Company OS direction',
    kind: 'Q&A',
    owner: 'AI Điều phối trưởng',
    status: 'Done',
    risk: 'LOW',
    request: 'Đảm bảo LedgerFlow không bị hiểu thành công ty xây dựng.',
    plan: ['Đọc Thư viện tri thức', 'Đối chiếu AGENTS.md', 'Cập nhật guardrail UI'],
    tools: ['Knowledge Library', 'Docs'],
    approval: 'Không cần quyền ngoài hệ thống.'
  },
  {
    id: 'wb-002',
    title: 'Chuẩn hóa AI Operations Center',
    kind: 'Design',
    owner: 'AI Thiết kế sản phẩm',
    status: 'Planning',
    risk: 'MEDIUM',
    request: 'Thiết kế trung tâm điều phối giống OpenClaw nhưng sandbox-first.',
    plan: ['Tách Inbox', 'Tạo Tool Cards', 'Thêm Approval Gate', 'Ghi Audit Log'],
    tools: ['Workboard', 'Approval Gate', 'Sandbox Policy'],
    approval: 'Founder duyệt trước khi chuyển sang execution.'
  }
];

const initialAudit: AuditEntry[] = [
  {
    id: 'audit-001',
    at: 'Mặc định',
    action: 'SYSTEM_BOOTSTRAP',
    cardId: 'wb-002',
    detail: 'Khởi tạo AI Ops Workboard theo hướng OpenClaw-inspired nhưng sandbox-first.'
  }
];

const fallbackKnowledge: KnowledgeItem[] = [
  {
    id: 'fallback-company-os',
    title: 'LedgerFlow là Software Company OS',
    category: 'Chiến lược sản phẩm',
    source: 'Built-in fallback',
    tags: 'company-os, product, ai-agent',
    content: 'LedgerFlow là hệ điều hành cho công ty phần mềm nhỏ, không phải công ty xây dựng. Các module phải xoay quanh sản phẩm, marketing, sales, AI operations, sandbox, tích hợp và tài chính.',
    priority: 'Cao',
    createdAt: 'Built-in'
  },
  {
    id: 'fallback-ai-ops',
    title: 'AI Nhân sự là AI Operations Center',
    category: 'AI Operations',
    source: 'Built-in fallback',
    tags: 'ai-ops, github, vscode, code, approval',
    content: 'AI Nhân sự là nơi điều phối AI/AI agent, code, design, GitHub, VS Code, dữ liệu vào/ra, approval và audit. Không phải HCNS thông thường.',
    priority: 'Cao',
    createdAt: 'Built-in'
  }
];

const statusOrder: WorkStatus[] = ['Inbox', 'Planning', 'Waiting Approval', 'Ready', 'Done'];
const kindOptions: WorkKind[] = ['Q&A', 'Code', 'Design', 'Data', 'Marketing', 'Integration'];

function riskClass(risk: RiskLevel) {
  if (risk === 'LOW') return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-orange-400/35 bg-orange-400/10 text-orange-200';
}

function riskFor(kind: WorkKind): RiskLevel {
  if (kind === 'Code' || kind === 'Integration') return 'HIGH';
  if (kind === 'Data' || kind === 'Design') return 'MEDIUM';
  return 'LOW';
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'reviewed-change';
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function scoreKnowledge(card: WorkCard, item: KnowledgeItem) {
  const haystack = `${item.title} ${item.category} ${item.tags} ${item.content}`.toLowerCase();
  const words = `${card.title} ${card.kind} ${card.owner} ${card.request} ${card.tools.join(' ')}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3);
  const uniqueWords = Array.from(new Set(words));
  let score = item.priority === 'Cao' ? 3 : item.priority === 'Vừa' ? 1 : 0;
  for (const word of uniqueWords) {
    if (haystack.includes(word)) score += 1;
  }
  if (card.kind === 'Code' && /code|github|vscode|ci|dev|agent|push/i.test(`${item.tags} ${item.content}`)) score += 4;
  if (card.kind === 'Marketing' && /marketing|sales|crm|content|lead/i.test(`${item.tags} ${item.content}`)) score += 4;
  if (card.kind === 'Design' && /design|ui|ux|product|prd/i.test(`${item.tags} ${item.content}`)) score += 4;
  if (card.kind === 'Integration' && /integration|connector|github|api|gateway/i.test(`${item.tags} ${item.content}`)) score += 4;
  return score;
}

export default function AIOpsWorkboard() {
  const [cards, setCards] = useState<WorkCard[]>(() => readLocal('ledgerflow_aiops_cards_v1', initialCards));
  const [audit, setAudit] = useState<AuditEntry[]>(() => readLocal('ledgerflow_aiops_audit_v1', initialAudit));
  const [draft, setDraft] = useState({ title: '', kind: 'Code' as WorkKind, request: '' });
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? initialCards[0].id);
  const [showContext, setShowContext] = useState(true);

  useEffect(() => {
    localStorage.setItem('ledgerflow_aiops_cards_v1', JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_aiops_audit_v1', JSON.stringify(audit));
  }, [audit]);

  const selected = useMemo(() => cards.find((card) => card.id === selectedId) ?? cards[0], [cards, selectedId]);
  const knowledge = useMemo(() => readLocal<KnowledgeItem[]>('ledgerflow_knowledge_library_v1', fallbackKnowledge), []);
  const contextPack = useMemo(() => {
    if (!selected) return [];
    return knowledge
      .map((item) => ({ item, score: scoreKnowledge(selected, item) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [knowledge, selected]);

  const pushAudit = (action: string, cardId: string, detail: string) => {
    setAudit((current) => [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, cardId, detail }, ...current].slice(0, 120));
  };

  useEffect(() => {
    const handleReviewResult = (event: Event) => {
      const detail = (event as CustomEvent<ReviewDeskResultEvent>).detail;
      const cardId = detail?.sourceCardId;
      if (!cardId || !detail?.result) return;
      const pr = detail.result;
      setCards((current) => current.map((card) => card.id === cardId ? { ...card, status: 'Done' } : card));
      setAudit((current) => [{
        id: `audit-${Date.now()}`,
        at: detail.at || new Date().toLocaleString('vi-VN'),
        action: 'DRAFT_PR_CREATED',
        cardId,
        detail: `Draft PR #${pr.pullRequestNumber || '?'} created on ${pr.branchName || 'ai/*'}: ${pr.pullRequestUrl || 'no url'}`
      }, ...current].slice(0, 120));
    };
    window.addEventListener('ledgerflow-review-desk-result', handleReviewResult);
    return () => window.removeEventListener('ledgerflow-review-desk-result', handleReviewResult);
  }, []);

  useEffect(() => {
    const handleCiFixPackage = (event: Event) => {
      const pack = (event as CustomEvent<CiFixPackage>).detail;
      if (!pack?.id) return;
      const cardId = `wb-ci-${Date.now()}`;
      const card: WorkCard = {
        id: cardId,
        title: `Fix CI failure for PR #${pack.pullRequestNumber}`,
        kind: 'Code',
        owner: 'AI Code / Dev Agent',
        status: 'Waiting Approval',
        risk: 'HIGH',
        request: pack.prompt,
        plan: ['Mở CI Doctor', 'Đọc workflow run', 'Xác định lỗi build/test', 'Tạo patch nhỏ', 'Đưa qua Review Desk nếu cần push tiếp'],
        tools: ['CI Doctor', 'GitHub Actions', 'Review Desk', 'Knowledge Library'],
        approval: 'Founder duyệt trước khi tạo patch sửa lỗi CI.'
      };
      setCards((current) => [card, ...current]);
      setSelectedId(cardId);
      setAudit((current) => [{
        id: `audit-${Date.now()}`,
        at: pack.createdAt || new Date().toLocaleString('vi-VN'),
        action: 'CI_FIX_CARD_CREATED',
        cardId,
        detail: `Created from failed workflow ${pack.workflowName} (${pack.conclusion || pack.status}) on ${pack.branchName}.`
      }, ...current].slice(0, 120));
      if (pack.sourceCardId) {
        setAudit((current) => [{
          id: `audit-${Date.now() + 1}`,
          at: pack.createdAt || new Date().toLocaleString('vi-VN'),
          action: 'CI_FAILURE_DETECTED',
          cardId: pack.sourceCardId || '',
          detail: `PR #${pack.pullRequestNumber} workflow failed. Created follow-up card ${cardId}.`
        }, ...current].slice(0, 120));
      }
    };
    window.addEventListener('ledgerflow-ci-fix-package', handleCiFixPackage);
    return () => window.removeEventListener('ledgerflow-ci-fix-package', handleCiFixPackage);
  }, []);

  const addCard = () => {
    if (!draft.title.trim() || !draft.request.trim()) return;
    const risk = riskFor(draft.kind);
    const card: WorkCard = {
      id: `wb-${Date.now()}`,
      title: draft.title.trim(),
      kind: draft.kind,
      owner: draft.kind === 'Code' ? 'AI Code / Dev Agent' : draft.kind === 'Design' ? 'AI Thiết kế sản phẩm' : draft.kind === 'Marketing' ? 'AI Marketing / Sales' : draft.kind === 'Data' ? 'AI Dữ liệu / Tri thức' : 'AI Điều phối trưởng',
      status: risk === 'LOW' ? 'Inbox' : 'Waiting Approval',
      risk,
      request: draft.request.trim(),
      plan: ['Đọc Thư viện tri thức', 'Lập kế hoạch nhỏ', 'Tạo tool card', 'Chờ founder duyệt nếu có rủi ro'],
      tools: draft.kind === 'Code' ? ['Knowledge Library', 'Dev Handoff', 'CI Doctor', 'Review Desk'] : draft.kind === 'Integration' ? ['Integration Hub', 'Connector Policy', 'Review Desk'] : ['Knowledge Library', 'Sandbox'],
      approval: risk === 'LOW' ? 'Có thể xử lý trong sandbox.' : 'Cần founder review trước khi hành động ngoài sandbox.'
    };
    setCards((current) => [card, ...current]);
    setSelectedId(card.id);
    pushAudit('CARD_CREATED', card.id, `Tạo work card ${card.kind} với risk ${card.risk}.`);
    setDraft({ title: '', kind: draft.kind, request: '' });
  };

  const moveSelected = (status: WorkStatus) => {
    if (!selected) return;
    setCards((current) => current.map((card) => card.id === selected.id ? { ...card, status } : card));
    pushAudit('STATUS_CHANGED', selected.id, `Đổi trạng thái từ ${selected.status} sang ${status}.`);
  };

  const exportContextPack = () => {
    if (!selected) return;
    const payload = {
      card: selected,
      generatedAt: new Date().toLocaleString('vi-VN'),
      context: contextPack.map(({ item, score }) => ({ ...item, matchScore: score }))
    };
    localStorage.setItem('ledgerflow_aiops_context_pack_v1', JSON.stringify(payload));
    pushAudit('CONTEXT_PACK_EXPORTED', selected.id, `Xuất context pack gồm ${payload.context.length} mục tri thức.`);
    exportJson(`ledgerflow-context-${selected.id}.json`, payload);
  };

  const openReviewDesk = () => {
    if (!selected) return;
    const slug = slugify(selected.title);
    const contextText = contextPack.length ? [
      '',
      '## Knowledge Context Pack',
      ...contextPack.map(({ item, score }) => `- [${score}] ${item.title} (${item.category}) — ${item.content.slice(0, 240)}`)
    ] : [];
    const prepared = {
      sourceCardId: selected.id,
      title: `AI update: ${selected.title}`,
      branchName: `ai/${slug}`,
      summary: [
        `Prepared from AI Ops Workboard card ${selected.id}.`,
        '',
        `Kind: ${selected.kind}`,
        `Owner: ${selected.owner}`,
        `Risk: ${selected.risk}`,
        '',
        'Founder request:',
        selected.request,
        '',
        'Plan:',
        ...selected.plan.map((item) => `- ${item}`),
        ...contextText
      ].join('\n'),
      filePath: `docs/ai-reviewed/${slug}.md`,
      fileContent: [
        `# ${selected.title}`,
        '',
        `Work card: ${selected.id}`,
        `Kind: ${selected.kind}`,
        `Owner: ${selected.owner}`,
        `Risk: ${selected.risk}`,
        '',
        '## Request',
        selected.request,
        '',
        '## Plan',
        ...selected.plan.map((item) => `- ${item}`),
        '',
        '## Knowledge Context Pack',
        ...(contextPack.length ? contextPack.map(({ item, score }) => `- Score ${score}: ${item.title} (${item.category}) — ${item.content}`) : ['No matching knowledge item found.']),
        '',
        '## Approval note',
        selected.approval,
        '',
        '## Tool cards',
        ...selected.tools.map((tool) => `- ${tool}`)
      ].join('\n')
    };
    localStorage.setItem('ledgerflow_review_desk_prefill_v1', JSON.stringify(prepared));
    localStorage.setItem('ledgerflow_aiops_context_pack_v1', JSON.stringify({ card: selected, context: contextPack.map(({ item, score }) => ({ ...item, matchScore: score })) }));
    pushAudit('OPEN_REVIEW_DESK', selected.id, `Chuẩn bị Review Desk kèm ${contextPack.length} mục tri thức.`);
    window.location.hash = '#/review_desk';
  };

  const openCiDoctor = () => {
    if (selected) pushAudit('OPEN_CI_DOCTOR', selected.id, 'Mở CI Doctor để phân tích lỗi workflow.');
    window.location.hash = '#/ci_doctor';
  };

  return (
    <section className="rounded-3xl border border-violet-400/35 bg-violet-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">OpenClaw-inspired control board</p>
          <h3 className="mt-1 text-xl font-black text-white">AI Ops Workboard</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Inbox, context pack, tool cards, risk, approval và audit workflow cho AI agent. Action có rủi ro phải đi qua review.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportJson('ledgerflow-aiops-audit.json', audit)} className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-300 hover:border-violet-300">Xuất audit</button>
          <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-200">Sandbox-first</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.25fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-sm font-black text-white">Tạo việc cho AI agent</p>
          <div className="mt-3 grid gap-2">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên việc" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as WorkKind })}>
              {kindOptions.map((kind) => <option key={kind}>{kind}</option>)}
            </select>
            <textarea className="min-h-[120px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" placeholder="Mô tả yêu cầu cho AI..." value={draft.request} onChange={(event) => setDraft({ ...draft, request: event.target.value })} />
            <button onClick={addCard} className="rounded-2xl bg-violet-300 px-4 py-2 text-xs font-black text-slate-950">Đưa vào Workboard</button>
          </div>

          <div className="mt-4 space-y-2">
            {cards.map((card) => <button key={card.id} onClick={() => setSelectedId(card.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === card.id ? 'border-violet-300 bg-violet-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-violet-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{card.title}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(card.risk)}`}>{card.risk}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{card.kind} · {card.owner} · {card.status}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected work card</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.title}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.owner} · {selected.kind}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(selected.risk)}`}>{selected.risk}</span>
          </div>
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-semibold leading-6 text-slate-300">{selected.request}</p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Plan</p>
              <ul className="mt-2 space-y-2">{selected.plan.map((item) => <li key={item} className="text-xs font-semibold text-slate-300">✓ {item}</li>)}</ul>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tool cards</p>
              <div className="mt-2 flex flex-wrap gap-2">{selected.tools.map((tool) => <span key={tool} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">{tool}</span>)}</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-cyan-400/35 bg-cyan-400/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-black text-cyan-200">Knowledge Context Pack</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">Tự gom tri thức liên quan từ Thư viện để AI đọc trước khi hành động.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowContext((value) => !value)} className="rounded-full border border-slate-700 px-3 py-1 text-[10px] font-black text-slate-300 hover:border-cyan-300">{showContext ? 'Ẩn' : 'Hiện'}</button>
                <button onClick={exportContextPack} className="rounded-full border border-cyan-400/40 px-3 py-1 text-[10px] font-black text-cyan-200 hover:bg-cyan-400/10">Xuất context</button>
              </div>
            </div>
            {showContext && <div className="mt-3 space-y-2">
              {contextPack.map(({ item, score }) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-black text-white">{item.title}</p>
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">score {score}</span>
                </div>
                <p className="mt-1 text-[11px] font-bold text-slate-500">{item.category} · {item.source} · {item.tags}</p>
                <p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-300">{item.content}</p>
              </div>)}
              {contextPack.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs font-semibold text-slate-400">Chưa tìm thấy tri thức phù hợp. Hãy nhập thêm vào Thư viện tri thức.</p>}
            </div>}
          </div>

          <div className="mt-4 rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3">
            <p className="text-xs font-black text-amber-200">Approval note</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{selected.approval}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statusOrder.map((status) => <button key={status} onClick={() => moveSelected(status)} className={`rounded-full border px-3 py-2 text-[11px] font-black ${selected.status === status ? 'border-emerald-300 bg-emerald-300 text-slate-950' : 'border-slate-700 text-slate-300 hover:border-emerald-400'}`}>{status}</button>)}
            {(selected.kind === 'Code' || selected.kind === 'Integration') && <button onClick={openReviewDesk} className="rounded-full border border-emerald-400/50 px-3 py-2 text-[11px] font-black text-emerald-200 hover:bg-emerald-400/10">Review Desk</button>}
            {selected.title.startsWith('Fix CI failure') && <button onClick={openCiDoctor} className="rounded-full border border-orange-400/50 px-3 py-2 text-[11px] font-black text-orange-200 hover:bg-orange-400/10">CI Doctor</button>}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Audit log</p>
              <span className="text-[10px] font-bold text-slate-500">{audit.length} events</span>
            </div>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {audit.filter((entry) => entry.cardId === selected.id).map((entry) => <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-violet-200">{entry.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{entry.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{entry.at}</p>
              </div>)}
              {audit.filter((entry) => entry.cardId === selected.id).length === 0 && <p className="text-xs font-semibold text-slate-500">Chưa có audit riêng cho card này.</p>}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
