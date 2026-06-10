export const DEEP_KNOWLEDGE_PRINCIPLES = [
  'Đây là phần mềm học tập, nghiên cứu, mô phỏng và lên kế hoạch ý tưởng lập trình sản phẩm; không phải phần mềm nhập liệu kế toán/xuất báo cáo thay MISA AMIS, Bravo hay ERP chuyên nghiệp.',
  'Kế toán - kiểm toán phải bao phủ đa ngành: thương mại, sản xuất, dịch vụ, xây dựng; không khóa tư duy vào một ngành xây dựng duy nhất.',
  'Sản phẩm được xem như một công ty hoàn chỉnh của solo founder: học kiến thức, khảo sát, mô phỏng, R&D, thiết kế sản phẩm, vận hành AI agent, marketing, bán hàng, tài chính và cải tiến liên tục.',
  'AI và AI agent đóng vai nhân viên: nghiên cứu, phân tích, viết nháp, kiểm thử, mô phỏng, lập kế hoạch; người sáng lập giữ quyền duyệt cuối cùng.',
  'Không chỉ hiển thị chữ; mỗi module nên có checklist, rủi ro, KPI, case mô phỏng, dữ liệu mẫu, prompt mẫu, hành động tiếp theo và tiêu chí đạt.',
  'Luôn tách dữ liệu gốc, dữ liệu xử lý, dữ liệu báo cáo, log kiểm toán và nhật ký quyết định của founder.',
  'Tất cả kiến thức pháp luật, thuế, kế toán, kiểm toán trong app là khung học tập/tham khảo; trước khi áp dụng thật phải kiểm tra văn bản hiện hành và chuyên gia có thẩm quyền.'
];

export const CONSTRUCTION_ACCOUNTING_DOMAINS = [
  { domain: 'Thương mại', scope: 'Mua hàng, bán hàng, tồn kho, chiết khấu, công nợ, hóa đơn, dòng tiền.', mustHave: ['mã hàng', 'NCC/khách hàng', 'giá vốn', 'doanh thu', 'công nợ', 'tồn kho', 'biên lợi nhuận'] },
  { domain: 'Sản xuất', scope: 'BOM, định mức, nguyên vật liệu, nhân công, sản xuất dở dang, thành phẩm, tính giá thành.', mustHave: ['BOM', 'lệnh sản xuất', 'NVL xuất dùng', 'WIP', 'thành phẩm', 'giá thành', 'phế phẩm'] },
  { domain: 'Dịch vụ', scope: 'Hợp đồng dịch vụ, nhân sự thực hiện, doanh thu theo kỳ, chi phí nhân sự, nghiệm thu dịch vụ.', mustHave: ['hợp đồng', 'timesheet', 'biên bản nghiệm thu', 'doanh thu ghi nhận', 'chi phí trực tiếp', 'SLA'] },
  { domain: 'Xây dựng/dự án', scope: 'Công trình, dự toán, vật tư, thầu phụ, nghiệm thu, tạm ứng, hoàn ứng, chi phí theo dự án.', mustHave: ['mã công trình', 'dự toán', 'vật tư', 'thầu phụ', 'nghiệm thu', 'tạm ứng', 'chi phí dở dang'] },
  { domain: 'Kiểm toán nội bộ đa ngành', scope: 'Kiểm soát dữ liệu, phân quyền, phê duyệt, đối chiếu, khóa kỳ, log sửa dữ liệu.', mustHave: ['ai nhập', 'ai duyệt', 'ai sửa', 'lý do sửa', 'bằng chứng', 'đối chiếu', 'ngoại lệ'] },
  { domain: 'Founder finance', scope: 'Ngân sách vận hành, chi phí AI/tool, runway, giá bán, CAC, LTV, lợi nhuận theo sản phẩm.', mustHave: ['ngân sách tháng', 'chi phí tool', 'runway', 'giá gói', 'doanh thu thử nghiệm', 'tỷ lệ chuyển đổi'] }
];

export const COST_TYPE_KNOWLEDGE = [
  { type: 'Mua hàng thương mại', examples: 'mua hàng bán lại, nhập kho, chiết khấu, hàng trả lại', documents: ['đơn đặt hàng', 'hợp đồng/đề nghị mua', 'hóa đơn', 'phiếu nhập kho', 'biên bản giao nhận'], risks: ['giá vốn sai', 'hàng về chưa hóa đơn', 'tồn kho lệch thực tế'], kpis: ['gross margin', 'inventory turnover', 'AP aging'] },
  { type: 'Sản xuất và giá thành', examples: 'NVL chính, NVL phụ, nhân công, chi phí sản xuất chung, WIP', documents: ['BOM/định mức', 'lệnh sản xuất', 'phiếu xuất kho', 'bảng phân bổ chi phí', 'phiếu nhập thành phẩm'], risks: ['sai định mức', 'phân bổ SXC tùy tiện', 'không kiểm soát phế phẩm'], kpis: ['cost variance', 'yield rate', 'WIP aging'] },
  { type: 'Dịch vụ', examples: 'tư vấn, bảo trì, thiết kế, triển khai phần mềm, thuê ngoài dịch vụ', documents: ['hợp đồng dịch vụ', 'timesheet/biên bản làm việc', 'nghiệm thu', 'hóa đơn', 'đối chiếu công nợ'], risks: ['ghi nhận doanh thu sai kỳ', 'thiếu nghiệm thu', 'không tách chi phí trực tiếp'], kpis: ['utilization rate', 'project margin', 'AR aging'] },
  { type: 'Xây dựng/dự án', examples: 'vật tư, nhân công, máy thi công, thầu phụ, dầu, chi phí chung công trình', documents: ['dự toán', 'hợp đồng', 'phiếu nhập/xuất kho', 'nghiệm thu khối lượng', 'hóa đơn', 'hồ sơ thanh toán'], risks: ['vượt dự toán', 'thiếu nghiệm thu', 'chi phí treo lâu', 'tạm ứng quá hạn'], kpis: ['budget used %', 'project margin', 'advance aging'] },
  { type: 'Chi phí không hóa đơn/chứng từ yếu', examples: 'mua lẻ, vận chuyển nhỏ, chi gấp, thuê ngoài nhỏ lẻ', documents: ['đề nghị thanh toán', 'bảng kê/biên nhận', 'giải trình', 'phê duyệt', 'bằng chứng giao nhận nếu có'], risks: ['rủi ro thuế', 'lặp lại nhiều lần', 'không xác minh được người nhận'], kpis: ['tỷ lệ chi không hóa đơn', 'số ngoại lệ/tháng', 'giá trị chi yếu chứng từ'] },
  { type: 'Chi phí AI/tool của solo founder', examples: 'ChatGPT, Claude, Gemini, GitHub, hosting, domain, database, design tool', documents: ['kế hoạch sử dụng tool', 'hóa đơn/biên lai', 'bảng so sánh chi phí', 'đánh giá hiệu quả'], risks: ['đăng ký quá nhiều tool', 'trùng chức năng', 'không đo ROI'], kpis: ['tool cost/month', 'hours saved', 'feature shipped/tool'] }
];

export const DOCUMENT_CHECKLIST_RULES = [
  { scenario: 'Mua hàng thương mại', minimumDocs: ['đơn đặt hàng/hợp đồng', 'hóa đơn', 'phiếu nhập kho', 'biên bản giao nhận', 'đối chiếu công nợ'], redFlags: ['hàng nhập không có chứng từ kho', 'giá mua vượt khung', 'hóa đơn lệch số lượng'] },
  { scenario: 'Sản xuất thành phẩm', minimumDocs: ['BOM/định mức', 'lệnh sản xuất', 'phiếu xuất NVL', 'bảng phân bổ chi phí', 'phiếu nhập thành phẩm'], redFlags: ['NVL âm kho', 'WIP treo lâu', 'tỷ lệ hao hụt bất thường'] },
  { scenario: 'Dịch vụ hoàn thành theo kỳ', minimumDocs: ['hợp đồng dịch vụ', 'timesheet/nhật ký công việc', 'biên bản nghiệm thu', 'hóa đơn', 'đối chiếu công nợ'], redFlags: ['ghi nhận doanh thu trước nghiệm thu', 'không có bằng chứng cung cấp dịch vụ', 'chi phí nhân sự không phân bổ'] },
  { scenario: 'Chi phí xây dựng/dự án', minimumDocs: ['dự toán/hợp đồng', 'đề nghị thanh toán', 'phiếu kho hoặc nghiệm thu', 'hóa đơn/chứng từ', 'phê duyệt'], redFlags: ['thanh toán vượt dự toán', 'thiếu nghiệm thu', 'không gắn mã dự án'] },
  { scenario: 'Tạm ứng - hoàn ứng', minimumDocs: ['đề nghị tạm ứng', 'chứng từ chi tiền', 'bảng kê hoàn ứng', 'chứng từ gốc', 'xác nhận số còn treo'], redFlags: ['ứng mới khi ứng cũ chưa hoàn', 'quá hạn hoàn ứng', 'chi sai mục đích'] },
  { scenario: 'Solo founder dùng AI agent', minimumDocs: ['mục tiêu task', 'prompt giao việc', 'đầu ra mong muốn', 'checklist kiểm tra', 'log quyết định'], redFlags: ['AI tự quyết định thay founder', 'không test đầu ra', 'không lưu prompt/phiên bản'] }
];

export const ACCOUNTING_CONTROL_KPIS = [
  { kpi: 'Gross Margin %', formula: '(revenue - cogs) / revenue', use: 'Học kiểm soát biên lợi nhuận thương mại/dịch vụ/sản phẩm.' },
  { kpi: 'Inventory Turnover', formula: 'cogs / averageInventory', use: 'Mô phỏng tốc độ quay vòng hàng tồn kho.' },
  { kpi: 'Cost Variance %', formula: '(actualCost - standardCost) / standardCost', use: 'So sánh thực tế với định mức trong sản xuất/dự án.' },
  { kpi: 'Budget Used %', formula: 'actualCost / plannedBudget', use: 'Cảnh báo dự án hoặc phòng ban sắp vượt ngân sách.' },
  { kpi: 'Advance Aging', formula: 'today - advanceDate', use: 'Tìm tạm ứng treo quá hạn.' },
  { kpi: 'Document Completeness %', formula: 'availableDocs / requiredDocs', use: 'Biết hồ sơ học tập đủ điều kiện mô phỏng chưa.' },
  { kpi: 'AI Tool ROI', formula: 'hoursSavedValue / toolCost', use: 'Đo hiệu quả chi phí AI/tool cho solo founder.' },
  { kpi: 'Experiment Conversion', formula: 'validatedIdeas / totalIdeas', use: 'Đo tỷ lệ ý tưởng sản phẩm/game/app sau mô phỏng có thể đi tiếp.' }
];

export const MODULE_KNOWLEDGE_AUDIT = [
  { module: 'Accounting & Audit Multi-Industry Lab', roleView: 'Kế toán trưởng + kiểm toán nội bộ', missingKnowledge: ['không được khóa vào xây dựng', 'cần case thương mại/sản xuất/dịch vụ/xây dựng', 'cần phân biệt học tập với nhập liệu thật'], recommendedAdditions: ['case bank đa ngành', 'ma trận chứng từ theo ngành', 'KPI kiểm soát đa ngành'], acceptanceCriteria: 'Người học chọn được ngành, hiểu chứng từ, rủi ro và KPI tương ứng mà không nghĩ đây là ERP nhập liệu.' },
  { module: 'Simulation & Research Lab', roleView: 'Nhà nghiên cứu sản phẩm', missingKnowledge: ['mô hình mô phỏng khảo sát', 'dữ liệu giả lập', 'giả định/tham số', 'đo kết quả'], recommendedAdditions: ['case scenario builder', 'what-if model', 'survey script', 'hypothesis log'], acceptanceCriteria: 'Mỗi ý tưởng app/game/phần mềm có thể được mô phỏng bằng giả định, dữ liệu mẫu và tiêu chí quyết định tiếp tục/dừng.' },
  { module: 'Solo Founder Company OS', roleView: 'CEO một người', missingKnowledge: ['quy trình vận hành công ty', 'phân vai AI nhân viên', 'cadence tuần/tháng', 'sổ quyết định'], recommendedAdditions: ['AI org chart', 'weekly operating rhythm', 'decision log', 'backlog ưu tiên'], acceptanceCriteria: 'Founder biết giao việc cho AI, nhận kết quả, kiểm tra, quyết định và lưu lại tri thức vận hành.' },
  { module: 'AI Agent Workforce', roleView: 'COO/PM quản lý nhân viên AI', missingKnowledge: ['vai trò từng AI', 'chuẩn đầu ra', 'kiểm thử chéo', 'giới hạn quyền AI'], recommendedAdditions: ['AI accountant', 'AI auditor', 'AI dev', 'AI marketer', 'AI researcher', 'AI QA'], acceptanceCriteria: 'Mỗi agent có nhiệm vụ, prompt mẫu, đầu ra, tiêu chí kiểm tra và không được tự duyệt quyết định quan trọng.' },
  { module: 'Low-Cost Tool Stack', roleView: 'CFO tiết kiệm chi phí', missingKnowledge: ['ưu tiên free/cheap', 'tránh tool trùng chức năng', 'đo ROI'], recommendedAdditions: ['tool map theo việc', 'monthly tool budget', 'free-first policy', 'switching rule'], acceptanceCriteria: 'Chi phí vận hành được kiểm soát, mỗi tool có lý do dùng và tiêu chí giữ/bỏ.' }
];

export const ADVANCED_CONSTRUCTION_CASES = [
  { title: 'Thương mại: nhập hàng bán lại nhưng tồn kho lệch', situation: 'Hóa đơn có 100 sản phẩm, kho nhận 96, bán ra 20 trước khi đối chiếu.', accountingFocus: ['giá vốn', 'tồn kho', 'công nợ NCC', 'biên bản thiếu hàng'], controlQuestions: ['có biên bản giao nhận không?', 'ghi nhận thiếu hàng thế nào?', 'có khóa bán khi chưa nhập kho chuẩn không?'] },
  { title: 'Sản xuất: định mức NVL lệch thực tế', situation: 'Định mức 1 sản phẩm dùng 2kg NVL nhưng thực tế 2.4kg, sản lượng đạt thấp.', accountingFocus: ['BOM', 'WIP', 'phế phẩm', 'cost variance'], controlQuestions: ['lệch do hao hụt hay gian lận?', 'có cập nhật định mức không?', 'giá thành có bị đội lên không?'] },
  { title: 'Dịch vụ: nghiệm thu trễ nhưng đã xuất hóa đơn', situation: 'Team đã làm xong 80%, khách chưa ký nghiệm thu, founder muốn ghi nhận doanh thu.', accountingFocus: ['doanh thu theo kỳ', 'nghiệm thu', 'AR', 'rủi ro thu hồi tiền'], controlQuestions: ['đủ điều kiện ghi nhận chưa?', 'bằng chứng cung cấp dịch vụ là gì?', 'cần cảnh báo dòng tiền không?'] },
  { title: 'Xây dựng: tạm ứng công trình quá hạn', situation: 'Chỉ huy trưởng ứng tiền mua vật tư, quá hạn hoàn ứng, chứng từ thiếu hóa đơn.', accountingFocus: ['tạm ứng', 'hoàn ứng', 'chi phí dự án', 'chứng từ yếu'], controlQuestions: ['còn treo bao nhiêu?', 'có ứng mới không?', 'phân loại rủi ro đỏ/vàng/xanh?'] },
  { title: 'Founder: chọn ý tưởng app để thương mại hóa', situation: 'Có 5 ý tưởng app/game, tài nguyên ít, cần mô phỏng nhu cầu và chi phí MVP.', accountingFocus: ['ngân sách R&D', 'chi phí tool', 'giả định doanh thu', 'runway'], controlQuestions: ['ý tưởng nào có khách hàng rõ nhất?', 'MVP rẻ nhất là gì?', 'agent nào kiểm thử giả định?'] }
];

export const FINANCIAL_ACCOUNTING_BLUEPRINT = [
  { area: 'Khung học kế toán đa ngành', add: ['Thương mại: mua-bán-tồn kho-công nợ-biên lợi nhuận', 'Sản xuất: BOM-định mức-WIP-thành phẩm-giá thành', 'Dịch vụ: hợp đồng-timesheet-nghiệm thu-doanh thu theo kỳ', 'Xây dựng: dự toán-công trình-nghiệm thu-tạm ứng-chi phí dở dang'] },
  { area: 'Khung kiểm toán/kiểm soát', add: ['segregation of duties mô phỏng', 'audit trail trước/sau', 'exception log', 'sampling checklist', 'red/yellow/green risk scoring'] },
  { area: 'Founder finance', add: ['ngân sách tool AI', 'runway cá nhân/dự án', 'giá bán thử nghiệm', 'P&L mini theo sản phẩm', 'kill/keep/scale decision'] }
];

export const DATA_AI_CONTROL_FRAMEWORK = [
  { layer: 'Simulation data', checks: ['dữ liệu giả lập không lẫn dữ liệu thật', 'giả định rõ ràng', 'tham số thay đổi được', 'có kết quả what-if'] },
  { layer: 'Knowledge base', checks: ['phân loại theo ngành', 'nguồn/phạm vi áp dụng', 'ngày cập nhật', 'mức độ chắc chắn'] },
  { layer: 'AI guardrail', checks: ['AI chỉ đề xuất', 'không tự duyệt pháp lý/tài chính', 'bắt buộc checklist kiểm tra', 'log prompt và output'] },
  { layer: 'Decision intelligence', checks: ['ý tưởng', 'giả định', 'thí nghiệm', 'kết quả', 'quyết định tiếp tục/dừng'] }
];

export const FULLSTACK_DELIVERY_BLUEPRINT = [
  { layer: 'Frontend learning OS', mustBuild: ['dashboard công ty founder', 'tab học đa ngành', 'case simulator', 'agent workspace', 'decision log'] },
  { layer: 'Backend/API', mustBuild: ['knowledge modules API', 'simulation scenario API', 'prompt template API', 'versioned notes', 'audit logs'] },
  { layer: 'Database', mustBuild: ['industries', 'cases', 'simulations', 'agents', 'tasks', 'decisions', 'tool_costs'] },
  { layer: 'Testing', mustBuild: ['unit test tính KPI', 'test dữ liệu case', 'test không mất tab cũ', 'test copy report', 'test responsive UI'] }
];

export const GROWTH_BUSINESS_PLAYBOOK = [
  { theme: 'Định vị sản phẩm', actions: ['Không bán như phần mềm kế toán thay MISA/Bravo', 'Định vị là lab học tập, mô phỏng và R&D sản phẩm cho solo founder', 'Tập trung người học kế toán muốn hiểu vận hành doanh nghiệp và làm sản phẩm'] },
  { theme: 'Marketing tiết kiệm', actions: ['viết case study từ mô phỏng', 'làm video ngắn giải thích 1 tình huống', 'tạo checklist miễn phí để kéo người dùng', 'dùng landing page đơn giản'] },
  { theme: 'Khảo sát thị trường', actions: ['phỏng vấn 5-10 người/ngành', 'đo pain point', 'test willingness to pay', 'ưu tiên MVP không cần backend phức tạp'] },
  { theme: 'Thương mại hóa', actions: ['bản free học cơ bản', 'bản paid có case bank + simulator', 'dịch vụ custom module cho doanh nghiệp nhỏ', 'template/prompt pack cho AI agent'] }
];

export const SOLO_FOUNDER_OPERATING_SYSTEM = [
  { process: 'Chiến lược tuần', owner: 'Founder + AI Chief of Staff', rhythm: 'mỗi tuần', outputs: ['3 mục tiêu chính', 'backlog ưu tiên', 'việc dừng làm', 'rủi ro lớn nhất'] },
  { process: 'R&D và mô phỏng', owner: 'AI Researcher + AI Data Analyst', rhythm: 'theo ý tưởng', outputs: ['giả thuyết', 'dữ liệu mẫu', 'mô hình what-if', 'kết luận tiếp tục/dừng'] },
  { process: 'Thiết kế sản phẩm', owner: 'AI Product Manager + AI UX', rhythm: 'mỗi feature', outputs: ['user story', 'wireframe mô tả', 'acceptance criteria', 'test case'] },
  { process: 'Lập trình', owner: 'AI Fullstack Dev + AI QA', rhythm: 'mỗi sprint nhỏ', outputs: ['code', 'test', 'changelog', 'hướng dẫn chạy'] },
  { process: 'Tài chính và chi phí tool', owner: 'AI CFO', rhythm: 'hàng tháng', outputs: ['tool budget', 'ROI', 'runway', 'giữ/bỏ tool'] },
  { process: 'Marketing và bán hàng', owner: 'AI Marketer + AI Sales', rhythm: 'hàng tuần', outputs: ['nội dung', 'landing copy', 'kịch bản demo', 'feedback khách hàng'] },
  { process: 'Kiểm toán nội bộ sản phẩm', owner: 'AI Auditor', rhythm: 'trước khi release', outputs: ['rủi ro', 'log thay đổi', 'checklist an toàn', 'đề xuất sửa'] }
];

export const SOLO_FOUNDER_COMPANY_MODULES = [
  { department: 'CEO Office', purpose: 'Giữ tầm nhìn, quyết định ưu tiên, quản trị rủi ro và chuẩn duyệt cuối.', modules: ['North Star', 'Decision Log', 'Weekly Review', 'Risk Register'], dataNeeded: ['mục tiêu', 'lý do quyết định', 'chi phí cơ hội', 'việc dừng làm'] },
  { department: 'R&D Lab', purpose: 'Biến ý tưởng app/phần mềm/game thành giả thuyết có thể kiểm chứng.', modules: ['Idea Bank', 'Hypothesis Canvas', 'Survey Builder', 'What-if Simulator'], dataNeeded: ['vấn đề khách hàng', 'đối tượng dùng', 'giả định doanh thu', 'giả định chi phí', 'kết quả khảo sát'] },
  { department: 'Product Studio', purpose: 'Chuyển nghiên cứu thành yêu cầu sản phẩm, luồng màn hình và tiêu chí nghiệm thu.', modules: ['PRD', 'User Story', 'Feature Map', 'Acceptance Criteria'], dataNeeded: ['persona', 'job-to-be-done', 'luồng thao tác', 'edge case', 'tiêu chí đạt'] },
  { department: 'Engineering', purpose: 'Lập trình chi phí thấp, ưu tiên MVP, kiểm thử và đóng gói release.', modules: ['Tech Stack', 'Backlog', 'QA Checklist', 'Release Notes'], dataNeeded: ['repo', 'issue', 'commit', 'test case', 'bug', 'phiên bản'] },
  { department: 'Accounting & Audit Academy', purpose: 'Học và mô phỏng kế toán/kiểm toán đa ngành, không làm thay ERP.', modules: ['Industry Map', 'Document Matrix', 'Risk Quiz', 'KPI Lab'], dataNeeded: ['ngành', 'nghiệp vụ', 'chứng từ', 'rủi ro', 'KPI', 'case giả lập'] },
  { department: 'Growth & Sales', purpose: 'Tìm khách, khảo sát, định vị, demo và thử nghiệm thương mại hóa.', modules: ['ICP', 'Landing Copy', 'Demo Script', 'Pricing Test'], dataNeeded: ['pain point', 'kênh tiếp cận', 'thông điệp', 'giá thử', 'feedback'] },
  { department: 'Finance & Tool Control', purpose: 'Quản lý chi phí AI/tool, runway, ROI và nguyên tắc free-first.', modules: ['Tool Budget', 'ROI Score', 'Subscription Register', 'Keep/Kill Rule'], dataNeeded: ['tool', 'chi phí tháng', 'giờ tiết kiệm', 'tính năng ship được', 'quyết định giữ/bỏ'] }
];

export const AI_AGENT_STAFF_MATRIX = [
  { role: 'AI Chief of Staff', mission: 'Tổng hợp việc tuần, nhắc founder quyết định và chống lan man.', inputs: ['mục tiêu tuần', 'backlog', 'rủi ro'], outputs: ['weekly brief', 'top 3 priorities', 'decision memo'], guardrails: ['không tự đổi chiến lược', 'luôn yêu cầu tiêu chí dừng'] },
  { role: 'AI Accountant', mission: 'Giải thích kế toán đa ngành bằng case học tập, chứng từ, KPI và ví dụ.', inputs: ['ngành', 'nghiệp vụ', 'case giả lập'], outputs: ['sơ đồ nghiệp vụ', 'checklist chứng từ', 'KPI học tập'], guardrails: ['không tư vấn áp dụng luật như kết luận cuối', 'phải tách học tập và nghiệp vụ thật'] },
  { role: 'AI Auditor', mission: 'Tìm điểm yếu, ngoại lệ, lỗ hổng dữ liệu và kiểm soát.', inputs: ['module', 'luồng dữ liệu', 'case'], outputs: ['risk list', 'control checklist', 'test plan'], guardrails: ['không chỉ khen', 'phải ghi mức độ rủi ro'] },
  { role: 'AI Product Manager', mission: 'Chuyển ý tưởng thành PRD, user story, roadmap và tiêu chí nghiệm thu.', inputs: ['ý tưởng', 'khách hàng mục tiêu', 'ràng buộc chi phí'], outputs: ['PRD ngắn', 'feature list', 'acceptance criteria'], guardrails: ['MVP trước', 'không phình scope'] },
  { role: 'AI Fullstack Dev', mission: 'Đề xuất kiến trúc, code, refactor và hướng dẫn deploy rẻ nhất.', inputs: ['repo', 'issue', 'thiết kế'], outputs: ['code patch', 'test note', 'release note'], guardrails: ['không phá cấu trúc cũ', 'phải có rollback hoặc commit nhỏ'] },
  { role: 'AI Data Analyst / ML', mission: 'Tạo dữ liệu mô phỏng, phân tích what-if, phát hiện bất thường và scoring.', inputs: ['dataset giả lập', 'giả định', 'KPI'], outputs: ['bảng dữ liệu mẫu', 'risk score', 'insight'], guardrails: ['ghi rõ giả định', 'không lẫn dữ liệu thật'] },
  { role: 'AI Marketer', mission: 'Biến mô phỏng và kiến thức thành nội dung, landing page, khảo sát, kịch bản demo.', inputs: ['ICP', 'pain point', 'case study'], outputs: ['content plan', 'landing copy', 'demo script'], guardrails: ['không quảng cáo quá khả năng sản phẩm', 'phải có CTA đo được'] },
  { role: 'AI QA', mission: 'Kiểm thử UI, dữ liệu, copy, logic tính toán và trải nghiệm học.', inputs: ['feature', 'acceptance criteria', 'test case'], outputs: ['bug list', 'regression checklist', 'release confidence'], guardrails: ['test tab cũ trước tab mới', 'ghi rõ chưa test được gì'] }
];

export const SIMULATION_DATASETS = [
  { name: 'Bộ dữ liệu thương mại mini', industry: 'Thương mại', rows: ['PO001 mua 100 sp giá 120.000', 'Kho nhận 96 sp', 'Bán 20 sp giá 180.000', 'NCC xuất hóa đơn đủ 100 sp'], whatToLearn: ['đối chiếu hàng về - hóa đơn', 'giá vốn', 'tồn kho', 'công nợ NCC'], metrics: ['gross margin', 'inventory variance', 'AP exception'] },
  { name: 'Bộ dữ liệu sản xuất mini', industry: 'Sản xuất', rows: ['BOM chuẩn 2kg/sp', 'Xuất kho 240kg', 'Hoàn thành 100 sp', 'Phế phẩm 8 sp'], whatToLearn: ['định mức', 'hao hụt', 'WIP', 'giá thành'], metrics: ['cost variance', 'yield rate', 'scrap rate'] },
  { name: 'Bộ dữ liệu dịch vụ mini', industry: 'Dịch vụ', rows: ['Hợp đồng 60.000.000/tháng', 'Timesheet đạt 80%', 'Khách chưa ký nghiệm thu', 'Chi phí nhân sự 32.000.000'], whatToLearn: ['điều kiện ghi nhận doanh thu', 'biên lợi nhuận dự án', 'bằng chứng dịch vụ'], metrics: ['project margin', 'utilization', 'AR risk'] },
  { name: 'Bộ dữ liệu xây dựng mini', industry: 'Xây dựng/dự án', rows: ['Dự toán 1.200.000.000', 'Chi phí thực tế 735.000.000', 'Tạm ứng 180.000.000', 'Hoàn ứng 95.000.000'], whatToLearn: ['ngân sách', 'tạm ứng treo', 'chứng từ dự án', 'risk score'], metrics: ['budget used %', 'advance aging', 'document completeness'] },
  { name: 'Bộ dữ liệu founder tool cost', industry: 'Solo founder', rows: ['ChatGPT 20$/tháng', 'GitHub 0$/tháng', 'Hosting 0-5$/tháng', 'Domain 12$/năm'], whatToLearn: ['chi phí vận hành', 'ROI tool', 'free-first stack'], metrics: ['tool cost/month', 'hours saved', 'feature shipped/tool'] },
  { name: 'Bộ dữ liệu khảo sát ý tưởng app/game', industry: 'R&D thương mại hóa', rows: ['10 người phỏng vấn', '6 người gặp pain point', '3 người sẵn sàng trả phí', 'MVP ước tính 14 ngày'], whatToLearn: ['validation', 'willingness to pay', 'MVP scope', 'go/no-go'], metrics: ['pain intensity', 'conversion intent', 'MVP cost'] }
];

export const LOW_COST_TOOL_STACK_MATRIX = [
  { job: 'Quản lý code và version', freeFirst: ['GitHub repo public/private', 'VS Code', 'GitHub Desktop'], paidWhen: 'Chỉ trả phí khi cần Copilot/agent nhiều hoặc private team lớn.', keepKillRule: 'Giữ nếu giúp ship code nhanh hơn; bỏ nếu chỉ để thử model.' },
  { job: 'Ghi chú, tài liệu, quy trình', freeFirst: ['Google Docs', 'Google Sheets', 'Notion free', 'Markdown trong repo'], paidWhen: 'Trả phí khi cần chia sẻ team/automation lớn.', keepKillRule: 'Một nguồn sự thật chính; tránh vừa Notion vừa Sheets vừa Docs trùng nội dung.' },
  { job: 'Thiết kế UI/UX', freeFirst: ['Figma free', 'Canva free', 'ảnh chụp wireframe'], paidWhen: 'Chỉ nâng cấp khi cần asset thương mại hoặc collaboration mạnh.', keepKillRule: 'Không mua template nếu chưa có MVP.' },
  { job: 'Hosting MVP', freeFirst: ['Firebase/Supabase/Vercel free tier', 'GitHub Pages'], paidWhen: 'Trả phí khi có người dùng thật hoặc cần domain/DB ổn định.', keepKillRule: 'MVP học tập ưu tiên static hoặc free tier.' },
  { job: 'AI workforce', freeFirst: ['ChatGPT Plus đã có', 'Gemini free', 'Claude free theo lượt', 'Copilot trial nếu có'], paidWhen: 'Chỉ thêm tool khi có nhiệm vụ rõ: code, research, design, QA.', keepKillRule: 'Mỗi AI phải có vai trò, output và số giờ tiết kiệm.' },
  { job: 'Khảo sát thị trường', freeFirst: ['Google Forms', 'Sheets', 'Facebook group', 'Zalo/LinkedIn cá nhân'], paidWhen: 'Chỉ chạy ads nhỏ khi landing page đã đo chuyển đổi.', keepKillRule: 'Không đốt tiền ads khi chưa có thông điệp rõ.' }
];

export const COMMERCIALIZATION_ROADMAP = [
  { stage: '0. Founder OS rõ ràng', goal: 'Biết công ty mô phỏng này vận hành thế nào.', build: ['dashboard module', 'AI staff matrix', 'weekly rhythm'], evidence: ['copy được báo cáo tuần', 'mỗi agent có nhiệm vụ'], decision: 'Nếu chưa rõ vận hành, không thêm feature lớn.' },
  { stage: '1. Knowledge MVP', goal: 'Người học hiểu đa ngành qua case và checklist.', build: ['industry map', 'document matrix', 'risk quiz'], evidence: ['10 case đủ 4 ngành', 'có KPI và red flag'], decision: 'Nếu người học nhầm đây là ERP, phải sửa định vị.' },
  { stage: '2. Simulator MVP', goal: 'Mô phỏng được dữ liệu và kết quả what-if.', build: ['dataset mẫu', 'tham số thay đổi', 'risk score'], evidence: ['ít nhất 5 bộ dữ liệu', 'copy được kết quả mô phỏng'], decision: 'Giữ nếu giúp khảo sát ý tưởng nhanh hơn Excel thường.' },
  { stage: '3. AI Agent Workspace', goal: 'Founder giao việc cho AI như nhân viên.', build: ['prompt template', 'task brief', 'QA checklist'], evidence: ['AI output có chuẩn nhận bàn giao', 'có log quyết định'], decision: 'Không cho AI tự duyệt release hoặc pháp lý.' },
  { stage: '4. Market Validation', goal: 'Kiểm chứng có người cần sản phẩm này.', build: ['landing page', 'survey script', 'demo video'], evidence: ['5-10 phỏng vấn/ngành', '3 người muốn dùng thử'], decision: 'Không build backend nặng trước khi có tín hiệu.' },
  { stage: '5. Paid Experiment', goal: 'Thử thu tiền bằng gói nhỏ.', build: ['template pack', 'case bank paid', 'dịch vụ custom'], evidence: ['đơn hàng đầu tiên', 'feedback trả phí'], decision: 'Có tiền thật mới mở rộng tính năng phức tạp.' }
];

export const RESEARCH_EXPERIMENT_TEMPLATES = [
  { experiment: 'Khảo sát pain point kế toán đa ngành', hypothesis: 'Người học kế toán cần hiểu nghiệp vụ đa ngành bằng case mô phỏng hơn là học lý thuyết rời rạc.', sampleData: ['10 người học/kế toán', '4 ngành', 'mức đau 1-5', 'sẵn sàng trả phí'], successSignal: '>= 60% nói case mô phỏng giúp hiểu nhanh hơn tài liệu thường.' },
  { experiment: 'Test simulator trước khi build app thật', hypothesis: 'Một bảng mô phỏng what-if đơn giản đủ giúp founder quyết định nên build ý tưởng nào.', sampleData: ['5 ý tưởng', 'chi phí MVP', 'thời gian build', 'khách hàng rõ', 'khả năng trả phí'], successSignal: 'Chọn được top 1-2 ý tưởng có căn cứ, loại bỏ ý tưởng yếu.' },
  { experiment: 'Test AI agent workflow', hypothesis: 'Phân vai AI rõ ràng giúp solo founder giảm lỗi và đỡ rối hơn hỏi AI tự do.', sampleData: ['task brief', 'agent role', 'output', 'QA result', 'decision log'], successSignal: 'Mỗi task có người phụ trách AI, đầu ra, checklist và quyết định cuối.' },
  { experiment: 'Test định vị thương mại', hypothesis: 'Định vị là learning/R&D company OS dễ bán hơn định vị là phần mềm kế toán thay MISA/Bravo.', sampleData: ['2 landing copy', '20 người xem', 'CTA click', 'feedback'], successSignal: 'Thông điệp company OS + simulation lab có tỷ lệ quan tâm cao hơn.' }
];

export const OPERATING_RHYTHM_CHECKLIST = [
  { cadence: 'Hàng ngày', actions: ['ghi 3 việc quan trọng', 'log prompt/AI output đáng giữ', 'chốt việc ship nhỏ nhất trong ngày'], danger: 'Dễ sa vào hỏi AI lan man nhưng không ra sản phẩm.' },
  { cadence: 'Hàng tuần', actions: ['review backlog', 'chọn 1 feature hoặc 1 bộ dữ liệu để hoàn thiện', 'kiểm tra chi phí tool', 'viết changelog'], danger: 'Dễ thêm module mới khi module cũ chưa đủ dữ liệu.' },
  { cadence: 'Hàng tháng', actions: ['đánh giá runway', 'chọn tool giữ/bỏ', 'đo số case mô phỏng đã hoàn thành', 'kiểm tra khả năng thương mại hóa'], danger: 'Dễ trả phí nhiều tool nhưng không có người dùng thật.' },
  { cadence: 'Trước mỗi release', actions: ['AI Auditor rà soát rủi ro', 'AI QA test tab cũ', 'copy báo cáo mô phỏng', 'ghi quyết định release'], danger: 'Dễ sửa dữ liệu làm hỏng UI hoặc làm người dùng hiểu nhầm sản phẩm là ERP.' }
];

export const IMPROVEMENT_BACKLOG = [
  { priority: 'P0', item: 'Đổi tên file/constant còn mang chữ construction để tránh hiểu nhầm về định hướng đa ngành.', reason: 'Hiện tên file kỹ thuật vẫn gợi ý xây dựng, dù nội dung đã đa ngành.', suggestedAction: 'Tạo alias hoặc refactor dần sang founderCompanyKnowledge.ts khi có thời gian.' },
  { priority: 'P0', item: 'Thêm tab dữ liệu mô phỏng có thể copy ra báo cáo khảo sát.', reason: 'Mô phỏng là lõi nghiên cứu và khảo sát.', suggestedAction: 'Render SIMULATION_DATASETS và RESEARCH_EXPERIMENT_TEMPLATES.' },
  { priority: 'P1', item: 'Thêm workspace giao việc cho AI agent.', reason: 'Sản phẩm là công ty solo founder, AI là nhân viên.', suggestedAction: 'Tạo prompt template, brief mẫu, output checklist và log quyết định.' },
  { priority: 'P1', item: 'Thêm roadmap thương mại hóa theo từng stage.', reason: 'Không chỉ học, còn phải biến thành sản phẩm/app/game có thể bán.', suggestedAction: 'Render COMMERCIALIZATION_ROADMAP thành checklist go/no-go.' },
  { priority: 'P2', item: 'Thêm local storage cho decision log và tool budget.', reason: 'Người dùng cần lưu kết quả học/mô phỏng trên máy với chi phí thấp.', suggestedAction: 'Dùng localStorage trước, chưa cần backend.' },
  { priority: 'P2', item: 'Thêm export markdown/PDF báo cáo mô phỏng.', reason: 'Founder cần gửi cho chính mình/AI khác/khách hàng thử nghiệm.', suggestedAction: 'Trước mắt copy markdown, sau mới tính PDF.' }
];
