import React, { useState } from 'react';
import { Video, Share2, Sparkles, Send, CheckCircle2, Film } from 'lucide-react';

export interface MediaCampaignUI {
  id: string;
  featureTitle: string;
  targetAudience: string;
  videoScript: string;
  socialMediaPost: string;
  platforms: string[];
  n8nWebhookPayload: Record<string, unknown>;
  createdAt: string;
}

export default function AutonomousMediaFactoryPanel() {
  const [featureTitleInput, setFeatureTitleInput] = useState('Autonomous Compliance Doctor 24/7');
  const [targetAudienceInput, setTargetAudienceInput] = useState('Enterprise CFOs & Founder OS');

  const [isGenerating, setIsGenerating] = useState(false);
  const [campaign, setCampaign] = useState<MediaCampaignUI | null>({
    id: 'cmp_demo_2026',
    featureTitle: 'Autonomous Compliance Doctor 24/7',
    targetAudience: 'Enterprise CFOs & Founder OS',
    videoScript: '[Hook - 0-5s] Bạn có biết tính năng Autonomous Compliance Doctor 24/7 vừa chính thức phát hành trên LedgerFlow Studio OS?\n[Body - 5-30s] Giúp các Enterprise CFOs & Founder OS tự động hóa quy trình kiểm toán tuân thủ bảo mật & VAS chỉ với 1-click.\n[Call to Action - 30-45s] Dùng thử ngay bản LedgerFlow Studio v5.0 tại ledgerflow.io!',
    socialMediaPost: '🚀 ROCKET LAUNCH: Autonomous Compliance Doctor 24/7\n\nGiải pháp mới nhất dành riêng cho các Enterprise CFOs & Founder OS!\n✅ Tự động hóa 100% bằng AI Swarm Agent.\n✅ Bảo mật tuyệt đối Zero-Trust.\n\n👉 Trải nghiệm ngay: https://ledgerflow.io?ref=product_launch',
    platforms: ['linkedin', 'facebook', 'tiktok_shorts'],
    n8nWebhookPayload: {
      campaignId: 'cmp_demo_2026',
      featureTitle: 'Autonomous Compliance Doctor 24/7',
      targetPlatforms: ['linkedin', 'facebook', 'tiktok_shorts'],
    },
    createdAt: new Date().toISOString(),
  });

  const handleGenerateCampaign = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/media/campaign/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureTitle: featureTitleInput,
          targetAudience: targetAudienceInput,
          platforms: ['linkedin', 'facebook', 'tiktok_shorts'],
        }),
      });
      const data = await res.json();
      if (data.success && data.campaign) {
        setCampaign(data.campaign);
      }
    } catch {
      // Simulation demo fallback
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-slate-950 border border-purple-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Autonomous Media Factory
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                LedgerFlow v5.0 Pillar 3
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Video className="w-7 h-7 text-purple-400" />
              Nhà máy Tự động Sản xuất Kịch bản Video & Media Truyền thông
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Khi Product Studio phát hành 1 tính năng mới, AI Media Factory tự động tạo Kịch bản Video Short/Reels, Bài đăng Mạng xã hội và Payload n8n Webhook phát hành đa kênh.
            </p>
          </div>

          <button
            onClick={handleGenerateCampaign}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Đang tạo Chiến dịch Media...
              </>
            ) : (
              <>
                <Film className="w-4 h-4" />
                Sinh Chiến dịch Media AI
              </>
            )}
          </button>
        </div>

        {/* Input Configuration Grid */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Tên Tính năng / Sản phẩm Mới:</label>
            <input
              type="text"
              value={featureTitleInput}
              onChange={(e) => setFeatureTitleInput(e.target.value)}
              className="mt-1 w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Chân dung Khách hàng Mục tiêu (ICP):</label>
            <input
              type="text"
              value={targetAudienceInput}
              onChange={(e) => setTargetAudienceInput(e.target.value)}
              className="mt-1 w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Generated Campaign Output */}
      {campaign && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Video Script Card */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                Kịch bản Video AI (TikTok Shorts / Reels / YouTube)
              </h3>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-purple-200 whitespace-pre-wrap font-sans leading-relaxed">
              {campaign.videoScript}
            </pre>
          </div>

          {/* Social Media Post Card */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-pink-400" />
                Bài đăng Mạng Xã hội (LinkedIn / Facebook / Telegram)
              </h3>
              <Send className="w-4 h-4 text-pink-400" />
            </div>
            <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-pink-200 whitespace-pre-wrap font-sans leading-relaxed">
              {campaign.socialMediaPost}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
