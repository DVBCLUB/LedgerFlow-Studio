import React, { useEffect, useState } from 'react';
import {
  Vote,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  RefreshCw,
  PlusCircle,
  FileCheck,
  TrendingUp,
  Cpu,
  Scale,
} from 'lucide-react';
import { formatMoneyVN } from '../../utils/excelFormatters';

export interface BoardMemberVerdict {
  agentRole: string;
  memberName: string;
  vote: 'APPROVE' | 'REJECT' | 'ABSTAIN';
  confidenceScore: number;
  keyRationale: string;
}

export interface StrategicProposal {
  proposalId: string;
  title: string;
  category: string;
  proposedBy: string;
  requestedAmountVnd?: number;
  description: string;
  status: 'PENDING_CONSENSUS' | 'CONSENSUS_REACHED' | 'REJECTED' | 'EXECUTED';
  verdicts: BoardMemberVerdict[];
  consensusScore: number;
  finalVerdict: 'APPROVED' | 'REJECTED' | 'NEEDS_HITL_FOUNDER';
  createdAt: string;
  decidedAt?: string;
}

export default function ConstitutionalConsensusBoardPanel() {
  const [proposals, setProposals] = useState<StrategicProposal[]>([]);
  const [selectedProp, setSelectedProp] = useState<StrategicProposal | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'CAPITAL_ALLOCATION' | 'PRODUCT_PRICING' | 'AI_PRIVILEGE_ELEVATION' | 'INFRA_SCALING'>('CAPITAL_ALLOCATION');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('25000000');

  const fetchProposals = async () => {
    try {
      const res = await fetch('/api/dormant/boardroom/proposals');
      const data = await res.json();
      if (data?.success && data?.proposals) {
        setProposals(data.proposals);
        if (!selectedProp && data.proposals.length > 0) {
          setSelectedProp(data.proposals[0]);
        }
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    try {
      await fetch('/api/dormant/boardroom/create-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          proposedBy: 'Founder / AI Operating Officer',
          description,
          requestedAmountVnd: Number(amount) || 0,
        }),
      });
      setShowNewModal(false);
      setTitle('');
      setDescription('');
      await fetchProposals();
    } catch {
      // ignore
    }
  };

  const handleExecute = async (proposalId: string) => {
    try {
      await fetch('/api/dormant/boardroom/execute-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });
      await fetchProposals();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-4 md:p-6 rounded-2xl bg-[#0e0e16] border border-white/8 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-white">⚖️ Multi-Agent Constitutional Boardroom &amp; Delphi Consensus</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              4 C-Level Agents
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hội đồng C-Level gồm 4 AI Agents (CEO, CFO, CTO, Compliance) biểu quyết độc lập dựa trên Hiến pháp công ty trước khi ra quyết định lớn.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>+ Đệ Trình Biểu Quyết Chiến Lược</span>
        </button>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {proposals.map((prop) => (
          <div
            key={prop.proposalId}
            onClick={() => setSelectedProp(prop)}
            className={`p-4 rounded-xl border transition cursor-pointer space-y-3 ${
              selectedProp?.proposalId === prop.proposalId
                ? 'bg-indigo-500/15 border-indigo-400/50 shadow-lg shadow-indigo-500/10'
                : 'bg-white/4 hover:bg-white/6 border-white/8'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-white/10 text-slate-300">
                  {prop.category}
                </span>
                <h4 className="text-xs font-bold text-white mt-1">{prop.title}</h4>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  prop.status === 'EXECUTED'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {prop.status === 'EXECUTED' ? 'ĐÃ THỰC THI' : 'ĐỒNG THUẬN CAO'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{prop.description}</p>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
              <span className="text-slate-400">Đồng thuận Hội đồng:</span>
              <strong className="text-emerald-400 font-bold">{prop.consensusScore}%</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Proposal Deep Dive with 4 Agent Votes */}
      {selectedProp && (
        <div className="p-5 rounded-xl bg-black/40 border border-white/8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/8">
            <div>
              <h3 className="text-sm font-bold text-white">{selectedProp.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Đề xuất bởi: {selectedProp.proposedBy} {selectedProp.requestedAmountVnd ? `• Ngân sách: ${formatMoneyVN(selectedProp.requestedAmountVnd, ' đ')}` : ''}
              </p>
            </div>

            {selectedProp.status !== 'EXECUTED' && (
              <button
                onClick={() => handleExecute(selectedProp.proposalId)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Thực Thi Nghị Quyết Hội Đồng (1-Click)</span>
              </button>
            )}
          </div>

          {/* 4 Agent Verdicts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedProp.verdicts.map((v, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white/4 border border-white/8 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">{v.memberName}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                    {v.vote} ({v.confidenceScore}%)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed italic">"{v.keyRationale}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Đệ trình Biểu quyết mới */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="w-full max-w-lg p-6 rounded-2xl bg-[#141420] border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Đệ Trình Đề Xuất Cho Hội Đồng AI Biểu Quyết</h3>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Tiêu đề quyết định</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Tăng giá gói Enterprise lên 1.5tr/tháng"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Danh mục</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                >
                  <option value="CAPITAL_ALLOCATION">Đầu tư vốn (CAPEX)</option>
                  <option value="PRODUCT_PRICING">Chính sách giá</option>
                  <option value="AI_PRIVILEGE_ELEVATION">Cấp quyền AI Agent</option>
                  <option value="INFRA_SCALING">Mở rộng Hạ tầng</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Số tiền (nếu có)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Nội dung chi tiết &amp; Rationale</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả lý do và dự phóng kết quả..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-xs text-white"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Bắt Đầu Biểu Quyết
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
