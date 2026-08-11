import React, { useState } from 'react';
import { Share2, Video, CheckCircle2, ExternalLink, RefreshCw, Send } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface ChannelConnector {
  id: string;
  name: string;
  platform: 'tiktok' | 'youtube' | 'shopee_affiliate';
  status: 'connected' | 'disconnected';
  accountName: string;
  publishedCount: number;
  lastSyncAt: string;
  apiKeyMasked: string;
}

export default function PublisherConnectorPanel() {
  const [channels, setChannels] = useState<ChannelConnector[]>([
    {
      id: 'conn_tiktok',
      name: 'TikTok Open API Channel',
      platform: 'tiktok',
      status: 'connected',
      accountName: '@SoloFounderStudio.Official',
      publishedCount: 42,
      lastSyncAt: 'Vừa xong',
      apiKeyMasked: 'tk_live_••••••••982A',
    },
    {
      id: 'conn_youtube',
      name: 'YouTube Data API v3 Studio',
      platform: 'youtube',
      status: 'connected',
      accountName: 'Solo Founder Gaming & Media',
      publishedCount: 89,
      lastSyncAt: '5 phút trước',
      apiKeyMasked: 'AIzaSy••••••••419X',
    },
    {
      id: 'conn_shopee',
      name: 'Shopee Affiliate Open API Gateway',
      platform: 'shopee_affiliate',
      status: 'connected',
      accountName: 'Partner ID #8892 (VnShopeeAff)',
      publishedCount: 154,
      lastSyncAt: '10 phút trước',
      apiKeyMasked: 'shp_aff_••••••••771B',
    },
  ]);

  const [publishStatus, setPublishStatus] = useState<string | null>(null);

  const handlePublishDemo = (channel: ChannelConnector) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channel.id ? { ...c, publishedCount: c.publishedCount + 1, lastSyncAt: 'Vừa xong' } : c))
    );
    setPublishStatus(`Đã tự động xuất bản 1 Video ngắn kèm Affiliate Link lên ${channel.name} (${channel.accountName})!`);
    setTimeout(() => setPublishStatus(null), 3500);
  };

  return (
    <Card className="p-5 bg-slate-900 border-indigo-500/20 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Publisher Connector Hub (TikTok, YouTube & Shopee API)
              <Badge variant="purple">3 Cổng API Đã Tích Hợp</Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Tự động xuất bản Video ngắn, Phim AI & Đồng bộ doanh thu Affiliate real-time.
            </p>
          </div>
        </div>
      </div>

      {publishStatus && (
        <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs font-semibold text-purple-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>{publishStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant={channel.platform === 'tiktok' ? 'purple' : channel.platform === 'youtube' ? 'danger' : 'warning'}>
                  {channel.platform.toUpperCase()}
                </Badge>
                <Badge variant="success" className="text-[9px]">🟢 API Connected</Badge>
              </div>

              <h4 className="text-xs font-bold text-white leading-snug">{channel.name}</h4>
              <p className="text-[11px] text-slate-400 font-mono">Tài khoản: <strong className="text-slate-200">{channel.accountName}</strong></p>

              <div className="p-2 bg-slate-900 rounded-lg text-[10px] text-slate-400 space-y-1 font-mono">
                <div>Key: <span className="text-indigo-300">{channel.apiKeyMasked}</span></div>
                <div>Đã đăng: <span className="text-white font-bold">{channel.publishedCount} bài</span></div>
                <div>Đồng bộ: <span className="text-slate-300">{channel.lastSyncAt}</span></div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => handlePublishDemo(channel)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-1.5 flex items-center justify-center gap-1.5 mt-2"
            >
              <Send className="w-3.5 h-3.5" /> Auto-Publish Video
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
