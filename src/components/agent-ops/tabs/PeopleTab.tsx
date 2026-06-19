import { useState } from 'react';
import type { WorkCard, WorkStatus } from '../../../types/agentOps';
import { useLocalStorageVersion, appendAgentOpsAudit } from '../storage';
import { 
  Bot, Loader2, Play, CheckCircle2, XCircle, AlertTriangle, FileText, X, Layers
} from 'lucide-react';
import { editFile, applyEdit, type EditResult } from '../../../utils/assistantApi';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const LEGACY_STAFF_KEY = 'ledgerflow-ai-staff-assignment-v1';
const watchedEvents = ['ledgerflow-aiops-card-updated', 'ledgerflow-ai-staff-updated', 'storage'];

const roleDirectory = [
  { name: 'AI Chief of Staff', mission: 'Điều phối founder dashboard, daily standup, risk queue và ưu tiên công việc.', permission: 'MEDIUM', connectors: ['AI Gateway', 'Knowledge Library'], output: 'Daily brief, work order, risk summary' },
  { name: 'AI Dev', mission: 'Lập plan code, sửa UI/module nhỏ, tạo handoff cho VS Code/Cursor và Draft PR.', permission: 'HIGH', connectors: ['GitHub', 'VS Code', 'CI Doctor'], output: 'Code plan, patch summary, PR checklist' },
  { name: 'AI Designer', mission: 'Thiết kế giao diện Company OS, flow màn hình và component spec.', permission: 'MEDIUM', connectors: ['Knowledge Library'], output: 'Wireframe note, UI checklist' },
  { name: 'AI Marketer', mission: 'Lập content calendar, SEO angle, A/B test landing page và feedback loop.', permission: 'LOW', connectors: ['Marketing workspace'], output: 'Campaign brief, copy draft' },
  { name: 'AI Accountant', mission: 'Mô phỏng case kế toán Việt Nam, calculator và checklist chứng từ.', permission: 'MEDIUM', connectors: ['Finance & Accounting'], output: 'Simulation case, journal checklist' },
  { name: 'AI Auditor', mission: 'Tìm red flag, Benford/Isolation Forest lab và checklist kiểm soát.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Audit finding, risk scoring' },
  { name: 'AI Data Analyst', mission: 'Phân tích KPI, cashflow, anomaly và dashboard metric.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Insight card, model note' },
  { name: 'AI QA', mission: 'Viết checklist test, release readiness, CI triage và regression note.', permission: 'HIGH', connectors: ['CI Doctor', 'Risk & Release Audit'], output: 'QA checklist, release gate result' },
];

type LegacyStaffTask = {
  id: string;
  aiStaff: string;
  role: string;
  task: string;
  input: string;
  expectedOutput: string;
  acceptanceCriteria: string;
  deadline: string;
  status: 'Backlog' | 'Assigned' | 'In Review' | 'Approved' | 'Rejected';
  founderReview: string;
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeCards(cards: WorkCard[]) {
  localStorage.setItem(CARD_KEY, JSON.stringify(cards));
  window.dispatchEvent(new CustomEvent('ledgerflow-aiops-card-updated'));
  window.dispatchEvent(new CustomEvent('ledgerflow-ai-staff-updated'));
}

function staffStatusToWorkStatus(status: LegacyStaffTask['status']): WorkStatus {
  if (status === 'Approved') return 'Done';
  if (status === 'In Review') return 'Waiting Approval';
  if (status === 'Assigned') return 'Ready';
  return 'Inbox';
}

function legacyStaffToCard(task: LegacyStaffTask): WorkCard {
  return {
    id: task.id,
    title: task.task,
    kind: 'Ops',
    owner: task.role,
    status: staffStatusToWorkStatus(task.status),
    risk: 'MEDIUM',
    request: task.input || task.task,
    plan: [task.expectedOutput || 'Legacy staff output', task.acceptanceCriteria || 'Founder review required'],
    tools: ['AI Staff Assignment'],
    approval: task.founderReview || 'Legacy staff task imported for display.',
    aiStaff: task.aiStaff,
    role: task.role,
    task: task.task,
    input: task.input,
    expectedOutput: task.expectedOutput,
    acceptanceCriteria: task.acceptanceCriteria,
    founderReview: task.founderReview,
    deadline: task.deadline
  };
}

function readStaffCards(): WorkCard[] {
  const cards = readLocal<WorkCard[]>(CARD_KEY, []);
  const legacyTasks = readLocal<LegacyStaffTask[]>(LEGACY_STAFF_KEY, []);
  const staffCards = cards.filter((card) => card.aiStaff || card.acceptanceCriteria || card.founderReview);
  const migratedLegacyCards = legacyTasks.map(legacyStaffToCard).filter((legacyCard) => !staffCards.some((card) => card.id === legacyCard.id));
  return [...staffCards, ...migratedLegacyCards];
}

export default function PeopleTab() {
  useLocalStorageVersion(watchedEvents);
  const [draft, setDraft] = useState({ aiStaff: '', role: '', task: '', acceptanceCriteria: '' });
  const staffCards = readStaffCards();

  // AI Workforce Operations execution states
  const [executingCard, setExecutingCard] = useState<WorkCard | null>(null);
  const [execRole, setExecRole] = useState('');
  const [execInputFile, setExecInputFile] = useState('');
  const [execPrompt, setExecPrompt] = useState('');
  const [execAutoRepair, setExecAutoRepair] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [applyingAI, setApplyingAI] = useState(false);
  const [aiOutput, setAiOutput] = useState<EditResult | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const startExecution = (card: WorkCard) => {
    setExecutingCard(card);
    setExecRole(card.role || card.aiStaff || '');
    setExecInputFile(card.input || 'src/App.tsx');
    setExecPrompt(card.task || card.title || '');
    setExecAutoRepair(false);
    setAiOutput(null);
    setStatusMsg('');
  };

  const runAIStaffTask = async () => {
    if (!executingCard || !execPrompt.trim()) return;
    setRunningAI(true);
    setAiOutput(null);
    setStatusMsg('');
    
    // Map AI Staff Name to expected daemon role
    const daemonRoleMap: Record<string, string> = {
      'AI Chief of Staff': 'Chief of Staff',
      'AI Dev': 'AI Dev',
      'AI Designer': 'AI Designer',
      'AI Marketer': 'AI Marketer',
      'AI Accountant': 'AI Accountant',
      'AI Auditor': 'AI Auditor',
      'AI Data Analyst': 'AI Analyst',
      'AI QA': 'AI QA'
    };

    const daemonRole = daemonRoleMap[execRole] || execRole;
    
    try {
      const filesArray = execInputFile.split(',').map(f => f.trim()).filter(Boolean);
      const result = await editFile(
        filesArray.length > 0 ? filesArray : ['src/App.tsx'],
        execPrompt.trim(),
        undefined,
        daemonRole || undefined
      );
      setAiOutput(result);
      if (!result.ok) {
        setStatusMsg('❌ AI Staff phản hồi lỗi hoặc không tạo được đề xuất.');
      }
    } catch (err: any) {
      setStatusMsg(`❌ Lỗi kết nối AI: ${err.message}`);
    } finally {
      setRunningAI(false);
    }
  };

  const approveAIStaffTask = async () => {
    if (!executingCard || !aiOutput) return;
    setApplyingAI(true);
    setStatusMsg('');
    const filesArray = execInputFile.split(',').map(f => f.trim()).filter(Boolean);
    
    try {
      const applyResult = await applyEdit(
        filesArray.length > 0 ? filesArray : ['src/App.tsx'],
        'auto',
        execAutoRepair,
        execPrompt
      );
      
      setStatusMsg(`✅ Phê duyệt thành công! ${applyResult.message}`);
      appendAgentOpsAudit('Approve AI Task', executingCard.id, `Approved & Applied changes by ${execRole}. Files: ${filesArray.join(', ')}`);
      
      // Update Card Status to Done & Approved
      const allCards = readLocal<WorkCard[]>(CARD_KEY, []);
      const updatedCards = allCards.map((c) => {
        if (c.id === executingCard.id) {
          return {
            ...c,
            status: 'Done' as const,
            founderReview: 'Approved',
            approval: 'Approved & Applied by Founder.'
          };
        }
        return c;
      });
      writeCards(updatedCards);
      
      // Clear executing card after delay
      setTimeout(() => setExecutingCard(null), 3000);
    } catch (err: any) {
      setStatusMsg(`❌ Lỗi apply: ${err.message}`);
    } finally {
      setApplyingAI(false);
    }
  };

  const rejectAIStaffTask = () => {
    if (!executingCard) return;
    setStatusMsg('❌ Đã từ chối và hủy bỏ đề xuất.');
    appendAgentOpsAudit('Reject AI Task', executingCard.id, `Rejected proposal by ${execRole}.`);
    
    // Update Card Status
    const allCards = readLocal<WorkCard[]>(CARD_KEY, []);
    const updatedCards = allCards.map((c) => {
      if (c.id === executingCard.id) {
        return {
          ...c,
          founderReview: 'Rejected',
          approval: 'Rejected by Founder.'
        };
      }
      return c;
    });
    writeCards(updatedCards);
    
    setTimeout(() => setExecutingCard(null), 2000);
  };

  const assignRole = (roleName: string) => {
    const role = roleDirectory.find((item) => item.name === roleName);
    if (!role) return;
    setDraft({
      aiStaff: role.name,
      role: role.name,
      task: `${role.name}: ${role.mission}`,
      acceptanceCriteria: `Output bắt buộc: ${role.output}. Permission: ${role.permission}. Connector được dùng: ${role.connectors.join(', ')}. Hành động rủi ro phải đi qua Approval Gate.`,
    });
  };

  const addAssignment = () => {
    if (!draft.aiStaff.trim() || !draft.task.trim()) return;
    const cards = readLocal<WorkCard[]>(CARD_KEY, []);
    const card: WorkCard = {
      id: `staff-${Date.now()}`,
      title: draft.task.trim(),
      kind: 'Ops',
      owner: draft.role.trim() || draft.aiStaff.trim(),
      status: 'Inbox',
      risk: draft.acceptanceCriteria.includes('Permission: HIGH') ? 'HIGH' : 'MEDIUM',
      request: draft.task.trim(),
      plan: [draft.acceptanceCriteria.trim() || 'Founder review required'],
      tools: ['AI Staff Assignment', 'Approval Gate', 'Workboard'],
      approval: 'Founder review required before marking done or using external connector.',
      aiStaff: draft.aiStaff.trim(),
      role: draft.role.trim() || draft.aiStaff.trim(),
      task: draft.task.trim(),
      acceptanceCriteria: draft.acceptanceCriteria.trim(),
      founderReview: 'Pending'
    };
    writeCards([card, ...cards]);
    setDraft({ aiStaff: '', role: '', task: '', acceptanceCriteria: '' });
  };

  return (
    <section className="rounded-3xl border border-sky-400/35 bg-sky-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">AI Staff</p>
      <h3 className="mt-1 text-xl font-black text-white">AI Staff Assignment</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Định nghĩa rõ AI nhân sự như nhân viên công ty: nhiệm vụ, output, quyền hạn và connector được dùng. StaffTask vẫn gộp vào WorkCard để Workboard là nguồn vận hành chính.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {roleDirectory.map((role) => (
          <article key={role.name} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-black text-white">{role.name}</p>
              <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-black text-slate-300">{role.permission}</span>
            </div>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{role.mission}</p>
            <p className="mt-2 text-[11px] font-bold text-sky-200">{role.connectors.join(' · ')}</p>
            <p className="mt-2 text-[11px] font-semibold leading-5 text-slate-400">Output: {role.output}</p>
            <button onClick={() => assignRole(role.name)} className="mt-3 rounded-xl border border-sky-300/40 px-3 py-2 text-[11px] font-black text-sky-100 hover:bg-sky-400/10">Giao việc role này</button>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
        <p className="text-sm font-black text-white">Tạo assignment mới</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="AI staff" value={draft.aiStaff} onChange={(event) => setDraft({ ...draft, aiStaff: event.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" placeholder="Role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
          <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2" placeholder="Task" value={draft.task} onChange={(event) => setDraft({ ...draft, task: event.target.value })} />
          <textarea className="min-h-[80px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2" placeholder="Acceptance criteria" value={draft.acceptanceCriteria} onChange={(event) => setDraft({ ...draft, acceptanceCriteria: event.target.value })} />
        </div>
        <button onClick={addAssignment} className="mt-3 rounded-2xl bg-sky-300 px-4 py-2 text-xs font-black text-slate-950">Thêm assignment</button>
      </div>

      {/* AI Staff Action Cards */}
      <div className="mt-4 border-t border-slate-900 pt-4">
        <h4 className="text-sm font-black text-white mb-3 flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-sky-400" />
          Danh sách Nhiệm vụ AI Staff ({staffCards.length})
        </h4>
        
        {/* Executor Inline Panel */}
        {executingCard && (
          <div className="mb-4 rounded-2xl border border-violet-500/30 bg-slate-900/90 p-5 shadow-2xl relative transition-all duration-300">
            <button 
              onClick={() => setExecutingCard(null)} 
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-2 mb-4 border-b border-slate-850 pb-2">
              <div className="w-7 h-7 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Bot className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Trình Thực Thi Nhiệm Vụ AI Staff</h4>
                <p className="text-[10px] text-slate-500">Nhiệm vụ: {executingCard.title}</p>
              </div>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Vai Trò AI Nhân Sự</label>
                <select
                  value={execRole}
                  onChange={e => setExecRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-bold outline-none focus:border-violet-500/50"
                >
                  <option value="">-- Mặc định (AI Dev) --</option>
                  {roleDirectory.map(r => (
                    <option key={r.name} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tệp Nguồn Cần Chỉnh Sửa (Input File)</label>
                <input
                  value={execInputFile}
                  onChange={e => setExecInputFile(e.target.value)}
                  placeholder="Ví dụ: src/App.tsx, src/main.tsx"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono outline-none focus:border-violet-500/50"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Yêu Cầu / Prompt Chi Tiết</label>
                <textarea
                  value={execPrompt}
                  onChange={e => setExecPrompt(e.target.value)}
                  rows={3}
                  placeholder="Nhập yêu cầu cụ thể để AI Staff thực thi..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-violet-500/50 resize-none font-semibold leading-relaxed"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-300">Tự động sửa lỗi biên dịch (Auto-Repair Loop)</span>
                  <span className="text-[10px] text-slate-500">Chạy tsc check sau khi sinh code để tự sửa nếu lỗi</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={execAutoRepair}
                    onChange={e => setExecAutoRepair(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={runAIStaffTask}
                disabled={runningAI || !execPrompt.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-violet-600/10"
              >
                {runningAI ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {runningAI ? 'AI Staff đang thực thi nhiệm vụ...' : 'Bắt đầu Thực Thi'}
              </button>
              <button
                onClick={() => setExecutingCard(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
            </div>

            {/* AI Output Result Section */}
            {aiOutput && (
              <div className="mt-4 border-t border-slate-850 pt-4 space-y-4">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" /> AI Staff đã hoàn tất xử lý!
                </div>
                
                {aiOutput.explanation && (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" /> Giải thích giải pháp
                    </div>
                    <div className="whitespace-pre-line">{aiOutput.explanation}</div>
                  </div>
                )}

                {aiOutput.codeBlocks && aiOutput.codeBlocks.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Các file đề xuất sửa đổi</div>
                    {aiOutput.codeBlocks.map((block, idx) => (
                      <div key={idx} className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900">
                          <span className="text-[10px] font-black text-slate-400 uppercase font-mono tracking-wider">{block.targetFile || `file_block_${idx+1}`}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{block.language}</span>
                        </div>
                        <pre className="p-3 overflow-x-auto text-[10px] leading-4 text-slate-300 font-mono whitespace-pre">{block.code}</pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Review Checklist & Risk Board (P3.4 specific) */}
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" /> Review Checklist (Founder Gate)
                    </div>
                    <ul className="space-y-2 text-xs text-slate-300 font-semibold font-sans">
                      <li className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-slate-800 text-emerald-600 h-3.5 w-3.5" />
                        <span>Xác nhận code logic đạt mục tiêu</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-slate-800 text-emerald-600 h-3.5 w-3.5" />
                        <span>TypeScript check: Pass qua Auto-Repair</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded border-slate-800 text-emerald-600 h-3.5 w-3.5" />
                        <span>Sao lưu (Git/Copy backup) an toàn</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-850 rounded-xl space-y-2.5">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Risk &amp; Next Action
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Mức độ rủi ro (Risk Level): </span>
                        <span className={`font-black uppercase px-2 py-0.5 rounded text-[9px] ${
                          executingCard.risk === 'HIGH' ? 'bg-rose-950/40 text-rose-400 border border-rose-800/40' : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                        }`}>
                          {executingCard.risk}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-wider">Hành động tiếp theo: </span>
                        <p className="text-slate-300 font-semibold leading-relaxed mt-1">
                          Founder duyệt các tệp tin thay đổi và nhấn **Phê duyệt** để áp dụng ghi đè tệp tin nguồn an toàn.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Founder (Approval Gate) */}
                <div className="flex gap-2">
                  <button
                    onClick={approveAIStaffTask}
                    disabled={applyingAI}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-700/10"
                  >
                    {applyingAI ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    {applyingAI ? 'Đang áp dụng thay đổi...' : 'Phê duyệt & Áp dụng (Apply)'}
                  </button>
                  
                  <button
                    onClick={rejectAIStaffTask}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-rose-950/60 hover:bg-rose-950 border border-rose-800 hover:border-rose-700 text-rose-300 text-xs font-black rounded-xl transition-all"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Từ chối &amp; Hủy bỏ
                  </button>
                </div>
              </div>
            )}

            {statusMsg && (
              <div className={`mt-3 rounded-xl p-3 text-xs font-bold whitespace-pre-line border ${
                statusMsg.startsWith('✅') ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300' : 'bg-rose-950/40 border-rose-700/40 text-rose-300'
              }`}>
                {statusMsg}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {staffCards.map((card) => (
            <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-black text-white">{card.title}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    card.status === 'Done'
                      ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                      : card.status === 'Waiting Approval'
                        ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {card.status}
                  </span>
                </div>
                
                <p className="mt-1 text-[10px] font-bold text-slate-400">
                  Phân vai: <strong className="text-slate-300">{card.aiStaff ?? card.owner}</strong> {card.deadline ? ` · Hạn: ${card.deadline}` : ''}
                </p>
                
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{card.acceptanceCriteria ?? card.request}</p>
                
                {card.founderReview && (
                  <div className="mt-2.5 p-2 bg-slate-900/40 border border-slate-850 rounded-xl flex items-center justify-between text-[10px] font-bold">
                    <span className="text-slate-500">Đánh giá của sếp:</span>
                    <span className={card.founderReview === 'Approved' ? 'text-emerald-400' : 'text-rose-400'}>
                      {card.founderReview}
                    </span>
                  </div>
                )}
              </div>

              {card.status !== 'Done' && (
                <button
                  onClick={() => startExecution(card)}
                  className="mt-4 w-full flex items-center justify-center gap-1 px-3 py-2 bg-violet-600/95 hover:bg-violet-500 rounded-xl text-xs font-black text-white transition-all shadow-lg shadow-violet-600/5"
                >
                  <Play className="h-3 w-3" /> Thực thi qua AI Assistant
                </button>
              )}
            </article>
          ))}
          {staffCards.length === 0 && (
            <p className="col-span-2 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400 text-center">
              Chưa có WorkCard gắn AI staff.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
