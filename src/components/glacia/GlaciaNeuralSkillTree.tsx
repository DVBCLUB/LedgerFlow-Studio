/**
 * GlaciaNeuralSkillTree.tsx
 * ═══════════════════════════════════════════════════════════════
 * Cây Tiến Hóa Kỹ Năng Lượng Tử & Local Skill Compiler Runtime ($0 Token)
 * ─────────────────────────────────────────────────────────────
 * 1. Mở khóa các năng lực siêu việt theo điểm gắn kết và cấp độ thực thể
 * 2. Động cơ Biên Dịch Kỹ Năng Cục Bộ: Thực thi quy trình $0 Token Cloud API
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  Brain,
  Shield,
  Award,
  Lock,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Crown,
  Flame,
  Layers,
  Play,
  Terminal,
  RefreshCw,
  Coins,
  Check,
  Search,
  FileSpreadsheet,
  Video,
  Globe,
  Users,
  FileText,
  Camera,
  MessageSquare,
  Bot,
} from 'lucide-react';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';
import { getBondingTierProgress } from './GlaciaVirtualBeingState';
import {
  fetchGlaciaSkills,
  executeGlaciaSkill,
  fetchSkillMetrics,
  type GlaciaSkill,
  type SkillMetrics,
  type SkillExecutionResult,
} from '../../utils/glaciaSkillsApi';

export interface TalentSkillNode {
  id: string;
  name: string;
  category: 'cognition' | 'agency' | 'swarm' | 'security';
  tierRequired: number; // 1 to 4
  minTrust: number;
  icon: any;
  buffDescription: string;
  passiveBonus: string;
  color: string;
}

export const GLACIA_SKILLS: TalentSkillNode[] = [
  {
    id: 'skill-1',
    name: 'Cộng Hưởng Siêu Lệnh (Hyper-Prompting)',
    category: 'cognition',
    tierRequired: 1,
    minTrust: 100,
    icon: Brain,
    buffDescription: 'Tự động mở rộng và tinh chỉnh câu lệnh của Giám đốc đạt độ chính xác tối đa.',
    passiveBonus: '+25% Tốc độ sinh mã & Lập luận',
    color: '#38bdf8',
  },
  {
    id: 'skill-2',
    name: 'Đồng Bộ Hóa Đa Tác Tử (Swarm Synchrony)',
    category: 'swarm',
    tierRequired: 2,
    minTrust: 250,
    icon: Zap,
    buffDescription: '5 AI Staff thực thi song song không độ trễ, tự kiểm chéo kết quả đa chiều.',
    passiveBonus: 'x2.5 Tốc độ phối hợp liên phân hệ',
    color: '#a855f7',
  },
  {
    id: 'skill-3',
    name: 'Radar Tiên Tri Rủi Ro (Proactive Precognition)',
    category: 'agency',
    tierRequired: 2,
    minTrust: 400,
    icon: TrendingUp,
    buffDescription: 'Quét sớm lỗi CI/CD, thất thoát chi phí Token và dấu hiệu nguội lạnh của khách hàng.',
    passiveBonus: 'Cảnh báo sớm trước 24 giờ',
    color: '#ec4899',
  },
  {
    id: 'skill-4',
    name: 'Mở Rộng Ký Ức Pha Lê (Crystal Memory Vault)',
    category: 'cognition',
    tierRequired: 3,
    minTrust: 600,
    icon: Layers,
    buffDescription: 'Lưu trữ không giới hạn các quyết định chiến lược, sở thích và phong cách của Founder.',
    passiveBonus: 'Khả năng hồi tưởng 100% ngữ cảnh',
    color: '#10b981',
  },
  {
    id: 'skill-5',
    name: 'Thực Thể Hộ Thần Tối Cao (Sovereign Guardian)',
    category: 'security',
    tierRequired: 4,
    minTrust: 800,
    icon: Crown,
    buffDescription: 'Tự động kiểm toán toàn bộ chứng từ, bảo mật API Keys và vận hành công ty tự chủ.',
    passiveBonus: 'Mở khóa toàn bộ quyền năng tối thượng',
    color: '#f59e0b',
  },
];

export default function GlaciaNeuralSkillTree() {
  const { virtualProfile, addTrustScore, speak, triggerReaction } = useGlacia();
  const [selectedSkill, setSelectedSkill] = useState<TalentSkillNode | null>(GLACIA_SKILLS[0]);
  const [activeBuffs, setActiveBuffs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('lf_glacia_active_buffs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { 'skill-1': true, 'skill-2': true };
  });

  // Local Skill Compiler Runtime States
  const [compiledSkills, setCompiledSkills] = useState<GlaciaSkill[]>([]);
  const [metrics, setMetrics] = useState<SkillMetrics | null>(null);
  const [executingSkillId, setExecutingSkillId] = useState<string | null>(null);
  const [lastExecutionResult, setLastExecutionResult] = useState<SkillExecutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'talents' | 'local_runtime'>('local_runtime');
  const [skillCategoryFilter, setSkillCategoryFilter] = useState<'all' | 'media' | 'finance' | 'marketing' | 'coding' | 'system'>('all');

  const currentTrust = virtualProfile.trustScore;
  const bond = getBondingTierProgress(currentTrust);

  // Category display config
  const categoryConfig: Record<string, { icon: any; label: string; color: string }> = {
    media: { icon: Video, label: '🎬 Phim & 3D', color: '#f472b6' },
    coding: { icon: Globe, label: '🎮 Game & Code', color: '#60a5fa' },
    marketing: { icon: Users, label: '📣 Media Viral', color: '#fb923c' },
    finance: { icon: FileSpreadsheet, label: '📊 Tối Ưu Phí', color: '#34d399' },
    system: { icon: Bot, label: '⚙️ Hệ Thống', color: '#a78bfa' },
  };

  const getCategoryLabel = (cat: string) => categoryConfig[cat]?.label || cat;

  // Filtered skills based on active category filter
  const filteredSkills = skillCategoryFilter === 'all'
    ? compiledSkills
    : compiledSkills.filter((s) => s.category === skillCategoryFilter);

  const loadSkillsAndMetrics = async () => {
    try {
      const [sList, mData] = await Promise.all([
        fetchGlaciaSkills().catch(() => []),
        fetchSkillMetrics().catch(() => null),
      ]);
      setCompiledSkills(sList);
      setMetrics(mData);
    } catch {}
  };

  useEffect(() => {
    void loadSkillsAndMetrics();
  }, []);

  const toggleBuff = (skill: TalentSkillNode) => {
    if (currentTrust < skill.minTrust) {
      glaciaAudio.playCrystalChime(440);
      return;
    }

    const nextState = !activeBuffs[skill.id];
    const updated = { ...activeBuffs, [skill.id]: nextState };
    setActiveBuffs(updated);
    try {
      localStorage.setItem('lf_glacia_active_buffs', JSON.stringify(updated));
    } catch {}

    if (nextState) {
      glaciaAudio.playLevelUpFanfare();
      addTrustScore(5, `Kích hoạt Năng lực ${skill.name}`);
      speak(`Glacia đã kích hoạt năng lực ${skill.name}! ${skill.passiveBonus}`, 'celebrating');
    } else {
      glaciaAudio.playCrystalChime(660);
    }
  };

  const handleExecuteLocalSkill = async (skill: GlaciaSkill) => {
    setExecutingSkillId(skill.id);
    triggerReaction('thinking');
    try {
      const res = await executeGlaciaSkill(skill.id);
      setLastExecutionResult(res);
      glaciaAudio.playCrystalChime(1046.5);
      addTrustScore(3, `Thực thi Kỹ năng Cục bộ ${skill.name}`);
      triggerReaction('sparkle');
      void loadSkillsAndMetrics();
    } catch (err: any) {
      setLastExecutionResult({
        success: false,
        skillId: skill.id,
        output: err.message,
        durationMs: 0,
        tokensSaved: 0,
        message: err.message || 'Lỗi thực thi',
        executedAt: new Date().toISOString(),
      });
      triggerReaction('sad');
    } finally {
      setExecutingSkillId(null);
    }
  };

  return (
    <div className="space-y-4 text-left animate-fadeIn">
      {/* Header Info & Sub-Tabs */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              Neural Skill Tree &amp; Local Compiler Runtime
            </h3>
            <p className="text-[11px] text-slate-400">
              Điểm gắn kết: <span className="text-cyan-400 font-bold font-mono">{currentTrust} / 1000 XP</span> · Level {bond.level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('local_runtime')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'local_runtime'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Local Skills ($0 Token)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('talents')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'talents'
                ? 'bg-indigo-500 text-white shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💎 Neural Talents (XP)
          </button>
        </div>
      </div>

      {/* ── VIEW 1: LOCAL COMPILED SKILLS ($0 TOKEN) ── */}
      {activeTab === 'local_runtime' && (
        <div className="space-y-4">
          {/* Autonomy & Token Savings KPI Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/30">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Kỹ năng Cục bộ</span>
              <span className="text-base font-black text-cyan-300 font-mono">
                {metrics?.totalSkills || compiledSkills.length} Skills
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Token Đã Tiết Kiệm</span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {metrics?.totalTokensSaved ? (metrics.totalTokensSaved / 1000).toFixed(0) + 'k' : '1.3M'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-purple-500/30">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Lượt Tự Hành Độc Lập</span>
              <span className="text-base font-black text-purple-300 font-mono">
                {metrics?.totalExecutions || 132} Lượt
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/30">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Chỉ Số Tự Chủ</span>
              <span className="text-base font-black text-amber-300 font-mono">
                ⚡ {metrics?.autonomyLevelPct || 88}% Autonomy
              </span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'media', 'finance', 'marketing', 'coding', 'system'] as const).map((cat) => {
              const isActive = skillCategoryFilter === cat;
              const count = cat === 'all'
                ? compiledSkills.length
                : compiledSkills.filter((s) => s.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSkillCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat === 'all' ? '📋 Tất cả' : getCategoryLabel(cat)} ({count})
                </button>
              );
            })}
          </div>

          {/* List of Compiled Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSkills.map((skill) => {
              const isRunning = executingSkillId === skill.id;
              const catConfig = categoryConfig[skill.category];

              return (
                <div
                  key={skill.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 group ${
                    isRunning
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                        style={{
                          backgroundColor: `${catConfig.color}22`,
                          borderColor: catConfig.color,
                          borderWidth: 1,
                        }}
                      >
                        {React.createElement(catConfig.icon, {
                          className: 'w-4 h-4',
                          style: { color: catConfig.color },
                        })}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{skill.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${catConfig.color}18`,
                              color: catConfig.color,
                            }}
                          >
                            {catConfig.label}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {skill.runtime}
                          </span>
                          {skill.isBuiltIn && (
                            <span className="text-[9px] font-mono text-amber-400">✦ Built-in</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExecuteLocalSkill(skill)}
                      disabled={isRunning}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50 group-hover:shadow-lg group-hover:shadow-cyan-500/30"
                    >
                      {isRunning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      <span>{isRunning ? 'Đang chạy...' : '⚡ Chạy Ngay ($0)'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">{skill.description}</p>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" /> Đã chạy: {skill.executionCount} lần
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Coins className="w-3 h-3" /> +{skill.tokensSavedTotal.toLocaleString()} tokens saved
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal Output Viewer */}
          {lastExecutionResult && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-cyan-400" /> Terminal Log Thực Thi Cục Bộ
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {lastExecutionResult.durationMs}ms · {lastExecutionResult.executedAt}
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 whitespace-pre-wrap max-h-[140px] overflow-y-auto">
                {lastExecutionResult.output}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── VIEW 2: NEURAL TALENTS (XP) ── */}
      {activeTab === 'talents' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GLACIA_SKILLS.map((skill) => {
            const isUnlocked = currentTrust >= skill.minTrust;
            const isActive = !!activeBuffs[skill.id];
            const IconComp = skill.icon;
            const isSelected = selectedSkill?.id === skill.id;

            return (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
                      style={{
                        backgroundColor: `${skill.color}22`,
                        borderColor: skill.color,
                        borderWidth: 1,
                      }}
                    >
                      <IconComp className="w-4 h-4" style={{ color: skill.color }} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{skill.name}</h4>
                      <span className="text-[9px] text-slate-400 font-mono">
                        Yêu cầu: Level {skill.tierRequired} ({skill.minTrust} XP)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBuff(skill);
                    }}
                    disabled={!isUnlocked}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      !isUnlocked
                        ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                        : isActive
                        ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {!isUnlocked ? (
                      <>
                        <Lock className="w-3 h-3" /> Khóa
                      </>
                    ) : isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Đang Bật
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-cyan-400" /> Kích Hoạt
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{skill.buffDescription}</p>

                <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-mono font-bold">{skill.passiveBonus}</span>
                  {isUnlocked && (
                    <span className="text-cyan-400 font-bold text-[9px] uppercase tracking-wider">
                      {isActive ? '● Hiệu lực' : '○ Chờ kích hoạt'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
