export const DEEP_KNOWLEDGE_PRINCIPLES = [
  'Mỗi module phải gắn với một nghiệp vụ thật của công ty xây dựng: chi phí, hồ sơ, tạm ứng, kho, dầu, thuế, báo cáo, kiểm soát.',
  'Không chỉ hiển thị chữ; phải có checklist, rủi ro, KPI, ví dụ tình huống, hành động tiếp theo và mẫu nội dung có thể copy.',
  'Không để AI tự kết luận pháp lý hoặc tự duyệt chi. AI chỉ gợi ý, phân loại, cảnh báo và tạo bản nháp để người có quyền duyệt.',
  'Luôn tách dữ liệu gốc, dữ liệu xử lý, dữ liệu báo cáo và log kiểm toán.',
  'Tất cả kiến thức pháp luật/thuế trong app phải ghi là khung tham khảo và cần kiểm tra văn bản hiện hành trước khi áp dụng.'
];

export const CONSTRUCTION_ACCOUNTING_DOMAINS = [
  { domain: 'Chi phí công trình', scope: 'Vật tư, nhân công, máy thi công, thầu phụ, nhiên liệu, chi phí chung công trường.', mustHave: ['mã công trình', 'loại chi phí', 'NCC/người nhận', 'hồ sơ kèm', 'trạng thái duyệt', 'ngân sách còn lại'] },
  { domain: 'Tạm ứng - hoàn ứng', scope: 'Theo dõi tiền ứng, người nhận, hạn hoàn ứng, chứng từ hoàn ứng, số còn treo.', mustHave: ['người nhận ứng', 'mục đích ứng', 'hạn hoàn ứng', 'số đã hoàn', 'số còn treo', 'tuổi tạm ứng'] },
  { domain: 'Hồ sơ thanh toán', scope: 'Đề nghị thanh toán, hợp đồng, nghiệm thu, hóa đơn, phiếu nhập kho, biên bản đối chiếu.', mustHave: ['checklist hồ sơ', 'người phụ trách', 'ngày nhận', 'thiếu gì', 'được thanh toán chưa'] },
  { domain: 'Kho vật tư', scope: 'Nhập, xuất, tồn, điều chuyển, vật tư công trình, phiếu kho giấy.', mustHave: ['mã vật tư', 'đơn vị tính', 'kho/công trình', 'số lượng nhập xuất', 'tồn sau giao dịch', 'phiếu liên quan'] },
  { domain: 'Quỹ dầu', scope: 'Cấp dầu, nhập dầu, xe/máy nhận dầu, định mức, nhật trình, tồn quỹ.', mustHave: ['ngày cấp', 'xe/máy', 'người nhận', 'lít dầu', 'định mức', 'chênh lệch'] },
  { domain: 'Thuế & hóa đơn', scope: 'Hóa đơn VAT, thông tin NCC, thuế suất, thanh toán không tiền mặt, chứng từ hợp lệ.', mustHave: ['số hóa đơn', 'ngày hóa đơn', 'MST NCC', 'tiền trước thuế', 'thuế', 'tổng tiền', 'file XML/PDF nếu có'] },
  { domain: 'Báo cáo sếp', scope: 'Báo cáo ngắn về tiền, chi phí, công nợ, rủi ro và việc cần duyệt.', mustHave: ['KPI', 'so sánh ngân sách', 'việc cần xử lý', 'rủi ro đỏ/vàng/xanh'] },
  { domain: 'Kiểm soát nội bộ', scope: 'Phân quyền, duyệt chi, khóa kỳ, log sửa dữ liệu, đối chiếu.', mustHave: ['ai nhập', 'ai duyệt', 'ai sửa', 'lý do sửa', 'thời điểm sửa', 'bằng chứng kèm'] }
];

export const COST_TYPE_KNOWLEDGE = [
  { type: 'Vật tư chính', examples: 'sắt thép, xi măng, cát đá, bê tông, gạch, sơn', documents: ['báo giá/đơn hàng', 'hợp đồng hoặc xác nhận mua', 'hóa đơn', 'phiếu nhập kho', 'biên bản giao nhận'], risks: ['không có phiếu nhập', 'đơn giá vượt dự toán', 'hóa đơn sai thông tin', 'nhập kho sau hóa đơn quá lâu'], kpis: ['chi phí vật tư/thầu', 'vượt ngân sách vật tư', 'tồn kho âm'] },
  { type: 'Nhân công thuê ngoài', examples: 'khoán tháo dỡ, bốc xếp, nhân công thời vụ', documents: ['hợp đồng khoán', 'danh sách người làm', 'bảng chấm công/khối lượng', 'biên bản nghiệm thu', 'chứng từ khấu trừ/thuế nếu phát sinh'], risks: ['thiếu định danh người nhận', 'không có nghiệm thu khối lượng', 'gross-up thuế không nhất quán'], kpis: ['chi phí nhân công/công trình', 'số hồ sơ khoán thiếu chứng từ'] },
  { type: 'Thầu phụ', examples: 'MEP, hoàn thiện, vận chuyển, lắp đặt', documents: ['hợp đồng thầu phụ', 'nghiệm thu', 'bảng xác nhận khối lượng', 'hóa đơn', 'đối chiếu công nợ'], risks: ['nghiệm thu chưa đủ', 'thanh toán vượt khối lượng', 'công nợ chưa đối chiếu'], kpis: ['công nợ thầu phụ', 'giá trị nghiệm thu chưa hóa đơn'] },
  { type: 'Nhiên liệu/dầu', examples: 'dầu máy, dầu xe, dầu công trường', documents: ['hóa đơn dầu', 'phiếu cấp dầu', 'nhật trình xe/máy', 'bảng định mức', 'bảng tồn quỹ dầu'], risks: ['cấp vượt định mức', 'không có xe/máy nhận', 'hóa đơn không khớp lượng cấp'], kpis: ['lít dầu/công trình', 'chênh lệch định mức', 'tồn dầu cuối kỳ'] },
  { type: 'Chi phí HCNS', examples: 'văn phòng phẩm, lương, phụ cấp, tuyển dụng, hành chính', documents: ['đề nghị thanh toán', 'hóa đơn/chứng từ', 'bảng phân bổ', 'phê duyệt bộ phận'], risks: ['khó phân bổ công trình', 'chi không có phê duyệt', 'nhầm chi phí chung và chi phí dự án'], kpis: ['HCNS/tháng', 'chi phí chung phân bổ/công trình'] },
  { type: 'Máy thi công', examples: 'thuê máy, sửa chữa máy, nhiên liệu máy', documents: ['hợp đồng thuê', 'nhật trình máy', 'biên bản nghiệm thu ca máy', 'hóa đơn', 'phiếu cấp nhiên liệu'], risks: ['ca máy không khớp nhật trình', 'thiếu nghiệm thu', 'chi phí sửa chữa không phân bổ'], kpis: ['chi phí máy/ca', 'máy thi công theo công trình'] },
  { type: 'Mua hàng không hóa đơn hoặc chứng từ yếu', examples: 'mua lẻ công trường, vận chuyển nhỏ, thuê xe lôi, chi phí phát sinh gấp', documents: ['đề nghị thanh toán', 'bảng kê/biên nhận', 'giải trình lý do không có hóa đơn', 'phê duyệt cấp có thẩm quyền', 'bằng chứng giao nhận nếu có'], risks: ['lặp lại nhiều lần gây rủi ro thuế', 'không xác minh được người nhận tiền', 'không gắn được mã công trình'], kpis: ['tỷ lệ chi không hóa đơn/tổng chi', 'số dòng thiếu người duyệt', 'giá trị chi nhỏ lặp lại'] },
  { type: 'Tạm ứng - hoàn ứng', examples: 'ứng tiền mua vật tư, ứng cho chỉ huy trưởng, ứng chi dầu/xe/máy', documents: ['phiếu chi/ủy nhiệm chi ứng', 'đề nghị tạm ứng', 'bảng kê hoàn ứng', 'chứng từ chi', 'biên bản xử lý số dư'], risks: ['ứng mới khi ứng cũ chưa hoàn', 'chi sai mục đích ứng', 'không có hạn hoàn ứng'], kpis: ['tuổi tạm ứng bình quân', 'số tiền treo theo người nhận', 'tỷ lệ hoàn ứng đúng hạn'] },
  { type: 'Doanh thu, nghiệm thu và công nợ chủ đầu tư', examples: 'nghiệm thu khối lượng, xuất hóa đơn theo giai đoạn, thu tiền chủ đầu tư', documents: ['hợp đồng đầu ra', 'phụ lục', 'biên bản nghiệm thu', 'hóa đơn đầu ra', 'biên bản đối chiếu công nợ'], risks: ['ghi nhận doanh thu lệch nghiệm thu', 'xuất hóa đơn sai thời điểm', 'công nợ quá hạn không cảnh báo'], kpis: ['doanh thu theo công trình', 'AR aging', 'nghiệm thu chưa hóa đơn'] }
];

export const DOCUMENT_CHECKLIST_RULES = [
  { scenario: 'Thanh toán nhà cung cấp vật tư', minimumDocs: ['đề nghị thanh toán', 'báo giá/đơn hàng', 'hóa đơn', 'phiếu nhập kho', 'đối chiếu công nợ nếu thanh toán nhiều lần'], redFlags: ['thiếu phiếu nhập', 'tên hàng không khớp đơn hàng', 'tổng tiền lệch hóa đơn'] },
  { scenario: 'Thanh toán thầu phụ', minimumDocs: ['hợp đồng', 'nghiệm thu khối lượng', 'đề nghị thanh toán', 'hóa đơn', 'biên bản đối chiếu'], redFlags: ['khối lượng chưa nghiệm thu', 'thanh toán vượt tiến độ', 'thiếu người duyệt'] },
  { scenario: 'Hoàn ứng công trình', minimumDocs: ['đề nghị hoàn ứng', 'chứng từ chi', 'bảng kê chi tiết', 'hóa đơn/phiếu thu/biên nhận', 'xác nhận người quản lý công trình'], redFlags: ['quá hạn hoàn ứng', 'chi không đúng mục đích ứng', 'chứng từ thiếu mã công trình'] },
  { scenario: 'Cấp dầu công trường', minimumDocs: ['phiếu cấp dầu', 'người/xe/máy nhận', 'định mức', 'nhật trình', 'tồn quỹ dầu'], redFlags: ['vượt định mức', 'không có nhật trình', 'tồn âm'] },
  { scenario: 'Chi phí không hóa đơn', minimumDocs: ['đề nghị thanh toán', 'giải trình lý do', 'biên nhận/chứng từ thay thế nếu có', 'phê duyệt cấp có thẩm quyền'], redFlags: ['lặp lại nhiều lần', 'giá trị lớn', 'không chứng minh được người nhận'] },
  { scenario: 'Ủy quyền thanh toán hộ', minimumDocs: ['giấy ủy quyền/đề nghị thanh toán hộ', 'hóa đơn hoặc chứng từ mua hàng', 'bằng chứng chuyển tiền/thanh toán', 'xác nhận người nhận hàng/người quản lý', 'quy định hoàn chứng từ sau thanh toán'], redFlags: ['người được ủy quyền vừa đề nghị vừa duyệt', 'thanh toán hộ nhưng chứng từ đứng sai bên', 'không có thời hạn hoàn chứng từ'] },
  { scenario: 'Khóa kỳ và sửa dữ liệu sau duyệt', minimumDocs: ['biên bản khóa kỳ', 'yêu cầu sửa dữ liệu', 'người duyệt sửa', 'log trước/sau', 'lý do điều chỉnh'], redFlags: ['sửa số tiền sau khi đã báo cáo', 'xóa dòng không có log', 'không lưu dấu vết người sửa'] }
];

export const ACCOUNTING_CONTROL_KPIS = [
  { kpi: 'Budget Used %', formula: 'actualCost / plannedBudget', use: 'Cảnh báo công trình sắp vượt ngân sách.' },
  { kpi: 'Advance Aging', formula: 'today - advanceDate', use: 'Tìm tạm ứng treo quá hạn.' },
  { kpi: 'Document Completeness %', formula: 'availableDocs / requiredDocs', use: 'Biết hồ sơ có đủ điều kiện thanh toán chưa.' },
  { kpi: 'VAT Math Difference', formula: 'invoiceTotal - beforeTax - vatAmount', use: 'Tìm hóa đơn lệch số học.' },
  { kpi: 'Fuel Variance %', formula: '(actualFuel - standardFuel) / standardFuel', use: 'Cảnh báo cấp dầu vượt định mức.' },
  { kpi: 'Inventory Negative Count', formula: 'count(stockBalance < 0)', use: 'Tìm lỗi nhập xuất kho.' },
  { kpi: 'Payable Overdue', formula: 'unpaidAmount by dueDate', use: 'Theo dõi công nợ đến hạn.' },
  { kpi: 'Boss Action Items', formula: 'criticalAlerts + pendingApprovals', use: 'Tạo danh sách việc sếp cần duyệt hôm nay.' },
  { kpi: 'Gross-up Consistency', formula: 'netPay + withheldTax = contractGross', use: 'Kiểm tra hồ sơ khoán khi công ty chịu thuế thay người nhận.' },
  { kpi: 'AR Collection Days', formula: 'daysSinceInvoice where unpaid > 0', use: 'Theo dõi tiền chưa thu từ chủ đầu tư/khách hàng.' },
  { kpi: 'Data Quality Score', formula: 'validRows / totalRows', use: 'Đo chất lượng dữ liệu trước khi đưa vào báo cáo hoặc mô hình AI.' },
  { kpi: 'Approval Cycle Time', formula: 'approvedAt - submittedAt', use: 'Tìm điểm nghẽn trong quy trình duyệt chi.' }
];

export const MODULE_DEPTH_REQUIREMENTS = [
  { module: 'CommandCenter', add: ['bản đồ rủi ro ngày', 'KPI đỏ/vàng/xanh', 'việc cần duyệt', 'template báo cáo sếp', 'drilldown theo công trình'] },
  { module: 'AccountingVietnam', add: ['hệ thống tài khoản tham khảo', 'luồng hạch toán mẫu', 'VAT/PIT/CIT checklist tham khảo', 'ví dụ bút toán xây dựng'] },
  { module: 'InternalAuditWorkspace', add: ['audit program', 'risk-control matrix', 'sampling checklist', 'findings template', 'follow-up tracker'] },
  { module: 'CustomDataWorkbench', add: ['schema validator', 'mapping Excel cũ', 'data quality rules', 'reconciliation sandbox', 'import/export guide'] },
  { module: 'DataScienceEngineering', add: ['fact/dimension model', 'feature engineering', 'anomaly detection cases', 'data lineage', 'AI-ready dataset'] },
  { module: 'AdvancedAIEngine', add: ['prompt schema', 'redaction', 'confidence threshold', 'human approval', 'audit log'] },
  { module: 'WebAccountingRoadmap', add: ['database blueprint', 'role permission', 'MVP milestones', 'testing matrix', 'deploy decision tree'] },
  { module: 'Sales/Marketing modules', add: ['ICP', 'qualification', 'funnel math', 'objection handling', 'NPS/retention feedback loop'] }
];

export const MODULE_KNOWLEDGE_AUDIT = [
  {
    module: 'CommandCenter / Dashboard',
    roleView: 'CEO, kế toán trưởng, quản lý công trình',
    missingKnowledge: ['cash runway theo công trình', 'top rủi ro trong ngày', 'việc cần duyệt', 'so sánh ngân sách-thực tế', 'cảnh báo hồ sơ thiếu'],
    recommendedAdditions: ['heatmap đỏ/vàng/xanh', 'one-page boss report', 'drilldown từ KPI xuống chứng từ gốc', 'mốc khóa kỳ và nhật ký sửa dữ liệu'],
    acceptanceCriteria: 'Nhìn 3 phút biết tiền đang kẹt ở đâu, hồ sơ nào chưa đủ, khoản nào cần sếp duyệt.'
  },
  {
    module: 'AccountingVietnam',
    roleView: 'kế toán dự án, kế toán thuế, kiểm soát chứng từ',
    missingKnowledge: ['mapping tài khoản', 'luồng Nợ/Có theo nghiệp vụ', 'gross-up thuế khoán', 'hồ sơ chi không hóa đơn', 'doanh thu-nghiệm thu-công nợ'],
    recommendedAdditions: ['case định khoản mẫu', 'checklist chứng từ theo loại chi', 'thẻ rủi ro thuế/hóa đơn', 'bảng KPI kiểm soát tạm ứng-kho-dầu'],
    acceptanceCriteria: 'Mỗi loại chi có đủ: chứng từ tối thiểu, rủi ro, KPI, gợi ý hạch toán và hành động tiếp theo.'
  },
  {
    module: 'InternalAuditWorkspace',
    roleView: 'kiểm toán nội bộ, CFO, người duyệt chi',
    missingKnowledge: ['risk-control matrix', 'phân tách nhiệm vụ', 'chọn mẫu kiểm tra', 'mẫu finding', 'theo dõi khắc phục'],
    recommendedAdditions: ['audit program theo chu trình mua hàng-thanh toán', 'sampling rules theo giá trị/rủi ro', 'mẫu phát hiện-nguyên nhân-tác động-khuyến nghị', 'follow-up owner/deadline/status'],
    acceptanceCriteria: 'Từ một cảnh báo có thể sinh kế hoạch kiểm tra, bằng chứng cần lấy và kết luận nháp.'
  },
  {
    module: 'CustomDataWorkbench',
    roleView: 'kế toán nhập liệu, data analyst, dev',
    missingKnowledge: ['data dictionary', 'schema validation', 'mapping file Excel cũ', 'quy tắc chống trùng', 'đối soát ngân hàng-kho-công nợ'],
    recommendedAdditions: ['bảng quy chuẩn cột', 'kiểm tra mã công trình/tài khoản/ngày/số tiền', 'reconciliation sandbox', 'import log và rollback batch'],
    acceptanceCriteria: 'Import dữ liệu xong biết dòng nào lỗi, lỗi vì sao, sửa thế nào và có thể truy ngược file gốc.'
  },
  {
    module: 'DataScienceEngineering',
    roleView: 'data engineer, kế toán phân tích, ML engineer',
    missingKnowledge: ['fact/dimension model', 'data lineage', 'feature engineering', 'anomaly detection', 'dataset sẵn cho AI'],
    recommendedAdditions: ['mô hình sao cho chi phí công trình', 'pipeline bronze-silver-gold', 'feature tuổi tạm ứng/chênh định mức/vượt ngân sách', 'nhãn rủi ro để train model'],
    acceptanceCriteria: 'Dữ liệu kế toán có thể đi từ nhập liệu sang báo cáo, phân tích bất thường và huấn luyện mô hình nhỏ.'
  },
  {
    module: 'MLApplied / AdvancedAIEngine',
    roleView: 'AI product owner, dev fullstack, kiểm soát dữ liệu',
    missingKnowledge: ['PII redaction', 'confidence threshold', 'human-in-the-loop', 'prompt schema', 'AI audit log'],
    recommendedAdditions: ['không gửi CCCD/STK/hợp đồng nhạy cảm nếu chưa che', 'ngưỡng tin cậy thấp thì chuyển người duyệt', 'lưu prompt/input/output/version', 'RAG theo văn bản nội bộ đã duyệt'],
    acceptanceCriteria: 'AI chỉ gợi ý có kiểm soát, không tự duyệt, không làm mất dấu vết và không lộ dữ liệu nhạy cảm.'
  },
  {
    module: 'WebAccountingRoadmap / DeployBusiness',
    roleView: 'fullstack dev, PM, người triển khai',
    missingKnowledge: ['permission matrix', 'database blueprint', 'testing matrix', 'backup/restore', 'deploy decision tree'],
    recommendedAdditions: ['vai trò thủ kho-HCNS-kế toán-sếp-admin', 'bảng giao dịch bất biến + bảng log sửa', 'test unit/e2e nghiệp vụ', 'phương án offline-first rồi cloud sync'],
    acceptanceCriteria: 'Triển khai không chỉ chạy UI mà có phân quyền, dữ liệu, backup, test và lộ trình nâng cấp rõ.'
  },
  {
    module: 'Marketing / Sales / Pricing',
    roleView: 'growth, sales B2B, founder',
    missingKnowledge: ['ICP ngành xây dựng', 'pain-point theo vai trò', 'qualification', 'funnel math', 'pricing theo gói'],
    recommendedAdditions: ['chân dung kế toán-thủ kho-sếp', 'kịch bản demo theo nỗi đau chứng từ', 'lead scoring BANT/CHAMP', 'CAC-LTV-churn dashboard', 'case study trước/sau'],
    acceptanceCriteria: 'Từ sản phẩm nội bộ có thể biến thành giải pháp bán thử cho SME xây dựng mà không nói chung chung.'
  }
];

export const ADVANCED_CONSTRUCTION_CASES = [
  {
    title: 'Gross-up thuế khoán nhân công',
    situation: 'Đội thi công muốn nhận đủ tiền net, công ty chịu phần thuế thay nhưng hồ sơ phải khớp tổng hợp đồng, thuế khấu trừ và số thực trả.',
    accountingFocus: ['phân biệt net/gross', 'kiểm tra tổng tiền hợp đồng', 'bảng thanh toán từng người', 'khấu trừ thuế và chứng từ nộp thay nếu phát sinh'],
    controlQuestions: ['Hợp đồng, bảng thanh toán và đề nghị chi có cùng cách hiểu net/gross không?', 'Tổng thuế có lệch do làm tròn không?', 'Ai phê duyệt công ty chịu phần thuế?']
  },
  {
    title: 'Phiếu nhập kho giấy 3 liên bị mờ',
    situation: 'Thủ kho ghi tay ngoài công trường, liên lưu kế toán khó đọc, phần mềm cũ nhập liệu chậm.',
    accountingFocus: ['chuẩn hóa mã vật tư', 'ảnh chụp chứng từ', 'đối chiếu phiếu nhập với hóa đơn', 'nhật ký người nhập-sửa'],
    controlQuestions: ['Có số phiếu duy nhất không?', 'Có ảnh gốc kèm không?', 'Tồn kho có âm hoặc nhập trùng không?']
  },
  {
    title: 'Tạm ứng mua vật tư nhiều dòng chi',
    situation: 'Một khoản ứng dùng cho nhiều chi phí, nhiều chứng từ và có thể còn dư hoặc thiếu.',
    accountingFocus: ['split line hoàn ứng', 'theo dõi tuổi tạm ứng', 'gắn từng dòng với công trình/hạng mục', 'xử lý số dư hoàn lại hoặc ứng thêm'],
    controlQuestions: ['Có cấm ứng mới khi còn treo quá hạn không?', 'Có biết dòng nào thiếu chứng từ không?', 'Có đối chiếu số ứng - đã chi - hoàn lại không?']
  }
];

export const FINANCIAL_ACCOUNTING_BLUEPRINT = [
  { area: 'Sổ cái & định khoản', add: ['journal entry immutable ID', 'bút toán đảo/điều chỉnh thay vì xóa', 'mapping tài khoản theo loại chi', 'trạng thái nháp/duyệt/khóa kỳ'] },
  { area: 'Công nợ phải trả', add: ['aging theo NCC', 'đối chiếu công nợ', 'lịch thanh toán', 'cảnh báo thanh toán không đủ hồ sơ'] },
  { area: 'Công nợ phải thu', add: ['nghiệm thu chưa xuất hóa đơn', 'hóa đơn chưa thu tiền', 'aging theo chủ đầu tư', 'cam kết thanh toán'] },
  { area: 'Ngân sách công trình', add: ['baseline budget', 'revised budget', 'actual committed cost', 'estimate at completion'] },
  { area: 'Báo cáo quản trị', add: ['P&L theo công trình', 'cash-in/cash-out', 'top variance', 'boss action list'] }
];

export const DATA_AI_CONTROL_FRAMEWORK = [
  { layer: 'Bronze - dữ liệu gốc', checks: ['lưu file gốc', 'batch import id', 'người nhập', 'timestamp', 'không sửa đè'] },
  { layer: 'Silver - dữ liệu sạch', checks: ['chuẩn mã công trình', 'chuẩn NCC', 'kiểm tra ngày/số tiền', 'loại bỏ trùng', 'mapping tài khoản'] },
  { layer: 'Gold - báo cáo', checks: ['KPI đã khóa kỳ', 'so sánh ngân sách', 'dashboard sếp', 'export PDF/Excel', 'log phiên bản'] },
  { layer: 'AI Guardrail', checks: ['ẩn dữ liệu nhạy cảm', 'prompt có schema', 'confidence score', 'người duyệt cuối', 'audit log AI'] }
];

export const GROWTH_BUSINESS_PLAYBOOK = [
  { theme: 'ICP ngành xây dựng', actions: ['nhắm công ty 20-200 nhân sự', 'có công trình ngoài hiện trường', 'đang dùng Excel/phần mềm cũ', 'đau ở chứng từ-kho-tạm ứng'] },
  { theme: 'Thông điệp marketing', actions: ['giảm thời gian tổng hợp báo cáo sếp', 'không thay phần mềm kế toán ngay', 'chạy kèm Excel/quy trình cũ', 'kiểm soát chứng từ trước khi thanh toán'] },
  { theme: 'Demo bán hàng', actions: ['import bảng chi phí mẫu', 'hiện cảnh báo hồ sơ thiếu', 'xuất báo cáo sếp', 'so sánh trước/sau 1 tuần dùng thử'] },
  { theme: 'Pricing', actions: ['gói nội bộ 1 công ty', 'gói theo số công trình', 'setup phí thấp ban đầu', 'dịch vụ tùy biến chứng từ/quy trình'] }
];

export const FULLSTACK_DELIVERY_BLUEPRINT = [
  { layer: 'Frontend', mustBuild: ['module nhập nhanh', 'bảng danh sách có lọc', 'dashboard KPI', 'màn duyệt', 'màn audit log'] },
  { layer: 'Backend/API', mustBuild: ['CRUD có phân quyền', 'batch import', 'file attachment', 'approval workflow', 'export service'] },
  { layer: 'Database', mustBuild: ['projects', 'vendors', 'cost_entries', 'documents', 'advances', 'inventory_movements', 'fuel_movements', 'journal_entries', 'audit_logs'] },
  { layer: 'Security', mustBuild: ['role-based access', 'row-level policy theo công trình nếu dùng cloud', 'backup', 'restore', 'mask dữ liệu nhạy cảm'] },
  { layer: 'Testing', mustBuild: ['test định khoản', 'test gross-up', 'test tạm ứng-hoàn ứng', 'test import trùng', 'test phân quyền', 'test khóa kỳ'] }
];

export const BOSS_REPORT_TEMPLATE = [
  '1. Tổng chi phí hôm nay / tháng này / lũy kế theo công trình.',
  '2. Công trình vượt hoặc sắp vượt ngân sách.',
  '3. Tạm ứng còn treo: ai giữ, bao lâu, số tiền bao nhiêu.',
  '4. Hồ sơ thiếu chứng từ cần bổ sung trước khi thanh toán.',
  '5. Công nợ đến hạn và khoản cần sếp duyệt.',
  '6. Cảnh báo kho/dầu/VAT/chi phí bất thường.',
  '7. Đề xuất hành động: duyệt, giữ lại, yêu cầu bổ sung, kiểm tra thêm.'
];

export const AI_PROMPT_SCHEMAS = [
  { name: 'payment_file_review', fields: ['riskLevel', 'missingDocs', 'amountCheck', 'taxCheck', 'suggestedAction', 'needsHumanReview', 'confidence'] },
  { name: 'cost_classification', fields: ['costType', 'projectCode', 'suggestedAccount', 'requiredDocs', 'riskFlags', 'confidence'] },
  { name: 'boss_summary', fields: ['topKpis', 'redAlerts', 'pendingApprovals', 'cashRisks', 'recommendedActions'] },
  { name: 'data_quality_scan', fields: ['invalidRows', 'duplicateVendors', 'missingProjectCodes', 'amountAnomalies', 'fixSuggestions'] },
  { name: 'audit_finding', fields: ['condition', 'criteria', 'cause', 'effect', 'recommendation', 'owner', 'deadline', 'severity'] },
  { name: 'sales_qualification', fields: ['industry', 'painPoint', 'budgetSignal', 'decisionMaker', 'urgency', 'nextStep'] }
];