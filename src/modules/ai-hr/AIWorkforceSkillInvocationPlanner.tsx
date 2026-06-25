import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Gauge, Lock, PlayCircle, RefreshCw, ShieldAlert, ShieldCheck, TerminalSquare } from 'lucide-react';
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
  return 'border-slate-800 bg-slate-900 text-slate-300';
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

export default function AIWorkforceSkillInvocationPlanner() {
  const [skills, setSkills] = useState<OpenClawSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
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
      setSelectedSkillId((current) => current || loaded[0]?.id || '');
    } catch (err: unknown) {
      setError(`${errorText(err)} Run npm run ai:openclaw-plus locally to patch daemon routes.`);
      setSkills([]);
    } finally { setBusy(false); }
  };

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
        body: JSON.stringify({ actor, payload, reason }),
      }, 15000);
      setDecision(readDecision(result));
    } catch (err: unknown) {
      setError(errorText(err));
    } finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, []);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><TerminalSquare className="mr-2 inline h-4 w-4" />Skill Invocation Planner</p>
        <h3 className="mt-2 text-lg font-black text-white">Plan before execute</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Gọi gateway để biết skill sẽ là dry-run, pending approval hay blocked. Panel này không thực thi side effect.</p>
      </div>
      <button onClick={() => void load()} disabled={busy} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-cyan-300 disabled:opacity-60"><RefreshCw className="mr-2 inline h-4 w-4" />Refresh skills</button>
    </div>

    {error && <p className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-bold text-amber-100"><AlertTriangle className="mr-2 inline h-4 w-4" />{error}</p>}

    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Skill</label>
        <select value={selectedSkillId} onChange={(event) => setSelectedSkillId(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400">
          {skills.map((skill) => <option key={skill.id} value={skill.id}>{skill.id} — {skill.risk}/{skill.mode}</option>)}
        </select>

        {selectedSkill && <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="text-sm font-black text-white">{selectedSkill.name || selectedSkill.id}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{selectedSkill.description || 'No description.'}</p>
          <p className="mt-2 text-[11px] font-bold text-slate-500">Domain: {selectedSkill.domain} • Risk: {selectedSkill.risk} • Approval: {selectedSkill.requiresApproval ? 'required' : 'not required'}</p>
          {selectedSkill.command && <p className="mt-1 text-[11px] font-bold text-cyan-200">Command: {selectedSkill.command}</p>}
        </div>}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Actor</label>
            <select value={actor} onChange={(event) => setActor(event.target.value as typeof actor)} className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400">
              <option value="founder">founder</option>
              <option value="ai-agent">ai-agent</option>
              <option value="automation">automation</option>
              <option value="system">system</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Reason</label>
            <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm font-bold text-white outline-none focus:border-cyan-400" />
          </div>
        </div>

        <label className="mt-4 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Payload JSON</label>
        <textarea value={payloadText} onChange={(event) => setPayloadText(event.target.value)} rows={7} className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs font-bold text-slate-200 outline-none focus:border-cyan-400" />

        <button onClick={() => void planInvocation()} disabled={busy || !selectedSkillId} className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-xs font-black uppercase text-cyan-100 hover:bg-cyan-500/20 disabled:opacity-50"><PlayCircle className="mr-2 inline h-4 w-4" />Plan invocation</button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Gateway decision</p>
        {decision ? <div className={`mt-3 rounded-2xl border p-4 ${decisionClass(decision.mode)}`}>
          <div className="flex items-center gap-2 text-sm font-black uppercase">{iconForMode(decision.mode)}{decision.mode || 'unknown'}</div>
          <p className="mt-3 text-sm font-bold leading-6">{decision.reason || 'No reason.'}</p>
          <p className="mt-3 rounded-xl border border-current/20 bg-black/10 p-3 text-xs font-semibold leading-5">Next: {decision.nextStep || 'No next step.'}</p>
          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] opacity-75">OK: {decision.ok ? 'true' : 'false'}</p>
        </div> : <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm font-black text-white"><ShieldCheck className="mr-2 inline h-4 w-4 text-cyan-300" />No plan yet</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Select a skill and run a policy plan. The gateway audits the request and never executes the underlying skill.</p>
        </div>}
      </div>
    </div>
  </section>;
}
