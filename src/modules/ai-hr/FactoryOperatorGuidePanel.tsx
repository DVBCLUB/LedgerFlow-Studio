import { BookOpen, CheckCircle2, PlayCircle, ShieldCheck } from 'lucide-react';

const steps = [
  ['1', 'Start daemon', 'Run the Software Factory daemon, then refresh Health Summary until the workspace is online.'],
  ['2', 'Seed or create run', 'Use Backend Runtime to seed sample data or create a real factory run from a product idea.'],
  ['3', 'Start execution', 'Start latest run, review provider decision, then advance execution one step at a time.'],
  ['4', 'Check workspace', 'Run factory-check, lint, test or build; link results into assets and execution log.'],
  ['5', 'Review and package', 'Use release kit, asset store, audit log and health signals before any high-impact action.'],
];

const guardrails = [
  'Human approval for merge main, payment, public release and destructive actions.',
  'Provider decisions are visible before execution moves forward.',
  'Command results can be stored as assets for traceable review.',
  'Audit log records important runtime actions for later inspection.',
];

export default function FactoryOperatorGuidePanel() {
  return <section className="grid gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/55 p-5 text-left shadow-xl shadow-slate-950/20 xl:grid-cols-[1.1fr_0.9fr]">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200"><BookOpen className="mr-2 inline h-4 w-4" />Operator guide</p>
      <h3 className="mt-2 text-xl font-black text-white">Factory run checklist</h3>
      <div className="mt-4 grid gap-2">
        {steps.map(([number, title, detail]) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-xs font-black text-cyan-100">{number}</span>
            <div><p className="text-xs font-black text-white">{title}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p></div>
          </div>
        </div>)}
      </div>
    </div>
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200"><ShieldCheck className="mr-2 inline h-4 w-4" />Review gates</p>
      <h3 className="mt-2 text-xl font-black text-white">Safe operating defaults</h3>
      <div className="mt-4 space-y-2">
        {guardrails.map((item) => <div key={item} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <p className="text-[11px] font-semibold leading-5 text-slate-400">{item}</p>
        </div>)}
      </div>
      <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3">
        <p className="text-xs font-black text-amber-100"><PlayCircle className="mr-2 inline h-4 w-4" />Recommended final check</p>
        <p className="mt-1 text-[11px] font-semibold leading-5 text-amber-100/80">Run npm run check:software-factory first, then npm run lint before packaging.</p>
      </div>
    </div>
  </section>;
}
