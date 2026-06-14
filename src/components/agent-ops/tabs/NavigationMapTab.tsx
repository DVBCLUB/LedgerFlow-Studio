import { useMemo, useState } from 'react';
import { companyOSLanes } from '../../../config/companyOSNavigation';
import { appendAgentOpsAudit, readLocalStorageValue, writeLocalStorageValue } from '../storage';

const NAV_MAP_KEY = 'ledgerflow_company_os_navigation_map_v1';

type LaneStatus = 'Core' | 'Next' | 'Template';

type NavigationLane = {
  id: string;
  label: string;
  status: LaneStatus;
  purpose: string;
  owns: string[];
  moveRule: string;
};

const laneDetails: Record<string, Pick<NavigationLane, 'purpose' | 'owns' | 'moveRule'>> = {
  'command-center': {
    purpose: 'Màn hình điều hành chính cho founder.',
    owns: ['daily standup', 'approval summary', 'risk alerts', 'today focus'],
    moveRule: 'Giữ ở lõi app, không gắn với ngành cụ thể.',
  },
  'product-studio': {
    purpose: 'Biến ý tưởng thành work order, code plan, release audit.',
    owns: ['idea portfolio', 'product factory', 'release checklist'],
    moveRule: 'Giữ lõi vì mọi ngành đều cần tạo sản phẩm/quy trình.',
  },
  'marketing-growth': {
    purpose: 'Quản lý content, campaign, SEO, feedback loop.',
    owns: ['content calendar', 'landing ideas', 'growth experiments'],
    moveRule: 'Làm sau khi AgentOps/Founder OS ổn định.',
  },
  'sales-crm': {
    purpose: 'Theo dõi lead, khách hàng, deal, follow-up.',
    owns: ['lead board', 'customer notes', 'sales tasks'],
    moveRule: 'Không trộn vào kế toán; để lane riêng.',
  },
  'finance-accounting': {
    purpose: 'Theo dõi tiền, chi phí, ngân sách, báo cáo tài chính quản trị.',
    owns: ['budget', 'cost tracker', 'cash planning', 'management reports'],
    moveRule: 'Giữ lõi tài chính; phần công trình đưa sang template ngành.',
  },
  'projects-delivery': {
    purpose: 'Quản lý giao việc, tiến độ, delivery, blocker.',
    owns: ['workboard', 'task queue', 'delivery risk'],
    moveRule: 'Giữ lõi; tên công trình chỉ là template ngành.',
  },
  'ai-workforce': {
    purpose: 'Điều phối AI staff, approval, tools, prompts, audit.',
    owns: ['AI staff', 'approval gate', 'tool cards', 'prompt pack'],
    moveRule: 'Đây là xương sống Company OS, giữ ưu tiên cao.',
  },
  'documents-approval': {
    purpose: 'Quản lý chứng từ, SOP, phê duyệt, bằng chứng.',
    owns: ['SOP library', 'approval evidence', 'document checklist'],
    moveRule: 'Giữ lõi theo dạng documents chung, không chỉ hồ sơ công trình.',
  },
  'analytics-sandbox': {
    purpose: 'Phân tích thử nghiệm, mô phỏng, học thuật, game training.',
    owns: ['scenario sandbox', 'simulators', 'data views'],
    moveRule: 'Làm sau khi data model ổn định.',
  },
  'integration-hub': {
    purpose: 'Quản lý connector, registry, test, policy.',
    owns: ['GitHub', 'Google', 'AI Gateway', 'connector logs'],
    moveRule: 'Giữ lõi; mọi external action phải qua approval/audit.',
  },
  'system-settings': {
    purpose: 'Thiết lập app, secrets vault, backup, import/export.',
    owns: ['settings', 'vault', 'backup', 'permissions'],
    moveRule: 'Giữ lõi, nhưng secrets thật phải nằm server-side.',
  },
  'industry-templates': {
    purpose: 'Template ngành như xây dựng, SaaS, dịch vụ, thương mại.',
    owns: ['construction', 'materials', 'fuel', 'delivery templates'],
    moveRule: 'Không để template ngành chiếm navigation lõi.',
  },
};

function toLaneStatus(status: string): LaneStatus {
  if (status === 'template') return 'Template';
  if (status === 'next') return 'Next';
  return 'Core';
}

const seedLanes: NavigationLane[] = companyOSLanes.map((lane) => ({
  id: lane.id,
  label: lane.label,
  status: toLaneStatus(lane.status),
  ...(laneDetails[lane.id] ?? {
    purpose: `${lane.label} lane`,
    owns: [lane.owner, lane.group],
    moveRule: `Route hint: ${lane.routeHint}`,
  }),
}));

function statusTone(status: LaneStatus) {
  if (status === 'Core') return 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100';
  if (status === 'Template') return 'border-violet-400/40 bg-violet-400/10 text-violet-100';
  return 'border-amber-400/40 bg-amber-400/10 text-amber-100';
}

function markdownFor(lanes: NavigationLane[]) {
  return [
    '# Company OS Navigation Map',
    '',
    ...lanes.map((lane) => [
      `## ${lane.label}`,
      `- Status: ${lane.status}`,
      `- Purpose: ${lane.purpose}`,
      `- Owns: ${lane.owns.join(', ')}`,
      `- Rule: ${lane.moveRule}`,
      '',
    ].join('\n')),
    '## Migration rule',
    '- Core lanes stay generic.',
    '- Industry-specific wording moves into templates.',
    '- External action lanes must route through Approval Gate and audit log.',
  ].join('\n');
}

export default function NavigationMapTab() {
  const [query, setQuery] = useState('');
  const [lanes, setLanes] = useState<NavigationLane[]>(() => readLocalStorageValue(NAV_MAP_KEY, seedLanes));

  const visibleLanes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return lanes;
    return lanes.filter((lane) => [lane.label, lane.status, lane.purpose, lane.moveRule, ...lane.owns].join(' ').toLowerCase().includes(keyword));
  }, [lanes, query]);

  const counts = useMemo(() => ({
    core: lanes.filter((lane) => lane.status === 'Core').length,
    next: lanes.filter((lane) => lane.status === 'Next').length,
    template: lanes.filter((lane) => lane.status === 'Template').length,
  }), [lanes]);

  const updateStatus = (lane: NavigationLane, status: LaneStatus) => {
    const next = lanes.map((item) => item.id === lane.id ? { ...item, status } : item);
    setLanes(next);
    writeLocalStorageValue(NAV_MAP_KEY, next);
    appendAgentOpsAudit('NAV_LANE_STATUS_CHANGED', lane.id, `${lane.label} → ${status}`);
  };

  const copyPlan = async () => {
    await navigator.clipboard.writeText(markdownFor(lanes));
    appendAgentOpsAudit('NAV_MAP_COPIED', 'navigation-map', 'Copied Company OS navigation migration map');
  };

  const resetSeed = () => {
    setLanes(seedLanes);
    writeLocalStorageValue(NAV_MAP_KEY, seedLanes);
    appendAgentOpsAudit('NAV_MAP_RESET', 'navigation-map', 'Reset to Company OS navigation registry seed');
  };

  return (
    <section className="rounded-3xl border border-sky-400/30 bg-sky-400/10 p-4 text-slate-100">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">Company OS IA</p>
          <h3 className="mt-1 text-xl font-black text-white">Navigation Map</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">Bản đồ dọn navigation theo registry Company OS: lõi ở trên, template ngành nằm riêng, không để app bị khóa vào kế toán công trình.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-emerald-100">{counts.core} core</span>
          <span className="rounded-full border border-amber-300/40 px-3 py-1 text-amber-100">{counts.next} next</span>
          <span className="rounded-full border border-violet-300/40 px-3 py-1 text-violet-100">{counts.template} template</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search lane, owner, rule..." className="min-w-64 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky-300" />
        <button onClick={copyPlan} className="rounded-xl border border-sky-300/50 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-400/10">Copy migration plan</button>
        <button onClick={resetSeed} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black text-slate-300 hover:border-amber-300 hover:text-amber-100">Reset seed</button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleLanes.map((lane) => (
          <article key={lane.id} className="rounded-2xl border border-slate-800 bg-slate-950/75 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-black text-white">{lane.label}</p>
                <p className="mt-1 text-[11px] font-bold leading-5 text-slate-400">{lane.purpose}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${statusTone(lane.status)}`}>{lane.status}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {lane.owns.map((item) => <span key={item} className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300">{item}</span>)}
            </div>
            <p className="mt-3 rounded-xl border border-slate-800 bg-slate-900/70 p-2 text-[11px] font-semibold leading-5 text-slate-300">{lane.moveRule}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['Core', 'Next', 'Template'] as LaneStatus[]).map((status) => (
                <button key={status} onClick={() => updateStatus(lane, status)} className="rounded-xl border border-slate-700 px-3 py-2 text-[11px] font-black text-slate-300 hover:border-sky-300 hover:text-sky-100">{status}</button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
