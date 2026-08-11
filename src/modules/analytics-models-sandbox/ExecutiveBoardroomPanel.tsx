import React, { useState } from 'react';
import { Building2, CheckCircle2, Play, Users, FileText, TrendingUp, ShieldAlert, Cpu } from 'lucide-react';

export interface BoardResolutionUI {
  id: string;
  title: string;
  category: string;
  proposedBy: string;
  rationale: string;
  votes: Record<string, string>;
  passed: boolean;
  actionItems: string[];
}

export interface BoardroomSessionUI {
  id: string;
  topic: string;
  startedAt: string;
  completedAt: string;
  status: string;
  executiveDebateSummary: string;
  resolutions: BoardResolutionUI[];
  boardMinutesMarkdown: string;
}

export default function ExecutiveBoardroomPanel() {
  const [topicInput, setTopicInput] = useState('Chiến lược Mở rộng Hệ điều hành Doanh nghiệp Công nghệ & MCP Gateway Q3');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSession, setCurrentSession] = useState<BoardroomSessionUI | null>({
    id: 'board_demo_2026',
    topic: 'Chiến lược Mở rộng Hệ điều hành Doanh nghiệp Công nghệ & MCP Gateway Q3',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
    executiveDebateSummary: 'Hội đồng Quản trị AI nhất trí thông qua kế hoạch tối ưu chi phí Swarm và mở rộng cổng giao tiếp MCP Standard.',
    resolutions: [
      {
        id: 'res_1',
        title: 'Triển khai Cổng giao tiếp chuẩn MCP (Model Context Protocol Gateway)',
        category: 'tech',
        proposedBy: 'AI CTO Agent',
        rationale: 'Kết nối trực tiếp hai chiều với Cursor, Claude Desktop và các MCP Server mở rộng bên ngoài.',
        votes: { CEO: 'yes', CFO: 'yes', CMO: 'yes', CTO: 'yes', VP_PRODUCT: 'yes' },
        passed: true,
        actionItems: ['Phát hành GET /api/mcp/sse endpoint', 'Tự động phát hiện MCP Tool Manifest'],
      },
      {
        id: 'res_2',
        title: 'Tối ưu Chi phí Swarm Agent qua Router Phân tầng LLM (Model Tiering)',
        category: 'finance',
        proposedBy: 'AI CFO Agent',
        rationale: 'Chuyển đổi các tác vụ phụ sang Model Micro để giảm 75% chi phí token API hàng tháng.',
        votes: { CEO: 'yes', CFO: 'yes', CMO: 'yes', CTO: 'yes', VP_PRODUCT: 'yes' },
        passed: true,
        actionItems: ['Phân tầng Tier 1/2/3 cho Swarm Agents', 'Ghi nhận token savings trong costObservability'],
      },
    ],
    boardMinutesMarkdown: `# 📜 Biên bản Họp Hội đồng Quản trị AI
**Mã phiên**: \`board_demo_2026\`  
**Chủ đề**: Chiến lược Mở rộng Hệ điều hành Doanh nghiệp Công nghệ & MCP Gateway Q3  

### Thành phần Tham dự:
- **CEO Agent**: Định hướng Tổng thể & Danh mục Sản phẩm (Trọng số biểu quyết: 2.0)
- **CFO Agent**: Quản trị Dòng tiền, Chi phí Token & Runway (Trọng số: 1.5)
- **CMO Agent**: Phễu Tăng trưởng & Tiếp thị Tự động (Trọng số: 1.0)
- **CTO Agent**: Kiến trúc Hệ thống, MCP Protocol & Release Gate (Trọng số: 1.5)
- **VP Product Agent**: Backlog Tính năng & Trải nghiệm Người dùng (Trọng số: 1.0)

### Nghị quyết được Thông qua:
1. **✅ Triển khai MCP Gateway Standard**: Đạt 100% đồng thuận.
2. **✅ Phân tầng Chi phí AI Swarm**: Đạt 100% đồng thuận.
`,
  });

  const handleRunBoardroom = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/simulation/boardroom/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setCurrentSession(data.session);
      }
    } catch {
      // Fallback update for simulation demo
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Autonomous Executive Council
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Digital Twin v3.0
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <Building2 className="w-7 h-7 text-indigo-400" />
              Hội đồng Quản trị AI (AI Executive Boardroom)
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl">
              Mô phỏng họp chiến lược tự động giữa các AI C-Suite Executives (CEO, CFO, CMO, CTO, VP Product). Phân tích chỉ số Bản sao số Doanh nghiệp, bỏ phiếu Nghị quyết và ban hành Biên bản cuộc họp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBoardroom}
              disabled={isSimulating}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  Đang họp Hội đồng...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  Kích hoạt Họp HĐQT AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Input Topic */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-3">
          <label className="text-xs font-medium text-slate-400 shrink-0">Chủ đề Cuộc họp:</label>
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="Nhập chủ đề cuộc họp chiến lược..."
          />
        </div>
      </div>

      {/* Active C-Suite Board Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {[
          { role: 'CEO', name: 'AI CEO Agent', focus: 'Tầm nhìn & Danh mục Sản phẩm', weight: '2.0x', color: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
          { role: 'CFO', name: 'AI CFO Agent', focus: 'Dòng tiền, Runway & Chi phí LLM', weight: '1.5x', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
          { role: 'CMO', name: 'AI CMO Agent', focus: 'Tăng trưởng & Phễu Tiếp thị', weight: '1.0x', color: 'border-rose-500/30 bg-rose-500/5 text-rose-300' },
          { role: 'CTO', name: 'AI CTO Agent', focus: 'Kiến trúc, MCP Protocol & Safety', weight: '1.5x', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
          { role: 'VP PRODUCT', name: 'AI Product Agent', focus: 'Backlog Tính năng & UX', weight: '1.0x', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
        ].map((m) => (
          <div key={m.role} className={`p-4 rounded-xl border ${m.color} space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">{m.role}</span>
              <span className="text-[10px] font-medium opacity-80 px-1.5 py-0.5 rounded bg-black/20">W: {m.weight}</span>
            </div>
            <div className="text-sm font-semibold text-slate-200">{m.name}</div>
            <div className="text-[11px] opacity-75 leading-tight">{m.focus}</div>
          </div>
        ))}
      </div>

      {/* Current Session Results */}
      {currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passed Resolutions */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Nghị quyết được HĐQT Thông qua ({currentSession.resolutions.length})
            </h3>
            <div className="space-y-3">
              {currentSession.resolutions.map((r) => (
                <div key={r.id} className="p-4 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{r.category}</span>
                    <span className="text-[11px] text-emerald-400 font-medium px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                      Đã thông qua (100% Đồng thuận)
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-slate-100">{r.title}</div>
                  <p className="text-xs text-slate-400">{r.rationale}</p>
                  <div className="pt-2 border-t border-slate-900">
                    <span className="text-[11px] font-medium text-slate-400">Hành động được chỉ định:</span>
                    <ul className="mt-1 space-y-1">
                      {r.actionItems.map((act, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Board Minutes Viewer */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Biên bản Họp HĐQT (Board Minutes)
            </h3>
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-80 overflow-y-auto">
              {currentSession.boardMinutesMarkdown}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
