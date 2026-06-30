import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Boxes, Check, CheckCircle2, ClipboardList, Cloud, Code2, Copy, Database, ExternalLink, FileText, GitBranch, Github, Loader2, Network, PlayCircle, RefreshCw, Search, Settings2, ShieldCheck, Sparkles, Terminal, Video, Workflow, XCircle, Zap } from 'lucide-react';
import GitHubConnectorPanel from './GitHubConnectorPanel';
import LocalToolsPanel from './LocalToolsPanel';
import WebAiSyncPanel from './WebAiSyncPanel';
import ConnectorContractPanel from './ConnectorContractPanel';
import {
  fetchIntegrations,
  testIntegrationConnector,
  updateIntegrationConnector,
  type IntegrationCategory,
  type IntegrationConnector,
  type IntegrationEvent,
  type IntegrationStatus,
} from '../../utils/integrationHubApi';
import { useStore } from '../../store/useStore';

type HubCategory = IntegrationCategory;

type ConnectorIcon = React.ComponentType<{ className?: string }>;

const statusConfig: Record<IntegrationStatus, { label: string; className: string }> = {
  connected: { label: 'Đã kết nối', className: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' },
  local: { label: 'Local-first', className: 'border-sky-500/40 bg-sky-950/30 text-sky-200' },
  manual: { label: 'Handoff thủ công', className: 'border-amber-500/40 bg-amber-950/30 text-amber-200' },
  planned: { label: 'Đang quy hoạch', className: 'border-slate-600 bg-slate-900 text-slate-300' },
  error: { label: 'Cần xử lý', className: 'border-rose-500/50 bg-rose-950/30 text-rose-200' },
};

const categoryLabels: Record<HubCategory | 'all', string> = {
  all: 'Tất cả',
  ai: 'AI',
  devops: 'DevOps',
  workspace: 'Google/Office',
  accounting: 'Kế toán/ERP',
  documents: 'Chứng từ',
  automation: 'Tự động hóa',
  data: 'Dữ liệu',
};

const iconById: Record<string, ConnectorIcon> = {
  'ai-gateway': Bot,
  github: Github,
  'vscode-cursor': Code2,
  'google-workspace': Cloud,
  'microsoft-365': Cloud,
  'notion': ClipboardList,
  'media-pipeline': Video,
  'accounting-erp': Boxes,
  'document-vault': FileText,
  automation: Workflow,
  'data-hub': Database,
  'web-ai-sync': Bot,
  'chatgpt-web': Bot,
  'claude-web': Bot,
  'gemini-web': Sparkles,
  'copilot-web': Bot,
  'canva-capcut': Boxes,
  'vercel-deploy': Cloud,
  'telegram-bot': Network,
};

const fallbackIconByCategory: Record<HubCategory, ConnectorIcon> = {
  ai: Bot,
  devops: Code2,
  workspace: Cloud,
  accounting: Boxes,
  documents: FileText,
  automation: Workflow,
  data: Database,
};

const roadmap = [
  'V1: màn hình trung tâm kết nối, link nhanh, trạng thái, checklist, handoff prompt.',
  'V2: registry API lưu trạng thái thật, test connector, event log local.',
  'V3: GitHub connector đọc Actions/Issues/PR và tạo issue phát triển.',
  'V4: Local Tools connector mở VS Code/Cursor/GitHub và sinh lệnh an toàn.',
  'V5: Google Workspace connector cho Sheets/Drive/Gmail/Calendar.',
];

function openQuickAction(action: { href?: string; hash?: string }) {
  if (action.href) {
    window.open(action.href, '_blank', 'noopener,noreferrer');
    return;
  }
  if (action.hash) {
    window.location.hash = action.hash;
  }
}

function getIcon(item: IntegrationConnector): ConnectorIcon {
  return iconById[item.id] ?? fallbackIconByCategory[item.category] ?? Network;
}

export default function IntegrationHub() {
  const [category, setCategory] = useState<HubCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([]);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Sub-tabs, prompt generator & matrix states
  const [subtab, setSubtab] = useState<'connectors' | 'matrix'>('connectors');
  const { activeIdea } = useStore();
  const [matrixTask, setMatrixTask] = useState<'coding' | 'finance' | 'video' | 'outbound'>('coding');
  const [promptCopied, setPromptCopied] = useState(false);

  // Dynamic AI routing state
  const [routedTask, setRoutedTask] = useState<any>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  const runAiRouter = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsRouting(true);
    setRoutingError(null);
    try {
      const res = await fetch('http://127.0.0.1:3001/api/web-ai/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          setRoutedTask(data);
        } else {
          throw new Error(data.error || 'Routing failed.');
        }
      } else {
        throw new Error('Không thể kết nối daemon để định tuyến AI.');
      }
    } catch (err: any) {
      setRoutingError(err.message || 'Lỗi định tuyến AI.');
    } finally {
      setIsRouting(false);
    }
  };

  const generatedPrompt = useMemo(() => {
    if (!activeIdea) return 'Vui lòng chọn một ý tưởng trong Ideas Hub để sinh Prompt tác chiến.';
    if (matrixTask === 'coding') {
      return `Tôi đang phát triển sản phẩm/game: "${activeIdea.title}"
- Loại hình: ${activeIdea.type === 'saas' ? 'Micro-SaaS App' : activeIdea.type === 'game' ? 'Mobile / Web Game' : 'Mã nguồn / Excel Tool'}
- Khách hàng ngách: ${activeIdea.nicheAudience}
- Mô tả: ${activeIdea.description}
- Mức giá dự kiến: ${activeIdea.pricePoint.toLocaleString('vi-VN')} VNĐ
- Chỉ số Guerrilla Score: ${activeIdea.guerrillaScore}/10

Hãy đóng vai là AI Developer Agent. Viết cấu trúc thư mục chi tiết, thiết kế các API endpoints và viết code logic MVP lõi sơ khởi cho sản phẩm này.`;
    }
    if (matrixTask === 'finance') {
      return `Tôi đang thẩm định tài chính cho sản phẩm/game: "${activeIdea.title}"
- Mức giá dự kiến: ${activeIdea.pricePoint.toLocaleString('vi-VN')} VNĐ/tháng
- Khách hàng ngách: ${activeIdea.nicheAudience}
- Chỉ số Guerrilla Score: ${activeIdea.guerrillaScore}/10

Hãy đóng vai là AI Financial Analyst. Hãy tính toán điểm hòa vốn, ước lượng chi phí server tối thiểu trên Vercel/Supabase, và lập bảng dự báo doanh thu tháng 1 - tháng 12 với tốc độ tăng trưởng 15% mỗi tháng.`;
    }
    if (matrixTask === 'video') {
      return `Tôi cần kịch bản video quảng bá sản phẩm/game: "${activeIdea.title}"
- Khách hàng ngách: ${activeIdea.nicheAudience}
- Điểm thu hút nhất: ${activeIdea.description}
- Phân khúc giá: ${activeIdea.pricePoint.toLocaleString('vi-VN')} VNĐ

Hãy đóng vai là AI Video Producer. Hãy viết kịch bản video ngắn 60 giây đăng TikTok/Shorts:
- 3 giây đầu tiên (Hook giật gân đánh trúng nỗi đau khách hàng)
- Phần thân (Mô tả tính năng đột phá giải quyết nỗi đau)
- Phần cuối (Call-to-action kêu gọi đăng ký sớm)`;
    }
    return `Tôi cần chiến lược tiếp cận khách hàng (Outbound outreach) cho: "${activeIdea.title}"
- Khách hàng ngách: ${activeIdea.nicheAudience}
- Mức giá bán: ${activeIdea.pricePoint.toLocaleString('vi-VN')} VNĐ

Hãy đóng vai là AI Growth Hacker. Hãy lập danh sách 5 group Facebook/Reddit/Zalo tập trung đông đảo tệp khách hàng này nhất, và viết 1 bài viết mẫu (giá trị cao, không spam) để giới thiệu sản phẩm thu hút lượt đăng ký beta đầu tiên.`;
  }, [activeIdea, matrixTask]);

  // Run routing automatically when subtab, activeIdea, or generatedPrompt changes
  useEffect(() => {
    if (subtab === 'matrix' && activeIdea) {
      runAiRouter(generatedPrompt);
    }
  }, [subtab, activeIdea, generatedPrompt]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  };

  async function loadHub() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchIntegrations();
      setConnectors(data.connectors);
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được Integration Hub registry.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadHub();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return connectors.filter((item) => {
      const matchesCategory = category === 'all' || item.category === category;
      const haystack = [item.title, item.subtitle, item.notes, item.category, ...item.capabilities].join(' ').toLowerCase();
      return matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [category, connectors, query]);

  const summary = useMemo(() => {
    return connectors.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { connected: 0, local: 0, manual: 0, planned: 0, error: 0 } as Record<IntegrationStatus, number>,
    );
  }, [connectors]);

  const githubConnector = connectors.find((item) => item.id === 'github');
  const localToolsConnector = connectors.find((item) => item.id === 'vscode-cursor');
  const webAiSyncConnector = connectors.find((item) => item.id === 'web-ai-sync');

  async function handleTest(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const result = await testIntegrationConnector(id);
      setConnectors((current) => current.map((item) => (item.id === id ? result.connector : item)));
      setEvents(result.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test connector thất bại.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggle(item: IntegrationConnector) {
    setBusyId(item.id);
    setError(null);
    try {
      const connector = await updateIntegrationConnector(item.id, { enabled: !item.enabled });
      setConnectors((current) => current.map((entry) => (entry.id === item.id ? connector : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được connector.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 text-slate-100">
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-indigo-950/60 shadow-2xl">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.25fr_0.75fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-200">
              <Network className="h-4 w-4" /> Integration Hub v2
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
                LedgerFlow là trung tâm đầu mối kết nối mọi nền tảng
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-300">
                Không clone GitHub, VS Code, Google Drive, MISA hay n8n. LedgerFlow điều phối: gom yêu cầu, chuẩn hóa dữ liệu,
                gọi AI Gateway, mở đúng công cụ, ghi log, kiểm tra và yêu cầu duyệt trước khi tự động hóa.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Connected" value={summary.connected} icon={Sparkles} />
              <Metric label="Local-first" value={summary.local} icon={ShieldCheck} />
              <Metric label="Handoff" value={summary.manual} icon={Terminal} />
              <Metric label="Roadmap" value={summary.planned} icon={ClipboardList} />
              <Metric label="Issues" value={summary.error} icon={XCircle} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <Zap className="h-4 w-4 text-amber-300" /> Registry sống
              </div>
              <button
                type="button"
                onClick={() => void loadHub()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-500"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>
            <ul className="mt-4 space-y-3 text-xs font-semibold leading-6 text-slate-300">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Trạng thái connector được lưu local qua backend, không còn là card tĩnh.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> GitHub connector đã đọc được repo, Actions, Issues, PR và có thể tạo issue nếu có token.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" /> Local Tools connector có thể mở VS Code/Cursor/GitHub và sinh lệnh terminal an toàn.</li>
            </ul>
            {error && <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs font-bold text-rose-100">{error}</div>}
          </div>
        </div>
      </section>

      {/* SUB-TAB NAVIGATION */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 border border-slate-900 rounded-2xl w-fit">
        <button
          onClick={() => setSubtab('connectors')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            subtab === 'connectors'
              ? 'bg-cyan-600 text-white shadow shadow-cyan-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🎛️ Cổng Kết Nối Platforms
        </button>
        <button
          onClick={() => setSubtab('matrix')}
          className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            subtab === 'matrix'
              ? 'bg-purple-600 text-white shadow shadow-purple-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          🧠 Bản Đồ Phân Vai AI
        </button>
      </div>

      {subtab === 'matrix' ? (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Column 1: AI Task Router Results */}
            <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 space-y-5 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-400 animate-pulse" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    Định Tuyến & Phân Phối Tác Vụ AI (AI Task Router)
                  </h3>
                </div>
                {isRouting && (
                  <span className="flex items-center gap-1.5 text-xs text-purple-400 font-bold">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang định tuyến...
                  </span>
                )}
              </div>

              {routingError && (
                <div className="rounded-2xl border border-rose-800/40 bg-rose-950/20 px-4 py-3 text-xs font-bold text-rose-350">
                  ⚠️ {routingError}
                </div>
              )}

              {routedTask ? (
                <div className="space-y-6">
                  {/* Category & Privacy block */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/40 p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phân Loại Nghiệp Vụ</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-xl px-3 py-1 text-xs font-black bg-purple-950/60 text-purple-300 border border-purple-500/20 uppercase tracking-wide">
                          {routedTask.taskDomain}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          (Dựa trên nội dung prompt)
                        </span>
                      </div>
                    </div>

                    <div className={`rounded-2xl border p-4 space-y-2 ${
                      routedTask.privacyScan.risk === 'BLOCKED' ? 'border-rose-800/50 bg-rose-950/15' :
                      routedTask.privacyScan.risk === 'HIGH' ? 'border-amber-850 bg-amber-950/10' :
                      'border-emerald-850 bg-emerald-950/10'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Local Privacy Guard</span>
                      <div className="flex items-center gap-2 justify-between">
                        <span className={`rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wide ${
                          routedTask.privacyScan.risk === 'BLOCKED' ? 'bg-rose-950 text-rose-300 border border-rose-500/20' :
                          routedTask.privacyScan.risk === 'HIGH' ? 'bg-amber-950 text-amber-300 border border-amber-500/20' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          Risk: {routedTask.privacyScan.risk}
                        </span>
                        
                        {routedTask.privacyScan.findings.length > 0 && (
                          <span className="text-[10px] font-bold text-rose-300 animate-pulse">
                            ⚠️ Phát hiện {routedTask.privacyScan.findings.length} dữ liệu nhạy cảm
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Redacted Preview if risk high/blocked */}
                  {routedTask.privacyScan.findings.length > 0 && (
                    <div className="rounded-2xl border border-slate-850 bg-slate-900/60 p-4 space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bản xem trước ẩn thông tin nhạy cảm (Redacted Preview)</span>
                      <pre className="font-mono text-[10.5px] text-slate-400 bg-black/40 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-32 border border-slate-850">
                        {routedTask.privacyScan.redactedPreview}...
                      </pre>
                    </div>
                  )}

                  {/* Recommendation List */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block">Bảng xếp hạng năng lực AI thích hợp (Sorted Recommendations)</span>
                    <div className="space-y-3">
                      {routedTask.recommendations.map((rec: any) => (
                        <div key={rec.platform} className={`p-4 rounded-2xl border transition-all ${
                          rec.isRecommended
                            ? 'border-purple-500 bg-purple-950/10 shadow-lg shadow-purple-950/5'
                            : 'border-slate-850 bg-slate-900/30'
                        }`}>
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-white">{rec.displayName}</h4>
                                <span className={`text-[9px] px-2 py-0.5 font-bold rounded-lg ${
                                  rec.score >= 9 ? 'bg-emerald-950 text-emerald-400' :
                                  rec.score >= 8 ? 'bg-cyan-950 text-cyan-400' :
                                  'bg-slate-900 text-slate-400'
                                }`}>
                                  Score: {rec.score}/10
                                </span>
                                {rec.isRecommended && (
                                  <span className="text-[9.5px] px-1.5 py-0.25 bg-purple-500/20 text-purple-300 border border-purple-500/25 rounded-md font-bold">
                                    Ưu tiên hàng đầu 🚀
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-450 font-semibold mt-1.5">
                                Thế mạnh: {rec.details.capabilities.join(", ")}
                              </p>
                              <div className="flex gap-4 text-[9.5px] text-slate-500 font-bold mt-2">
                                <span>Health: <span className="text-emerald-400">Stable</span></span>
                                <span>Selectors: <span className="font-mono text-slate-500">{rec.details.selectorsVersion}</span></span>
                                <span>Privacy: <span className="text-slate-500">{rec.details.privacyLevel}</span></span>
                              </div>
                            </div>
                          </div>

                          {/* Profiles list for this platform */}
                          <div className="mt-3 pt-3 border-t border-slate-900/60 space-y-2">
                            <span className="text-[9.5px] font-bold text-slate-500 uppercase block">Chrome Profiles khả dụng:</span>
                            {rec.profiles && rec.profiles.length > 0 ? (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {rec.profiles.map((p: any) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-850 text-xs">
                                    <div>
                                      <div className="font-bold text-slate-200">{p.name}</div>
                                      <div className="text-[10px] text-slate-500 mt-0.5">
                                        Trạng thái: <span className={`font-semibold ${
                                          p.status === 'ready' ? 'text-emerald-400' :
                                          p.status === 'quota' ? 'text-amber-400' : 'text-slate-400'
                                        }`}>{p.status}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        window.location.hash = `/integration_hub?focus=web-ai-sync`;
                                        navigator.clipboard.writeText(generatedPrompt);
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-black rounded-lg bg-slate-900 border border-slate-750 text-slate-350 hover:text-white hover:border-violet-500 transition-all cursor-pointer"
                                    >
                                      Sử dụng profile 📋
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] italic text-slate-500">
                                Chưa cấu hình profile nào cho platform này. Hãy vào mục "Chrome Web Sync" để đăng ký.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 font-bold">
                  Không tìm thấy cấu hình định tuyến cho prompt. Vui lòng nhập ý tưởng hoặc prompt.
                </div>
              )}
            </div>

            {/* Column 2: Prompt handoff builder */}
            <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <Zap className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Trình Tạo Prompt Tác Chiến Handoff
                </h3>
              </div>

              {activeIdea ? (
                <div className="space-y-4 text-left">
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-850 text-xs">
                    <span className="text-[9px] uppercase font-mono text-slate-500 font-bold block mb-1">Ý tưởng đang chọn:</span>
                    <strong className="text-white">{activeIdea.title}</strong>
                    <p className="text-[10.5px] text-slate-400 leading-normal mt-1 line-clamp-2 italic">"{activeIdea.description}"</p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">Tác vụ AI cần giao:</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-bold">
                      {[
                        { id: 'coding', label: '💻 Coding MVP' },
                        { id: 'finance', label: '📊 Thẩm định' },
                        { id: 'video', label: '🎬 Kịch bản' },
                        { id: 'outbound', label: '📢 Outbound' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setMatrixTask(t.id as any)}
                          className={`px-3 py-1.5 rounded-lg border transition-all text-center cursor-pointer ${
                            matrixTask === t.id
                              ? 'bg-purple-600/25 border-purple-500/40 text-purple-300'
                              : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-450">
                      <span>Nội dung Prompt gợi ý (No-API):</span>
                      <button
                        onClick={handleCopyPrompt}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-black cursor-pointer"
                      >
                        {promptCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{promptCopied ? 'Đã sao chép!' : 'Sao chép 📋'}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={generatedPrompt}
                      rows={8}
                      className="w-full bg-slate-900 border border-slate-850 p-3 rounded-xl text-[10.5px] font-semibold text-slate-350 leading-relaxed font-mono focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-900/80 space-y-2">
                    <span className="text-[9.5px] font-black uppercase text-slate-500 block">Liên kết Web Chat nhanh:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-black">
                      <a 
                        href="https://chatgpt.com" target="_blank" rel="noreferrer"
                        className="flex items-center justify-between p-2 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-750 hover:text-white transition-all"
                      >
                        <span>ChatGPT Web</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                      <a 
                        href="https://claude.ai" target="_blank" rel="noreferrer"
                        className="flex items-center justify-between p-2 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-750 hover:text-white transition-all"
                      >
                        <span>Claude Web</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                      <a 
                        href="https://gemini.google.com" target="_blank" rel="noreferrer"
                        className="flex items-center justify-between p-2 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-750 hover:text-white transition-all"
                      >
                        <span>Gemini Web</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                      <a 
                        href="https://copilot.microsoft.com" target="_blank" rel="noreferrer"
                        className="flex items-center justify-between p-2 bg-slate-900 border border-slate-850 rounded-xl hover:border-slate-750 hover:text-white transition-all"
                      >
                        <span>Copilot Web</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-xs text-slate-500 font-bold">
                  Vui lòng chọn một ý tưởng trong Ideas Hub để sinh Prompt tác chiến.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {githubConnector?.enabled && <GitHubConnectorPanel repoUrl={githubConnector.url} onChanged={() => void loadHub()} />}
          {localToolsConnector?.enabled && <LocalToolsPanel onChanged={() => void loadHub()} />}
          {webAiSyncConnector?.enabled && <WebAiSyncPanel onChanged={() => void loadHub()} />}
          <ConnectorContractPanel onChanged={() => void loadHub()} />

          <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                <Settings2 className="h-4 w-4 text-cyan-300" /> Bộ lọc connector
              </div>
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm GitHub, Sheets, MISA..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs font-bold text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
                />
              </div>
              <div className="space-y-2">
                {(Object.keys(categoryLabels) as Array<HubCategory | 'all'>).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs font-black transition ${
                      category === key
                        ? 'border border-cyan-500/50 bg-cyan-950/40 text-cyan-100'
                        : 'border border-slate-800 bg-slate-900/70 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {categoryLabels[key]}
                  </button>
                ))}
              </div>
            </aside>

            <div className="grid gap-4 xl:grid-cols-2">
              {isLoading ? (
                <div className="col-span-full flex items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/80 p-10 text-sm font-black text-slate-300">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-cyan-300" /> Đang tải registry connector...
                </div>
              ) : (
                filtered.map((item) => (
                  <IntegrationCardView key={item.id} item={item} busy={busyId === item.id} onTest={handleTest} onToggle={handleToggle} />
                ))
              )}
            </div>
          </section>
        </>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
            <GitBranch className="h-4 w-4 text-cyan-300" /> Lộ trình Integration Hub
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {roadmap.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cyan-950 text-xs font-black text-cyan-200">
                  {index + 1}
                </div>
                <p className="text-xs font-semibold leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-black text-white">
            <Activity className="h-4 w-4 text-emerald-300" /> Event log gần nhất
          </div>
          <div className="max-h-72 space-y-2 overflow-auto pr-1">
            {events.length === 0 ? (
              <p className="text-xs font-semibold text-slate-500">Chưa có log connector.</p>
            ) : (
              events.slice(0, 12).map((event) => (
                <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
                  <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                    <span>{event.connectorId}</span>
                    <span>{event.level}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">{event.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: ConnectorIcon }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <Icon className="mb-3 h-5 w-5 text-cyan-300" />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</div>
    </div>
  );
}

function IntegrationCardView({
  item,
  busy,
  onTest,
  onToggle,
}: {
  item: IntegrationConnector;
  busy: boolean;
  onTest: (id: string) => Promise<void>;
  onToggle: (item: IntegrationConnector) => Promise<void>;
}) {
  const Icon = getIcon(item);
  const status = statusConfig[item.status];

  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/30">
            <Icon className="h-5 w-5 text-cyan-200" />
          </div>
          <div>
            <h2 className="text-base font-black text-white">{item.title}</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{item.subtitle}</p>
          </div>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-black text-slate-300">{item.priority}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${status.className}`}>{status.label}</span>
        <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[10px] font-black text-slate-300">
          {categoryLabels[item.category]}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${item.enabled ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200' : 'border-slate-700 bg-slate-900 text-slate-400'}`}>
          {item.enabled ? 'Đang bật' : 'Đang tắt'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {item.capabilities.map((capability) => (
          <div key={capability} className="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs font-semibold leading-5 text-slate-300">
            <Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
            {capability}
          </div>
        ))}
      </div>

      <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-xs font-semibold leading-6 text-slate-400">
        {item.notes}
      </p>

      {item.lastMessage && (
        <p className="mt-3 rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs font-semibold leading-6 text-cyan-100">
          {item.lastMessage}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {item.quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => openQuickAction(action)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-cyan-500 hover:bg-cyan-950/30"
          >
            {action.href ? <ExternalLink className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {action.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void onTest(item.id)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3 py-2 text-xs font-black text-emerald-100 hover:bg-emerald-900/30 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Test
        </button>
        <button
          type="button"
          onClick={() => void onToggle(item)}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-black text-slate-200 hover:border-amber-500 disabled:opacity-60"
        >
          {item.enabled ? 'Tắt' : 'Bật'} connector
        </button>
      </div>
    </article>
  );
}
