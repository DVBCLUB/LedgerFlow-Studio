import React, { useState } from 'react';
import { Clock, Play, CheckCircle2, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface ScheduleRule {
  id: string;
  title: string;
  cronExpression: string;
  assignedAgent: string;
  actionType: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt: string;
  runCount: number;
}

export default function AIAgentSchedulerPanel() {
  const [rules, setRules] = useState<ScheduleRule[]>([
    {
      id: 'cron_media_morning',
      title: '🌅 06:00 AM - AI Media Cào Trend & Tạo 3 Kịch bản TikTok/Reels',
      cronExpression: '0 6 * * *',
      assignedAgent: 'AI Media Director',
      actionType: 'media_gen',
      enabled: true,
      nextRunAt: 'Hôm nay lúc 06:00 AM',
      runCount: 14,
    },
    {
      id: 'cron_affiliate_midday',
      title: '☀️ 12:00 PM - AI CFO Đồng bộ Hoa hồng Affiliate Nửa ngày',
      cronExpression: '0 12 * * *',
      assignedAgent: 'AI CFO & Growth Specialist',
      actionType: 'affiliate_sync',
      enabled: true,
      nextRunAt: 'Hôm nay lúc 12:00 PM',
      runCount: 28,
    },
    {
      id: 'cron_game_nightly',
      title: '🌙 23:00 PM - AI Dev Cào Review Steam/Stores & Phân loại Bug',
      cronExpression: '0 23 * * *',
      assignedAgent: 'AI Game Developer',
      actionType: 'bug_triage',
      enabled: true,
      nextRunAt: 'Hôm nay lúc 23:00 PM',
      runCount: 12,
    },
  ]);

  const [execStatus, setExecStatus] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleRunNow = (rule: ScheduleRule) => {
    setExecStatus(`Đã chạy thành công lịch trình: "${rule.title}"`);
    setRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, runCount: r.runCount + 1, lastRunAt: 'Vừa xong' } : r))
    );
    setTimeout(() => setExecStatus(null), 3000);
  };

  return (
    <Card className="p-5 bg-slate-900 border-indigo-500/20 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Lịch trình Tự động AI Agent (Auto-Scheduler & Cron Workflows)
              <Badge variant="purple">3 Workflows Tự vận hành</Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Tự động hóa các nhiệm vụ chạy ngầm định kỳ hàng ngày cho Nhân sự AI.
            </p>
          </div>
        </div>
      </div>

      {execStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{execStatus}</span>
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">{rule.title}</h4>
                <Badge variant={rule.enabled ? 'success' : 'default'} className="text-[9px]">
                  {rule.enabled ? '🟢 Đang bật' : '⚪ Đã tắt'}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Phụ trách: <strong className="text-indigo-300">{rule.assignedAgent}</strong> • Lần chạy gần nhất: <span className="text-slate-300">{rule.lastRunAt || 'Chưa chạy'}</span> (Đã chạy {rule.runCount} lần)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={rule.enabled ? 'outline' : 'secondary'}
                onClick={() => handleToggle(rule.id)}
                className="text-xs px-3 py-1"
              >
                {rule.enabled ? 'Tắt' : 'Bật'}
              </Button>

              <Button
                size="sm"
                onClick={() => handleRunNow(rule)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1 flex items-center gap-1.5"
              >
                <Play className="w-3 h-3" /> Chạy ngay
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
