import { SectorMetric } from '../types';

export const SECTORS_DATA: SectorMetric[] = [
  {
    id: 'accounting',
    name: 'Kế toán (Accounting)',
    emoji: '💸',
    color: 'blue',
    kpis: [
      'Tổng chi phí vận hành lý tưởng',
      'Độ khớp thuế suất đầu vào/ra',
      'Quỹ tồn dư tiền mặt hàng ngày',
      'Tỷ trọng nợ chưa thanh toán quá hạn'
    ],
    risks: [
      'Hạch toán sai tài khoản hoặc hạch toán khống',
      'Hóa đơn không khớp số thuế (đầu vào vs đầu ra)',
      'Không ghi nhận vết thao tác sửa đổi chứng từ (Audit Trail)'
    ],
    dataTables: [
      {
        name: 'expenses',
        description: 'Bảng theo dõi chi tiết phiếu chi phí',
        columns: ['id (PK)', 'expense_date', 'project_id (FK)', 'vendor_id (FK)', 'total_amount', 'tax_rate']
      },
      {
        name: 'vendors',
        description: 'Bảng danh mục nhà cung cấp',
        columns: ['id (PK)', 'tax_code', 'name', 'address', 'payment_terms']
      }
    ],
    pandasSnippet: `import pandas as pd

# Load và tổng hợp chi phí thực tế theo nhóm
df = pd.read_excel('bao_cao_chi_phi.xlsx')
df['ngay_ct'] = pd.to_datetime(df['ngay_ct'])
df['thang'] = df['ngay_ct'].dt.month

summary = df.groupby('danh_muc')['so_tien'].agg(['sum', 'count', 'mean'])
print("Tổng chi phí theo danh mục:\\n", summary)`
  },
  {
    id: 'auditing',
    name: 'Kiểm toán (Auditing)',
    emoji: '🔍',
    color: 'green',
    kpis: [
      'Tỷ lệ bút toán điều chỉnh cuối kỳ',
      'Độ lệch số dư ngân hàng vs Sổ cái',
      'Tần suất giao dịch bất thường (ngoài giờ, số quá tròn)',
      'Tỷ trọng hồ sơ thiếu chứng từ gốc'
    ],
    risks: [
      'Thao túng số liệu hoặc phân bổ chi phí sai lệch',
      'Xóa cứng dữ liệu giao dịch gốc (vi phạm tính toàn vẹn)',
      'Quy trình phê duyệt thiếu chữ ký kiểm tra của cấp có thẩm quyền'
    ],
    dataTables: [
      {
        name: 'audit_logs',
        description: 'Bảng truy vết lịch sử thao tác hệ thống',
        columns: ['id (PK)', 'table_name', 'record_id', 'action (CREATE/UPDATE/DELETE)', 'old_data', 'new_data', 'user_id', 'ip_address', 'created_at']
      }
    ],
    pandasSnippet: `import pandas as pd

# Phát hiện giao dịch cuối tuần hoặc số tiền quá tròn (bất thường)
df = pd.read_sql("SELECT * FROM expenses", con=db_conn)
df['ngay_ct'] = pd.to_datetime(df['ngay_ct'])
df['ngay_trong_tuan'] = df['ngay_ct'].dt.dayofweek # 5: Thứ 7, 6: Chủ nhật

anomalies = df[(df['ngay_trong_tuan'].isin([5, 6])) & (df['so_tien'] % 1000000 == 0)]
print("Các bút toán bất thường cần kiểm tra:", anomalies)`
  },
  {
    id: 'finance',
    name: 'Tài chính (Finance)',
    emoji: '💵',
    color: 'purple',
    kpis: [
      'Tỷ suất lợi nhuận gộp (Gross Margin %)',
      'Dự phóng dòng tiền 13 tuần (13-Week Cash Forecast)',
      'Chênh lệch Ngân sách so với Thực tế (Budget vs Actual Variance)',
      'Thời gian hòa vốn & Điểm hòa vốn dự án'
    ],
    risks: [
      'Dự toán dòng tiền thiếu cơ sở thực tế (quá lạc quan)',
      'Bẫy thanh khoản (kẹt tiền mặt mặc dù sổ sách báo lãi)',
      'Không phân bổ chi phí gián tiếp gây ảo tưởng về lợi nhuận dự án'
    ],
    dataTables: [
      {
        name: 'budget_allocations',
        description: 'Bảng ngân sách kế hoạch dự phòng',
        columns: ['id (PK)', 'period_month', 'project_id (FK)', 'budgeted_amount', 'actual_spent']
      }
    ],
    pandasSnippet: `import pandas as pd
from prophet import Prophet

# Dự báo chi phí/dòng tiền 6 tháng tới sử dụng mô hình Prophet
monthly_data = df.groupby('ngay_ct')['so_tien'].sum().resample('MS').sum().reset_index()
monthly_data.columns = ['ds', 'y']

model = Prophet(yearly_seasonality=True, interval_width=0.95)
model.fit(monthly_data)
future = model.make_future_dataframe(periods=6, freq='MS')
forecast = model.predict(future)
print(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(6))`
  },
  {
    id: 'construction',
    name: 'Xây dựng (Construction)',
    emoji: '🏗',
    color: 'amber',
    kpis: [
      'Vật tư thực tế sử dụng vs Định mức dự toán',
      'Tiến độ nghiệm thu giai đoạn (EAC - Estimate at Completion)',
      'Tỷ trọng hồ sơ chưa đủ điều kiện thanh toán',
      'Hiệu suất máy thi công và nhân công hiện trường'
    ],
    risks: [
      'Thanh toán vượt khối lượng thực tế hoàn thành',
      'Thất thoát vật tư lớn do thiếu quy trình nhập xuất kho hiện trường',
      'Chậm tiến độ bàn giao dẫn đến phạt hợp đồng nặng'
    ],
    dataTables: [
      {
        name: 'projects',
        description: 'Bảng thông tin danh mục công trình đang thi công',
        columns: ['id (PK)', 'code', 'name', 'budget', 'start_date', 'status']
      },
      {
        name: 'project_materials_usage',
        description: 'Bảng đối chiếu định mức vật tư dự án',
        columns: ['id (PK)', 'project_id (FK)', 'material_id', 'allocated_qty', 'actual_used_qty']
      }
    ],
    pandasSnippet: `import pandas as pd

# Đối chiếu dự toán và thực tế tại các công trình
df_expenses = pd.read_sql("SELECT * FROM expenses", con=db_conn)
df_projects = pd.read_sql("SELECT * FROM projects", con=db_conn)

merged = pd.merge(df_expenses, df_projects, left_on='project_id', right_on='id')
actual_spent = merged.groupby('name')['total_amount'].sum()
print("Thực chi so với ngân sách dự án:\\n", actual_spent)`
  },
  {
    id: 'trade',
    name: 'Thương mại (Trade)',
    emoji: '🏪',
    color: 'cyan',
    kpis: [
      'Vòng quay tổng kho (Inventory Turnover)',
      'Đại lượng RFM Khách hàng (Recency, Frequency, Monetary)',
      'Giá trị trọn đời của khách hàng (Customer Lifetime Value)',
      'Tỷ số hoàn hàng / Tỷ lệ đổi trả sản phẩm'
    ],
    risks: [
      'Kẹt vốn do tồn kho chết (tồn kho quá 180 ngày không luân chuyển)',
      'Thanh lý sản phẩm dưới giá vốn không kiểm soát',
      'Đầu cơ tích trữ sai xu hướng nhu cầu thị trường tiêu dùng'
    ],
    dataTables: [
      {
        name: 'products',
        description: 'Bảng danh mục vật tư sản phẩm lưu kho',
        columns: ['id (PK)', 'sku', 'product_name', 'unit_price', 'current_stock']
      },
      {
        name: 'inventory_transactions',
        description: 'Báo cáo nhập xuất chuyển kho',
        columns: ['id (PK)', 'product_id (FK)', 'transaction_type (IN/OUT)', 'quantity', 'created_at']
      }
    ],
    pandasSnippet: `import pandas as pd

# Phân loại khách hàng RFM (Recency, Frequency, Monetary)
df_orders = pd.read_excel('orders.xlsx')
today = pd.to_datetime('2026-05-28')

rfm = df_orders.groupby('customer_id').agg({
    'order_date': lambda x: (today - pd.to_datetime(x).max()).days, # Recency
    'order_id': 'count',                                         # Frequency
    'total_spent': 'sum'                                         # Monetary
})
rfm.columns = ['Recency', 'Frequency', 'Monetary']
print("Báo cáo phân nhóm RFM:\\n", rfm.head())`
  },
  {
    id: 'service',
    name: 'Dịch vụ (Service)',
    emoji: '📋',
    color: 'purple',
    kpis: [
      'Thời gian phản hồi đầu tiên (First Response Time - FRT)',
      'Cam kết chất lượng SLA đạt chuẩn',
      'Tỷ trọng khách hàng hủy dịch vụ (Churn Rate)',
      'Năng suất xử lý yêu cầu của kỹ thuật viên / nhân sự'
    ],
    risks: [
      'Vi phạm thỏa thuận dịch vụ SLA dẫn đến đền bù phạt',
      'Mất khách hàng trung thành do trải nghiệm hỗ trợ quá tệ',
      'Quản lý nhân lực lệch ca, giờ cao điểm thiếu người, giờ thấp điểm dư thừa'
    ],
    dataTables: [
      {
        name: 'support_tickets',
        description: 'Bảng ghi nhận khiếu nại yêu cầu hỗ trợ',
        columns: ['id (PK)', 'customer_id', 'subject', 'status', 'created_at', 'resolved_at', 'sla_breached']
      }
    ],
    pandasSnippet: `import pandas as pd

# Phân tích thời gian xử lý yêu cầu (Turnaround Time) trung bình
df_tickets = pd.read_excel('tickets.xlsx')
df_tickets['created_at'] = pd.to_datetime(df_tickets['created_at'])
df_tickets['resolved_at'] = pd.to_datetime(df_tickets['resolved_at'])

df_tickets['handle_time_hours'] = (df_tickets['resolved_at'] - df_tickets['created_at']).dt.total_seconds() / 3600
avg_time = df_tickets.groupby('agent_id')['handle_time_hours'].mean()
print("Thời gian xử lý trung bình theo nhân viên:\\n", avg_time)`
  },
  {
    id: 'manufacturing',
    name: 'Sản xuất (Manufacturing)',
    emoji: '🏭',
    color: 'red',
    kpis: [
      'Hiệu suất thiết bị tổng thể (OEE - Overall Equipment Effectiveness)',
      'Tỷ mẫn hư hỏng lỗi phế phẩm phát sinh (Defect Rate)',
      'Chi phí biến động thực tế so với định mức Bom',
      'Tần suất bảo trì máy móc dự phòng'
    ],
    risks: [
      'Sự cố máy đột xuất dừng dây chuyền gây trễ đơn hàng (Downtime)',
      'Sai lệch định mức nguyên vật liệu đầu vào không được giám sát',
      'Lỗi đồng lọt phát sinh trong ca làm việc do hệ thống đo lường không chuẩn'
    ],
    dataTables: [
      {
        name: 'bills_of_materials',
        description: 'Bảng công thức định mức sản xuất (BOM)',
        columns: ['id (PK)', 'finished_good_id', 'raw_material_id', 'required_quantity']
      },
      {
        name: 'machine_downtime_logs',
        description: 'Bảng theo dõi nhật trình sự cố dây chuyền',
        columns: ['id (PK)', 'machine_id', 'start_time', 'end_time', 'reason_code']
      }
    ],
    pandasSnippet: `import pandas as pd

# Tính toán tỷ lệ hao hụt nguyên vật liệu so với BOM định mức
bom = pd.read_excel('bom_ định_mức.xlsx')
actual_runs = pd.read_excel('nhiên_liệu_thực_tế.xlsx')

merged = pd.merge(actual_runs, bom, on='product_id')
merged['excess_consumption'] = merged['actual_used'] - merged['bom_allocated']
heavy_loss = merged[merged['excess_consumption'] > 0]
print("Hao hụt vượt định mức báo động:\\n", heavy_loss)`
  }
];
