/**
 * GlaciaCognitiveThoughtHUD.tsx
 * ============================================================
 * GLACIA COGNITIVE STREAM-OF-THOUGHT & REASONING HUD
 * ------------------------------------------------------------
 * Visualizes Glacia's inner monologue, System 1/2 deliberations,
 * constructive critique, risk assessment, and working memory graph.
 * ============================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Zap, ShieldAlert, Sparkles, CheckCircle2,
  RefreshCw, MessageSquare, ArrowRight, Activity, HelpCircle,
  Lightbulb, Check, ChevronRight, Layers,
} from 'lucide-react';
import {
  deliberateCognitiveTask,
  fetchWorkingMemoryState,
  recordWorkingMemoryItem,
  type DeliberationResult,
  type MemoryStoreData,
} from '../../utils/glaciaCognitiveApi';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';

export default function GlaciaCognitiveThoughtHUD() {
  const { speak, triggerReaction } = useGlacia();
  const [queryInput, setQueryInput] = useState('');
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [deliberation, setDeliberation] = useState<DeliberationResult | null>(null);
  const [memoryStore, setMemoryStore] = useState<MemoryStoreData | null>(null);
  const [loadingMemory, setLoadingMemory] = useState(true);
  const [activeTab, setActiveTab] = useState<'reasoning' | 'working_memory' | 'ceo_profile'>('reasoning');

  const loadMemory = useCallback(async () => {
    try {
      setLoadingMemory(true);
      const data = await fetchWorkingMemoryState();
      setMemoryStore(data);
    } catch (err) {
      console.error('Failed to load working memory:', err);
    } finally {
      setLoadingMemory(false);
    }
  }, []);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  const handleDeliberate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim() || isDeliberating) return;

    setIsDeliberating(true);
    triggerReaction('thinking');
    glaciaAudio.playQuantumDispatch();

    try {
      const res = await deliberateCognitiveTask(queryInput);
      setDeliberation(res);

      if (res.constructivePushback?.hasPushback) {
        triggerReaction('alert');
        speak(res.finalVerdict, 'alert');
      } else {
        triggerReaction('sparkle');
        speak(res.finalVerdict, 'celebrating');
      }

      await loadMemory();
    } catch (err: any) {
      triggerReaction('sad');
      speak('Có lỗi trong quá trình tư duy nhận thức.', 'sad');
    } finally {
      setIsDeliberating(false);
    }
  };

  const PRESET_QUERIES = [
    'Phân tích chiến lược mở rộng thị trường kế toán xây dựng & AI SaaS 2026',
    'Có nên xóa sạch database và chạy lại migration từ đầu không?',
    'Đề xuất phân bổ ngân sách marketing quý này để đạt tăng trưởng tối đa',
    'Tự động đối soát công nợ khách hàng và cảnh báo dòng tiền',
  ];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/10">
            <Brain className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Bộ Não Nhận Thức Đa Tầng (Cognitive Brain)</h2>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
                Dual-System v3.5
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Mô hình tư duy 2 tầng (System 1 Phản xạ $0 ms & System 2 Deep Deliberation) + Trí nhớ làm việc (Working Memory)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={loadMemory}
          disabled={loadingMemory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingMemory ? 'animate-spin' : ''}`} /> Làm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-slate-800 pb-2">
        {[
          { id: 'reasoning' as const, label: '🧠 Tư Duy & Phản Biện (CoT)', icon: Brain },
          { id: 'working_memory' as const, label: '💾 Trí Nhớ Làm Việc (Buffer 7)', icon: Layers },
          { id: 'ceo_profile' as const, label: '👤 Hồ Sơ Đồng Nghiệp CEO', icon: Lightbulb },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: REASONING & DELIBERATION */}
      {activeTab === 'reasoning' && (
        <div className="space-y-4">
          {/* Query Form */}
          <form onSubmit={handleDeliberate} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              💡 Đưa ra bài toán / Quyết định để Glacia phân tích & phản biện:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Nhập câu hỏi, quyết định chiến lược, hoặc yêu cầu kỹ thuật..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
              <button
                type="submit"
                disabled={isDeliberating || !queryInput.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isDeliberating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isDeliberating ? 'Đang tư duy...' : 'Kích Hoạt Tư Duy'}</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-slate-500 self-center">Gợi ý:</span>
              {PRESET_QUERIES.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQueryInput(p);
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer truncate max-w-xs"
                >
                  {p}
                </button>
              ))}
            </div>
          </form>

          {/* Deliberation Result */}
          {deliberation && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 animate-fadeIn">
              {/* Verdict Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                      deliberation.systemUsed === 'system_1_fast'
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                        : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {deliberation.systemUsed === 'system_1_fast' ? '⚡ System 1 (Bản năng $0)' : '🧠 System 2 (Tư duy Chiều Sâu)'}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                      deliberation.riskLevel === 'critical'
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                        : deliberation.riskLevel === 'high'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    Rủi ro: {deliberation.riskLevel}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{deliberation.latencyMs}ms</span>
              </div>

              {/* Constructive Pushback Alert if Any */}
              {deliberation.constructivePushback?.hasPushback && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-black text-red-300">
                    <ShieldAlert className="w-4 h-4" />
                    <span>⚠️ Phản Biện Tích Cực Từ Đồng Nghiệp AI Cấp Cao:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-200">
                    {deliberation.constructivePushback.concerns.join(' ')}
                  </p>
                  <p className="text-[11px] text-emerald-300 font-semibold pt-1">
                    💡 Đề xuất an toàn hơn: {deliberation.constructivePushback.alternativeSuggestion}
                  </p>
                </div>
              )}

              {/* Stream of Thought Steps */}
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Dòng Suy Tưởng Nội Tâm (Live Stream-of-Thought):
                </span>
                <div className="space-y-2">
                  {deliberation.streamOfThought.map((node) => (
                    <div key={node.step} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold text-indigo-400">#{node.step}</span>
                          <span className="text-[11px] font-bold text-white">{node.title}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                          <span>Độ tin cậy: {Math.round(node.confidenceScore * 100)}%</span>
                          <span>•</span>
                          <span>Thấu cảm: {Math.round(node.empathyScore * 100)}%</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono">{node.thought}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Verdict */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/30 text-xs text-white space-y-1">
                <div className="flex items-center gap-2 text-indigo-300 font-black">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kết Luận & Quyết Định Chiến Lược:</span>
                </div>
                <p className="text-[11px] text-slate-200 leading-relaxed">{deliberation.finalVerdict}</p>
              </div>

              {/* Clarification Needed if Any */}
              {deliberation.clarificationNeeded && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                  <span className="text-[10px] font-black text-amber-300 uppercase flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Câu Hỏi Làm Rõ Tinh Tế:
                  </span>
                  <div className="space-y-1">
                    {deliberation.clarificationNeeded.suggestedChoices.map((choice, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQueryInput(choice);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORKING MEMORY BUFFER */}
      {activeTab === 'working_memory' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Trí nhớ làm việc (Working Memory) mô phỏng định luật Miller (7±2 chunks) giúp Glacia duy trì sự tập trung cao độ vào các mục tiêu quan trọng nhất của doanh nghiệp, không bị phân tán bởi các tác vụ rác.
          </div>

          <div className="space-y-2">
            {memoryStore?.workingMemory.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                        item.importance === 'critical'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                      }`}
                    >
                      {item.importance}
                    </span>
                    <h4 className="text-xs font-bold text-white">{item.topic}</h4>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">{new Date(item.updatedAt).toLocaleTimeString()}</span>
                </div>
                <p className="text-[11px] text-slate-300">{item.summary}</p>
                {item.associatedFiles && item.associatedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.associatedFiles.map((f, i) => (
                      <span key={i} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CEO PERSONA & PROFILE */}
      {activeTab === 'ceo_profile' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-white">Hồ Sơ Nhà Lãnh Đạo (Executive Profile)</span>
              <span className="text-[9px] font-mono text-indigo-400 font-bold">{memoryStore?.ceoProfile.email}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <p className="text-[9px] text-slate-400">Phong cách</p>
                <p className="text-xs font-bold text-white">{memoryStore?.ceoProfile.preferences.decisionStyle}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <p className="text-[9px] text-slate-400">Ngữ điệu ưa thích</p>
                <p className="text-xs font-bold text-white">{memoryStore?.ceoProfile.preferences.preferredVoiceTone}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <p className="text-[9px] text-slate-400">Nhiệm vụ đã duyệt</p>
                <p className="text-xs font-bold text-emerald-400 font-mono">{memoryStore?.ceoProfile.stats.tasksApproved}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                <p className="text-[9px] text-slate-400">Mục tiêu đạt được</p>
                <p className="text-xs font-bold text-cyan-400 font-mono">{memoryStore?.ceoProfile.stats.goalsAchieved}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
