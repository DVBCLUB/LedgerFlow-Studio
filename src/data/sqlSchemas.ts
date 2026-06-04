import { SQLTable } from '../types';

export const SQL_SCHEMAS: SQLTable[] = [
  {
    name: 'expenses (Chi phí)',
    type: 'fact',
    description: 'Bảng nghiệp vụ cốt lõi, lưu trữ chi tiết các khoản chi, liên kết công trình và nhà cung cấp.',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', description: 'Khóa chính, tự động tăng' },
      { name: 'expense_no', type: 'TEXT', constraints: 'UNIQUE NOT NULL', description: 'Số hiệu phiếu chi phí (VD: PC-2026-001) để đối soát' },
      { name: 'expense_date', type: 'DATE', constraints: 'NOT NULL', description: 'Ngày ghi nhận chi phí thực tế phát sinh' },
      { name: 'project_id', type: 'INTEGER', constraints: 'REFERENCES projects(id)', description: 'Khóa ngoại liên kết danh mục công trình xây dựng' },
      { name: 'vendor_id', type: 'INTEGER', constraints: 'REFERENCES vendors(id)', description: 'Khóa ngoại liên kết danh mục nhà cung cấp' },
      { name: 'category_id', type: 'INTEGER', constraints: 'REFERENCES cost_categories(id)', description: 'Khóa ngoại liên kết hệ tài khoản chi phí (621, 622, 627...)' },
      { name: 'description', type: 'TEXT', constraints: 'NOT NULL', description: 'Diễn giải nội dung chi phí chi tiết' },
      { name: 'quantity', type: 'DECIMAL(15,3)', constraints: 'NOT NULL DEFAULT 1', description: 'Số lượng vật tư hoặc ngày công mua' },
      { name: 'unit', type: 'TEXT', constraints: '', description: 'Đơn vị tính (m3, m2, cái, kg...)' },
      { name: 'unit_price', type: 'INTEGER', constraints: 'NOT NULL', description: 'Đơn giá chưa thuế tính bằng đồng VNĐ' },
      { name: 'before_tax', type: 'INTEGER', constraints: 'NOT NULL', description: 'Thành tiền trước thuế (= số lượng * đơn giá)' },
      { name: 'tax_rate', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Thuế suất VAT hợp lệ (chỉ chấp nhận 0, 5, 8, 10)' },
      { name: 'tax_amount', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Tiền thuế GTGT tương ứng' },
      { name: 'total_amount', type: 'INTEGER', constraints: 'NOT NULL', description: 'Thành tiền sau thuế (= trước thuế + thuế)' },
      { name: 'is_deleted', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Cờ xóa mềm phục vụ tính toàn vẹn (0: Hoạt động, 1: Đã xóa)' }
    ],
    sqlDef: `CREATE TABLE expenses (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  expense_no    TEXT UNIQUE NOT NULL,       -- Số phiếu (PC-2026-001)
  expense_date  DATE NOT NULL,              -- Ngày chứng từ
  project_id    INTEGER REFERENCES projects(id),
  vendor_id     INTEGER REFERENCES vendors(id),
  category_id   INTEGER REFERENCES cost_categories(id),
  description   TEXT NOT NULL,              -- Diễn giải chi tiết
  quantity      DECIMAL(15,3) NOT NULL DEFAULT 1,
  unit          TEXT,                       -- Đơn vị tính (kg, m3, công)
  unit_price    INTEGER NOT NULL,           -- Đơn giá chưa thuế
  before_tax    INTEGER NOT NULL,           -- Số lượng * Đơn giá
  tax_rate      INTEGER DEFAULT 0,          -- 0%, 5%, 8%, 10%
  tax_amount    INTEGER DEFAULT 0,          -- Tiền thuế GTGT
  total_amount  INTEGER NOT NULL,           -- Tổng tiền sau thuế
  invoice_id    INTEGER REFERENCES invoices(id),
  payment_status TEXT DEFAULT 'unpaid',     -- Trạng thái thanh toán
  created_by    INTEGER REFERENCES users(id),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_deleted    INTEGER DEFAULT 0           -- Khóa xóa cứng!
);
CREATE INDEX idx_expense_date ON expenses(expense_date);
CREATE INDEX idx_expense_project ON expenses(project_id);`
  },
  {
    name: 'projects (Công trình)',
    type: 'dim',
    description: 'Bảng danh mục các dự án đang thi công, dùng làm chiều (dimension) phân tích chi phí và tiến độ.',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', description: 'Khóa chính tự tăng' },
      { name: 'code', type: 'TEXT', constraints: 'UNIQUE NOT NULL', description: 'Mã số công trình viết tắt (VD: CT001, CT-METRO)' },
      { name: 'name', type: 'TEXT', constraints: 'NOT NULL', description: 'Tên đầy đủ công trình xây dựng' },
      { name: 'budget', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Tổng định mức ngân sách tài chính phê duyệt ban đầu' },
      { name: 'start_date', type: 'DATE', constraints: '', description: 'Ngày chính thức khởi công dự án' },
      { name: 'end_date', type: 'DATE', constraints: '', description: 'Ngày kết biên nghiệm thu bàn giao dự án' },
      { name: 'status', type: 'TEXT', constraints: "DEFAULT 'active'", description: 'Trạng thái hoạt động (active, closed)' }
    ],
    sqlDef: `CREATE TABLE projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT UNIQUE NOT NULL,       -- Mã công trình (VD: CT-CAULE)
  name          TEXT NOT NULL,              -- Tên dự án
  budget        INTEGER DEFAULT 0,          -- Ngân sách VNĐ
  start_date    DATE,                       -- Ngày bắt đầu
  end_date      DATE,                       -- Ngày chốt tiến độ
  status        TEXT DEFAULT 'active',      -- active hoặc closed
  is_deleted    INTEGER DEFAULT 0           -- Xóa mềm
);`
  },
  {
    name: 'audit_logs (Truy vết thao tác)',
    type: 'other',
    description: 'Lưu trữ vết thao tác phục vụ kiểm toán độc lập và khôi phục khi xảy ra sự cố dữ liệu phi vụ.',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', description: 'Khóa chính tự tăng' },
      { name: 'table_name', type: 'TEXT', constraints: 'NOT NULL', description: 'Tên bảng chịu tác động đổi dữ liệu (VD: expenses)' },
      { name: 'record_id', type: 'INTEGER', constraints: 'NOT NULL', description: 'Khóa ID dòng bị tác động sửa đổi' },
      { name: 'action', type: 'TEXT', constraints: 'NOT NULL', description: 'Hành vi (CREATE, UPDATE, DELETE, APPROVE)' },
      { name: 'old_data', type: 'TEXT', constraints: '', description: 'Chuỗi JSON biểu diễn dữ liệu cũ trước sửa' },
      { name: 'new_data', type: 'TEXT', constraints: '', description: 'Chuỗi JSON biểu diễn dữ liệu mới sau khi sửa' },
      { name: 'user_id', type: 'INTEGER', constraints: 'REFERENCES users(id)', description: 'ID người thao tác đăng nhập' },
      { name: 'ip_address', type: 'TEXT', constraints: '', description: 'Địa chỉ mạng IP thực hiện request' },
      { name: 'created_at', type: 'DATETIME', constraints: 'DEFAULT CURRENT_TIMESTAMP', description: 'Thời gian chính xác xảy ra hành vi' }
    ],
    sqlDef: `CREATE TABLE audit_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name  TEXT NOT NULL,                -- Tên bảng (expenses, projects...)
  record_id   INTEGER NOT NULL,             -- ID dòng
  action      TEXT NOT NULL,                -- CREATE / UPDATE / DELETE
  old_data    TEXT,                         -- JSON cũ
  new_data    TEXT,                         -- JSON mới
  user_id     INTEGER REFERENCES users(id), -- Ai làm
  ip_address  TEXT,                         -- IP của client
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);`
  },
  {
    name: 'payroll_details (Bảng tính chi tiết lương)',
    type: 'fact',
    description: 'Ghi nhận chi phí lương, trích bảo hiểm và nghĩa vụ thuế thu nhập cá nhân bậc thang của nhân sự theo kỳ tháng.',
    columns: [
      { name: 'id', type: 'INTEGER', constraints: 'PRIMARY KEY AUTOINCREMENT', description: 'Khóa chính' },
      { name: 'period_id', type: 'INTEGER', constraints: 'REFERENCES payroll_periods(id)', description: 'Liên kết kỳ lương tháng' },
      { name: 'employee_id', type: 'INTEGER', constraints: 'REFERENCES employees(id)', description: 'Liên kết mã hồ sơ nhân viên' },
      { name: 'working_days', type: 'REAL', constraints: '', description: 'Số ngày công làm việc thực tế ghi nhận' },
      { name: 'gross_salary', type: 'INTEGER', constraints: '', description: 'Lương gộp (Gross salary) trước trích đóng bảo hiểm' },
      { name: 'bhxh_employee', type: 'INTEGER', constraints: '', description: 'Số tiền BHXH trích từ lương nhân viên (10.5%)' },
      { name: 'bhxh_employer', type: 'INTEGER', constraints: '', description: 'Số tiền BHXH doanh nghiệp gánh đóng (23.5%)' },
      { name: 'pit_amount', type: 'INTEGER', constraints: '', description: 'Số thuế TNCN khấu trừ theo biểu bậc thang lũy tiến' },
      { name: 'net_salary', type: 'INTEGER', constraints: '', description: 'Lương thực lĩnh chuyển khoản cuối cùng' }
    ],
    sqlDef: `CREATE TABLE payroll_details (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  period_id     INTEGER REFERENCES payroll_periods(id),
  employee_id   INTEGER REFERENCES employees(id),
  working_days  REAL,                       -- Ngày công thực
  basic_salary  INTEGER,                    -- Lương cơ bản
  allowances    INTEGER DEFAULT 0,          -- Các khoản phụ cấp chịu thuế
  gross_salary  INTEGER,                    -- Lương gộp trước trích
  bhxh_employee INTEGER,                    -- BHXH NV đóng (10.5%)
  bhxh_employer INTEGER,                    -- BHXH DN đóng (23.5%)
  taxable_income INTEGER,                   -- Thu nhập tính thuế TNCN
  pit_amount    INTEGER,                    -- Thuế TNCN khấu trừ
  net_salary    INTEGER,                    -- Thực nhận chuyển khoản
  UNIQUE(period_id, employee_id)
);`
  }
];
