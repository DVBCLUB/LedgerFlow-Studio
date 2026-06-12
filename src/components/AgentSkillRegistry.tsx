import { useEffect, useMemo, useState } from 'react';

type SkillCategory = 'Code' | 'Audit' | 'Product' | 'Data' | 'Marketing' | 'CI' | 'Ops';
type SkillRisk = 'LOW' | 'MEDIUM' | 'HIGH';
type SkillStatus = 'Draft' | 'Active' | 'Deprecated';

type AgentSkill = {
  id: string;
  name: string;
  category: SkillCategory;
  owner: string;
  status: SkillStatus;
  risk: SkillRisk;
  purpose: string;
  systemPrompt: string;
  checklist: string[];
  allowedTools: string[];
  blockedTools: string[];
  outputFormat: string;
  updatedAt: string;
};

type SkillEvent = {
  id: string;
  at: string;
  skillId: string;
  action: string;
  detail: string;
};

const categories: SkillCategory[] = ['Code', 'Audit', 'Product', 'Data', 'Marketing', 'CI', 'Ops'];
const statuses: SkillStatus[] = ['Draft', 'Active', 'Deprecated'];
const risks: SkillRisk[] = ['LOW', 'MEDIUM', 'HIGH'];

const starterSkills: AgentSkill[] = [
  {
    id: 'skill-code-safe-patch',
    name: 'AI Code - Safe Patch Builder',
    category: 'Code',
    owner: 'AI Code / Dev Agent',
    status: 'Active',
    risk: 'HIGH',
    purpose: 'Tạo patch nhỏ, dễ review, không tự merge, luôn đi qua Sandbox/Diff Review/Review Desk.',
    systemPrompt: 'Bạn là AI Code Agent cho LedgerFlow. Chỉ tạo patch nhỏ, giải thích mục tiêu, nêu file bị sửa, không đụng file nhạy cảm, không tự merge main. Mọi thay đổi phải qua Sandbox, Founder Review và Review Desk.',
    checklist: ['Xác định đúng file', 'Không sửa secret/env', 'Có rollback plan', 'Có test/CI note', 'Không thay đổi scope ngoài yêu cầu'],
    allowedTools: ['Knowledge Context Pack', 'Diff Review', 'Sandbox Patch Workspace', 'Review Desk'],
    blockedTools: ['Direct main push', 'Secret file write', 'Unapproved terminal action'],
    outputFormat: 'Patch summary, file list, risk note, rollback plan, test plan.',
    updatedAt: 'Mặc định'
  },
  {
    id: 'skill-auditor-pr-check',
    name: 'AI Auditor - PR Safety Check',
    category: 'Audit',
    owner: 'AI Auditor',
    status: 'Active',
    risk: 'MEDIUM',
    purpose: 'Kiểm tra PR/diff trước khi Founder duyệt.',
    systemPrompt: 'Bạn là AI Auditor. Kiểm tra scope, risk, file nhạy cảm, secret, rollback, test plan và tác động module. Không viết code mới trừ khi yêu cầu rõ.',
    checklist: ['Scope đúng', 'Diff nhỏ', 'Không lộ secret', 'Có test plan', 'Có rollback plan'],
    allowedTools: ['Founder Review', 'Audit Trail', 'Build Monitor', 'CI Recovery'],
    blockedTools: ['Direct write', 'Merge PR'],
    outputFormat: 'Pass/Fail checklist, rủi ro còn lại, đề xuất sửa tối thiểu.',
    updatedAt: 'Mặc định'
  },
  {
    id: 'skill-ci-doctor',
    name: 'CI Doctor - Failure Triage',
    category: 'CI',
    owner: 'CI Doctor',
    status: 'Active',
    risk: 'MEDIUM',
    purpose: 'Đọc lỗi build/CI, phân loại nguyên nhân và tạo kế hoạch sửa nhỏ nhất.',
    systemPrompt: 'Bạn là CI Doctor. Chỉ phân tích log, chỉ ra lỗi chính, đề xuất patch nhỏ nhất, không đoán quá mức khi thiếu log.',
    checklist: ['Xác định job fail', 'Trích lỗi chính', 'Phân loại lỗi type/build/lint/test', 'Đề xuất patch nhỏ', 'Ghi cách kiểm lại'],
    allowedTools: ['Build Monitor', 'CI Recovery', 'Review Desk'],
    blockedTools: ['Merge PR', 'Write secrets'],
    outputFormat: 'Root cause, affected files, fix plan, verification steps.',
    updatedAt: 'Mặc định'
  }
];

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function splitLines(value: string) {
  return value.split('\n').map((line) => line.trim()).filter(Boolean);
}

function joinLines(value: string[]) {
  return value.join('\n');
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

function riskClass(risk: SkillRisk) {
  if (risk === 'HIGH') return 'border-rose-400/35 bg-rose-400/10 text-rose-200';
  if (risk === 'MEDIUM') return 'border-amber-400/35 bg-amber-400/10 text-amber-200';
  return 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200';
}

export default function AgentSkillRegistry() {
  const [skills, setSkills] = useState<AgentSkill[]>(() => readLocal('ledgerflow_agent_skill_registry_v1', starterSkills));
  const [events, setEvents] = useState<SkillEvent[]>(() => readLocal('ledgerflow_agent_skill_events_v1', []));
  const [selectedId, setSelectedId] = useState(() => skills[0]?.id ?? starterSkills[0].id);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState({
    name: '',
    category: 'Code' as SkillCategory,
    owner: '',
    risk: 'MEDIUM' as SkillRisk,
    purpose: '',
    systemPrompt: '',
    checklist: '',
    allowedTools: '',
    blockedTools: '',
    outputFormat: ''
  });

  useEffect(() => {
    localStorage.setItem('ledgerflow_agent_skill_registry_v1', JSON.stringify(skills));
    window.dispatchEvent(new CustomEvent('ledgerflow-agent-skills-updated'));
  }, [skills]);

  useEffect(() => {
    localStorage.setItem('ledgerflow_agent_skill_events_v1', JSON.stringify(events));
  }, [events]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return skills;
    return skills.filter((skill) => [skill.name, skill.category, skill.owner, skill.purpose, skill.systemPrompt, skill.allowedTools.join(' '), skill.blockedTools.join(' ')].join(' ').toLowerCase().includes(needle));
  }, [query, skills]);

  const selected = useMemo(() => skills.find((skill) => skill.id === selectedId) ?? skills[0], [skills, selectedId]);
  const selectedEvents = events.filter((event) => event.skillId === selected?.id);

  const pushEvent = (skillId: string, action: string, detail: string) => {
    setEvents((current) => [{ id: `skill-event-${Date.now()}`, at: new Date().toLocaleString('vi-VN'), skillId, action, detail }, ...current].slice(0, 120));
  };

  const createSkill = () => {
    if (!draft.name.trim() || !draft.systemPrompt.trim()) return;
    const skill: AgentSkill = {
      id: `skill-${Date.now()}`,
      name: draft.name.trim(),
      category: draft.category,
      owner: draft.owner.trim() || 'AI Agent',
      status: 'Draft',
      risk: draft.risk,
      purpose: draft.purpose.trim(),
      systemPrompt: draft.systemPrompt.trim(),
      checklist: splitLines(draft.checklist),
      allowedTools: splitLines(draft.allowedTools),
      blockedTools: splitLines(draft.blockedTools),
      outputFormat: draft.outputFormat.trim(),
      updatedAt: new Date().toLocaleString('vi-VN')
    };
    setSkills((current) => [skill, ...current]);
    setSelectedId(skill.id);
    pushEvent(skill.id, 'SKILL_CREATED', `Tạo skill ${skill.name}.`);
    setDraft({ name: '', category: draft.category, owner: '', risk: 'MEDIUM', purpose: '', systemPrompt: '', checklist: '', allowedTools: '', blockedTools: '', outputFormat: '' });
  };

  const updateSelected = (patch: Partial<AgentSkill>, action = 'SKILL_UPDATED') => {
    if (!selected) return;
    const next = { ...selected, ...patch, updatedAt: new Date().toLocaleString('vi-VN') };
    setSkills((current) => current.map((skill) => skill.id === selected.id ? next : skill));
    pushEvent(selected.id, action, `Cập nhật ${selected.name}.`);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const clone = { ...selected, id: `skill-${Date.now()}`, name: `${selected.name} Copy`, status: 'Draft' as SkillStatus, updatedAt: new Date().toLocaleString('vi-VN') };
    setSkills((current) => [clone, ...current]);
    setSelectedId(clone.id);
    pushEvent(clone.id, 'SKILL_DUPLICATED', `Nhân bản từ ${selected.name}.`);
  };

  const sendToKnowledge = () => {
    if (!selected) return;
    const existing = readLocal<unknown[]>('ledgerflow_knowledge_library_v1', []);
    const item = {
      id: `knowledge-skill-${selected.id}-${Date.now()}`,
      title: `Agent Skill: ${selected.name}`,
      category: 'AI Ops / Skill Registry',
      source: 'Agent Skill Registry',
      tags: [selected.category, selected.risk, selected.status],
      priority: selected.risk,
      content: `Purpose:\n${selected.purpose}\n\nSystem Prompt:\n${selected.systemPrompt}\n\nChecklist:\n${selected.checklist.join('\n')}\n\nAllowed Tools:\n${selected.allowedTools.join('\n')}\n\nBlocked Tools:\n${selected.blockedTools.join('\n')}\n\nOutput Format:\n${selected.outputFormat}`,
      createdAt: new Date().toLocaleString('vi-VN')
    };
    localStorage.setItem('ledgerflow_knowledge_library_v1', JSON.stringify([item, ...existing]));
    pushEvent(selected.id, 'SENT_TO_KNOWLEDGE', 'Đưa skill sang Knowledge Library.');
    window.dispatchEvent(new CustomEvent('ledgerflow-knowledge-library-updated'));
  };

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Agent skill registry</p>
          <h3 className="mt-1 text-xl font-black text-white">Prompt / Skill Registry</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Quản lý prompt chuẩn cho từng AI agent: code, audit, CI, data, product, marketing và operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportJson('ledgerflow-agent-skills.json', { skills, events })} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-indigo-300">Xuất skills</button>
          <button onClick={sendToKnowledge} disabled={!selected} className="rounded-2xl border border-emerald-400/40 px-4 py-2 text-xs font-black text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-40">Đưa sang Knowledge</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
            <p className="text-sm font-black text-white">Tạo skill mới</p>
            <div className="mt-3 grid gap-2">
              <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên skill" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              <div className="grid gap-2 md:grid-cols-3">
                <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as SkillCategory })}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
                <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.risk} onChange={(event) => setDraft({ ...draft, risk: event.target.value as SkillRisk })}>{risks.map((item) => <option key={item}>{item}</option>)}</select>
                <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Owner" value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} />
              </div>
              <textarea className="min-h-[70px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Purpose" value={draft.purpose} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} />
              <textarea className="min-h-[110px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="System prompt" value={draft.systemPrompt} onChange={(event) => setDraft({ ...draft, systemPrompt: event.target.value })} />
              <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Checklist, mỗi dòng 1 mục" value={draft.checklist} onChange={(event) => setDraft({ ...draft, checklist: event.target.value })} />
              <button onClick={createSkill} className="rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950">Tạo skill</button>
            </div>
          </div>

          <input className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tìm skill..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="space-y-2">
            {filtered.map((skill) => <button key={skill.id} onClick={() => setSelectedId(skill.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected?.id === skill.id ? 'border-indigo-300 bg-indigo-400/10' : 'border-slate-800 bg-slate-950/50 hover:border-indigo-400/40'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{skill.name}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskClass(skill.risk)}`}>{skill.risk}</span>
              </div>
              <p className="mt-1 text-[11px] font-bold text-slate-400">{skill.category} · {skill.owner} · {skill.status}</p>
            </button>)}
          </div>
        </div>

        {selected && <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selected skill</p>
              <h4 className="mt-1 text-lg font-black text-white">{selected.name}</h4>
              <p className="mt-1 text-xs font-bold text-slate-400">{selected.category} · {selected.owner} · cập nhật {selected.updatedAt}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-black text-white" value={selected.status} onChange={(event) => updateSelected({ status: event.target.value as SkillStatus }, 'SKILL_STATUS_CHANGED')}>{statuses.map((item) => <option key={item}>{item}</option>)}</select>
              <button onClick={duplicateSelected} className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black text-slate-300 hover:border-indigo-300">Nhân bản</button>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">Purpose</label>
            <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.purpose} onChange={(event) => updateSelected({ purpose: event.target.value })} />
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">System prompt</label>
            <textarea className="min-h-[150px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.systemPrompt} onChange={(event) => updateSelected({ systemPrompt: event.target.value })} />
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Checklist</label>
                <textarea className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={joinLines(selected.checklist)} onChange={(event) => updateSelected({ checklist: splitLines(event.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Output format</label>
                <textarea className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={selected.outputFormat} onChange={(event) => updateSelected({ outputFormat: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Allowed tools</label>
                <textarea className="mt-2 min-h-[90px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={joinLines(selected.allowedTools)} onChange={(event) => updateSelected({ allowedTools: splitLines(event.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Blocked tools</label>
                <textarea className="mt-2 min-h-[90px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white" value={joinLines(selected.blockedTools)} onChange={(event) => updateSelected({ blockedTools: splitLines(event.target.value) })} />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Skill events</p>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {selectedEvents.map((event) => <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-2">
                <p className="text-[10px] font-black text-indigo-200">{event.action}</p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">{event.detail}</p>
                <p className="mt-1 text-[10px] font-bold text-slate-600">{event.at}</p>
              </div>)}
              {selectedEvents.length === 0 && <p className="text-xs font-semibold text-slate-500">Chưa có event.</p>}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
}
