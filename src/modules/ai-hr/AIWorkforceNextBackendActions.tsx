import { CheckCircle2, Code2, GitPullRequest, ListChecks, MessageSquare, PackageCheck, ShieldCheck, Wrench } from 'lucide-react';

type ActionItem = {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  title: string;
  why: string;
  files: string[];
  doneWhen: string;
  icon: React.ReactNode;
};

const actions: ActionItem[] = [
  {
    id: 'daemon-schema-sync',
    priority: 'P0',
    title: 'Sync daemon requestedTools schema',
    why: 'Mission planner and registry already know all tools, but daemon validation still has a legacy tool list.',
    files: ['server/assistant-daemon.ts', 'server/services/agentToolIds.ts'],
    doneWhen: 'Creating a mission with analyse_data and generate_report passes daemon validation.',
    icon: <PackageCheck className="h-4 w-4" />,
  },
  {
    id: 'telegram-handlers',
    priority: 'P0',
    title: 'Wire Telegram mission handlers',
    why: 'OpenClaw-style messaging-first UX needs real mobile command execution, not only command specs.',
    files: ['server/services/telegramBot.ts', 'server/assistant-daemon.ts'],
    doneWhen: '/mission create, status, approvals, approve, stop and artifact work end-to-end.',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: 'patch-apply-rollback',
    priority: 'P1',
    title: 'Reviewed patch apply / rollback',
    why: 'Patch sessions are visible, but founder still needs diff preview, approved apply and rollback metadata.',
    files: ['server/services/sandboxToolExecutor.ts', 'server/services/safeFileManager.ts', 'src/modules/ai-hr/AIWorkforcePatchReviewSessions.tsx'],
    doneWhen: 'Patch artifact can be previewed as diff, applied only after approval and rolled back safely.',
    icon: <Wrench className="h-4 w-4" />,
  },
  {
    id: 'plugin-enforcement',
    priority: 'P1',
    title: 'Enforce plugin signature / sandbox / scopes',
    why: 'Plugin Security Guard exists in UI, but runtime must block unsafe plugins by default.',
    files: ['server/services/pluginExtensionSystem.ts', 'server/services/aiSecurityAuditor.ts', 'server/services/sandboxCodeExecutor.ts'],
    doneWhen: 'Unsigned or unsandboxed plugins cannot invoke host-side entry points without explicit review.',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: 'audit-reject-flow',
    priority: 'P2',
    title: 'Add reject step + audit summary',
    why: 'Approval Gate can approve/stop, but rejecting a step should be explicit and visible.',
    files: ['server/services/agentRuntime.ts', 'src/modules/ai-hr/AIWorkforceMissionControl.tsx', 'src/modules/ai-hr/AIWorkforceMissionTrace.tsx'],
    doneWhen: 'Founder can reject a waiting step and see audit evidence in Mission Trace.',
    icon: <ListChecks className="h-4 w-4" />,
  },
];

function priorityClass(priority: ActionItem['priority']) {
  if (priority === 'P0') return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
  if (priority === 'P1') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
}

export default function AIWorkforceNextBackendActions() {
  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><GitPullRequest className="mr-2 inline h-4 w-4" />Next Backend Actions</p>
      <h3 className="mt-2 text-lg font-black text-white">Các task backend còn lại để đạt OpenClaw parity</h3>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Danh sách ưu tiên để tiếp tục triển khai có kiểm soát, tránh làm UI đẹp nhưng backend chưa thật.</p>
    </div>

    <div className="grid gap-3 xl:grid-cols-2">
      {actions.map((action) => <div key={action.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black text-white"><span className="text-cyan-200">{action.icon}</span>{action.title}</div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${priorityClass(action.priority)}`}>{action.priority}</span>
        </div>
        <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{action.why}</p>
        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500"><Code2 className="mr-1 inline h-3.5 w-3.5" />Files</p>
          <div className="flex flex-wrap gap-2">{action.files.map((file) => <code key={file} className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-bold text-slate-300">{file}</code>)}</div>
        </div>
        <p className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-[11px] font-bold leading-5 text-emerald-100"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Done when: {action.doneWhen}</p>
      </div>)}
    </div>
  </section>;
}
