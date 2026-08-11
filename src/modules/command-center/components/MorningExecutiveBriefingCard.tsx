import React, { useState } from 'react';
import { Sun, CheckCircle2, Clock, ShieldAlert, Sparkles, ArrowRight, TrendingUp, Play, Check, X } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface PendingApprovalItem {
  id: string;
  type: 'video_render' | 'game_build' | 'affiliate_campaign';
  title: string;
  subtitle: string;
  assignedStaff: string;
  timestamp: string;
}

export default function MorningExecutiveBriefingCard() {
  const [approvals, setApprovals] = useState<PendingApprovalItem[]>([
    {
      id: 'appr_1',
      type: 'video_render',
      title: 'Video TikTok/Reels AI: "Review Micro Thu Âm Pro"',
      subtitle: 'Đã sinh kịch bản + Voice AI + Đính kèm mã Affiliate Shopee (15% hoa hồng)',
      assignedStaff: 'AI Video Creator Agent',
      timestamp: '07:45 AM',
    },
    {
      id: 'appr_2',
      type: 'game_build',
      title: 'Bản Build Game PC/Mobile v1.2.4 (Hotfix FPS)',
      subtitle: 'Đã sửa 3 lỗi crash do người chơi báo cáo trên Steam & Google Play',
      assignedStaff: 'SWE Dev Agent',
      timestamp: '06:30 AM',
    },
    {
      id: 'appr_3',
      type: 'affiliate_campaign',
      title: 'Chiến dịch Affiliate Bàn Phím Ergonomic TikTok Shop',
      subtitle: 'Tự động chèn bio link + mã giảm giá LFSTUDIO10 vào 5 clip ngắn',
      assignedStaff: 'AI Growth Agent',
      timestamp: '08:00 AM',
    },
  ]);

  const [approvedIds, setApprovedIds] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => [...prev, id]);
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-500/20 shadow-xl overflow-hidden mb-6">
      <div className="p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Morning Executive Briefing</h2>
                <Badge variant="success" className="text-[10px] uppercase">
                  8:00 AM Live
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Chào Giám đốc! Đội ngũ AI Staff đã sẵn sàng báo cáo vận hành sáng nay.
              </p>
            </div>
          </div>

          {/* Revenue 24h Stat Pill */}
          <div className="bg-slate-950/60 border border-emerald-500/30 rounded-xl px-3 py-1.5 flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Doanh thu 24h</span>
              <span className="text-sm font-black text-emerald-400">+87.900.000 ₫</span>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* 3 Quick Approval Items */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Hàng chờ Phê duyệt Sáng nay ({approvals.length - approvedIds.length} mục cần duyệt)
            </span>
            <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer font-medium">
              Duyệt tất cả bằng 1-Click
            </span>
          </div>

          <div className="space-y-2.5">
            {approvals.map((item) => {
              const isApproved = approvedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isApproved
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded">
                          🤖 {item.assignedStaff}
                        </span>
                        <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {isApproved ? (
                      <Badge variant="success" className="text-[11px]">
                        Đã duyệt ✓
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-lg"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Duyệt ngay
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
