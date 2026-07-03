import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import CompanyOSV2ReadinessPanel from './CompanyOSV2ReadinessPanel';

type Tone = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'blue' | 'orange';

type KnowledgeItem = {
  id: string;
  title: string;
  category: string;
  source: string;
  tags: string;
  content: string;
  priority: 'Cao' | 'Vừa' | 'Thấp';
  createdAt: string;
};

type AgentLane = {
  title: string;
  mission: string;
  tools: string[];
  outputs: string[];
  tone: Tone;
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

const tabs = [
  { id: 'company', label: 'Công ty hôm nay' },
  { id: 'library', label: 'Thư viện tri thức' },
  { id: 'ai', label: 'AI Nhân sự' },
  { id: 'product', label: 'Xưởng Sản phẩm' },
  { id: 'marketing', label: 'Tăng trưởng & Khách hàng' },
  { id: 'sandbox', label: 'Phân tích & Tri thức' },
  { id: 'finance', label: 'Tài chính' },
  { id: 'v2', label: 'Sẵn sàng nâng cấp' }
] as const;

type TabId = (typeof tabs)[number]['id'];

const starterKnowledge: KnowledgeItem[] = [
  {
    id: 'k-001',
    title: 'Định vị LedgerFlow Hub',
    category: 'Chiến lược sản phẩm',
    source: 'Founder note',
    tags: 'company-os, software, ai-agent',
    content: 'LedgerFlow là hệ điều hành cho công ty phần mềm nhỏ: quản trị sản phẩm, marketing, sales, tài chính, AI nhân sự, sandbox, tích hợp GitHub/VS Code/AI Gateway. Không được đóng khung thành công ty xây dựng.',
    priority: 'Cao',
    createdAt: 'Mặc định'
  },
  {
    id: 'k-002',
    title: 'Accounting product lines',
    category: 'Sản phẩm kế toán',
    source: 'Product architecture',
    tags: 'kế toán, xây dựng, dịch vụ, thương mại, sản xuất',
    content: 'Phần mềm kế toán là một dòng sản phẩm. Template ngành gồm xây dựng, dịch vụ, thương mại, sản xuất. Công trình chỉ là template xây dựng, không phải toàn bộ app.',
    priority: 'Cao',
    createdAt: 'Mặc định'
  },
  {
    id: 'k-003',
    title: 'AI Nhân sự là trung tâm điều phối hệ thống',
    category: 'Đội ngũ AI',
    source: 'Founder correction',
    tags: 'ai-nhân-sự, github, vscode, code, push, design',
    content: 'AI Nhân sự không phải HCNS thường. Đây là nơi điều phối AI/AI agent: trả lời câu hỏi, tạo code, review, push qua GitHub, thiết kế UI, liên kết VS Code/Cursor/GitHub, nhận dữ liệu vào và đẩy dữ liệu ra.',
    priority: 'Cao',
    createdAt: 'Mặc định'
  }
];

const agentLanes: AgentLane[] = [
  {
    title: 'AI Điều phối trưởng',
    mission: 'Nhận yêu cầu từ founder, phân loại thành việc hỏi đáp, code, thiết kế, dữ liệu, marketing hoặc tích hợp.',
    tools: ['Cổng AI', 'Bộ điều phối việc', 'Thư viện tri thức'],
    outputs: ['Kế hoạch xử lý', 'Việc giao cho AI khác', 'Danh sách kiểm tra'],
    tone: 'violet'
  },
  {
    title: 'AI Code / Dev Agent',
    mission: 'Tạo code, sửa bug, refactor, viết prompt handoff cho Cursor/VS Code/Copilot và theo dõi CI.',
    tools: ['VS Code', 'Cursor', 'GitHub', 'Bộ kiểm tra CI'],
    outputs: ['Bản sửa', 'Kế hoạch đưa lên GitHub', 'Danh sách kiểm thử', 'Trạng thái build'],
    tone: 'emerald'
  },
  {
    title: 'AI Thiết kế sản phẩm',
    mission: 'Biến ý tưởng thành màn hình, flow, wireframe, PRD, UX copy và cấu trúc module.',
    tools: ['Xưởng Sản phẩm', 'Prompt thiết kế', 'Duyệt ảnh giao diện'],
    outputs: ['Đặc tả sản phẩm', 'Luồng giao diện', 'Tóm tắt component', 'Tiêu chí nghiệm thu'],
    tone: 'cyan'
  },
  {
    title: 'AI Dữ liệu / Tri thức',
    mission: 'Gom dữ liệu từ thư viện, file, log, issue, ghi chú và biến thành context cho AI trả lời đúng.',
    tools: ['Thư viện tri thức', 'Nhập/xuất dữ liệu', 'Sandbox dữ liệu'],
    outputs: ['Gói ngữ cảnh', 'Tóm tắt tri thức', 'Nguồn dữ liệu'],
    tone: 'blue'
  },
  {
    title: 'AI Marketing / Sales',
    mission: 'Tạo nội dung bán hàng, khảo sát thị trường, kịch bản demo, follow-up khách hàng và phân tích funnel.',
    tools: ['Tăng trưởng', 'Bán hàng & Khách hàng', 'Mô phỏng khảo sát'],
    outputs: ['Kế hoạch nội dung', 'Kịch bản demo', 'Ghi chú lead', 'Ý tưởng chiến dịch'],
    tone: 'rose'
  },
  {
    title: 'AI Kiểm soát / Auditor',
    mission: 'Kiểm tra output trước khi dùng: đúng yêu cầu, không lệch hướng, không phá code, không sai nghiệp vụ.',
    tools: ['Danh sách kiểm tra chất lượng', 'GitHub Actions', 'Ghi chú phát hành'],
    outputs: ['Đạt / chờ / dừng', 'Danh sách rủi ro', 'Yêu cầu sửa'],
    tone: 'amber'
  }
];

const productLines = [
  ['LedgerFlow OS', 'Nền tảng Doanh nghiệp AI tự vận hành cho solopreneur: điều phối sản phẩm, AI, dữ liệu, tích hợp, tài chính và tăng trưởng.'],
  ['Accounting for Construction', 'Template kế toán ngành xây dựng: công trình, chi phí, hồ sơ, vật tư nếu cần. Không phải global app.'],
  ['Accounting for Services', 'Dịch vụ, hợp đồng, doanh thu, chi phí nhân sự, nghiệm thu, công nợ.'],
  ['Accounting for Trading', 'Mua bán hàng hóa, tồn kho, biên lợi nhuận, công nợ, hóa đơn.'],
  ['Accounting for Manufacturing', 'NVL, BOM, lệnh sản xuất, thành phẩm, giá thành, lô sản xuất.'],
  ['Game / Learning Products', 'Game kế toán, game kiểm toán, mô phỏng quản trị, học qua tình huống.']
];

function Panel({ children, tone = 'cyan', className = '' }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  const t = toneClass[tone];
  return <section className={`rounded-3xl border ${t.border} ${t.bg} p-4 ${className}`}>{children}</section>;
}

function Chip({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${toneClass[tone].chip}`}>{children}</span>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">LedgerFlow Software Company OS</p>
      <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">{subtitle}</p>
    </div>
  );
}

function CompanyTodayTab() {
  return (
    <div>
      <SectionTitle title="Công ty phần mềm thu nhỏ" subtitle="Founder điều hành một studio sản phẩm: phần mềm kế toán đa ngành, AI tools, game, sandbox, marketing, sales và tích hợp hệ thống." />
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          ['Sản phẩm đang xây', '6 dòng', 'Company OS, accounting templates, AI/data tools, game products', 'emerald' as Tone],
          ['AI điều phối', `${agentLanes.length} lane`, 'AI hỏi đáp, code, thiết kế, data, marketing, kiểm soát', 'violet' as Tone],
          ['Tri thức nội bộ', 'Library-first', 'Mọi ghi chú, quy tắc, prompt, nghiệp vụ đổ về thư viện', 'cyan' as Tone]
        ].map(([title, value, note, tone]) => <Panel key={title} tone={tone as Tone}><Chip tone={tone as Tone}>{title}</Chip><p className="mt-3 text-2xl font-black text-white">{value}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{note}</p></Panel>)}
      </div>
      <Panel tone="amber">
        <p className="text-sm font-black text-white">Nguyên tắc chống lệch hướng</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {[
            'Không biến app thành công ty xây dựng.',
            'Công trình chỉ nằm trong template kế toán xây dựng.',
            'Marketing và Sales là phòng ban bắt buộc vì phần mềm phải bán được.',
            'AI Nhân sự là trung tâm điều phối AI/AI agent/hệ thống.',
            'Thư viện tri thức là nơi gom kiến thức, prompt, nghiệp vụ và dữ liệu.',
            'Sandbox, biểu đồ, mô hình, game là lõi sản phẩm, không phải đồ chơi phụ.'
          ].map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-300">✓ {item}</div>)}
        </div>
      </Panel>
    </div>
  );
}

function KnowledgeLibraryTab() {
  const [items, setItems] = useState<KnowledgeItem[]>(() => {
    try {
      const raw = localStorage.getItem('ledgerflow_knowledge_library_v1');
      return raw ? JSON.parse(raw) as KnowledgeItem[] : starterKnowledge;
    } catch {
      return starterKnowledge;
    }
  });
  const [draft, setDraft] = useState({ title: '', category: 'Sản phẩm', source: '', tags: '', content: '', priority: 'Vừa' as KnowledgeItem['priority'] });
  const [query, setQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('ledgerflow_knowledge_library_v1', JSON.stringify(items));
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => [item.title, item.category, item.source, item.tags, item.content].join(' ').toLowerCase().includes(q));
  }, [items, query]);

  const addKnowledge = () => {
    if (!draft.title.trim() || !draft.content.trim()) return;
    const next: KnowledgeItem = {
      id: `k-${Date.now()}`,
      title: draft.title.trim(),
      category: draft.category.trim() || 'Chưa phân loại',
      source: draft.source.trim() || 'Nhập tay',
      tags: draft.tags.trim(),
      content: draft.content.trim(),
      priority: draft.priority,
      createdAt: new Date().toLocaleString('vi-VN')
    };
    setItems((current) => [next, ...current]);
    setDraft({ title: '', category: draft.category, source: '', tags: '', content: '', priority: 'Vừa' });
  };

  const removeKnowledge = (id: string) => setItems((current) => current.filter((item) => item.id !== id));
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledgerflow-knowledge-library.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionTitle title="Thư viện tri thức" subtitle="Nơi gom kiến thức công ty, nghiệp vụ, prompt, ý tưởng sản phẩm, quy tắc AI, ghi chú khách hàng và dữ liệu context cho AI agent." />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <Panel tone="emerald">
          <p className="text-sm font-black text-white">Nhập kiến thức mới</p>
          <div className="mt-3 grid gap-3">
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300" placeholder="Tiêu đề kiến thức" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <div className="grid gap-2 md:grid-cols-2">
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {['Sản phẩm', 'Kế toán', 'Marketing', 'Sales', 'AI Agent', 'Code/GitHub', 'Thiết kế', 'Game', 'Sandbox', 'Khách hàng', 'Quy trình'].map((cat) => <option key={cat}>{cat}</option>)}
              </select>
              <select className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as KnowledgeItem['priority'] })}>
                {['Cao', 'Vừa', 'Thấp'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300" placeholder="Nguồn: khách hàng, Claude, Gemini, file, cuộc họp..." value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300" placeholder="Tag: ai, github, sales, kế toán..." value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
            <textarea className="min-h-[150px] rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-emerald-300" placeholder="Nhập nội dung kiến thức / quy tắc / prompt / ghi chú..." value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
            <div className="flex flex-wrap gap-2">
              <button onClick={addKnowledge} className="rounded-2xl bg-emerald-300 px-4 py-2 text-xs font-black text-slate-950">Lưu vào thư viện</button>
              <button onClick={exportJson} className="rounded-2xl border border-slate-700 px-4 py-2 text-xs font-black text-slate-300 hover:border-emerald-300">Xuất JSON</button>
            </div>
          </div>
        </Panel>

        <Panel tone="cyan">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-white">Kho kiến thức</p>
              <p className="text-xs font-semibold text-slate-400">{items.length} mục · lưu local trên máy trước, sau này nối cloud/vector database.</p>
            </div>
            <input className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" placeholder="Tìm kiến thức..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="mt-4 max-h-[540px] space-y-3 overflow-y-auto pr-1">
            {filtered.map((item) => <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap gap-2"><Chip tone={item.priority === 'Cao' ? 'rose' : item.priority === 'Vừa' ? 'amber' : 'blue'}>{item.priority}</Chip><span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-black text-slate-300">{item.category}</span></div>
                  <p className="mt-2 text-sm font-black text-white">{item.title}</p>
                </div>
                <button onClick={() => removeKnowledge(item.id)} className="rounded-xl border border-slate-700 px-2 py-1 text-[10px] font-black text-slate-400 hover:border-rose-300 hover:text-rose-200">Xóa</button>
              </div>
              <p className="mt-2 text-xs font-semibold leading-6 text-slate-300 whitespace-pre-wrap">{item.content}</p>
              <p className="mt-2 text-[11px] font-bold text-slate-500">Nguồn: {item.source} · Tag: {item.tags || 'chưa có'} · {item.createdAt}</p>
            </div>)}
            {filtered.length === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm font-semibold text-slate-400">Không tìm thấy kiến thức phù hợp.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AIOpsCenterTab() {
  return (
    <div>
      <SectionTitle title="Đội ngũ AI" subtitle="Giao việc, theo dõi và kiểm soát các agent AI vận hành doanh nghiệp." />
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          ['Dữ liệu vào', 'Tri thức, file, log, issue, prompt, yêu cầu founder', 'blue' as Tone],
          ['Bộ não điều phối', 'AI Gateway + task router + knowledge context', 'violet' as Tone],
          ['Công cụ hành động', 'VS Code, Cursor, GitHub, CI, design, sandbox', 'emerald' as Tone],
          ['Dữ liệu ra', 'Câu trả lời, code, PR plan, thiết kế, báo cáo, task', 'cyan' as Tone]
        ].map(([title, note, tone]) => <Panel key={title} tone={tone as Tone}><Chip tone={tone as Tone}>{title}</Chip><p className="mt-3 text-xs font-semibold leading-5 text-slate-300">{note}</p></Panel>)}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {agentLanes.map((lane) => <Panel key={lane.title} tone={lane.tone}>
          <Chip tone={lane.tone}>{lane.title}</Chip>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">{lane.mission}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Công cụ liên quan</p>
              <div className="mt-2 flex flex-wrap gap-2">{lane.tools.map((tool) => <span key={tool} className="rounded-full border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-300">{tool}</span>)}</div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Output</p>
              <ul className="mt-2 space-y-1">{lane.outputs.map((output) => <li key={output} className="text-xs font-semibold text-slate-300">✓ {output}</li>)}</ul>
            </div>
          </div>
        </Panel>)}
      </div>

      <Panel tone="amber" className="mt-4">
        <p className="text-sm font-black text-white">Luật an toàn khi AI tạo/push code</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {[
            'AI phải đọc Thư viện tri thức và AGENTS.md trước khi sửa code.',
            'Code/push phải đi qua GitHub connector hoặc Dev Handoff, không chạy shell nguy hiểm tự do.',
            'Mỗi task phải có file cần sửa, checklist test, risk và tiêu chí nghiệm thu.',
            'CI Doctor đọc lỗi GitHub Actions rồi tạo prompt sửa lỗi cho VS Code/Cursor.',
            'Founder duyệt cuối cùng trước khi release hoặc đổi kiến trúc lớn.',
            'Mọi output quan trọng phải quay lại Thư viện tri thức để làm context lần sau.'
          ].map((rule) => <div key={rule} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs font-semibold text-slate-300">✓ {rule}</div>)}
        </div>
      </Panel>
    </div>
  );
}

function ProductStudioTab() {
  return (
    <div>
      <SectionTitle title="Xưởng Sản phẩm" subtitle="Quản lý sản phẩm, lộ trình phát triển, lỗi, phản hồi và phát hành." />
      <div className="grid gap-3 md:grid-cols-2">
        {productLines.map(([title, note], index) => <Panel key={title} tone={(['emerald', 'cyan', 'blue', 'orange', 'amber', 'violet'] as Tone[])[index]}><p className="text-sm font-black text-white">{title}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{note}</p></Panel>)}
      </div>
    </div>
  );
}

function MarketingSalesTab() {
  return (
    <div>
      <SectionTitle title="Tăng trưởng & Khách hàng" subtitle="Điều phối marketing, nội dung, cơ hội bán hàng, chăm sóc và hiệu quả kênh." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {[
          ['Định vị', 'LedgerFlow dành cho founder/công ty nhỏ muốn dùng AI để xây, bán và vận hành sản phẩm.'],
          ['Kênh', 'Facebook, Zalo, TikTok, YouTube, GitHub, cộng đồng kế toán, cộng đồng AI/dev.'],
          ['Lead magnet', 'Template kế toán, checklist kiểm toán, mini game, demo sandbox, case study.'],
          ['Demo script', '3 phút: vấn đề → mô phỏng → AI điều phối → xuất báo cáo/tri thức.'],
          ['CRM nhẹ', 'Lead, nhu cầu, ngành, mức đau, đã demo chưa, bước follow-up.'],
          ['AI Marketer', 'Tạo content, survey, landing copy, kịch bản video, email/Zalo follow-up.']
        ].map(([title, note]) => <Panel key={title} tone="rose"><p className="text-sm font-black text-white">{title}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">{note}</p></Panel>)}
      </div>
    </div>
  );
}

function SandboxTab() {
  return (
    <div>
      <SectionTitle title="Phân tích & Tri thức" subtitle="Gom dữ liệu, phân tích, báo cáo và bộ nhớ vận hành của doanh nghiệp." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {['Sandbox SQL', 'Sandbox dữ liệu Python', 'Mô hình tài chính giả định', 'Mô phỏng khảo sát thị trường', 'Dự báo & mô hình học máy', 'Game & học qua tình huống', 'Dữ liệu giả lập', 'Báo cáo & biểu đồ', 'Danh mục mô hình'].map((name, index) => <Panel key={name} tone={(['cyan', 'blue', 'emerald', 'rose', 'violet', 'amber', 'orange', 'cyan', 'emerald'] as Tone[])[index]}><p className="text-sm font-black text-white">{name}</p><p className="mt-2 text-xs font-semibold leading-5 text-slate-400">Khu vực này được đưa lên rõ ràng để phục vụ phân tích và thử nghiệm dữ liệu.</p></Panel>)}
      </div>
    </div>
  );
}

function FinanceTab() {
  const [users, setUsers] = useState(50);
  const [priceK, setPriceK] = useState(199);
  const [churn, setChurn] = useState(5);
  const grossMrr = useMemo(() => (users * priceK) / 1000, [users, priceK]);
  const netMrr = useMemo(() => grossMrr * (1 - churn / 100), [grossMrr, churn]);
  const arr = useMemo(() => netMrr * 12, [netMrr]);
  return (
    <div>
      <SectionTitle title="Tài chính sản phẩm" subtitle="Mô phỏng doanh thu SaaS/template/game: MRR, ARR, churn, giá bán, margin và quyết định giữ/bỏ công cụ." />
      <Panel tone="emerald">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-200">MRR Simulator</p>
        <div className="mt-4 grid gap-4">
          {[{ label: 'Số users Pro', value: users, set: setUsers, min: 10, max: 500, step: 10, display: `${users} users` }, { label: 'Giá Pro', value: priceK, set: setPriceK, min: 99, max: 499, step: 10, display: `${priceK}K` }, { label: 'Monthly churn', value: churn, set: setChurn, min: 1, max: 25, step: 1, display: `${churn}%` }].map((ctrl) => <label key={ctrl.label} className="block"><span className="flex justify-between text-xs font-bold text-slate-400"><span>{ctrl.label}</span><span className="text-white">{ctrl.display}</span></span><input className="mt-2 w-full" type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value} onChange={(event) => ctrl.set(Number(event.target.value))} /></label>)}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">{[{ label: 'Gross MRR', value: `${grossMrr.toFixed(1)}M` }, { label: 'Net MRR', value: `${netMrr.toFixed(1)}M` }, { label: 'ARR', value: `${arr.toFixed(0)}M` }, { label: 'Margin est.', value: '~85%' }].map((metric) => <div key={metric.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] font-black uppercase text-slate-500">{metric.label}</p><p className="mt-1 text-xl font-black text-emerald-200">{metric.value}</p><p className="text-[10px] font-bold text-slate-500">VND / mô phỏng</p></div>)}</div>
      </Panel>
    </div>
  );
}

export default function CompanyOS() {
  const [tab, setTab] = useState<TabId>('company');
  return (
    <div className="mx-auto max-w-6xl text-slate-100">
      <div className="mb-5 rounded-3xl border border-emerald-500/25 bg-slate-950/70 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-300">LedgerFlow OS</p>
        <h2 className="mt-2 text-2xl font-black text-white">LedgerFlow OS</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">Nền tảng Doanh nghiệp AI tự vận hành cho solopreneur: điều phối sản phẩm, tăng trưởng, khách hàng, tài chính, tri thức, đội ngũ AI và tích hợp hệ thống.</p>
      </div>
      <section className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-100">
          <ShieldCheck className="h-4 w-4 text-amber-300" />
          Ranh giới mô phỏng
        </h3>
        <p className="text-xs font-semibold leading-7 text-slate-300">
          Company OS hien la operating dashboard offline-first: nhieu lane dung static data, localStorage va metric mo phong de dieu phoi cong viec truoc khi co backend that.
          Cac goi y, score, brief va checklist chi ho tro ra quyet dinh; founder hoac nguoi duyet cuoi phai xac nhan bang chung that truoc khi release, chi tien, tu van khach hang hoac thay doi quy trinh van hanh.
        </p>
      </section>
      <div className="mb-5 flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${tab === item.id ? 'bg-emerald-300 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'}`}>{item.label}</button>)}
      </div>
      {tab === 'company' && <CompanyTodayTab />}
      {tab === 'library' && <KnowledgeLibraryTab />}
      {tab === 'ai' && <AIOpsCenterTab />}
      {tab === 'product' && <ProductStudioTab />}
      {tab === 'marketing' && <MarketingSalesTab />}
      {tab === 'sandbox' && <SandboxTab />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'v2' && <CompanyOSV2ReadinessPanel />}
    </div>
  );
}
