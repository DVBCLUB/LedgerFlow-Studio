import { useEffect, useMemo, useState } from 'react';
import { AI_AGENT_TASK_TEMPLATES } from '../../../data/founderCompanyEnhancements';

const PROMPT_PACK_KEY = 'ledgerflow_prompt_pack_v1';
const AUDIT_KEY = 'ledgerflow_aiops_audit_v1';

type PromptPackItem = {
  id: string;
  role: string;
  title: string;
  prompt: string;
  acceptance: string[];
  version: string;
  source: 'Seed' | 'Custom';
  updatedAt: string;
};

type AuditEntry = { id: string; at: string; action: string; cardId: string; detail: string };

const roleOptions = ['AI Chief of Staff', 'AI Product Manager', 'AI Fullstack Dev', 'AI Auditor', 'AI Marketer', 'AI Dev', 'AI QA', 'AI Data Analyst'];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedPrompts(): PromptPackItem[] {
  return AI_AGENT_TASK_TEMPLATES.map((item, index) => ({
    id: `seed-${index + 1}`,
    role: item.agent,
    title: item.task,
    prompt: item.prompt,
    acceptance: item.acceptance,
    version: 'v1.0.0',
    source: 'Seed',
    updatedAt: 'seed'
  }));
}

function buildPromptText(item: PromptPackItem) {
  return `Vai trò: ${item.role}\nViệc cần làm: ${item.title}\n\nPrompt:\n${item.prompt}\n\nAcceptance criteria:\n${item.acceptance.map((x) => `- ${x}`).join('\n')}\n\nGuardrails:\n- Founder là người duyệt cuối.\n- Không tự thực hiện hành động external/rủi ro nếu chưa qua Approval Gate.\n- Không hardcode API key/secret.\n- Giữ app là learning/R&D/simulation + Company OS, không định vị như ERP kế toán thật.`;
}

export default function PromptPackTab() {
  const [customItems, setCustomItems] = useState<PromptPackItem[]>(() => readLocal(PROMPT_PACK_KEY, []));
  const [role, setRole] = useState(roleOptions[0]);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [acceptance, setAcceptance] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => writeLocal(PROMPT_PACK_KEY, customItems), [customItems]);

  const prompts = useMemo(() => [...seedPrompts(), ...customItems], [customItems]);
  const filtered = filterRole === 'All' ? prompts : prompts.filter((item) => item.role === filterRole);
  const roles = ['All', ...Array.from(new Set(prompts.map((item) => item.role)))];

  const pushAudit = (action: string, detail: string) => {
    const current = readLocal<AuditEntry[]>(AUDIT_KEY, []);
    writeLocal(AUDIT_KEY, [{ id: `audit-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), action, cardId: 'prompt-pack', detail }, ...current].slice(0, 120));
  };

  const addPrompt = () => {
    if (!title.trim() || !prompt.trim()) return;
    const item: PromptPackItem = {
      id: `prompt-${Date.now()}`,
      role,
      title: title.trim(),
      prompt: prompt.trim(),
      acceptance: acceptance.split('\n').map((x) => x.trim()).filter(Boolean),
      version: 'v1.0.0',
      source: 'Custom',
      updatedAt: new Date().toLocaleString('vi-VN')
    };
    setCustomItems((current) => [item, ...current]);
    pushAudit('PROMPT_PACK_CREATED', `${item.role}: ${item.title}`);
    setTitle('');
    setPrompt('');
    setAcceptance('');
  };

  const copyPrompt = async (item: PromptPackItem) => {
    await navigator.clipboard.writeText(buildPromptText(item));
    setCopied(item.id);
    pushAudit('PROMPT_PACK_COPIED', `${item.role}: ${item.title}`);
    setTimeout(() => setCopied(null), 1200);
  };

  const exportJson = async () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), prompts }, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopied('export');
    pushAudit('PROMPT_PACK_EXPORTED', `Exported ${prompts.length} prompts to clipboard JSON.`);
    setTimeout(() => setCopied(null), 1200);
  };

  const deletePrompt = (id: string) => {
    setCustomItems((current) => current.filter((item) => item.id !== id));
    pushAudit('PROMPT_PACK_DELETED', `Deleted custom prompt ${id}.`);
  };

  return (
    <section className="rounded-3xl border border-emerald-400/35 bg-emerald-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200">Versioned prompt library · localStorage first</p>
          <h3 className="mt-1 text-xl font-black text-white">Prompt Pack Library</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Kho prompt cho AI nhân sự. Copy sang ChatGPT/Claude/Gemini/Copilot mà vẫn giữ guardrail approval-first.</p>
        </div>
        <button onClick={exportJson} className="rounded-2xl border border-emerald-300/40 px-4 py-2 text-xs font-black text-emerald-100">{copied === 'export' ? 'Đã copy JSON' : `Export ${prompts.length} prompts`}</button>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Thêm prompt custom</p>
          <div className="mt-3 space-y-2">
            <select value={role} onChange={(event) => setRole(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {roleOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên prompt / nhiệm vụ" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Nội dung prompt" className="min-h-[110px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <textarea value={acceptance} onChange={(event) => setAcceptance(event.target.value)} placeholder="Acceptance criteria, mỗi dòng 1 tiêu chí" className="min-h-[90px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" />
            <button onClick={addPrompt} className="w-full rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Lưu vào Prompt Pack</button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-sm font-black text-white">Guardrails mặc định</p>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {['Founder duyệt cuối', 'Medium/High risk qua Approval Gate', 'Không hardcode secret', 'Không định vị như ERP kế toán thật', 'Output có acceptance criteria', 'Có audit trail khi copy/export'].map((item) => <p key={item} className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-xs font-bold leading-5 text-slate-300">• {item}</p>)}
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-[10px] font-black uppercase text-slate-500">Lọc theo vai trò</span>
            <select value={filterRole} onChange={(event) => setFilterRole(event.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {roles.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((item) => (
          <article key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-300">{item.role} · {item.version}</p>
                <h4 className="mt-1 text-sm font-black text-white">{item.title}</h4>
                <p className="mt-1 text-[10px] font-bold text-slate-500">{item.source} · {item.updatedAt}</p>
              </div>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{item.acceptance.length} checks</span>
            </div>
            <p className="mt-3 line-clamp-4 text-xs font-semibold leading-5 text-slate-300">{item.prompt}</p>
            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <p className="text-[10px] font-black uppercase text-slate-500">Acceptance</p>
              {item.acceptance.slice(0, 4).map((check) => <p key={check} className="mt-1 text-xs font-semibold leading-5 text-slate-400">• {check}</p>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => copyPrompt(item)} className="rounded-xl border border-emerald-300/40 px-3 py-2 text-[11px] font-black text-emerald-100">{copied === item.id ? 'Đã copy' : 'Copy prompt'}</button>
              {item.source === 'Custom' && <button onClick={() => deletePrompt(item.id)} className="rounded-xl border border-rose-300/30 px-3 py-2 text-[11px] font-black text-rose-100">Xóa custom</button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
