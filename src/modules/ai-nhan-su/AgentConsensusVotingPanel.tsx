import React, { useState, useEffect } from 'react';
import { Vote, Users, ShieldCheck, CheckCircle2, Award, Zap, Layers } from 'lucide-react';
import { AgentConsensusOverview, GovernanceProposal, AgentVoteRecord } from '../../../server/services/agentConsensusVotingEngine';

export const AgentConsensusVotingPanel: React.FC = () => {
  const [overview, setOverview] = useState<AgentConsensusOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [voting, setVoting] = useState<boolean>(false);
  const [proposalTitle, setProposalTitle] = useState<string>('Triển khai gói tính năng AI Video 9:16 lên Production');
  const [category, setCategory] = useState<'treasury_allocation' | 'production_release' | 'pricing_change' | 'security_quarantine'>('production_release');

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/dormant/agent-consensus/overview');
      const data = await res.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch agent consensus overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSubmit = async () => {
    setVoting(true);
    try {
      const res = await fetch('/api/dormant/agent-consensus/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: proposalTitle, category })
      });
      const data = await res.json();
      if (data.success) {
        await fetchOverview();
      }
    } catch (err) {
      console.error('Failed to submit governance proposal', err);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mb-3"></div>
        <p>Đang triệu tập Hội đồng Cố vấn &amp; Biểu quyết Đội ngũ AI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-fade-in select-none">
      {/* Header Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Vote className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">Hội Đồng Cố Vấn &amp; Biểu Quyết Đồng Thuận AI</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Consensus Voting
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Cơ chế biểu quyết dân chủ và đánh giá đa chiều giữa các vị trí chủ chốt (Giám đốc Công nghệ, Giám đốc Tài chính, Pháp chế, Quản trị Rủi ro) cho các quyết sách quan trọng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Độ Đồng Thuận: {overview?.consensusHealthScorePercent}%
            </span>
          </div>
        </div>
      </section>

      {/* Action Propose Bar */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <input
          type="text"
          value={proposalTitle}
          onChange={(e) => setProposalTitle(e.target.value)}
          placeholder="Tiêu đề quyết sách cần biểu quyết..."
          className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as any)}
          className="px-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-2xl text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500 transition-colors"
        >
          <option value="production_release">Phát Hành Tính Năng</option>
          <option value="treasury_allocation">Phân Bổ Ngân Quỹ</option>
          <option value="pricing_change">Điều Chỉnh Giá</option>
          <option value="security_quarantine">Kiểm Soát Rủi Ro</option>
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={voting}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <Vote className="w-3.5 h-3.5" />
          <span>{voting ? 'Đang biểu quyết...' : '🗳️ Bỏ Phiếu Hội Đồng AI'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-slate-950 to-purple-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng Đề Xuất Đã Xử Lý</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-300 font-mono">{overview?.totalProposalsCount} Đề Xuất</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">100% Passed Quorum</p>
        </div>

        <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 to-teal-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Độ Đồng Thuận Trung Bình</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-300 font-mono">{overview?.consensusHealthScorePercent}%</div>
          <p className="mt-1 text-[11px] font-medium text-slate-400">Zero Byzantine Faults</p>
        </div>

        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hội Đồng AI Chuyên Môn</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-base font-black text-indigo-300">CPTO + CFO + Legal + Sec + Risk</div>
          <p className="mt-1 text-[11px] font-medium text-emerald-400 font-mono">Weighted Multi-Vote Protocol</p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {overview?.proposals.map((p: GovernanceProposal) => (
          <div key={p.proposalId} className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-purple-500/30 font-mono">
                    {p.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-base font-black text-white">{p.title}</h3>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Đề xuất bởi: <strong className="text-slate-300">{p.proposedBy}</strong> · Tạo lúc: {new Date(p.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="text-left md:text-right">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider rounded-full border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {p.status} ({p.currentApprovalPercent}% / {p.requiredQuorumPercent}%)
                </span>
              </div>
            </div>

            {/* Votes breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {p.votes.map((v: AgentVoteRecord, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-purple-300">{v.agentRole} ({v.agentName})</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded-lg font-mono font-black uppercase tracking-wider border border-emerald-500/30">
                      {v.voteDecision.toUpperCase()} · {v.weight}% weight
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic leading-relaxed">"{v.reasoning}"</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentConsensusVotingPanel;

