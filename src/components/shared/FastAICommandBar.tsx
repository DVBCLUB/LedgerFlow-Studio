import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Send, X, Bot, CheckCircle2 } from 'lucide-react';

export default function FastAICommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Shift+Space shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.code === 'Space') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setStatusMessage(`Đã gửi lệnh tới Đội ngũ AI Staff: "${prompt}"`);
    setPrompt('');
    setTimeout(() => {
      setStatusMessage(null);
      setIsOpen(false);
    }, 1800);
  };

  const toggleVoice = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      setPrompt('AI Media, render 3 clip TikTok review Game mới...');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-2xl shadow-2xl overflow-hidden p-4 space-y-3">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Fast AI Command Bar (Solo Founder Prompt)</span>
            <span className="text-[10px] bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 font-mono">Shift+Space</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleDispatch} className="relative flex items-center gap-2">
          <Bot className="absolute left-3 w-4 h-4 text-indigo-400" />
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder='Gõ lệnh hoặc nói: "AI Media, render 3 clip TikTok Game mới"...'
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-24 py-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />

          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Giao tiếp giọng nói"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg text-xs font-bold transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {statusMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
