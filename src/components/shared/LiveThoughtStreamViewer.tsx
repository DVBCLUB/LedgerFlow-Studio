import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Pause, RotateCcw, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export interface ThoughtStep {
  stepNumber: number;
  thought: string;
  action?: string;
  timestamp: string;
}

export interface LiveThoughtStreamViewerProps {
  streamUrl?: string;
  initialPrompt?: string;
  onComplete?: (finalOutput: string) => void;
}

export default function LiveThoughtStreamViewer({
  streamUrl = '/api/ai/gemini/reasoning/stream',
  initialPrompt = 'Lập kế hoạch phân bổ nguồn lực Q3 và kiểm soát chi phí Token...',
  onComplete,
}: LiveThoughtStreamViewerProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isStreaming, setIsStreaming] = useState(false);
  const [thoughts, setThoughts] = useState<ThoughtStep[]>([]);
  const [summary, setSummary] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const startStream = async () => {
    if (!prompt.trim() || isStreaming) return;
    setIsStreaming(true);
    setThoughts([]);
    setSummary('');

    try {
      const res = await fetch(streamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, thinkingBudgetTokens: 1024 }),
      });
      const data = await res.json();
      if (data.success && data.trajectory) {
        const traj = data.trajectory;
        setThoughts(traj.steps || []);
        setSummary(traj.finalSynthesis || 'Đã hoàn thành phân tích luồng tư duy reasoning.');
        onComplete?.(traj.finalSynthesis || '');
      }
    } catch {
      // Fallback
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thoughts]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/90 text-slate-100 overflow-hidden shadow-2xl">
      {/* Top terminal bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          <span className="text-xs font-mono text-slate-400 ml-2 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Gemini 2.0 Flash Thinking CoT Stream
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              STREAMING...
            </span>
          )}
        </div>
      </div>

      {/* Input Prompt bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-3">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập yêu cầu để AI thực hiện CoT Reasoning..."
          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
        />
        <button
          onClick={startStream}
          disabled={isStreaming}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-cyan-500/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Chạy Stream
        </button>
      </div>

      {/* Live Feed Output */}
      <div className="p-4 font-mono text-xs space-y-3 max-h-80 overflow-y-auto">
        {thoughts.length === 0 && !summary && (
          <div className="text-slate-500 text-center py-8 italic flex flex-col items-center gap-2">
            <Terminal className="w-6 h-6 text-slate-600" />
            Nhấn "Chạy Stream" để quan sát các bước suy luận DeepMind Reasoning thời gian thực.
          </div>
        )}

        {thoughts.map((step, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1 animate-fade-in">
            <div className="flex items-center justify-between text-[11px] text-cyan-400">
              <span className="font-bold">Bước {step.stepNumber}</span>
              <span className="text-slate-500">{new Date(step.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{step.thought}</p>
            {step.action && (
              <div className="mt-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded inline-block border border-emerald-500/20">
                Action: {step.action}
              </div>
            )}
          </div>
        ))}

        {summary && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Kết luận tổng hợp:
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">{summary}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
