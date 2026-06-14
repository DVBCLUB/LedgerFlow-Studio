import { useMemo, useState } from 'react';
import { appendAgentOpsAudit, appendLocalStorageArrayItem, readLocalStorageValue, useLocalStorageVersion } from '../storage';

const KNOWLEDGE_KEY = 'ledgerflow_company_knowledge_v1';

type IndustryTemplate = {
  id: string;
  name: string;
  scope: string;
  modules: string[];
  notCore: string[];
  firstUse: string;
};

type KnowledgeNote = {
  id: string;
  title: string;
  source: string;
  trust: 'Draft' | 'Needs Review' | 'Approved';
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

const coreLanes = [
  'Command Center',
  'Founder OS',
  'AI Workforce',
  'Approval Gate',
  'Knowledge Base',
  'Product Factory',
  'Integration Hub',
  'Finance & Accounting',
  'Documents & Approval',
  'Analytics & Sandbox',
];

const templates: IndustryTemplate[] = [
  {
    id: 'construction-accounting',
    name: 'Xây dựng / Kế toán công trình',
    scope: 'Theo dõi công trình, chi phí, tạm ứng, hoàn ứng, vật tư, dầu, hồ sơ chứng từ và báo cáo sếp.',
    modules: ['Công trình', 'Chi phí công trình', 'Vật tư kho', 'Quỹ dầu', 'Tạm ứng/Hoàn ứng', 'Hồ sơ chứng từ', 'Báo cáo sếp'],
    notCore: ['Không hardcode Trung Hải vào core', 'Không để mọi menu chính đều xoay quanh công trình', 'Không biến Company OS thành ERP xây dựng quá sớm'],
    firstUse: 'Dùng như template ngành để bật nhanh cho công ty xây dựng, không phải xương sống toàn app.',
  },
  {
    id: 'solo-saas',
    name: 'Solo SaaS / AI product studio',
    scope: 'Quản lý ý tưởng, build plan, prompt pack, feedback, release checklist và tăng trưởng sản phẩm.',
    modules: ['Idea Portfolio', 'Build Pipeline', 'Prompt Pack', 'Feedback Loop', 'Release Audit', 'Marketing Calendar'],
    notCore: ['Không trộn dữ liệu khách hàng thật vào sandbox', 'Không bỏ qua approval khi publish landing/email'],
    firstUse: 'Dùng khi founder muốn vận hành nhiều sản phẩm nhỏ bằng AI workforce.',
  },
  {
    id: 'service-business',
    name: 'Dịch vụ / Agency nhỏ',
    scope: 'Quản lý lead, proposal, job, delivery, invoice và chăm sóc khách hàng.',
    modules: ['CRM', 'Proposal', 'Delivery Board', 'Invoice Tracker', 'Client Feedback', 'SOP Library'],
    notCore: ['Không ép mọi dự án thành công trình', 'Không thay thế phần mềm kế toán chính khi chưa có kiểm soát'],
    firstUse: 'Dùng cho dịch vụ kế toán, tư vấn, thiết kế, marketing hoặc triển khai phần mềm.',
  },
];

function templateMarkdown(template: IndustryTemplate) {
  return [
    `# Industry Template: ${template.name}`,
    '',
    `## Scope`,
    template.scope,
    '',
    '## Modules',
    ...template.modules.map((item) => `- ${item}`),
    '',
    '## Not core guardrails',
    ...template.notCore.map((item) => `- ${item}`),
    '',
    '## First use',
    template.firstUse,
  ].join('\n');
}

export default function IndustryTemplatesTab() {
  useLocalStorageVersion();
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const [query, setQuery] = useState('');
  const notes = readLocalStorageValue<KnowledgeNote[]>(KNOWLEDGE_KEY, []);
  const selected = templates.find((template) => template.id === selectedId) || templates[0];
  const visibleTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return templates;
    return templates.filter((template) => [template.name, template.scope, ...template.modules].join(' ').toLowerCase().includes(normalized));
  }, [query]);

  const copyBlueprint = async () => {
    await navigator.clipboard.writeText(templateMarkdown(selected));
    appendAgentOpsAudit('INDUSTRY_TEMPLATE_COPIED', selected.id, selected.name);
  };

  const pushToKnowledge = () => {
    const now = new Date().toISOString();
    const note: KnowledgeNote = {
      id: `knowledge-template-${selected.id}-${Date.now()}`,
      title: `Industry Template: ${selected.name}`,
      source: 'Process SOP',
      trust: 'Needs Review',
      body: templateMarkdown(selected),
      tags: ['industry-template', selected.id],
      createdAt: now,
      updatedAt: now,
    };
    appendLocalStorageArrayItem(KNOWLEDGE_KEY, note, 200);
    appendAgentOpsAudit('INDUSTRY_TEMPLATE_TO_KNOWLEDGE', note.id, selected.name);
  };

  return (
    <section className="rounded-3xl border border-violet-400/30 bg-violet-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Company OS architecture</p>
          <h3 className="mt-1 text-xl font-black text-white">Industry Templates</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Tách lõi Company OS khỏi template ngành. Xây dựng/kế toán công trình là template bật thêm, không phải toàn bộ app.</p>
        </div>
        <span className="rounded-full border border-violet-300/40 px-3 py-1 text-xs font-black text-violet-100">{notes.length} knowledge notes</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Core lanes không phụ thuộc ngành</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {coreLanes.map((lane) => <span key={lane} className="rounded-full border border-slate-700 px-3 py-1 text-[11px] font-black text-slate-300">{lane}</span>)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Template search</p>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm template/module" className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-violet-300" />
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleTemplates.map((template) => <button key={template.id} onClick={() => setSelectedId(template.id)} className={`rounded-xl border px-3 py-2 text-[11px] font-black ${selected.id === template.id ? 'border-violet-300 text-violet-100' : 'border-slate-700 text-slate-300'}`}>{template.name}</button>)}
          </div>
        </div>
      </div>

      <article className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-black text-white">{selected.name}</p>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">{selected.scope}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyBlueprint} className="rounded-xl border border-violet-300/50 px-3 py-2 text-xs font-black text-violet-100 hover:bg-violet-400/10">Copy blueprint</button>
            <button onClick={pushToKnowledge} className="rounded-xl border border-emerald-300/50 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-400/10">To Knowledge</button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-200">Modules</p>
            <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-300">
              {selected.modules.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">Not core</p>
            <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-slate-300">
              {selected.notCore.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">First use</p>
            <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{selected.firstUse}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
