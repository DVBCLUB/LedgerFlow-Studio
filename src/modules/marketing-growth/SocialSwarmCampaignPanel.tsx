import React, { useEffect, useState } from 'react';
import {
  Video,
  Share2,
  Play,
  TrendingUp,
  PlusCircle,
  Eye,
  DollarSign,
  Users,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface SocialVideoCampaign {
  campaignId: string;
  title: string;
  targetPlatform: string;
  videoHook: string;
  capCutTemplateId: string;
  callToAction: string;
  status: string;
  projectedViews: number;
  attributedLeads: number;
  attributedRevenueVnd: number;
  scheduledTime: string;
  publishedAt?: string;
}

export default function SocialSwarmCampaignPanel() {
  const [campaigns, setCampaigns] = useState<SocialVideoCampaign[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetPlatform, setTargetPlatform] = useState<'TIKTOK' | 'YOUTUBE_SHORTS' | 'FACEBOOK_REELS' | 'ZALO_OA' | 'TELEGRAM_CHANNEL'>('TIKTOK');
  const [videoHook, setVideoHook] = useState('');
  const [callToAction, setCallToAction] = useState('');

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/dormant/social/campaigns');
      const data = await res.json();
      if (data?.success) {
        setCampaigns(data.campaigns || []);
        setTotalViews(data.totalViews || 0);
        setTotalLeads(data.totalLeads || 0);
        setTotalRevenue(data.totalAttributedRevenueVnd || 0);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !videoHook) return;
    try {
      await fetch('/api/dormant/social/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          targetPlatform,
          videoHook,
          capCutTemplateId: 'template_viral_custom',
          callToAction: callToAction || 'Xem demo tại bio',
        }),
      });
      setShowModal(false);
      setTitle('');
      setVideoHook('');
      await fetchCampaigns();
    } catch {
      // ignore
    }
  };

  const handlePublish = async (campaignId: string) => {
    try {
      await fetch('/api/dormant/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
      await fetchCampaigns();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-black text-white">🎬 Autonomous Video &amp; Social Swarm Campaign Engine</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Omnichannel Viral
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tự động soạn kịch bản CapCut, sản xuất video ngắn và đăng tải đa kênh (TikTok, YouTube Shorts, Reels) kéo traffic về phần mềm.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Tạo Chiến Dịch Video Mới</span>
        </button>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tổng Lượt Xem Dự Phóng</div>
          <div className="text-xl font-black text-rose-400 mt-1 font-mono">
            {totalViews.toLocaleString()} Views
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Trên 5 nền tảng video ngắn</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Khách Hàng Tiềm Năng (Leads)</div>
          <div className="text-xl font-black text-cyan-300 mt-1">{totalLeads} B2B Leads</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tỷ lệ chuyển đổi CTA: 2.8%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white/4 border border-white/8">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Doanh Thu Thu Được</div>
          <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
            {formatMoneyVN(totalRevenue, ' đ')}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">ROI Chiến dịch: 8.4x</div>
        </div>
      </div>

      {/* Campaigns Feed */}
      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.campaignId} className="p-4 rounded-xl bg-white/4 border border-white/8 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-500/20 text-rose-300">
                    {c.targetPlatform}
                  </span>
                  <h4 className="text-xs font-bold text-white">{c.title}</h4>
                </div>
                <p className="text-xs text-slate-300 italic mt-1.5">Hook: "{c.videoHook}"</p>
              </div>

              <div className="flex items-center gap-3">
                {c.status === 'SCHEDULED' ? (
                  <button
                    onClick={() => handlePublish(c.campaignId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Đăng Ngay (1-Click)</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ĐÃ ĐĂNG TẢI</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center text-xs">
              <div className="p-2 rounded bg-black/40">
                <span className="text-[9px] text-slate-400 uppercase">Lượt xem</span>
                <div className="font-bold text-white mt-0.5">{c.projectedViews.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded bg-black/40">
                <span className="text-[9px] text-slate-400 uppercase">Leads tạo ra</span>
                <div className="font-bold text-cyan-300 mt-0.5">{c.attributedLeads}</div>
              </div>
              <div className="p-2 rounded bg-black/40">
                <span className="text-[9px] text-slate-400 uppercase">Doanh thu thu về</span>
                <div className="font-bold text-emerald-400 mt-0.5 font-mono">
                  {formatMoneyVN(c.attributedRevenueVnd, ' đ')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tạo Chiến Dịch Video Mới */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-md p-6 rounded-2xl bg-[#141420] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Khởi Tạo Chiến Dịch Video Ngắn Mới</h3>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Tiêu đề video</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: 3 Sai lầm khiến kế toán bị phạt thuế"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Nền tảng mục tiêu</label>
              <select
                value={targetPlatform}
                onChange={(e: any) => setTargetPlatform(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
              >
                <option value="TIKTOK">TikTok Short Video</option>
                <option value="YOUTUBE_SHORTS">YouTube Shorts</option>
                <option value="FACEBOOK_REELS">Facebook Reels</option>
                <option value="ZALO_OA">Zalo Official Account</option>
                <option value="TELEGRAM_CHANNEL">Telegram Channel</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Câu Mở Đầu Gây Chú Ý (Video Hook 3s đầu)</label>
              <textarea
                value={videoHook}
                onChange={(e) => setVideoHook(e.target.value)}
                placeholder="Câu giật tít 3 giây đầu giữ chân người xem..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Lời kêu gọi hành động (Call to Action)</label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="Ví dụ: Nhấp link bio để dùng thử miễn phí"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Tạo Chiến Dịch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
