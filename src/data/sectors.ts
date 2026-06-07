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
      'Tỷ trọng nợ chưa thanh toán quá hạn (DSO / DPO Days)',
      'Tỷ lệ chi phí không được khấu trừ thuế TNDN (% Non-deductible)',
      'Tỷ lệ hóa đơn điện tử hợp lệ (HĐĐT hợp lệ / tổng HĐ)',
      'Số ngày chậm nộp thuế bình quân (GTGT, TNCN, TNDN)',
      'Tỷ lệ cấn trừ công nợ trái chiều tài khoản 131/331'
    ],
    risks: [
      'Hạch toán sai tài khoản hoặc hạch toán khống',
      'Hóa đơn không khớp số thuế (đầu vào vs đầu ra)',
      'Không ghi nhận vết thao tác sửa đổi chứng từ (Audit Trail)',
      'Mua bán hóa đơn từ công ty bỏ địa chỉ kinh doanh hoặc shell company',
      'Không lập dự phòng nợ phải thu khó đòi theo quy định Thông tư 48/2019/TT-BTC',
      'Chủ doanh nghiệp rút tiền cá nhân không lập phiếu chi, lẫn lộn quỹ của công ty'
    ],
    dataTables: [
      {
        name: 'expenses',
        description: 'Bảng theo dõi chi tiết phiếu chi phí vận hành và mua sắm',
        columns: [
          'id (PK)', 
          'expense_date', 
          'project_id (FK)', 
          'vendor_id (FK)', 
          'total_amount', 
          'tax_rate', 
          'is_tax_deductible (Boolean)', 
          'account_code (e.g. TK 642, 811)', 
          'invoice_serial (Ký hiệu HĐĐT)', 
          'invoice_number (Số HĐ)', 
          'buyer_tax_code', 
          'seller_tax_code'
        ]
      },
      {
        name: 'vendors',
        description: 'Bảng danh mục đối tác khách hàng và nhà cung cấp hàng hóa',
        columns: ['id (PK)', 'tax_code', 'name', 'address', 'payment_terms']
      },
      {
        name: 'tax_compliance_log',
        description: 'Nhật ký theo dõi nghĩa vụ kê khai và nộp thuế pháp lý',
        columns: [
          'id (PK)', 
          'tax_type (GTGT/TNDN/TNCN)', 
          'period (YYYY-MM)', 
          'deadline_date', 
          'submitted_date', 
          'late_days (Generated)', 
          'penalty_amount', 
          'status'
        ]
      }
    ],
    pandasSnippet: `import pandas as pd
import numpy as np

# Đọc dữ liệu chi phí và phân loại chi phí không được trừ khi tính thuế TNDN
df = pd.read_excel('bao_cao_chi_phi_chi_tiet.xlsx')
df['expense_date'] = pd.to_datetime(df['expense_date'])

# 1. Tính toán tỷ trọng chi phí không được khấu trừ thuế theo tài khoản hạch toán
non_deductible = df[df['is_tax_deductible'] == False]
ratio_by_dept = non_deductible.groupby('account_code')['total_amount'].sum() / df.groupby('account_code')['total_amount'].sum()

print("⚠️ Tỷ lệ chi phí không được trừ thuế theo phòng ban:\\n", ratio_by_dept.fillna(0) * 100)

# 2. Phát hiện các nhà cung cấp có rủi ro MST không đồng bộ hoặc sai định dạng Việt Nam
invalid_tax_codes = df[~df['seller_tax_code'].astype(str).str.match(r'^\\d{10}(-\\d{3})?$')]
print("🚨 Danh sách hóa đơn có Mã số thuế người bán nghi vấn:\\n", invalid_tax_codes[['id', 'invoice_number', 'seller_tax_code']])`
  },
  {
    id: 'auditing',
    name: 'Kiểm toán (Auditing)',
    emoji: '🔍',
    color: 'green',
    kpis: [
      'Tỷ lệ bút toán điều chỉnh cuối kỳ',
      'Độ lệch số dư ngân hàng và sổ phụ ngân hàng vs Sổ cái',
      'Tần suất giao dịch bất thường (ngoài giờ, số tròn)',
      'Tỷ trọng hồ sơ thiếu chứng từ gốc đính kèm',
      'Điểm tuân thủ Định luật Benford (Benford\'s Law Compliance Score)',
      'Tỷ lệ bút toán nhập tay cuối kỳ (Manual Journal Entry Ratio)',
      'Số lần vi phạm nguyên tắc bất kiêm nhiệm (Segregation of Duties - SoD Violations)',
      'Điểm kiểm tra giao dịch vòng tròn khống (Transaction Graph Centrality)'
    ],
    risks: [
      'Thao túng số liệu hoặc cố ý phân bổ sai kỳ chi phí',
      'Xóa cứng dữ liệu giao dịch gốc (vi phạm tính bất biến của sổ cái)',
      'Quy trình phê duyệt lỏng lẻo, thiếu kiểm soát kép từ kiểm soát viên',
      'Giao dịch chuyển tiền vòng tròn (Round-tripping) nhằm khống doanh thu',
      'Chia nhỏ giao dịch dưới hạn mức duyệt chi đề phòng phê duyệt (Structuring)',
      'Ký lùi ngày chứng từ, lùi ngày hiệu lực giao dịch (Backdating)'
    ],
    dataTables: [
      {
        name: 'audit_logs',
        description: 'Bảng bất biến ghi vết lịch sử hoạt động toàn bộ hệ thống',
        columns: [
          'id (PK)', 
          'table_name', 
          'record_id', 
          'action (CREATE/UPDATE/DELETE)', 
          'old_data', 
          'new_data', 
          'user_id', 
          'ip_address', 
          'session_id', 
          'approver_id (FK)', 
          'is_self_approved (Boolean - SoD check)', 
          'created_at'
        ]
      },
      {
        name: 'audit_anomaly_scores',
        description: 'Bảng lưu vết kết quả chạy machine learning phát hiện gian lận',
        columns: [
          'id (PK)', 
          'expense_id (FK)', 
          'run_date', 
          'benford_digit', 
          'isolation_score', 
          'flag_reason (TEXT[])', 
          'risk_level (low/med/high/critical)', 
          'reviewed_by (FK)', 
          'resolution'
        ]
      }
    ],
    pandasSnippet: `import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from scipy import stats

# ── PHẦN A: KIỂM TRA ĐỊNH LUẬT BENFORD (BENFORD'S LAW DISTRIBUTION) ──
def benford_analysis(dfExpenses, col='total_amount'):
    amounts = dfExpenses[col].dropna()
    amounts = amounts[amounts > 0]
    
    # Trích chữ số đầu tiên (first leading digit)
    first_digits = amounts.astype(str).str.lstrip('0.').str[0].astype(int)
    observed = first_digits.value_counts(normalize=True).sort_index()
    
    # Định luật Benford lý thuyết
    expected = pd.Series({d: np.log10(1 + 1/d) for d in range(1, 10)})
    
    # Chi-Square Test đánh giá đột biến ảo
    obs_counts = [observed.get(d, 0) * len(amounts) for d in range(1, 10)]
    exp_counts = [expected[d] * len(amounts) for d in range(1, 10)]
    chi2, p_val = stats.chisquare(obs_counts, exp_counts)
    
    print(f"Chi2: {chi2:.2f}, p-value: {p_val:.4f} " + ("🚨 Lệch Benford (Nghi vấn!)" if p_val < 0.05 else "✅ Đạt chuẩn"))
    return observed

# ── PHẦN B: MÔ HÌNH ISOLATION FOREST PHÁT HIỆN BẤT THƯỜNG ĐA CHIỀU ──
def detect_multivariate_anomalies(dfExpenses):
    dfExpenses['total_amount'] = pd.to_numeric(dfExpenses['total_amount'])
    df = dfExpenses.copy()
    df['expense_date'] = pd.to_datetime(df['expense_date'])
    df['hour'] = df['expense_date'].dt.hour
    df['dayofweek'] = df['expense_date'].dt.dayofweek
    df['is_round_number'] = (df['total_amount'] % 1000000 == 0).astype(int)
    
    features = ['total_amount', 'hour', 'dayofweek', 'is_round_number']
    X = df[features].fillna(0)
    
    # Tìm kiếm 5% bút toán bất hại bất thường nhất
    iso_forest = IsolationForest(n_estimators=200, contamination=0.05, random_state=42)
    df['anomaly_score'] = iso_forest.fit_predict(X)
    df['anomaly_prob'] = iso_forest.score_samples(X) # Càng âm càng dị biệt
    
    flagged = df[df['anomaly_score'] == -1].sort_values('anomaly_prob')
    return flagged[['id', 'total_amount', 'hour', 'dayofweek', 'anomaly_prob']]`
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
      'Thời gian hòa vốn & Điểm hòa vốn dự án',
      'Hệ số khả năng thanh toán gốc và lãi vay (DSCR >= 1.2)',
      'Chu kỳ chuyển hóa tiền mặt (Cash Conversion Cycle - CCC)',
      'Tỷ lệ tiêu tiền âm & Runway khả dụng (Burn Rate & Runway)',
      'Mô hình đánh giá xác suất phá sản Altman Z-Score'
    ],
    risks: [
      'Dự toán dòng tiền thiếu cơ sở thực tế (quá lạc quan)',
      'Bẫy thanh khoản (kẹt tiền mặt mặc dù sổ sách báo lãi)',
      'Không phân bổ chi phí gián tiếp gây ảo tưởng về lợi nhuận dự án',
      'Rủi ro biến động lãi suất thả nổi trong các khế ước vay ngắn hạn',
      'Chủ doanh nghiệp rút vốn dưới dạng tạm ứng kéo dài gây kiệt quệ tài chính',
      'Rủi ro tập trung doanh thu khách hàng lớn (1 khách nắm giữ > 30% doanh thu)'
    ],
    dataTables: [
      {
        name: 'budget_allocations',
        description: 'Bảng phân bổ ngân sách kế hoạch dự toán hàng tháng',
        columns: ['id (PK)', 'period_month', 'project_id (FK)', 'budgeted_amount', 'actual_spent']
      }
    ],
    pandasSnippet: `import pandas as pd
import numpy as np

# Đọc chỉ số tài chính từ sổ kế toán để tính chỉ số mô hình Altman Z-Score cho doanh nghiệp
# Z = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 0.999*X5
def calculate_altman_z_score(working_capital, total_assets, retained_earnings, ebit, market_cap_equity, total_liabilities, sales):
    X1 = working_capital / total_assets
    X2 = retained_earnings / total_assets
    X3 = ebit / total_assets
    X4 = market_cap_equity / total_liabilities
    X5 = sales / total_assets
    
    z_score = 1.2*X1 + 1.4*X2 + 3.3*X3 + 0.6*X4 + 0.999*X5
    
    if z_score > 2.9:
      zone = "🟢 Vùng an toàn (Safe)"
    elif z_score >= 1.8:
      zone = "🟡 Vùng xám cần cảnh báo nguy cấp (Grey)"
    else:
      zone = "🔴 Vùng nguy hiểm có rủi ro phá sản cao (Distress)"
      
    print(f"Altman Z-Score: {z_score:.2f} -> {zone}")
    return z_score

# Tính chu kỳ chuyển hóa tiền mặt thực nghiệm CCC = DIO + DSO - DPO
# DIO: Số ngày hàng tồn kho bình quân, DSO: Số ngày phải thu, DPO: Số ngày phải trả`
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
      'Hiệu suất máy thi công và nhân công hiện trường',
      'Vòng quay vốn lưu động thi công chi tiết từng công trình',
      'Tỷ lệ tiền bị giữ giữ lại bảo hành hợp đồng (Retention Money Ratio)',
      'Đại lượng CPI & SPI phân tích giá trị thu được (EVM analysis)',
      'Tỷ lệ khối lượng phụ lục phát sinh ngoài dự án (Change Order Rate)',
      'Chỉ số tai nạn lao động mất giờ công sản xuất hữu ích (LTIR)'
    ],
    risks: [
      'Thanh toán vượt khối lượng thực tế nghiệm thu hoàn thành',
      'Thất thoát vật tư lớn do quy trình kiểm tra bãi và kho thô sơ',
      'Chậm tiến độ dẫn đến đền bù phạt vi phạm tiến độ nghiêm trọng',
      'Chủ đầu tư hoặc công trình đóng băng mất hoàn toàn năng lực thanh toán',
      'Nhà thầu phụ nhận tiền tạm ứng rồi đóng băng thi công hoặc tháo chạy khỏi công trình',
      'Thế chấp ký kết sai hình thức Hợp đồng đơn giá và Hợp đồng trọn gói',
      'Hao hụt vật tư xây dựng ngoài trời (cát, xi măng, sắt thép) vượt 15-20%'
    ],
    dataTables: [
      {
        name: 'projects',
        description: 'Bảng quản lý thông tin danh mục công trình dự án',
        columns: [
          'id (PK)', 
          'code', 
          'name', 
          'budget', 
          'start_date', 
          'status', 
          'contract_type (lump_sum/unit_price)', 
          'change_order_count', 
          'change_order_value', 
          'client_credit_score', 
          'bad_weather_days'
        ]
      },
      {
        name: 'project_materials_usage',
        description: 'Báo cáo chi tiết hao xuất định mức vật tư xây lắp',
        columns: ['id (PK)', 'project_id (FK)', 'material_id', 'allocated_qty', 'actual_used_qty']
      },
      {
        name: 'project_evm_snapshots',
        description: 'Lịch sử tuần theo dõi giá trị giá trị thu được của dự án công trình',
        columns: [
          'id (PK)', 
          'project_id (FK)', 
          'snapshot_week', 
          'BAC (Budget At Completion)', 
          'PV (Planned Value)', 
          'EV (Earned Value)', 
          'AC (Actual Cost)', 
          'SPI (Schedule Performance)', 
          'CPI (Cost Performance)', 
          'EAC', 
          'TCPI'
        ]
      },
      {
        name: 'retention_money',
        description: 'Sổ quản lý tiền giữ lại bảo lãnh và bảo hành thi công',
        columns: [
          'id (PK)', 
          'project_id (FK)', 
          'contract_value', 
          'retention_pct', 
          'retained_amount', 
          'release_date', 
          'released_amount', 
          'status'
        ]
      }
    ],
    pandasSnippet: `import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

# ── PHẦN A: PHÂN TÍCH EARNED VALUE MANAGEMENT (EVM) ──
def process_evm_metrics(df_evm):
    # SPI = EV / PV; CPI = EV / AC; EAC = BAC / CPI
    df = df_evm.copy()
    df['CV'] = df['EV'] - df['AC'] # Chênh lệch chi phí
    df['SV'] = df['EV'] - df['PV'] # Chênh lệch tiến độ
    df['SPI'] = (df['EV'] / df['PV']).round(3)
    df['CPI'] = (df['EV'] / df['AC']).round(3)
    
    # Dự báo chi phí khi hoàn thành công trình (EAC)
    df['EAC'] = np.where(df['CPI'] > 0, df['BAC'] / df['CPI'], df['BAC'])
    df['VAC'] = df['BAC'] - df['EAC'] # Variance At Completion
    
    # Xếp loại báo động đỏ cho các dự án trễ hạn và nợ chi phí
    df['alert'] = np.where((df['SPI'] < 0.8) | (df['CPI'] < 0.8), '🔴 Nguy hiểm',
                           np.where((df['SPI'] < 1.0) | (df['CPI'] < 1.0), '🟡 Cảnh báo', '🟢 An toàn'))
    return df

# ── PHẦN B: MÔ HÌNH DỰ ĐOÁN NGUY CƠ CHẬM TRỄ DỰ ÁN (DELAY CLASSIFIER) ──
def predict_construction_delay(df_historical):
    # Sử dụng các đặc trưng: ngày mưa bão, thay đổi thiết kế, % giữ lại, CPI tuần đầu
    features = ['cpi_4week', 'spi_4week', 'change_order_count', 'bad_weather_days', 'retention_pct']
    X = df_historical[features].fillna(0)
    y = df_historical['is_delayed'] # 1 nếu trễ bàn giao > 30 ngày
    
    clf = GradientBoostingClassifier(n_estimators=150, max_depth=4, random_state=42)
    clf.fit(X, y)
    
    # Đánh giá tầm quan trọng của các nguyên nhân gây rủi ro
    importance = pd.Series(clf.feature_importances_, index=features).sort_values(ascending=False)
    print("📈 Tác nhân gây chậm trễ hàng đầu:\\n", importance)
    return clf`
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
      'Tỷ số hoàn hàng / Tỷ lệ đổi trả sản phẩm lỗi',
      'Hiệu suất sinh lời tài sản tồn kho (GMROI - Gross Margin Return on Investment)',
      'Tỷ lệ bán hết trong thời hạn cam kết (Sell-through Rate %)',
      'Tỷ số hết hàng mất mát doanh số & Tỷ lệ lấp đầy đơn (Stockout vs Fill Rate)',
      'Chỉ số tối ưu sắp xếp hàng hóa theo độ ổn định ABC-XYZ'
    ],
    risks: [
      'Kẹt vốn do tồn kho quá 180 ngày không luân chuyển',
      'Thanh lý sản phẩm dưới giá vốn không kiểm soát dòng tiền',
      'Đầu cơ tích trữ sai xu hướng tiêu dùng và biến động thị trường',
      'Dòng tiền bị giam giữ dài hạn tại ví sàn TMĐT (Shopee, TikTok Shop từ 7-14 ngày)',
      'Quy trình đóng băng tài khoản bán hàng trung tâm vì chính sách vi phạm sàn',
      'Đại lý phân phối chiếm dụng vốn hàng hóa ký gửi (Consignment holding)',
      'Biến động tỷ giá bất lợi khi mua hàng nhập khẩu'
    ],
    dataTables: [
      {
        name: 'products',
        description: 'Bảng danh mục vật tư thành phẩm lưu kho',
        columns: [
          'id (PK)', 
          'sku', 
          'product_name', 
          'unit_price', 
          'current_stock', 
          'shelf_life_days', 
          'supplier_id (FK)', 
          'import_duty_rate', 
          'currency_code', 
          'sell_through_rate'
        ]
      },
      {
        name: 'inventory_transactions',
        description: 'Sổ ghi chép chi tiết xuất nhập kho tổng hợp',
        columns: ['id (PK)', 'product_id (FK)', 'transaction_type (IN/OUT)', 'quantity', 'created_at']
      },
      {
        name: 'product_abc_xyz',
        description: 'Bảng phân tích phân bổ xếp hạng ABC-XYZ hàng tồn kho',
        columns: [
          'id (PK)', 
          'product_id (FK)', 
          'period (YYYY-MM)', 
          'abc_class (A/B/C)', 
          'xyz_class (X/Y/Z)', 
          'cv_value (Hệ số biến động)', 
          'revenue_rank', 
          'reorder_strategy'
        ]
      },
      {
        name: 'ecommerce_settlement',
        description: 'Sổ hạch toán dòng tiền đối soát và thanh toán từ sàn thương mại điện tử',
        columns: [
          'id (PK)', 
          'platform (Shopee/TikTok/Lazada)', 
          'order_id', 
          'order_date', 
          'settlement_date', 
          'gross_amount', 
          'platform_fee', 
          'net_amount', 
          'holding_days (Generated)'
        ]
      }
    ],
    pandasSnippet: `import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules

# Phân tích Giỏ hàng (Market Basket Analysis) tìm kiếm các mặt hàng hay mua kèm nhau
def run_market_basket(df_orders, min_support=0.02, min_lift=1.5):
    # Pivot dữ liệu đơn hàng thành ma trận mua sắm nhị phân
    basket = (df_orders.groupby(['order_id', 'product_sku'])['quantity']
              .sum().unstack().reset_index().fillna(0)
              .set_index('order_id'))
    
    # Chuyển đổi sang nhị phân 0 hoặc 1 (true/false)
    basket_sets = basket.applymap(lambda x: 1 if x > 0 else 0)
    
    # Tìm luật kết hợp nâng cao bằng thuật toán Apriori
    frequent_itemsets = apriori(basket_sets, min_support=min_support, use_colnames=True)
    rules = association_rules(frequent_itemsets, metric="lift", min_threshold=min_lift)
    
    # Sắp xếp theo chỉ số LIFT (Độ hiệu quả của đề xuất bán thêm)
    return rules.sort_values(by='lift', ascending=False).head(10)

# Thực hiện phân loại ABC-XYZ định kỳ mỗi tháng:
# A: Đóng góp 80% doanh thu, B: 15%, C: 5%
# X: Nhu cầu ổn định (CV < 0.1), Y: Biến động vừa (0.1 - 0.25), Z: Bất định`
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
      'Năng suất xử lý yêu cầu của kỹ thuật viên / nhân sự',
      'Tỷ lệ xử lý triệt để ngay lần đầu liên hệ (First Contact Resolution - FCR)',
      'Tỷ trọng giờ làm việc thực sự sinh hóa đơn phí (Billable Hours Ratio)',
      'Chỉ số đo lường lòng trung thành định lượng Net Promoter Score (NPS)',
      'Tác nhân doanh thu bình quân trên một nhân sự vận hành',
      'Tần số cuộc gọi lặp lại về cùng một chủ đề khiếu nại (Repeat Contact Rate)'
    ],
    risks: [
      'Vi phạm thỏa thuận dịch vụ SLA dẫn đến đền bù phạt',
      'Mất khách hàng trung thành do trải nghiệm hỗ trợ quá tệ',
      'Quản lý nhân lực lệch ca, giờ cao điểm thiếu người, giờ thấp điểm dư thừa',
      'Quá rủi ro phụ thuộc vào nhân sự lõi độc quyền bí quyết hỗ trợ khách lớn (Key Person Dependency)',
      'Phát tán phạm vi dịch vụ khống mà khách hàng không thanh toán thêm (Scope Creep)',
      'Cơ chế định giá thấp hơn hao tổn chi phí nhân sự thực (Underpricing)'
    ],
    dataTables: [
      {
        name: 'support_tickets',
        description: 'Bảng ghi nhận cuộc gọi và khiếu nại yêu cầu hỗ trợ',
        columns: ['id (PK)', 'customer_id', 'subject', 'status', 'created_at', 'resolved_at', 'sla_breached', 'last_nps_score']
      }
    ],
    pandasSnippet: `import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split

# Dự báo rủi ro khách hàng rời bỏ dịch vụ (Customer Churn Prediction) sử dụng XGBoost
def train_leakage_detector(df_customers):
    features = [
        'days_since_last_contact', 
        'ticket_count_90d', 
        'sla_breach_rate_pct', 
        'avg_resolution_time_hours', 
        'last_nps_score',
        'repeat_contact_rate_pct'
    ]
    X = df_customers[features].fillna(0)
    y = df_customers['churned_within_30d'] # Biến mục tiêu nhị phân
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # Thiết lập trọng số scale do mất cân bằng dữ liệu gốc (imbalanced class)
    model = XGBClassifier(
        n_estimators=200, 
        max_depth=5, 
        learning_rate=0.05, 
        scale_pos_weight=(len(y_train) - sum(y_train)) / sum(y_train),
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)
    
    # Trả về xác suất và phân nhóm can thiệp khẩn cấp bằng email/giảm giá phù hợp
    df_customers['churn_probability'] = model.predict_proba(X)[:, 1]
    return df_customers`
  },
  {
    id: 'manufacturing',
    name: 'Sản xuất (Manufacturing)',
    emoji: '🏭',
    color: 'red',
    kpis: [
      'Hiệu suất thiết bị tổng thể (OEE - Overall Equipment Effectiveness)',
      'Tỷ lệ hư hỏng lỗi phế phẩm phát sinh (Defect Rate)',
      'Chi phí biến động thực tế so với định mức Bom',
      'Tần suất bảo trì máy móc dự phòng khẩn cấp',
      'Tỷ lệ chất lượng đạt chất lượng ngay từ lần đầu ra xưởng (First Pass Yield - FPY)',
      'Đối chiếu Nhịp độ dòng chảy sản xuất và Nhịp cầu khách hàng (Cycle vs Takt Time)',
      'Giá trị bán thành phẩm tích tụ ứ đọng trên luỹ kế truyền sấy (WIP Value)',
      'Hao hụt rác thải hỏng hoàn toàn và Hao hụt sửa chữa sửa lỗi (Scrap vs Rework Rate)',
      'Biến phí chi phí năng lượng điện/khí gas dùng để nung sấy trên một đầu đơn vị hàng'
    ],
    risks: [
      'Sự cố máy đột xuất dừng dây chuyền gây trễ đơn hàng (Downtime)',
      'Sai lệch định mức nguyên vật liệu đầu vào không được giám sát',
      'Lỗi đồng lọt phát sinh trong ca làm việc do hệ thống đo lường không chuẩn',
      'Nguy cơ đứt gãy chuỗi cung ứng vật liệu nhập khẩu bão lãnh',
      'Hàng lỗi do chất lượng nhà cung cấp đầu vào biến đổi lớn không có kiểm tra nhập bãi (Supplier Quality Variance)',
      'Đình chỉ sản xuất hay ngừng lò đột suất do thanh tra không đảm bảo PCCC/ATVSLĐ'
    ],
    dataTables: [
      {
        name: 'bills_of_materials',
        description: 'Bảng công thức định mức chế biến sản phẩm (BOM)',
        columns: ['id (PK)', 'finished_good_id', 'raw_material_id', 'required_quantity']
      },
      {
        name: 'machine_downtime_logs',
        description: 'Bảng theo dõi thời gian ngừng hoạt động sự cố của máy móc',
        columns: ['id (PK)', 'machine_id', 'start_time', 'end_time', 'reason_code']
      },
      {
        name: 'machine_sensor_logs',
        description: 'Báo cáo nhật ký thông số hoạt động IoT từ sensor máy biến áp và gia công',
        columns: ['id (PK)', 'machine_id (FK)', 'log_time', 'temperature_c', 'vibration_mms', 'current_load_pct', 'error_code']
      },
      {
        name: 'machine_master',
        description: 'Hồ sơ lý lịch tài sản thiết bị nhà máy chính',
        columns: ['id (PK)', 'code', 'name', 'manufacturer', 'install_date', 'design_life_hours', 'cumulative_runtime_h', 'predicted_failure_date', 'failure_probability']
      },
      {
        name: 'quality_measurements',
        description: 'Báo cáo chỉ số quản lý thống kê kiểm soát chất lượng đầu ra',
        columns: ['id (PK)', 'product_id', 'production_shift_id', 'measured_at', 'metric_name', 'measured_value', 'usl (Upper Spec)', 'lsl (Lower Spec)', 'is_defect']
      }
    ],
    pandasSnippet: `import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier

# ── PHẦN A: BẢO TRÌ DỰ ĐOÁN LỖI MÁY MÓC (PREDICTIVE MAINTENANCE) ──
def predict_machine_breakdown(df_sensors):
    features = ['avg_temperature_7d', 'avg_vibration_7d', 'hours_since_last_maint', 'cumulative_runtime_h']
    X = df_sensors[features].fillna(df_sensors[features].median())
    y = df_sensors['breakdown_within_7d'] # 1 nếu máy hỏng trong 7 ngày tới
    
    rf = RandomForestClassifier(n_estimators=300, max_depth=6, class_weight='balanced', random_state=42)
    rf.fit(X, y)
    
    # Dự báo điểm xác suất sự cố để hệ thống phát cảnh báo bảo trì khẩn cấp
    df_sensors['failure_risk'] = rf.predict_proba(X)[:, 1]
    return df_sensors

# ── PHẦN B: KIỂM SOÁT QUY TRÌNH THỐNG KÊ BIỂU ĐỒ SHEWHART (SPC SCHEWART CHART) ──
def shewhart_quality_control(df_quality, metric='measured_value'):
    # Gom nhóm theo ca sản xuất (subgroup n=5) và tính toán đường giới hạn kiểm soát
    stats = df_quality.groupby('production_shift_id')[metric].agg(['mean', 'std', 'count'])
    stats.columns = ['x_bar', 'std_dev', 'n']
    
    grand_mean = stats['x_bar'].mean()
    avg_std = stats['std_dev'].mean()
    
    # Hệ số A2 tiêu chuẩn cho mẫu n=5 là 0.577 để tìm vùng UCL, LCL của quy trình
    A2 = 0.577
    stats['UCL'] = grand_mean + A2 * avg_std
    stats['LCL'] = grand_mean - A2 * avg_std
    stats['out_of_control'] = (stats['x_bar'] > stats['UCL']) | (stats['x_bar'] < stats['LCL'])
    
    # Điểm nằm ngoài dải UCL/LCL là dấu hiệu hệ thống lò nung/máy dập bị lệch tâm lệch nhiệt
    return stats`
  }
];
