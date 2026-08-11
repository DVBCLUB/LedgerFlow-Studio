import React, { useState } from 'react';
import { Video, Film, Youtube, DollarSign, Share2, TrendingUp, Sparkles, Copy, Check, ExternalLink, Filter, Plus, ArrowUpRight, Play, Eye, MousePointerClick, ShoppingBag, Wand2, Zap } from 'lucide-react';
import AIVideoFactoryPanel from './AIVideoFactoryPanel';

interface VideoPost {
  id: string;
  title: string;
  platform: 'TikTok' | 'Facebook Reels' | 'YouTube Shorts' | 'YouTube Longform';
  views: number;
  productLeads: number;
  adRevenue: number;
  affiliateRevenue: number;
  status: 'published' | 'scheduled' | 'draft';
  targetProduct: string;
}

interface AffiliateLink {
  id: string;
  name: string;
  partner: string;
  category: 'Shopee/Lazada' | 'SaaS Partner' | 'Course/Ebook' | 'Hardware/Gadget';
  commissionRate: string;
  clicks: number;
  conversions: number;
  earnedAmount: number;
  shortUrl: string;
}

export default function VideoAffiliateGrowthHub() {
  const [subView, setSubView] = useState<'performance' | 'ai_factory'>('performance');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const [videoList, setVideoList] = useState<VideoPost[]>([
    {
      id: 'VID-001',
      title: 'Cách mình tự làm phần mềm kế toán VAS 133 bằng AI trong 3 ngày',
      platform: 'TikTok',
      views: 124500,
      productLeads: 342,
      adRevenue: 120,
      affiliateRevenue: 450,
      status: 'published',
      targetProduct: 'LedgerFlow OS',
    },
    {
      id: 'VID-002',
      title: 'Review tựa game 3D làm bằng WebGL & ML Engine cực mượt',
      platform: 'YouTube Shorts',
      views: 89000,
      productLeads: 215,
      adRevenue: 95,
      affiliateRevenue: 310,
      status: 'published',
      targetProduct: 'Studio Game & ML',
    },
    {
      id: 'VID-003',
      title: 'Bí quyết tăng tốc render video bằng GPU Cloud giá siêu rẻ',
      platform: 'Facebook Reels',
      views: 65400,
      productLeads: 180,
      adRevenue: 45,
      affiliateRevenue: 520,
      status: 'published',
      targetProduct: 'LedgerFlow OS',
    },
    {
      id: 'VID-004',
      title: 'Hướng dẫn tích hợp AI Agent tự động hóa doanh nghiệp từ A-Z',
      platform: 'YouTube Longform',
      views: 34200,
      productLeads: 490,
      adRevenue: 280,
      affiliateRevenue: 890,
      status: 'published',
      targetProduct: 'AI Workforce',
    },
  ]);

  const [affiliateLinks] = useState<AffiliateLink[]>([
    {
      id: 'AFF-001',
      name: 'Micro Thu Âm Khử Ồn Cho Creator',
      partner: 'Shopee Affiliate',
      category: 'Hardware/Gadget',
      commissionRate: '8.5%',
      clicks: 4320,
      conversions: 184,
      earnedAmount: 645,
      shortUrl: 'https://lf.studio/aff/mic-creator',
    },
    {
      id: 'AFF-002',
      name: 'Gói VPS GPU Render AI Cloud',
      partner: 'RunPod / AWS Partner',
      category: 'SaaS Partner',
      commissionRate: '15.0%',
      clicks: 2150,
      conversions: 92,
      earnedAmount: 1120,
      shortUrl: 'https://lf.studio/aff/vps-gpu',
    },
    {
      id: 'AFF-003',
      name: 'Bàn Phím Cơ Ergonomic Gõ Code',
      partner: 'Lazada Affiliate',
      category: 'Hardware/Gadget',
      commissionRate: '7.0%',
      clicks: 1890,
      conversions: 67,
      earnedAmount: 380,
      shortUrl: 'https://lf.studio/aff/keyboard-ergo',
    },
  ]);

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredVideos = platformFilter === 'all'
    ? videoList
    : videoList.filter((v) => v.platform === platformFilter);

  const totalViews = videoList.reduce((acc, v) => acc + v.views, 0);
  const totalLeads = videoList.reduce((acc, v) => acc + v.productLeads, 0);
  const totalAdRevenue = videoList.reduce((acc, v) => acc + v.adRevenue, 0);
  const totalAffiliateRevenue = videoList.reduce((acc, v) => acc + v.affiliateRevenue, 0) + affiliateLinks.reduce((acc, a) => acc + a.earnedAmount, 0);

  return (
    <div className="space-y-6 text-left select-none animate-fade-in">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900/90 to-purple-950/20 p-6 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-500/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-cyan-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.7)]" />
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-300">Video & Affiliate Engine</p>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Tiếp thị Video Đa kênh & Thu nhập Tiếp thị Liên kết</h1>
            <p className="mt-2.5 max-w-3xl text-xs font-semibold leading-6 text-slate-300/90">
              Mô hình tăng trưởng đa kênh: Đăng Video (TikTok, Reels, YouTube) kiếm tiền AdSense/Creator Fund + Kéo Traffic đăng ký Phần mềm & Game + Hoa hồng Tiếp thị Liên kết Affiliate.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-white/10 p-1 rounded-2xl">
              <button
                onClick={() => setSubView('performance')}
                className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition cursor-pointer ${
                  subView === 'performance' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Chỉ Số & Doanh Thu
              </button>
              <button
                onClick={() => setSubView('ai_factory')}
                className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  subView === 'ai_factory' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 text-cyan-300" /> AI Video Factory
              </button>
            </div>

            <button
              onClick={() => {
                const title = prompt('Nhập tiêu đề video mới:');
                if (!title) return;
                const newVid: VideoPost = {
                  id: `VID-${Date.now().toString().slice(-3)}`,
                  title,
                  platform: 'TikTok',
                  views: 0,
                  productLeads: 0,
                  adRevenue: 0,
                  affiliateRevenue: 0,
                  status: 'scheduled',
                  targetProduct: 'LedgerFlow OS',
                };
                setVideoList([newVid, ...videoList]);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Lên Lịch Video Mới
            </button>
          </div>
        </div>
      </section>

      {subView === 'ai_factory' ? (
        <AIVideoFactoryPanel />
      ) : (
        <>

      {/* 4 Summary Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tổng Lượt View Video</p>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-white">{totalViews.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% so với tháng trước
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Leads Kéo Về Phần Mềm/Game</p>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-cyan-300">{totalLeads.toLocaleString()} Leads</p>
          <p className="mt-1 text-[11px] font-semibold text-cyan-400">Chuyển đổi đăng ký dùng thử & chơi game</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Doanh thu Video (AdSense/Fund)</p>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-300">${totalAdRevenue.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Thanh toán tự động từ YouTube & TikTok</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Doanh thu Affiliate Marketing</p>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-300">${totalAffiliateRevenue.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-semibold text-amber-400">Hoa hồng link sản phẩm & đối tác SaaS</p>
        </div>
      </div>

      {/* Main Grid: Video Pipeline & Affiliate Links */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Video Pipeline (2 Cols) */}
        <div className="xl:col-span-2 space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Danh mục Video Tiếp thị Đa nền tảng</h2>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 p-1 rounded-2xl">
              {['all', 'TikTok', 'Facebook Reels', 'YouTube Shorts', 'YouTube Longform'].map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-3 py-1 text-[10px] font-black uppercase rounded-xl transition cursor-pointer ${
                    platformFilter === plat ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {plat === 'all' ? 'Tất cả' : plat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="group rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition-all duration-200 hover:border-purple-500/40 hover:bg-slate-900/90"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1.5 text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        video.platform === 'TikTok' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' :
                        video.platform === 'YouTube Longform' || video.platform === 'YouTube Shorts' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' :
                        'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {video.platform}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sản phẩm đích: <strong className="text-white">{video.targetProduct}</strong></span>
                    </div>
                    <h3 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">{video.title}</h3>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Views</p>
                      <p className="text-xs font-black text-white">{video.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Leads Kéo Về</p>
                      <p className="text-xs font-black text-cyan-300">+{video.productLeads}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng Thu Nhập</p>
                      <p className="text-xs font-black text-emerald-300">${(video.adRevenue + video.affiliateRevenue).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affiliate Link Manager (1 Col) */}
        <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">Link Tiếp Thị Liên Kết (Affiliate)</h2>
          </div>

          <div className="space-y-3">
            {affiliateLinks.map((link) => (
              <div key={link.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {link.partner}
                  </span>
                  <span className="text-xs font-black text-emerald-300">+${link.earnedAmount}</span>
                </div>
                <h4 className="text-xs font-black text-white">{link.name}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Hoa hồng: <strong className="text-white">{link.commissionRate}</strong></span>
                  <span>{link.clicks.toLocaleString()} Clicks · {link.conversions} Chuyển đổi</span>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-white/5">
                  <code className="text-[10px] font-mono text-cyan-300 truncate max-w-[180px]">{link.shortUrl}</code>
                  <button
                    onClick={() => copyToClipboard(link.id, link.shortUrl)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    title="Copy Link Affiliate"
                  >
                    {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
