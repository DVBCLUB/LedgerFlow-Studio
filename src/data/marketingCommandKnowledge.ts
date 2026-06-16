// ============================================================
// MARKETING COMMAND CENTER KNOWLEDGE — LedgerFlow Studio
// ============================================================

export interface ChannelKPI {
  id: string;
  channel: string;
  emoji: string;
  primaryMetric: string;
  secondaryMetrics: string[];
  benchmarkGood: string;
  costStructure: string;
  vietnamNote: string;
  quickWin: string;
}

export const CHANNEL_KPIS: ChannelKPI[] = [
  {
    id: 'seo',
    channel: 'SEO / Blog',
    emoji: '🔍',
    primaryMetric: 'Qualified organic visits → lead magnet downloads',
    secondaryMetrics: ['Keyword ranking top 10', 'Time on page', 'Checklist downloads', 'Demo requests'],
    benchmarkGood: '> 500 organic visits/tháng sau 6 tháng',
    costStructure: 'Chi phí chính là thời gian viết content. ROI dài hạn nhưng compound.',
    vietnamNote: 'Từ khóa kế toán và vận hành SME Việt Nam còn nhiều khoảng trống. Nên viết bằng tiếng Việt, bám pain thật.',
    quickWin: 'Biến một checklist nội bộ thành landing page có CTA demo 15 phút.',
  },
  {
    id: 'facebook-organic',
    channel: 'Facebook Group / Organic',
    emoji: '📘',
    primaryMetric: 'Meaningful replies → demo conversations',
    secondaryMetrics: ['Post reach', 'Comment rate', 'DM sau bài đăng', 'Demo booked'],
    benchmarkGood: '> 5 qualified leads/tháng từ group kế toán/SME',
    costStructure: '0đ media nếu không chạy quảng cáo, nhưng cần thời gian xây uy tín.',
    vietnamNote: 'Group kế toán/xây dựng có volume tốt nhưng chống spam mạnh. Phải post value thật, case ẩn danh, checklist.',
    quickWin: 'Đăng một bài before/after workflow thay vì giới thiệu danh sách tính năng.',
  },
  {
    id: 'facebook-ads',
    channel: 'Facebook Ads',
    emoji: '💰',
    primaryMetric: 'Cost per qualified lead',
    secondaryMetrics: ['CTR', 'CPM', 'Landing conversion', 'Demo rate'],
    benchmarkGood: 'Test nhỏ 300k–1m VND; scale sau khi organic message có reply',
    costStructure: 'Cần budget đủ để có tín hiệu. Không nên scale khi landing copy chưa rõ.',
    vietnamNote: 'Retargeting người đã xem checklist/demo thường tốt hơn cold audience.',
    quickWin: 'Chạy retargeting nhỏ cho người đã tải checklist hoặc xem landing page.',
  },
  {
    id: 'youtube',
    channel: 'YouTube / Short demo',
    emoji: '▶️',
    primaryMetric: 'Demo video completion → assisted leads',
    secondaryMetrics: ['Views', 'Watch time', 'CTA clicks', 'Referral traffic'],
    benchmarkGood: 'Video 3–6 phút cho workflow; short 30–60s cho pain cụ thể',
    costStructure: 'Chi phí là thời gian quay màn hình và biên tập nhẹ.',
    vietnamNote: 'Niche kế toán/vận hành VN còn thiếu video chất lượng cao. Quay dashboard mẫu hiệu quả hơn nói lý thuyết dài.',
    quickWin: 'Làm video 3 phút: “từ dữ liệu rời rạc đến daily brief”.',
  },
  {
    id: 'outbound',
    channel: 'Outbound / Cold Outreach',
    emoji: '📧',
    primaryMetric: 'Positive reply → booked demo',
    secondaryMetrics: ['Reply rate', 'Meeting rate', 'Objection captured', 'Close rate'],
    benchmarkGood: '20–50 contacts/tuần; reply 3–8% nếu message đúng persona',
    costStructure: 'Không tốn media nhưng tốn research và cá nhân hóa.',
    vietnamNote: 'Zalo/outbound Việt Nam có thể hiệu quả hơn email, nhưng rất dễ thành spam nếu không có permission và pain rõ.',
    quickWin: 'Dùng battle card để viết message theo objection của Excel/MISA/AppSheet.',
  },
  {
    id: 'referral',
    channel: 'Referral / Partner',
    emoji: '🤝',
    primaryMetric: 'Partner introduced leads',
    secondaryMetrics: ['Introductions', 'Partner activity', 'Referral conversion', 'Commission vs revenue'],
    benchmarkGood: '> 20% revenue từ referral là channel health tốt',
    costStructure: 'CAC thấp nhờ trust, chi phí là commission/partner care.',
    vietnamNote: 'Kế toán dịch vụ, consultant, trainer và agency nhỏ có thể là kênh tin cậy.',
    quickWin: 'Tạo referral brief 1 trang: ai phù hợp, pain nào, demo nào.',
  },
  {
    id: 'zalo',
    channel: 'Zalo OA / Direct relationship',
    emoji: '💬',
    primaryMetric: 'Warm conversation → follow-up action',
    secondaryMetrics: ['Open rate', 'Reply rate', 'Demo booked', 'Opt-out'],
    benchmarkGood: 'Tin ngắn <100 từ, CTA nhẹ, follow-up trong 24–48h',
    costStructure: 'Chi phí thấp trên mỗi tin nhưng cần permission rõ.',
    vietnamNote: 'Zalo là kênh ưu tiên tại VN cho SME. Không gửi brochure dài; gửi checklist/screenshot mẫu.',
    quickWin: 'Gửi checklist hoặc screenshot mẫu, không gửi pitch dài.',
  },
];

export interface MarketingDailyBriefItem {
  section: string;
  owner: string;
  question: string;
  output: string;
}

export const MARKETING_DAILY_BRIEF_TEMPLATE: MarketingDailyBriefItem[] = [
  {
    section: 'Channel health',
    owner: 'Growth operator',
    question: 'Kênh nào hôm nay có tín hiệu thật: reply, demo, download, hoặc paid signal?',
    output: 'Chọn 1 kênh ưu tiên trong ngày, không dàn trải quá nhiều channel.',
  },
  {
    section: 'Message learning',
    owner: 'Copy / Founder',
    question: 'Pain hoặc objection nào lặp lại trong comment, DM, demo hoặc email?',
    output: 'Cập nhật headline, battle card hoặc email sequence bằng insight mới.',
  },
  {
    section: 'Pipeline action',
    owner: 'Sales operator',
    question: 'Lead nào cần follow-up trong 24 giờ để không nguội?',
    output: 'Danh sách 3 follow-up quan trọng nhất kèm next step rõ.',
  },
  {
    section: 'Content artifact',
    owner: 'Marketing',
    question: 'Hôm nay cần publish hoặc tái sử dụng asset nào: checklist, post, video, landing section?',
    output: 'Một artifact nhỏ, có CTA rõ, bám pain đang học được.',
  },
  {
    section: 'Founder decision',
    owner: 'Founder',
    question: 'Quyết định marketing nào cần người thật duyệt trước khi chạy?',
    output: 'Approve / hold / revise. Không auto-publish khi chưa duyệt.',
  },
];

export interface MarketingScorecardItem {
  category: string;
  metric: string;
  target: string;
  whyItMatters: string;
  actionWhenLow: string;
}

export const MARKETING_SCORECARD: MarketingScorecardItem[] = [
  {
    category: 'Acquisition',
    metric: 'Qualified conversations',
    target: '10+/week',
    whyItMatters: 'Đo số cuộc nói chuyện có pain rõ, persona rõ và bước tiếp theo rõ.',
    actionWhenLow: 'Đổi CTA sang checklist/demo nhỏ; post case cụ thể thay vì feature list.',
  },
  {
    category: 'Activation',
    metric: 'Demo requests',
    target: '3+/week',
    whyItMatters: 'Traffic không đủ; cần đo ý định xem demo hoặc thử workflow.',
    actionWhenLow: 'Đặt CTA demo gần pain section, thêm screenshot và giảm form fields.',
  },
  {
    category: 'Product signal',
    metric: 'Marketing artifacts copied/exported',
    target: '20+/week',
    whyItMatters: 'Nếu user copy/export copy, email, checklist, nghĩa là tool có utility thật.',
    actionWhenLow: 'Làm template cụ thể hơn theo persona: kế toán, founder, sales, marketing.',
  },
  {
    category: 'Revenue learning',
    metric: 'Paid pilot signals',
    target: '1–2/week',
    whyItMatters: 'Tín hiệu hỏi giá/scope/pilot cho biết offer có thể bán được.',
    actionWhenLow: 'Tạo pilot scope nhỏ: 1 lane, 1 metric, 1 review meeting.',
  },
  {
    category: 'Learning loop',
    metric: 'Insight closed into asset',
    target: '1 insight/week',
    whyItMatters: 'Marketing tốt dần khi insight từ thị trường được cập nhật vào asset.',
    actionWhenLow: 'Mỗi tuần sửa ít nhất 1 battle card, landing block hoặc email dựa trên phản hồi thật.',
  },
];

export interface CompetitorBattleCardBrief {
  competitor: string;
  theyWinWhen: string;
  weWinWhen: string;
  talkingPoint: string;
}

export const BATTLE_CARD_BRIEFS: CompetitorBattleCardBrief[] = [
  {
    competitor: 'Excel / Google Sheets',
    theyWinWhen: 'Khách chỉ có một bảng đơn giản, một người xử lý, không cần quy trình lặp lại.',
    weWinWhen: 'Khách bị rối version, mất giờ tổng hợp, cần daily brief, audit trail và next action rõ.',
    talkingPoint: 'Dùng Excel tiếp cũng được. LedgerFlow thêm lớp daily brief và review để không mất việc cần làm tiếp.',
  },
  {
    competitor: 'MISA / AMIS / Fast Accounting',
    theyWinWhen: 'Khách cần compliance accounting system đầy đủ ngay lập tức.',
    weWinWhen: 'Khách đã có phần mềm kế toán nhưng vẫn thiếu lớp điều hành marketing, sales, finance, AI staff, sandbox.',
    talkingPoint: 'LedgerFlow không thay MISA. LedgerFlow giúp founder nhìn việc cần quyết định trước/sau khi dữ liệu vào hệ thống kế toán.',
  },
  {
    competitor: 'AppSheet / No-code app',
    theyWinWhen: 'Khách chỉ cần app mobile nhập liệu cực kỳ riêng và có người no-code giỏi.',
    weWinWhen: 'Khách cần hệ điều hành và tri thức mẫu, không chỉ một form nhập liệu.',
    talkingPoint: 'AppSheet tốt để tạo form. LedgerFlow tốt để biết form đó phục vụ quyết định nào và gắn vào workflow nào.',
  },
  {
    competitor: 'Full ERP / Custom software',
    theyWinWhen: 'Công ty có ngân sách ERP, scope rõ, cần tích hợp đầy đủ và compliance vendor.',
    weWinWhen: 'Team cần học, mô phỏng, pilot và ra quyết định trước khi đầu tư lớn.',
    talkingPoint: 'ERP là dự án lớn. LedgerFlow là phòng điều hành nhẹ để thử đúng quy trình trước khi đầu tư lớn.',
  },
];

export const NORTH_STAR_METRICS = MARKETING_SCORECARD.map((item) => ({
  name: item.metric,
  formula: item.target,
  target: item.target,
  tier: item.category,
}));

export const MARKETING_NORTH_STAR_METRICS = MARKETING_SCORECARD.map((item, index) => ({
  id: `marketing-north-star-${index + 1}`,
  label: item.metric,
  target: item.target,
  description: item.whyItMatters,
  healthRule: item.actionWhenLow,
}));

export const QUICK_WIN_SUGGESTIONS = MARKETING_SCORECARD.map((item, index) => ({
  id: `quick-win-${index + 1}`,
  condition: `${item.metric} thấp hơn ${item.target}`,
  suggestion: item.actionWhenLow,
  owner: item.category,
}));

export const BATTLE_CARDS = BATTLE_CARD_BRIEFS.map((card, index) => ({
  id: `battle-card-${index + 1}`,
  competitor: card.competitor,
  category: 'Marketing positioning',
  strengths: [card.theyWinWhen],
  weaknesses: [card.weWinWhen],
  ourAdvantage: [card.talkingPoint],
  whenWeWin: card.weWinWhen,
  whenWeLose: card.theyWinWhen,
  talkingPoint: card.talkingPoint,
}));

export const MARKETING_COMMAND_BOUNDARY_NOTES = [
  'Dữ liệu trong module là mô phỏng/local-first nếu chưa kết nối backend.',
  'AI chỉ tạo bản nháp; founder hoặc người phụ trách marketing phải duyệt trước khi gửi/publish.',
  'Không claim “số 1”, “tốt nhất” hoặc số liệu không có bằng chứng.',
  'Không biến marketing thành spam; ưu tiên permission, pain rõ và giá trị thật.',
];
