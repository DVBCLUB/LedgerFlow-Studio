import React, { useState, useEffect } from 'react';
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
        <p>Đang triệu tập Hội đồng Biểu quyết Đa Tác tử (Multi-Agent BFT Consensus)...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20">
              PILLAR 114 — BFT AGENT CONSENSUS PROTOCOL
            </span>
            <span className="text-xs text-slate-400 font-mono">Consensus Score: {overview?.consensusHealthScorePercent}%</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Multi-Agent Consensus &amp; Democratic Swarm Voting</h1>
          <p className="text-sm text-slate-400">
            Cơ chế biểu quyết dân chủ phân tán (BFT Consensus) giữa các Agent chuyên môn (CPTO, CFO, Legal, Security, Risk) cho các quyết sách doanh nghiệp.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            value={proposalTitle}
            onChange={(e) => setProposalTitle(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="production_release">Production Release</option>
            <option value="treasury_allocation">Treasury Allocation</option>
            <option value="pricing_change">Pricing Change</option>
            <option value="security_quarantine">Security Quarantine</option>
          </select>
          <button
            onClick={handleSubmit}
            disabled={voting}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-lg shadow-lg whitespace-nowrap disabled:opacity-50"
          >
            {voting ? 'Đang biểu quyết...' : '🗳️ Bỏ Phiếu Hội Đồng AI'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Tổng Đề Xuất Đã Xử Lý</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{overview?.totalProposalsCount}</div>
          <div className="text-xs text-emerald-500/80 mt-1 font-mono">100% Passed Quorum</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Độ Đồng Thuận Trung Bình</div>
          <div className="text-2xl font-extrabold text-teal-300 mt-1">{overview?.consensusHealthScorePercent}%</div>
          <div className="text-xs text-slate-400 mt-1">Zero Byzantine Faults</div>
        </div>
        <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl">
          <div className="text-xs text-slate-400 font-medium">Hội Đồng AI Chuyên Môn</div>
          <div className="text-sm font-bold text-white mt-2">CPTO + CFO + Legal + Security + Risk</div>
          <div className="text-xs text-emerald-400 mt-1 font-mono">Weighted Multi-Vote Protocol</div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-4">
        {overview?.proposals.map((p: GovernanceProposal) => (
          <div key={p.proposalId} className="p-5 bg-slate-800/40 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <span className="px-2 py-0.5 bg-violet-500/20 text-violet-300 text-xs font-mono rounded uppercase mr-2">{p.category.replace(/_/g, ' ')}</span>
                <span className="text-base font-bold text-white">{p.title}</span>
                <div className="text-xs text-slate-400 mt-1">Đề xuất bởi: {p.proposedBy} • Tạo lúc: {new Date(p.createdAt).toLocaleString('vi-VN')}</div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full uppercase">
                  {p.status} ({p.currentApprovalPercent}% / {p.requiredQuorumPercent}%)
                </span>
              </div>
            </div>

            {/* Votes breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              {p.votes.map((v: AgentVoteRecord, idx: number) => (
                <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-400">{v.agentRole} ({v.agentName})</span>
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] rounded font-mono font-bold">
                      {v.voteDecision.toUpperCase()} • {v.weight}% weight
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 italic">"{v.reasoning}"</p>
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
