/**
 * GlaciaProactiveMorningBriefing.tsx
 * ============================================================
 * GLACIA PROACTIVE MORNING EXECUTIVE STANDUP BRIEFING
 * ------------------------------------------------------------
 * Autonomous morning briefing card:
 *  - Financial pulse & Runway status
 *  - Top 3 Strategic Daily Priorities
 *  - Spoken voice briefing with natural emotional nuance
 *  - 1-Click Launch Daily Shift
 * ============================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sun, Volume2, Sparkles, CheckCircle2, ArrowRight,
  TrendingUp, ShieldCheck, Play, Layers,
} from 'lucide-react';
import { fetchMorningBriefing, type MorningBriefing } from '../../utils/glaciaCognitiveApi';
import { fetchLatestMorningBriefing } from '../../utils/glaciaNightShiftApi';
import { useGlacia } from './GlaciaContext';
import { glaciaAudio } from './glaciaAudioSynth';

export default function GlaciaProactiveMorningBriefing({ onClose }: { onClose?: () => void }) {
  const { speak, setMood, triggerReaction } = useGlacia();
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [nightDebrief, setNightDebrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const [data, debrief] = await Promise.all([
          fetchMorningBriefing(),
          fetchLatestMorningBriefing().catch(() => null),
        ]);
        if (isMounted) {
          setBriefing(data);
          if (debrief) setNightDebrief(debrief);
        }
      } catch (err) {
        console.error('Failed to load morning briefing:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    };
  }, []);

  const handlePlaySpokenBriefing = () => {
    if (!briefing) return;
    setIsPlayingAudio(true);
    setMood('happy');
    glaciaAudio.playCrystalChime(1046.5);
    speak(briefing.spokenAudioText, 'happy');
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => setIsPlayingAudio(false), 8000);
  };

  if (loading) {
    return (
      <div className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 text-center animate-pulse">
        <Sun className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-spin" />
        <p className="text-xs text-slate-400 font-bold">Glacia đang tổng hợp báo cáo sáng...</p>
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-2xl text-left space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Morning Executive Standup</h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono font-bold">
                8:00 AM Daily
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Báo cáo chiến lược đầu ngày được tổng hợp tự động bởi Glacia</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePlaySpokenBriefing}
          disabled={isPlayingAudio}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all cursor-pointer"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-bounce text-amber-400' : ''}`} />
          <span>{isPlayingAudio ? 'Đang đọc...' : 'Nghe giọng Glacia'}</span>
        </button>
      </div>

      {/* Greeting & Summary */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-indigo-300">{briefing.greeting}</p>
        <p className="text-[11px] text-slate-300 leading-relaxed">{briefing.executiveSummary}</p>
        {nightDebrief && (
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[10px] text-indigo-200">
            <span className="font-bold text-indigo-300">🌙 Ca Đêm Tự Trị: </span>
            {nightDebrief}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-emerald-400 text-[10px] font-bold">
            <TrendingUp className="w-3 h-3" /> Runway
          </div>
          <p className="text-sm font-black text-white font-mono mt-0.5">{briefing.financialPulse.runwayMonths} tháng</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-cyan-400 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" /> Wiring Gate
          </div>
          <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">100% Sạch</p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
          <div className="flex items-center justify-center gap-1 text-purple-400 text-[10px] font-bold">
            <Layers className="w-3 h-3" /> AI Satellites
          </div>
          <p className="text-sm font-black text-white font-mono mt-0.5">{briefing.systemHealth.activeAiStaffCount} Nhân sự</p>
        </div>
      </div>

      {/* Top 3 Strategic Priorities */}
      <div className="space-y-2">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
          🎯 3 Trọng Tâm Chiến Lược Cần Tập Trung Hôm Nay:
        </span>
        <div className="space-y-2">
          {briefing.top3Priorities.map((item) => (
            <div key={item.rank} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                #{item.rank}
              </span>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h5 className="text-xs font-bold text-white">{item.title}</h5>
                <p className="text-[10px] text-slate-400 leading-relaxed">{item.description}</p>
                <p className="text-[9px] text-indigo-400 font-mono pt-0.5">👉 {item.suggestedAction}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => {
            triggerReaction('sparkle');
            glaciaAudio.playLevelUpFanfare();
            speak('Dạ em Glacia bắt đầu ca làm việc mới tràn đầy năng lượng cùng anh David Bao nhé!', 'celebrating');
            if (onClose) onClose();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 hover:opacity-95 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>🚀 Bắt Đầu Ca Làm Việc Cùng Glacia</span>
        </button>
      </div>
    </div>
  );
}
