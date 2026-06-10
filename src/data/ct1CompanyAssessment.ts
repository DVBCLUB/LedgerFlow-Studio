export const CT1_META = {
  code: 'CT1',
  name: 'Bảng đánh giá xây dựng công ty phần mềm thu nhỏ bằng AI',
  productPositioning:
    'LedgerFlow-Studio là phần mềm học tập, R&D, mô phỏng, lập kế hoạch sản phẩm/app/game và vận hành công ty solo founder bằng AI/AI agent; không phải ERP kế toán nhập liệu thay MISA AMIS, Bravo.',
  founderRule:
    'Founder là người quyết định cuối cùng. AI/AI agent là nhân viên ảo, phải có input, output, acceptance criteria, guardrail và kiểm toán lại.',
  costRule:
    'Free-first và low-cost-first. Chỉ trả phí khi có bằng chứng sử dụng lặp lại, tăng tốc R&D, hoặc mở đường thương mại hóa.',
  simulationRule:
    'Mô phỏng là năng lực lõi để khảo sát, nghiên cứu, kiểm chứng ý tưởng, test giá, test UX và quyết định GO/HOLD/NO-GO trước khi build lớn.'
};

export const CT1_ASSESSMENT_DIMENSIONS = [
  {
    id: 'tech-stack',
    title: 'Kiến trúc kỹ thuật solo founder',
    scoreTarget: 90,
    currentRisk: 'App dễ bị phình nếu nhồi nhiều tab vào một component; cần tách module và chuẩn hóa dữ liệu.',
    standard:
      'Ưu tiên TypeScript, React/Next.js, Tailwind, Supabase/PostgreSQL, Vercel/free-tier. Giữ một mental model thống nhất để founder và AI dễ sửa code.',
    improvementDirection: [
      'Tách component lớn thành các module nhỏ: Dashboard, Simulator, AI Work Orders, CT1 Scorecard, Knowledge Lab.',
      'Chuẩn hóa toàn bộ dữ liệu thành data modules có schema gần giống nhau.',
      'Thêm test build/lint/checklist trước mỗi release.',
      'Chuẩn bị hướng nâng cấp sang Supabase khi cần auth/database thật, nhưng MVP vẫn ưu tiên localStorage/static data.'
    ],
    softwareModules: ['Architecture Map', 'Tech Stack Scorecard', 'Release Guard', 'Refactor Backlog']
  },
  {
    id: 'ai-workforce',
    title: 'Đội ngũ AI/AI agent như nhân viên công ty',
    scoreTarget: 95,
    currentRisk: 'Nếu chỉ có prompt rời rạc, AI làm lan man và founder mất quyền kiểm soát.',
    standard:
      'Mỗi AI agent phải có vai trò, nhiệm vụ, input, output, acceptance criteria, escalation rule và review bởi founder.',
    improvementDirection: [
      'Thêm AI org chart: CEO Office, Product, Engineering, Audit, Marketing, Finance, Research.',
      'Thêm work order form cho từng AI agent: task, context, expected output, deadline, review status.',
      'Thêm prompt pack theo từng vai trò: PM, Fullstack Dev, Auditor, Marketer, Data Analyst, Game Designer.',
      'Thêm cơ chế chấm điểm chất lượng output AI: đúng yêu cầu, có bằng chứng, không phá cấu trúc, có test.'
    ],
    softwareModules: ['AI Org Chart', 'AI Work Order Board', 'Prompt Pack', 'Output QA Score']
  },
  {
    id: 'simulation-research',
    title: 'Mô phỏng, synthetic users và nghiên cứu thị trường',
    scoreTarget: 95,
    currentRisk: 'Dataset mô phỏng hiện mới là ví dụ; chưa có persona, giả thuyết, bias check và vòng đối chiếu thực tế.',
    standard:
      'Dùng mô phỏng để test ý tưởng, UX, giá, hành vi người học/khách hàng; nhưng phải có guardrail chống ảo tưởng và cần đối chiếu survey thật.',
    improvementDirection: [
      'Thêm Synthetic User Persona Lab: kế toán viên, chủ doanh nghiệp nhỏ, sinh viên, solo founder, giáo viên, game learner.',
      'Thêm giả thuyết nghiên cứu: ai đau vấn đề gì, có trả tiền không, dùng kênh nào, rào cản nào.',
      'Thêm A/B test mô phỏng cho pricing, onboarding, landing page, course/game mechanic.',
      'Thêm bias warning: kết quả AI mô phỏng chỉ là giả thuyết, không thay thế khảo sát thật.'
    ],
    softwareModules: ['Persona Lab', 'Synthetic Survey', 'A/B Simulation', 'Bias & Evidence Guard']
  },
  {
    id: 'finance-mor',
    title: 'Tài chính, burn rate, runway và Merchant of Record',
    scoreTarget: 90,
    currentRisk: 'Founder dễ trả tiền nhiều tool trước khi có doanh thu; khi bán quốc tế dễ vướng thuế nếu chọn sai payment model.',
    standard:
      'Theo dõi burn rate, runway, tool budget, MRR, gross margin, Rule of 40 mô phỏng; ưu tiên MoR như Polar/Lemon Squeezy khi bán sản phẩm số quốc tế.',
    improvementDirection: [
      'Thêm Tool Budget Ledger: tool, giá, lý do dùng, ngày hủy nếu không hiệu quả.',
      'Thêm SaaS Finance Simulator: MRR, churn, gross margin, infra cost, runway, ARR multiple mô phỏng.',
      'Thêm Payment Decision Matrix: Stripe vs MoR, rủi ro thuế, phí, độ phù hợp solo founder.',
      'Thêm checklist trước khi bật thanh toán: chính sách refund, terms, privacy, tax responsibility.'
    ],
    softwareModules: ['Tool Budget', 'SaaS Finance Lab', 'Payment Matrix', 'MoR Readiness']
  },
  {
    id: 'marketing-automation',
    title: 'Marketing, sales, distribution và automation',
    scoreTarget: 90,
    currentRisk: 'Sản phẩm tốt nhưng không có kênh phân phối thì không bán được; tự động hóa quá sớm dễ thành spam.',
    standard:
      'Founder phải có hệ thống phân phối: content, demo, cộng đồng, survey, CRM nhẹ, n8n automation; AI chỉ soạn nháp, founder duyệt trước khi đăng/gửi.',
    improvementDirection: [
      'Thêm Distribution CRM nhẹ: lead, nguồn, pain, phản hồi, next action.',
      'Thêm Content Repurpose Board: từ một case/simulator thành bài viết, video script, demo, email.',
      'Thêm n8n Automation Blueprint: thu lead, gom feedback, tạo ticket, nhắc follow-up.',
      'Thêm anti-spam guardrail: không auto-post hàng loạt, không giả danh con người, founder review.'
    ],
    softwareModules: ['Lead Board', 'Content Engine', 'n8n Blueprint', 'Anti-Spam Guard']
  },
  {
    id: 'accounting-audit-multi-industry',
    title: 'Kế toán - kiểm toán đa ngành dùng cho học tập/mô phỏng',
    scoreTarget: 95,
    currentRisk: 'Dễ bị hiểu nhầm là phần mềm kế toán thay ERP hoặc bị khóa vào ngành xây dựng.',
    standard:
      'Bao phủ thương mại, sản xuất, dịch vụ, xây dựng/dự án. Mục tiêu là học, mô phỏng case, kiểm soát, audit thinking và thiết kế sản phẩm; không phải nhập liệu pháp lý chính thức.',
    improvementDirection: [
      'Thêm case bank theo ngành: mua bán, tồn kho, giá thành, doanh thu dịch vụ, tạm ứng, công nợ, thuế, chi phí không hóa đơn.',
      'Thêm audit red-flag simulator: chứng từ thiếu, doanh thu sai kỳ, tồn kho lệch, định mức sai, công nợ quá hạn.',
      'Thêm learning path từ căn bản đến nâng cao cho kế toán/kiểm toán/finance cho founder.',
      'Thêm warning pháp lý: dữ liệu mô phỏng để học và nghiên cứu, không thay tư vấn thuế/kế toán chính thức.'
    ],
    softwareModules: ['Multi-Industry Case Bank', 'Audit Red Flag Lab', 'Learning Path', 'Legal Disclaimer']
  },
  {
    id: 'game-education',
    title: 'Ứng dụng/game giáo dục và mô hình học tương tác',
    scoreTarget: 85,
    currentRisk: 'Nếu nhảy vào 3D/asset phức tạp quá sớm sẽ quá sức solo founder.',
    standard:
      'Ưu tiên game giáo dục 2D, quiz, scenario, decision game, simulation game. Chỉ dùng 3D khi có asset pack và scope nhỏ.',
    improvementDirection: [
      'Thêm Game Design Lab: core loop, learning objective, win/lose condition, reward, replayability.',
      'Thêm Godot/HTML5 decision matrix: chọn engine theo độ khó và kênh phân phối.',
      'Thêm mini-game mẫu: kiểm toán chứng từ, quản lý cash runway, chọn chiến lược marketing.',
      'Thêm asset rule: dùng 2D/Canva/asset pack trước, tránh text-to-3D chưa kiểm soát được topology.'
    ],
    softwareModules: ['Game Design Lab', 'Engine Matrix', 'Mini Game Backlog', 'Asset Rule']
  }
];

export const CT1_SCORECARD = [
  { area: 'Định vị sản phẩm', target: 'Learning/R&D/Simulation/Founder OS', currentGrade: 'A-', nextUpgrade: 'Thêm CT1 badge và disclaimer trên UI.' },
  { area: 'Mô phỏng', target: 'What-if + synthetic users + A/B testing', currentGrade: 'B', nextUpgrade: 'Thêm Persona Lab và Synthetic Survey.' },
  { area: 'AI workforce', target: 'Agent org chart + work order + output QA', currentGrade: 'B+', nextUpgrade: 'Thêm trạng thái task và score chất lượng output.' },
  { area: 'Tài chính solo founder', target: 'Tool budget + MRR/runway/MoR', currentGrade: 'C+', nextUpgrade: 'Thêm SaaS Finance Lab.' },
  { area: 'Marketing phân phối', target: 'Lead board + content engine + n8n blueprint', currentGrade: 'C+', nextUpgrade: 'Thêm Distribution CRM nhẹ.' },
  { area: 'Kế toán/kiểm toán đa ngành', target: 'Case bank đa ngành + audit red flags', currentGrade: 'B+', nextUpgrade: 'Tăng case cho thương mại/sản xuất/dịch vụ.' },
  { area: 'Game giáo dục', target: '2D decision games + scenario games', currentGrade: 'C', nextUpgrade: 'Thêm Game Design Lab.' }
];

export const CT1_PRIORITY_BACKLOG = [
  {
    priority: 'P0',
    title: 'Thêm CT1 Scorecard vào UI',
    reason: 'Để app luôn bám bảng đánh giá CT1 và không quay lại hướng ERP kế toán.',
    acceptance: ['có tab CT1', 'có scorecard', 'có improvement backlog', 'có cảnh báo không phải ERP']
  },
  {
    priority: 'P0',
    title: 'Tách AccountingVietnam.tsx thành component nhỏ',
    reason: 'Component chính đã dài, nếu tiếp tục nhồi sẽ khó bảo trì và AI dễ sửa hỏng.',
    acceptance: ['không đổi UI hiện tại', 'mỗi tab là component riêng', 'data import rõ ràng', 'build pass']
  },
  {
    priority: 'P1',
    title: 'Synthetic User Persona Lab',
    reason: 'CT1 nhấn mạnh mô phỏng khảo sát/nghiên cứu bằng tác tử sinh tạo.',
    acceptance: ['có persona', 'có pain', 'có willingness-to-pay', 'có bias warning', 'có action next']
  },
  {
    priority: 'P1',
    title: 'SaaS Finance & MoR Simulator',
    reason: 'Solo founder cần kiểm soát burn rate, runway, pricing và rủi ro thuế quốc tế.',
    acceptance: ['nhập MRR', 'nhập tool cost', 'tính runway', 'so sánh Stripe/MoR', 'go/hold recommendation']
  },
  {
    priority: 'P1',
    title: 'Distribution CRM và Content Engine',
    reason: 'Không có phân phối thì sản phẩm không thương mại hóa được.',
    acceptance: ['lead board', 'feedback capture', 'content repurpose', 'anti-spam guardrail']
  },
  {
    priority: 'P2',
    title: 'Game Education Lab',
    reason: 'CT1 mở hướng app/game giáo dục; cần mô hình game nhỏ trước khi build lớn.',
    acceptance: ['core loop', 'learning objective', 'win/lose condition', 'engine choice', 'asset rule']
  }
];

export const CT1_AGENT_PROMPTS = [
  {
    agent: 'AI Chief Architect',
    mission: 'Rà soát kiến trúc theo CT1',
    prompt:
      'Dựa trên CT1, hãy rà soát repo theo các trục: TypeScript mental model, component size, data schema, test/build risk, free-tier readiness. Đề xuất thay đổi nhỏ nhất, không phá UI hiện tại.',
    output: ['architecture score', 'files to refactor', 'risk list', 'safe implementation plan']
  },
  {
    agent: 'AI Research Lead',
    mission: 'Thiết kế mô phỏng synthetic users',
    prompt:
      'Tạo 6 persona người dùng tổng hợp cho sản phẩm học tập/R&D/simulation lab: kế toán viên, chủ SME, sinh viên, solo founder, giáo viên, người học game. Nêu pain, trigger mua, rào cản, câu hỏi khảo sát và bias warning.',
    output: ['persona cards', 'survey questions', 'bias warning', 'validation plan']
  },
  {
    agent: 'AI Finance Controller',
    mission: 'Kiểm soát burn rate và mô hình thanh toán',
    prompt:
      'Thiết kế mô hình Tool Budget + SaaS Finance Lab cho solo founder: MRR, churn, gross margin, tool cost, runway, Stripe vs MoR. Không đưa lời khuyên pháp lý tuyệt đối.',
    output: ['finance fields', 'formula', 'risk warning', 'MoR decision matrix']
  },
  {
    agent: 'AI Growth Operator',
    mission: 'Thiết kế hệ thống phân phối chi phí thấp',
    prompt:
      'Tạo kế hoạch marketing free/low-cost cho LedgerFlow-Studio: content, community, demo, survey, lead board, n8n automation blueprint, anti-spam guardrail.',
    output: ['channels', 'content plan', 'lead workflow', 'automation map', 'guardrail']
  },
  {
    agent: 'AI Game Designer',
    mission: 'Thiết kế mini-game giáo dục',
    prompt:
      'Tạo 3 mini-game giáo dục dựa trên CT1: audit red flag game, cash runway game, product-market-fit decision game. Mỗi game cần core loop, dữ liệu đầu vào, điểm số, win/lose condition, MVP scope.',
    output: ['game concepts', 'core loop', 'scoring', 'MVP scope', 'asset rule']
  }
];

export const CT1_RELEASE_GUARDRAILS = [
  'Không định vị app như phần mềm kế toán nhập liệu/xuất báo cáo thay ERP.',
  'Không khóa nội dung kế toán/kiểm toán vào một ngành; phải bao phủ thương mại, sản xuất, dịch vụ, xây dựng/dự án.',
  'Mọi mô phỏng AI/synthetic users phải ghi rõ là giả thuyết cần kiểm chứng bằng dữ liệu thật.',
  'Mọi tính năng AI agent phải có founder review/human-in-the-loop.',
  'Không thêm tool trả phí nếu chưa có lý do, tần suất dùng và tiêu chí hủy.',
  'Không build game/3D phức tạp trước khi có core loop học tập rõ ràng.',
  'Không nhồi thêm vào component lớn nếu có thể tách module nhỏ.'
];
