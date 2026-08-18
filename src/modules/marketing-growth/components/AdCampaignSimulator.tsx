import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Sparkles, AlertCircle, RefreshCw, Send, DollarSign } from 'lucide-react';
import { upsertBusinessEntity } from '../../../utils/businessApi';

type ChannelType = 'facebook' | 'google' | 'tiktok';
type AudienceType = 'developers' | 'founders' | 'accountants';

export default function AdCampaignSimulator() {
  const [budget, setBudget] = useState<number>(200000); // Daily budget in VND
  const [channel, setChannel] = useState<ChannelType>('facebook');
  const [audience, setAudience] = useState<AudienceType>('founders');
  const [headline, setHeadline] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasRun, setHasRun] = useState<boolean>(false);
  const [runId, setRunId] = useState<number>(0);

  // Active campaigns mock data
  const [activeCampaigns, setActiveCampaigns] = useState([
    { id: 1, name: 'Google Search: "Phần mềm kế toán online"', channel: 'Google', budget: '200K/ngày', active: true, roas: '2.4x' },
    { id: 2, name: 'Facebook Ads: Founder Retargeting', channel: 'Facebook', budget: '500K/ngày', active: false, roas: '1.1x' },
    { id: 3, name: 'TikTok: Viral Meme "Kế toán chạy deadline"', channel: 'TikTok', budget: '100K/ngày', active: true, roas: '3.8x' },
  ]);

  const toggleCampaign = (id: number) => {
    setActiveCampaigns(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };


  // Run simulation calculation
  const simulationResults = useMemo(() => {
    if (!hasRun) return null;

    // Calculate baseline CTR based on channel and audience synergy
    let baseCtr = 1.8; // Baseline 1.8%
    if (channel === 'facebook' && audience === 'founders') baseCtr += 0.6;
    if (channel === 'google' && audience === 'accountants') baseCtr += 0.8;
    if (channel === 'tiktok' && audience === 'developers') baseCtr += 0.3;

    // Headline scoring system (Boost CTR if it contains magnetic keywords)
    const lowerHeadline = headline.toLowerCase();
    let headlineBoost = 0;
    if (lowerHeadline.includes('ai') || lowerHeadline.includes('trí tuệ nhân tạo')) headlineBoost += 0.5;
    if (lowerHeadline.includes('tự động') || lowerHeadline.includes('auto')) headlineBoost += 0.4;
    if (lowerHeadline.includes('tiết kiệm') || lowerHeadline.includes('giảm chi phí')) headlineBoost += 0.3;
    if (lowerHeadline.includes('miễn phí') || lowerHeadline.includes('free')) headlineBoost += 0.6;
    if (lowerHeadline.includes('kế toán') || lowerHeadline.includes('ledgerflow')) headlineBoost += 0.2;

    const finalCtr = Math.min(6.5, Math.max(0.5, baseCtr + headlineBoost));

    // CPC calculations based on audience competitiveness
    let baseCpc = 4500; // 4,500 VND
    if (audience === 'developers') baseCpc += 1500; // devs are expensive to target
    if (audience === 'founders') baseCpc += 800;
    if (channel === 'tiktok') baseCpc -= 1200; // TikTok is currently cheaper

    // CTR impact on CPC: higher CTR lowers CPC
    const finalCpc = Math.max(1200, Math.round(baseCpc * (2.0 / finalCtr)));

    // Budget impacts target reach
    const totalDays = 7;
    const totalSpent = budget * totalDays;
    const clicks = Math.round(totalSpent / finalCpc);
    
    // Conversion rate calculations
    let conversionRate = 0.025; // baseline 2.5%
    if (audience === 'founders') conversionRate += 0.01;
    if (lowerHeadline.includes('miễn phí') || lowerHeadline.includes('free')) conversionRate -= 0.008; // free clickers convert poorer

    const finalConvRate = Math.min(0.08, Math.max(0.005, conversionRate));
    const conversions = Math.round(clicks * finalConvRate);

    // Financial outcome
    const pricePerPro = 399000; // Pro license is 399,000 VND
    const estimatedRevenue = conversions * pricePerPro;
    const netProfit = estimatedRevenue - totalSpent;
    const roi = totalSpent > 0 ? Math.round((netProfit / totalSpent) * 100) : 0;
    const cac = conversions > 0 ? Math.round(totalSpent / conversions) : totalSpent;

    // Generate 7-day trend for SVG graph
    const dailySpend = budget;
    const clicksTrend: number[] = [];
    const conversionsTrend: number[] = [];
    let cumulativeSpent = 0;
    let cumulativeClicks = 0;
    let cumulativeConvs = 0;

    for (let day = 1; day <= totalDays; day++) {
      cumulativeSpent += dailySpend;
      // Adding slight randomness for visualization realism
      const dayClicks = Math.round((dailySpend / finalCpc) * (0.85 + Math.random() * 0.3));
      const dayConvs = Math.round(dayClicks * finalConvRate * (0.8 + Math.random() * 0.4));
      
      cumulativeClicks += dayClicks;
      cumulativeConvs += dayConvs;
      
      clicksTrend.push(cumulativeClicks);
      conversionsTrend.push(cumulativeConvs);
    }

    return {
      ctr: finalCtr.toFixed(2),
      cpc: finalCpc,
      cac,
      clicks,
      conversions,
      totalSpent,
      revenue: estimatedRevenue,
      roi,
      clicksTrend,
      conversionsTrend
    };
  }, [hasRun, budget, channel, audience, headline]);

  const handleSimulate = () => {
    setIsRunning(true);
    setHasRun(false);
    setRunId((n) => n + 1);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 1000);
  };

  // Mirror kết quả mô phỏng chiến dịch lên Business API để Marketing dữ liệu về 1 mối.
  const lastMirroredRun = useRef(0);
  useEffect(() => {
    if (!hasRun || !simulationResults) return;
    if (lastMirroredRun.current === runId) return;
    lastMirroredRun.current = runId;
    void upsertBusinessEntity({
      type: 'campaign',
      data: {
        name: headline.trim() || `Chiến dịch ${channel} - ${audience}`,
        channel,
        audience,
        budgetDailyVnd: budget,
        ctrPct: simulationResults.ctr,
        cpcVnd: simulationResults.cpc,
        clicks: simulationResults.clicks,
        conversions: simulationResults.conversions,
        totalSpentVnd: simulationResults.totalSpent,
        revenueVnd: simulationResults.revenue,
        roiPct: simulationResults.roi,
        cacVnd: simulationResults.cac,
        simulatedAt: new Date().toISOString(),
      },
      source: 'user',
    }).catch(() => {
      // offline → bỏ qua, không chặn mô phỏng.
    });
  }, [hasRun, simulationResults, runId, headline, channel, audience, budget]);

  return (
    <div className="rounded-3xl border border-sky-500/25 bg-slate-950/70 p-5 text-slate-100 space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <span className="rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[9px] font-black uppercase text-sky-300">Marketing Lab</span>
          <h3 className="mt-1 text-lg font-black text-text-primary">Guerrilla Ad Campaign Simulator</h3>
          <p className="text-xs font-semibold text-text-secondary">Thực hành lên ngân sách, thiết kế nội dung quảng cáo và chạy mô phỏng đo lường ROI tăng trưởng.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr] text-left">
        
        {/* Left Side: Inputs */}
        <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4 space-y-4">
          <p className="text-xs font-black text-text-primary uppercase tracking-wider">Cấu hình chiến dịch</p>
          
          {/* Daily Budget */}
          <div>
            <label className="block text-xs font-bold text-text-secondary">Ngân sách hàng ngày (VND)</label>
            <div className="mt-2 flex items-center justify-between text-xs font-black text-text-primary">
              <span>{budget.toLocaleString('vi-VN')} đ</span>
              <span className="text-text-tertiary">Tổng 7 ngày: {(budget * 7).toLocaleString('vi-VN')} đ</span>
            </div>
            <input 
              type="range" 
              min={50000} 
              max={1500000} 
              step={50000}
              value={budget} 
              onChange={(e) => setBudget(Number(e.target.value))} 
              className="mt-2 w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* Ad Channel & Audience Target */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-secondary">Kênh quảng cáo</label>
              <select 
                value={channel} 
                onChange={(e) => setChannel(e.target.value as ChannelType)}
                className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-sky-400"
              >
                <option value="facebook">Facebook Ads</option>
                <option value="google">Google Search Ads</option>
                <option value="tiktok">TikTok Ads</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-bold text-text-secondary">Đối tượng mục tiêu</label>
              <select 
                value={audience} 
                onChange={(e) => setAudience(e.target.value as AudienceType)}
                className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-sky-400"
              >
                <option value="founders">Founder & CEO startup</option>
                <option value="accountants">Kế toán trưởng / CFO</option>
                <option value="developers">Nhà phát triển / AI dev</option>
              </select>
            </div>
          </div>

          {/* Headline Copywriting */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-text-secondary">Tiêu đề nội dung quảng cáo (Headline)</label>
            <input 
              type="text" 
              value={headline} 
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Ví dụ: Tự động hóa kế toán startup bằng AI, tiết kiệm 80% thời gian..."
              className="w-full rounded-xl border border-border-secondary bg-slate-950 px-3 py-2 text-xs font-semibold text-text-primary outline-none focus:border-sky-400"
            />
            <span className="text-[10px] text-text-tertiary font-bold block leading-relaxed">
              💡 Mẹo: Dùng các từ khóa thôi miên: "AI", "Tự động hóa", "Tiết kiệm", "Miễn phí" để tăng CTR!
            </span>
          </div>

          <button
            onClick={handleSimulate}
            disabled={isRunning || !headline.trim()}
            className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-sky-950/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang chạy mô phỏng thuật toán...
              </span>
            ) : 'Kích hoạt chiến dịch quảng cáo'}
          </button>
        </div>

        {/* Right Side: Results */}
        <div className="rounded-2xl border border-border-primary bg-bg-primary/40 p-4 flex flex-col justify-center min-h-[300px]">
          {isRunning && (
            <div className="space-y-4 animate-pulse px-6 text-center">
              <BarChart3 className="w-10 h-10 text-sky-400 mx-auto animate-bounce" />
              <p className="text-xs font-semibold text-text-secondary">Đang thu thập dữ liệu nhấp chuột (Clicks) và phân bổ phễu chuyển đổi...</p>
            </div>
          )}

          {!isRunning && !hasRun && (
            <div className="text-center px-6 py-10 space-y-3">
              <Sparkles className="w-8 h-8 text-sky-400 mx-auto" />
              <p className="text-xs font-semibold text-text-secondary leading-relaxed">
                Nhập tiêu đề quảng cáo và bấm **Kích hoạt** để tính toán hiệu suất chiến dịch giả lập theo mô hình marketing SaaS.
              </p>
            </div>
          )}

          {!isRunning && hasRun && simulationResults && (
            <div className="space-y-5 animate-fade-in">
              <p className="text-xs font-black text-text-primary uppercase tracking-wider">KẾT QUẢ CHIẾN DỊCH (7 NGÀY MÔ PHỎNG)</p>
              
              {/* KPI metrics cards */}
              <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4">
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-2.5">
                  <span className="text-[9px] text-text-tertiary font-bold block uppercase">CTR</span>
                  <strong className="text-text-primary text-sm mt-1 block">{simulationResults.ctr}%</strong>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-2.5">
                  <span className="text-[9px] text-text-tertiary font-bold block uppercase">Cost per Click</span>
                  <strong className="text-text-primary text-sm mt-1 block">{simulationResults.cpc.toLocaleString('vi-VN')}đ</strong>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-2.5">
                  <span className="text-[9px] text-text-tertiary font-bold block uppercase">Leads (Pro)</span>
                  <strong className="text-emerald-400 text-sm mt-1 block">+{simulationResults.conversions}</strong>
                </div>
                <div className="rounded-xl border border-border-primary bg-slate-950/70 p-2.5">
                  <span className="text-[9px] text-text-tertiary font-bold block uppercase">CAC</span>
                  <strong className="text-text-primary text-sm mt-1 block">{simulationResults.cac.toLocaleString('vi-VN')}đ</strong>
                </div>
              </div>

              {/* ROI & Financial Overview */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-850 p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-text-secondary">Tổng đầu tư (spent):</span>
                  <span className="text-text-primary font-black">{simulationResults.totalSpent.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-text-secondary">Doanh thu dự tính:</span>
                  <span className="text-emerald-400 font-black">+{simulationResults.revenue.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="border-t border-border-primary pt-2 flex justify-between items-center text-xs">
                  <span className="font-black text-text-secondary">ROI chiến dịch:</span>
                  <span className={`font-black ${simulationResults.roi > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simulationResults.roi > 0 ? `+${simulationResults.roi}%` : `${simulationResults.roi}%`}
                  </span>
                </div>
              </div>

              {/* 7-day cumulative graph SVG */}
              <div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block mb-2 text-left">Đồ thị tích lũy chuyển đổi 7 ngày</span>
                <div className="rounded-xl bg-slate-950 border border-slate-850 p-2 h-36 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 120">
                    <line x1="30" y1="10" x2="380" y2="10" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="30" y1="55" x2="380" y2="55" stroke="#1e293b" strokeDasharray="3,3" />
                    <line x1="30" y1="100" x2="380" y2="100" stroke="#334155" />

                    {/* Clicks graph (Blue) */}
                    <path
                      d={simulationResults.clicksTrend.map((val, idx) => {
                        const x = 35 + idx * 55;
                        const y = 100 - (val / (simulationResults.clicks || 1)) * 80;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    {/* Conversions graph (Green) */}
                    <path
                      d={simulationResults.conversionsTrend.map((val, idx) => {
                        const x = 35 + idx * 55;
                        const y = 100 - (val / (simulationResults.conversions || 1 || 1)) * 80;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                    />

                    {/* Nodes */}
                    {simulationResults.clicksTrend.map((_, idx) => {
                      const x = 35 + idx * 55;
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={100 - (simulationResults.clicksTrend[idx] / (simulationResults.clicks || 1)) * 80} r="3" fill="#38bdf8" />
                          <circle cx={x} cy={100 - (simulationResults.conversionsTrend[idx] / (simulationResults.conversions || 1 || 1)) * 80} r="3" fill="#34d399" />
                          <text x={x} y="112" fill="#64748b" fontSize="8" textAnchor="middle">Ngày {idx + 1}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {simulationResults.roi <= 0 && (
                <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Chiến dịch lỗ! Hãy thử đổi Kênh (ví dụ: Google Search để có tỉ lệ chuyển đổi tốt hơn cho Kế toán), giảm ngân sách hoặc cải thiện Headline thu hút khách hàng.
                  </span>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Active Campaigns List with Toggle */}
      <div className="mt-8">
        <h3 className="mb-4 text-sm font-black text-text-primary uppercase tracking-wider flex items-center gap-2">
          <Send className="w-4 h-4 text-sky-400" /> Các chiến dịch đang chạy (Live Campaigns)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeCampaigns.map(camp => (
            <div key={camp.id} className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${camp.active ? 'border-sky-500/50 bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'border-border-primary bg-bg-primary opacity-60'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black uppercase text-text-tertiary bg-slate-900 px-2 py-1 rounded border border-slate-800">{camp.channel}</span>
                {/* Custom Toggle Switch */}
                <button
                  onClick={() => toggleCampaign(camp.id)}
                  className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${camp.active ? 'bg-sky-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${camp.active ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
              <h4 className="font-bold text-sm text-text-primary mb-1 line-clamp-2 leading-snug">{camp.name}</h4>
              <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-slate-850">
                <span className="text-text-secondary font-semibold">{camp.budget}</span>
                <span className={`font-black ${camp.active ? 'text-emerald-400' : 'text-slate-500'}`}>ROAS: {camp.roas}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
