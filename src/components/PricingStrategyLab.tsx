import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  DollarSign, 
  Settings, 
  TrendingUp, 
  Check, 
  HelpCircle, 
  Layers, 
  Zap, 
  Award, 
  PieChart, 
  ChevronRight, 
  Plus, 
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  recommended: boolean;
}

export default function PricingStrategyLab() {
  const { activeIdea } = useStore();
  const [activeSubTab, setActiveSubTab] = useState<'van_westendorp' | 'tier_designer' | 'freemium_optimizer' | 'price_elasticity'>('van_westendorp');

  // SUB TAB 1: Van Westendorp model state
  const [currencyUnit, setCurrencyUnit] = useState<'K' | 'USD'>('K'); // K VND or USD
  const [basePriceStep, setBasePriceStep] = useState<number>(30); // scale slider multiplier

  // SUB TAB 2: Pricing Tier Designer state
  const featurePool = [
    'Hóa Đơn Tự Động 50/tháng',
    'Tìm kiếm & Phân tích Sao kê',
    'Trợ Lý AI Kế Toán 24/7',
    'Hỗ Trợ Khai Thuế Thông Tư 200',
    'Kết Nối 2 Tài Khoản Ngân Hàng',
    'Gửi Zalo ZNS Chăm Sóc',
    'Dashboard Kiểm Toán Nội Bộ',
    'Custom IP whitelist',
    'Xuất Báo Cáo Excel Động',
    'Tải lên file PDF không giới hạn',
  ];

  const [tiers, setTiers] = useState<PricingTier[]>([
    { name: 'Starter', price: 99, features: ['Hóa Đơn Tự Động 50/tháng', 'Tìm kiếm & Phân tích Sao kê'], recommended: false },
    { name: 'Professional', price: 249, features: ['Hóa Đơn Tự Động 50/tháng', 'Tìm kiếm & Phân tích Sao kê', 'Trợ Lý AI Kế Toán 24/7', 'Kết Nối 2 Tài Khoản Ngân Hàng', 'Xuất Báo Cáo Excel Động'], recommended: true },
    { name: 'Ultimate Corporate', price: 599, features: ['Hóa Đơn Tự Động 50/tháng', 'Tìm kiếm & Phân tích Sao kê', 'Trợ Lý AI Kế Toán 24/7', 'Hỗ Trợ Khai Thuế Thông Tư 200', 'Kết Nối 2 Tài Khoản Ngân Hàng', 'Gửi Zalo ZNS Chăm Sóc', 'Dashboard Kiểm Toán Nội Bộ', 'Custom IP whitelist', 'Xuất Báo Cáo Excel Động', 'Tải lên file PDF không giới hạn'], recommended: false }
  ]);

  // Sync state when activeIdea changes dynamically
  useEffect(() => {
    if (activeIdea) {
      const isGame = activeIdea.type === 'game';
      const basePoints = activeIdea.pricePoint / 1000; // in thousands VND
      setBasePriceStep(Math.max(10, Math.round(basePoints / 5)));
      
      setTiers([
        { 
          name: isGame ? 'Standard' : 'Starter', 
          price: Math.round(basePoints * 0.5), 
          features: isGame ? ['Chơi game mượt mà', 'Tắt quảng cáo cơ bản'] : ['Hóa Đơn Tự Động 50/tháng', 'Tìm kiếm & Phân tích Sao kê'], 
          recommended: false 
        },
        { 
          name: isGame ? 'Premium Champion' : 'Professional', 
          price: Math.round(basePoints), 
          features: isGame ? ['Chơi game mượt mà', 'Tắt quảng cáo vinh viễn', 'Mở khoá skin Ninja Gió', 'Vào bảng xếp hạng tuần'] : ['Hóa Đơn Tự Động 150/tháng', 'Tìm kiếm & Phân tích Sao kê', 'Trợ Lý AI Kế Toán 24/7', 'Kết Nối 2 Tài Khoản Ngân Hàng', 'Xuất Báo Cáo Excel Động'], 
          recommended: true 
        },
        { 
          name: isGame ? 'Ultimate Fan Pack' : 'Ultimate Corporate', 
          price: Math.round(basePoints * 2.5), 
          features: isGame ? ['Tất cả quyền lợi Premium', 'Tải soundtrack độc quyền chất lượng cao', 'Mở khoá 10 skins huyền thoại', 'Hỗ trợ kỹ thuật ưu tiên'] : ['Hóa Đơn Tự Động Không giới hạn', 'Tìm kiếm & Phân tích Sao kê', 'Trợ Lý AI Kế Toán 24/7', 'Hỗ Trợ Khai Thuế Thông Tư 200', 'Kết Nối 2 Tài Khoản Ngân Hàng', 'Gửi Zalo ZNS Chăm Sóc', 'Dashboard Kiểm Toán Nội Bộ', 'Custom IP whitelist', 'Xuất Báo Cáo Excel Động', 'Tải lên file PDF không giới hạn'], 
          recommended: false 
        }
      ]);
    }
  }, [activeIdea]);

  // Generated pricing points for thechart
  const vanWestendorpData = useMemo(() => {
    const baseVal = activeIdea ? (activeIdea.pricePoint / 1000) : 150;
    // Price points generated dynamically around our baseVal
    const points = [
      Math.round(baseVal * 0.3),
      Math.round(baseVal * 0.6),
      Math.round(baseVal * 0.9),
      Math.round(baseVal * 1.2),
      Math.round(baseVal * 1.5),
      Math.round(baseVal * 1.8),
      Math.round(baseVal * 2.1),
      Math.round(baseVal * 2.5)
    ];
    return points.map(price => {
      // Calculate typical cumulative percentage curves relative to base price scale
      const ratio = price / (baseVal || 1);
      const tooCheap = Math.max(0, Math.min(100, Math.round(100 - (ratio * 80))));
      const cheap = Math.max(0, Math.min(100, Math.round(100 - (ratio * 40))));
      const expensive = Math.max(0, Math.min(100, Math.round((ratio - 0.4) * 80)));
      const tooExpensive = Math.max(0, Math.min(100, Math.round((ratio - 0.7) * 90)));

      return {
        price,
        'Rất Rẻ (Too Cheap)': tooCheap,
        'Hợp Lý (Cheap)': cheap,
        'Đắt (Expensive)': expensive,
        'Quá Đắt (Too Expensive)': tooExpensive,
      };
    });
  }, [activeIdea]);

  // OPP: Optimum Price Point = Too Cheap intersects Too Expensive
  // IPP: Indifference Price Point = Cheap intersects Expensive
  const statsVanWestendorp = useMemo(() => {
    const baseVal = activeIdea ? (activeIdea.pricePoint / 1000) : 150;
    return {
      opp: Math.round(baseVal * 1.05),
      ipp: Math.round(baseVal * 1.25),
      cheapLimit: Math.round(baseVal * 0.7),
      expensiveLimit: Math.round(baseVal * 1.7),
    };
  }, [activeIdea]);

  const toggleFeatureInTier = (tierIndex: number, featureName: string) => {
    const updated = [...tiers];
    const currentFeatures = updated[tierIndex].features;
    if (currentFeatures.includes(featureName)) {
      updated[tierIndex].features = currentFeatures.filter(f => f !== featureName);
    } else {
      updated[tierIndex].features = [...currentFeatures, featureName];
    }
    setTiers(updated);
  };

  const updateTierPrice = (tierIndex: number, newPrice: number) => {
    const updated = [...tiers];
    updated[tierIndex].price = Math.max(0, newPrice);
    setTiers(updated);
  };

  const addCustomTier = () => {
    setTiers([...tiers, {
      name: `Mới Hạng ${tiers.length + 1}`,
      price: 150,
      features: ['Tìm kiếm & Phân tích Sao kê'],
      recommended: false
    }]);
  };

  const removeTier = (index: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, idx) => idx !== index));
  };


  // SUB TAB 3: Freemium Conversion Optimizer state
  const [totalTraffic, setTotalTraffic] = useState<number>(15000); // monthly visitors
  const [signupConversion, setSignupConversion] = useState<number>(8.5); // % signup
  const [freemiumToPaid, setFreemiumToPaid] = useState<number>(3.2); // % paid conv
  const [freeUserCost, setFreeUserCost] = useState<number>(500); // 500 VND per free user (hosting, support)
  const [premiumUserPrice, setPremiumUserPrice] = useState<number>(185); // 185K VND per premium user/month

  const freemiumMetrics = useMemo(() => {
    const freshSignups = Math.round(totalTraffic * (signupConversion / 100));
    const activeFreeUsers = Math.round(freshSignups * (1 - (freemiumToPaid / 100)));
    const activePaidUsers = Math.round(freshSignups * (freemiumToPaid / 100));

    const totalRevenue = activePaidUsers * premiumUserPrice; // K VND
    const totalHostingCost = (activeFreeUsers * freeUserCost) / 1000; // convert to K VND
    const netProfit = totalRevenue - totalHostingCost;

    return {
      signups: freshSignups,
      freeUsers: activeFreeUsers,
      paidUsers: activePaidUsers,
      monthlyRevenue: totalRevenue,
      infrastructureCost: totalHostingCost,
      netProfit,
      breakEvenStatus: netProfit > 0 ? 'Có Lãi' : 'Lỗ / Không bền vững'
    };
  }, [totalTraffic, signupConversion, freemiumToPaid, freeUserCost, premiumUserPrice]);


  // SUB TAB 4: Price Elasticity Model state
  const [elasticityCoefficient, setElasticityCoefficient] = useState<number>(-1.8); // elasticity level
  const [currentPrice, setCurrentPrice] = useState<number>(200); // K VND
  const [currentVolume, setCurrentVolume] = useState<number>(120); // active clients at currentPrice

  // Generate range impact of pricing changes from -50% to +50%
  const elasticityRangeData = useMemo(() => {
    const adjustments = [-50, -30, -20, -10, 0, 10, 20, 30, 50];
    return adjustments.map(pct => {
      const adjustedPrice = Math.round(currentPrice * (1 + pct / 100));
      // ΔQ = Elasticity * ΔP
      // New Volume = Q0 * (1 + ΔQ)
      const pctVolumeChange = elasticityCoefficient * (pct / 100);
      const adjustedVolume = Math.round(currentVolume * (1 + pctVolumeChange));
      
      const baselineMrr = currentPrice * currentVolume;
      const newMrr = adjustedPrice * adjustedVolume;

      return {
        pct: `${pct >= 0 ? '+' : ''}${pct}%`,
        'Giá Mới (K)': adjustedPrice,
        'Khách Hàng': Math.max(0, adjustedVolume),
        'Doanh Số MRR (K)': Math.max(0, newMrr),
        'Thay Đổi MRR': Math.round(newMrr - baselineMrr)
      };
    });
  }, [elasticityCoefficient, currentPrice, currentVolume]);

  return (
    <div className="bg-[#050911]/80 backdrop-blur-md rounded-2xl border border-slate-900/80 shadow-2xl overflow-hidden text-slate-200">
      
      {/* Visual Header */}
      <div className="p-6 border-b border-slate-900/60 bg-gradient-to-r from-blue-950/20 via-slate-950 to-slate-950 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-black font-mono">
              PHÂN HỆ 5.10 🇻🇳
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">
              Product-Led Growth &amp; Monetization Strategy
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-450" />
            Pricing Strategy Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Sử dụng mô hình nhạy cảm giá của Van Westendorp, cấu trúc các gói tính năng và đo lường hệ số co giãn nhu cầu để tối ưu hóa khả năng Monetization của Solo Founder.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-950/90 rounded-xl border border-slate-900 self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('van_westendorp')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'van_westendorp'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Van Westendorp
          </button>
          <button
            onClick={() => setActiveSubTab('tier_designer')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'tier_designer'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Gói Tính Năng
          </button>
          <button
            onClick={() => setActiveSubTab('freemium_optimizer')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'freemium_optimizer'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Tối Ưu Freemium
          </button>
          <button
            onClick={() => setActiveSubTab('price_elasticity')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              activeSubTab === 'price_elasticity'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
            }`}
          >
            Hệ Số Co Giãn
          </button>
        </div>
      </div>

      <div className="p-6">
        
        {/* SUB TAB 1: VAN WESTENDORP PRICE SENSITIVITY DESIGN */}
        {activeSubTab === 'van_westendorp' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Controls left column */}
              <div className="md:col-span-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4 text-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block pb-2 border-b border-slate-900">
                  📈 Bộ Điều Chỉnh Mô Hình
                </span>

                <div className="space-y-2">
                  <label className="text-slate-400 font-semibold block">Đơn vị tiền tệ hiển thị:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCurrencyUnit('K')}
                      className={`p-2 rounded-lg border font-bold text-center ${
                        currencyUnit === 'K'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      K VND (Ngàn đồng)
                    </button>
                    <button
                      onClick={() => setCurrencyUnit('USD')}
                      className={`p-2 rounded-lg border font-bold text-center ${
                        currencyUnit === 'USD'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      USD ($)
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1 text-slate-400">
                  <p className="font-bold text-slate-350">Giải nghĩa các điểm giao cắt:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li><strong>MGP (Too Cheap &amp; Expensive):</strong> Ngưỡng giá tối thiểu, dưới mức này khách hàng sẽ nghi ngờ chất lượng sản phẩm.</li>
                    <li><strong>OPP (Too Cheap &amp; Too Expensive):</strong> Điểm giá tối ưu nhằm giảm khả năng kháng cự mua hàng của khách một cách lý tưởng nhất.</li>
                    <li><strong>MEP (Cheap &amp; Too Expensive):</strong> Ngưỡng đắt biên giới, vượt ngưỡng này khách cảm thấy quá đắt không đáng tiền mua.</li>
                  </ul>
                </div>
              </div>

              {/* Chart of Van Westendorp */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1 font-mono">
                    <PieChart className="w-3.5 h-3.5 text-blue-400" />
                    Biểu Đồ Đường Tích Lũy Xác Định Điểm Giá OPP &amp; IPP
                  </h3>

                  <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={vanWestendorpData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="price" stroke="#64748b" label={{ value: `Mức giá (${currencyUnit === 'K' ? 'K VND' : 'USD'})`, position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} fontSize={10} />
                        <YAxis stroke="#64748b" label={{ value: 'Tỷ lệ khách đồng ý (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b' }}
                          labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                          itemStyle={{ fontSize: '11px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: 9, pt: 10 }} />
                        
                        <Line type="monotone" dataKey="Rất Rẻ (Too Cheap)" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 5 }} />
                        <Line type="monotone" dataKey="Hợp Lý (Cheap)" stroke="#3b82f6" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="Đắt (Expensive)" stroke="#eab308" strokeWidth={2.5} />
                        <Line type="monotone" dataKey="Quá Đắt (Too Expensive)" stroke="#ef4444" strokeWidth={2.5} />
                        
                        {/* Reference lines for points */}
                        <ReferenceLine x={statsVanWestendorp.opp} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: `OPP: ${statsVanWestendorp.opp}${currencyUnit === 'K' ? 'K' : '$'}`, fill: '#ef4444', fontSize: 9, position: 'top' }} />
                        <ReferenceLine x={statsVanWestendorp.ipp} stroke="#a855f7" strokeDasharray="3 3" label={{ value: `IPP: ${statsVanWestendorp.ipp}${currencyUnit === 'K' ? 'K' : '$'}`, fill: '#a855f7', fontSize: 9, position: 'bottom' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Outcomes table breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Giá OPP Tối Ưu</span>
                    <strong className="text-sm text-red-400 font-mono">{statsVanWestendorp.opp} {currencyUnit === 'K' ? 'K VND' : 'USD'}</strong>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Giá trị Thay Thế (IPP)</span>
                    <strong className="text-sm text-purple-400 font-mono">{statsVanWestendorp.ipp} {currencyUnit === 'K' ? 'K VND' : 'USD'}</strong>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ngưỡng rẻ tối đa (MGP)</span>
                    <strong className="text-sm text-emerald-450 font-mono">{statsVanWestendorp.cheapLimit} {currencyUnit === 'K' ? 'K VND' : 'USD'}</strong>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-900 text-center">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Ngưỡng đắt giới hạn (MEP)</span>
                    <strong className="text-sm text-yellow-400 font-mono">{statsVanWestendorp.expensiveLimit} {currencyUnit === 'K' ? 'K VND' : 'USD'}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUB TAB 2: PRICING TIER DESIGNER */}
        {activeSubTab === 'tier_designer' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Settings className="w-5 h-5 text-blue-400" />
                  Bảng Phân Bổ Tính Năng Cho Từng Phân Khúc (Pricing Tier Designer)
                </h3>
                <p className="text-xs text-slate-400">
                  Tích chọn hoặc gỡ bỏ tính năng cốt lõi để lập tức xem ảnh hưởng tới mức định giá đề xuất của các gói dịch vụ.
                </p>
              </div>

              <button
                onClick={addCustomTier}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-550 text-xs font-bold text-white rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                Thêm Gói Mới
              </button>
            </div>

            {/* Configured Tiers Container */}
            <div className="grid md:grid-cols-3 gap-6">
              {tiers.map((tier, tierIdx) => (
                <div 
                  key={tierIdx}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative ${
                    tier.recommended 
                      ? 'bg-blue-950/20 border-blue-500/40 shadow-xl shadow-blue-500/5' 
                      : 'bg-slate-950/40 border-slate-900'
                  }`}
                >
                  {tier.recommended && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 p-0.5 px-3 bg-blue-600 rounded-full text-[9px] font-black uppercase text-white shadow font-mono">
                      RECOMMENDED (Gói chính)
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Tier Name & Price input */}
                    <div className="flex justify-between items-start pb-2 border-b border-slate-900">
                      <div>
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => {
                            const updated = [...tiers];
                            updated[tierIdx].name = e.target.value;
                            setTiers(updated);
                          }}
                          className="bg-transparent text-sm font-black text-white w-28 focus:outline-none focus:border-b border-blue-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-550 mt-1">SaaS Model</p>
                      </div>

                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          value={tier.price}
                          onChange={(e) => updateTierPrice(tierIdx, parseInt(e.target.value) || 0)}
                          className="w-16 bg-slate-900 border border-slate-800 text-xs font-bold p-1 text-center text-blue-400 rounded focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">{currencyUnit === 'K' ? 'K' : '$'}</span>
                      </div>
                    </div>

                    {/* Features checklist pool */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold font-mono">
                        Chọn tính năng khả dụng:
                      </span>
                      
                      <div className="max-h-[160px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-905/30">
                        {featurePool.map((f, fIdx) => {
                          const hasFeature = tier.features.includes(f);
                          return (
                            <button
                              key={fIdx}
                              onClick={() => toggleFeatureInTier(tierIdx, f)}
                              className="w-full text-left py-1.5 flex items-center justify-between text-[11px] group cursor-pointer"
                            >
                              <span className={`${hasFeature ? 'text-slate-200' : 'text-slate-550 group-hover:text-slate-400'}`}>
                                {f}
                              </span>
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                hasFeature 
                                  ? 'bg-blue-600 border-blue-500 text-white' 
                                  : 'border-slate-800 text-transparent'
                              }`}>
                                <Check className="w-2.5 h-2.5 stroke-[4.5]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                  <div className="flex gap-2 border-t border-slate-900 pt-4 mt-5">
                    <button
                      onClick={() => {
                        const updated = [...tiers];
                        updated.forEach((t, index) => t.recommended = index === tierIdx);
                        setTiers(updated);
                      }}
                      className={`flex-1 p-1.5 rounded text-[10px] font-bold text-center block ${
                        tier.recommended 
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {tier.recommended ? 'Đã là gói chính' : 'Đặt làm gói chính'}
                    </button>

                    {tiers.length > 1 && (
                      <button
                        onClick={() => removeTier(tierIdx)}
                        className="p-1 px-2.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/35 rounded transition-all"
                        title="Xóa gói"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* SUB TAB 3: FREEMIUM CONVERSION OPTIMIZER */}
        {activeSubTab === 'freemium_optimizer' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Sliders setup */}
              <div className="md:col-span-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4 text-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block pb-2 border-b border-slate-900">
                  🚀 Tham Số Điều Chỉnh
                </span>

                {/* Total Traffic */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Lượng truy cập / tháng:</span>
                    <span className="text-blue-400 font-bold font-mono">{totalTraffic.toLocaleString('vi-VN')}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={totalTraffic}
                    onChange={(e) => setTotalTraffic(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Signup Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Tỷ lệ đăng ký tài khoản free:</span>
                    <span className="text-blue-400 font-bold font-mono">{signupConversion}%</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="25.0"
                    step="0.5"
                    value={signupConversion}
                    onChange={(e) => setSignupConversion(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Paid Conversion */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Tỷ lệ nâng cấp Premium:</span>
                    <span className="text-purple-400 font-bold font-mono">{freemiumToPaid}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10.0"
                    step="0.1"
                    value={freemiumToPaid}
                    onChange={(e) => setFreemiumToPaid(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-550 font-mono">
                    <span>0.5% (Thấp)</span>
                    <span>3% (SaaS TB)</span>
                    <span>10% (Rất cao)</span>
                  </div>
                </div>

                {/* Free cost per user */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Phí máy chủ/người dùng miễn phí:</span>
                    <span className="text-red-400 font-bold font-mono">{freeUserCost} VND/tháng</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="100"
                    value={freeUserCost}
                    onChange={(e) => setFreeUserCost(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                </div>

              </div>

              {/* Outcomes and Analysis */}
              <div className="md:col-span-2 space-y-6">
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Total monthly revenue */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 border-l-4 border-l-emerald-500 text-left space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block font-mono">Tổng Doanh Thu Phí Lẻ</span>
                    <p className="text-2xl font-mono font-black text-white">
                      {(freemiumMetrics.monthlyRevenue).toLocaleString('vi-VN')}K <span className="text-xs text-slate-400">VND/tháng</span>
                    </p>
                    <span className="text-[9.5px] text-slate-400 leading-none">
                      Từ {freemiumMetrics.paidUsers} tài khoản Premium
                    </span>
                  </div>

                  {/* Infrastructure support cost */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 border-l-4 border-l-red-500 text-left space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block font-mono">Phí Duy Trì Bản Free</span>
                    <p className="text-2xl font-mono font-black text-red-450">
                      {(freemiumMetrics.infrastructureCost).toLocaleString('vi-VN')}K <span className="text-xs text-slate-400">VND/tháng</span>
                    </p>
                    <span className="text-[9.5px] text-slate-400 leading-none">
                      Hỗ trợ {freemiumMetrics.freeUsers} tài khoản Free
                    </span>
                  </div>

                  {/* Net Profit margin */}
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-900 border-l-4 border-l-blue-500 text-left space-y-1 col-span-2 md:col-span-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block font-mono">Lợi Nhuận Biên Ròng</span>
                    <p className={`text-2xl font-mono font-black ${freemiumMetrics.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(freemiumMetrics.netProfit).toLocaleString('vi-VN')}K <span className="text-xs text-slate-450">VND</span>
                    </p>
                    <span className="text-[9.5px] font-bold text-slate-400">
                      Trạng thái: <span className="text-emerald-450">{freemiumMetrics.breakEvenStatus}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/30 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-xs leading-relaxed text-slate-350">
                    <strong>Tư duy thiết kế phễu Freemium:</strong> Bản miễn phí là thỏi nam châm hút lead cực mạnh, nhưng nếu tốn &gt; {freeUserCost}đ máy chủ cho mỗi người dùng mà tỷ lệ chuyển đổi trả phí thấp hơn 2%, bạn sẽ nhanh chóng cạn kiệt dòng tiền. Hãy áp đặt giới hạn tính năng chặt chẽ (Ví dụ: Chỉ cho phép nhập 10 hóa đơn mỗi tháng) ở bản miễn phí để chuyển đổi thành bản trả phí.
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* SUB TAB 4: PRICE ELASTICITY MODEL */}
        {activeSubTab === 'price_elasticity' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Adjust Elasticity Sliders */}
              <div className="md:col-span-1 bg-slate-950/40 p-4 rounded-xl border border-slate-900 space-y-4 text-xs font-semibold">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono block pb-2 border-b border-slate-900">
                  ⚙️ Hệ Số Co Giãn Giá Nhu Cầu
                </span>

                {/* Elasticity co-eff */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Hệ số co giãn (Elasticity Ed):</span>
                    <span className="text-red-400 font-bold font-mono">{elasticityCoefficient}</span>
                  </div>
                  <input
                    type="range"
                    min="-4.0"
                    max="-0.2"
                    step="0.1"
                    value={elasticityCoefficient}
                    onChange={(e) => setElasticityCoefficient(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-550 font-mono">
                    <span>-4.0 (Rất nhạy cảm)</span>
                    <span>-1.0 (Đơn vị)</span>
                    <span>-0.2 (Ít nhạy cảm)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/40 rounded-lg text-[10px] text-slate-400 space-y-1 leading-relaxed">
                  <h4 className="font-bold text-slate-300">Phân Phân Tích Độ Đàn Hồi:</h4>
                  <p>
                    Hệ số hiện tại là <strong className="text-red-400 font-mono">{elasticityCoefficient}</strong> (Co giãn mạnh). Nghĩa là nếu bạn tăng giá sản phẩm thêm 10%, bạn sẽ mất khoảng <strong className="text-red-400 font-mono">{Math.abs(elasticityCoefficient * 10).toFixed(0)}%</strong> số lượng người dùng hiện tại.
                  </p>
                </div>
              </div>

              {/* Range dynamic bar layout */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 mb-3.5 font-mono">
                    ⚡ Ảnh Hưởng Thay Đổi Giá Tới Doanh Thu Bền Vững (MRR)
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-mono uppercase tracking-wider">
                          <th className="py-2">Thay Đổi Giá</th>
                          <th className="py-2">Đơn giá mới (K)</th>
                          <th className="py-2">Lượng khách kỳ vọng</th>
                          <th className="py-2">Doanh thu dự báo</th>
                          <th className="py-2">Chênh lệch dòng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-905">
                        {elasticityRangeData.map((row, idx) => {
                          const isNegative = row['Thay Đổi MRR'] < 0;
                          const isZero = row['Thay Đổi MRR'] === 0;

                          return (
                            <tr key={idx} className={row.pct === '0%' ? 'bg-blue-600/10 font-bold' : 'hover:bg-slate-900/20'}>
                              <td className="py-2.5 font-bold font-mono">{row.pct}</td>
                              <td className="py-2.5 font-mono">{row['Giá Mới (K)']}K VND</td>
                              <td className="py-2.5 font-mono text-slate-400">{row['Khách Hàng']} khách</td>
                              <td className="py-2.5 font-mono text-white font-extrabold">{row['Doanh Số MRR (K)'].toLocaleString('vi-VN')}K VND</td>
                              <td className={`py-2.5 font-mono font-bold ${
                                isZero 
                                  ? 'text-slate-500' 
                                  : isNegative 
                                    ? 'text-red-450' 
                                    : 'text-emerald-400'
                              }`}>
                                {isZero ? '0' : `${row['Thay Đổi MRR'] > 0 ? '+' : ''}${row['Thay Đổi MRR'].toLocaleString('vi-VN')}K`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
