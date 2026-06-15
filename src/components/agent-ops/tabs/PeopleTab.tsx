import { useState } from 'react';
import type { WorkCard, WorkStatus } from '../../../types/agentOps';
import { useLocalStorageVersion } from '../storage';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const LEGACY_STAFF_KEY = 'ledgerflow-ai-staff-assignment-v1';
const watchedEvents = ['ledgerflow-aiops-card-updated', 'ledgerflow-ai-staff-updated', 'storage'];

const roleDirectory = [
  { name: 'Chief of Staff', mission: 'Điều phối founder dashboard, daily standup, risk queue và ưu tiên công việc.', permission: 'MEDIUM', connectors: ['AI Gateway', 'Knowledge Library'], output: 'Daily brief, work order, risk summary' },
  { name: 'AI CFO', mission: 'Forecast cash flow, burn rate, pricing, pricing và financial planning cho startup solo founder.', permission: 'HIGH', connectors: ['Finance & Accounting', 'Knowledge Library'], output: 'Cash forecast, scenario analysis, budget warnings' },
  { name: 'AI DevOps', mission: 'Thiết kế CI/CD, deployment, monitoring và rollback plan cho app React + Express.', permission: 'HIGH', connectors: ['GitHub Actions', 'Docker', 'CI Doctor'], output: 'Deploy plan, pipeline checklist, incident response' },
  { name: 'AI Legal', mission: 'Soạn thảo điều khoản pháp lý, chính sách bảo mật và tuân thủ luật Việt Nam.', permission: 'MEDIUM', connectors: ['Docs', 'Policy Gate'], output: 'Legal checklist, draft terms, compliance note' },
  { name: 'AI Research', mission: 'Nghiên cứu thị trường, đối thủ, xu hướng và insight khách hàng.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Market insight, competitor scan, value proposition' },
  { name: 'AI Sales', mission: 'Support sales pipeline, outreach kịch bản, objection handling và demo notes.', permission: 'MEDIUM', connectors: ['CRM', 'Review Desk'], output: 'Sales cadence, pitch note, next action' },
  { name: 'AI Dev', mission: 'Lập plan code, sửa UI/module nhỏ, tạo handoff cho VS Code/Cursor và Draft PR.', permission: 'HIGH', connectors: ['GitHub', 'VS Code', 'CI Doctor'], output: 'Code plan, patch summary, PR checklist' },
  { name: 'AI Designer', mission: 'Thiết kế giao diện Company OS, flow màn hình và component spec.', permission: 'MEDIUM', connectors: ['Knowledge Library'], output: 'Wireframe note, UI checklist' },
  { name: 'AI Marketer', mission: 'Lập content calendar, SEO angle, A/B test landing page và feedback loop.', permission: 'LOW', connectors: ['Marketing workspace'], output: 'Campaign brief, copy draft' },
  { name: 'AI Accountant', mission: 'Mô phỏng case kế toán Việt Nam, calculator và checklist chứng từ.', permission: 'MEDIUM', connectors: ['Finance & Accounting'], output: 'Simulation case, journal checklist' },
  { name: 'AI Auditor', mission: 'Tìm red flag, Benford/Isolation Forest lab và checklist kiểm soát.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Audit finding, risk scoring' },
  { name: 'AI Data Analyst', mission: 'Phân tích KPI, cashflow, anomaly và dashboard metric.', permission: 'MEDIUM', connectors: ['Analytics & Sandbox'], output: 'Insight card, model note' },
  { name: 'AI QA', mission: 'Viết checklist test, release readiness, CI triage và regression note.', permission: 'HIGH', connectors: ['CI Doctor', 'Risk & Release Audit'], output: 'QA checklist, release gate result' },
  { name: 'AI Onboarding', mission: 'Soạn onboarding script, FAQ và tutorial cho khách hàng mới.', permission: 'LOW', connectors: ['Docs', 'Customer Support'], output: 'Onboarding guide, FAQ, ticket triage' },
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

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {staffCards.map((card) => <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{card.title}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{card.aiStaff ?? card.owner} · {card.status}{card.deadline ? ` · ${card.deadline}` : ''}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{card.acceptanceCriteria ?? card.request}</p>{card.founderReview && <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-200">Founder review: {card.founderReview}</p>}</article>)}
        {staffCards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có WorkCard gắn AI staff.</p>}
      </div>
    </section>
  );
}
