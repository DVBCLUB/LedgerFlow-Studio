export const FOUNDER_SIMULATOR_SCENARIOS = [
  {
    id: 'commerce-margin',
    name: 'Thương mại: kiểm tra biên lợi nhuận và tồn kho',
    industry: 'Thương mại',
    description: 'Mô phỏng mua hàng bán lại, tồn kho lệch và biên lợi nhuận sau khi trừ giá vốn.',
    inputs: ['doanh thu', 'giá vốn', 'tồn kho lệch', 'chi phí vận hành'],
    outputs: ['gross margin', 'cảnh báo tồn kho', 'đề xuất kiểm soát công nợ và kho'],
    goNoGoRule: 'Đi tiếp nếu biên lợi nhuận đủ tốt, tồn kho lệch dưới ngưỡng và công nợ có bằng chứng đối chiếu.'
  },
  {
    id: 'manufacturing-variance',
    name: 'Sản xuất: lệch định mức và giá thành',
    industry: 'Sản xuất',
    description: 'Mô phỏng BOM, định mức, thực tế tiêu hao, phế phẩm và ảnh hưởng đến giá thành.',
    inputs: ['định mức', 'tiêu hao thực tế', 'sản lượng đạt', 'chi phí sản xuất chung'],
    outputs: ['cost variance', 'yield rate', 'rủi ro phế phẩm hoặc định mức sai'],
    goNoGoRule: 'Đi tiếp nếu mô hình chỉ ra nguyên nhân lệch và có hành động sửa định mức/kho/sản xuất.'
  },
  {
    id: 'service-recognition',
    name: 'Dịch vụ: nghiệm thu, doanh thu và dòng tiền',
    industry: 'Dịch vụ',
    description: 'Mô phỏng dịch vụ theo hợp đồng, tỷ lệ hoàn thành, nghiệm thu và rủi ro ghi nhận doanh thu.',
    inputs: ['giá trị hợp đồng', 'tỷ lệ hoàn thành', 'đã nghiệm thu', 'chi phí nhân sự'],
    outputs: ['doanh thu có thể ghi nhận mô phỏng', 'project margin', 'cảnh báo nghiệm thu'],
    goNoGoRule: 'Đi tiếp nếu có bằng chứng cung cấp dịch vụ, nghiệm thu hoặc rule ghi nhận rõ trong mô phỏng.'
  },
  {
    id: 'construction-advance',
    name: 'Xây dựng/dự án: tạm ứng và vượt ngân sách',
    industry: 'Xây dựng/dự án',
    description: 'Mô phỏng chi phí công trình, tạm ứng treo, hoàn ứng và rủi ro vượt dự toán.',
    inputs: ['ngân sách', 'chi phí thực tế', 'tạm ứng', 'đã hoàn ứng'],
    outputs: ['budget used', 'advance aging risk', 'red/yellow/green warning'],
    goNoGoRule: 'Đi tiếp nếu có quy tắc chặn ứng mới, cảnh báo vượt ngân sách và checklist hoàn ứng.'
  },
  {
    id: 'product-idea',
    name: 'Ý tưởng app/game/phần mềm: chấm điểm thương mại hóa',
    industry: 'Founder R&D',
    description: 'Mô phỏng một ý tưởng trước khi code: vấn đề, khách hàng, MVP, chi phí, kênh bán và khả năng trả tiền.',
    inputs: ['độ đau của vấn đề', 'khách hàng rõ không', 'chi phí MVP', 'khả năng trả tiền', 'độ khó kỹ thuật'],
    outputs: ['idea score', 'MVP scope', 'go/no-go', 'agent cần giao việc tiếp'],
    goNoGoRule: 'Chỉ build khi điểm nhu cầu và khả năng bán cao hơn độ khó kỹ thuật/chi phí.'
  }
];

export const AI_AGENT_TASK_TEMPLATES = [
  {
    agent: 'AI Chief of Staff',
    task: 'Tổng hợp kế hoạch tuần',
    prompt: 'Hãy đọc backlog hiện tại, chọn 3 ưu tiên quan trọng nhất, nêu việc phải dừng và rủi ro lớn nhất. Không tự quyết thay founder.',
    acceptance: ['có top 3 ưu tiên', 'có lý do chọn', 'có việc dừng', 'có rủi ro', 'có đề xuất bước tiếp theo']
  },
  {
    agent: 'AI Product Manager',
    task: 'Viết PRD cho một ý tưởng',
    prompt: 'Biến ý tưởng thành PRD ngắn: người dùng, vấn đề, tính năng MVP, màn hình, dữ liệu cần lưu, tiêu chí nghiệm thu.',
    acceptance: ['persona rõ', 'pain point rõ', 'MVP nhỏ', 'có edge case', 'có test case']
  },
  {
    agent: 'AI Fullstack Dev',
    task: 'Lập trình tính năng nhỏ',
    prompt: 'Dựa trên PRD, đề xuất file cần sửa, thay đổi tối thiểu, không phá UI hiện tại, có checklist test sau khi sửa.',
    acceptance: ['không đổi kiến trúc vô lý', 'có mô tả file sửa', 'có hướng dẫn test', 'có rủi ro kỹ thuật']
  },
  {
    agent: 'AI Auditor',
    task: 'Kiểm toán nội bộ sản phẩm trước release',
    prompt: 'Rà soát feature mới theo rủi ro dữ liệu, quyền duyệt, hiểu nhầm pháp lý/kế toán, lỗi UX và lỗi mô phỏng.',
    acceptance: ['có risk list', 'có severity', 'có kiểm soát đề xuất', 'có quyết định release/hold']
  },
  {
    agent: 'AI Marketer',
    task: 'Tạo kịch bản khảo sát và demo',
    prompt: 'Viết 10 câu hỏi khảo sát pain point, 1 script demo 3 phút và 3 thông điệp định vị không bán như ERP.',
    acceptance: ['có câu hỏi mở', 'có câu hỏi willingness-to-pay', 'có demo flow', 'không hứa thay phần mềm kế toán thật']
  }
];

export const DECISION_LOG_STARTER = [
  {
    decision: 'Không định vị sản phẩm như ERP kế toán',
    reason: 'Tránh cạnh tranh trực diện MISA/Bravo và đúng bản chất learning/R&D/simulation lab.',
    evidence: 'Người dùng cần học, mô phỏng, lập kế hoạch và quản lý AI agent hơn là nhập liệu kế toán thật.',
    nextAction: 'Tăng simulator, case bank, AI agent workspace và founder operating rhythm.'
  },
  {
    decision: 'Ưu tiên free-first tool stack',
    reason: 'Solo founder cần kiểm soát chi phí thấp nhất trước khi có doanh thu.',
    evidence: 'Repo GitHub, hosting free/cheap, AI dùng theo lượt, tài liệu local/markdown đủ cho MVP.',
    nextAction: 'Thêm tool budget và keep/kill rule vào dashboard.'
  }
];

export const PRODUCT_IDEA_SCORE_FACTORS = [
  { factor: 'Pain', meaning: 'Vấn đề có đau, xảy ra thường xuyên, người dùng muốn giải quyết không?', weight: 30 },
  { factor: 'Buyer clarity', meaning: 'Ai trả tiền, ai dùng, ai duyệt mua có rõ không?', weight: 20 },
  { factor: 'MVP cheapness', meaning: 'Có làm bản thử nghiệm rẻ, nhanh, không backend phức tạp không?', weight: 20 },
  { factor: 'Distribution', meaning: 'Có kênh tiếp cận khách hàng rẻ như nội dung, cộng đồng, demo, template không?', weight: 15 },
  { factor: 'Technical risk', meaning: 'Độ khó kỹ thuật, pháp lý, dữ liệu có vượt sức solo founder không?', weight: -15 }
];

export const SURVEY_QUESTION_BANK = [
  'Hiện công việc nào trong kế toán/kiểm toán/vận hành làm bạn mất thời gian nhất?',
  'Bạn đang dùng công cụ nào để học, mô phỏng hoặc lập kế hoạch trước khi triển khai phần mềm?',
  'Nếu có một lab mô phỏng case đa ngành, bạn muốn học ngành nào trước: thương mại, sản xuất, dịch vụ hay xây dựng?',
  'Bạn cần AI agent hỗ trợ việc gì nhất: nghiên cứu, viết tài liệu, lập trình, kiểm thử, marketing hay kiểm toán nội bộ?',
  'Bạn có sẵn sàng trả tiền cho case bank, simulator, prompt pack hoặc template vận hành không? Mức nào là hợp lý?',
  'Điều gì khiến bạn không tin một công cụ AI hỗ trợ kế toán/kiểm toán?',
  'Bạn muốn đầu ra là checklist, sơ đồ, bảng tính, báo cáo PDF, prompt hay code mẫu?',
  'Một tính năng nào nếu có thì bạn sẽ dùng thử ngay trong tuần này?'
];

export const FOUNDER_DAILY_KPI_DASHBOARD = [
  {
    group: 'Learning & Domain Depth',
    purpose: 'Đo mức tiến bộ kiến thức kế toán/kiểm toán/kinh doanh/marketing/dev/ML thay vì chỉ đo số dòng code.',
    kpis: ['case hoàn thành/ngày', 'số ngành đã mô phỏng', 'số red flag hiểu đúng', 'số decision memo có bằng chứng'],
    warning: 'Nếu chỉ code thêm màn hình mà không tăng case mô phỏng, sản phẩm sẽ rỗng kiến thức.'
  },
  {
    group: 'Product & R&D',
    purpose: 'Đo ý tưởng nào đáng build và ý tưởng nào phải dừng.',
    kpis: ['idea score trung bình', 'số giả thuyết đã test', 'số người được khảo sát', 'tỷ lệ GO/HOLD/NO-GO'],
    warning: 'Nếu chưa có khảo sát nhưng đã build lớn, rủi ro lãng phí thời gian rất cao.'
  },
  {
    group: 'AI Workforce',
    purpose: 'Đo hiệu quả nhân viên AI/AI agent như một đội ngũ thật.',
    kpis: ['task giao cho AI', 'task đạt acceptance', 'task phải làm lại', 'prompt tái sử dụng được'],
    warning: 'Nếu AI không có input/output/acceptance rõ thì founder mất quyền kiểm soát.'
  },
  {
    group: 'Cost Control',
    purpose: 'Giữ nguyên tắc chi phí thấp nhất, miễn phí trước, trả phí chỉ khi có bằng chứng.',
    kpis: ['chi phí tool/tháng', 'tool đang dùng thật', 'tool phải hủy', 'chi phí cho mỗi experiment'],
    warning: 'Nếu trả phí trước khi có use case lặp lại, sản phẩm dễ chết vì burn rate.'
  },
  {
    group: 'Commercialization',
    purpose: 'Đo đường ra thị trường: người dùng, demo, nội dung, phản hồi và khả năng trả tiền.',
    kpis: ['demo đã gửi', 'phản hồi thu được', 'lead quan tâm', 'willingness-to-pay signal'],
    warning: 'Nếu không có kênh phân phối, sản phẩm hay vẫn có thể không bán được.'
  }
];

export const AI_AGENT_WORK_ORDER_BOARD = [
  {
    id: 'WO-001',
    status: 'Ready',
    ownerAgent: 'AI Product Manager',
    task: 'Viết PRD cho Simulator đa ngành phiên bản 1',
    input: ['định nghĩa app là learning/R&D lab', 'ngành: thương mại, sản xuất, dịch vụ, xây dựng', 'không cạnh tranh trực tiếp ERP'],
    expectedOutput: ['persona', 'pain point', 'input/output simulator', 'test case', 'scope không làm'],
    founderReview: 'Founder duyệt trước khi giao AI Fullstack Dev code.'
  },
  {
    id: 'WO-002',
    status: 'Ready',
    ownerAgent: 'AI Auditor',
    task: 'Rà soát rủi ro hiểu nhầm pháp lý/kế toán trong nội dung học tập',
    input: ['case bank', 'quiz chứng từ', 'simulation rules', 'boundary statement'],
    expectedOutput: ['risk list', 'severity', 'wording cần sửa', 'disclaimer module'],
    founderReview: 'Không release nếu app khiến người dùng tưởng đây là tư vấn pháp lý/kế toán chính thức.'
  },
  {
    id: 'WO-003',
    status: 'Ready',
    ownerAgent: 'AI Fullstack Dev',
    task: 'Thiết kế localStorage schema cho work order, decision log và experiment log',
    input: ['không backend ở MVP', 'cần export/import JSON', 'không phá UI hiện tại'],
    expectedOutput: ['schema', 'component plan', 'test manual', 'migration note'],
    founderReview: 'Chỉ build sau khi schema đơn giản, có thể copy dữ liệu ra ngoài.'
  },
  {
    id: 'WO-004',
    status: 'Ready',
    ownerAgent: 'AI Marketer',
    task: 'Thiết kế landing page message cho sản phẩm learning simulation lab',
    input: ['không bán như ERP', 'đối tượng solo founder/kế toán/dev học bằng AI', 'chi phí thấp'],
    expectedOutput: ['headline', 'subheadline', '3 use case', 'CTA khảo sát', 'điều không hứa'],
    founderReview: 'Thông điệp phải nói rõ đây là lab mô phỏng, không thay MISA/Bravo.'
  }
];

export const PRODUCT_IDEA_PORTFOLIO = [
  {
    idea: 'Case Bank kế toán/kiểm toán đa ngành',
    targetUser: 'người học kế toán, kế toán viên trẻ, founder muốn hiểu vận hành',
    pain: 8,
    mvpCheapness: 9,
    distribution: 7,
    technicalRisk: 3,
    firstMvp: '50 case có input/output/red flag/quiz, xuất markdown hoặc PDF',
    monetization: 'bán template/case pack giá thấp hoặc gói học theo ngành'
  },
  {
    idea: 'AI Agent Prompt Pack cho solo founder',
    targetUser: 'người tự làm sản phẩm bằng AI nhưng không biết giao việc',
    pain: 9,
    mvpCheapness: 10,
    distribution: 8,
    technicalRisk: 2,
    firstMvp: '100 prompt theo vai trò PM/Dev/QA/Audit/Marketing/Finance',
    monetization: 'bán prompt pack, Notion/Markdown template, khóa hướng dẫn workflow'
  },
  {
    idea: 'Simulator tài chính mini cho ý tưởng app/game',
    targetUser: 'solo founder, sinh viên, người muốn test ý tưởng trước khi code',
    pain: 7,
    mvpCheapness: 8,
    distribution: 6,
    technicalRisk: 4,
    firstMvp: 'what-if simulator nhập chi phí, giá bán, kênh bán, rủi ro kỹ thuật',
    monetization: 'freemium, bán export report hoặc bộ template triển khai'
  },
  {
    idea: 'Game học kiểm toán nội bộ bằng tình huống',
    targetUser: 'người học kiểm toán/kế toán muốn học qua mô phỏng',
    pain: 6,
    mvpCheapness: 5,
    distribution: 5,
    technicalRisk: 7,
    firstMvp: 'prototype 10 tình huống, điểm rủi ro, lựa chọn hành động',
    monetization: 'course/game mini, cần test nhu cầu trước khi đầu tư lớn'
  }
];

export const OPERATING_SOP_LIBRARY = [
  {
    sop: 'SOP-01: Nhận ý tưởng mới',
    trigger: 'Founder hoặc AI đề xuất một ý tưởng app/game/module mới.',
    steps: ['ghi ý tưởng 1 câu', 'xác định người dùng', 'chấm pain/buyer/MVP/distribution/risk', 'giao AI PM viết PRD ngắn', 'đưa vào GO/HOLD/NO-GO'],
    output: 'một idea card có điểm số, bằng chứng và quyết định tiếp theo'
  },
  {
    sop: 'SOP-02: Giao việc cho AI agent',
    trigger: 'Một việc cần AI làm thay founder.',
    steps: ['nêu vai trò AI', 'nêu input', 'nêu output', 'nêu acceptance criteria', 'cấm AI tự quyết phần founder phải duyệt'],
    output: 'work order rõ ràng, có thể copy qua ChatGPT/Claude/Gemini/Copilot'
  },
  {
    sop: 'SOP-03: Release tính năng nhỏ',
    trigger: 'Có code hoặc dữ liệu mới muốn đưa vào app.',
    steps: ['kiểm tra không phá UI cũ', 'test tab liên quan', 'copy report mô phỏng', 'AI Auditor rà soát rủi ro', 'ghi decision log'],
    output: 'release note nhỏ, có lý do và rủi ro còn lại'
  },
  {
    sop: 'SOP-04: Dừng một ý tưởng',
    trigger: 'Ý tưởng có điểm thấp, không có kênh bán hoặc rủi ro kỹ thuật quá cao.',
    steps: ['ghi lý do dừng', 'lưu bài học', 'tách phần có thể tái dùng', 'không để backlog phình ra', 'review lại sau 30 ngày nếu có bằng chứng mới'],
    output: 'kill memo giúp founder tiết kiệm thời gian và tiền'
  }
];

export const FOUNDER_RISK_REGISTER = [
  {
    risk: 'Sản phẩm bị hiểu nhầm là phần mềm kế toán ERP',
    severity: 'High',
    signal: 'người dùng hỏi nhập liệu, xuất báo cáo thuế, thay MISA/Bravo',
    control: 'luôn ghi rõ learning/R&D/simulation lab; không hứa thay phần mềm kế toán thật'
  },
  {
    risk: 'AI bịa kiến thức pháp lý/kế toán',
    severity: 'High',
    signal: 'câu trả lời quá chắc chắn nhưng không có nguồn hoặc không có disclaimer',
    control: 'tách nội dung học tập với tư vấn chính thức; yêu cầu kiểm chứng văn bản hiện hành khi dùng thực tế'
  },
  {
    risk: 'Founder build quá rộng',
    severity: 'Medium',
    signal: 'thêm nhiều tab nhưng không có use case dùng hằng ngày',
    control: 'mỗi tuần chỉ chọn 3 ưu tiên; mỗi module phải có input/output rõ'
  },
  {
    risk: 'Chi phí tool tăng trước doanh thu',
    severity: 'Medium',
    signal: 'nhiều subscription AI/dev/design nhưng ít experiment được hoàn thành',
    control: 'free-first, keep/kill rule theo usage và doanh thu tiềm năng'
  },
  {
    risk: 'Dữ liệu mô phỏng không đủ sâu',
    severity: 'Medium',
    signal: 'case chỉ là mô tả, chưa có số liệu, chưa có red flag, chưa có kết luận',
    control: 'mỗi case phải có dataset, rule tính, cảnh báo và câu hỏi kiểm soát'
  }
];

export const RELEASE_READINESS_CHECKLIST = [
  'Tính năng mới có phục vụ định vị learning/R&D/simulation/company OS không?',
  'Có phá tab cũ, route cũ hoặc dữ liệu cũ không?',
  'Có input/output rõ cho founder hoặc người học không?',
  'Có chỗ nào khiến người dùng hiểu nhầm đây là tư vấn kế toán/pháp lý chính thức không?',
  'Có thể dùng miễn phí/localStorage trước khi cần backend không?',
  'Có thể copy/export kết quả ra ngoài để tránh khóa dữ liệu không?',
  'Có decision log ghi vì sao build và build tiếp bước nào không?',
  'Có checklist test tay để founder tự kiểm không?'
];
