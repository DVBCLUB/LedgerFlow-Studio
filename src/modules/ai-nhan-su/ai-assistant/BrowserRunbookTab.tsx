import React, { useEffect, useState, useCallback } from 'react';
import { Bot, Calendar, Camera, ChevronDown, ChevronRight, Clock, FileText, Loader2, RefreshCw, Search, XCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { daemonFetch } from '../../../utils/assistantApi';

interface RunbookStep {
  id: string;
  action: string;
  timestamp: string;
  durationMs: number;
  success: boolean;
  detail: string;
  evidence?: {
    screenshotPath?: string;
    textPreview?: string;
    errorMessage?: string;
    selector?: string;
  };
}

interface RunbookSession {
  id: string;
  platform: string;
  profileId?: string;
  profileName?: string;
  prompt: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: RunbookStep[];
  startedAt: string;
  completedAt?: string;
  totalDurationMs: number;
  modelUsed?: string;
  error?: string;
  artifacts: Array<{
    id: string;
    type: string;
    path?: string;
    content?: string;
    createdAt: string;
  }>;
  replayAvailable: boolean;
}

interface RunbookSummary {
  totalSessions: number;
  completed: number;
  failed: number;
  averageDurationMs: number;
  byPlatform: Record<string, { total: number; failed: number; avgDurationMs: number }>;
  recentErrors: Array<{ platform: string; error: string; at: string }>;
}

const actionLabels: Record<string, string> = {
  login: 'Đăng nhập',
  navigate: 'Điều hướng',
  type_prompt: 'Gửi prompt',
  click_send: 'Bấm gửi',
  wait_response: 'Chờ phản hồi',
  extract_text: 'Trích xuất text',
  extract_code: 'Trích xuất code',
  capture_screenshot: 'Chụp màn hình',
  encounter_error: 'Gặp lỗi',
  quota_detected: 'Hết quota',
  session_expired: 'Session hết hạn',
};

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  navigate: Search,
  type_prompt: FileText,
  extract_text: FileText,
  capture_screenshot: Camera,
  encounter_error: AlertTriangle,
  quota_detected: AlertTriangle,
  session_expired: XCircle,
};

function formatTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso; }
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso.slice(0, 16); }
}

export default function BrowserRunbookTab() {
  const [sessions, setSessions] = useState<RunbookSession[]>([]);
  const [summary, setSummary] = useState<RunbookSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [histRes, sumRes] = await Promise.all([
        daemonFetch<{ ok: boolean; sessions: RunbookSession[] }>('/api/browser-runbook/history?limit=50'),
        daemonFetch<{ ok: boolean; summary: RunbookSummary }>('/api/browser-runbook/summary'),
      ]);
      setSessions(histRes.sessions || []);
      setSummary(sumRes.summary);
    } catch (err: any) {
      setError(err.message || 'Không tải được runbook.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-text-secondary uppercase tracking-widest">Browser Runbook History</h3>
          <p className="text-[10px] text-text-tertiary mt-0.5">Lịch sử mọi phiên Web AI: từng bước, evidence, thời gian</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-lg border border-border-primary bg-bg-primary px-3 py-1.5 text-[10px] font-bold text-text-secondary hover:border-violet-500 disabled:opacity-50">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Tải lại
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-[11px] font-bold text-rose-200 flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}
      {message && <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] font-bold text-emerald-200 flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0" />{message}</div>}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-xl border border-border-primary bg-slate-950/50 p-3">
            <div className="text-xl font-black text-text-primary">{summary.totalSessions}</div>
            <div className="text-[10px] font-bold text-text-tertiary">Tổng phiên</div>
          </div>
          <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-3">
            <div className="text-xl font-black text-emerald-300">{summary.completed}</div>
            <div className="text-[10px] font-bold text-text-tertiary">Thành công</div>
          </div>
          <div className="rounded-xl border border-rose-800/30 bg-rose-950/20 p-3">
            <div className="text-xl font-black text-rose-300">{summary.failed}</div>
            <div className="text-[10px] font-bold text-text-tertiary">Thất bại</div>
          </div>
          <div className="rounded-xl border border-border-primary bg-slate-950/50 p-3">
            <div className="text-xl font-black text-amber-300">{(summary.averageDurationMs / 1000).toFixed(1)}s</div>
            <div className="text-[10px] font-bold text-text-tertiary">TB thời gian</div>
          </div>
        </div>
      )}

      {/* By platform */}
      {summary && Object.keys(summary.byPlatform).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(summary.byPlatform).map(([platform, stats]) => (
            <span key={platform} className="rounded-full border border-border-secondary bg-bg-primary px-3 py-1 text-[10px] font-bold text-text-secondary">
              {platform}: {stats.total} phiên ({stats.failed} lỗi, {Math.round(stats.avgDurationMs / 1000)}s TB)
            </span>
          ))}
        </div>
      )}

      {/* Recent errors */}
      {summary && (summary.recentErrors?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-rose-800/30 bg-rose-950/20 p-3 space-y-1">
          <div className="text-[10px] font-black uppercase text-rose-300">Lỗi gần đây</div>
          {summary.recentErrors.slice(-5).map((e, i) => (
            <div key={i} className="text-[10px] text-rose-200 flex gap-2">
              <span className="font-bold">{e.platform}</span>
              <span className="text-rose-400">{e.error.slice(0, 100)}</span>
              <span className="text-slate-600">{formatDate(e.at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="flex items-center justify-center py-8 text-xs text-text-tertiary gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400" /> Đang tải runbook...
        </div>
      ) : (sessions || []).length === 0 ? (
        <div className="text-center py-8 text-xs text-text-tertiary">Chưa có phiên browser nào. Hãy chạy Web AI Execute để tạo dữ liệu.</div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {(sessions || []).map(session => {
            const isExpanded = expandedId === session.id;
            const failedSteps = (session.steps || []).filter(s => !s.success).length;
            return (
              <div key={session.id} className="rounded-xl border border-border-primary bg-slate-950/60 overflow-hidden">
                {/* Session header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="w-full text-left p-3 flex items-center justify-between gap-3 hover:bg-bg-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={session.status === 'completed' ? 'text-emerald-400' : session.status === 'failed' ? 'text-rose-400' : 'text-amber-400'}>
                      {session.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : session.status === 'failed' ? <XCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-cyan-300">{session.platform}</span>
                        {session.modelUsed && <span className="text-[9px] text-text-tertiary">{session.modelUsed}</span>}
                      </div>
                      <div className="text-[11px] text-text-secondary truncate max-w-[300px]">{session.prompt}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-text-tertiary">{formatDate(session.startedAt)}</span>
                        <span className="text-[9px] text-slate-600">· {(session.totalDurationMs / 1000).toFixed(1)}s</span>
                        <span className="text-[9px] text-slate-600">· {(session.steps?.length || 0)} steps</span>
                        {failedSteps > 0 && <span className="text-[9px] text-rose-400">· {failedSteps} lỗi</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" /> : <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" />}
                </button>

                {/* Expanded steps */}
                {isExpanded && (
                  <div className="border-t border-border-primary p-3 space-y-1.5 bg-slate-950/40">
                    {session.error && (
                      <div className="rounded-lg border border-rose-800/30 bg-rose-950/20 p-2 text-[10px] font-bold text-rose-300">Lỗi: {session.error}</div>
                    )}
                    {(session.steps || []).map((step, i) => {
                      const Icon = actionIcons[step.action] || Bot;
                      return (
                        <div key={step.id} className="flex items-start gap-2 text-[10px] py-1">
                          <span className="text-slate-600 w-12 text-right shrink-0">{formatTime(step.timestamp)}</span>
                          <span className={step.success ? 'text-emerald-400' : 'text-rose-400'}>
                            <Icon className="h-3 w-3" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-text-secondary">{actionLabels[step.action] || step.action}</span>
                            <span className="text-text-tertiary ml-1">{step.detail}</span>
                            {step.evidence?.textPreview && (
                              <div className="mt-1 rounded bg-bg-primary border border-border-primary p-1.5 text-[9px] text-text-secondary max-h-16 overflow-auto whitespace-pre-wrap">
                                {step.evidence.textPreview}
                              </div>
                            )}
                            {step.evidence?.errorMessage && (
                              <div className="mt-1 text-rose-400">{step.evidence.errorMessage.slice(0, 200)}</div>
                            )}
                            {step.evidence?.screenshotPath && (
                              <div className="mt-1 text-text-tertiary flex items-center gap-1"><Camera className="h-2.5 w-2.5" /> {step.evidence.screenshotPath.split('/').pop()}</div>
                            )}
                            <span className="text-slate-600 ml-2">{step.durationMs}ms</span>
                          </div>
                        </div>
                      );
                    })}
                    {/* Artifacts */}
                    {(session.artifacts?.length ?? 0) > 0 && (
                      <div className="pt-2 border-t border-border-primary mt-2">
                        <div className="text-[10px] font-black text-text-tertiary uppercase mb-1">Artifacts</div>
                        {session.artifacts.map(a => (
                          <div key={a.id} className="text-[9px] text-text-tertiary flex gap-1.5">
                            <span className="text-cyan-400 font-bold">{a.type}</span>
                            {a.path && <span>{a.path.split('/').pop()}</span>}
                            {a.content && <span className="truncate max-w-[200px]">{(a.content as string).slice(0, 80)}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
