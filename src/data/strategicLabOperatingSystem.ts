export const STRATEGIC_LAB_OPERATING_SYSTEM = [
  {
    lab: 'Persona Lab',
    purpose: 'Biến giả thuyết người dùng thành mô phỏng khảo sát có kiểm chứng.',
    coreInputs: ['persona', 'pain point', 'job-to-be-done', 'trigger', 'willingness-to-pay signal'],
    coreOutputs: ['survey script', 'interview notes', 'bias warning', 'validation decision'],
    founderDecision: 'Chỉ chuyển sang build feature nếu persona có pain lặp lại và có tín hiệu muốn dùng hoặc trả tiền.',
    nextBuild: ['persona detail drawer', 'survey answer log', 'evidence strength score']
  },
  {
    lab: 'Finance Lab',
    purpose: 'Kiểm soát burn rate, runway, tool cost và sức khỏe tài chính của solo founder.',
    coreInputs: ['cash available', 'monthly tool cost', 'hosting cost', 'AI cost', 'expected MRR', 'churn rate'],
    coreOutputs: ['burn rate', 'runway months', 'gross margin', 'keep/kill tool recommendation'],
    founderDecision: 'Không mua thêm tool trả phí nếu chưa có use case lặp lại, tiêu chí hủy và tác động rõ tới tốc độ build/bán hàng.',
    nextBuild: ['tool budget ledger', 'runway calculator', 'payment readiness checklist']
  },
  {
    lab: 'Payment Matrix',
    purpose: 'Chọn phương thức thu tiền phù hợp giai đoạn: chuyển khoản thủ công, payment processor hoặc Merchant of Record.',
    coreInputs: ['market', 'customer type', 'digital product or service', 'tax/compliance burden', 'automation need'],
    coreOutputs: ['payment option', 'risk note', 'use/avoid condition', 'next legal/accounting check'],
    founderDecision: 'Chưa bật thanh toán quốc tế nếu chưa hiểu trách nhiệm thuế/hoàn tiền/điều khoản hoặc chưa có paid signal.',
    nextBuild: ['Stripe vs MoR comparison card', 'refund policy checklist', 'terms/privacy readiness']
  },
  {
    lab: 'Distribution Engine',
    purpose: 'Biến case mô phỏng thành nội dung, demo và phản hồi thị trường mà không spam.',
    coreInputs: ['case insight', 'target persona', 'channel', 'demo angle', 'call-to-action'],
    coreOutputs: ['content draft', 'demo script', 'lead note', 'objection list', 'next action'],
    founderDecision: 'AI chỉ soạn nháp. Founder duyệt trước khi đăng/gửi; không auto-post hàng loạt và không hứa thay ERP/kế toán chính thức.',
    nextBuild: ['lead board localStorage', 'content repurpose board', 'anti-spam checklist']
  },
  {
    lab: 'Game Education Lab',
    purpose: 'Thiết kế mini-game giáo dục dựa trên case, lựa chọn, điểm số và hậu quả.',
    coreInputs: ['learning objective', 'scenario', 'choices', 'red flags', 'scoring rule'],
    coreOutputs: ['core loop', 'win/lose condition', 'feedback explanation', 'MVP scope'],
    founderDecision: 'Ưu tiên game 2D/card/decision trước; không làm 3D hoặc asset phức tạp khi chưa có core loop học tập tốt.',
    nextBuild: ['audit red flag prototype', 'cash runway decision game', 'PMF decision game']
  }
];

export const STRATEGIC_LAB_HEALTH_CHECKS = [
  {
    lab: 'Persona Lab',
    mustHave: ['persona rõ', 'pain point cụ thể', 'bias warning', 'validation question'],
    failSignal: 'Persona chỉ là mô tả chung chung, không có câu hỏi kiểm chứng hoặc không có warning.'
  },
  {
    lab: 'Finance Lab',
    mustHave: ['burn rate', 'runway', 'tool cost', 'keep/kill rule'],
    failSignal: 'Có dự báo doanh thu nhưng không tính chi phí sống còn hoặc tool cost.'
  },
  {
    lab: 'Payment Matrix',
    mustHave: ['option', 'risk', 'use when', 'avoid when'],
    failSignal: 'Khuyến nghị bật thanh toán mà không có cảnh báo thuế, refund hoặc compliance.'
  },
  {
    lab: 'Distribution Engine',
    mustHave: ['workflow', 'AI role', 'anti-spam rule', 'success metric'],
    failSignal: 'Marketing bị biến thành spam hoặc auto-post không qua founder review.'
  },
  {
    lab: 'Game Education Lab',
    mustHave: ['learning objective', 'core loop', 'scoring', 'MVP scope'],
    failSignal: 'Nhảy vào game/3D/asset trước khi có vòng lặp học tập và scoring rõ.'
  }
];

export const STRATEGIC_LAB_BUILD_SEQUENCE = [
  {
    step: '1',
    title: 'Hiển thị Strategic Labs trong Guard',
    status: 'done',
    rule: 'Không cần sửa App route lớn; đảm bảo founder nhìn thấy lab ngay trong Guard.'
  },
  {
    step: '2',
    title: 'Tạo tab/route Strategic Labs riêng',
    status: 'next',
    rule: 'Chỉ làm khi patch App nhỏ và an toàn; không động vào AccountingVietnam hoặc simulator cũ.'
  },
  {
    step: '3',
    title: 'Thêm localStorage cho lead, survey và tool budget',
    status: 'planned',
    rule: 'Free-first, không thêm backend trước khi có nhu cầu lưu thật.'
  },
  {
    step: '4',
    title: 'Thêm export markdown cho lab report',
    status: 'planned',
    rule: 'Báo cáo phải ghi rõ mô phỏng là giả thuyết, cần kiểm chứng bằng dữ liệu thật.'
  }
];
