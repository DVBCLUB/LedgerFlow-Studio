import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Sparkles,
  Layers,
  History,
  UserCheck,
  Check,
  X,
  RefreshCw,
  Eye,
  Clock,
  Coins,
  ShieldAlert,
  Flame,
  FileCheck,
} from 'lucide-react';

export default function AdvancedDelegationMatrixPanel() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'ledger' | 'approvals' | 'consensus' | 'raci' | 'invariants'>('rbac');

  // State for RBAC & Roles
  const [roles, setRoles] = useState<any[]>([]);
  const [healthScores, setHealthScores] = useState<any[]>([]);

  // State for Action Ledger
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [isChainValid, setIsChainValid] = useState<boolean>(true);
  const [onlyViolations, setOnlyViolations] = useState<boolean>(false);

  // State for Human Approvals
  const [approvals, setApprovals] = useState<any[]>([]);
  const [approvalComment, setApprovalComment] = useState<string>('');

  // State for Consensus Arbitrator
  const [testTopic, setTestTopic] = useState('Xung đột: Vá lỗi nóng (Hotfix 5 phút) vs Tái cấu trúc (Refactor 3 ngày)');
  const [arbitrationResult, setArbitrationResult] = useState<any | null>(null);
  const [consensusLoading, setConsensusLoading] = useState(false);

  // State for RACI & Invariants
  const [raciMatrix, setRaciMatrix] = useState<any[]>([]);
  const [invariants, setInvariants] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, healthRes, ledgerRes, approvalsRes, raciRes, invariantsRes] = await Promise.all([
        fetch('/api/delegation/rbac/matrix').then((r) => r.json()),
        fetch('/api/delegation/health/scores').then((r) => r.json()),
        fetch(`/api/delegation/action-ledger?onlyViolations=${onlyViolations}&limit=30`).then((r) => r.json()),
        fetch('/api/delegation/approvals').then((r) => r.json()),
        fetch('/api/delegation/raci/matrix').then((r) => r.json()),
        fetch('/api/delegation/constitutional/invariants').then((r) => r.json()),
      ]);

      if (rolesRes.success) setRoles(rolesRes.roles);
      if (healthRes.success) setHealthScores(healthRes.scores);
      if (ledgerRes.success) {
        setLedgerEntries(ledgerRes.entries || []);
        setIsChainValid(ledgerRes.isChainValid !== false);
      }
      if (approvalsRes.success) setApprovals(approvalsRes.requests || []);
      if (raciRes.success) setRaciMatrix(raciRes.raci || []);
      if (invariantsRes.success) setInvariants(invariantsRes.invariants || []);
    } catch (err) {
      console.error('[Delegation] Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, [onlyViolations]);

  useEffect(() => {
    void loadAllData();
  }, [loadAllData]);

  const handleRunConsensus = async () => {
    setConsensusLoading(true);
    try {
      const proposals = [
        {
          proposalId: 'prop_atomic_patch',
          proposedByAgentId: 'devops_ai',
          title: 'Phương án 1: Bản Vá Lỗi Nguyên Tử (Atomic Hotfix)',
          description: 'Sửa đúng 2 hàm gây lỗi, chạy test 100% Green và đóng gói ngay cho khách hàng.',
          approachType: 'HOTFIX',
          safetyScore: 92,
          speedScore: 96,
          sustainabilityScore: 82,
        },
        {
          proposalId: 'prop_full_refactor',
          proposedByAgentId: 'architect_ai',
          title: 'Phương án 2: Tái Cấu Trúc Toàn Diện (Full Refactor)',
          description: 'Viết lại toàn bộ kiến trúc database và state management để đạt độ hoàn hảo tối đa.',
          approachType: 'REFACTOR',
          safetyScore: 93,
          speedScore: 50,
          sustainabilityScore: 96,
        },
      ];

      const res = await fetch('/api/delegation/consensus/arbitrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: testTopic, proposals }),
      }).then((r) => r.json());

      if (res.success) {
        setArbitrationResult(res.result);
        void loadAllData();
      }
    } finally {
      setConsensusLoading(false);
    }
  };

  const handleResolveApproval = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/delegation/approval/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          decision,
          reviewer: 'Solo Founder (CEO)',
          comment: approvalComment || (decision === 'APPROVED' ? 'Đã duyệt qua Gateway' : 'Từ chối bởi Solo Founder'),
        }),
      }).then((r) => r.json());

      if (res.success) {
        setApprovalComment('');
        void loadAllData();
      }
    } catch (err) {
      console.error('[Approval] Resolve error:', err);
    }
  };

  const handleRestoreQuarantine = async (roleId: string) => {
    try {
      const res = await fetch('/api/delegation/quarantine/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      }).then((r) => r.json());
      if (res.success) void loadAllData();
    } catch (err) {
      console.error('[Delegation] Restore error:', err);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-500/40 shadow-inner">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Quản Trị Phân Quyền &amp; Giải Quyết Xung Đột Đa AI</h2>
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-300 border border-indigo-500/30">
                EU AI Act &amp; DeepMind Standards
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Phân định ranh giới IAM, Sổ cái hành động bất biến SHA-256, Cổng duyệt người (Human Gate), Trọng tài Deadlock và Hiến pháp AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadAllData()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Zero-Trust Active
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-primary pb-3">
        {[
          { id: 'rbac', label: '🛡️ IAM Least-Privilege & Roles', icon: Layers },
          { id: 'ledger', label: '📜 Sổ Cái Hành Động (Action Ledger)', icon: History },
          { id: 'approvals', label: '🛂 Cổng Duyệt Solo Founder', icon: UserCheck, count: approvals.filter((a) => a.status === 'PENDING').length },
          { id: 'consensus', label: '⚖️ Trọng Tài & Deadlock Escrow', icon: Scale },
          { id: 'raci', label: '📊 Ma Trận RACI & Sức Khỏe SLO', icon: FileCheck },
          { id: 'invariants', label: '📜 Hiến Pháp AI (Invariants)', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-black transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-border-primary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span className="rounded-full bg-rose-500 px-1.5 py-0.2 text-[10px] font-black text-white">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: IAM Least-Privilege & Roles */}
      {activeTab === 'rbac' && (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const health = healthScores.find((h) => h.roleId === role.roleId);
              return (
                <div
                  key={role.roleId}
                  className={`rounded-2xl border p-4 space-y-3 transition ${
                    role.quarantineStatus === 'QUARANTINED'
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-border-primary bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl text-xs font-black ${
                          role.authorityLevel === 'RELEASE_GATEKEEPER'
                            ? 'bg-purple-500/20 text-purple-300'
                            : role.authorityLevel === 'VALIDATOR_JUDGE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : role.authorityLevel === 'DRAFT_CREATOR'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {role.authorityLevel}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{role.roleName}</h4>
                        <span className="text-[10px] text-slate-400">
                          Ngân sách ngày: ${role.currentDailySpendUsd?.toFixed(2) || '0.00'} / ${role.maxDailyTokenAllowanceUsd}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {health && (
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-black text-indigo-300 border border-indigo-500/20">
                          SLO: {health.healthScore}/100
                        </span>
                      )}
                      <span
                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                          role.quarantineStatus === 'HEALTHY'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : role.quarantineStatus === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {role.quarantineStatus}
                      </span>
                      {role.quarantineStatus === 'QUARANTINED' && (
                        <button
                          onClick={() => handleRestoreQuarantine(role.roleId)}
                          className="rounded bg-rose-600 px-2 py-0.5 text-[9px] font-bold text-white hover:bg-rose-500 cursor-pointer"
                        >
                          Khôi Phục
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Allowed vs Forbidden Domains */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-emerald-400">Được phép:</span>
                      {role.allowedDomains.map((d: string) => (
                        <span key={d} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/20">
                          ✓ {d}
                        </span>
                      ))}
                    </div>
                    {role.forbiddenDomains.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-rose-400">Bị cấm:</span>
                        {role.forbiddenDomains.map((d: string) => (
                          <span key={d} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] text-rose-300 border border-rose-500/20">
                            ✕ {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Immutable Action Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-primary bg-slate-900/60 p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isChainValid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  Tính Toàn Vẹn Chuỗi Cryptographic Hash: {isChainValid ? 'HỢP LỆ (100% Tamper-Proof)' : 'CẢNH BÁO: PHÁT HIỆN SỬA ĐỔI'}
                </h4>
                <p className="text-[11px] text-slate-400">Tuân thủ EU AI Act Article 13 &amp; OpenAI Seven Practices Action Ledger.</p>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyViolations}
                onChange={(e) => setOnlyViolations(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-500"
              />
              Chỉ hiện vi phạm ranh giới
            </label>
          </div>

          <div className="space-y-2">
            {ledgerEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-border-primary">
                Chưa có nhật ký hành động nào được ghi nhận.
              </div>
            ) : (
              ledgerEntries.map((entry) => (
                <div
                  key={entry.entryId}
                  className={`rounded-xl border p-3 text-xs space-y-1.5 transition ${
                    !entry.permissionCheckPassed || !entry.constitutionalRulePassed
                      ? 'border-rose-500/40 bg-rose-950/20'
                      : 'border-border-secondary bg-slate-950/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">{entry.timestamp?.substring(11, 19)}</span>
                      <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-black text-indigo-300">
                        {entry.roleId}
                      </span>
                      <span className="font-bold text-white">{entry.actionType}</span>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400">
                      Hash: {entry.integrityHash?.substring(0, 12)}...
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">{entry.outputSummary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Human Approval Gateway */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-primary bg-slate-900/60 p-4">
            <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-purple-400" /> Cổng Phê Duyệt Hành Động Nguy Hiểm (Human-in-the-loop Gate)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chuẩn Singapore AI Framework 2026: Các hành động phát hành bản build, sửa sổ cái hoặc chạy lệnh hệ điều hành bắt buộc phải có Solo Founder duyệt.
            </p>
          </div>

          <div className="space-y-3">
            {approvals.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-border-primary">
                Không có yêu cầu phê duyệt nào đang chờ.
              </div>
            ) : (
              approvals.map((req) => (
                <div
                  key={req.requestId}
                  className={`rounded-2xl border p-4 space-y-3 ${
                    req.status === 'PENDING'
                      ? 'border-amber-500/40 bg-amber-950/15'
                      : req.status === 'APPROVED'
                      ? 'border-emerald-500/30 bg-emerald-950/10'
                      : 'border-rose-500/30 bg-rose-950/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[9px] font-black text-rose-300">
                          {req.riskLevel}
                        </span>
                        <h4 className="text-xs font-black text-white">{req.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{req.description}</p>
                    </div>

                    <span
                      className={`rounded px-2.5 py-1 text-xs font-black ${
                        req.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : req.status === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border-secondary">
                      <input
                        type="text"
                        placeholder="Ghi chú phản hồi của CEO..."
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        className="flex-1 rounded-xl border border-border-primary bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        onClick={() => handleResolveApproval(req.requestId, 'APPROVED')}
                        className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Duyệt
                      </button>
                      <button
                        onClick={() => handleResolveApproval(req.requestId, 'REJECTED')}
                        className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-black text-white hover:bg-rose-500 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Consensus & Deadlock Escrow */}
      {activeTab === 'consensus' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-400" /> Trọng Tài Đa AI &amp; Deadlock Escrow (DeepMind CORAL)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Khi 2 AI bằng điểm (Tie Score), cơ chế Deadlock Escrow sẽ kích hoạt Tiêu Chuẩn An Toàn Cao Nhất (Conservative Default).
              </p>
            </div>

            <button
              onClick={handleRunConsensus}
              disabled={consensusLoading}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white hover:bg-amber-500 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" /> {consensusLoading ? 'Đang phân xử...' : 'Chạy Trọng Tài Phân Xử'}
            </button>
          </div>

          {arbitrationResult && (
            <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-black text-amber-300">
                    🏆 Phương Án Thắng: {arbitrationResult.winnerTitle}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">{arbitrationResult.resolutionSummary}</p>
                </div>
                <span className="rounded bg-emerald-500/20 px-3 py-1 text-xs font-black text-emerald-300">
                  Điểm Tổng Hợp: {arbitrationResult.compositeScore}/100
                </span>
              </div>

              {/* 3 Judge votes breakdown */}
              <div className="grid md:grid-cols-3 gap-3">
                {arbitrationResult.judgeVotes.map((j: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-border-secondary bg-slate-900 p-3 space-y-1.5">
                    <span className="text-xs font-black text-cyan-300 block">{j.judgeName}</span>
                    <p className="text-[11px] text-slate-300 italic">"{j.rationale}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: RACI & Health Scores */}
      {activeTab === 'raci' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-primary bg-slate-900/60 p-4">
            <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-cyan-400" /> Ma Trận Phân Định Trách Nhiệm RACI (AI Governance Standard)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              R (Responsible): Thực thi | A (Accountable): Chịu trách nhiệm cuối (CEO) | C (Consulted): Tham vấn | I (Informed): Nhận thông báo.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-primary bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border-primary bg-slate-900/80 text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="p-3">Hạng Mục</th>
                  <th className="p-3">Nhiệm Vụ</th>
                  <th className="p-3 text-emerald-400">R (Responsible)</th>
                  <th className="p-3 text-purple-400">A (Accountable)</th>
                  <th className="p-3 text-amber-400">C (Consulted)</th>
                  <th className="p-3 text-cyan-400">I (Informed)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-secondary text-[11px]">
                {raciMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-3 font-bold text-slate-300">{row.workflowCategory}</td>
                    <td className="p-3 text-white font-medium">{row.taskName}</td>
                    <td className="p-3 text-emerald-300">{row.responsible}</td>
                    <td className="p-3 font-bold text-purple-300">{row.accountable}</td>
                    <td className="p-3 text-amber-300">{row.consulted}</td>
                    <td className="p-3 text-cyan-300">{row.informed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Constitutional Invariants */}
      {activeTab === 'invariants' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border-primary bg-slate-900/60 p-4">
            <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
              <Lock className="h-4 w-4 text-rose-400" /> Tầng Hiến Pháp AI Bất Khả Vi Phạm (Anthropic Constitutional AI)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Các quy tắc tối thượng chặn đứng mọi hành động nguy hiểm ngay ở tầng lõi mà không AI hay lệnh nào có thể bypass.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {invariants.map((inv) => (
              <div key={inv.id} className="rounded-2xl border border-border-primary bg-slate-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[9px] font-black text-rose-300">
                    {inv.id}
                  </span>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black text-emerald-300">
                    STRICT ENFORCED
                  </span>
                </div>
                <h4 className="text-xs font-black text-white">{inv.title}</h4>
                <p className="text-[11px] text-slate-300">{inv.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
