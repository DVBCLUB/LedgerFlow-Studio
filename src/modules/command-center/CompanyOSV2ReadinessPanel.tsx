import type { ReactNode } from 'react';
import { CheckCircle2, ClipboardCheck, GitBranch, Layers, ListChecks, Route, ShieldCheck } from 'lucide-react';
import {
  COMPANY_OS_V2_BACKLOG,
  COMPANY_OS_V2_ROLLOUT_ORDER,
  type CompanyOSBacklogPriority,
  type CompanyOSBacklogStatus
} from '../../data/companyOSV2Backlog';
import {
  COMPANY_OS_V2_LANE_MAP,
  COMPANY_OS_V2_NAV_ACCEPTANCE,
  type CompanyOSV2LaneGroup
} from '../../data/companyOSV2LaneMap';
import {
  SIMULATION_BOUNDARY_ACCEPTANCE,
  SIMULATION_BOUNDARY_NOTES
} from '../../data/simulationBoundaryNotes';
import {
  AGENTOPS_V2_BACKLOG,
  type AgentOpsV2Priority,
  type AgentOpsV2Status
} from '../../data/agentOpsV2Backlog';
import {
  V2_COMMIT_CHECKLIST,
  V2_LOW_QUOTA_SEQUENCE,
  type V2CheckScope
} from '../../data/v2CommitChecklists';

type Tone = 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate';

const toneClass: Record<Tone, string> = {
  blue: 'border-blue-500/20 bg-blue-500/5 text-blue-100',
  purple: 'border-purple-500/20 bg-purple-500/5 text-purple-100',
  emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-100',
  amber: 'border-amber-500/20 bg-amber-500/5 text-amber-100',
  rose: 'border-rose-500/20 bg-rose-500/5 text-rose-100',
  cyan: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-100',
  slate: 'border-slate-800 bg-slate-900/70 text-slate-100'
};

const priorityTone: Record<CompanyOSBacklogPriority | AgentOpsV2Priority, Tone> = {
  P0: 'rose',
  P1: 'amber',
  P2: 'cyan'
};

const statusTone: Record<CompanyOSBacklogStatus | AgentOpsV2Status, Tone> = {
  todo: 'slate',
  in_progress: 'amber',
  done: 'emerald',
  planned: 'slate',
  ready: 'emerald',
  blocked: 'rose'
};

const laneTone: Record<CompanyOSV2LaneGroup, Tone> = {
  Command: 'blue',
  Build: 'purple',
  Sell: 'emerald',
  Control: 'amber',
  Extend: 'cyan'
};

const scopeTone: Record<V2CheckScope, Tone> = {
  typescript: 'blue',
  agentops: 'purple',
  'simulation-registry': 'cyan',
  accounting: 'amber',
  'founder-labs': 'emerald',
  build: 'rose',
  offline: 'slate'
};

const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`rounded-3xl border border-slate-800 bg-slate-900/70 p-5 ${className}`}>{children}</section>
);

const Chip = ({ children, tone = 'slate' }: { children: ReactNode; tone?: Tone }) => (
  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${toneClass[tone]}`}>{children}</span>
);

const BulletList = ({ items, className = 'text-slate-300' }: { items: string[]; className?: string }) => (
  <>{items.map((item) => <p key={item} className={`text-xs font-semibold leading-6 ${className}`}>* {item}</p>)}</>
);

export default function CompanyOSV2ReadinessPanel() {
  return (
    <div className="space-y-5">
      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-300">
          <ClipboardCheck className="h-3.5 w-3.5" /> V2 Operating Readiness
        </div>
        <h3 className="text-xl font-black text-white">Company OS V2 backlog, lanes, boundaries, AgentOps and checks</h3>
        <p className="mt-3 max-w-4xl text-sm font-semibold leading-6 text-slate-400">
          Section nay gom cac data V2 da co san thanh mot man hinh dieu phoi offline-first. No giup founder thay thu tu uu tien ma khong doi route, khong sua registry va khong them backend.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ListChecks className="h-4 w-4 text-rose-300" /> Company OS V2 Backlog
          </h4>
          <div className="space-y-3">
            {COMPANY_OS_V2_BACKLOG.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{item.id}</p>
                    <h5 className="mt-1 text-sm font-black text-white">{item.title}</h5>
                  </div>
                  <div className="flex gap-2">
                    <Chip tone={priorityTone[item.priority]}>{item.priority}</Chip>
                    <Chip tone={statusTone[item.status]}>{item.status}</Chip>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.problem}</p>
                <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-bold leading-6 text-emerald-100">{item.targetOutcome}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase text-cyan-300">Implementation</p>
                    <BulletList items={item.implementation} className="text-cyan-100" />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-black uppercase text-emerald-300">Acceptance</p>
                    <BulletList items={item.acceptance} className="text-emerald-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Route className="h-4 w-4 text-blue-300" /> Company OS Lane Map
          </h4>
          <div className="grid gap-3">
            {COMPANY_OS_V2_LANE_MAP.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-black text-white">{item.label}</h5>
                    <p className="mt-1 font-mono text-[11px] font-bold text-slate-500">{item.route}</p>
                  </div>
                  <Chip tone={laneTone[item.group]}>{item.group}</Chip>
                </div>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.purpose}</p>
                <p className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs font-bold leading-6 text-cyan-100">{item.v2Note}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="mb-2 text-[10px] font-black uppercase text-emerald-300">Navigation acceptance</p>
            <BulletList items={COMPANY_OS_V2_NAV_ACCEPTANCE} className="text-emerald-100" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <ShieldCheck className="h-4 w-4 text-amber-300" /> Simulation Boundary Notes
          </h4>
          <div className="space-y-3">
            {SIMULATION_BOUNDARY_NOTES.map((note) => (
              <div key={note.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <h5 className="text-sm font-black text-white">{note.title}</h5>
                <p className="mt-2 text-xs font-semibold leading-6 text-amber-100">{note.message}</p>
                <p className="mt-3 text-[10px] font-black uppercase text-slate-400">Apply to: {note.applyTo.join(', ')}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <p className="mb-2 text-[10px] font-black uppercase text-cyan-300">Boundary acceptance</p>
            <BulletList items={SIMULATION_BOUNDARY_ACCEPTANCE} className="text-cyan-100" />
          </div>
        </Card>

        <Card>
          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <Layers className="h-4 w-4 text-purple-300" /> AgentOps V2 Backlog
          </h4>
          <div className="space-y-3">
            {AGENTOPS_V2_BACKLOG.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-purple-300">{item.targetArea}</p>
                    <h5 className="mt-1 text-sm font-black text-white">{item.title}</h5>
                  </div>
                  <div className="flex gap-2">
                    <Chip tone={priorityTone[item.priority]}>{item.priority}</Chip>
                    <Chip tone={statusTone[item.status]}>{item.status}</Chip>
                  </div>
                </div>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.whyItMatters}</p>
                <p className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs font-bold leading-6 text-purple-100">{item.implementationHint}</p>
                <p className="mt-4 text-[10px] font-black uppercase text-emerald-300">Acceptance</p>
                <BulletList items={item.acceptance} className="text-emerald-100" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <GitBranch className="h-4 w-4 text-cyan-300" /> V2 Commit Checklists
          </h4>
          <div className="grid gap-3 md:grid-cols-2">
            {V2_COMMIT_CHECKLIST.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h5 className="text-sm font-black text-white">{item.id}</h5>
                  <Chip tone={scopeTone[item.scope]}>{item.scope}</Chip>
                </div>
                <code className="mt-3 block rounded-xl border border-slate-800 bg-black/30 p-3 text-[11px] font-bold text-cyan-100">{item.command}</code>
                <p className="mt-3 text-xs font-semibold leading-6 text-slate-300">{item.runWhen}</p>
                <p className="mt-2 text-xs font-semibold leading-6 text-slate-400">{item.purpose}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Low Quota Sequence
          </h4>
          <div className="space-y-3">
            {V2_LOW_QUOTA_SEQUENCE.map((item, index) => (
              <div key={item} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-[10px] font-black uppercase text-emerald-300">Step {index + 1}</p>
                <p className="mt-2 text-xs font-bold leading-6 text-emerald-100">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <p className="text-[10px] font-black uppercase text-cyan-300">Rollout order</p>
            <BulletList items={COMPANY_OS_V2_ROLLOUT_ORDER} className="text-cyan-100" />
          </div>
        </Card>
      </div>
    </div>
  );
}
