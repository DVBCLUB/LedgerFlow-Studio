import type { AgentSkill } from '../../../types/agentOps';
import { readLocalStorageArray } from '../storage';

const SKILL_KEYS = ['ledgerflow_agent_skill_registry_v1', 'ledgerflow-agent-skill-registry-v1'];

function readSkills(): AgentSkill[] {
  return readLocalStorageArray<AgentSkill>(SKILL_KEYS);
}

export default function SkillsTab() {
  const skills = readSkills();
  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Skill registry</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent Skills</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Giữ registry skill là tab riêng nhưng dùng type chung AgentSkill và đọc key registry cũ.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {skills.map((skill) => <article key={skill.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{skill.name}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{skill.category} · {skill.owner} · {skill.risk}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{skill.purpose}</p></article>)}
        {skills.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có skill trong localStorage.</p>}
      </div>
    </section>
  );
}
