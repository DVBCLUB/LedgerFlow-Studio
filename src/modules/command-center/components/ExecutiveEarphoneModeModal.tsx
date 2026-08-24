import React, { useState, useEffect } from 'react';
import { Headphones, Mic, MicOff, Volume2, Sparkles, X, CheckCircle2, Play, Pause, Activity } from 'lucide-react';
import { parseExecutiveVoiceCommand, type VoiceIntentResult } from '../../../../server/services/executiveVoiceEarphoneEngine';

interface ExecutiveEarphoneModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExecutiveEarphoneModeModal({ isOpen, onClose }: ExecutiveEarphoneModeModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResult, setLastResult] = useState<VoiceIntentResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Suggested commands for 1-tap test
  const sampleCommands = [
    'Báo cáo doanh thu 24h qua',
    'Giao ban sáng Ban Điều hành AI',
    'Duyệt tất cả bản build và kịch bản video',
    'Chạy robot quét dọn ban đêm',
  ];

  const handleSpeakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.05;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleProcessCommand = (text: string) => {
    setTranscript(text);
    const result = parseExecutiveVoiceCommand(text);
    setLastResult(result);
    handleSpeakText(result.spokenAudioFeedbackVi);
  };

  const handleToggleMic = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      handleProcessCommand('Báo cáo doanh thu 24h qua');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const spoken = event.results?.[0]?.[0]?.transcript;
        if (spoken) {
          handleProcessCommand(spoken);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in text-left">
      <div className="relative w-full max-w-lg rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950/70 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Headphones className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Chế Độ Tai Nghe Điều Hành (Earphone Mode)</h3>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                  Hands-Free Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-semibold">
                Điều hành công ty qua giọng nói tiếng Việt khi đang đi bộ hoặc di chuyển.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Central Audio Waveform & Mic Circle */}
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <button
            type="button"
            onClick={handleToggleMic}
            className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300 shadow-2xl cursor-pointer ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105'
            }`}
          >
            {isListening ? <Mic className="h-10 w-10" /> : <MicOff className="h-10 w-10" />}
          </button>

          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
            {isListening ? '🎙️ Đang lắng nghe giọng nói...' : isSpeaking ? '🔊 Đang trả lời qua giọng nói...' : 'Nhấn để nói hoặc chọn mẫu câu bên dưới'}
          </span>

          {transcript && (
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bạn vừa nói:</span>
              <p className="text-xs font-bold text-white mt-0.5">"{transcript}"</p>
            </div>
          )}
        </div>

        {/* Spoken Feedback Card */}
        {lastResult && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Phản xạ AI ({Math.round(lastResult.confidence * 100)}% khớp)
              </span>
              <button
                type="button"
                onClick={() => handleSpeakText(lastResult.spokenAudioFeedbackVi)}
                className="text-[11px] text-indigo-300 hover:text-white flex items-center gap-1 bg-indigo-500/20 px-2 py-0.5 rounded cursor-pointer"
              >
                <Volume2 className="w-3 h-3" /> Nghe lại
              </button>
            </div>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {lastResult.spokenAudioFeedbackVi}
            </p>
          </div>
        )}

        {/* Fast Sample Taps */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Hoặc chạm nhanh lệnh mẫu:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {sampleCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => handleProcessCommand(cmd)}
                className="text-left text-[11px] font-semibold text-slate-300 bg-slate-900/80 hover:bg-indigo-900/40 border border-slate-800 hover:border-indigo-500/40 p-2.5 rounded-xl transition-all cursor-pointer truncate"
              >
                ⚡ {cmd}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
