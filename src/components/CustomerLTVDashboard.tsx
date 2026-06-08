import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  TrendingUp, 
  ShieldAlert, 
  Users, 
  Heart, 
  DollarSign, 
  ArrowRight, 
  Percent, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  Inbox,
  Activity,
  UserCheck,
  Zap,
  Mail,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  LineChart, 
  Line, 
  Legend,
  BarChart,
  Bar
} from 'recharts';

export default function CustomerLTVDashboard() {
  const { activeIdea } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'ltv_calc' | 'churn_predictor' | 'cohort_chart' | 'health_score'>('ltv_calc');

  // LTV Calculator States
  const [arpu, setArpu] = useState<number>(150); // USD or K VND
  const [churnRate, setChurnRate] = useState<number>(3.5); // %
  const [grossMargin, setGrossMargin] = useState<number>(85); // %
  const [cac, setCac] = useState<number>(250); // USD or K VND

  // Synchronize state when activeIdea changes dynamically
  useEffect(() => {
    if (activeIdea) {
      const isGame = activeIdea.type === 'game';
      const pointsInK = Math.max(10, Math.round(activeIdea.pricePoint / 1000));
      setArpu(pointsInK);
      
      // Setup smart default parameters based on ICP / Model
      if (isGame) {
        setChurnRate(8.5); // higher churn for casual games
        setGrossMargin(90); // generic digital products
        setCac(5); // Ultra cheap viral acquisition cost (5K per install)
      } else if (activeIdea.id === 'idea_saas_vietqr') {
        setChurnRate(2.8); // low churn utility
        setGrossMargin(95); // simple webhook cost
        setCac(15); // cheap online merchant acquisition
      } else {
        setChurnRate(4.0);
        setGrossMargin(85);
        setCac(35);
      }
    }
  }, [activeIdea]);

  // Calculated metrics
  const ltv = useMemo(() => {
    if (churnRate <= 0) return 0;
    return Math.round((arpu * (grossMargin / 100)) / (churnRate / 100));
  }, [arpu, churnRate, grossMargin]);

  const ltvToCacRatio = useMemo(() => {
    if (cac <= 0) return 0;
    return parseFloat((ltv / cac).toFixed(2));
  }, [ltv, cac]);

  const paybackPeriod = useMemo(() => {
    if (arpu <= 0 || grossMargin <= 0) return 0;
    return parseFloat((cac / (arpu * (grossMargin / 100))).toFixed(1));
  }, [cac, arpu, grossMargin]);

  // Sensitivity analysis data based on churn range
  const sensitivityData = useMemo(() => {
    const steps = [1.5, 2.5, 3.5, 5, 7.5, 10, 15];
    return steps.map(cRate => {
      const computedLtv = Math.round((arpu * (grossMargin / 100)) / (cRate / 100));
      return {
        churn: `${cRate}%`,
        'Giá trị LTV': computedLtv,
        'LTV / CAC ratio': parseFloat((computedLtv / cac).toFixed(1)),
        'Khuyên dùng': computedLtv / cac >= 3 ? 'Khỏe mạnh (>=3x)' : 'Báo động (<3x)'
      };
    });
  }, [arpu, grossMargin, cac]);

  // Churn Predictor States & Simulated Actions
  const [mockAlerts, setMockAlerts] = useState([
    { id: 1, name: 'Công ty TNHH Minh Sang', logo: 'MS', type: 'Giảm Đăng Nhập', status: 'Nguy cơ cao', score: 85, daysInactive: 12, value: '2.5M VND/tháng', avatarColor: 'bg-red-500/20 text-red-400' },
    { id: 2, name: 'SaaS Startup H20 VN', logo: 'HS', type: 'Lỗi Tích Hợp Thẻ Ngân Hàng', status: 'Trung bình', score: 64, daysInactive: 4, value: '5.2M VND/tháng', avatarColor: 'bg-amber-500/20 text-amber-400' },
    { id: 3, name: 'Hộ Kinh Doanh Phát Đạt', logo: 'PĐ', type: 'NPS Thấp (4/10)', status: 'Trung bình', score: 58, daysInactive: 0, value: '800K VND/tháng', avatarColor: 'bg-yellow-500/20 text-yellow-400' },
    { id: 4, name: 'Chuỗi Coffee Acoustic', logo: 'CA', type: 'Giảm Hóa Đơn Xuất 80%', status: 'Cực kỳ nguy cơ', score: 92, daysInactive: 18, value: '1.2M VND/tháng', avatarColor: 'bg-red-600/30 text-red-500' },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleTriggerAction = (companyName: string, actionName: string) => {
    setNotification(`Đã kích hoạt hành động "${actionName}" gửi tới ${companyName}. Trạng thái chiến dịch: Hoàn tất!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Cohort Heatmap state
  const [cohortSize, setCohortSize] = useState<number>(120);
  const [retentionRates, setRetentionRates] = useState({
    m0: 100, m1: 85, m2: 76, m3: 70, m4: 67, m5: 64, m6: 62, m12: 55
  });

  // Calculate cohort row simulation
  const cohortRows = [
    { name: 'Tháng 10/2025', count: 150, rates: [100, 88, 79, 74, 70, 68, 65, 58] },
    { name: 'Tháng 11/2025', count: 180, rates: [100, 85, 77, 71, 68, 63, 61, 54] },
    { name: 'Tháng 12/2025', count: 210, rates: [100, 82, 73, 68, 65, 62, 59, 52] },
    { name: 'Tháng 01/2026', count: 240, rates: [100, 86, 78, 72, 69, 64, 62, 55] },
    { name: 'Tháng 02/2026', count: 280, rates: [100, 89, 81, 76, 72, 69, 66, 0] }, // incomplete
    { name: 'Tháng 03/2026', count: 320, rates: [100, 84, 75, 70, 66, 63, 0, 0] }, // incomplete
    { name: 'Tháng 04/2026', count: 380, rates: [100, 87, 79, 73, 0, 0, 0, 0] }, // incomplete
    { name: 'Tháng 05/2026', count: 420, rates: [100, 91, 83, 0, 0, 0, 0, 0] }, // incomplete
  ];

  // Health Score Model Configuration
  const [weightBilling, setWeightBilling] = useState<number>(30); // %
  const [weightEngagement, setWeightEngagement] = useState<number>(40); // %
  const [weightSupport, setWeightSupport] = useState<number>(15); // %
  const [weightNps, setWeightNps] = useState<number>(15); // %

  const [activeHealthProfile, setActiveHealthProfile] = useState({
    billing: 95,      // thanh toán đều, nâng cấp premium
    engagement: 75,   // login 8 lần/tuần, xuất báo cáo nhiều
    support: 80,      // không có ticket quá hạn, độ hài lòng cao
    nps: 90           // NPS chấm 9/10
  });

  const computedHealthScore = useMemo(() => {
    const totalWeight = weightBilling + weightEngagement + weightSupport + weightNps;
    if (totalWeight === 0) return 0;
    
    const rawScore = (
      (activeHealthProfile.billing * weightBilling) +
      (activeHealthProfile.engagement * weightEngagement) +
      (activeHealthProfile.support * weightSupport) +
      (activeHealthProfile.nps * weightNps)
    ) / totalWeight;

    return Math.round(rawScore);
  }, [activeHealthProfile, weightBilling, weightEngagement, weightSupport, weightNps]);

  const getHealthLevel = (score: number) => {
    if (score >= 80) return { label: 'Tuyệt Vời (VIP / Advocate)', color: 'text-emerald-450 border-emerald-500/20 bg-emerald-500/5' };
    if (score >= 60) return { label: 'Tương Đối Ổn Định', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' };
    if (score >= 45) return { label: 'Trung Bình / Cần Chăm Sóc', color: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5' };
    return { label: 'Rất Nguy Cấp (Nguy cơ Churn cao!)', color: 'text-red-400 border-red-500/20 bg-red-500/5' };
  };

  return (
    <div className="bg-[#050911]/80 backdrop-blur-md rounded-2xl border border-slate-900/80 shadow-2xl overflow-hidden text-slate-200">
      {/* Banner / Header */}
      <div className="p-6 border-b border-slate-900/60 bg-gradient-to-r from-emerald-950/20 via-slate-950 to-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-black font-mono">
              PHÂN HỆ 5.9
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              Retention & LifeTime Value Analysis
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400 animate-pulse" />
            Customer LTV &amp; Churn Shield
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Tối ưu hóa giá trị vòng đời khách hàng, phát hiện sớm dấu hiệu rời dịch vụ và thiết lập mô hình Cohort giữ chân khách hàng tự động cho Solo Founder.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-900">
          <button
            onClick={() => setActiveSubTab('ltv_calc')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'ltv_calc'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/15'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Tính LTV/CAC
          </button>
          <button
            onClick={() => setActiveSubTab('churn_predictor')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'churn_predictor'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/15'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Churn Shield
          </button>
          <button
            onClick={() => setActiveSubTab('cohort_chart')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'cohort_chart'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/15'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Cohort Heatmap
          </button>
          <button
            onClick={() => setActiveSubTab('health_score')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'health_score'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/15'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Health Score
          </button>
        </div>
      </div>

      {notification && (
        <div className="m-4 p-3 bg-emerald-650/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Pane */}
      <div className="p-6">
        
        {/* SUB TAB 1: LTV & CAC CALCULATOR & SENSITIVITY */}
        {activeSubTab === 'ltv_calc' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Sliders Control Card */}
              <div className="md:col-span-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono block pb-2 border-b border-slate-900">
                  ⚙️ Tham số Đầu Vào
                </span>

                {/* ARPU */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">ARPU (Doanh thu/Khách/Tháng)</span>
                    <span className="text-emerald-400 font-bold font-mono">{arpu.toLocaleString('vi-VN')}K VND</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="1000"
                    step="10"
                    value={arpu}
                    onChange={(e) => setArpu(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>20K</span>
                    <span>500K</span>
                    <span>1M VND</span>
                  </div>
                </div>

                {/* Gross Margin */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold font-mono">Gross Margin (Tỷ suất lãi gộp)</span>
                    <span className="text-blue-400 font-bold font-mono">{grossMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="98"
                    step="1"
                    value={grossMargin}
                    onChange={(e) => setGrossMargin(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>30%</span>
                    <span>80% (Tiêu chuẩn SaaS)</span>
                    <span>98%</span>
                  </div>
                </div>

                {/* Churn Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Churn Rate (Tỷ lệ rời đi/Tháng)</span>
                    <span className="text-red-400 font-bold font-mono">{churnRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={churnRate}
                    onChange={(e) => setChurnRate(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>0.5% (Tuyệt vời)</span>
                    <span>5% (Khá ổn)</span>
                    <span>20% (Khủng hoảng)</span>
                  </div>
                </div>

                {/* CAC */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Chi Phí Đạt Khách Hàng (CAC)</span>
                    <span className="text-amber-400 font-bold font-mono">{cac.toLocaleString('vi-VN')}K VND</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1500"
                    step="50"
                    value={cac}
                    onChange={(e) => setCac(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                    <span>50K</span>
                    <span>500K</span>
                    <span>1.5M VND</span>
                  </div>
                </div>

              </div>

              {/* Main Outcomes View */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Metrics Badges */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  
                  {/* LTV */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-left space-y-1 bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      LTV Khách Hàng
                    </span>
                    <p className="text-2xl font-black text-white font-mono">
                      {ltv.toLocaleString('vi-VN')}K <span className="text-xs text-slate-500">VND</span>
                    </p>
                    <p className="text-[10px] text-slate-550 leading-tight">
                      Bằng: (ARPU × Gross Margin) / Churn
                    </p>
                  </div>

                  {/* LTV / CAC Ratio */}
                  <div className={`p-4 rounded-xl border text-left space-y-1 ${
                    ltvToCacRatio >= 3 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : ltvToCacRatio >= 1.5 
                        ? 'bg-amber-500/5 border-amber-500/20' 
                        : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5 font-mono">
                      <Activity className="w-3.5 h-3.5 text-blue-400" />
                      Tỷ số LTV / CAC
                    </span>
                    <p className={`text-2xl font-black font-mono ${
                      ltvToCacRatio >= 3 ? 'text-emerald-400' : ltvToCacRatio >= 1.5 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {ltvToCacRatio}x
                    </p>
                    <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded ${
                      ltvToCacRatio >= 3 ? 'bg-emerald-500/10 text-emerald-400' : ltvToCacRatio >= 1.5 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {ltvToCacRatio >= 3 ? 'Lành mạnh (>=3x)' : ltvToCacRatio >= 1.5 ? 'Ưu hóa thêm' : 'Thiệt hại (Từ hòa đến lỗ)'}
                    </span>
                  </div>

                  {/* CAC Payback Period */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 text-left space-y-1 col-span-2 md:col-span-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      Thời Gian Hoàn Vốn CAC
                    </span>
                    <p className="text-2xl font-black text-white font-mono">
                      {paybackPeriod} <span className="text-xs text-slate-400">tháng</span>
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Cải thiện nếu tăng ARPU hoặc giảm CAC.
                    </p>
                  </div>

                </div>

                {/* Sensitivity BarChart */}
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5 font-mono">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    Biểu Đồ Độ Nhạy LTV Theo Từng Tỷ Lệ Churn
                  </h3>
                  
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sensitivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="churn" stroke="#64748b" fontSize={10} fontStyle="bold" />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#10b981', fontSize: '12px' }}
                        />
                        <Bar dataKey="Giá trị LTV" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center mt-2">
                    Mức churn càng thấp giúp đường cong LTV dốc thẳng đứng, nhân bản dòng tiền của Solo Founder gấp nhiều lần.
                  </p>
                </div>

              </div>

            </div>

            {/* Quick Strategic Guide banner */}
            <div className="bg-emerald-950/15 border border-emerald-900/30 p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">Lời Khuyên Tài Chính Cho Solo Founder:</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  Nếu tỷ số <strong className="text-emerald-400">LTV / CAC nhỏ hơn 3x</strong>, bạn đang chi quá nhiều tiền để mua 1 khách hàng so với những gì họ mang lại. Thay vì đổ thêm tiền quảng cáo, hãy kéo dài thời gian giữ chân (giảm Churn) hoặc xây dựng thêm tính năng phụ trị giá cao để up-sell tăng ARPU.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* SUB TAB 2: CHURN SHIELD (RULES & ACTIVE ALERTS ENGINE) */}
        {activeSubTab === 'churn_predictor' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
                  Hệ Thống Churn Shield: Phát Hiện Sớm Rủi Ro Khách Rời Đi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tự động quét các micro-events của hệ thống kế toán SaaS để báo động nguy cơ giảm cam kết sử dụng dịch vụ.
                </p>
              </div>
              <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] font-bold rounded border border-red-500/20 uppercase font-mono">
                Tìm thấy 4 cảnh báo đỏ
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Alert List table (Col-span 2) */}
              <div className="md:col-span-2 space-y-3">
                {mockAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="p-4 bg-slate-950/40 rounded-xl border border-slate-900 hover:border-slate-800 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-sm shrink-0 ${alert.avatarColor}`}>
                        {alert.logo}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-white">{alert.name}</h4>
                          <span className="text-[10px] text-slate-500 font-mono font-bold">({alert.value})</span>
                        </div>
                        <p className="text-[10px] font-bold text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          {alert.type}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {alert.daysInactive > 0 ? `Không hoạt động ${alert.daysInactive} ngày gần nhất` : 'Đang trực tuyến nhưng phản hồi kém'}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:gap-1.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-900">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">Nhiệt độ rủi ro:</span>
                        <span className="text-xs font-black font-mono text-red-400">{alert.score}%</span>
                      </div>
                      
                      {/* Interactive Mitigation Options */}
                      <div className="flex gap-1.5 ml-auto sm:ml-0">
                        <button
                          onClick={() => handleTriggerAction(alert.name, 'Gửi Email CSKH Khẩn Cấp')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-200 border border-slate-800 rounded flex items-center gap-1 transition-all"
                        >
                          <Mail className="w-3 h-3 text-purple-400" />
                          <span>Gửi Email</span>
                        </button>
                        <button
                          onClick={() => handleTriggerAction(alert.name, 'Đặt Lịch Gọi Consultation 1-1')}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-550 text-[10px] font-bold text-white rounded flex items-center gap-1 transition-all"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Đặt Gọi 1-1</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Rules engine setup */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-900 space-y-4">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono block pb-2 border-b border-slate-900">
                  ⚙️ Bộ Cấu Hình Churn Rules
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Thiết lập các điều kiện kích hoạt hệ thống tự động cảnh báo (ngừa rủi ro hủy đăng ký trước khi nó xảy ra):
                </p>

                <div className="space-y-3">
                  {/* Rule 1 */}
                  <div className="p-2.5 bg-slate-900/45 rounded-lg border border-slate-850/60 flex items-start gap-2.5">
                    <input type="checkbox" defaultChecked className="mt-1 accent-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-250 block">Giảm sút login đột ngột</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">Không đăng nhập hệ thống trong vòng 10 ngày liên tục.</p>
                    </div>
                  </div>

                  {/* Rule 2 */}
                  <div className="p-2.5 bg-slate-900/45 rounded-lg border border-slate-850/60 flex items-start gap-2.5">
                    <input type="checkbox" defaultChecked className="mt-1 accent-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-250 block">Lỗi tích hợp kéo dài</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">Lỗi đồng bộ API ngân hàng bị trả về &gt; 3 lần mà không có tương tác khắc phục.</p>
                    </div>
                  </div>

                  {/* Rule 3 */}
                  <div className="p-2.5 bg-slate-900/45 rounded-lg border border-slate-850/60 flex items-start gap-2.5">
                    <input type="checkbox" defaultChecked className="mt-1 accent-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-250 block">Duyệt Báo cáo Tài chính sụt giảm</span>
                      <p className="text-[9px] text-slate-500 mt-0.5">Số lượng hóa đơn, chứng từ phát sinh giảm thục sút &gt; 65% so với trung bình 3 tháng.</p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-[9.5px] text-red-400 leading-tight">
                  💡 <strong>Thực tế chứng minh:</strong> Việc liên hệ khách hàng trong vòng 48h kể từ khi xuất hiện cảnh báo &quot;Giảm login&quot; giảm tỷ lệ rời đi thực tế tới 42%!
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB TAB 3: COHORT RETENTION HEATMAP */}
        {activeSubTab === 'cohort_chart' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Users className="w-5 h-5 text-emerald-400" />
                  Bảng Phân Tích Cohort Retention Heatmap (Từ Tháng 10/2025)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Theo dõi phần trăm khách hàng trung thành, tiếp tục thanh toán dịch vụ qua các tháng gia nhập.
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Quy mô cohort mô phỏng:</span>
                <input
                  type="number"
                  value={cohortSize}
                  onChange={(e) => setCohortSize(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-16 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded p-1 text-center font-mono"
                />
              </div>
            </div>

            {/* Heatmap Grid container */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-900/80 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-900">
                    <th className="py-2.5 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono">Thời gian Cohort</th>
                    <th className="py-2.5 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono text-center">Khách ban đầu</th>
                    {['Tháng 0', 'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 12'].map((m, idx) => (
                      <th key={idx} className="py-2.5 text-[10px] text-slate-400 uppercase tracking-wider font-extrabold font-mono text-center">
                        {m}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-905">
                  {cohortRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/30">
                      <td className="py-2.5 text-xs font-bold font-mono text-slate-300">{row.name}</td>
                      <td className="py-2.5 text-xs text-slate-400 font-mono text-center">
                        {Math.round(row.count * (cohortSize / 150))}
                      </td>
                      {row.rates.map((rate, rateIdx) => {
                        const isFuture = rate === 0;
                        
                        // color gradient based on retention percentage
                        let colorClass = 'bg-slate-900 text-slate-600';
                        if (!isFuture) {
                          if (rate >= 90) colorClass = 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/10';
                          else if (rate >= 80) colorClass = 'bg-emerald-900/40 text-emerald-400';
                          else if (rate >= 70) colorClass = 'bg-teal-950/40 text-teal-400';
                          else if (rate >= 60) colorClass = 'bg-blue-950/30 text-blue-400';
                          else if (rate >= 50) colorClass = 'bg-slate-900 text-slate-300';
                          else colorClass = 'bg-red-950/20 text-red-400';
                        }

                        return (
                          <td 
                            key={rateIdx} 
                            className={`py-2 px-1 text-center font-mono text-xs font-semibold ${isFuture ? '' : 'p-1'}`}
                          >
                            {isFuture ? (
                              <span className="text-[10px] text-slate-700">-</span>
                            ) : (
                              <div className={`py-1.5 rounded-md font-bold ${colorClass}`}>
                                {rate}%
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Legends explanation */}
              <div className="flex gap-4 flex-wrap justify-center mt-5 pt-4 border-t border-slate-900">
                <span className="text-[10px] text-slate-550 font-normal">Mức độ giữ chân Retention Rate:</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-950/85 block"></span>
                  <span className="text-[10px] text-slate-400 font-bold">Ban đầu (&gt;=90%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-900/40 block"></span>
                  <span className="text-[10px] text-slate-400 font-bold">Ổn định (80% - 90%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-blue-950/30 block"></span>
                  <span className="text-[10px] text-slate-400 font-bold">Bình thường (60% - 80%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-red-950/20 block"></span>
                  <span className="text-[10px] text-slate-400 font-bold">Nguy hiểm (&lt;60%)</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUB TAB 4: COMPOSITE CUSTOMER HEALTH SCORE */}
        {activeSubTab === 'health_score' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Dynamic Weights & Interactive sliders */}
              <div className="md:col-span-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase font-mono block pb-2 border-b border-slate-900">
                  ⚖️ Trọng Số Thành Phần (%)
                </span>
                
                <p className="text-[11px] text-slate-550">
                  Điều chỉnh mức độ tối quan trọng của từng chỉ số cấu thành điểm sức khỏe khách hàng. Tổng trọng số phải bằng 100%.
                </p>

                {/* Weights controls */}
                <div className="space-y-3.5">
                  {/* Billing Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold font-mono">1. Tài chính &amp; Gia hạn</span>
                      <span className="text-emerald-400 font-bold font-mono">{weightBilling}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={weightBilling}
                      onChange={(e) => setWeightBilling(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Product Usage Engagement Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold font-mono">2. Thao tác &amp; Login</span>
                      <span className="text-blue-400 font-bold font-mono">{weightEngagement}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={weightEngagement}
                      onChange={(e) => setWeightEngagement(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  {/* Support tickets Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold font-mono">3. Chăm sóc &amp; Ticket</span>
                      <span className="text-cyan-400 font-bold font-mono">{weightSupport}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={weightSupport}
                      onChange={(e) => setWeightSupport(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>

                  {/* NPS score Weight */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-semibold font-mono">4. Điểm hài lòng NPS</span>
                      <span className="text-purple-400 font-bold font-mono">{weightNps}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={weightNps}
                      onChange={(e) => setWeightNps(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                </div>

                <div className="p-2.5 bg-slate-900 text-slate-500 text-[10px] font-mono text-center rounded">
                  Tổng Trọng Số: {weightBilling + weightEngagement + weightSupport + weightNps}%
                </div>

              </div>

              {/* Patient Profile & Health Simulator */}
              <div className="md:col-span-2 space-y-6">
                
                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-900 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1 font-mono">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    Thử nghiệm giả lập hồ sơ khách hàng mẫu
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Billing score input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold block">Độ đều đặn thanh toán (0-100):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeHealthProfile.billing}
                        onChange={(e) => setActiveHealthProfile({...activeHealthProfile, billing: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded p-2"
                      />
                    </div>

                    {/* Engagement score input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold block">Tương tác tính năng (0-100):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeHealthProfile.engagement}
                        onChange={(e) => setActiveHealthProfile({...activeHealthProfile, engagement: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded p-2"
                      />
                    </div>

                    {/* Support score input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold block">Mức độ hỗ trợ ổn thỏa (0-100):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeHealthProfile.support}
                        onChange={(e) => setActiveHealthProfile({...activeHealthProfile, support: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded p-2"
                      />
                    </div>

                    {/* NPS score input */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-semibold block">Độ hài lòng phản hồi (0-100):</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeHealthProfile.nps}
                        onChange={(e) => setActiveHealthProfile({...activeHealthProfile, nps: Math.min(100, Math.max(0, parseInt(e.target.value) || 0))})}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono rounded p-2"
                      />
                    </div>
                  </div>

                  {/* Calculated Health output */}
                  <div className="p-4 border border-slate-850 bg-slate-950/80 rounded-xl space-y-2 text-center">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase font-mono block">
                      ⚡ ĐIỂM SỨC KHỎE COMPOSITE HEALTH SCORE
                    </span>
                    <div className="text-3xl font-black font-mono text-emerald-400">
                      {computedHealthScore} / 100
                    </div>

                    <div className={`p-2 rounded-lg border text-xs font-extrabold ${getHealthLevel(computedHealthScore).color}`}>
                      {getHealthLevel(computedHealthScore).label}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
