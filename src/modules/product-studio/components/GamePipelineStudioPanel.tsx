import { useEffect, useState } from 'react';
import { Gamepad2, Cpu, Bug, Star, Smartphone, Monitor, CheckCircle2, AlertCircle, Bot, RefreshCw, Terminal } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface GameReviewItem {
  id: string;
  gameTitle: string;
  platform: 'steam_pc' | 'google_play_android' | 'app_store_ios' | 'web_gl';
  author: string;
  rating: number;
  reviewText: string;
  category: 'bug_report' | 'feature_request' | 'positive_praise' | 'performance_issue';
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoTriaged: boolean;
  assignedAiDevTaskId?: string;
  createdAt: string;
}

export default function GamePipelineStudioPanel() {
  const [reviews, setReviews] = useState<GameReviewItem[]>([
    {
      id: 'rev_1',
      gameTitle: 'Dragon Odyssey PC',
      platform: 'steam_pc',
      author: 'GamerPro_VN',
      rating: 1,
      reviewText: 'Game bị crash văng ra ngoài khi đánh boss ở màn 3, mất file save!',
      category: 'bug_report',
      severity: 'critical',
      autoTriaged: true,
      assignedAiDevTaskId: 'worker_178229_sast',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rev_2',
      gameTitle: 'Cyber Runner Mobile',
      platform: 'google_play_android',
      author: 'NguyenVanA',
      rating: 5,
      reviewText: 'Game chạy mượt trên Android, lối chơi rất cuốn. Nên thêm đấu xếp hạng PvP!',
      category: 'feature_request',
      severity: 'medium',
      autoTriaged: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rev_3',
      gameTitle: 'Dragon Odyssey PC',
      platform: 'steam_pc',
      author: 'IndieLover',
      rating: 4,
      reviewText: 'Đồ họa 3D đẹp tuyệt vời, nhạc nền bắt tai. Đã mua bản quyền ủng hộ dev!',
      category: 'positive_praise',
      severity: 'low',
      autoTriaged: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const filteredReviews = filterPlatform === 'all'
    ? reviews
    : reviews.filter((r) => r.platform === filterPlatform);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Xưởng Sản xuất Game PC & Mobile
              <Badge variant="cyan">Game Studio</Badge>
            </h2>
            <p className="text-xs text-slate-400">
              Quản lý bản build PC (.exe/Steam) & Mobile (Android/iOS), tự động phân loại review và phân công AI sửa bug.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="default" className="bg-cyan-950/40 text-cyan-300 border-cyan-500/30 text-xs">
            🎮 2 Tựa Game Live on Steam & Stores
          </Badge>
        </div>
      </div>

      {/* Game Build Release Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Game PC Card */}
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Dragon Odyssey PC</h4>
                <span className="text-[10px] text-slate-400">Steam / Windows .exe</span>
              </div>
            </div>
            <Badge variant="success" className="text-[10px]">
              v1.2.4 Active
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-slate-950 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Lượt tải</span>
              <span className="text-xs font-bold text-slate-200">12.500+</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Đánh giá</span>
              <span className="text-xs font-bold text-amber-400">4.8 ★</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Auto AI Fix</span>
              <span className="text-xs font-bold text-emerald-400">1 Bug Active</span>
            </div>
          </div>
        </Card>

        {/* Game Mobile Card */}
        <Card className="p-4 bg-slate-900/90 border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-sm font-bold text-white">Cyber Runner Mobile</h4>
                <span className="text-[10px] text-slate-400">Google Play & App Store</span>
              </div>
            </div>
            <Badge variant="cyan" className="text-[10px]">
              v2.0.1 Live
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-slate-950 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Lượt tải</span>
              <span className="text-xs font-bold text-slate-200">45.000+</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">Đánh giá</span>
              <span className="text-xs font-bold text-amber-400">4.6 ★</span>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg">
              <span className="text-[10px] text-slate-400 block">In-app Sales</span>
              <span className="text-xs font-bold text-emerald-400">57 triệu ₫</span>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Player Review Classifier & Triage Stream */}
      <Card className="p-5 bg-slate-900/90 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              AI Player Review Classifier & Auto Bug Triage
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              AI tự động đọc nhận xét từ Steam/Stores, phân loại và tạo Task giao cho AI Developer.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterPlatform('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                filterPlatform === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterPlatform('steam_pc')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                filterPlatform === 'steam_pc' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400'
              }`}
            >
              Steam PC
            </button>
            <button
              onClick={() => setFilterPlatform('google_play_android')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                filterPlatform === 'google_play_android' ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-400'
              }`}
            >
              Android
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-200">{rev.author}</span>
                  <span className="text-xs text-amber-400 font-bold">{"★".repeat(rev.rating)}</span>
                  <Badge
                    variant={rev.category === 'bug_report' ? 'danger' : rev.category === 'feature_request' ? 'warning' : 'success'}
                    className="text-[10px] uppercase"
                  >
                    {rev.category.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 font-mono">"{rev.reviewText}"</p>
                <span className="text-[10px] text-slate-400 block">
                  Game: {rev.gameTitle} ({rev.platform})
                </span>
              </div>

              {rev.autoTriaged && rev.assignedAiDevTaskId && (
                <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-2 flex items-center gap-2 shrink-0">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-emerald-400 font-bold block">Auto-Triaged AI Task</span>
                    <span className="text-[9px] text-slate-400 font-mono">ID: {rev.assignedAiDevTaskId}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
