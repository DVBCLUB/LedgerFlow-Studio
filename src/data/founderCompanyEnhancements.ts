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
