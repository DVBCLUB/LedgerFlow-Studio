import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Sparkles,
  Download,
  Database,
  Cpu,
  CheckCircle2,
  BrainCircuit,
  Zap,
  Code2,
  DollarSign,
  Gamepad2,
  Video,
  Scale,
  RefreshCw,
  Copy,
  Terminal,
  ShieldCheck,
} from 'lucide-react';

interface DistillationStats {
  totalTrajectories: number;
  byDomain: Record<string, number>;
  byProvider: Record<string, number>;
  totalTokensEstimated: number;
  averageQualityScore: number;
  readinessForFineTuningPct: number;
  minRecommendedSamples: number;
  lastCapturedAt?: string;
}

interface GoldenTrajectory {
  id: string;
  domain: string;
  taskType: string;
  systemPrompt: string;
  userPrompt: string;
  goldOutput: string;
  rejectedOutput?: string;
  providerUsed: string;
  modelUsed?: string;
  qualityScore: number;
  evaluatedBy: string;
  tags: string[];
  tokenCountEstimated: number;
  createdAt: string;
}

const SPECIALIST_ROLES = [
  {
    role: 'Lead Architect & Code Doctor',
    frontierModel: 'Claude 3.5 Sonnet & DeepSeek Coder',
    domain: 'coding',
    strength: 'Logic TypeScript/Node, giải thuật phức tạp, vá lỗi AST chính xác 100%',
    badge: 'Chuyên gia Code',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    role: 'R&D, Multimodal & Context Lifter',
    frontierModel: 'Google Gemini 2.5 Pro & Flash',
    domain: 'research',
    strength: 'Context siêu lớn 2M tokens, phân tích ảnh/video, Free Tier tối đa',
    badge: 'Chuyên gia Context',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  {
    role: 'CFO, Legal & Tax Compliance',
    frontierModel: 'GPT-4o & Claude Sonnet',
    domain: 'finance',
    strength: 'Thẩm định định khoản kế toán VAS 200, hợp đồng, báo cáo quản trị',
    badge: 'Chuyên gia Thuế & Luật',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    role: 'Realtime Dispatch & A2A Streamer',
    frontierModel: 'Groq Llama-3.3-70B',
    domain: 'realtime',
    strength: 'Tốc độ 800 tokens/giây, phản hồi tức thì qua chat & Telegram',
    badge: 'Chuyên gia Tốc độ',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
];

export default function LocalAiApprenticeLabPanel() {
  const [stats, setStats] = useState<DistillationStats | null>(null);
  const [trajectories, setTrajectories] = useState<GoldenTrajectory[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedTrajectory, setSelectedTrajectory] = useState<GoldenTrajectory | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, trajRes] = await Promise.all([
        fetch('/api/ai/apprentice/stats').then((r) => r.json()),
        fetch('/api/ai/apprentice/trajectories?limit=50').then((r) => r.json()),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (trajRes.success) {
        setTrajectories(trajRes.trajectories);
        if (trajRes.trajectories.length > 0 && !selectedTrajectory) {
          setSelectedTrajectory(trajRes.trajectories[0]);
        }
      }
    } catch (err) {
      console.error('[ApprenticeLab] Load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedTrajectory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const copyModelfile = () => {
    const modelfile = `# LedgerFlow Studio - Fine-Tuned Local Apprentice Modelfile
FROM qwen2.5-coder:14b
# Set temperature and reasoning constraints
PARAMETER temperature 0.2
PARAMETER top_p 0.95
PARAMETER stop "<|im_end|>"
PARAMETER stop "<|endoftext|>"

# Localized Corporate System Prompt
SYSTEM """
Bạn là Trợ lý AI Nội Bộ của LedgerFlow Studio OS.
Bạn đã được huấn luyện (Fine-tuned/Distilled) từ các mẫu vàng của Claude 3.5 Sonnet, Gemini 2.5 Pro và GPT-4o.
Nhiệm vụ: Viết code TypeScript chuẩn xác, tuân thủ định khoản kế toán VAS 200, và nắm vững cấu trúc module LedgerFlow Studio.
"""
`;
    void navigator.clipboard.writeText(modelfile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTrajectories = trajectories.filter((t) =>
    selectedDomain === 'all' ? true : t.domain === selectedDomain
  );

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-6 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-indigo-300 border border-indigo-500/40 shadow-inner">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Local AI Apprentice &amp; Distillation Lab</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-300 border border-emerald-500/30">
                Frontier Maestro + Local Apprentice
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              Phân quyền cho AI đỉnh cao làm việc khó. Local AI âm thầm học hỏi (Shadow Trajectory Capture) tích lũy tri thức phục vụ tương lai.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-secondary bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
          <a
            href="/api/ai/apprentice/export?format=alpaca"
            download
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Download className="h-3.5 w-3.5" /> Xuất Dataset Alpaca (.jsonl)
          </a>
        </div>
      </div>

      {/* Frontier Specialist Matrix */}
      <div className="rounded-3xl border border-border-primary bg-slate-900/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              Ma Trận Phân Quyền Chuyên Gia Đỉnh Cao (Frontier Specialists)
            </span>
          </div>
          <span className="text-[10px] font-semibold text-slate-400">
            AI nào giỏi nhất mảng nào đảm nhiệm trọn vẹn mảng đó
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALIST_ROLES.map((spec) => (
            <div
              key={spec.role}
              className="rounded-2xl border border-border-secondary bg-slate-950/70 p-4 space-y-2 hover:border-indigo-500/40 transition"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${spec.badgeColor}`}>
                  {spec.badge}
                </span>
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <h4 className="text-xs font-black text-white">{spec.role}</h4>
              <p className="text-[11px] font-bold text-indigo-300 font-mono">{spec.frontierModel}</p>
              <p className="text-[10px] text-slate-400 line-clamp-2">{spec.strength}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Local AI Learning Progress & Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-indigo-500/30 bg-slate-900/60 p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-indigo-400" /> Mẫu Vàng Đã Thu Thập
            </span>
            <strong className="text-2xl font-black text-white font-mono">{stats.totalTrajectories}</strong>
            <span className="text-[10px] text-indigo-300 block">Điểm TB: {stats.averageQualityScore}/100</span>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-emerald-400" /> Tổng Token Tích Lũy
            </span>
            <strong className="text-2xl font-black text-emerald-400 font-mono">
              {stats.totalTokensEstimated.toLocaleString('vi-VN')}
            </strong>
            <span className="text-[10px] text-slate-400 block">Tokens ngữ cảnh chuẩn SFT</span>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/60 p-4 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" /> Độ Sẵn Sàng Fine-Tuning
            </span>
            <div className="flex items-center gap-2">
              <strong className="text-2xl font-black text-cyan-300 font-mono">
                {stats.readinessForFineTuningPct}%
              </strong>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${stats.readinessForFineTuningPct}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-purple-500/30 bg-slate-900/60 p-4 space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-purple-400" /> Template Fine-Tuning
            </span>
            <button
              onClick={copyModelfile}
              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-purple-600/30 border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-200 hover:bg-purple-600/50 cursor-pointer"
            >
              <Copy className="h-3 w-3" /> {copied ? 'Đã Copy Modelfile!' : 'Copy Ollama Modelfile'}
            </button>
          </div>
        </div>
      )}

      {/* Trajectory Viewer & Inspector */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Left: Trajectory List */}
        <div className="lg:col-span-5 rounded-3xl border border-border-primary bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-white">Kho Mẫu Vàng (Golden Trajectories)</span>
            <div className="flex gap-1">
              {['all', 'coding', 'finance', 'marketing'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold capitalize transition cursor-pointer ${
                    selectedDomain === d
                      ? 'bg-indigo-600 text-white font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
            {filteredTrajectories.length === 0 && (
              <p className="py-12 text-center text-xs font-semibold text-text-tertiary">
                Chưa có mẫu vàng nào được ghi nhận cho bộ lọc này.
              </p>
            )}
            {filteredTrajectories.map((t) => {
              const isSelected = selectedTrajectory?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTrajectory(t)}
                  className={`rounded-2xl border p-3 text-xs space-y-1.5 cursor-pointer transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/40'
                      : 'border-border-secondary bg-slate-900/40 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-black uppercase px-2 py-0.5">
                      {t.domain}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {t.qualityScore}/100 pts
                    </span>
                  </div>
                  <p className="font-semibold text-white truncate">{t.userPrompt}</p>
                  <div className="flex items-center justify-between text-[10px] text-text-tertiary">
                    <span>Nguồn: {t.providerUsed}</span>
                    <span>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Golden Trajectory Inspector */}
        <div className="lg:col-span-7 rounded-3xl border border-border-primary bg-slate-950/70 p-5 space-y-4">
          {selectedTrajectory ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase">{selectedTrajectory.domain} Sample</h3>
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300 border border-emerald-500/30">
                      Đạt Chuẩn Mẫu Vàng ({selectedTrajectory.qualityScore}/100)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">ID: {selectedTrajectory.id}</span>
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono">
                  <div>Thẩm định bởi: {selectedTrajectory.evaluatedBy}</div>
                  <div>Model: {selectedTrajectory.providerUsed}</div>
                </div>
              </div>

              {selectedTrajectory.systemPrompt && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">System Context:</span>
                  <pre className="rounded-xl border border-border-secondary bg-slate-900 p-3 text-[11px] text-slate-300 whitespace-pre-wrap font-sans">
                    {selectedTrajectory.systemPrompt}
                  </pre>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-cyan-400 block">Input Prompt:</span>
                <pre className="rounded-xl border border-cyan-500/30 bg-slate-900 p-3 text-xs text-white whitespace-pre-wrap font-sans">
                  {selectedTrajectory.userPrompt}
                </pre>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-400 block flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Gold Standard Output (Sản phẩm chuẩn mực để Local AI học):
                </span>
                <pre className="rounded-xl border border-emerald-500/40 bg-slate-900/90 p-3 text-xs text-emerald-100 whitespace-pre-wrap font-mono max-h-[220px] overflow-y-auto">
                  {selectedTrajectory.goldOutput}
                </pre>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-slate-400">
                <span>Ước tính tokens: ~{selectedTrajectory.tokenCountEstimated} tokens</span>
                <div className="flex gap-2">
                  <a
                    href="/api/ai/apprentice/export?format=sharegpt"
                    download
                    className="text-indigo-400 hover:underline"
                  >
                    Tải định dạng ShareGPT
                  </a>
                  <span>·</span>
                  <a
                    href="/api/ai/apprentice/export?format=dpo"
                    download
                    className="text-purple-400 hover:underline"
                  >
                    Tải cặp đối chiếu DPO
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs font-semibold text-text-tertiary">
              Chọn một mẫu vàng từ danh sách bên trái để xem chi tiết prompt và output.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
