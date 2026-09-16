import React, { useState, useEffect, useCallback } from 'react';
import { listHITLApprovalRequests, respondToHITLApproval, type ApprovalRequest } from '../../utils/hitlApprovalApi';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalDecision = 'approved' | 'rejected';
type ApprovalRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface HITLApprovalItem {
  id: string;
  title: string;
  description: string;
  requestedBy: string;  // AI agent name
  riskLevel: ApprovalRiskLevel;
  targetResource?: string;  // file, deal, invoice, etc.
  previewContent?: string;
  proposedAction: string;
  requiresContext?: string;
  requestedAt: string;
  expiresAt?: string;
  status: ApprovalStatus;
  workspaceModule: string;
  tags: string[];
}

function toInboxItem(request: ApprovalRequest): HITLApprovalItem {
  const proposedChanges = JSON.stringify(request.proposedChanges || {}, null, 2);
  return {
    id: request.requestId,
    title: request.title,
    description: request.description,
    requestedBy: request.requesterRoleId || request.requesterAgentId,
    riskLevel: request.riskLevel,
    targetResource: request.actionType,
    previewContent: proposedChanges === '{}' ? undefined : proposedChanges,
    proposedAction: request.actionType,
    requestedAt: request.createdAt,
    expiresAt: request.expiresAt,
    status: request.status.toLowerCase() as ApprovalStatus,
    workspaceModule: request.domain,
    tags: [request.domain, request.actionType].filter(Boolean),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60000) return 'vừa xong';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
  return `${Math.floor(diff / 3600000)} giờ trước`;
}

function timeLeft(isoStr?: string): string | null {
  if (!isoStr) return null;
  const diff = new Date(isoStr).getTime() - Date.now();
  if (diff <= 0) return 'Đã hết hạn';
  if (diff < 60000) return `< 1 phút`;
  return `${Math.floor(diff / 60000)} phút`;
}

const RISK_CONFIG: Record<ApprovalRiskLevel, { color: string; bg: string; border: string; label: string }> = {
  LOW: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Thấp' },
  MEDIUM: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'Trung bình' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'Cao' },
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Nguy hiểm' },
};

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({
  item,
  onDecide,
}: {
  item: HITLApprovalItem;
  onDecide: (id: string, decision: ApprovalDecision, note?: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [confirming, setConfirming] = useState<'approve' | 'reject' | null>(null);
  const riskCfg = RISK_CONFIG[item.riskLevel];
  const remaining = timeLeft(item.expiresAt);
  const isExpired = remaining === 'Đã hết hạn';

  return (
    <div
      className={`rounded-2xl border bg-white/3 transition-all ${
        item.status === 'pending' && !isExpired
          ? 'border-white/10 hover:border-white/15'
          : 'border-white/5 opacity-60'
      }`}
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'pending' && !isExpired ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-200 leading-tight">{item.title}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${riskCfg.bg} ${riskCfg.color} border ${riskCfg.border}`}>
              {riskCfg.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-1.5 items-center">
            <span className="text-xs text-slate-500">{item.requestedBy}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-600">{item.workspaceModule}</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs text-slate-600">{timeAgo(item.requestedAt)}</span>
            {remaining && (
              <>
                <span className="text-slate-700">·</span>
                <span className={`text-xs ${isExpired ? 'text-red-400' : 'text-amber-500'}`}>
                  ⏱ {remaining}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {item.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-slate-600">#{tag}</span>
            ))}
          </div>
        </div>
        <span className="text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>

          {item.previewContent && (
            <div className="rounded-xl bg-slate-900 border border-white/8 p-3">
              <p className="text-[10px] text-slate-600 mb-2">📋 Preview / Diff</p>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">{item.previewContent}</pre>
            </div>
          )}

          <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/20">
            <p className="text-[10px] text-violet-400 mb-1">⚡ Hành động đề xuất</p>
            <p className="text-xs text-violet-300">{item.proposedAction}</p>
          </div>

          {item.requiresContext && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20">
              <p className="text-[10px] text-amber-400 mb-1">💡 Lưu ý</p>
              <p className="text-xs text-amber-300">{item.requiresContext}</p>
            </div>
          )}

          {item.status === 'pending' && !isExpired && (
            <>
              {confirming === 'reject' && (
                <textarea
                  value={rejectionNote}
                  onChange={e => setRejectionNote(e.target.value)}
                  placeholder="Lý do từ chối (tùy chọn)..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-rose-500/20 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-rose-500/40 resize-none h-16"
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirming === 'approve') {
                      onDecide(item.id, 'approved');
                      setConfirming(null);
                    } else {
                      setConfirming('approve');
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                    confirming === 'approve'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                      : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {confirming === 'approve' ? '✅ Xác nhận Duyệt' : '✅ Duyệt'}
                </button>
                <button
                  onClick={() => {
                    if (confirming === 'reject') {
                      onDecide(item.id, 'rejected', rejectionNote);
                      setConfirming(null);
                    } else {
                      setConfirming('reject');
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                    confirming === 'reject'
                      ? 'bg-rose-500 text-white hover:bg-rose-400'
                      : 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                  }`}
                >
                  {confirming === 'reject' ? '❌ Xác nhận Từ chối' : '❌ Từ chối'}
                </button>
                {confirming && (
                  <button
                    onClick={() => setConfirming(null)}
                    className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-500 hover:bg-white/10"
                  >
                    Huỷ
                  </button>
                )}
              </div>
            </>
          )}

          {item.status !== 'pending' && (
            <div className={`p-2.5 rounded-xl text-xs font-semibold ${item.status === 'approved' ? 'bg-emerald-900/20 text-emerald-400' : 'bg-rose-900/20 text-rose-400'}`}>
              {item.status === 'approved' ? '✅ Đã duyệt' : '❌ Đã từ chối'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HITLApprovalInboxPanel() {
  const [approvals, setApprovals] = useState<HITLApprovalItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      setApprovals((await listHITLApprovalRequests()).map(toInboxItem));
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Không thể tải Approval Inbox.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleDecide = useCallback(async (id: string, decision: ApprovalDecision, note?: string) => {
    setLoading(true);
    try {
      await respondToHITLApproval(id, decision === 'approved' ? 'APPROVED' : 'REJECTED', note || '');
      await fetchApprovals();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu quyết định.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredApprovals = approvals.filter(a => filter === 'all' || a.status === filter);

  return (
    <div className="bg-[#09090b] min-h-screen text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">✋</div>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-white">HITL Approval Inbox</h1>
            <p className="text-xs text-slate-500">AI Agents cần CEO duyệt quyết định quan trọng</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
            onClick={() => {
              approvals.filter(a => a.status === 'pending' && a.riskLevel === 'LOW').forEach(a => handleDecide(a.id, 'approved'));
            }}
          >
            ✅ Duyệt tất cả LOW
          </button>
          <button onClick={fetchApprovals} disabled={loading} className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition disabled:opacity-50">
            {loading ? '⏳' : '🔄'}
          </button>
        </div>
      </div>

      {error && <div className="mb-5 rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs font-semibold text-rose-200">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[
          { label: 'Chờ duyệt', value: approvals.filter(a => a.status === 'pending').length, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Đã duyệt', value: approvals.filter(a => a.status === 'approved').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Từ chối', value: approvals.filter(a => a.status === 'rejected').length, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Rủi ro cao', value: approvals.filter(a => ['HIGH', 'CRITICAL'].includes(a.riskLevel) && a.status === 'pending').length, color: 'text-red-400', bg: 'bg-red-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`p-3 rounded-xl border border-white/8 ${bg} text-center`}>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-5">
        {[
          { id: 'pending', label: `⏳ Chờ duyệt (${approvals.filter(a => a.status === 'pending').length})` },
          { id: 'approved', label: '✅ Đã duyệt' },
          { id: 'rejected', label: '❌ Từ chối' },
          { id: 'all', label: '📋 Tất cả' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === tab.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Approval list */}
      <div className="space-y-3">
        {filteredApprovals.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-sm font-medium">Không có approval nào cần xử lý!</p>
            <p className="text-xs mt-1">AI agents đang vận hành trơn tru</p>
          </div>
        ) : (
          filteredApprovals.map(item => (
            <ApprovalCard key={item.id} item={item} onDecide={handleDecide} />
          ))
        )}
      </div>
    </div>
  );
}
