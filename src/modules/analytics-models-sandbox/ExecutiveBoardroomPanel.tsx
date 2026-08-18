import React, { useState } from 'react';
import { Building2, CheckCircle2, Play, Users, FileText, TrendingUp, ShieldAlert, Cpu, Sparkles, XCircle, Check, Vote, RefreshCw } from 'lucide-react';

export interface BoardResolutionUI {
  id: string;
  title: string;
  category: string;
  proposedBy: string;
  rationale: string;
  votes: Record<string, string>;
  passed: boolean;
  actionItems: string[];
  founderApproved?: boolean | null;
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

const MEETING_AGENDA_PRESETS = [
  '🚀 Chiến lược Phát hành Sản phẩm & Tăng trưởng Q3',
  '💰 Cắt giảm Chi phí Token LLM & Tối ưu Dòng tiền Runway',
  '🛡️ Rà soát An toàn Mã nguồn, DevOps & Key Vault Security',
  '🤖 Đánh giá Hiệu suất Đội ngũ AI Staff & Multi-Platform Robot Swarm',
];

export default function ExecutiveBoardroomPanel() {
  const [topicInput, setTopicInput] = useState('🚀 Chiến lược Phát hành Sản phẩm & Tăng trưởng Q3');
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentSession, setCurrentSession] = useState<BoardroomSessionUI | null>({
    id: 'board_session_active',
    topic: '🚀 Chiến lược Phát hành Sản phẩm & Tăng trưởng Q3',
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
    executiveDebateSummary: 'Hội đồng Quản trị AI Agents đã thảo luận chuyên sâu và nhất trí đề xuất 3 Nghị quyết quan trọng cho Founder chốt.',
    resolutions: [
      {
        id: 'res_1',
        title: 'Triển khai Cổng giao tiếp chuẩn MCP (Model Context Protocol Gateway)',
        category: 'tech',
        proposedBy: 'AI CTO Agent',
        rationale: 'Kết nối trực tiếp hai chiều với Cursor, Claude Desktop và các MCP Server mở rộng bên ngoài.',
        votes: { Founder: 'pending', CFO: 'yes', CMO: 'yes', CTO: 'yes', CPO: 'yes' },
        passed: true,
        actionItems: ['Phát hành GET /api/mcp/sse endpoint', 'Tự động phát hiện MCP Tool Manifest'],
        founderApproved: null
      },
      {
        id: 'res_2',
        title: 'Tối ưu Chi phí Swarm Agent qua Router Phân tầng LLM (Model Tiering)',
        category: 'finance',
        proposedBy: 'AI CFO Agent',
        rationale: 'Chuyển đổi các tác vụ phụ sang Model Micro để giảm 75% chi phí token API hàng tháng, giữ Runway > 6 tháng.',
        votes: { Founder: 'yes', CFO: 'yes', CMO: 'yes', CTO: 'yes', CPO: 'yes' },
        passed: true,
        actionItems: ['Phân tầng Tier 1/2/3 cho Swarm Agents', 'Ghi nhận token savings trong costObservability'],
        founderApproved: true
      },
      {
        id: 'res_3',
        title: 'Tự động hóa Video Marketing TikTok/Reels kéo Affiliate & Leads',
        category: 'growth',
        proposedBy: 'AI CMO Agent',
        rationale: 'Tạo luồng sản xuất video AI 24/7 tự động gắn mã giảm giá và affiliate link để tối ưu chi phí thu hút khách hàng (CAC).',
        votes: { Founder: 'pending', CFO: 'yes', CMO: 'yes', CTO: 'yes', CPO: 'yes' },
        passed: true,
        actionItems: ['Chạy AI Video Generator Agent mỗi sáng', 'Đo lường conversion rate trên CRM'],
        founderApproved: null
      }
    ],
    boardMinutesMarkdown: `# 📜 Biên bản Họp Hội đồng Quản trị AI
**Phiên họp**: \`AI-BOARD-SESSION-2026\`  
**Chủ tọa (Chairman)**: Founder / CEO (Bạn)  

### Thành phần Tham dự HĐQT AI Agents:
- 👑 **Founder / CEO (Bạn)**: Quyền Phủ quyết Tuyệt đối (Veto Power & Final Approval)
- 💰 **AI CFO Agent**: Quản trị Dòng tiền, Chi phí Token LLM & Runway
- 🚀 **AI CMO Agent**: Phễu Tăng trưởng, Tiếp thị Video & Affiliate Leads
- ⚙️ **AI CTO Agent**: Kiến trúc Hệ thống, MCP Gateway & Security Envelope
- 🎨 **AI CPO Agent**: Danh mục Sản phẩm & Trải nghiệm Người dùng

### Tóm tắt Phiên thảo luận:
Hội đồng Quản trị AI đã hoàn thành phân tích bản sao số dữ liệu doanh nghiệp và trình Founder 3 Nghị quyết quan trọng phía trên.
`,
  });

  const handleRunBoardroom = async () => {
    setIsSimulating(true);
    try {
      const res = fetch('/api/simulation/boardroom/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput }),
      });
      // Simulation delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      setCurrentSession({
        id: `board_${Date.now()}`,
        topic: topicInput,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: 'completed',
        executiveDebateSummary: `Phiên họp về chủ đề "${topicInput}" đã được Hội đồng Quản trị AIAgents thống nhất thành công.`,
        resolutions: [
          {
            id: `res_${Date.now()}_1`,
            title: `Quyết sách Thực thi: ${topicInput}`,
            category: 'strategy',
            proposedBy: 'AI CEO Strategist',
            rationale: 'Tối ưu hóa nguồn lực AI Agents để hoàn thành mục tiêu chiến lược trong 30 ngày.',
            votes: { Founder: 'pending', CFO: 'yes', CMO: 'yes', CTO: 'yes', CPO: 'yes' },
            passed: true,
            actionItems: ['Phân công nhiệm vụ cho AI Workforce', 'Cập nhật tiến độ trên CEO Command Center'],
            founderApproved: null
          }
        ],
        boardMinutesMarkdown: `# 📜 Biên bản Họp Hội đồng Quản trị AI
**Chủ đề**: ${topicInput}  
**Chủ tọa**: Founder / CEO (Bạn)  
**Thời gian**: ${new Date().toLocaleString('vi-VN')}

### Kết quả Biểu quyết:
- AI CFO, AI CMO, AI CTO, AI CPO đã bỏ phiếu **ĐỒNG Ý (YES)**.
- Trình Founder / CEO xem xét phê duyệt hoặc phủ quyết trực tiếp.
`
      });
    } catch {
      // Offline fallback
    } finally {
      setIsSimulating(false);
    }
  };

  const handleFounderVote = (resolutionId: string, approved: boolean) => {
    if (!currentSession) return;
    const nextResolutions = currentSession.resolutions.map((r) => {
      if (r.id === resolutionId) {
        return {
          ...r,
          founderApproved: approved,
          votes: { ...r.votes, Founder: approved ? 'yes' : 'no' }
        };
      }
      return r;
    });

    setCurrentSession({
      ...currentSession,
      resolutions: nextResolutions
    });
  };

  return (
    <div className="space-y-6 text-left select-none">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/25 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI Executive Boardroom
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Chairman: Founder (You)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Building2 className="w-7 h-7 text-indigo-400" />
              Cuộc họp Hội đồng Quản trị AI (Founder &amp; AI C-Suite)
            </h2>
            <p className="text-xs font-semibold text-slate-300 max-w-3xl leading-relaxed">
              Nơi Founder triệu tập các Giám đốc AI (AI CFO, CMO, CTO, CPO) họp tư vấn chiến lược tự động. Các AI Agent phân tích dữ liệu, tranh luận giải pháp và trình Nghị quyết cho Founder chốt phê duyệt hoặc phủ quyết.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunBoardroom}
              disabled={isSimulating}
              className="px-5 py-3 rounded-2xl font-black text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 disabled:opacity-50 cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin text-white" />
                  Đang họp Hội đồng AI...
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

        {/* Meeting Agenda Selector & Custom Topic Input */}
        <div className="mt-5 pt-4 border-t border-slate-800 space-y-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chương trình họp mẫu:</span>
            {MEETING_AGENDA_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTopicInput(preset)}
                className={`px-3 py-1 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer border ${
                  topicInput === preset
                    ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-300 shrink-0">Chủ đề Cuộc họp:</label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-400"
              placeholder="Nhập chủ đề cuộc họp chiến lược..."
            />
          </div>
        </div>
      </div>

      {/* Active C-Suite AI Board Members Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            Thành viên Hội đồng Quản trị AI (AI Executive Council)
          </h3>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            ✓ Chairmanship: Founder Veto Power
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { role: 'CHAIRMAN', name: 'Founder / CEO (Bạn)', focus: 'Quyền Phủ quyết & Quyết định cuối', weight: 'FINAL', color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200 font-black' },
            { role: 'AI CFO', name: 'AI CFO Agent', focus: 'Dòng tiền, Runway & Chi phí Token', weight: '1,5x', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
            { role: 'AI CMO', name: 'AI CMO Agent', focus: 'Phễu Tăng trưởng & Video Marketing', weight: '1,0x', color: 'border-rose-500/30 bg-rose-500/5 text-rose-300' },
            { role: 'AI CTO', name: 'AI CTO Agent', focus: 'Kiến trúc, MCP Protocol & Safety', weight: '1,5x', color: 'border-purple-500/30 bg-purple-500/5 text-purple-300' },
            { role: 'AI CPO', name: 'AI Product Agent', focus: 'Backlog Tính năng & Trải nghiệm UX', weight: '1,0x', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
          ].map((m) => (
            <div key={m.role} className={`p-4 rounded-2xl border ${m.color} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider">{m.role}</span>
                <span className="text-[9px] font-bold opacity-90 px-2 py-0.5 rounded bg-black/30">
                  {m.weight}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-100">{m.name}</div>
              <div className="text-[10.5px] opacity-80 leading-snug">{m.focus}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Session Results & Voting */}
      {currentSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Passed Resolutions & Founder Approval Gate */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Nghị quyết HĐQT Trình Founder Duyệt ({currentSession.resolutions.length})
              </h3>
              <span className="text-[10px] font-bold text-indigo-300">
                Founder Approval Gate
              </span>
            </div>

            <div className="space-y-3.5">
              {currentSession.resolutions.map((r) => {
                const isApproved = r.founderApproved === true;
                const isRejected = r.founderApproved === false;
                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isApproved
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : isRejected
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded">
                        {r.category} · Đề xuất bởi {r.proposedBy}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isApproved
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : isRejected
                          ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}>
                        {isApproved ? '✓ Founder Approved' : isRejected ? '✗ Founder Vetoed' : '⏳ Chờ Founder Duyệt'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-100">{r.title}</div>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{r.rationale}</p>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">Hành động triển khai:</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {r.actionItems.map((act, i) => (
                            <span key={i} className="text-[10px] font-bold text-indigo-200 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                              • {act}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Founder Vote Controls */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleFounderVote(r.id, true)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isApproved
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFounderVote(r.id, false)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isRejected
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-600 hover:text-white'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Phủ quyết
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Board Minutes Viewer */}
          <div className="p-5 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Biên bản Họp HĐQT AI (Board Minutes)
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                {currentSession.id}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {currentSession.boardMinutesMarkdown}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
