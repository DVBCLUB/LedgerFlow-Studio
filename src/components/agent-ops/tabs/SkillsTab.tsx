import type { AgentSkill } from '../../../types/agentOps';

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function SkillsTab() {
  const skills = readLocal<AgentSkill[]>('ledgerflow_agent_skill_registry_v1', []);
  return (
    <section className="rounded-3xl border border-indigo-400/35 bg-indigo-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">Skill registry</p>
      <h3 className="mt-1 text-xl font-black text-white">Agent Skills</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Đọc lại registry cũ bằng type chung.</p>
      <div className="mt-4 grid gap-2">
        {skills.map((skill) => <div key={skill.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{skill.name}</p><p className="mt-1 text-xs font-semibold text-slate-400">{skill.owner} · {skill.category} · {skill.status} · {skill.risk}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{skill.purpose}</p></div>)}
        {skills.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-400">Chưa có skill lưu trong localStorage.</p>}
      </div>
    </section>
  );
}
