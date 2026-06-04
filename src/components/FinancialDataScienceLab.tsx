import React, { useState } from 'react';
import { 
  Percent, TrendingUp, Cpu, Copy, BookOpen, AlertCircle, Sparkles, Scale, 
  HelpCircle, Activity, Play, ChevronRight, BarChart3, LineChart, PieChart,
  DollarSign, Sliders, Server, Library
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  Legend, ReferenceLine, LineChart as RechartsLineChart, Line
} from 'recharts';

export default function FinancialDataScienceLab() {
  const [findsSubTab, setFindsSubTab] = useState<'ltv_cac' | 'capm_beta' | 'monte_carlo'>('ltv_cac');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // LTV/CAC Churn States
  const [arpu, setArpu] = useState<number>(450000); // 450,000 VND / month
  const [churn, setChurn] = useState<number>(5.5); // 5.5% month over month
  const [cac, setCac] = useState<number>(1200000); // 1,200,000 VND acqusition cost

  // CAPM Beta States
  const [riskFreeRate, setRiskFreeRate] = useState<number>(4.8); // 4.8% govt bond proxy
  const [marketRate, setMarketRate] = useState<number>(12.2); // 12.2% average market return
  const [betaValue, setBetaValue] = useState<number>(1.25); // system volatility multiplier

  // Monte Carlo NPV States
  const [mcInvestment, setMcInvestment] = useState<number>(350); // 350 Million VND
  const [mcCashFlow, setMcCashFlow] = useState<number>(110); // 110 Million VND expected per year
  const [mcVolatility, setMcVolatility] = useState<number>(22); // 22% SD
  const [mcDiscount, setMcDiscount] = useState<number>(10.5); // 10.5% WACC
  const [mcYears, setMcYears] = useState<number>(5); // 5 years horizon

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Lỗi sao chép: ', err);
    });
  };

  // 1. Data Generators
  const getLtvCacChartData = () => {
    const data = [];
    for (let ch = 1.5; ch <= 20; ch += 1.5) {
      const lifetime = 100 / ch;
      const simulatedLtv = arpu * lifetime;
      const ratio = simulatedLtv / cac;
      data.push({
        churnRate: `${ch}%`,
        rValue: ch,
        ratio: parseFloat(ratio.toFixed(2)),
        healthyThreshold: 3.0
      });
    }
    return data;
  };

  const getCapmChartData = () => {
    const data = [];
    for (let b = 0; b <= 2.2; b += 0.2) {
      const expected = riskFreeRate + b * (marketRate - riskFreeRate);
      data.push({
        beta: parseFloat(b.toFixed(2)),
        expectedReturn: parseFloat(expected.toFixed(2)),
        marketReturn: marketRate,
        riskFree: riskFreeRate
      });
    }
    return data;
  };

  const getMonteCarloPaths = () => {
    const yearsArray = Array.from({ length: mcYears + 1 }, (_, year) => {
      if (year === 0) {
        return {
          name: 'Y0 (Cọc)',
          Path1: -mcInvestment,
          Path2: -mcInvestment,
          Path3: -mcInvestment,
          Path4: -mcInvestment,
          Path5: -mcInvestment,
        };
      }
      
      const p1v = mcCashFlow * (1 + (Math.sin(year * 1.5) * mcVolatility) / 100);
      const p2v = mcCashFlow * (1 + (Math.cos(year * 2.2) * mcVolatility) / 100);
      const p3v = mcCashFlow * (1 + (Math.sin(year * 3.7 + 0.5) * mcVolatility) / 100);
      const p4v = mcCashFlow * (1 + (Math.cos(year * 0.9 - 1.2) * mcVolatility * 1.1) / 100);
      const p5v = mcCashFlow * (1 + (Math.sin(year * 2.9 + 2) * mcVolatility * 0.9) / 100);
      
      return {
        name: `Năm ${year}`,
        Path1: parseFloat(p1v.toFixed(1)),
        Path2: parseFloat(p2v.toFixed(1)),
        Path3: parseFloat(p3v.toFixed(1)),
        Path4: parseFloat(p4v.toFixed(1)),
        Path5: parseFloat(p5v.toFixed(1)),
      };
    });
    return yearsArray;
  };

  const calculateDeterministicNPVs = () => {
    const paths = getMonteCarloPaths();
    const rate = mcDiscount / 100;
    const npvs = [];
    for (let pNum = 1; pNum <= 5; pNum++) {
      let npv = -mcInvestment;
      for (let y = 1; y <= mcYears; y++) {
        const cf = (paths[y] as any)[`Path${pNum}`];
        npv += cf / Math.pow(1 + rate, y);
      }
      npvs.push(parseFloat(npv.toFixed(1)));
    }
    return npvs;
  };

  const npvs = calculateDeterministicNPVs();
  const positiveNpvsCount = npvs.filter(v => v > 0).length;
  const successRatio = (positiveNpvsCount / npvs.length) * 100;
  const averageNPV = parseFloat((npvs.reduce((a, b) => a + b, 0) / npvs.length).toFixed(1));

  // Calculations for static parameters
  const calculatedLifespan = parseFloat((100 / churn).toFixed(1));
  const calculatedLTV = Math.round(arpu * calculatedLifespan);
  const calculatedLtvCacRatio = parseFloat((calculatedLTV / cac).toFixed(2));

  // expected return CAPM
  const expectedReturnCapm = parseFloat((riskFreeRate + betaValue * (marketRate - riskFreeRate)).toFixed(2));

  // Python Code blocks
  const pythonSnippets = {
    ltv_cac: `import pandas as pd
from lifelines import KaplanMeierFitter

# Dữ liệu mẫu giao dịch của 100 doanh nghiệp
df = pd.DataFrame({
    'months_active': [12, 5, 24, 2, 8, 15, 1, 36, 18, 9],
    'churned': [1, 1, 0, 1, 0, 1, 1, 0, 1, 0] # 0 = Đang đồng hành, 1 = Đã rời bỏ
})

kmf = KaplanMeierFitter()
kmf.fit(df['months_active'], event_observed=df['churned'])

# Tính Lifespan kỳ vọng hiệu số và vẽ đường tỷ lệ giữ chân
print("Xác suất giữ chân giữ khách hàng tích luỹ qua từng tháng:")
print(kmf.survival_function_)`,
    capm_beta: `import pandas as pd
import statsmodels.api as sm

# Đọc bảng lịch sử lợi suất ngày của tài sản và chỉ số thị trường (VN-Index)
df = pd.read_csv('vietnam_stock_returns.csv')
# returns_asset = df['asset_close'].pct_change()
# returns_market = df['vnindex_close'].pct_change()

# Loại bỏ NaN
df = df.dropna()

# Sử dụng Ordinary Least Squares (OLS) của statsmodels để lấy hệ số Beta
X = sm.add_constant(df['returns_market'])
y = df['returns_asset']
model = sm.OLS(y, X).fit()

print(f"Hệ số Beta đo lường rủi ro hệ thống: {model.params['returns_market']:.4f}")
print(f"R-squared (độ khớp mô hình): {model.rsquared:.4f}")`,
    monte_carlo: `import numpy as np

# Giả lập 10,000 kịch bản NPV cho dự án với sai số chuẩn
runs = 10000
years = 5
discount_rate = 0.105 # 10.5% WACC
initial_investment = 350 # triệu VND

# Giả định dòng tiền kỳ vọng và độ lệch biên
annual_mean = 110 # triệu VND / năm
volatility = 0.22 # 22% độ lệch chuẩn vận hành

all_npvs = []
for _ in range(runs):
    # Khởi tạo dòng tiền ngẫu nhiên theo phân phối chuẩn
    cash_flows = np.random.normal(annual_mean, annual_mean * volatility, years)
    discounted_flows = [cf / (1 + discount_rate)**(t+1) for t, cf in enumerate(cash_flows)]
    npvs_calculated = sum(discounted_flows) - initial_investment
    all_npvs.append(npvs_calculated)

# Xác suất đạt Net Present Value > 0
prob_success = np.mean(np.array(all_npvs) > 0) * 100
print(f"NPV kỳ vọng trung vị: {np.mean(all_npvs):.2f} triệu VND")
print(f"Xác suất dự án có lời (NPV > 0): {prob_success:.2f}%")`
  };

  return (
    <div className="bg-[#040810] border border-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute right-0 top-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl"></div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Navigation Inside Lab (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-900">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest pl-2.5 block mb-2 font-mono">FINDS MODULES</span>
            
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'ltv_cac', label: '1. Churn & LTV / CAC', desc: 'Survival math model', color: 'text-indigo-400' },
                { id: 'capm_beta', label: '2. CAPM & Hệ số Beta', desc: 'Linear asset volatility', color: 'text-emerald-400' },
                { id: 'monte_carlo', label: '3. Monte Carlo Cash Flow', desc: 'Investment NPV risks', color: 'text-pink-400' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFindsSubTab(item.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                    findsSubTab === item.id
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'bg-transparent border-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div>
                    <span className="text-[11.5px] font-black block">{item.label}</span>
                    <span className="text-[9px] text-slate-500 font-bold font-mono block mt-0.5">{item.desc}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                    findsSubTab === item.id ? 'translate-x-1 text-indigo-400' : 'text-slate-600'
                  }`} />
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-1.5">
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Tại sao cần định lượng?
            </span>
            <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
              Kinh doanh kiểu "cảm tính" rất dễ rơi vào bẫy vốn hóa. Việc kết hợp Khoa học dữ liệu vào dòng tiền cho phép kiểm định xác suất thành bại trước khi giải ngân một cách khoa học nhất.
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Panel (9 cols) */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: LTV/CAC optimization */}
          {findsSubTab === 'ltv_cac' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-sm font-black text-indigo-200 uppercase tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Chỉ số Đánh Giá Khách Hàng Churn Rate & Tỷ lệ LTV / CAC
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Dự tính toán học giá trị dài hạn bình quân trên mỗi chi phí thu hộ</p>
                </div>
                <span className="bg-indigo-550/10 text-indigo-450 border border-indigo-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">Survival analysis</span>
              </div>

              {/* Slider variables */}
              <div className="grid md:grid-cols-3 gap-6 bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Biên doanh thu ARPU (tháng):</span>
                    <strong className="text-white font-mono">{arpu.toLocaleString('vi-VN')} VND</strong>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="2500000"
                    step="50000"
                    value={arpu}
                    onChange={(e) => setArpu(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Tiền khách hàng chi mỗi tháng</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Tỷ lệ rời bỏ (MoM Churn):</span>
                    <strong className="text-indigo-450 font-mono">{churn}%</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="25"
                    step="0.5"
                    value={churn}
                    onChange={(e) => setChurn(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Xác suất rời đi của khách hàng / tháng</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Chi phí tìm khách (CAC):</span>
                    <strong className="text-white font-mono">{cac.toLocaleString('vi-VN')} VND</strong>
                  </div>
                  <input
                    type="range"
                    min="200000"
                    max="5000000"
                    step="100000"
                    value={cac}
                    onChange={(e) => setCac(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Marketing spend / Khách mua thật</span>
                </div>
              </div>

              {/* Outputs Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#050a14] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Lifespan Kỳ Vọng</span>
                  <strong className="text-xs text-slate-200 mt-2 font-mono block font-black">{calculatedLifespan} tháng</strong>
                  <span className="text-[8.5px] text-slate-600 leading-tight block mt-1">100 / Churn rate</span>
                </div>

                <div className="bg-[#050a14] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Lifetime Value (LTV)</span>
                  <strong className="text-xs text-indigo-400 mt-2 font-mono block font-black">{calculatedLTV.toLocaleString('vi-VN')} VND</strong>
                  <span className="text-[8.5px] text-slate-600 leading-tight block mt-1">ARPU × Lifespan</span>
                </div>

                <div className="bg-[#050a14] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Tỷ số LTV / CAC</span>
                  <strong className={`text-xs mt-2 font-mono block font-black ${
                    calculatedLtvCacRatio >= 3.0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>{calculatedLtvCacRatio}x</strong>
                  <span className="text-[8.5px] text-slate-600 leading-tight block mt-1">Chuẩn lành mạnh ➔ ≥ 3x</span>
                </div>

                <div className="bg-[#050a14] border border-slate-900 p-3 rounded-xl flex flex-col justify-between">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Kết luận Tài chính</span>
                  <strong className={`text-[11px] mt-2 block font-extrabold ${
                    calculatedLtvCacRatio >= 3.0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {calculatedLtvCacRatio >= 5.0 ? 'Siêu dồi dào' : calculatedLtvCacRatio >= 3.0 ? 'Vận hành tối ưu' : 'Đốt tiền không bù'}
                  </strong>
                  <span className="text-[8.5px] text-slate-600 leading-tight block mt-1">Ước lượng sức bền kinh doanh</span>
                </div>
              </div>

              {/* Chart Plotting curve */}
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                  Đồ Thị Đèn Loãng Tỷ Số LTV / CAC Theo Churn (%)
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={getLtvCacChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="churnRate" tick={{ fill: '#475569', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#475569', fontSize: 9 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px' }}
                      />
                      <ReferenceLine y={3.0} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Lành mạnh (3x)", fill: '#10b981', fontSize: 8, position: 'top' }} />
                      <Line type="monotone" dataKey="ratio" stroke="#6366f1" strokeWidth={3} dot={false} name="LTV / CAC" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-slate-500 text-center italic font-semibold">
                  Nhận xét: Khi tỷ lệ Churn nhảy cao từ 5% lên 15%, giá trị khách hàng thâm hụt theo đường cong luỹ kế mũ. Đây là lý do mô hình kinh doanh SaaS hỏng chân nếu không kiểm soát sụt rớt khách hàng.
                </p>
              </div>

              {/* Advanced Research & Python */}
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <div className="flex justify-between items-center bg-indigo-950/20 p-4 rounded-xl border border-indigo-900/10">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">🔍 Nghiên cứu Kaplan-Meier Survival Analysis trong Finance</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
                      Trong thực tế, khách hàng không rũ bỏ cùng một lúc chuẩn phẳng. Khoa học dữ liệu sử dụng mô hình Ước lượng Số phận **Survival Analysis** để tính độ lún thời gian, xử lý các khách hàng đang dở dang (Censored data) nhằm cho biên thống kê tối cao.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-bold text-slate-400 font-mono">pandas_survival_model.py</span>
                    <button
                      onClick={() => copyToClipboard(pythonSnippets.ltv_cac, 'ltv_cac')}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-[9px] transition-all"
                    >
                      {copiedId === 'ltv_cac' ? 'Đã copy' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl overflow-x-auto font-mono text-[11px] text-slate-400 leading-relaxed font-semibold">
                    {pythonSnippets.ltv_cac}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CAPM Beta */}
          {findsSubTab === 'capm_beta' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-sm font-black text-emerald-205 uppercase tracking-tight flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Định Giá Lợi Suất Tài Sản Vốn CAPM & Hệ Số Rủi Ro Beta (β)
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Xác định tỷ suất lợi nhuận kỳ vọng của tài sản dựa vào rủi ro hệ thống của thị trường</p>
                </div>
                <span className="bg-emerald-550/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">Asset pricing</span>
              </div>

              {/* Sliders in grid */}
              <div className="grid md:grid-cols-3 gap-6 bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Lợi suất phi rủi ro (Risk-Free):</span>
                    <strong className="text-white font-mono">{riskFreeRate}%</strong>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="0.1"
                    value={riskFreeRate}
                    onChange={(e) => setRiskFreeRate(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Thương chuẩn trái phiếu chính phủ</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Hệ số nhạy rủi ro Beta (β):</span>
                    <strong className="text-emerald-450 font-mono">{betaValue}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.05"
                    value={betaValue}
                    onChange={(e) => setBetaValue(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Mức độ biến động so với VN-Index</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 font-bold">Lợi suất sàn thị trường (Rm):</span>
                    <strong className="text-white font-mono">{marketRate}%</strong>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="22"
                    step="0.2"
                    value={marketRate}
                    onChange={(e) => setMarketRate(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[9px] text-slate-600 font-mono block">Lợi nhuận bình quân của rổ VN-Index</span>
                </div>
              </div>

              {/* Calculations Block */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#050a0a] border border-slate-900 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Lợi nhuận kỳ vọng CAPM</span>
                  <strong className="text-md text-emerald-450 mt-2 font-mono block font-black">{expectedReturnCapm}%</strong>
                  <span className="text-[8.5px] text-slate-600 block mt-1">Rf + β × (Rm - Rf)</span>
                </div>

                <div className="bg-[#050a0a] border border-slate-900 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Bù đắp rủi ro (Premium)</span>
                  <strong className="text-xs text-slate-300 mt-2 font-mono block font-black">{(marketRate - riskFreeRate).toFixed(2)}%</strong>
                  <span className="text-[8.5px] text-slate-600 block mt-1">(Rm - Rf)</span>
                </div>

                <div className="bg-[#050a0a] border border-slate-900 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Tính chất biến động</span>
                  <strong className="text-xs text-slate-300 mt-2 block font-extrabold whitespace-nowrap">
                    {betaValue === 1 ? 'Khớp thị trường' : betaValue > 1 ? 'Tính cơ hội cao (Aggr)' : 'Phòng vệ vững chãi'}
                  </strong>
                  <span className="text-[8.5px] text-slate-600 block mt-1">Hao phí biến động hệ thống</span>
                </div>

                <div className="bg-[#050a0a] border border-slate-900 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Ứng dụng Khoa học Số</span>
                  <strong className="text-xs text-slate-200 mt-2 block font-bold">Hồi quy tuyến tính</strong>
                  <span className="text-[8.5px] text-slate-600 block mt-1">Bằng OLS từ phân tích Pandas</span>
                </div>
              </div>

              {/* Graph of SML Line */}
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                  Đường Thị Trường Chứng Khoán (Security Market Line - SML)
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={getCapmChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="beta" type="number" domain={[0, 2.2]} tick={{ fill: '#475569', fontSize: 9 }} label={{ value: 'Hệ số Beta (β)', position: 'insideBottom', offset: -5, fill: '#475569', fontSize: 8 }} />
                      <YAxis tick={{ fill: '#475569', fontSize: 9 }} label={{ value: 'Kỳ vọng (Ke %)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 8 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px' }}
                      />
                      <ReferenceLine x={1.0} stroke="#475569" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="expectedReturn" stroke="#10b981" strokeWidth={3} dot={true} name="Expected Return" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10.5px] text-slate-400 bg-slate-900/40 p-3 rounded-lg leading-relaxed font-semibold">
                  💡 <strong>Diễn giải SML:</strong> Điểm Beta = 1.0 đại diện cho rủi ro bằng đúng thị trường, với mức sinh lời tương ứng Rm = {marketRate}%. Với tài sản của bạn có hệ số Beta = {betaValue}, mô hình định lượng tính toán bạn phải đòi hỏi mức sinh lời tối thiểu {expectedReturnCapm}% để đền bù rủi ro biến thiên đã gánh chịu.
                </div>
              </div>

              {/* Research and Python snippet code */}
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <div className="flex justify-between items-center bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/10">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">🔍 Hệ số Beta dốc được kiến tạo từ Hồi Quy Tuyến Tính (Linear Regression) ra sao?</h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
                      Trong tài chính số lượng, hệ số Beta thực tế không phải là tự chế, mà là kết quả của việc chạy hồi quy tuyến tính bình phương tối thiểu (OLS). Biến động giá của một cổ phiếu được hồi quy phụ thuộc vào biến động tổng thể của thị trường chứng khoán gốc.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-bold text-slate-400 font-mono">ols_beta_regression.py</span>
                    <button
                      onClick={() => copyToClipboard(pythonSnippets.capm_beta, 'capm_beta')}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-[9px] transition-all"
                    >
                      {copiedId === 'capm_beta' ? 'Đã copy' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl overflow-x-auto font-mono text-[11px] text-slate-400 leading-relaxed font-semibold">
                    {pythonSnippets.capm_beta}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Monte Carlo simulation NPV */}
          {findsSubTab === 'monte_carlo' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div>
                  <h3 className="text-sm font-black text-pink-205 uppercase tracking-tight flex items-center gap-2">
                    <Activity className="w-4 h-4 text-pink-400" />
                    Giả Lập Dòng Tiền & Đo Lường Xác Suất Lời Dự Án Bằng Monte Carlo
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Thực thi hàng trăm kịch bản thị trường biến đổi bất định để tính toán Net Present Value (NPV)</p>
                </div>
                <span className="bg-pink-550/10 text-pink-450 border border-pink-500/20 text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono">Probabilistic cash flow</span>
              </div>

              {/* Sliders in grid */}
              <div className="grid md:grid-cols-5 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-900">
                <div className="space-y-1 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Đầu tư (Y0):</span>
                  <strong className="text-xs font-mono text-white block mt-0.5">{mcInvestment}M VND</strong>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="20"
                    value={mcInvestment}
                    onChange={(e) => setMcInvestment(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Tiền thu / Năm:</span>
                  <strong className="text-xs font-mono text-white block mt-0.5">{mcCashFlow}M VND</strong>
                  <input
                    type="range"
                    min="30"
                    max="400"
                    step="10"
                    value={mcCashFlow}
                    onChange={(e) => setMcCashFlow(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Độ lệch biên SD (%):</span>
                  <strong className="text-xs font-mono text-pink-405 block mt-0.5">{mcVolatility}%</strong>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={mcVolatility}
                    onChange={(e) => setMcVolatility(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Lợi suất đòi hỏi (WACC):</span>
                  <strong className="text-xs font-mono text-white block mt-0.5">{mcDiscount}%</strong>
                  <input
                    type="range"
                    min="4"
                    max="20"
                    step="0.5"
                    value={mcDiscount}
                    onChange={(e) => setMcDiscount(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                </div>

                <div className="space-y-1 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block">Thời gian thẩm định:</span>
                  <strong className="text-xs font-mono text-white block mt-0.5">{mcYears} Năm</strong>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    step="1"
                    value={mcYears}
                    onChange={(e) => setMcYears(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                </div>
              </div>

              {/* Calculations and outputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0a050a] border border-slate-900 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">NPV Trung bình Simulated</span>
                  <strong className={`text-xs mt-2 font-mono block font-black ${
                    averageNPV > 0 ? 'text-pink-400' : 'text-rose-450'
                  }`}>{averageNPV}M VND</strong>
                  <span className="text-[8.5px] text-slate-600 block mt-1">Dư trị giá hiện tại ròng</span>
                </div>

                <div className="bg-[#0a050a] border border-slate-900 p-3 rounded-xl">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Xác suất thành công</span>
                  <strong className="text-xs text-pink-400 mt-2 font-mono block font-black">{successRatio}%</strong>
                  <span className="text-[8.5px] text-slate-600 block mt-1">Tỷ lệ kịch bản có lời NPV &gt; 0</span>
                </div>

                <div className="bg-[#0a050a] border border-slate-900 p-3 rounded-xl col-span-2">
                  <span className="text-[9px] text-slate-500 font-extrabold uppercase">Giá trị NPV theo 5 kịch bản thị trường khác nhau:</span>
                  <div className="flex gap-1.5 mt-2 font-mono text-[9px] font-bold">
                    {npvs.map((val, idx) => (
                      <span key={idx} className={`px-1.5 py-0.5 rounded border ${
                        val > 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-450'
                      }`}>
                        KB{idx+1}: {val > 0 ? `+${val}` : val}M
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chart of Simulated Paths */}
              <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">
                  Động Thái Dòng Tiền Trực Quan Hoá Qua 5 Kịch Bản Giả Lập
                </span>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={getMonteCarloPaths()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                      <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#475569', fontSize: 9 }} label={{ value: 'Dòng tiền ròng (M)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 8 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px' }}
                      />
                      <Line type="monotone" dataKey="Path1" stroke="#f43f5e" strokeWidth={1.5} dot={true} name="Kịch bản 1 (Tệ)" />
                      <Line type="monotone" dataKey="Path2" stroke="#3b82f6" strokeWidth={1.5} dot={true} name="Kịch bản 2 (TB)" />
                      <Line type="monotone" dataKey="Path3" stroke="#10b981" strokeWidth={1.5} dot={true} name="Kịch bản 3 (Tốt)" />
                      <Line type="monotone" dataKey="Path4" stroke="#a855f7" strokeWidth={1.5} dot={true} name="Kịch bản 4" />
                      <Line type="monotone" dataKey="Path5" stroke="#eab308" strokeWidth={1.5} dot={true} name="Kịch bản 5" />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-slate-500 flex gap-4 justify-center font-bold">
                  <span>🔴 Y0 đại diện cho Chi phí đầu tư thọc cọc ban đầu (-{mcInvestment}M VND).</span>
                  <span>🟢 Chênh lệch năm 1 - {mcYears} thể hiện rủi ro doanh vụ thăng trầm trong nước.</span>
                </div>
              </div>

              {/* Research and Python snippet code */}
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-1.5">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider font-mono block">⚖️ Chỉ số tài chính mở rộng: Altman Z-Score</span>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
                      Mô hình thống kê tính toán xác suất mất khả năng thanh toán của một doanh nghiệp trong vòng 2 năm. Được tính bằng hồi quy đa số trọng số dựa trên các chỉ số thanh khoản, lợi nhuận giữ lại, EBITDA trên tổng tài sản. Nếu **Z &gt; 2.99** là cực kỳ an toàn, **Z &lt; 1.81** là vùng báo động đỏ (Distress Zone).
                    </p>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-1.5">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider font-mono block">📉 Thước đo rủi ro: Value-at-Risk (VaR)</span>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
                      Chỉ số định lượng tổn thất tối đa của danh mục đầu tư trong một khoảng thời gian nhất định với mức tin cậy xác định (ví dụ 95%). Thường được tính bằng cách nhân tích trị giá tài sản với hệ số chuẩn lệch biên `1.645 * Volatility` trong cấu trúc dữ liệu khoa học.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-bold text-slate-400 font-mono">numpy_monte_carlo.py</span>
                    <button
                      onClick={() => copyToClipboard(pythonSnippets.monte_carlo, 'monte_carlo')}
                      className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-800 text-[9px] transition-all"
                    >
                      {copiedId === 'monte_carlo' ? 'Đã copy' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl overflow-x-auto font-mono text-[11px] text-slate-400 leading-relaxed font-semibold">
                    {pythonSnippets.monte_carlo}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
