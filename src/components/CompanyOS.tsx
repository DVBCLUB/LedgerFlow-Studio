import { useMemo, useState } from 'react';

type Tone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue' | 'orange';

type ScoreItem = {
  area: string;
  grade: string;
  tone: Tone;
  next: string;
};

type AgentRole = {
  id: string;
  title: string;
  dept: string;
  tone: Tone;
  task: string;
  prompt: string;
  criteria: string[];
  tools: string[];
  frequency: string;
};

type RoadmapItem = {
  title: string;
  why: string;
  effortHours: number;
  value: string;
  tag: string;
  tone: Tone;
};

type WeekDay = {
  day: string;
  theme: string;
  tone: Tone;
  tasks: string[];
};

const toneClass: Record<Tone, { border: string; bg: string; text: string; chip: string }> = {
  cyan: { border: 'border-cyan-400/35', bg: 'bg-cyan-400/10', text: 'text-cyan-200', chip: 'bg-cyan-300 text-slate-950' },
  violet: { border: 'border-violet-400/35', bg: 'bg-violet-400/10', text: 'text-violet-200', chip: 'bg-violet-300 text-slate-950' },
  emerald: { border: 'border-emerald-400/35', bg: 'bg-emerald-400/10', text: 'text-emerald-200', chip: 'bg-emerald-300 text-slate-950' },
  amber: { border: 'border-amber-400/35', bg: 'bg-amber-400/10', text: 'text-amber-200', chip: 'bg-amber-300 text-slate-950' },
  rose: { border: 'border-rose-400/35', bg: 'bg-rose-400/10', text: 'text-rose-200', chip: 'bg-rose-300 text-slate-950' },
  blue: { border: 'border-blue-400/35', bg: 'bg-blue-400/10', text: 'text-blue-200', chip: 'bg-blue-300 text-slate-950' },
  orange: { border: 'border-orange-400/35', bg: 'bg-orange-400/10', text: 'text-orange-200', chip: 'bg-orange-300 text-slate-950' }
};

const scorecard: ScoreItem[] = [
  { area: 'Định vị sản phẩm', grade: 'A-', tone: 'emerald', next: 'Thêm badge mô phỏng + disclaimer rõ trên landing page.' },
  { area: 'Mô phỏng & synthetic users', grade: 'B', tone: 'cyan', next: 'Build Persona Lab và bias warning trong Synthetic Survey.' },
  { area: 'AI workforce', grade: 'B+', tone: 'cyan', next: 'Gắn task tracker + output QA score cho từng agent.' },
  { area: 'Tài chính solo founder', grade: 'C+', tone: 'amber', next: 'Hoàn thiện SaaS Finance Lab: MRR, runway, MoR decision.' },
  { area: 'Marketing & phân phối', grade: 'C+', tone: 'amber', next: 'Thêm Distribution CRM nhẹ + content calendar Zalo/Facebook.' },
  { area: 'Kế toán/kiểm toán đa ngành', grade: 'B+', tone: 'cyan', next: 'Mở rộng case bank cho thương mại, sản xuất, dịch vụ.' },
  { area: 'Game giáo dục', grade: 'C', tone: 'amber', next: 'Hoàn thiện Game Design Lab MVP + một mini-game release thử.' }
];

const roles: AgentRole[] = [
  {
    id: 'cos', title: 'AI Chief of Staff', dept: 'CEO Office', tone: 'violet',
    task: 'Tổng hợp kế hoạch tuần, ưu tiên backlog, weekly standup và cảnh báo rủi ro.',
    prompt: 'Đọc backlog. Chọn top 3 task ưu tiên nhất, nêu 1 việc nên tạm dừng, rủi ro lớn nhất tuần này và next action cụ thể. Đừng tự quyết thay founder.',
    criteria: ['Top 3 task + lý do chọn', 'Việc nên pause', 'Rủi ro lớn nhất', 'Next action cụ thể'],
    tools: ['Claude', 'GitHub Issues', 'Decision Log'], frequency: 'Sáng thứ 2 hàng tuần'
  },
  {
    id: 'pm', title: 'AI Product Manager', dept: 'Product', tone: 'cyan',
    task: 'Viết PRD, user stories, acceptance criteria, UI copy và GO/NO-GO.',
    prompt: 'Biến ý tưởng thành PRD ngắn: persona, pain point, tối đa 3 MVP features, màn hình chính, data model, acceptance criteria và test cases.',
    criteria: ['Persona rõ', 'Pain point cụ thể', 'MVP tối đa 3 features', 'Edge cases', 'Test cases chạy được'],
    tools: ['Claude', 'Figma Free', 'Obsidian'], frequency: 'Khi có feature mới'
  },
  {
    id: 'dev', title: 'AI Fullstack Dev', dept: 'Engineering', tone: 'emerald',
    task: 'Code tính năng, fix bug, refactor, viết test, review PR.',
    prompt: 'Dựa PRD, đề xuất file cần sửa tối thiểu. Không phá UI hiện tại, không đổi kiến trúc vô lý, có checklist test tay và liệt kê risk kỹ thuật.',
    criteria: ['Không đổi kiến trúc tùy tiện', 'File sửa cụ thể', 'Checklist test đầy đủ', 'Risk kỹ thuật rõ'],
    tools: ['Claude Code', 'VS Code/Cursor', 'GitHub Actions'], frequency: 'Hàng ngày trong sprint build'
  },
  {
    id: 'audit', title: 'AI Internal Auditor', dept: 'Audit & Risk', tone: 'amber',
    task: 'Review feature trước release, kiểm tra compliance, risk scoring.',
    prompt: 'Rà soát feature theo rủi ro dữ liệu, quyền duyệt, hiểu nhầm pháp lý/kế toán, lỗi UX, lỗi mô phỏng. Cho GO/HOLD/NO-GO với lý do.',
    criteria: ['Risk list đầy đủ', 'Severity rõ', 'Đề xuất kiểm soát', 'GO/HOLD/NO-GO'],
    tools: ['Claude', 'Release checklist', 'Quality Review'], frequency: 'Trước mỗi release'
  },
  {
    id: 'mkt', title: 'AI Marketer', dept: 'Marketing', tone: 'rose',
    task: 'Viết nội dung Zalo/Facebook/LinkedIn, survey script, demo storyboard.',
    prompt: 'Viết 5 câu hỏi khảo sát pain point + 1 script demo 3 phút. Không hứa thay phần mềm kế toán chính thức. Founder review trước khi post.',
    criteria: ['Có câu hỏi mở', 'Có câu WTP', 'Demo flow rõ', 'Không quảng cáo quá mức'],
    tools: ['Claude', 'Canva', 'Zalo OA', 'CapCut'], frequency: '2-3 lần mỗi tuần'
  },
  {
    id: 'analyst', title: 'AI Data Analyst', dept: 'Research', tone: 'blue',
    task: 'Phân tích survey, market research, ML prototype và anomaly detection.',
    prompt: 'Phân tích kết quả khảo sát. Chỉ ra pattern, outlier, bias, action và cảnh báo kết luận sai khi sample nhỏ.',
    criteria: ['Insight cụ thể', 'Bias warning bắt buộc', 'Action items', 'Confidence level'],
    tools: ['Python Sandbox', 'Google Sheets', 'Pandas/Scikit-learn'], frequency: 'Khi có survey hoặc event logs'
  },
  {
    id: 'fin', title: 'AI Finance Advisor', dept: 'Finance', tone: 'orange',
    task: 'Burn rate, pricing model, MRR simulation, keep/kill tool subscriptions.',
    prompt: 'Tính runway, gross margin, break-even price. Đề xuất keep/kill cho tools, đánh giá pricing theo WTP và MoR phù hợp.',
    criteria: ['Số liệu có nguồn', 'Best/base/worst scenario', 'Tool budget update', 'MoR recommendation'],
    tools: ['Finance Lab', 'Tool Budget', 'Claude'], frequency: 'Hàng tháng + trước đổi giá'
  }
];

const roadmap: RoadmapItem[] = [
  { title: 'Tách AccountingVietnam.tsx', why: 'Component lớn làm AI dễ sửa hỏng và tăng technical debt.', effortHours: 4, value: 'Giảm bug risk', tag: 'Kỹ thuật', tone: 'emerald' },
  { title: 'SaaS Finance Lab đầy đủ', why: 'Founder cần MRR/runway/pricing để quyết định thương mại hóa.', effortHours: 8, value: 'Revenue decision', tag: 'Finance', tone: 'amber' },
  { title: 'Synthetic Persona Lab MVP', why: 'Simulation-first giúp test giả thuyết trước khi khảo sát thật.', effortHours: 6, value: 'R&D velocity', tag: 'Research', tone: 'cyan' },
  { title: 'Company OS / Scorecard tab', why: 'Guardrail để app không drift thành ERP kế toán truyền thống.', effortHours: 3, value: 'Product guardrail', tag: 'Product', tone: 'violet' },
  { title: 'Distribution CRM nhẹ', why: 'Theo dõi lead, pain point và paid signal từ khảo sát thực.', effortHours: 5, value: 'Sales pipeline', tag: 'Marketing', tone: 'rose' },
  { title: 'Game Design Lab MVP', why: 'Game giáo dục là điểm khác biệt với MISA/ERP.', effortHours: 5, value: 'Differentiation', tag: 'Game', tone: 'blue' },
  { title: 'Supabase Auth + RLS', why: 'Nền tảng bắt buộc để đi SaaS proper và workspace/team.', effortHours: 12, value: 'Revenue enabler', tag: 'Kỹ thuật', tone: 'emerald' },
  { title: 'Audit Red Flag mini-game polish', why: 'Game đã có sẵn, nên hoàn thiện để release thử nghiệm viral.', effortHours: 8, value: 'Retention', tag: 'Game', tone: 'blue' }
];

const week: WeekDay[] = [
  { day: 'Thứ 2', theme: 'Planning', tone: 'violet', tasks: ['Chief of Staff chọn top 3 task tuần', 'Update scorecard + risk register', 'Viết work orders cho AI agents', 'Check tool budget', 'Review Idea Portfolio GO/HOLD/NO-GO'] },
  { day: 'Thứ 3', theme: 'Build sprint 1', tone: 'emerald', tasks: ['Claude Code session 2-3h', 'AI PM chốt PRD nếu có feature mới', 'Push PR + chạy check', 'Ghi decision log nếu có quyết định kỹ thuật'] },
  { day: 'Thứ 4', theme: 'Build sprint 2', tone: 'emerald', tasks: ['Hoàn thiện task #2 hoặc fix bug', 'AI Auditor review release', 'Build + kiểm tra desktop', 'Chuẩn bị changelog/demo'] },
  { day: 'Thứ 5', theme: 'R&D & Domain', tone: 'cyan', tasks: ['Đọc tài liệu domain 45 phút', 'Thêm knowledge content vào modules', 'Refine simulation model', 'Data Analyst phân tích survey/event data'] },
  { day: 'Thứ 6', theme: 'Marketing & Sales', tone: 'rose', tasks: ['AI Marketer draft 2 posts', 'Founder review rồi tự post', 'Record demo 3-5 phút', 'Follow up leads từ Distribution CRM'] },
  { day: 'Thứ 7', theme: 'Finance & Strategy', tone: 'amber', tasks: ['Update MRR tracker + tool budget', 'Finance Advisor monthly review', 'Review Idea Portfolio', 'Plan sprint tuần tới'] },
  { day: 'Chủ nhật', theme: 'Rest', tone: 'blue', tasks: ['Nghỉ để bảo vệ creativity', 'Chỉ đọc nhẹ nếu muốn', 'Ghi ý tưởng tự nhiên', 'Không code/commit/deploy'] }
];

const gtmPhases = [
  { phase: 'Tháng 1-3', title: 'Credibility & Community', goal: '100+ followers, 10-20 beta users, 30+ survey responses', actions: ['Zalo group Kế toán AI & Simulation Lab', 'Facebook Page 3 posts/tuần', 'Build-in-public trên LinkedIn', 'Lead magnet: 10 Red Flags kiểm toán xây dựng', 'Survey pain point 8 câu'] },
  { phase: 'Tháng 4-6', title: 'Beta & First Revenue', goal: '50 paying users, MRR 10M VND, NPS > 30', actions: ['Private beta 20 kế toán/founder', 'Lifetime deal giới hạn 30 slots', 'Supabase Auth live', 'Partner content với KOL kế toán', 'Guest post tài chính/SME'] },
  { phase: 'Tháng 7-12', title: 'Scale & Diversify', goal: '200+ users, MRR 50M VND, 2 template packs', actions: ['Product Hunt launch bản English', 'Template/prompt packs', 'Referral program', 'B2B SME package', 'CSV import từ MISA/export kế toán'] }
];

const tabs = [
  { id: 'company', label: 'Công ty OS' },
  { id: 'ai', label: 'AI Workforce' },
  { id: 'roadmap', label: 'P0 Roadmap' },
  { id: 'revenue', label: 'Doanh thu' },
  { id: 'ops', label: 'Vận hành' },
  { id: 'gtm', label: 'GTM Vietnam' }
] as const;

type TabId = (typeof tabs)[number]['id'];

function Chip({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${toneClass[tone].chip}`}>{children}</span>;
}

function Panel({ children, tone = 'cyan', className = '' }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  const t = toneClass[tone];
  return <section className={`rounded-3xl border ${t.border} ${t.bg} p-4 ${className}`}>{children}</section>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">LedgerFlow Studio Company OS</p>
      <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">{subtitle}</p>
    </div>
  );
}

function CompanyTab() {
  return (
    <div>
      <SectionTitle title="Công ty thu nhỏ 1 người" subtitle="Founder là CEO, AI là nhân viên theo vai trò. Module này biến bảng đánh giá Claude thành dashboard vận hành trong app." />
      <Panel tone="cyan" className="mb-4 text-center">
        <div className="mx-auto inline-flex flex-col items-center gap-2">
          <div className="rounded-2xl bg-cyan-300 px-6 py-3 text-sm font-black text-slate-950 shadow-lg">FOUNDER / CEO — Quốc Bảo</div>
          <p className="text-xs font-semibold text-slate-400">Người quyết định cuối cùng · AI chỉ đề xuất và soạn nháp</p>
        </div>
        <div className="mx-auto my-4 h-5 w-px bg-slate-600" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => <div key={role.id} className={`rounded-2xl border ${toneClass[role.tone].border} bg-slate-950/50 p-3`}><p className="text-xs font-black text-white">{role.title.replace('AI ', '')}</p><p className={`mt-1 text-[11px] font-bold ${toneClass[role.tone].text}`}>{role.dept}</p></div>)}
        </div>
      </Panel>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {scorecard.map((item) => (
          <Panel key={item.area} tone={item.tone}>
            <div className="flex gap-3">
              <span className={`text-2xl font-black ${toneClass[item.tone].text}`}>{item.grade}</span>
              <div>
                <p className="text-sm font-black text-white">{item.area}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">→ {item.next}</p>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      <Panel tone="emerald">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-200">10 nguyên tắc vận hành</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {[
            ['Founder là CEO, AI là nhân viên', 'AI đề xuất, founder duyệt.'],
            ['Free-first, pay khi có bằng chứng', 'Chỉ trả tiền tool khi ROI rõ.'],
            ['Simulate trước, build sau', 'Mô phỏng giả thuyết rồi mới build lớn.'],
            ['Không phải ERP', 'Tập trung học, R&D, mô phỏng, điều hành.'],
            ['Component nhỏ, data module rõ', 'Dễ test, dễ sửa, ít vỡ app.'],
            ['Offline-first', 'Cloud sync chỉ là tính năng thêm.'],
            ['Guardrail trước release', 'Không bypass checklist dù feature nhỏ.'],
            ['Build in public', 'Biến quá trình build thành content.'],
            ['Mọi feature hỏi: ai trả tiền?', 'Revenue-aware từ ngày đầu.'],
            ['Chủ nhật không code', 'Burnout là rủi ro solo founder lớn.']
          ].map(([title, desc], index) => <div key={title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"><p className="text-xs font-black text-white">{String(index + 1).padStart(2, '0')} · {title}</p><p className="mt-1 text-xs font-semibold text-slate-400">{desc}</p></div>)}
        </div>
      </Panel>
    </div>
  );
}

function AIWorkforceTab() {
  const [selected, setSelected] = useState(roles[0].id);
  const activeRole = roles.find((role) => role.id === selected) ?? roles[0];
  return (
    <div>
      <SectionTitle title="AI Workforce" subtitle="7 vai trò AI có prompt chuẩn, acceptance criteria, tool stack và tần suất rõ ràng." />
      <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
        <div className="space-y-2">
          {roles.map((role) => <button key={role.id} onClick={() => setSelected(role.id)} className={`w-full rounded-2xl border p-3 text-left transition ${selected === role.id ? `${toneClass[role.tone].border} ${toneClass[role.tone].bg}` : 'border-slate-800 bg-slate-950/50 hover:border-emerald-500/40'}`}><p className="text-sm font-black text-white">{role.title}</p><p className="mt-1 text-[11px] font-bold text-slate-400">{role.dept} · {role.frequency}</p></button>)}
        </div>
        <Panel tone={activeRole.tone}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><Chip tone={activeRole.tone}>{activeRole.dept}</Chip><h3 className="mt-3 text-lg font-black text-white">{activeRole.title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{activeRole.task}</p></div></div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Prompt mẫu</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">{activeRole.prompt}</p></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Acceptance criteria</p><ul className="mt-2 space-y-2">{activeRole.criteria.map((item) => <li key={item} className="text-xs font-semibold text-slate-300">✓ {item}</li>)}</ul></div>
            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tools</p><div className="mt-2 flex flex-wrap gap-2">{activeRole.tools.map((tool) => <span key={tool} className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">{tool}</span>)}</div></div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function RoadmapTab() {
  const totalHours = useMemo(() => roadmap.reduce((sum, item) => sum + item.effortHours, 0), []);
  return (
    <div>
      <SectionTitle title="P0 Roadmap" subtitle="Các việc ưu tiên để LedgerFlow đi từ learning/R&D app sang sản phẩm có thể thương mại hóa." />
      <div className="space-y-3">
        {roadmap.map((item, index) => <Panel key={item.title} tone={item.tone}><div className="grid gap-3 md:grid-cols-[3rem_1fr_5rem]"><div className={`text-lg font-black ${toneClass[item.tone].text}`}>#{String(index + 1).padStart(2, '0')}</div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-white">{item.title}</h3><Chip tone={item.tone}>{item.tag}</Chip></div><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{item.why}</p><p className="mt-1 text-[11px] font-bold text-slate-500">Tác động: {item.value}</p></div><div className="text-right"><p className={`text-2xl font-black ${toneClass[item.tone].text}`}>{item.effortHours}h</p><p className="text-[10px] font-bold uppercase text-slate-500">estimate</p></div></div></Panel>)}
      </div>
      <Panel tone="cyan" className="mt-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black text-white">Tổng effort P0</p><p className="mt-1 text-xs font-semibold text-slate-400">Ưu tiên #1 → #4 trước, sau đó mở rộng GTM và SaaS.</p></div><p className="text-4xl font-black text-cyan-200">{totalHours}h</p></div></Panel>
    </div>
  );
}

function RevenueTab() {
  const [users, setUsers] = useState(50);
  const [priceK, setPriceK] = useState(199);
  const [churn, setChurn] = useState(5);
  const grossMrr = useMemo(() => (users * priceK) / 1000, [users, priceK]);
  const netMrr = useMemo(() => grossMrr * (1 - churn / 100), [grossMrr, churn]);
  const arr = useMemo(() => netMrr * 12, [netMrr]);
  return (
    <div>
      <SectionTitle title="Doanh thu" subtitle="Pricing, MRR simulator, template packs và hướng MoR cho sản phẩm số." />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[{ name: 'Starter', price: 'Free', tone: 'blue' as Tone, note: 'Offline modules, localStorage, limited simulations' }, { name: 'Pro', price: '199K VND/tháng', tone: 'cyan' as Tone, note: 'Unlimited simulations, export, AI integration, cloud sync sau' }, { name: 'Team', price: '799K VND/tháng', tone: 'violet' as Tone, note: '5 users/workspace, shared AI work order board, onboarding' }].map((tier) => <Panel key={tier.name} tone={tier.tone}><Chip tone={tier.tone}>{tier.name}</Chip><p className="mt-3 text-xl font-black text-white">{tier.price}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{tier.note}</p></Panel>)}
      </div>
      <Panel tone="emerald">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-200">MRR Simulator</p>
        <div className="mt-4 grid gap-4">
          {[{ label: 'Số users Pro', value: users, set: setUsers, min: 10, max: 500, step: 10, display: `${users} users` }, { label: 'Giá Pro', value: priceK, set: setPriceK, min: 99, max: 499, step: 10, display: `${priceK}K` }, { label: 'Monthly churn', value: churn, set: setChurn, min: 1, max: 25, step: 1, display: `${churn}%` }].map((ctrl) => <label key={ctrl.label} className="block"><span className="flex justify-between text-xs font-bold text-slate-400"><span>{ctrl.label}</span><span className="text-white">{ctrl.display}</span></span><input className="mt-2 w-full" type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value} onChange={(event) => ctrl.set(Number(event.target.value))} /></label>)}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">{[{ label: 'Gross MRR', value: `${grossMrr.toFixed(1)}M` }, { label: 'Net MRR', value: `${netMrr.toFixed(1)}M` }, { label: 'ARR', value: `${arr.toFixed(0)}M` }, { label: 'Margin est.', value: '~85%' }].map((metric) => <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">{metric.label}</p><p className="mt-1 text-xl font-black text-emerald-200">{metric.value}</p><p className="text-[10px] font-bold text-slate-500">VND / mô phỏng</p></div>)}</div>
      </Panel>
      <Panel tone="violet" className="mt-4"><p className="text-sm font-black text-white">Khuyến nghị MoR</p><p className="mt-2 text-xs font-semibold leading-6 text-slate-300">Ưu tiên Polar.sh hoặc Lemon Squeezy khi bán sản phẩm số quốc tế để giảm gánh VAT/GST, chargeback và tax ops cho solo founder.</p></Panel>
    </div>
  );
}

function OpsTab() {
  const [selectedDay, setSelectedDay] = useState(0);
  const current = week[selectedDay];
  return (
    <div>
      <SectionTitle title="Vận hành" subtitle="Nhịp tuần founder, tool stack free-first và burn estimate." />
      <div className="mb-4 flex flex-wrap gap-2">{week.map((item, index) => <button key={item.day} onClick={() => setSelectedDay(index)} className={`rounded-full border px-3 py-2 text-xs font-black transition ${selectedDay === index ? `${toneClass[item.tone].border} ${toneClass[item.tone].bg} text-white` : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-emerald-500/40'}`}>{item.day}</button>)}</div>
      <Panel tone={current.tone} className="mb-4"><Chip tone={current.tone}>{current.theme}</Chip><h3 className="mt-3 text-lg font-black text-white">{current.day}</h3><ul className="mt-3 space-y-2">{current.tasks.map((task) => <li key={task} className="text-sm font-semibold leading-6 text-slate-300">→ {task}</li>)}</ul></Panel>
      <div className="grid gap-3 md:grid-cols-3">{[{ phase: 'Pre-launch', cost: '0 đ/tháng', note: '100% free tier' }, { phase: 'Beta', cost: '~800K-1.2M', note: 'Vercel Pro + Claude/API nhỏ' }, { phase: 'Growth', cost: '~3-5M', note: 'Supabase + ads nhỏ' }].map((item) => <Panel key={item.phase} tone="emerald"><p className="text-xs font-black text-white">{item.phase}</p><p className="mt-2 text-xl font-black text-emerald-200">{item.cost}</p><p className="mt-1 text-xs font-semibold text-slate-400">{item.note}</p></Panel>)}</div>
    </div>
  );
}

function GTMTab() {
  return (
    <div>
      <SectionTitle title="GTM Vietnam" subtitle="3 phase 12 tháng, target khách hàng VN và kênh phân phối ưu tiên." />
      <div className="mb-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">{[{ title: 'Kế toán freelance', wtp: '100-200K/tháng' }, { title: 'Sinh viên kế toán', wtp: '50-100K/tháng' }, { title: 'Chủ SME/founder', wtp: '200-500K/tháng' }, { title: 'Solo dev/tech founder', wtp: '100-300K/tháng' }].map((item) => <Panel key={item.title} tone="cyan"><p className="text-sm font-black text-white">{item.title}</p><p className="mt-2 text-xs font-bold text-emerald-200">WTP: {item.wtp}</p></Panel>)}</div>
      <div className="space-y-3">{gtmPhases.map((phase, index) => <Panel key={phase.phase} tone={index === 0 ? 'cyan' : index === 1 ? 'violet' : 'emerald'}><div className="grid gap-3 md:grid-cols-[7rem_1fr]"><div><Chip tone={index === 0 ? 'cyan' : index === 1 ? 'violet' : 'emerald'}>{phase.phase}</Chip></div><div><h3 className="text-sm font-black text-white">{phase.title}</h3><p className="mt-1 text-xs font-bold text-emerald-200">Mục tiêu: {phase.goal}</p><ul className="mt-3 space-y-2">{phase.actions.map((action) => <li key={action} className="text-xs font-semibold leading-5 text-slate-300">✓ {action}</li>)}</ul></div></div></Panel>)}</div>
    </div>
  );
}

export default function CompanyOS() {
  const [tab, setTab] = useState<TabId>('company');
  return (
    <div className="mx-auto max-w-5xl text-slate-100">
      <div className="mb-5 rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">Founder operating dashboard</p>
        <h2 className="mt-2 text-2xl font-black text-white">LedgerFlow Studio — Company OS</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Bảng đánh giá và kế hoạch vận hành từ Claude được chuyển thành module nội bộ: scorecard, AI workforce, roadmap, revenue, operations và GTM.</p>
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-xs font-black transition ${tab === item.id ? 'bg-emerald-300 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{item.label}</button>)}</div>
      {tab === 'company' && <CompanyTab />}
      {tab === 'ai' && <AIWorkforceTab />}
      {tab === 'roadmap' && <RoadmapTab />}
      {tab === 'revenue' && <RevenueTab />}
      {tab === 'ops' && <OpsTab />}
      {tab === 'gtm' && <GTMTab />}
    </div>
  );
}
