import React, { useEffect, useState } from 'react';
import { CircleDollarSign, TrendingUp, Sparkles, Tag, Tv, Gamepad2, Plus, ArrowUpRight, ShieldCheck, PieChart } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface DigitalIncomeItem {
  id: string;
  sourceName: string;
  streamType: 'affiliate' | 'ads' | 'game_app_sales' | 'direct_sales';
  amountVnd: number;
  platformName: string;
  date: string;
}

export default function DigitalMonetizationRadarPanel() {
  const [entries, setEntries] = useState<DigitalIncomeItem[]>([
    { id: 'inc_1', sourceName: 'Shopee Affiliate Tech Campaign', streamType: 'affiliate', amountVnd: 18500000, platformName: 'Shopee', date: 'Tháng này' },
    { id: 'inc_2', sourceName: 'YouTube Channel AdSense Revenue', streamType: 'ads', amountVnd: 12400000, platformName: 'YouTube AdSense', date: 'Tháng này' },
    { id: 'inc_3', sourceName: 'Steam Game Indie PC In-App Purchases', streamType: 'game_app_sales', amountVnd: 35000000, platformName: 'Steam', date: 'Tháng này' },
    { id: 'inc_4', sourceName: 'Google Play Mobile Game Ads & IAP', streamType: 'game_app_sales', amountVnd: 22000000, platformName: 'Google Play', date: 'Tháng này' },
  ]);

  const [sourceName, setSourceName] = useState('');
  const [streamType, setStreamType] = useState<'affiliate' | 'ads' | 'game_app_sales' | 'direct_sales'>('affiliate');
  const [amountVnd, setAmountVnd] = useState('');
  const [platformName, setPlatformName] = useState('');

  const totalRevenue = entries.reduce((acc, curr) => acc + curr.amountVnd, 0);
  const affiliateRevenue = entries.filter((e) => e.streamType === 'affiliate').reduce((acc, curr) => acc + curr.amountVnd, 0);
  const adsRevenue = entries.filter((e) => e.streamType === 'ads').reduce((acc, curr) => acc + curr.amountVnd, 0);
  const gameRevenue = entries.filter((e) => e.streamType === 'game_app_sales').reduce((acc, curr) => acc + curr.amountVnd, 0);

  const recommendedReinvestment = totalRevenue * 0.25;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim() || !amountVnd) return;

    const newEntry: DigitalIncomeItem = {
      id: `inc_${Date.now()}`,
      sourceName,
      streamType,
      amountVnd: parseFloat(amountVnd),
      platformName: platformName || 'Direct',
      date: 'Hôm nay',
    };

    setEntries((prev) => [newEntry, ...prev]);
    setSourceName('');
    setAmountVnd('');
    setPlatformName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Radar Doanh thu & Tái Đầu tư AI
              <Badge variant="warning">Monetization Radar</Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Tổng hợp dòng tiền 4 nguồn số: Affiliate Marketing, Quảng cáo Ads, Bán Game PC/Mobile & Sản phẩm.
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tổng Doanh thu Thu về</span>
          <span className="text-lg font-black text-emerald-400">
            {totalRevenue.toLocaleString('vi-VN')} ₫
          </span>
        </div>
      </div>

      {/* 4 Stream Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">🔗 Affiliate Marketing</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-base font-black text-amber-400 mt-2">
            {affiliateRevenue.toLocaleString('vi-VN')} ₫
          </p>
          <span className="text-[10px] text-slate-400">Shopee, TikTok Shop, SaaS</span>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">📺 Ads & Networks</span>
            <Tv className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-base font-black text-purple-400 mt-2">
            {adsRevenue.toLocaleString('vi-VN')} ₫
          </p>
          <span className="text-[10px] text-slate-400">YouTube AdSense, FB In-Stream</span>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">🎮 Game & App Purchases</span>
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-base font-black text-cyan-400 mt-2">
            {gameRevenue.toLocaleString('vi-VN')} ₫
          </p>
          <span className="text-[10px] text-slate-400">Steam, Android, iOS IAP</span>
        </Card>

        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">💼 Trực tiếp & Khác</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base font-black text-emerald-400 mt-2">0 ₫</p>
          <span className="text-[10px] text-slate-400">Hợp đồng & Dịch vụ trực tiếp</span>
        </Card>
      </div>

      {/* AI Reinvestment Recommendation Banner */}
      <Card className="p-5 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Gợi ý Tái Đầu tư AI (AI Reinvestment Radar)</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                AI đề xuất trích <span className="text-indigo-300 font-bold">25% ({recommendedReinvestment.toLocaleString('vi-VN')} ₫)</span> tổng doanh thu để tái đầu tư:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                  • 40%: Nâng cấp API Video AI & Render Server ({ (recommendedReinvestment * 0.4).toLocaleString('vi-VN') } ₫)
                </span>
                <span className="text-[11px] bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-mono">
                  • 35%: TikTok/FB Ads cho Game PC & Mobile ({ (recommendedReinvestment * 0.35).toLocaleString('vi-VN') } ₫)
                </span>
                <span className="text-[11px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
                  • 25%: Cloud Credits cho AI Staff ({ (recommendedReinvestment * 0.25).toLocaleString('vi-VN') } ₫)
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Record Income Entry Form & History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 p-4 bg-slate-900/90 border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Ghi nhận Nguồn Doanh thu Mới
          </h3>

          <form onSubmit={handleAddEntry} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Tên nguồn khoản thu</label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="VD: Shopee Affiliate Đợt 8/8..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Loại dòng tiền</label>
              <select
                value={streamType}
                onChange={(e) => setStreamType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="affiliate">🔗 Affiliate Marketing</option>
                <option value="ads">📺 Quảng cáo Ads (AdSense/FB)</option>
                <option value="game_app_sales">🎮 Bán Game PC/Mobile & In-App</option>
                <option value="direct_sales">💼 Trực tiếp / Khác</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Số tiền (VNĐ)</label>
              <input
                type="number"
                value={amountVnd}
                onChange={(e) => setAmountVnd(e.target.value)}
                placeholder="VD: 15000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-1">Nền tảng (Platform)</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="VD: Shopee, TikTok Shop, Steam, YouTube..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg">
              + Ghi nhận Khoản thu
            </Button>
          </form>
        </Card>

        {/* History List */}
        <Card className="lg:col-span-8 p-4 bg-slate-900/90 border-slate-800">
          <h3 className="text-xs font-bold text-white mb-3">Lịch sử Ghi nhận Khoản thu</h3>
          <div className="space-y-2">
            {entries.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.sourceName}</h4>
                  <span className="text-[10px] text-slate-400">
                    Nền tảng: {item.platformName} • {item.date}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  +{item.amountVnd.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
