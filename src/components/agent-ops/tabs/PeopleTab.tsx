import type { WorkCard, WorkStatus } from '../../../types/agentOps';

const CARD_KEY = 'ledgerflow_aiops_cards_v1';
const LEGACY_STAFF_KEY = 'ledgerflow-ai-staff-assignment-v1';

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
  const staffCards = readStaffCards();
  return (
    <section className="rounded-3xl border border-sky-400/35 bg-sky-400/10 p-4 text-slate-100">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">AI Staff</p>
      <h3 className="mt-1 text-xl font-black text-white">AI Staff Assignment</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">StaffTask đã được gộp vào WorkCard qua các field optional: aiStaff, acceptanceCriteria, founderReview, deadline. Dữ liệu cũ từ ledgerflow-ai-staff-assignment-v1 vẫn được hiển thị để không mất lịch sử.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {staffCards.map((card) => <article key={card.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-sm font-black text-white">{card.title}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{card.aiStaff ?? card.owner} · {card.status}{card.deadline ? ` · ${card.deadline}` : ''}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{card.acceptanceCriteria ?? card.request}</p>{card.founderReview && <p className="mt-2 text-[11px] font-semibold leading-5 text-amber-200">Founder review: {card.founderReview}</p>}</article>)}
        {staffCards.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Chưa có WorkCard gắn AI staff.</p>}
      </div>
    </section>
  );
}
