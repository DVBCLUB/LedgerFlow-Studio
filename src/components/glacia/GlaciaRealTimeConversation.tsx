/**
 * GlaciaRealTimeConversation.tsx
 * ═══════════════════════════════════════════════════════════════
 * Real-time AI Virtual Assistant Conversation Interface
 * 
 * Features:
 * - STT (Speech-to-Text) with Web Speech API
 * - LLM Backend Integration (callAIFromSettings)
 * - TTS (Text-to-Speech) with emotion modulation
 * - Emotion Detection & Mood Mapping
 * - Viseme Lip-sync Coordination
 * - Conversation History with Memory
 * - Gesture System (future: camera tracking)
 * - Streaming Response Support
 * 
 * Usage:
 *   <GlaciaRealTimeConversation 
 *     onClose={() => setShowConversation(false)} 
 *     onMinimize={() => setMinimized(true)} 
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Send, X, Volume2, VolumeX, Loader2, Sparkles, History, Trash2, User, Bot, Heart, Zap, Play, Pause, Brain } from 'lucide-react';
import { useRealTimeConversation, detectEmotionFromText, type ConversationHistoryItem } from './hooks/useRealTimeConversation';
import { useGlacia } from './GlaciaContext';
import { glaciaVoice, type VoiceMoodType } from './glaciaVoiceEngine';
import { glaciaAudio } from './glaciaAudioSynth';
import GlaciaReal3DAvatar from './GlaciaReal3DAvatar';
import CustomGLBAvatar from './CustomGLBAvatar';

interface GlaciaRealTimeConversationProps {
  onClose?: () => void;
  onMinimize?: () => void;
  className?: string;
  showAvatar?: boolean;
  compactMode?: boolean;
}

// Emotion to color mapping
const EMOTION_COLORS: Record<VoiceMoodType, string> = {
  idle: 'text-cyan-300',
  happy: 'text-emerald-300',
  curious: 'text-purple-300',
  thinking: 'text-indigo-300',
  listening: 'text-rose-300',
  dispatching: 'text-blue-300',
  celebrating: 'text-yellow-300',
  alert: 'text-red-300',
  sleeping: 'text-slate-400',
};

// Emotion to background gradient
const EMOTION_GRADIENTS: Record<VoiceMoodType, string> = {
  idle: 'from-cyan-950/60 to-slate-900',
  happy: 'from-emerald-950/60 to-slate-900',
  curious: 'from-purple-950/60 to-slate-900',
  thinking: 'from-indigo-950/60 to-slate-900',
  listening: 'from-rose-950/60 to-slate-900',
  dispatching: 'from-blue-950/60 to-slate-900',
  celebrating: 'from-yellow-950/60 to-slate-900',
  alert: 'from-red-950/60 to-slate-900',
  sleeping: 'from-slate-900 to-slate-950',
};

// Emotion icons
const EMOTION_ICONS: Record<VoiceMoodType, React.ReactNode> = {
  idle: <Sparkles className="w-4 h-4" />,
  happy: <Heart className="w-4 h-4" />,
  curious: <Zap className="w-4 h-4" />,
  thinking: <Brain className="w-4 h-4" />,
  listening: <Mic className="w-4 h-4" />,
  dispatching: <Play className="w-4 h-4" />,
  celebrating: <Sparkles className="w-4 h-4" />,
  alert: <Zap className="w-4 h-4" />,
  sleeping: <Pause className="w-4 h-4" />,
};

export default function GlaciaRealTimeConversation({
  onClose,
  onMinimize,
  className = '',
  showAvatar = true,
  compactMode = false,
}: GlaciaRealTimeConversationProps) {
  // Use the real-time conversation hook
  const {
    conversationState,
    conversationHistory,
    isSupported,
    isListening,
    isSpeaking,
    isProcessing,
    hasError,
    startListening,
    stopListening,
    sendText,
    clearHistory,
    currentInput,
    currentResponse,
    currentEmotion,
    emotionConfidence,
  } = useRealTimeConversation({
    continuous: false,
    onStart: () => {
      glaciaAudio.playHologramScan();
    },
    onEnd: () => {
      glaciaAudio.playCrystalChime(1318.5);
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      glaciaAudio.playSecurityScanTone();
    },
  });

  // Get Glacia context
  const {
    mood,
    setMood,
    setSpeechBubble,
    voiceEnabled,
    setVoiceEnabled,
    addTrustScore,
    avatarModelType,
    setAvatarModelType,
  } = useGlacia();

  const [inputText, setInputText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [avatarScale, setAvatarScale] = useState(compactMode ? 0.7 : 1);
  
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync mood with conversation emotion
  useEffect(() => {
    if (currentEmotion && currentEmotion !== 'listening') {
      setMood?.(currentEmotion as any);
    }
  }, [currentEmotion, setMood]);

  // Sync speech bubble with current input/response
  useEffect(() => {
    if (isListening && currentInput) {
      setSpeechBubble?.(`🎙️ ${currentInput}...`);
    } else if (isSpeaking && currentResponse) {
      setSpeechBubble?.(currentResponse.slice(0, 80) + (currentResponse.length > 80 ? '...' : ''));
    } else if (isProcessing) {
      setSpeechBubble?.('Glacia đang suy nghĩ...');
    }
  }, [isListening, isSpeaking, isProcessing, currentInput, currentResponse, setSpeechBubble]);

  // Auto-focus input when not listening
  useEffect(() => {
    if (!isListening && !isSpeaking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isListening, isSpeaking]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
      // Enter to send (when not listening)
      if (e.key === 'Enter' && !e.shiftKey && !isListening && !isSpeaking && inputText.trim()) {
        e.preventDefault();
        handleSend();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, isSpeaking, inputText, onClose]);

  // Toggle fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    return () => {
      document.exitFullscreen?.();
    };
  }, [isFullscreen]);

  // Calculate conversation stats
  const userMessages = conversationHistory.filter(m => m.role === 'user');
  const assistantMessages = conversationHistory.filter(m => m.role === 'assistant');

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await sendText(text);
      addTrustScore?.(15, 'Hội thoại text AI thực thời');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartListening = () => {
    if (!isSupported) {
      glaciaAudio.playSecurityScanTone();
      return;
    }
    startListening();
    addTrustScore?.(5, 'Kích hoạt giọng nói thực thời');
  };

  const handleStopListening = () => {
    stopListening();
  };

  const handleClearHistory = () => {
    clearHistory();
    setInputText('');
    glaciaAudio.playCrystalChime(880);
  };

  const toggleVoice = () => {
    const enabled = !voiceEnabled;
    setVoiceEnabled?.(enabled);
    if (!enabled) {
      glaciaVoice.stopSpeaking();
      stopListening();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Format message timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 ${className}`}
      style={{ background: 'rgba(5, 11, 20, 0.95)' }}
    >
      {/* Fullscreen Avatar Mode */}
      {isFullscreen && showAvatar && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-8">
            {avatarModelType === 'custom_glb' ? (
              <CustomGLBAvatar
                interactive={true}
                scale={1.4}
              />
            ) : (
              <GlaciaReal3DAvatar
                interactive={true}
                scale={1.5}
                showHUDs={false}
                compactMode={false}
              />
            )}
          </div>
        </div>
      )}

      {/* Conversation Container */}
      <div
        className={`relative w-full max-w-4xl h-[90vh] max-h-[800px] bg-gradient-to-b ${EMOTION_GRADIENTS[currentEmotion || mood] || EMOTION_GRADIENTS.idle} border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden`}
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-cyan-400 p-0.5 bg-cyan-950/60 shadow-lg shadow-cyan-500/20">
                <img src="/glacia-avatar.png" alt="Glacia" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black tracking-wide text-white flex items-center gap-1.5">
                  GLACIA <span className="text-cyan-400 font-mono text-xs font-normal">REAL-TIME AVATAR</span>
                </h2>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${emotionConfidence > 0.7 ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300' : emotionConfidence > 0.4 ? 'bg-amber-500/20 border-amber-400/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-400'} font-bold`}>
                  Cảm xúc: {(currentEmotion || mood).toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap mt-0.5">
                <span className={EMOTION_COLORS[currentEmotion || mood]}>{currentEmotion || mood}</span>
                <span>•</span>
                <span>Tin cậy: {(emotionConfidence * 100).toFixed(0)}%</span>
                <span>•</span>
                <span className="font-mono">{userMessages.length} Mariano - {assistantMessages.length} Glacia</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Voice Toggle */}
            <button
              onClick={toggleVoice}
              className={`p-2 rounded-xl border transition-all ${
                voiceEnabled
                  ? 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
                  : 'bg-slate-900 border-white/10 text-slate-500 hover:text-slate-300'
              }`}
              title={voiceEnabled ? 'Tắt giọng nói' : 'Bật giọng nói'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl border transition-all ${
                showHistory
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20'
              }`}
              title="Xem lịch sử đàm thoại"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              disabled={conversationHistory.length === 0}
              className="p-2 rounded-xl bg-slate-900/80 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Xóa lịch sử"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - 3D Avatar (only in non-fullscreen mode) */}
          {!isFullscreen && showAvatar && (
            <div className="hidden lg:flex lg:w-64 flex-col items-center justify-between p-4 border-r border-cyan-500/20 bg-gradient-to-b from-slate-900/80 to-black">
              <div className="w-full flex items-center justify-between text-[11px] text-cyan-300/80">
                <span className="flex items-center gap-1 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 3D WebGL Avatar
                </span>
                <span className="font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">60 FPS</span>
              </div>

              {/* Avatar Switcher */}
              <div className="w-full my-2 flex items-center justify-center gap-1 p-0.5 bg-slate-950/60 border border-cyan-500/30 rounded-lg text-[9px]">
                <button
                  onClick={() => setAvatarModelType('custom_glb')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    avatarModelType === 'custom_glb' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  🤖 GLB
                </button>
                <button
                  onClick={() => setAvatarModelType('procedural_glacia')}
                  className={`px-2 py-0.5 rounded font-medium transition-all ${
                    avatarModelType === 'procedural_glacia' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                  }`}
                >
                  ✨ Glacia
                </button>
              </div>

              {/* 3D Avatar */}
              <div className="flex-1 flex items-center justify-center w-full min-h-[220px]">
                {avatarModelType === 'custom_glb' ? (
                  <CustomGLBAvatar
                    interactive={true}
                    scale={avatarScale}
                    compactMode={true}
                  />
                ) : (
                  <GlaciaReal3DAvatar
                    interactive={true}
                    scale={avatarScale}
                    showHUDs={false}
                    compactMode={false}
                  />
                )}
              </div>

              {/* Avatar Controls */}
              <div className="w-full flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <button
                  onClick={() => setAvatarScale(Math.max(0.5, avatarScale - 0.1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                >
                  - Phóng to
                </button>
                <span className="font-mono text-cyan-300">{Math.round(avatarScale * 100)}%</span>
                <button
                  onClick={() => setAvatarScale(Math.min(1.5, avatarScale + 0.1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                >
                  + Thu nhỏ
                </button>
              </div>
            </div>
          )}

          {/* Right Panel - Conversation */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Status Indicator */}
            <div className="px-5 py-2 border-b border-slate-800">
              {isListening ? (
                <div className="flex items-center gap-2 text-xs text-rose-300 animate-pulse">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Đang nghe... Nói đi ạ!</span>
                </div>
              ) : isSpeaking ? (
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Glacia đang nói...</span>
                </div>
              ) : isProcessing ? (
                <div className="flex items-center gap-2 text-xs text-amber-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Glacia đang suy nghĩ...</span>
                </div>
              ) : hasError ? (
                <div className="flex items-center gap-2 text-xs text-red-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Có lỗi xảy ra. Thử lại nhé!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-cyan-300">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Sẵn sàng đàm thoại. Nhấn Mic hoặc nhập text...</span>
                </div>
              )}
            </div>

            {/* Conversation History */}
            {showHistory && conversationHistory.length > 0 && (
              <div className="px-5 py-3 border-b border-slate-800 overflow-y-auto max-h-[200px]">
                <div className="space-y-3">
                  {conversationHistory.slice().reverse().map((msg, index) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-cyan-400 shrink-0 shadow-md flex items-center justify-center bg-cyan-950/60">
                          <Bot className="w-3 h-3 text-cyan-300" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-xl p-2.5 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-cyan-900/80 border border-cyan-500/30 text-cyan-100 rounded-br-none'
                            : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-between text-[9px] opacity-60 mt-1">
                          <span>{formatTime(msg.timestamp)}</span>
                          <span className="font-mono">
                            {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                          </span>
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-700 shrink-0 shadow-md">
                          <img src="/glacia-avatar.png" alt="User" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Input Display (when listening) */}
            {isListening && currentInput && (
              <div className="px-5 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-400" />
                  <span className="text-xs text-rose-300 italic">Bạn: {currentInput}</span>
                </div>
              </div>
            )}

            {/* Current Response Display (when speaking) */}
            {isSpeaking && currentResponse && (
              <div className="px-5 py-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-300 italic">Glacia: {currentResponse.slice(0, 100)}{currentResponse.length > 100 ? '...' : ''}</span>
                </div>
              </div>
            )}

            {/* Chat Input Area */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/40 flex items-center gap-2">
              {/* Voice Button */}
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isSpeaking || isProcessing}
                className={`p-2.5 rounded-xl transition-all shadow-md ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-rose-500/20'
                    : 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 hover:from-cyan-400 hover:to-indigo-400'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isListening ? 'Dừng nghe' : 'Bắt đầu nghe'}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isListening && !isSpeaking && inputText.trim()) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isListening ? "Glacia đang nghe..." : "Hỏi Glacia bất cứ điều gì..."}
                disabled={isListening || isSpeaking}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 disabled:opacity-70 disabled:cursor-not-allowed"
              />

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || isListening || isSpeaking || isProcessing}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-400 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div ref={chatBottomRef} />
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="px-5 py-2 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="font-mono">
              {isSupported ? (
                <span className="text-emerald-400">✓ STT & TTS Sẵn sàng</span>
              ) : (
                <span className="text-rose-400">✗ Không hỗ trợ giọng nói</span>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span>Alt+G: Mở Cockpit • Esc: Đóng</span>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Overlay */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Alt</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">G</kbd> Mở Cockpit • 
        <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Esc</kbd> Đóng
      </div>
    </div>
  );
}

// Export for easy usage
export { GlaciaRealTimeConversation };
