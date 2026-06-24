import { AlertTriangle, CheckCircle2, ClipboardList, FileDiff, Lock, RotateCcw, ShieldCheck } from 'lucide-react';

const checks = [
  'Backend patch-review routes are wired by running node scripts/patch-ai-workforce-local.mjs locally.',
  'A backend patch review session exists for the runtime run.',
  'The manifest path stays inside .agent_sandbox and the workspace root.',
  'Target files are listed before any write action is considered.',
  'Session status is reviewed and explicitly approved before guarded file operations.',
  'safeFileManager backup is used for every changed file.',
  'Rollback path is confirmed before the session is considered complete.',
];

const commands = [
  'git pull origin main',
  'node scripts/patch-ai-workforce-local.mjs',
  'npm run check:agent-tool-ids',
  'npm run check:telegram-missions',
  'npm run check:patch-review-sessions',
  'npm run lint',
  'npm run build',
];

export default function AIWorkforcePatchSafetyRunbook() {
  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><FileDiff className="mr-2 inline h-4 w-4" />Patch Safety Runbook</p>
      <h3 className="mt-2 text-lg font-black text-white">Founder-reviewed patch workflow</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Runbook này giữ thao tác file ở backend guard, còn UI tập trung vào review, session state, manifest và rollback readiness.</p>
    </div>

    <div className="grid gap-3 lg:grid-cols-3">
      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4">
        <ShieldCheck className="mb-2 h-5 w-5 text-cyan-200" />
        <p className="text-sm font-black text-white">1. Review session</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-cyan-100">Create a backend patch-review session from the runtime run, then inspect manifest, target files and risk notes.</p>
      </div>
      <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4">
        <Lock className="mb-2 h-5 w-5 text-emerald-200" />
        <p className="text-sm font-black text-white">2. Guarded approval</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-emerald-100">Only reviewed sessions should move to an approved state. Backend still requires explicit confirmation for file-changing actions.</p>
      </div>
      <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-4">
        <RotateCcw className="mb-2 h-5 w-5 text-violet-200" />
        <p className="text-sm font-black text-white">3. Rollback readiness</p>
        <p className="mt-2 text-xs font-semibold leading-5 text-violet-100">Every completed file change must have safeFileManager backup metadata and a verified rollback path.</p>
      </div>
    </div>

    <div className="mt-4 grid gap-3 xl:grid-cols-2">
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500"><ClipboardList className="mr-1 inline h-4 w-4" />Safety checklist</p>
        <div className="space-y-2">
          {checks.map((check) => <p key={check} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-2 text-xs font-bold leading-5 text-slate-300"><CheckCircle2 className="mr-2 inline h-4 w-4 text-emerald-300" />{check}</p>)}
        </div>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500"><AlertTriangle className="mr-1 inline h-4 w-4" />Local validation commands</p>
        <div className="space-y-2">
          {commands.map((command) => <code key={command} className="block rounded-2xl border border-slate-800 bg-slate-900/80 p-2 text-xs font-bold text-slate-300">{command}</code>)}
        </div>
      </div>
    </div>
  </section>;
}
