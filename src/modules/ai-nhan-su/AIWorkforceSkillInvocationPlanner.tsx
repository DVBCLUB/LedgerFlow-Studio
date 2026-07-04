import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gauge, Lock, PlayCircle, RefreshCw, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';
import { daemonFetch } from '../../utils/assistantApi';

type OpenClawSkill = {
  id?: string;
  name?: string;
  domain?: string;
  mode?: string;
  risk?: string;
  requiresApproval?: boolean;
  description?: string;
  command?: string;
};

type InvocationDecision = {
  ok?: boolean;
  mode?: 'dry_run' | 'pending_approval' | 'blocked' | string;
  reason?: string;
  nextStep?: string;
  skill?: OpenClawSkill | null;
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

function readDecision(value: unknown): InvocationDecision | null {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const decision = record.decision;
    if (decision && typeof decision === 'object') return decision as InvocationDecision;
  }
  return null;
}

function decisionClass(mode?: string) {
  if (mode === 'dry_run') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
  if (mode === 'pending_approval') return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
  if (mode === 'blocked') return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
  return 'border-border-primary bg-bg-primary text-text-secondary';
}

function iconForMode(mode?: string) {
  if (mode === 'dry_run') return <CheckCircle2 className="h-4 w-4" />;
  if (mode === 'pending_approval') return <ShieldAlert className="h-4 w-4" />;
  if (mode === 'blocked') return <Lock className="h-4 w-4" />;
  return <Gauge className="h-4 w-4" />;
}

function errorText(err: unknown) {
  return err instanceof Error ? err.message : 'Cannot plan skill invocation.';
}

interface AIWorkforceSkillInvocationPlannerProps {
  preselectedSkillId?: string;
  hideHeader?: boolean;
}

export default function AIWorkforceSkillInvocationPlanner({ preselectedSkillId, hideHeader = false }: AIWorkforceSkillInvocationPlannerProps) {
  const [skills, setSkills] = useState<OpenClawSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState(preselectedSkillId || '');
  const [actor, setActor] = useState<'founder' | 'ai-agent' | 'automation' | 'system'>('founder');
  const [payloadText, setPayloadText] = useState('{\n  "dryRun": true\n}');
  const [reason, setReason] = useState('Founder policy preview from AI Workforce UI.');
  const [decision, setDecision] = useState<InvocationDecision | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectedSkill = useMemo(() => skills.find((skill) => skill.id === selectedSkillId), [skills, selectedSkillId]);

  const load = async () => {
    setBusy(true); setError('');
    try {
      const result = await daemonFetch<unknown>('/api/openclaw-skills?includeBlocked=true', undefined, 10000);
      const loaded = readArray<OpenClawSkill>(result, 'skills');
      setSkills(loaded);
      setSelectedSkillId((current) => preselectedSkillId || current || loaded[0]?.id || '');
    } catch (err: unknown) {
      setError(`${errorText(err)} Run npm run ai:openclaw-plus locally to patch daemon routes.`);
      setSkills([]);
    } finally { setBusy(false); }
  };

  useEffect(() => {
    void load();
  }, [preselectedSkillId]);

  const planInvocation = async () => {
    if (!selectedSkillId) {
      setError('Select a skill first.');
      return;
    }
    setBusy(true); setError(''); setDecision(null);
    try {
      let payload: Record<string, unknown> | undefined;
      if (payloadText.trim()) {
        const parsed = JSON.parse(payloadText) as unknown;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Payload must be a JSON object.');
        payload = parsed as Record<string, unknown>;
      }
      const result = await daemonFetch<unknown>(`/api/openclaw-skills/${encodeURIComponent(selectedSkillId)}/plan-invocation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor, reason: reason.trim(), payload }),
      }, 25000);
      const parsedDecision = readDecision(result);
      if (!parsedDecision) throw new Error('Daemon did not return an invocation decision object.');
      setDecision(parsedDecision);
    } catch (err: unknown) {
      setError(errorText(err));
    } finally { setBusy(false); }
  };

  return <section className="rounded-[2rem] border border-border-primary bg-slate-950/55 p-4 text-left text-slate-100">
    {!hideHeader && (
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Terminal className="mr-2 inline h-4 w-4" />Skill Invocation Planner</p>
          <h3 className="mt-2 text-lg font-black text-text-primary">Simulate and evaluate dynamic tool calls</h3>
          <p className="mt-1 text-xs font-semibold leading-5 text-text-tertiary">Giả lập việc gọi kỹ năng/công cụ để kiểm tra phản hồi từ bộ lọc phân quyền và an toàn (dry-run).</p>
        </div>
        <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-border-secondary px-4 py-2 text-xs font-black text-text-secondary hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh</button>
      </div>
    )}

    {error && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}

    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Select skill targeting</label>
          <select value={selectedSkillId} onChange={(event) => setSelectedSkillId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-850 bg-slate-950 px-3 py-2.5 text-xs font-black text-text-primary outline-none focus:border-cyan-400">
            {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name || skill.id} ({skill.domain})</option>)}
          </select>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Actor trigger</label>
            <select value={actor} onChange={(event) => setActor(event.target.value as any)} className="mt-2 w-full rounded-2xl border border-slate-850 bg-slate-950 px-3 py-2 text-xs font-black text-text-primary outline-none focus:border-cyan-400">
              {['founder', 'ai-agent', 'automation', 'system'].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Reason / context</label>
            <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-850 bg-slate-950 px-3 py-2 text-xs font-bold text-text-primary outline-none focus:border-cyan-400" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Payload input (JSON object)</label>
          <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-850 bg-slate-950 p-3 text-xs font-semibold leading-5 text-text-primary outline-none font-mono focus:border-cyan-400" />
        </div>

        <button onClick={() => void planInvocation()} disabled={busy || !selectedSkillId} className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/40 bg-cyan-400/15 px-4 py-2.5 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 disabled:opacity-50"><PlayCircle className="h-4 w-4" />Evaluate Execution Plan</button>
      </div>

      <div className="rounded-3xl border border-slate-850 bg-slate-950/40 p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Invocation decision</p>
        {decision ? <div className="mt-3 space-y-4">
          <div className={`rounded-2xl border p-4 ${decisionClass(decision.mode)}`}>
            <div className="flex items-center gap-2">
              {iconForMode(decision.mode)}
              <span className="text-xs font-black uppercase tracking-wider">{decision.mode || 'unknown'}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5">{decision.reason || 'Decision evaluated by local safety supervisor.'}</p>
          </div>
          {decision.nextStep && <div className="rounded-2xl border border-border-primary bg-bg-primary/60 p-3"><p className="text-[10px] font-black uppercase text-text-tertiary">Next execution step</p><p className="mt-1 text-xs font-bold text-text-secondary font-mono">{decision.nextStep}</p></div>}
          <div className="grid gap-2 sm:grid-cols-2">
            <span className="rounded-xl border border-slate-850 bg-bg-primary px-3 py-2 text-[10px] font-bold text-text-secondary">Requires Approval: {decision.skill?.requiresApproval ? 'YES' : 'NO'}</span>
            <span className="rounded-xl border border-slate-850 bg-bg-primary px-3 py-2 text-[10px] font-bold text-text-secondary">Risk profile: {decision.skill?.risk || 'low'}</span>
          </div>
        </div> : <div className="h-full flex items-center justify-center py-12"><p className="text-xs font-semibold text-text-tertiary italic">Fill input parameters and trigger Evaluation to simulate policy routing.</p></div>}
      </div>
    </div>
  </section>;
}
