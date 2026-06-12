export const CT1_PROTECTION_META = {
  code: 'CT1-PROTECT',
  name: 'CT1 Simulation Guard',
  purpose:
    'Bảo vệ mô hình mô phỏng, biểu đồ, giả lập, tab và dữ liệu mẫu hiện có khi cải tiến theo CT1.',
  rule:
    'Không xóa tab cũ, không đổi công thức mô phỏng và không ẩn mô hình nếu chưa có founder approval.'
};

export const CT1_PROTECTED_TABS = [
  'dashboard',
  'score',
  'simulator',
  'decisions',
  'workorders',
  'portfolio',
  'risks',
  'cases',
  'datasets',
  'experiments',
  'agent_ops',
  'ai_ops',
  'agent_sessions',
  'agent_skills',
  'ai_staff',
  'approvals',
  'connectors',
  'fast_mode',
  'fast-review'
];

export const CT1_ALWAYS_VISIBLE_MODEL_SHORTCUTS = [
  { tab: 'dashboard', label: 'Founder Dashboard', reason: 'Bảng điều hành công ty solo founder.' },
  { tab: 'score', label: 'Score lab', reason: 'Mô hình ngân sách, tạm ứng và risk score.' },
  { tab: 'simulator', label: 'What-if Simulator', reason: 'Mô hình GO/HOLD/NO-GO cho ý tưởng, app và game.' },
  { tab: 'portfolio', label: 'Idea Portfolio', reason: 'Chấm điểm ý tưởng thương mại hóa.' },
  { tab: 'decisions', label: 'Decision Log', reason: 'Nhật ký quyết định và bằng chứng của founder.' },
  { tab: 'workorders', label: 'AI Work Orders', reason: 'Bảng giao việc cho nhân viên AI/AI agent, luôn cần founder review.' },
  { tab: 'risks', label: 'Risk & Release', reason: 'Kiểm soát rủi ro trước khi release để không phá mô hình cũ.' },
  { tab: 'agent_ops', label: 'AgentOpsHub', reason: 'Hub mới giữ AI Ops, Approval, Connector và Review Mode trong một điểm truy cập.' }
];

export const CT1_MODEL_HEALTH_CHECKS = [
  {
    model: 'Founder Dashboard',
    visibility: 'always-visible',
    mustWork: ['Budget Used card', 'Advance Open card', 'Idea Score card', 'Founder Risk card'],
    failSignal: 'Mở app không thấy dashboard hoặc KPI cards bị mất.'
  },
  {
    model: 'Score lab',
    visibility: 'tab-required',
    mustWork: ['nhập ngân sách', 'nhập chi phí', 'nhập tạm ứng', 'tính risk score'],
    failSignal: 'Không nhập được số hoặc risk score không đổi khi thay input.'
  },
  {
    model: 'Founder What-if Simulator',
    visibility: 'tab-required',
    mustWork: ['chọn scenario', 'tính gross margin', 'tính net profit', 'tính idea score', 'ra GO/HOLD/NO-GO'],
    failSignal: 'Không chọn được scenario hoặc kết luận mô phỏng bị trống.'
  },
  {
    model: 'Idea Portfolio',
    visibility: 'tab-required',
    mustWork: ['render idea cards', 'giữ score hiện tại', 'giữ first MVP', 'giữ monetization'],
    failSignal: 'Ý tưởng còn dữ liệu nhưng score/card không hiện.'
  },
  {
    model: 'Decision Log',
    visibility: 'tab-required',
    mustWork: ['đọc localStorage', 'thêm decision mới', 'giữ reason/evidence/nextAction'],
    failSignal: 'Decision mới mất sau khi refresh hoặc schema bị đổi không migration.'
  },
  {
    model: 'AI Work Orders',
    visibility: 'tab-required',
    mustWork: ['hiện ownerAgent', 'hiện input', 'hiện expectedOutput', 'hiện founderReview'],
    failSignal: 'Work order thiếu founder review hoặc biến thành prompt rời rạc.'
  },
  {
    model: 'Risk & Release',
    visibility: 'tab-required',
    mustWork: ['hiện risk register', 'hiện release checklist', 'giữ cảnh báo không phải ERP'],
    failSignal: 'Release checklist biến mất hoặc không còn cảnh báo bảo vệ mô hình.'
  },
  {
    model: 'AgentOpsHub',
    visibility: 'tab-required',
    mustWork: ['mở route ai_ops', 'mở agent_sessions', 'mở approvals', 'mở connectors', 'mở fast_mode'],
    failSignal: 'Route cũ không mở được AgentOpsHub hoặc tab con bị trống bất thường.'
  }
];

export const CT1_MODEL_VERSION_REGISTRY = [
  {
    model: 'Budget/Risk Score Lab',
    currentVersion: 'v1',
    status: 'protected',
    changePolicy: 'Chỉ nâng version nếu có changelog, công thức mới và giữ v1 để đối chiếu.'
  },
  {
    model: 'Founder What-if Simulator',
    currentVersion: 'v1',
    status: 'protected',
    changePolicy: 'Không đổi gross margin, net profit, productScore, risk hoặc verdict trong cùng version.'
  },
  {
    model: 'Idea Portfolio Score',
    currentVersion: 'v1',
    status: 'protected',
    changePolicy: 'Nếu thêm moat score thì hiển thị như chỉ số bổ sung, không ghi đè score cũ.'
  },
  {
    model: 'Decision Log localStorage',
    currentVersion: 'v1',
    status: 'protected',
    changePolicy: 'Nếu đổi schema phải có migration, không đổi storage key tùy tiện.'
  },
  {
    model: 'AgentOpsHub localStorage',
    currentVersion: 'v1',
    status: 'protected',
    changePolicy: 'Không đổi key localStorage cũ của workboard, sessions, approvals, connectors và review mode nếu chưa có migration.'
  }
];

export const CT1_RELEASE_AUDIT_CHECKLIST = [
  'Tính năng mới không làm mất tab, mô hình hoặc biểu đồ cũ.',
  'Không đổi công thức simulator hoặc score lab nếu chưa có version note.',
  'App vẫn là learning, R&D, simulation và founder OS; không phải ERP kế toán.',
  'Kế toán/kiểm toán vẫn đa ngành: thương mại, sản xuất, dịch vụ, xây dựng/dự án.',
  'Mọi output AI agent vẫn cần founder review.',
  'Mô phỏng synthetic users phải có bias warning và cần xác minh thực tế.',
  'Ưu tiên free-first, localStorage và static data trước khi thêm backend/tool trả phí.',
  'UI giữ phong cách dark/cyan/card hiện tại.',
  'Các mô hình chính phải luôn truy cập được từ tab chính hoặc pinned shortcuts.',
  'Trước khi merge phải click qua Dashboard, Score lab, Simulator, Portfolio, Decision Log, AI Work Orders và AgentOpsHub.'
];
