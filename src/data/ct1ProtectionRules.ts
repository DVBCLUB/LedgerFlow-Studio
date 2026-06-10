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
  'experiments'
];

export const CT1_ALWAYS_VISIBLE_MODEL_SHORTCUTS = [
  { tab: 'dashboard', label: 'Founder Dashboard', reason: 'Bảng điều hành công ty solo founder.' },
  { tab: 'score', label: 'Score lab', reason: 'Mô hình ngân sách, tạm ứng và risk score.' },
  { tab: 'simulator', label: 'What-if Simulator', reason: 'Mô hình GO/HOLD/NO-GO cho ý tưởng, app và game.' },
  { tab: 'portfolio', label: 'Idea Portfolio', reason: 'Chấm điểm ý tưởng thương mại hóa.' },
  { tab: 'decisions', label: 'Decision Log', reason: 'Nhật ký quyết định và bằng chứng của founder.' }
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
  'Các mô hình chính phải luôn truy cập được từ tab chính hoặc pinned shortcuts.'
];
