import { useState } from 'react';
import type { AgentSkill } from '../../../types/agentOps';
import { readLocalStorageArray } from '../storage';

const SKILL_KEYS = ['ledgerflow_agent_skill_registry_v1', 'ledgerflow-agent-skill-registry-v1'];

function readSkills(): AgentSkill[] {
  return readLocalStorageArray<AgentSkill>(SKILL_KEYS);
}

function saveSkills(skills: AgentSkill[]) {
  localStorage.setItem(SKILL_KEYS[0], JSON.stringify(skills));
  window.dispatchEvent(new CustomEvent('ledgerflow-agent-skills-updated'));
}

export default function SkillsTab() {
  const [skills, setSkills] = useState<AgentSkill[]>(() => readSkills());
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');

  const createSkill = () => {
    if (!name.trim()) return;
    const skill: AgentSkill = {
      id: `skill-${Date.now()}`,
      name: name.trim(),
      category: 'Ops',
      owner: 'AI Agent',
      status: 'Draft',
      risk: 'MEDIUM',
      purpose: purpose.trim() || 'New skill created from AgentOpsHub.',
      systemPrompt: purpose.trim() || 'Follow founder scope and keep outputs reviewable.',
      checklist: [],
      allowedTools: [],
      blockedTools: [],
      outputFormat: 'Checklist, risk note, next action.',
      updatedAt: new Date().toLocaleString('vi-VN')
    };
    const next = [skill, ...skills];
    setSkills(next);
    saveSkills(next);
    setName('');
    setPurpose('');
  };

  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Skill registry</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent Skills</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Giữ registry skill là tab riêng nhưng dùng type chung AgentSkill và đọc key registry cũ.</p>
      <div className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-3">
        <p className="text-sm font-black text-white">Tạo skill mới</p>
        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1.4fr_auto]">
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Tên skill" value={name} onChange={(event) => setName(event.target.value)} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Mục đích" value={purpose} onChange={(event) => setPurpose(event.target.value)} />
          <button onClick={createSkill} className="rounded-2xl bg-indigo-300 px-4 py-2 text-xs font-black text-slate-950">Lưu skill</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => <article key={skill.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{skill.name || 'Legacy skill'}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{skill.category || 'Ops'} · {skill.owner || 'AI Agent'} · {skill.risk || 'MEDIUM'}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{skill.purpose || 'Imported from legacy skill registry storage.'}</p></article>)}
        {skills.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có skill trong localStorage.</p>}
      </div>
    </section>
  );
}
