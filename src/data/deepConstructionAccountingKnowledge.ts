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
  { type: 'Máy thi công', examples: 'thuê máy, sửa chữa máy, nhiên liệu máy', documents: ['hợp đồng thuê', 'nhật trình máy', 'biên bản nghiệm thu ca máy', 'hóa đơn', 'phiếu cấp nhiên liệu'], risks: ['ca máy không khớp nhật trình', 'thiếu nghiệm thu', 'chi phí sửa chữa không phân bổ'], kpis: ['chi phí máy/ca', 'máy thi công theo công trình'] }
];

export const DOCUMENT_CHECKLIST_RULES = [
  { scenario: 'Thanh toán nhà cung cấp vật tư', minimumDocs: ['đề nghị thanh toán', 'báo giá/đơn hàng', 'hóa đơn', 'phiếu nhập kho', 'đối chiếu công nợ nếu thanh toán nhiều lần'], redFlags: ['thiếu phiếu nhập', 'tên hàng không khớp đơn hàng', 'tổng tiền lệch hóa đơn'] },
  { scenario: 'Thanh toán thầu phụ', minimumDocs: ['hợp đồng', 'nghiệm thu khối lượng', 'đề nghị thanh toán', 'hóa đơn', 'biên bản đối chiếu'], redFlags: ['khối lượng chưa nghiệm thu', 'thanh toán vượt tiến độ', 'thiếu người duyệt'] },
  { scenario: 'Hoàn ứng công trình', minimumDocs: ['đề nghị hoàn ứng', 'chứng từ chi', 'bảng kê chi tiết', 'hóa đơn/phiếu thu/biên nhận', 'xác nhận người quản lý công trình'], redFlags: ['quá hạn hoàn ứng', 'chi không đúng mục đích ứng', 'chứng từ thiếu mã công trình'] },
  { scenario: 'Cấp dầu công trường', minimumDocs: ['phiếu cấp dầu', 'người/xe/máy nhận', 'định mức', 'nhật trình', 'tồn quỹ dầu'], redFlags: ['vượt định mức', 'không có nhật trình', 'tồn âm'] },
  { scenario: 'Chi phí không hóa đơn', minimumDocs: ['đề nghị thanh toán', 'giải trình lý do', 'biên nhận/chứng từ thay thế nếu có', 'phê duyệt cấp có thẩm quyền'], redFlags: ['lặp lại nhiều lần', 'giá trị lớn', 'không chứng minh được người nhận'] }
];

export const ACCOUNTING_CONTROL_KPIS = [
  { kpi: 'Budget Used %', formula: 'actualCost / plannedBudget', use: 'Cảnh báo công trình sắp vượt ngân sách.' },
  { kpi: 'Advance Aging', formula: 'today - advanceDate', use: 'Tìm tạm ứng treo quá hạn.' },
  { kpi: 'Document Completeness %', formula: 'availableDocs / requiredDocs', use: 'Biết hồ sơ có đủ điều kiện thanh toán chưa.' },
  { kpi: 'VAT Math Difference', formula: 'invoiceTotal - beforeTax - vatAmount', use: 'Tìm hóa đơn lệch số học.' },
  { kpi: 'Fuel Variance %', formula: '(actualFuel - standardFuel) / standardFuel', use: 'Cảnh báo cấp dầu vượt định mức.' },
  { kpi: 'Inventory Negative Count', formula: 'count(stockBalance < 0)', use: 'Tìm lỗi nhập xuất kho.' },
  { kpi: 'Payable Overdue', formula: 'unpaidAmount by dueDate', use: 'Theo dõi công nợ đến hạn.' },
  { kpi: 'Boss Action Items', formula: 'criticalAlerts + pendingApprovals', use: 'Tạo danh sách việc sếp cần duyệt hôm nay.' }
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
  { name: 'data_quality_scan', fields: ['invalidRows', 'duplicateVendors', 'missingProjectCodes', 'amountAnomalies', 'fixSuggestions'] }
];
