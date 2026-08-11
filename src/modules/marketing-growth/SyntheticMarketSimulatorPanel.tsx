import React, { useState } from 'react';
import { Users, BarChart3, TrendingUp, AlertTriangle, Sparkles, Play, CheckCircle } from 'lucide-react';

export interface SyntheticPersonaUI {
  id: string;
  role: string;
  name: string;
  industry: string;
  primaryNeed: string;
  npsScore: number;
  usabilityScore: number;
  feedbackText: string;
}

export interface SyntheticReportUI {
  id: string;
  productModule: string;
  sampleSize: number;
  syntheticNPS: number;
  avgUsabilityScore: number;
  churnRiskPercent: number;
  personas: SyntheticPersonaUI[];
  discoveredUXGaps: string[];
  autoBacklogTasks: Array<{ id: string; title: string; priority: string; suggestedRole: string }>;
}

export default function SyntheticMarketSimulatorPanel() {
  const [moduleInput, setModuleInput] = useState('MCP Gateway & Swarm Agent Suite');
  const [sampleSizeInput, setSampleSizeInput] = useState(500);
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<SyntheticReportUI | null>({
    id: 'sim_demo_2026',
    productModule: 'MCP Gateway & Swarm Agent Suite',
    sampleSize: 500,
    syntheticNPS: +68,
    avgUsabilityScore: 8.7,
    churnRiskPercent: 4.2,
    personas: [
      { id: 'p1', role: 'enterprise_cfo', name: 'Trần Văn Minh', industry: 'Sản xuất & Thương mại', primaryNeed: 'Dòng tiền & VAS Compliance', npsScore: 75, usabilityScore: 8.9, feedbackText: 'Báo cáo mô phỏng bản sao số rất ấn tượng, hỗ trợ kiểm soát ngân sách LLM.' },
      { id: 'p2', role: 'product_manager', name: 'Lê Thu Trang', industry: 'SaaS / Studio', primaryNeed: 'Tự động hóa Backlog', npsScore: 80, usabilityScore: 9.2, feedbackText: 'Chuẩn MCP giúp kết nối nhanh với Cursor và Claude Desktop.' },
      { id: 'p3', role: 'startup_founder', name: 'Phạm Hoàng Nam', industry: 'AI Workbench', primaryNeed: 'Tự vận hành 100%', npsScore: 65, usabilityScore: 8.1, feedbackText: 'Giao diện mượt, tính năng AI Boardroom mô phỏng rất hữu ích.' },
    ],
    discoveredUXGaps: [
      'Cần bổ sung nút thao tác 1-click để kết nối nhanh MCP Server bên ngoài',
      'Cần xuất báo cáo mô phỏng dưới dạng PDF cho Hội đồng Quản trị',
    ],
    autoBacklogTasks: [
      { id: 't1', title: 'Tự động tạo Draft PR khi CI Doctor phát hiện lỗi', priority: 'high', suggestedRole: 'code' },
      { id: 't2', title: 'Hỗ trợ local LLM (Ollama DeepSeek R1) chế độ offline', priority: 'medium', suggestedRole: 'planner' },
    ],
  });

  const handleRunSimulation = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/simulation/synthetic-feedback/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productModule: moduleInput, sampleSize: sampleSizeInput }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch {
      // Keep demo report on fallback
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Synthetic ICP Market Simulator
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                LedgerFlow Horizon 4
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Users className="w-7 h-7 text-emerald-400" />
              Mô phỏng Khách hàng Giả lập (Synthetic Customer Simulator)
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Mô phỏng 100–1,000 Chân dung Khách hàng Giả lập (Synthetic ICP Personas). Dự báo chỉ số NPS, điểm khả dụng Usability, rủi ro Churn và tự động sinh Backlog nhiệm vụ.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isRunning ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Đang mô phỏng...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Chạy Mô phỏng Thị trường
              </>
            )}
          </button>
        </div>

        {/* Configurations */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Tên Module/Sản phẩm Mô phỏng:</label>
            <input
              type="text"
              value={moduleInput}
              onChange={(e) => setModuleInput(e.target.value)}
              className="mt-1 w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Quy mô Mẫu Khách hàng Giả lập:</label>
            <input
              type="number"
              value={sampleSizeInput}
              onChange={(e) => setSampleSizeInput(Number(e.target.value))}
              className="mt-1 w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              min={50}
              max={1000}
            />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-400">Synthetic Net Promoter Score (NPS)</span>
            <div className="text-2xl font-bold text-emerald-400">+{report.syntheticNPS}</div>
            <span className="text-[11px] text-emerald-500 font-medium">Xuất sắc (Tăng trưởng cao)</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-400">Điểm Dễ sử dụng (Usability)</span>
            <div className="text-2xl font-bold text-indigo-400">{report.avgUsabilityScore} / 10</div>
            <span className="text-[11px] text-indigo-400 font-medium">Trải nghiệm UX mượt mà</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-400">Rủi ro Mất Khách hàng (Churn Risk)</span>
            <div className="text-2xl font-bold text-cyan-400">{report.churnRiskPercent}%</div>
            <span className="text-[11px] text-cyan-400 font-medium">Ở mức an toàn thấp</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-400">Tổng Mẫu Mô phỏng</span>
            <div className="text-2xl font-bold text-slate-100">{report.sampleSize} Personas</div>
            <span className="text-[11px] text-slate-400 font-medium">4 Chân dung ICP chính</span>
          </div>
        </div>
      )}

      {/* Feedback & Backlog Details */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personas Feedback */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              Ý kiến Đánh giá đại diện ICP ({report.personas.length})
            </h3>
            <div className="space-y-3">
              {report.personas.map((p) => (
                <div key={p.id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">{p.name} ({p.role})</span>
                    <span className="text-[11px] font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800/40">
                      NPS: +{p.npsScore}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Ngành: {p.industry} | Nhu cầu: {p.primaryNeed}</div>
                  <p className="text-xs text-slate-200 italic">"{p.feedbackText}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Auto-Generated Backlog Tasks */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Auto Backlog Tasks Tự động Sinh ({report.autoBacklogTasks.length})
            </h3>
            <div className="space-y-3">
              {report.autoBacklogTasks.map((t) => (
                <div key={t.id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{t.title}</span>
                    <span className="text-[10px] font-medium text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800/40 uppercase">
                      {t.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Gợi ý phân công: Agent Role ({t.suggestedRole})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
