import { Bot, CheckCircle2, Database, FileText, Globe, Lock, Megaphone, MousePointer2, ShieldAlert, Terminal, Wrench, Zap } from 'lucide-react';

type ToolCard = {
  id: string;
  label: string;
  permission: string;
  risk: 'low' | 'medium' | 'high' | 'blocked';
  execution: 'simulation' | 'sandbox' | 'connector';
  approval: boolean;
  description: string;
  icon: React.ReactNode;
};

const tools: ToolCard[] = [
  { id: 'read_knowledge', label: 'Read Knowledge', permission: 'knowledge:read', risk: 'low', execution: 'simulation', approval: false, description: 'Đọc tri thức đã review trong memory/RAG.', icon: <Database className="h-4 w-4" /> },
  { id: 'draft_plan', label: 'Draft Plan', permission: 'plan:draft', risk: 'low', execution: 'simulation', approval: false, description: 'Tạo kế hoạch có cấu trúc, không side effect.', icon: <FileText className="h-4 w-4" /> },
  { id: 'analyse_data', label: 'Analyse Data', permission: 'data:analyse', risk: 'low', execution: 'sandbox', approval: false, description: 'Phân tích dữ liệu có cấu trúc và trả insight.', icon: <Database className="h-4 w-4" /> },
  { id: 'generate_report', label: 'Generate Report', permission: 'report:generate', risk: 'low', execution: 'simulation', approval: false, description: 'Tạo báo cáo markdown từ observation/artifact.', icon: <FileText className="h-4 w-4" /> },
  { id: 'robot_inspect', label: 'Robot Inspect', permission: 'robot:inspect', risk: 'low', execution: 'simulation', approval: false, description: 'Đọc telemetry robot simulation, không di chuyển.', icon: <Bot className="h-4 w-4" /> },
  { id: 'draft_patch', label: 'Draft Patch', permission: 'patch:draft', risk: 'medium', execution: 'sandbox', approval: true, description: 'Tạo patch artifact/manifest để founder review trước.', icon: <Wrench className="h-4 w-4" /> },
  { id: 'browser_check', label: 'Browser Check', permission: 'browser:read', risk: 'medium', execution: 'sandbox', approval: true, description: 'Kiểm tra browser target allowlisted, read-only.', icon: <Globe className="h-4 w-4" /> },
  { id: 'terminal_check', label: 'Terminal Check', permission: 'terminal:read', risk: 'medium', execution: 'sandbox', approval: true, description: 'Chạy command chẩn đoán read-only trong allowlist.', icon: <Terminal className="h-4 w-4" /> },
  { id: 'search_web_context', label: 'Search Web Context', permission: 'web:search', risk: 'medium', execution: 'sandbox', approval: false, description: 'Tìm context thị trường/đối thủ ở chế độ đọc.', icon: <Globe className="h-4 w-4" /> },
  { id: 'external_connector', label: 'External Connector', permission: 'connector:write', risk: 'high', execution: 'connector', approval: true, description: 'Ghi qua connector bên ngoài, luôn cần approval.', icon: <MousePointer2 className="h-4 w-4" /> },
  { id: 'send_notification', label: 'Send Notification', permission: 'notification:send', risk: 'high', execution: 'connector', approval: true, description: 'Gửi thông báo Telegram/in-app qua channel cấu hình.', icon: <Megaphone className="h-4 w-4" /> },
  { id: 'robot_move', label: 'Robot Move', permission: 'robot:move', risk: 'high', execution: 'simulation', approval: true, description: 'Lệnh di chuyển robot simulator trong safety envelope.', icon: <Bot className="h-4 w-4" /> },
];

function riskClass(risk: ToolCard['risk']) {
  if (risk === 'low') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200';
  if (risk === 'medium') return 'border-amber-500/20 bg-amber-500/10 text-amber-200';
  if (risk === 'high') return 'border-rose-500/20 bg-rose-500/10 text-rose-200';
  return 'border-slate-700 bg-slate-900 text-slate-300';
}

export default function AIWorkforceToolCatalog() {
  const safeTools = tools.filter((tool) => !tool.approval);
  const gatedTools = tools.filter((tool) => tool.approval);

  return <section className="rounded-[2rem] border border-slate-800 bg-slate-950/55 p-4 text-left text-slate-100">
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200"><Zap className="mr-2 inline h-4 w-4" />Tool Catalog</p>
        <h3 className="mt-2 text-lg font-black text-white">AI tools, risk and approval map</h3>
        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Danh mục tool giúp founder biết mission có thể dùng gì, chạy ở simulation/sandbox/connector và có cần phê duyệt không.</p>
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">{safeTools.length} safe</span>
        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-200">{gatedTools.length} approval gated</span>
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-emerald-200"><CheckCircle2 className="h-4 w-4" />Safe / no approval</div>
        <div className="grid gap-3 md:grid-cols-2">
          {safeTools.map((tool) => <div key={tool.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-black text-white">{tool.icon}{tool.label}</div><span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${riskClass(tool.risk)}`}>{tool.risk}</span></div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{tool.description}</p>
            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-500">{tool.execution} • {tool.permission}</p>
          </div>)}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-200"><ShieldAlert className="h-4 w-4" />Approval required</div>
        <div className="grid gap-3 md:grid-cols-2">
          {gatedTools.map((tool) => <div key={tool.id} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-black text-white">{tool.icon}{tool.label}</div><span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase ${riskClass(tool.risk)}`}>{tool.risk}</span></div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{tool.description}</p>
            <div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase text-amber-200"><Lock className="mr-1 inline h-3 w-3" />approval</span><span className="rounded-full border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] font-black uppercase text-slate-400">{tool.execution}</span></div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-500">{tool.permission}</p>
          </div>)}
        </div>
      </div>
    </div>
  </section>;
}
