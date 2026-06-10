import React, { useMemo, useState } from 'react';

type PathStatus = 'Draft' | 'Active' | 'Completed' | 'Paused';
type LearnerRole = 'Founder' | 'Accountant' | 'Auditor' | 'Developer with AI' | 'Business Owner';
type Industry = 'Multi-industry' | 'Thương mại' | 'Sản xuất' | 'Dịch vụ' | 'Xây dựng / Dự án';

type LearningPath = {
  id: string;
  title: string;
  learnerRole: LearnerRole;
  industry: Industry;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  objective: string;
  modules: string;
  practiceTasks: string;
  evidenceRequired: string;
  status: PathStatus;
  progress: number;
  nextAction: string;
};

const STORAGE_KEY = 'ledgerflow-learning-path-builder-v1';

const defaultPaths: LearningPath[] = [
  {
    id: 'lp-audit-red-flag-foundation',
    title: 'Audit Red Flag Foundation',
    learnerRole: 'Accountant',
    industry: 'Multi-industry',
    level: 'Beginner',
    objective: 'Nhận diện red flags kế toán/kiểm toán qua case thương mại, sản xuất, dịch vụ và xây dựng.',
    modules: 'Case Bank → Audit Game → One-Page Report',
    practiceTasks: 'Chơi tối thiểu 5 case Audit Game, ghi lại 3 red flags hay bỏ sót nhất.',
    evidenceRequired: 'Ảnh/chú thích điểm game, decision log học được, next action cải thiện.',
    status: 'Active',
    progress: 35,
    nextAction: 'Hoàn thành 2 case High Risk trong Audit Game.'
  },
  {
    id: 'lp-founder-commercialization',
    title: 'Founder Commercialization Sprint',
    learnerRole: 'Founder',
    industry: 'Multi-industry',
    level: 'Intermediate',
    objective: 'Biến một ý tưởng phần mềm thành pilot offer có pricing, moat, paid signal và launch checklist.',
    modules: 'Persona Interview → Lead Board → Pricing Offer → Moat Tracker → MoR Readiness',
    practiceTasks: 'Tạo 3 interview, 3 lead, 1 offer, 1 moat và hoàn thiện MoR checklist trên 60 điểm.',
    evidenceRequired: 'Paid signal hoặc demo feedback thật; One-Page Report tháng có quyết định BUILD/HOLD/KILL.',
    status: 'Draft',
    progress: 10,
    nextAction: 'Chọn 1 buyer persona và viết 5 câu hỏi phỏng vấn.'
  },
  {
    id: 'lp-ai-dev-ops',
    title: 'AI-assisted Dev Ops Control',
    learnerRole: 'Developer with AI',
    industry: 'Multi-industry',
    level: 'Intermediate',
    objective: 'Biết giao việc cho AI, kiểm output, chạy release guard và không phá simulation/model.',
    modules: 'AI Staff Board → Weekly Actions → Release Guard → Backup / Restore',
    practiceTasks: 'Tạo 5 task AI staff, 1 weekly plan, chạy checklist release trước khi merge.',
    evidenceRequired: 'Task có input/output/acceptance criteria rõ; không có lab mất backup key.',
    status: 'Active',
    progress: 45,
    nextAction: 'Tạo 1 task cho Claude/Codex refactor nhỏ và ghi review.'
  }
];

const readPaths = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultPaths;
    return Array.isArray(parsed) ? parsed : defaultPaths;
  } catch {
    return defaultPaths;
  }
};

const savePaths = (paths: LearningPath[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));

const scorePath = (path: LearningPath) => {
  const statusBonus = path.status === 'Completed' ? 25 : path.status === 'Active' ? 15 : path.status === 'Paused' ? -5 : 0;
  const evidenceBonus = path.evidenceRequired.trim().length > 30 ? 15 : 0;
  const practiceBonus = path.practiceTasks.trim().length > 30 ? 15 : 0;
  return Math.max(0, Math.min(100, Math.round(path.progress * 0.55 + statusBonus + evidenceBonus + practiceBonus)));
};

export default function LearningPathBuilder() {
  const [paths, setPaths] = useState<LearningPath[]>(readPaths);
  const [draft, setDraft] = useState<LearningPath>({
    id: `lp-${Date.now()}`,
    title: '',
    learnerRole: 'Founder',
    industry: 'Multi-industry',
    level: 'Beginner',
    objective: '',
    modules: 'Case Bank → Audit Game → Simulation → One-Page Report',
    practiceTasks: '',
    evidenceRequired: '',
    status: 'Draft',
    progress: 0,
    nextAction: ''
  });

  const summary = useMemo(() => {
    const active = paths.filter((path) => path.status === 'Active').length;
    const completed = paths.filter((path) => path.status === 'Completed').length;
    const avgProgress = paths.length ? Math.round(paths.reduce((sum, path) => sum + Number(path.progress || 0), 0) / paths.length) : 0;
    const avgScore = paths.length ? Math.round(paths.reduce((sum, path) => sum + scorePath(path), 0) / paths.length) : 0;
    return { active, completed, avgProgress, avgScore };
  }, [paths]);

  const addPath = () => {
    if (!draft.title.trim()) return;
    const next = [{ ...draft, id: `lp-${Date.now()}` }, ...paths];
    setPaths(next);
    savePaths(next);
    setDraft({ ...draft, id: `lp-${Date.now()}`, title: '', objective: '', practiceTasks: '', evidenceRequired: '', nextAction: '', progress: 0, status: 'Draft' });
  };

  const updatePath = (id: string, patch: Partial<LearningPath>) => {
    const next = paths.map((path) => path.id === id ? { ...path, ...patch } : path);
    setPaths(next);
    savePaths(next);
  };

  const removePath = (id: string) => {
    const next = paths.filter((path) => path.id !== id);
    setPaths(next);
    savePaths(next);
  };

  return (
    <section className="space-y-4 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Learning Path Builder</p>
        <h2 className="mt-2 text-xl font-black text-white">Lộ trình học theo vai trò và ngành</h2>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-400">
          Nối Case Bank, Audit Game, Simulation, AI Staff và Founder Labs thành lộ trình học có mục tiêu, bài tập, bằng chứng và tiến độ.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Paths</p><p className="mt-2 text-3xl font-black text-white">{paths.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Active</p><p className="mt-2 text-3xl font-black text-cyan-300">{summary.active}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Completed</p><p className="mt-2 text-3xl font-black text-emerald-300">{summary.completed}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-[10px] font-black uppercase text-slate-500">Learning score</p><p className="mt-2 text-3xl font-black text-amber-300">{summary.avgScore}/100</p></div>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <h3 className="text-sm font-black text-white">Tạo lộ trình mới</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Tên lộ trình" className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white" />
          <select value={draft.learnerRole} onChange={(event) => setDraft({ ...draft, learnerRole: event.target.value as LearnerRole })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white">
            <option>Founder</option><option>Accountant</option><option>Auditor</option><option>Developer with AI</option><option>Business Owner</option>
          </select>
          <select value={draft.industry} onChange={(event) => setDraft({ ...draft, industry: event.target.value as Industry })} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-bold text-white">
            <option>Multi-industry</option><option>Thương mại</option><option>Sản xuất</option><option>Dịch vụ</option><option>Xây dựng / Dự án</option>
          </select>
          <textarea value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} placeholder="Mục tiêu học" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-semibold text-white md:col-span-3" />
          <textarea value={draft.practiceTasks} onChange={(event) => setDraft({ ...draft, practiceTasks: event.target.value })} placeholder="Bài tập thực hành" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-semibold text-white" />
          <textarea value={draft.evidenceRequired} onChange={(event) => setDraft({ ...draft, evidenceRequired: event.target.value })} placeholder="Bằng chứng phải nộp" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-semibold text-white" />
          <textarea value={draft.nextAction} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} placeholder="Next action" className="min-h-24 rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm font-semibold text-white" />
        </div>
        <button onClick={addPath} className="mt-4 rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 hover:bg-emerald-300">Thêm learning path</button>
      </div>

      <div className="space-y-3">
        {paths.map((path) => {
          const score = scorePath(path);
          return (
            <div key={path.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase text-cyan-300">{path.learnerRole} • {path.industry} • {path.level}</p>
                  <h3 className="mt-1 text-base font-black text-white">{path.title}</h3>
                  <p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{path.objective}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-500">Path score</p>
                  <p className="text-2xl font-black text-amber-300">{score}/100</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <label className="text-[10px] font-black uppercase text-slate-500">Status<select value={path.status} onChange={(event) => updatePath(path.id, { status: event.target.value as PathStatus })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-white"><option>Draft</option><option>Active</option><option>Completed</option><option>Paused</option></select></label>
                <label className="text-[10px] font-black uppercase text-slate-500">Progress %<input type="number" value={path.progress} min={0} max={100} onChange={(event) => updatePath(path.id, { progress: Number(event.target.value) })} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs normal-case text-white" /></label>
                <button onClick={() => removePath(path.id)} className="self-end rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-black text-rose-200 hover:bg-rose-500/10">Xóa</button>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Modules</p><p className="mt-1 text-xs font-semibold leading-6 text-slate-300">{path.modules}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Practice</p><p className="mt-1 text-xs font-semibold leading-6 text-slate-300">{path.practiceTasks}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Evidence</p><p className="mt-1 text-xs font-semibold leading-6 text-slate-300">{path.evidenceRequired}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">Next action</p><p className="mt-1 text-xs font-semibold leading-6 text-slate-300">{path.nextAction}</p></div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
