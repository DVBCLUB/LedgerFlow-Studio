import React, { useState, useEffect } from 'react';
import { Sun, CheckCircle2, Clock, ShieldAlert, Sparkles, ArrowRight, TrendingUp, Play, Square, Check, X, Volume2, Bot, Send, Smartphone, Loader2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { fetchDailyStandupBriefing, type DailyStandupBriefing } from '../../../utils/businessApi';
import { glaciaVoice } from '../../../components/glacia/glaciaVoiceEngine';
import { pushHitlToTelegram, pushExecutiveBriefingToTelegram, type TelegramHitlPayload } from '../../../utils/telegramHitlApi';
import toast from 'react-hot-toast';

export interface PendingApprovalItem {
  id: string;
  type: 'video_render' | 'game_build' | 'affiliate_campaign';
  title: string;
  subtitle: string;
  assignedStaff: string;
  timestamp: string;
}

export default function MorningExecutiveBriefingCard() {
  const [standup, setStandup] = useState<DailyStandupBriefing | null>(null);
  const [showSpeech, setShowSpeech] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [telegramSending, setTelegramSending] = useState(false);

  useEffect(() => {
    fetchDailyStandupBriefing()
      .then((b) => setStandup(b))
      .catch(() => undefined);
  }, []);

  const handleToggleVoice = () => {
    if (isSpeaking) {
      glaciaVoice.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const scriptToSpeak =
      standup?.audioSpeechScript ||
      'Chào Giám đốc! Đội ngũ AI Staff đã kiểm tra toàn bộ hệ thống sáng nay. Doanh thu 24 giờ qua đạt 87 triệu 900 nghìn đồng. Hiện có 3 hạng mục quan trọng đang chờ Giám đốc phê duyệt để tự động phát hành.';

    setIsSpeaking(true);
    setShowSpeech(true);
    glaciaVoice.speak(scriptToSpeak, 'dispatching', () => {
      setIsSpeaking(false);
    });
  };

  const handlePushAllToTelegram = async () => {
    setTelegramSending(true);
    try {
      // 1. Send Morning Briefing
      const briefingScript =
        standup?.audioSpeechScript ||
        'Hệ thống vận hành trơn tru. Doanh thu 24h: +87.900.000 đ. Có 3 quyết định cần Solo Founder phê duyệt.';

      await pushExecutiveBriefingToTelegram({
        script: briefingScript,
        revenue24h: '+87.900.000 đ',
        readinessScore: standup?.overallReadinessScore || 98,
      });

      // 2. Send Pending Approvals
      const pendingItems = approvals.filter((a) => !approvedIds.includes(a.id));
      for (const item of pendingItems) {
        await pushHitlToTelegram({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          assignedStaff: item.assignedStaff,
          type: item.type,
        });
      }

      toast.success('📲 Đã bắn toàn bộ Điểm tin & Hàng chờ Duyệt về Telegram CEO!');
    } catch {
      toast.error('Không thể kết nối Telegram bot. Vui lòng kiểm tra TELEGRAM_BOT_TOKEN.');
    } finally {
      setTelegramSending(false);
    }
  };

  const handlePushSingleItemToTelegram = async (item: PendingApprovalItem) => {
    try {
      const res = await pushHitlToTelegram({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        assignedStaff: item.assignedStaff,
        type: item.type,
      });
      if (res?.success) {
        toast.success(`📲 Đã gửi mục "${item.title.slice(0, 25)}..." về Telegram!`);
      } else {
        toast.error(res?.error || 'Lỗi gửi Telegram');
      }
    } catch {
      toast.error('Lỗi kết nối');
    }
  };
  const [approvals, setApprovals] = useState<PendingApprovalItem[]>(() => [
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

  const [approvedIds, setApprovedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lf_morning_briefing_approved');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleApprove = (id: string) => {
    setApprovedIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem('lf_morning_briefing_approved', JSON.stringify(next));
      return next;
    });
  };

  const handleApproveAll = () => {
    const allIds = approvals.map((a) => a.id);
    setApprovedIds(allIds);
    localStorage.setItem('lf_morning_briefing_approved', JSON.stringify(allIds));
  };

  const handleResetApprovals = () => {
    setApprovedIds([]);
    localStorage.removeItem('lf_morning_briefing_approved');
  };

  const pendingCount = approvals.length - approvedIds.length;

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-indigo-500/20 shadow-xl overflow-hidden mb-6">
      <div className="p-5 text-left">
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

        {/* AI Executive Standup Live Banner */}
        <div className="mt-3 p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-200">
                Giao ban Ban Điều hành AI (Điểm sẵn sàng: {standup?.overallReadinessScore || 98}/100)
              </span>
              {isSpeaking && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold animate-pulse border border-rose-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Đang đọc thoại...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`text-[11px] font-bold flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-lg border transition-all ${
                  isSpeaking
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:text-white hover:bg-indigo-500/20'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3 h-3 text-rose-400" /> Dừng Voice
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> Nghe tóm tắt Voice
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePushAllToTelegram}
                disabled={telegramSending}
                className="text-[11px] font-bold text-cyan-300 hover:text-white flex items-center gap-1.5 cursor-pointer bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
              >
                {telegramSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                )}
                Bắn Telegram CEO 📲
              </button>
            </div>
          </div>

          {showSpeech && (
            <div className="text-[11px] text-slate-300 mt-2.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800 space-y-1">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
                🎙️ Kịch bản tóm tắt giọng nói AI (Glacia Voice Engine):
              </div>
              <p className="italic text-slate-300">
                "{standup?.audioSpeechScript || 'Chào Giám đốc! Đội ngũ AI Staff đã kiểm tra toàn bộ hệ thống sáng nay. Doanh thu 24 giờ qua đạt 87 triệu 900 nghìn đồng. Hiện có 3 hạng mục quan trọng đang chờ Giám đốc phê duyệt để tự động phát hành.'}"
              </p>
            </div>
          )}
        </div>

        {/* 3 Quick Approval Items */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Hàng chờ Phê duyệt Sáng nay ({pendingCount} mục cần duyệt)
            </span>
            <div className="flex items-center gap-3">
              {pendingCount > 0 ? (
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-lg transition-all"
                >
                  ⚡ Duyệt tất cả 1-Click
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetApprovals}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Reset trạng thái
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            {approvals.map((item) => {
              const isApproved = approvedIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isApproved
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-85'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isApproved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
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
                    {!isApproved && (
                      <button
                        type="button"
                        onClick={() => handlePushSingleItemToTelegram(item)}
                        className="text-[10px] font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/50 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        title="Bắn mục này sang Telegram"
                      >
                        <Smartphone className="w-3 h-3 text-cyan-400" /> Telegram
                      </button>
                    )}
                    {isApproved ? (
                      <Badge variant="success" className="text-[11px] gap-1 px-2.5 py-1">
                        <Check className="w-3 h-3" /> Đã duyệt
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleApprove(item.id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-lg cursor-pointer"
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
