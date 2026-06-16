export type DataColumnType = 'text' | 'number' | 'date' | 'category';

export interface SchemaPreviewColumn {
  name: string;
  type: DataColumnType;
  required: boolean;
  example: string;
  businessMeaning: string;
}

export interface WorkbenchSchemaPreview {
  id: string;
  title: string;
  domain: string;
  purpose: string;
  columns: SchemaPreviewColumn[];
  recommendedQuestions: string[];
  qualityChecks: string[];
}

export interface QueryBuilderRecipe {
  id: string;
  title: string;
  businessQuestion: string;
  sourceTable: string;
  selectFields: string[];
  filters: string[];
  groupBy: string[];
  sortBy: string[];
  sampleSql: string;
  plainVietnamese: string;
}

export interface PivotSimulationTemplate {
  id: string;
  title: string;
  sourceDataset: string;
  rows: string[];
  columns: string[];
  values: string[];
  filters: string[];
  insights: string[];
}

export interface QueryBuilderExplanationStep {
  id: string;
  step: string;
  userQuestion: string;
  builderAction: string;
  reviewerCheck: string;
};

export interface PivotSimulationExample {
  id: string;
  title: string;
  sourceDataset: string;
  matrix: Array<{
    rowLabel: string;
    values: Array<{ columnLabel: string; amount: number; note: string }>;
  }>;
  interpretation: string[];
};

export interface ExportSafetyChecklist {
  format: 'CSV' | 'Excel' | 'PDF';
  safeWhen: string[];
  mustCheck: string[];
  avoidWhen: string[];
  existingSurface: string;
};

export const CUSTOM_DATA_SCHEMA_PREVIEWS: WorkbenchSchemaPreview[] = [
  {
    id: 'project_costs',
    title: 'Sổ chi phí công trình',
    domain: 'Xây dựng/dự án',
    purpose: 'Theo dõi chi phí theo công trình, hạng mục, loại chi phí, hồ sơ và trạng thái hoàn ứng.',
    columns: [
      { name: 'transaction_date', type: 'date', required: true, example: '2026-06-15', businessMeaning: 'Ngày phát sinh nghiệp vụ.' },
      { name: 'project_code', type: 'text', required: true, example: 'CT-001', businessMeaning: 'Mã công trình để gom chi phí.' },
      { name: 'cost_type', type: 'category', required: true, example: 'Vật tư', businessMeaning: 'Nhóm chi phí để phân tích.' },
      { name: 'amount', type: 'number', required: true, example: '12500000', businessMeaning: 'Số tiền phát sinh.' },
      { name: 'document_status', type: 'category', required: true, example: 'Đủ hồ sơ', businessMeaning: 'Tình trạng hồ sơ trước khi báo cáo.' }
    ],
    recommendedQuestions: [
      'Chi phí theo từng công trình trong tháng?',
      'Loại chi phí nào chiếm tỷ trọng lớn?',
      'Dòng nào chưa đủ hồ sơ?',
      'Công trình nào gần vượt ngân sách?'
    ],
    qualityChecks: [
      'Không để trống project_code.',
      'amount phải lớn hơn 0.',
      'document_status phải thuộc danh mục chuẩn.',
      'cost_type phải thống nhất theo danh mục.'
    ]
  },
  {
    id: 'sales_receivables',
    title: 'Sổ doanh thu và công nợ phải thu',
    domain: 'Thương mại/dịch vụ',
    purpose: 'Mô phỏng doanh thu, công nợ, tuổi nợ và biên lợi nhuận theo khách hàng hoặc hợp đồng.',
    columns: [
      { name: 'invoice_date', type: 'date', required: true, example: '2026-06-15', businessMeaning: 'Ngày hóa đơn hoặc ngày ghi nhận mô phỏng.' },
      { name: 'customer_code', type: 'text', required: true, example: 'KH-001', businessMeaning: 'Mã khách hàng.' },
      { name: 'revenue_amount', type: 'number', required: true, example: '45000000', businessMeaning: 'Doanh thu mô phỏng.' },
      { name: 'direct_cost', type: 'number', required: false, example: '28000000', businessMeaning: 'Chi phí trực tiếp để tính biên lợi nhuận.' },
      { name: 'payment_status', type: 'category', required: true, example: 'Chưa thu', businessMeaning: 'Tình trạng thu tiền.' }
    ],
    recommendedQuestions: [
      'Doanh thu theo khách hàng?',
      'Khách hàng nào còn chưa thu tiền?',
      'Biên lợi nhuận theo hợp đồng?',
      'Doanh thu theo tháng?'
    ],
    qualityChecks: [
      'revenue_amount không âm.',
      'payment_status phải có danh mục chuẩn.',
      'customer_code không được trống.',
      'direct_cost cần cùng đơn vị tiền với revenue_amount.'
    ]
  }
];

export const QUERY_BUILDER_EXPLANATION_STEPS: QueryBuilderExplanationStep[] = [
  {
    id: 'question-to-source',
    step: '1. Map business question to dataset',
    userQuestion: 'Founder hoi: cong trinh nao dang vuot ngan sach hoac thieu ho so?',
    builderAction: 'Chon source table co project_code, amount, budget/document_status va ky bao cao.',
    reviewerCheck: 'Nguoi duyet xac nhan dataset dung pham vi, khong tron du lieu that voi du lieu demo.'
  },
  {
    id: 'select-filter-group',
    step: '2. Select, filter, group',
    userQuestion: 'Can hien cot nao va gom theo truc nao?',
    builderAction: 'Chon fields can hien, filter theo ngay/trang thai, group theo project/customer/cost_type.',
    reviewerCheck: 'Kiem tra filter khong loai mat exception quan trong va groupBy dung voi cau hoi.'
  },
  {
    id: 'sort-interpret',
    step: '3. Sort and interpret',
    userQuestion: 'Dong nao can xem truoc?',
    builderAction: 'Sort theo amount, age, missing_docs_count hoac risk_score de uu tien review.',
    reviewerCheck: 'Ket qua chi la hang doi review; khong tu ket luan sai pham neu chua doi chieu chung tu.'
  }
];

export const QUERY_BUILDER_RECIPES: QueryBuilderRecipe[] = [
  {
    id: 'project_cost_summary',
    title: 'Tổng hợp chi phí theo công trình',
    businessQuestion: 'Công trình nào đang dùng nhiều chi phí nhất?',
    sourceTable: 'project_costs',
    selectFields: ['project_code', 'cost_type', 'SUM(amount) AS total_amount'],
    filters: ['transaction_date BETWEEN :fromDate AND :toDate'],
    groupBy: ['project_code', 'cost_type'],
    sortBy: ['total_amount DESC'],
    sampleSql: 'SELECT project_code, cost_type, SUM(amount) AS total_amount FROM project_costs WHERE transaction_date BETWEEN :fromDate AND :toDate GROUP BY project_code, cost_type ORDER BY total_amount DESC;',
    plainVietnamese: 'Lấy chi phí trong khoảng ngày, gom theo công trình và loại chi phí, rồi xếp từ lớn đến nhỏ.'
  },
  {
    id: 'open_document_items',
    title: 'Các dòng chưa đủ hồ sơ',
    businessQuestion: 'Khoản nào cần bổ sung hồ sơ trước khi báo cáo?',
    sourceTable: 'project_costs',
    selectFields: ['project_code', 'cost_type', 'amount', 'document_status'],
    filters: ["document_status <> 'Đủ hồ sơ'"],
    groupBy: [],
    sortBy: ['amount DESC'],
    sampleSql: "SELECT project_code, cost_type, amount, document_status FROM project_costs WHERE document_status <> 'Đủ hồ sơ' ORDER BY amount DESC;",
    plainVietnamese: 'Lọc ra các dòng chưa đủ hồ sơ và ưu tiên xem khoản tiền lớn trước.'
  },
  {
    id: 'customer_revenue_summary',
    title: 'Tổng hợp doanh thu theo khách hàng',
    businessQuestion: 'Khách hàng nào đóng góp doanh thu lớn nhất?',
    sourceTable: 'sales_receivables',
    selectFields: ['customer_code', 'SUM(revenue_amount) AS total_revenue'],
    filters: ['invoice_date BETWEEN :fromDate AND :toDate'],
    groupBy: ['customer_code'],
    sortBy: ['total_revenue DESC'],
    sampleSql: 'SELECT customer_code, SUM(revenue_amount) AS total_revenue FROM sales_receivables WHERE invoice_date BETWEEN :fromDate AND :toDate GROUP BY customer_code ORDER BY total_revenue DESC;',
    plainVietnamese: 'Gom doanh thu theo khách hàng trong kỳ để thấy khách hàng quan trọng.'
  }
];

export const PIVOT_SIMULATION_TEMPLATES: PivotSimulationTemplate[] = [
  {
    id: 'pivot_project_costs',
    title: 'Pivot chi phí theo công trình và loại chi phí',
    sourceDataset: 'project_costs',
    rows: ['project_code'],
    columns: ['cost_type'],
    values: ['SUM(amount)'],
    filters: ['transaction_date', 'document_status'],
    insights: ['Công trình nào chi nhiều nhất', 'Loại chi phí nào chiếm tỷ trọng lớn', 'Dòng nào cần bổ sung hồ sơ']
  },
  {
    id: 'pivot_customer_revenue',
    title: 'Pivot doanh thu theo khách hàng và trạng thái thu tiền',
    sourceDataset: 'sales_receivables',
    rows: ['customer_code'],
    columns: ['payment_status'],
    values: ['SUM(revenue_amount)'],
    filters: ['invoice_date'],
    insights: ['Khách hàng doanh thu cao', 'Doanh thu chưa thu tiền', 'Tỷ trọng doanh thu theo trạng thái']
  }
];

export const PIVOT_SIMULATION_EXAMPLES: PivotSimulationExample[] = [
  {
    id: 'project-cost-mini-matrix',
    title: 'Mini pivot: project cost by cost type',
    sourceDataset: 'project_costs',
    matrix: [
      {
        rowLabel: 'CT-001',
        values: [
          { columnLabel: 'Vat tu', amount: 12500000, note: 'Can doi chieu phieu nhap/xuat.' },
          { columnLabel: 'Nhan cong', amount: 8200000, note: 'Can bang cham cong/nghiem thu.' }
        ]
      },
      {
        rowLabel: 'CT-002',
        values: [
          { columnLabel: 'Vat tu', amount: 18800000, note: 'Gia tri cao hon, uu tien review.' },
          { columnLabel: 'May thi cong', amount: 4300000, note: 'Can nhat trinh may/ca may.' }
        ]
      }
    ],
    interpretation: [
      'CT-002 co vat tu cao hon nen dung lam dong uu tien trong risk review.',
      'Cot chi phi khong thay the chung tu; no chi chi ra noi can drill-down.',
      'Neu document_status khac Du ho so, dua vao exception list truoc khi bao cao.'
    ]
  },
  {
    id: 'receivable-status-mini-matrix',
    title: 'Mini pivot: receivables by customer and payment status',
    sourceDataset: 'sales_receivables',
    matrix: [
      {
        rowLabel: 'KH-001',
        values: [
          { columnLabel: 'Da thu', amount: 32000000, note: 'Dong tien da khop sao ke.' },
          { columnLabel: 'Chua thu', amount: 13000000, note: 'Can follow-up cong no.' }
        ]
      },
      {
        rowLabel: 'KH-002',
        values: [
          { columnLabel: 'Da thu', amount: 0, note: 'Chua co thu tien.' },
          { columnLabel: 'Chua thu', amount: 45000000, note: 'Gia tri lon, can owner.' }
        ]
      }
    ],
    interpretation: [
      'KH-002 la diem can kiem tra cong no vi chua thu toan bo.',
      'Pivot giup uu tien follow-up, khong ket luan kha nang thu hoi neu chua lien he khach hang.',
      'Nen export danh sach exception kem owner/deadline thay vi export toan bo data neu dang demo.'
    ]
  }
];

export const EXPORT_SAFETY_CHECKLIST: ExportSafetyChecklist[] = [
  {
    format: 'CSV',
    safeWhen: ['du lieu da an danh hoac la du lieu demo', 'can chuyen sang spreadsheet de reviewer loc nhanh', 'khong can layout bao cao'],
    mustCheck: ['encoding UTF-8', 'header ro nghia', 'khong co secret/API key/token', 'khong co PII neu chua duoc phep'],
    avoidWhen: ['du lieu that chua co pham vi duyet', 'cot cong thuc co the bi spreadsheet injection'],
    existingSurface: 'Parser tab da co nut Tai CSV cho bang parse sach.'
  },
  {
    format: 'Excel',
    safeWhen: ['can xuat nhieu bang lien ket', 'reviewer can filter/pivot them', 'du lieu nam trong localStorage demo'],
    mustCheck: ['sheet name de hieu', 'khong tron demo va production', 'cot tien/ngay dung format', 'co README/notes neu gui ra ngoai'],
    avoidWhen: ['file qua lon lam trinh duyet treo', 'du lieu nhay cam chua an danh'],
    existingSurface: 'RDBMS tab da co nut Xuat Excel cho 4 bang local.'
  },
  {
    format: 'PDF',
    safeWhen: ['can snapshot bao cao de doc nhanh', 'khong can sua du lieu sau export', 'can gui founder review'],
    mustCheck: ['so lieu la snapshot', 'co ngay xuat', 'co boundary note', 'khong xem PDF la bang chung goc'],
    avoidWhen: ['can audit trail chi tiet', 'can reviewer drill-down tung dong'],
    existingSurface: 'RDBMS tab da co nut Xuat PDF cho bao cao tom tat.'
  }
];

export const CUSTOM_DATA_WORKBENCH_ACCEPTANCE = [
  'Người dùng không biết SQL vẫn hiểu được câu hỏi kinh doanh đang chuyển thành query như thế nào.',
  'Mỗi schema preview phải giải thích ý nghĩa nghiệp vụ của từng cột.',
  'Pivot simulation phải chỉ rõ rows, columns, values, filters và insight kỳ vọng.',
  'Dữ liệu mô phỏng phải tách khỏi dữ liệu thật.',
  'Không kết nối dữ liệu thật nếu chưa có quyền và phạm vi rõ ràng.'
];
