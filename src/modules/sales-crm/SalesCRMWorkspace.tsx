import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'demo_scheduled' | 'proposal_sent' | 'negotiating' | 'closed_won' | 'closed_lost';
type LeadPriority = 'HOT' | 'WARM' | 'COLD';

interface Lead {
  id: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  source: string;
  productInterest: string;
  budgetVnd: number;
  status: LeadStatus;
  priority: LeadPriority;
  score: number;
  assignedTo: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  notes: string;
  createdAt: string;
}

interface ProposalRecord {
  id: string;
  dealId: string;
  customerName: string;
  grandTotalVnd: number;
  status: string;
  validUntil: string;
  createdAt: string;
  markdownContent?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  {
    id: 'lead_001', fullName: 'Nguyễn Thị Lan', company: 'Công ty TNHH Xây Dựng Phú Thịnh',
    email: 'lan.nguyen@phuthinh.vn', phone: '0901 234 567', source: 'facebook',
    productInterest: 'LedgerFlow Enterprise', budgetVnd: 120_000_000, status: 'demo_scheduled',
    priority: 'HOT', score: 92, assignedTo: '🤖 AI Sales', lastContactedAt: '2026-08-21',
    nextFollowUpAt: '2026-08-24', notes: 'Quan tâm kế toán công trình, muốn demo tuần này',
    createdAt: '2026-08-18T10:00:00Z',
  },
  {
    id: 'lead_002', fullName: 'Trần Văn Hùng', company: 'Công ty CP Thương Mại Đông Á',
    email: 'hung.tran@dongacommerce.com', phone: '0912 345 678', source: 'tiktok',
    productInterest: 'LedgerFlow Professional', budgetVnd: 50_000_000, status: 'qualified',
    priority: 'WARM', score: 74, assignedTo: '🤖 AI Sales', lastContactedAt: '2026-08-20',
    nextFollowUpAt: '2026-08-23', notes: 'Cần giải pháp thay thế Excel cho kế toán',
    createdAt: '2026-08-17T14:00:00Z',
  },
  {
    id: 'lead_003', fullName: 'Lê Minh Tú', company: 'Startup FinTech Wealth App',
    email: 'tu.le@wealthapp.io', phone: '0978 654 321', source: 'linkedin',
    productInterest: 'AI Digital Factory', budgetVnd: 200_000_000, status: 'negotiating',
    priority: 'HOT', score: 88, assignedTo: '🤖 AI Sales', lastContactedAt: '2026-08-22',
    nextFollowUpAt: '2026-08-25', notes: 'Muốn tích hợp AI vào quy trình phát triển sản phẩm',
    createdAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'lead_004', fullName: 'Phạm Thu Hương', company: 'Trường THPT Dân Lập Sao Mai',
    email: 'phuong@saomaihs.edu.vn', phone: '0965 432 198', source: 'google',
    productInterest: 'LedgerFlow Starter', budgetVnd: 15_000_000, status: 'contacted',
    priority: 'COLD', score: 45, assignedTo: '🤖 AI Sales', lastContactedAt: '2026-08-19',
    nextFollowUpAt: '2026-08-28', notes: 'Cần phần mềm kế toán cho trường học',
    createdAt: '2026-08-16T11:30:00Z',
  },
  {
    id: 'lead_005', fullName: 'Võ Đức Thắng', company: 'Công ty TNHH Sản Xuất Thực Phẩm Việt',
    email: 'thang@vietfood.com.vn', phone: '0988 777 666', source: 'referral',
    productInterest: 'LedgerFlow Enterprise', budgetVnd: 180_000_000, status: 'proposal_sent',
    priority: 'HOT', score: 95, assignedTo: '🤖 AI Sales', lastContactedAt: '2026-08-22',
    nextFollowUpAt: '2026-08-24', notes: 'Nhà máy thực phẩm, cần kế toán sản xuất + kho',
    createdAt: '2026-08-14T08:00:00Z',
  },
];

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; order: number }> = {
  new:            { label: 'Mới', color: 'text-slate-400', bg: 'bg-slate-800/60', order: 0 },
  contacted:      { label: 'Đã liên hệ', color: 'text-blue-400', bg: 'bg-blue-950/60', order: 1 },
  qualified:      { label: 'Đủ điều kiện', color: 'text-cyan-400', bg: 'bg-cyan-950/60', order: 2 },
  demo_scheduled: { label: 'Demo đã lên lịch', color: 'text-violet-400', bg: 'bg-violet-950/60', order: 3 },
  proposal_sent:  { label: 'Đã gửi báo giá', color: 'text-amber-400', bg: 'bg-amber-950/60', order: 4 },
  negotiating:    { label: 'Đang đàm phán', color: 'text-orange-400', bg: 'bg-orange-950/60', order: 5 },
  closed_won:     { label: '🎉 Đã chốt', color: 'text-emerald-400', bg: 'bg-emerald-950/60', order: 6 },
  closed_lost:    { label: '❌ Thua', color: 'text-rose-400', bg: 'bg-rose-950/60', order: 7 },
};

const PRIORITY_BADGE: Record<LeadPriority, string> = {
  HOT: 'bg-red-500/20 text-red-400 border border-red-500/30',
  WARM: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  COLD: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

// ─── Lead Card Component ──────────────────────────────────────────────────────

function LeadCard({ lead, onSelect }: { lead: Lead; onSelect: (l: Lead) => void }) {
  return (
    <div
      onClick={() => onSelect(lead)}
      className="p-3 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 cursor-pointer transition-all hover:border-violet-500/30 group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-200 group-hover:text-white">{lead.fullName}</p>
          <p className="text-xs text-slate-500">{lead.company}</p>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${PRIORITY_BADGE[lead.priority]}`}>
          {lead.priority}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${lead.score}%`,
              background: lead.score >= 80 ? '#10b981' : lead.score >= 60 ? '#f59e0b' : '#6b7280',
            }}
          />
        </div>
        <span className="text-[10px] text-slate-500">{lead.score}/100</span>
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5">
        {(lead.budgetVnd / 1_000_000).toFixed(0)}M VND · {lead.source}
      </p>
    </div>
  );
}

// ─── Proposal Modal ───────────────────────────────────────────────────────────

function ProposalModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState<ProposalRecord | null>(null);
  const [copied, setCopied] = useState(false);

  const generateProposal = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dormant/sales/generate-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: lead.id,
          customerName: lead.fullName,
          customerEmail: lead.email,
          dealAmount: lead.budgetVnd,
          productInterest: lead.productInterest,
          notes: lead.notes,
          discountTier: lead.priority === 'HOT' ? 'startup' : 'standard',
        }),
      });
      const data = await res.json();
      if (data.success) setProposal(data.proposal);
    } finally {
      setLoading(false);
    }
  };

  const copyMarkdown = () => {
    if (proposal?.markdownContent) {
      navigator.clipboard.writeText(proposal.markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0e0e16] border border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div>
            <h3 className="text-base font-bold text-white">🤖 AI Proposal Generator</h3>
            <p className="text-xs text-slate-500">{lead.fullName} — {lead.company}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {!proposal ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-slate-300 mb-2 font-semibold">Sinh báo giá tự động</p>
              <p className="text-xs text-slate-500 mb-6">
                AI sẽ phân tích nhu cầu và tạo báo giá chuyên nghiệp bằng tiếng Việt,
                bao gồm chi tiết gói, điều khoản, và link thanh toán VietQR.
              </p>
              <div className="grid grid-cols-2 gap-3 text-left mb-6">
                {[
                  ['🎯 Sản phẩm quan tâm', lead.productInterest],
                  ['💰 Ngân sách', `${(lead.budgetVnd / 1_000_000).toFixed(0)}M VND`],
                  ['📊 Lead Score', `${lead.score}/100`],
                  ['🔥 Độ ưu tiên', lead.priority],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-white/3 border border-white/6">
                    <p className="text-[10px] text-slate-500">{k}</p>
                    <p className="text-sm text-slate-200 font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={generateProposal}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {loading ? '⏳ Đang sinh báo giá...' : '✨ Sinh báo giá ngay'}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-900/20 border border-emerald-500/20 mb-4">
                <span className="text-emerald-400 text-xl">✅</span>
                <div>
                  <p className="text-sm font-bold text-emerald-400">Báo giá đã được sinh thành công!</p>
                  <p className="text-xs text-emerald-600">
                    Tổng giá trị: <span className="font-bold text-emerald-400">{proposal.grandTotalVnd?.toLocaleString('vi-VN')} VND</span>
                    {' '}· Hiệu lực đến: {proposal.validUntil?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-900 border border-white/8 p-4 mb-4 overflow-y-auto max-h-64">
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {proposal.markdownContent}
                </pre>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyMarkdown}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-300 hover:bg-white/10 transition"
                >
                  {copied ? '✅ Đã copy!' : '📋 Copy Markdown'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition"
                >
                  ✈️ Gửi cho khách
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SalesCRMWorkspace() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LeadStatus | 'all'>('all');
  const [searchQ, setSearchQ] = useState('');

  const filteredLeads = leads.filter(l => {
    const matchStatus = activeFilter === 'all' || l.status === activeFilter;
    const q = searchQ.toLowerCase();
    const matchSearch = !q || l.fullName.toLowerCase().includes(q) || l.company.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'demo_scheduled', 'proposal_sent', 'negotiating', 'closed_won', 'closed_lost'];

  const totalPipelineVnd = leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).reduce((sum, l) => sum + l.budgetVnd, 0);
  const wonDeals = leads.filter(l => l.status === 'closed_won');
  const hotLeads = leads.filter(l => l.priority === 'HOT' && l.status !== 'closed_won' && l.status !== 'closed_lost');

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-white">💼 Sales & CRM</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI Sales Agent đang theo dõi và chăm sóc {leads.length} leads</p>
        </div>
        <button
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition"
          onClick={() => {
            const newLead: Lead = {
              id: `lead_${Date.now()}`, fullName: 'Lead mới', company: 'Công ty mới',
              email: 'lead@example.com', phone: '', source: 'manual', productInterest: 'LedgerFlow',
              budgetVnd: 50_000_000, status: 'new', priority: 'WARM', score: 50,
              assignedTo: '🤖 AI Sales', notes: '', createdAt: new Date().toISOString(),
            };
            setLeads(prev => [newLead, ...prev]);
          }}
        >
          + Thêm Lead
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Tổng Pipeline', value: `${(totalPipelineVnd / 1_000_000_000).toFixed(1)}B VND`, icon: '📊', color: 'from-violet-600/20 to-indigo-600/10' },
          { label: '🔥 Hot Leads', value: `${hotLeads.length} leads`, icon: '🔥', color: 'from-red-600/20 to-orange-600/10' },
          { label: 'Đã chốt thành công', value: `${wonDeals.length} deals`, icon: '🎉', color: 'from-emerald-600/20 to-teal-600/10' },
          { label: 'Tỷ lệ chuyển đổi', value: `${Math.round(wonDeals.length / leads.length * 100)}%`, icon: '📈', color: 'from-amber-600/20 to-yellow-600/10' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`p-4 rounded-2xl border border-white/8 bg-gradient-to-br ${color}`}>
            <p className="text-2xl mb-1">{icon}</p>
            <p className="text-lg font-black text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="🔍 Tìm lead, công ty..."
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 w-56"
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeFilter === 'all' ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            Tất cả ({leads.length})
          </button>
          {(['new', 'qualified', 'demo_scheduled', 'proposal_sent', 'closed_won'] as LeadStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeFilter === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              {STATUS_CONFIG[s].label} ({leads.filter(l => l.status === s).length})
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statuses.slice(0, 4).map(status => {
          const statusLeads = filteredLeads.filter(l => l.status === status);
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className={`rounded-2xl border border-white/8 ${cfg.bg} p-3`}>
              <div className={`flex items-center gap-2 mb-3`}>
                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="ml-auto text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{statusLeads.length}</span>
              </div>
              <div className="space-y-2">
                {statusLeads.map(lead => (
                  <LeadCard key={lead.id} lead={lead} onSelect={setSelectedLead} />
                ))}
                {statusLeads.length === 0 && (
                  <p className="text-xs text-slate-700 text-center py-4">Trống</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#0c0c14] border-l border-white/10 z-40 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/8">
            <div>
              <h3 className="font-bold text-white text-sm">{selectedLead.fullName}</h3>
              <p className="text-xs text-slate-500">{selectedLead.company}</p>
            </div>
            <button onClick={() => setSelectedLead(null)} className="text-slate-500 hover:text-white text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Priority + Score */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <p className="text-[10px] text-slate-500">Độ ưu tiên</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${PRIORITY_BADGE[selectedLead.priority]}`}>{selectedLead.priority}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/3 border border-white/8">
                <p className="text-[10px] text-slate-500">Lead Score</p>
                <p className="text-lg font-black text-white">{selectedLead.score}<span className="text-xs text-slate-500">/100</span></p>
              </div>
            </div>

            {/* Info */}
            {[
              ['📧 Email', selectedLead.email],
              ['📱 Điện thoại', selectedLead.phone],
              ['💰 Ngân sách', `${(selectedLead.budgetVnd / 1_000_000).toFixed(0)}M VND`],
              ['🎯 Quan tâm', selectedLead.productInterest],
              ['📱 Nguồn', selectedLead.source],
              ['🤖 Phụ trách', selectedLead.assignedTo],
              ['📅 Follow-up', selectedLead.nextFollowUpAt || 'Chưa đặt'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5 border-b border-white/5">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-xs text-slate-300 font-medium">{v}</span>
              </div>
            ))}

            {/* Notes */}
            <div className="p-3 rounded-xl bg-white/3 border border-white/8">
              <p className="text-[10px] text-slate-500 mb-1">📝 Ghi chú</p>
              <p className="text-xs text-slate-400 leading-relaxed">{selectedLead.notes || 'Chưa có ghi chú'}</p>
            </div>

            {/* Status Updater */}
            <div>
              <p className="text-[10px] text-slate-500 mb-2">Cập nhật trạng thái</p>
              <div className="grid grid-cols-2 gap-1.5">
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={async () => {
                      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: s } : l));
                      if (s === 'closed_won') {
                        try {
                          await fetch('/api/dormant/cross-dept/orchestrate-deal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              dealId: selectedLead.id,
                              customerName: selectedLead.fullName,
                              dealAmountVnd: selectedLead.budgetVnd,
                              contractType: selectedLead.productInterest,
                            }),
                          });
                        } catch {}
                      }
                    }}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition border ${selectedLead.status === s ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/3 border-white/8 text-slate-400 hover:bg-white/8'}`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-white/8 space-y-2">
            <button
              onClick={() => setShowProposalModal(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition"
            >
              ✨ Sinh báo giá AI
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition">
                📧 Gửi email
              </button>
              <button className="py-2 rounded-xl border border-white/10 bg-white/5 text-xs text-slate-400 hover:bg-white/10 transition">
                📱 Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Modal */}
      {showProposalModal && selectedLead && (
        <ProposalModal lead={selectedLead} onClose={() => setShowProposalModal(false)} />
      )}
    </div>
  );
}
