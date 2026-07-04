import { useState, type ReactNode } from 'react';
import { Bot, ClipboardCopy, MessageSquare, ShieldAlert, Smartphone, StopCircle, Terminal, Zap } from 'lucide-react';

type CommandSpec = {
  id: string;
  title: string;
  channel: 'desktop' | 'telegram' | 'cli';
  command: string;
  purpose: string;
  safety: string;
  icon: ReactNode;
};

const commands: CommandSpec[] = [
  {
    id: 'create-mission',
    title: 'Create mission',
    channel: 'telegram',
    command: '/mission create "Review LedgerFlow AI Workforce and propose the safest next patch plan"',
    purpose: 'Tạo mission mới từ điện thoại, giống command-first UX của OpenClaw.',
    safety: 'Chỉ tạo run. Tool rủi ro vẫn dừng ở Approval Gate.',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    id: 'mission-status',
    title: 'Mission status',
    channel: 'telegram',
    command: '/mission status latest',
    purpose: 'Xem trạng thái mission gần nhất: planned/running/waiting/completed/failed.',
    safety: 'Read-only. Không có side effect.',
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    id: 'list-approvals',
    title: 'List approvals',
    channel: 'telegram',
    command: '/mission approvals',
    purpose: 'Liệt kê các step đang chờ founder phê duyệt.',
    safety: 'Read-only. Chỉ hiển thị fingerprint/risk/tool.',
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    id: 'approve-fingerprint',
    title: 'Approve fingerprint',
    channel: 'telegram',
    command: '/mission approve <runId> <stepId> <fingerprint>',
    purpose: 'Phê duyệt đúng step bằng fingerprint đã hiển thị trong Approval Gate.',
    safety: 'Phải khớp fingerprint. Không approve khi emergency stop đang bật.',
    icon: <Bot className="h-4 w-4" />,
  },
  {
    id: 'stop-mission',
    title: 'Stop mission',
    channel: 'telegram',
    command: '/mission stop <runId>',
    purpose: 'Dừng một mission đang chạy từ điện thoại.',
    safety: 'Ghi audit reason: founder stopped from mobile command.',
    icon: <StopCircle className="h-4 w-4" />,
  },
  {
    id: 'emergency-stop',
    title: 'Emergency stop',
    channel: 'telegram',
    command: '/ai emergency-stop on',
    purpose: 'Khóa toàn bộ AI Workforce khi có rủi ro.',
    safety: 'Chặn mission mới và dừng active runs ở runtime gate.',
    icon: <StopCircle className="h-4 w-4" />,
  },
  {
    id: 'artifact-summary',
    title: 'Artifact summary',
    channel: 'telegram',
    command: '/mission artifact latest',
    purpose: 'Lấy tóm tắt artifact mới nhất sau khi agent chạy.',
    safety: 'Read-only. Không trả secret/raw file nhạy cảm.',
    icon: <ClipboardCopy className="h-4 w-4" />,
  },
  {
    id: 'cli-create',
    title: 'CLI mission',
    channel: 'cli',
    command: 'npm run assistant:cli -- mission create "Draft a safe patch plan for AI Workforce"',
    purpose: 'Tạo mission từ local CLI để desktop/terminal parity.',
    safety: 'Local command vẫn đi qua daemon và approval gate.',
    icon: <Terminal className="h-4 w-4" />,
  },
];

function channelClass(channel: CommandSpec['channel']) {
  if (channel === 'telegram') return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200';
  if (channel === 'cli') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  return 'border-violet-500/20 bg-violet-500/10 text-violet-200';
}

export default function AIWorkforceMobileCommandCenter() {
  const [copiedId, setCopiedId] = useState('');

  const copy = async (command: CommandSpec) => {
    try {
      await navigator.clipboard.writeText(command.command);
      setCopiedId(command.id);
      window.setTimeout(() => setCopiedId(''), 1600);
    } catch {
      setCopiedId('copy_failed');
      window.setTimeout(() => setCopiedId(''), 1600);
    }
  };

  return <section className="rounded-[2rem] border border-border-primary bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Smartphone className="mr-2 inline h-4 w-4" />Mobile Command Center</p>
        <h3 className="mt-2 text-lg font-black text-text-primary">Telegram/Desktop command parity</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-text-tertiary">Chuẩn hóa lệnh để founder điều khiển AI Workforce bằng điện thoại, desktop hoặc CLI mà vẫn giữ approval gate.</p>
      </div>
      {copiedId && <p className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-200">{copiedId === 'copy_failed' ? 'Không copy được' : 'Đã copy command'}</p>}
    </div>

    <div className="mb-4 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><Bot className="mb-2 h-4 w-4 text-cyan-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Command-first</p><p className="mt-1 text-xs font-bold text-text-secondary">Founder ra lệnh nhanh như OpenClaw.</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><ShieldAlert className="mb-2 h-4 w-4 text-amber-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Approval-safe</p><p className="mt-1 text-xs font-bold text-text-secondary">Fingerprint bắt buộc cho step rủi ro.</p></div>
      <div className="rounded-2xl border border-border-primary bg-slate-950/70 p-3"><StopCircle className="mb-2 h-4 w-4 text-rose-300" /><p className="text-[10px] font-black uppercase text-text-tertiary">Emergency</p><p className="mt-1 text-xs font-bold text-text-secondary">Có lệnh stop mission và global stop.</p></div>
    </div>

    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {commands.map((command) => <button key={command.id} onClick={() => void copy(command)} className="rounded-3xl border border-border-primary bg-slate-950/70 p-4 text-left transition hover:border-cyan-400/40 hover:bg-bg-primary/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${channelClass(command.channel)}`}>{command.channel}</span>
          <span className="text-cyan-200">{command.icon}</span>
        </div>
        <p className="mt-3 text-sm font-black text-text-primary">{command.title}</p>
        <code className="mt-2 block rounded-2xl border border-border-primary bg-bg-surface/70 p-2 text-[11px] font-bold leading-5 text-text-secondary">{command.command}</code>
        <p className="mt-3 text-xs font-semibold leading-5 text-text-secondary">{command.purpose}</p>
        <p className="mt-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-2 text-[11px] font-bold text-amber-100">Safety: {command.safety}</p>
        <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-cyan-300"><ClipboardCopy className="mr-1 inline h-3.5 w-3.5" />Copy Command</p>
      </button>)}
    </div>
  </section>;
}
