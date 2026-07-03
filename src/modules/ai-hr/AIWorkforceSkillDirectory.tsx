import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Gauge,
  Lock,
  RefreshCw,
  ShieldCheck,
  Workflow,
  Zap,
  Play,
  X,
  Terminal
} from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';
import AIWorkforceSkillInvocationPlanner from './AIWorkforceSkillInvocationPlanner';

type SkillDomain = 'agent' | 'robot' | 'automation' | 'plugin' | 'governance' | string;
type SkillRisk = 'low' | 'medium' | 'high' | 'blocked' | string;

type OpenClawSkill = {
  id?: string;
  name?: string;
  domain?: SkillDomain;
  command?: string;
  mode?: string;
  risk?: SkillRisk;
  requiresApproval?: boolean;
  description?: string;
  source?: string;
  tags?: string[];
};

type SkillSummary = {
  total?: number;
  blocked?: number;
  approvalRequired?: number;
  byDomain?: Record<string, number>;
};

function readArray<T>(value: unknown, key: string): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

function readSummary(value: unknown): SkillSummary {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const summary = record.summary;
    if (summary && typeof summary === 'object') return summary as SkillSummary;
  }
  return {};
}

function riskClass(risk?: string) {
  if (risk === 'low') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
  if (risk === 'medium') return 'border-amber-500/25 bg-amber-500/10 text-amber-200';
  if (risk === 'high') return 'border-orange-500/25 bg-orange-500/10 text-orange-200';
  if (risk === 'blocked') return 'border-rose-500/25 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

function domainIcon(domain?: string) {
  if (domain === 'robot') return <Bot className="h-4 w-4" />;
  if (domain === 'automation') return <Workflow className="h-4 w-4" />;
  if (domain === 'governance') return <ShieldCheck className="h-4 w-4" />;
  if (domain === 'plugin') return <Zap className="h-4 w-4" />;
  return <BrainCircuit className="h-4 w-4" />;
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : 'Cannot load LedgerFlow AI skill directory.';
}

export default function AIWorkforceSkillDirectory() {
  const [skills, setSkills] = useState<OpenClawSkill[]>([]);
  const [summary, setSummary] = useState<SkillSummary>({});
  const [domain, setDomain] = useState<'all' | SkillDomain>('all');
  const [includeBlocked, setIncludeBlocked] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Interactive planning modal state
  const [activePlanningSkillId, setActivePlanningSkillId] = useState<string | null>(null);

  const load = async () => {
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams();
      if (domain !== 'all') params.set('domain', domain);
      if (includeBlocked) params.set('includeBlocked', 'true');
      const result = await daemonFetch<unknown>(`/api/openclaw-skills?${params.toString()}`, undefined, 10000);
      setSkills(readArray<OpenClawSkill>(result, 'skills'));
      setSummary(readSummary(result));
    } catch (err: unknown) {
      setError(`${errorText(err)} Ensure the AI daemon is running (npm run dev).`);
      setSkills([]); setSummary({});
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, [domain, includeBlocked]);

  const totals = useMemo(() => {
    const filtered = skills;
    return {
      total: filtered.length,
      blocked: filtered.filter((skill) => skill.risk === 'blocked').length,
      approval: filtered.filter((skill) => skill.requiresApproval).length,
      high: filtered.filter((skill) => skill.risk === 'high').length,
    };
  }, [skills]);

  const domains = useMemo(() => ['all', 'agent', 'robot', 'automation', 'governance', 'plugin'], []);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><BrainCircuit className="mr-2 inline h-4 w-4" />LedgerFlow AI Skill Directory</p>
        <h3 className="mt-2 text-lg font-black text-white">Unified agent, robot, automation and governance skills</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Khám phá danh bạ skill/capability của hệ thống AI. Bấm "Plan & Preview" tại card để chạy thử giả lập.</p>
      </div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60 transition-all"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}

    <div className="mb-4 grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><BrainCircuit className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-slate-500">Visible skills</p><p className="mt-1 text-2xl font-black text-white">{totals.total}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Gauge className="mb-2 h-4 w-4 text-orange-300" /><p className="text-[10px] font-black uppercase text-slate-500">High risk</p><p className="mt-1 text-2xl font-black text-white">{totals.high}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><Lock className="mb-2 h-4 w-4 text-rose-300" /><p className="text-[10px] font-black uppercase text-slate-500">Blocked</p><p className="mt-1 text-2xl font-black text-white">{totals.blocked}</p></div>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" /><p className="text-[10px] font-black uppercase text-slate-500">Needs approval</p><p className="mt-1 text-2xl font-black text-white">{totals.approval}</p></div>
    </div>

    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
      {domains.map((item) => <button key={item} onClick={() => setDomain(item)} className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase transition-all ${domain === item ? 'border-cyan-400 bg-cyan-400/10 text-cyan-100' : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600'}`}>{item}</button>)}
      <button onClick={() => setIncludeBlocked((value) => !value)} className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase transition-all ${includeBlocked ? 'border-rose-400/40 bg-rose-400/10 text-rose-100' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>{includeBlocked ? 'show blocked' : 'hide blocked'}</button>
      <span className="ml-auto text-[11px] font-semibold text-slate-500">Registry total: {summary.total || 0} • approval: {summary.approvalRequired || 0}</span>
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      {skills.map((skill, index) => <div key={skill.id || index} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between group hover:border-slate-700 transition-all">
        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-cyan-200">{domainIcon(skill.domain)}{skill.domain || 'skill'}</span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${riskClass(skill.risk)}`}>{skill.risk || 'risk'}</span>
              {skill.requiresApproval && <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">approval</span>}
            </div>
            <ShieldCheck className="h-5 w-5 text-cyan-300" />
          </div>
          <p className="mt-3 text-sm font-black text-white">{skill.name || skill.id || `Skill ${index + 1}`}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">{skill.id || 'no id'} • {skill.mode || 'mode'} • {skill.source || 'source'}</p>
          <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">{skill.description || 'No description available.'}</p>
          {skill.command && <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-bold text-slate-400">Command: <span className="text-cyan-200">{skill.command}</span></p>}
          {Array.isArray(skill.tags) && skill.tags.length > 0 && <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{skill.tags.join(' • ')}</p>}
        </div>

        <div className="mt-4 border-t border-slate-900 pt-3 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase">OpenClaw Parity</span>
          {skill.id && (
            <button
              onClick={() => setActivePlanningSkillId(skill.id || null)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 px-3 py-1.5 text-[10px] font-black uppercase text-cyan-100 hover:bg-cyan-900/40 transition-all"
            >
              <Play className="h-3 w-3" /> Plan & Preview
            </button>
          )}
        </div>
      </div>)}
      {skills.length === 0 && <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 lg:col-span-2">
        <p className="text-sm font-black text-white"><AlertTriangle className="mr-2 inline h-4 w-4 text-amber-300" />No skills loaded</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Ensure the AI daemon is running. Start with: npm run dev.</p>
      </div>}
    </div>

    {/* Dynamic Invocation Planner Modal */}
    {activePlanningSkillId && (
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col justify-between">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="h-5 w-5 text-cyan-400 animate-pulse" />
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Dynamic Skill Invocation Planner</h2>
                <p className="text-[10px] font-bold text-slate-500">Giả lập chính sách thực thi & Dry-run cho: {activePlanningSkillId}</p>
              </div>
            </div>
            <button
              onClick={() => setActivePlanningSkillId(null)}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-400 hover:text-white transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-950/20">
            <AIWorkforceSkillInvocationPlanner preselectedSkillId={activePlanningSkillId} hideHeader={true} />
          </div>

          <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex justify-end text-xs font-semibold text-slate-500">
            <span>Bảo vệ bởi LedgerFlow Shield Gate v3.1</span>
          </div>
        </div>
      </div>
    )}
  </section>;
}
