// ============================================================
// MARKETING COMMAND CENTER KNOWLEDGE — LedgerFlow Studio
// ============================================================

export interface ChannelKPI {
  channel: string;
  emoji: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  benchmarkGood: string;
  costStructure: string;
  vietnamNote: string;
}

export const CHANNEL_KPIS: ChannelKPI[] = [
  {
    channel: 'SEO / Blog',
    emoji: '🔍',
    primaryMetric: 'Organic traffic / tháng',
    secondaryMetrics: ['Keyword ranking top 10', 'Time on page', 'Backlinks mới'],
    benchmarkGood: '> 500 organic visits/tháng sau 6 tháng',
    costStructure: 'Chi phí: thời gian viết content. ROI dài hạn nhưng compound.',
    vietnamNote: 'Từ khóa kế toán VN ít cạnh tranh hơn tiếng Anh. Nên viết cả tiếng Việt + Anh.',
  },
  {
    channel: 'Facebook Group / Organic',
    emoji: '📘',
    primaryMetric: 'Lead từ group / tháng',
    secondaryMetrics: ['Post reach', 'Comment rate', 'DM sau bài đăng'],
    benchmarkGood: '> 5 qualified leads/tháng từ group kế toán',
    costStructure: 'Chi phí: 0đ nếu không quảng cáo. ROI cao nếu content đúng nỗi đau.',
    vietnamNote: 'Group kế toán xây dựng VN có 20k–100k thành viên. Không spam — post value thật.',
  },
  {
    channel: 'Facebook Ads',
    emoji: '💰',
    primaryMetric: 'CPL (Cost Per Lead)',
    secondaryMetrics: ['CTR', 'CPM', 'ROAS', 'Conversion rate landing page'],
    benchmarkGood: 'CPL < 50k VND cho B2B kế toán/SME',
    costStructure: 'Budget tối thiểu 2–5 triệu/tháng để có đủ data. Không nên chạy < 1 triệu.',
    vietnamNote: 'Retargeting website visitor có CPL thấp hơn 60% so với cold audience.',
  },
  {
    channel: 'YouTube Organic',
    emoji: '▶️',
    primaryMetric: 'Views + CTA clicks đến landing page',
    secondaryMetrics: ['Watch time', 'Subscriber growth', 'Referral traffic từ YouTube'],
    benchmarkGood: '> 1.000 views/video trong 30 ngày đầu (kênh nhỏ)',
    costStructure: 'Chi phí: thời gian làm video. ROI sau 3–6 tháng khi kênh có momentum.',
    vietnamNote: 'Niche kế toán VN ít kênh có chất lượng cao. Cơ hội authority thấp cạnh tranh.',
  },
  {
    channel: 'TikTok Organic',
    emoji: '🎵',
    primaryMetric: 'Profile visits + link click (bio)',
    secondaryMetrics: ['Views per video', 'Follower growth rate', 'Share rate'],
    benchmarkGood: '> 10k views/video là bình thường với content giáo dục tốt',
    costStructure: 'Chi phí: thời gian làm video ngắn. ROI nhanh nếu viral.',
    vietnamNote: 'TikTok VN: giờ vàng 19–22h. Content kế toán tips 60s chia sẻ cao.',
  },
  {
    channel: 'Outbound / Cold Outreach',
    emoji: '📧',
    primaryMetric: 'Demo booked / tháng',
    secondaryMetrics: ['Reply rate', 'Meeting rate', 'Close rate từ outbound'],
    benchmarkGood: '> 3 demos/tháng từ 50 contacts cold outreach',
    costStructure: 'Chi phí: thời gian research + message. Không mất tiền quảng cáo.',
    vietnamNote: 'Zalo outreach VN hiệu quả hơn email. LinkedIn B2B tốt cho công ty lớn hơn.',
  },
  {
    channel: 'Referral / Affiliate',
    emoji: '🤝',
    primaryMetric: 'Referred customers / tháng',
    secondaryMetrics: ['Referral conversion rate', 'Commission paid vs revenue', 'Partner activity rate'],
    benchmarkGood: '> 20% revenue từ referral là channel health tốt',
    costStructure: 'Chi phí: commission 15–30%. CAC thấp + trust cao từ giới thiệu.',
    vietnamNote: 'Kế toán dịch vụ VN rất mạnh về referral nếu sản phẩm thực sự giúp được họ.',
  },
  {
    channel: 'Zalo OA / ZNS',
    emoji: '💬',
    primaryMetric: 'Open rate + reply rate',
    secondaryMetrics: ['ZNS delivery rate', 'Conversion từ ZNS', 'OA follower growth'],
    benchmarkGood: 'ZNS open rate > 70% (cao hơn email rất nhiều)',
    costStructure: 'Chi phí: 180–500đ/tin ZNS. ROI rất cao nếu message đúng người.',
    vietnamNote: 'Zalo là kênh ưu tiên số 1 tại VN cho B2B SME. Không thể bỏ qua.',
  },
];

export const NORTH_STAR_METRICS = [
  { name: 'MRR (Monthly Recurring Revenue)', formula: 'paid_customers × ARPU', target: '10 triệu VND/tháng là tồn tại được', tier: 'business' },
  { name: 'Activated Users', formula: 'users đạt Aha Moment / tổng sign-up', target: '> 35%', tier: 'product' },
  { name: 'CAC payback period', formula: 'CAC / Monthly Gross Profit per customer', target: '< 6 tháng', tier: 'marketing' },
  { name: 'Net Revenue Retention (NRR)', formula: '(MRR đầu kỳ + expansion - churn - contraction) / MRR đầu kỳ', target: '> 100% = healthy growth', tier: 'retention' },
  { name: 'Product Qualified Leads (PQL)', formula: 'users với ≥ 10 transactions + ≥ 1 export', target: 'Track monthly, target double QoQ', tier: 'product-sales' },
];

export const BATTLE_CARDS = [
  {
    competitor: 'Excel / Google Sheets',
    strength: 'Miễn phí, quen tay, linh hoạt vô giới hạn',
    weakness: 'Không có real-time alert, dễ lỗi công thức, khó phân quyền, không scale nhiều user',
    ourAdvantage: 'Cảnh báo tự động, audit log người sửa, dashboard 5 KPI tự tổng hợp, không cần biết Excel phức tạp',
    whenWeWin: 'Khi khách có ≥ 2 công trình hoặc ≥ 3 người nhập dữ liệu',
    whenWeLoose: 'Khách chỉ có 1 người, 1 dự án nhỏ, không cần alert',
    talkingPoint: '"Excel là tool. LedgerFlow là hệ thống kiểm soát — giống như nhà bếp nhà hàng vs bếp nhà anh."',
  },
  {
    competitor: 'MISA / Fast Accounting',
    strength: 'Phần mềm kế toán đầy đủ sổ sách, được kiểm toán chấp nhận, nhiều doanh nghiệp quen dùng',
    weakness: 'Không sâu vào quản trị dự án/công trình, kho/dầu/tạm ứng theo luồng công trường là điểm yếu, đắt setup',
    ourAdvantage: 'LedgerFlow KHÔNG thay MISA — làm lớp quản trị TRƯỚC khi hạch toán. Hai thứ bổ sung cho nhau.',
    whenWeWin: 'Khi khách đang dùng MISA nhưng vẫn dùng Excel để theo dõi công trình',
    whenWeLoose: 'Khách chỉ cần phần mềm kế toán thuần túy, không có nhu cầu quản lý dự án',
    talkingPoint: '"Anh/chị dùng MISA cho sổ sách rất tốt. LedgerFlow là bàn làm việc trước khi số liệu vào MISA."',
  },
  {
    competitor: 'AppSheet / Google Sheet nâng cao',
    strength: 'Tùy chỉnh cao, tích hợp Google Workspace, miễn phí tier cơ bản',
    weakness: 'Phải tự build, không có rule nghiệp vụ kế toán, khó maintain khi workflow thay đổi',
    ourAdvantage: 'LedgerFlow có sẵn rule kế toán xây dựng VN, không cần IT build, cập nhật tự động',
    whenWeWin: 'Khi khách đang dùng AppSheet nhưng bị kẹt ở quy trình phức tạp hoặc hỏng công thức',
    whenWeLoose: 'IT department mạnh, muốn full control, không ngại build from scratch',
    talkingPoint: '"AppSheet giỏi về nhập liệu. Nhưng kế toán công trình cần logic nghiệp vụ đặc thù — đó là thứ chúng tôi đã build sẵn."',
  },
  {
    competitor: 'ERP lớn (SAP / Oracle / BRAVO)',
    strength: 'Đầy đủ phân hệ, được tập đoàn lớn tin dùng, tích hợp sâu',
    weakness: 'Triển khai 6–18 tháng, chi phí hàng trăm triệu, quá nặng cho SME',
    ourAdvantage: 'LedgerFlow setup trong 15 phút, giá từ 199k/tháng, dùng được ngay với dữ liệu mẫu',
    whenWeWin: 'Luôn thắng về speed-to-value và total cost với SME < 50 nhân sự',
    whenWeLoose: 'Công ty > 200 nhân sự cần tích hợp chuỗi cung ứng, HR, và kế toán toàn cục',
    talkingPoint: '"ERP là xe tải 10 bánh. LedgerFlow là xe bán tải — đủ chở hàng cho công ty anh/chị và rẻ hơn 50 lần."',
  },
];

  quickWin: string;
}

export const CHANNEL_KPIS: ChannelKPI[] = [
  {
    id: 'seo',
    channel: 'SEO / Blog',
    emoji: 'S',
    primaryMetric: 'Qualified organic visits -> lead magnet downloads',
    benchmarks: ['3-5 bai/thang cho cluster dau tien', 'Lead rate 2-5% voi checklist dung pain', 'Time to signal: 6-12 tuan'],
    vietnamNote: 'Noi dung nen di vao workflow that: daily brief, ho so thieu, tam ung, VAT, sales follow-up.',
    weeklyInputs: ['Visits', 'Downloads', 'Demo requests'],
    quickWin: 'Bien mot checklist noi bo thanh landing page co CTA demo 15 phut.',
  },
  {
    id: 'facebook_organic',
    channel: 'Facebook organic / Community',
    emoji: 'F',
    primaryMetric: 'Meaningful replies and demo conversations',
    benchmarks: ['3 bai/tuần', 'Reply rate 1-3%', '1 case study ngan moi tuan'],
    vietnamNote: 'Can tranh spam group. Nen chia se checklist, case an danh va bai hoc that.',
    weeklyInputs: ['Posts', 'Replies', 'Demos'],
    quickWin: 'Dang mot before/after workflow thay vi gioi thieu tinh nang.',
  },
  {
    id: 'facebook_ads',
    channel: 'Facebook ads',
    emoji: 'A',
    primaryMetric: 'Cost per qualified lead',
    benchmarks: ['Test ngan 300k-1m VND', 'CPL muc tieu tuy persona', 'Dung ads chi sau khi organic message co reply'],
    vietnamNote: 'Khong scale ads khi chua co landing copy va qualification question ro.',
    weeklyInputs: ['Spend', 'Leads', 'Qualified leads'],
    quickWin: 'Chay retargeting nho cho nguoi da tai checklist.',
  },
  {
    id: 'youtube',
    channel: 'YouTube / Short demo',
    emoji: 'Y',
    primaryMetric: 'Demo video completion and assisted leads',
    benchmarks: ['Video 3-6 phut cho workflow', 'Short 30-60s cho pain', 'CTA ve checklist/demo'],
    vietnamNote: 'Quay man hinh dashboard mau hieu qua hon noi ly thuyet dai.',
    weeklyInputs: ['Views', 'Completion', 'Leads'],
    quickWin: 'Lam video 3 phut: "tu du lieu roi rac den daily brief".',
  },
  {
    id: 'outbound',
    channel: 'Outbound sales',
    emoji: 'O',
    primaryMetric: 'Positive reply -> booked demo',
    benchmarks: ['20-50 contacts/tuan', 'Reply 3-8%', 'Demo booked 1-3% cold list'],
    vietnamNote: 'Tin nhan phai theo persona va pain, khong mo dau bang danh sach tinh nang.',
    weeklyInputs: ['Contacts', 'Replies', 'Demos'],
    quickWin: 'Dung battle card de viet tin nhan theo objection cua Excel/MISA/AppSheet.',
  },
  {
    id: 'referral',
    channel: 'Referral / Partner',
    emoji: 'R',
    primaryMetric: 'Partner introduced leads',
    benchmarks: ['1-3 partner chat/tuan', 'High trust, lower volume', 'Track source and promise carefully'],
    vietnamNote: 'Ke toan dich vu, consultant, trainer va agency nho co the la kenh tin cay.',
    weeklyInputs: ['Introductions', 'Partner leads', 'Closed pilots'],
    quickWin: 'Tao referral brief 1 trang: ai phu hop, pain nao, demo nao.',
  },
  {
    id: 'zalo',
    channel: 'Zalo / Direct relationship',
    emoji: 'Z',
    primaryMetric: 'Warm conversation -> follow-up action',
    benchmarks: ['Tin ngan <100 tu', 'CTA nhe', 'Theo doi reply trong 24-48h'],
    vietnamNote: 'Zalo hop voi trust-based selling tai Viet Nam, nhung rat de thanh spam neu khong co permission.',
    weeklyInputs: ['Messages', 'Replies', 'Demos'],
    quickWin: 'Gui checklist hoac screenshot mau, khong gui brochure dai.',
  },
];

export interface BattleCard {
  id: string;
  competitor: string;
  category: string;
  strengths: string[];
  weaknesses: string[];
  ourAdvantage: string[];
  whenWeWin: string;
  whenWeLose: string;
  talkingPoint: string;
}

export const BATTLE_CARDS: BattleCard[] = [
  {
    id: 'excel',
    competitor: 'Excel / Google Sheets',
    category: 'Manual spreadsheet',
    strengths: ['Ai cung biet dung', 'Linh hoat', 'Chi phi thap', 'De copy/sua nhanh'],
    weaknesses: ['De lech version', 'Kho audit trail', 'Khong co next action', 'Kho gom nhieu lane van hanh'],
    ourAdvantage: ['Daily brief theo lane', 'Checklist review', 'Artifact history', 'Local-first workflow co the mo rong sau'],
    whenWeWin: 'Khach dang bi roi version, mat gio tong hop, can review rhythm ro.',
    whenWeLose: 'Khach chi co 1 bang don gian va khong can quy trinh lap lai.',
    talkingPoint: 'Dung Excel tiep cung duoc. LedgerFlow chi them lop daily brief va review de khong mat viec can lam tiep.',
  },
  {
    id: 'misa',
    competitor: 'MISA / AMIS / accounting software',
    category: 'Accounting system',
    strengths: ['Manh ve so sach', 'Pho bien tai Viet Nam', 'Co nghiep vu ke toan sau', 'Dang tin cho compliance'],
    weaknesses: ['Khong phai Company OS', 'Marketing/sales/product khong nam cung luong', 'Khong tap trung simulation/R&D', 'Can quy trinh rieng de ra quyet dinh hang ngay'],
    ourAdvantage: ['Khong thay the accounting system', 'Nam tren lop dieu hanh', 'Ket noi marketing, finance, AI staff, sandbox', 'Dung du lieu mau/offline truoc'],
    whenWeWin: 'Khach da co phan mem ke toan nhung van thieu daily operating layer.',
    whenWeLose: 'Khach can compliance accounting system day du ngay lap tuc.',
    talkingPoint: 'LedgerFlow khong thay MISA. LedgerFlow giup founder va team nhin viec can quyet dinh truoc/sau khi du lieu vao he thong ke toan.',
  },
  {
    id: 'appsheet',
    competitor: 'AppSheet / no-code app',
    category: 'No-code internal tool',
    strengths: ['Lam form nhanh', 'Mobile-friendly', 'Hop voi quy trinh rieng', 'Co the gan Google Sheets'],
    weaknesses: ['De thanh tool roi rac', 'Thieu playbook marketing/sales/finance', 'Khong co simulation lab san', 'Can nguoi thiet ke quy trinh tot'],
    ourAdvantage: ['Co module va playbook san', 'Command Center gom lane', 'Marketing/PLG/accounting lab cung mot noi', 'AI gateway guardrail'],
    whenWeWin: 'Khach can he dieu hanh va tri thuc mau, khong chi mot form nhap lieu.',
    whenWeLose: 'Khach chi can app mobile nhap lieu cuc ky rieng va co nguoi no-code gioi.',
    talkingPoint: 'AppSheet tot de tao form. LedgerFlow tot de biet form do phuc vu quyet dinh nao va gan vao workflow nao.',
  },
  {
    id: 'erp',
    competitor: 'Full ERP / custom software',
    category: 'Enterprise platform',
    strengths: ['Bao phu nhieu phong ban', 'Tich hop sau', 'Quy trinh chuan hoa', 'Co vendor trien khai'],
    weaknesses: ['Chi phi cao', 'Thoi gian trien khai dai', 'De qua scope', 'Khong phu hop giai doan dang tim product-market fit'],
    ourAdvantage: ['Nhe, thu nhanh', 'Offline-first/static data truoc', 'Phu hop pilot nho', 'Khong ep thay doi toan bo quy trinh'],
    whenWeWin: 'Team can hoc, mo phong, pilot va ra quyet dinh truoc khi dau tu lon.',
    whenWeLose: 'Cong ty da co ngan sach ERP, scope ro, can tich hop day du va compliance vendor.',
    talkingPoint: 'ERP la du an lon. LedgerFlow la phong dieu hanh nhe de thu dung quy trinh truoc khi dau tu lon.',
  },
];

export interface MarketingNorthStarMetric {
  id: string;
  label: string;
  target: string;
  description: string;
  healthRule: string;
}

export const MARKETING_NORTH_STAR_METRICS: MarketingNorthStarMetric[] = [
  {
    id: 'qualified-conversations',
    label: 'Qualified conversations',
    target: '10+/week',
    description: 'So cuoc noi chuyen co pain ro, persona ro va buoc tiep theo ro.',
    healthRule: 'On track neu tang 2 tuan lien tiep va co demo/follow-up.',
  },
  {
    id: 'demo-requests',
    label: 'Demo requests',
    target: '3+/week',
    description: 'Lead tu inbound, outbound, referral hoac content yeu cau xem demo.',
    healthRule: 'At risk neu traffic tang nhung demo khong tang.',
  },
  {
    id: 'artifact-copies',
    label: 'Marketing artifacts copied',
    target: '20+/week',
    description: 'Landing copy, email, battle card, checklist duoc copy/export.',
    healthRule: 'Do usefulness cua tool, khong chi engagement be mat.',
  },
  {
    id: 'pilot-signals',
    label: 'Paid pilot signals',
    target: '1-2/week',
    description: 'Lead hoi gia, scope, data mau, kickoff hoac decision maker.',
    healthRule: 'Off track neu 4 tuan khong co paid signal.',
  },
  {
    id: 'learning-loop',
    label: 'Learning loop closed',
    target: '1 insight/week',
    description: 'Moi tuan co mot insight ve persona, channel, objection hoac copy.',
    healthRule: 'On track khi insight cap nhat vao battle card/copy/email.',
  },
];

export interface QuickWinSuggestion {
  id: string;
  condition: string;
  suggestion: string;
  owner: string;
}

export const QUICK_WIN_SUGGESTIONS: QuickWinSuggestion[] = [
  {
    id: 'low-demo-high-traffic',
    condition: 'Traffic or post views high, demo requests low',
    suggestion: 'Doi CTA sang checklist/demo 15 phut va dat pain cu the len headline.',
    owner: 'Growth operator',
  },
  {
    id: 'many-replies-no-demo',
    condition: 'Replies high, demos low',
    suggestion: 'Them 3 cau hoi qualification va gui one-page demo brief thay vi brochure dai.',
    owner: 'Sales operator',
  },
  {
    id: 'no-paid-signal',
    condition: 'Activated users high, paid signal low',
    suggestion: 'Chay paid pilot scope nho: 1 lane, 1 metric, 1 review meeting.',
    owner: 'Founder',
  },
];

export const MARKETING_COMMAND_BOUNDARY_NOTES = [
  'Du lieu trong module la mo phong/local-first neu chua ket noi backend.',
  'AI chi tao ban nhap; founder hoac nguoi phu trach marketing phai duyet truoc khi gui/publish.',
  'Khong claim "so 1", "tot nhat" hoac so lieu khong co bang chung.',
  'Khong bien marketing thanh spam; uu tien permission, pain ro va gia tri that.',
];
