/**
 * useRealTimeConversation.ts
 * ═══════════════════════════════════════════════════════════════
 * Real-time Conversation Hook for AI Virtual Assistant
 * 
 * Provides complete STT → LLM → TTS pipeline with:
 * - Speech Recognition (STT)
 * - LLM Backend Integration
 * - Text-to-Speech (TTS)
 * - Emotion Detection & Mood Mapping
 * - Viseme Lip-sync Coordination
 * - Conversation State Management
 * 
 * Usage:
 *   const { startListening, stopListening, isListening, isSpeaking, conversationState } = 
 *     useRealTimeConversation({ onResponse, onError, aiBackendUrl });
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { glaciaVoice, type VoiceMoodType } from '../glaciaVoiceEngine';
import { listen as sttListen, stopSpeaking as ttsStop, isSttSupported, isTtsSupported } from '../glaciaSpeech';
import { useGlacia } from '../GlaciaContext';

// Emotion keywords for mood detection
export const EMOTION_KEYWORDS: Record<string, { mood: VoiceMoodType; score: number; keywords: string[] }[]> = {
  happy: [
    { mood: 'happy', score: 3, keywords: ['tuyệt vời', 'thANCE thành công', 'hạnh phúc', 'vui', 'hay quá', ' xuất sắc', 'hoàn hảo'] },
    { mood: 'celebrating', score: 3, keywords: ['chúc mừng', 'thành công', 'chiến thắng', 'đạt được', 'hoàn thành'] },
  ],
  sad: [
    { mood: 'thinking', score: 2, keywords: ['buồn', 'thất vọng', 'khó khăn', 'vất vả', 'mệt mỏi'] },
  ],
  angry: [
    { mood: 'alert', score: 2, keywords: ['tức giận', 'giận', 'phẫn nộ', 'không hài lòng', 'tồi tệ'] },
  ],
  curious: [
    { mood: 'curious', score: 3, keywords: ['tại sao', 'như thế nào', 'làm sao', 'cách', 'hướng dẫn', 'giải thích'] },
  ],
  thinking: [
    { mood: 'thinking', score: 2, keywords: ['suy nghĩ', 'xem xét', 'cân nhắc', 'phân tích', 'đánh giá'] },
  ],
  urgent: [
    { mood: 'alert', score: 3, keywords: ['gấp', 'khẩn cấp', 'ngay lập tức', 'quan trọng', 'cảnh báo'] },
  ],
  neutral: [
    { mood: 'idle', score: 1, keywords: ['ok', 'được', 'rồi', 'xong', 'thôi'] },
  ],
};

// Default emotion keywords flattened for fast lookup
const EMOTION_LOOKUP: Map<string, { mood: VoiceMoodType; score: number }> = new Map();
Object.values(EMOTION_KEYWORDS).forEach(group => {
  group.forEach(entry => {
    entry.keywords.forEach(kw => EMOTION_LOOKUP.set(kw.toLowerCase(), entry));
  });
});

export interface ConversationState {
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
  currentInput: string;
  currentResponse: string;
  emotion: VoiceMoodType;
  confidence: number;
  conversationId: string;
}

export interface RealTimeConversationOptions {
  /** Called when a final response is received from LLM */
  onResponse?: (response: string, emotion: VoiceMoodType) => void;
  /** Called when an interim STT result is available */
  onInterim?: (text: string) => void;
  /** Called when conversation starts */
  onStart?: () => void;
  /** Called when conversation ends */
  onEnd?: () => void;
  /** Called on any error */
  onError?: (error: Error) => void;
  /** Custom AI backend endpoint */
  aiBackendUrl?: string;
  /** Enable continuous listening */
  continuous?: boolean;
  /** Language for STT/TTS */
  language?: string;
}

export interface ConversationHistoryItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion: VoiceMoodType;
  timestamp: Date;
}

/**
 * Detect emotion from text using keyword matching
 */
export function detectEmotionFromText(text: string): { mood: VoiceMoodType; confidence: number } {
  const lowerText = text.toLowerCase();
  const emotionScores: Record<VoiceMoodType, number> = {
    idle: 0,
    happy: 0,
    curious: 0,
    thinking: 0,
    listening: 0,
    dispatching: 0,
    celebrating: 0,
    alert: 0,
    sleeping: 0,
  };

  // Split text into words and check against lookup
  const words = lowerText.split(/\s+/);
  for (const word of words) {
    const match = EMOTION_LOOKUP.get(word);
    if (match) {
      emotionScores[match.mood] += match.score;
    }
  }

  // Find the emotion with highest score
  let maxEmotion: VoiceMoodType = 'idle';
  let maxScore = 0;
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion as VoiceMoodType;
    }
  }

  // Normalize confidence to 0-1 range
  const totalMatches = Math.max(1, Object.values(emotionScores).reduce((a, b) => a + b, 0));
  const confidence = Math.min(1, maxScore / (totalMatches * 3));

  return { mood: maxEmotion, confidence };
}

/**
 * Call LLM backend with conversation context
 */
async function callLLMBackend(
  prompt: string,
  options: RealTimeConversationOptions,
  history: ConversationHistoryItem[] = []
): Promise<{ response: string; emotion: VoiceMoodType }> {
  // Build conversation context
  const contextMessages = history.slice(-10).map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  const requestBody = {
    prompt,
    context: contextMessages,
    max_tokens: 500,
    temperature: 0.7,
    // Add Glacia persona context
    system: `Bạn là Glacia - Trợ lý AI 3D thông minh và thân thiện. 
    Bạn là một Digital Human, Virtual Being với khả năng tương tác đa phương thức. 
    Hãy trả lời ngắn gọn, thoải mái, và thể hiện cảm xúc phù hợp. 
    Sử dụng tiếng Việt tự nhiên. Gọi người dùng là "Giám đốc" hoặc "Bạn".
    Nếu không biết câu trả lời, hãy nói "Glacia sẽ tìm hiểu thêm cho bạn nhé!".`,
  };

  try {
    // Use provided backend or default
    const url = options.aiBackendUrl || '/api/ai/chat';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`LLM backend error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.response || data.choices?.[0]?.text || data.output || 'Glacia không hiểu câu hỏi của bạn.';

    // Detect emotion from response
    const { mood: emotion, confidence } = detectEmotionFromText(aiResponse);

    return { response: aiResponse, emotion };
  } catch (error) {
    console.warn('LLM backend call failed, using fallback:', error);
    
    // Fallback response
    const fallbackResponses = [
      'Glacia nghe không rõ lắm, bạn có thể nói lại được không ạ?',
      'Để Glacia suy nghĩ một chút nhé...',
      'Câu hỏi của bạn thú vị quá! Glacia đang tìm hiểu thêm.',
      'Glacia sẽ hỗ trợ bạn ngay!',
    ];
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return { response: randomResponse, emotion: 'thinking' };
  }
}

/**
 * Real-time conversation hook
 */
export function useRealTimeConversation(options: RealTimeConversationOptions = {}) {
  const { 
    onResponse,
    onInterim,
    onStart,
    onEnd,
    onError,
    continuous = false,
    language = 'vi-VN',
  } = options;

  // Get Glacia context for mood integration
  const { setMood, setSpeechBubble, addTrustScore } = useGlacia();

  const [conversationState, setConversationState] = useState<ConversationState>({
    status: 'idle',
    currentInput: '',
    currentResponse: '',
    emotion: 'idle',
    confidence: 0,
    conversationId: `conv_${Date.now()}`,
  });

  const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const sttStopRef = useRef<() => void>(() => {});
  const ttsCancelRef = useRef<() => void>(() => {});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check browser support
  useEffect(() => {
    const supported = isSttSupported() && isTtsSupported();
    setIsSupported(supported);
    
    if (!supported) {
      console.warn('Real-time conversation not fully supported in this browser');
      onError?.(new Error('Speech recognition or synthesis not supported'));
    }
  }, [onError]);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      sttStopRef.current?.();
      ttsCancelRef.current?.();
      abortControllerRef.current?.abort();
    };
  }, []);

  /**
   * Detect emotion from user input
   */
  const detectUserEmotion = useCallback((text: string): VoiceMoodType => {
    const lowerText = text.toLowerCase();
    
    // Check for question -> curious
    if (lowerText.includes('?')) {
      return 'curious';
    }
    
    // Check for urgency
    if (/gấp|khẩn cấp|ngay lập tức|quan trọng/i.test(lowerText)) {
      return 'alert';
    }
    
    // Check for happiness
    if (/tuyệt vời|cảm ơn|hay|đẹp|thích|hạnh phúc/i.test(lowerText)) {
      return 'happy';
    }
    
    // Default to thinking for most inputs
    return 'thinking';
  }, []);

  /**
   * Start listening to user speech
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      onError?.(new Error('Speech recognition not supported'));
      return;
    }

    // Stop any ongoing speech
    glaciaVoice.stopSpeaking();
    ttsCancelRef.current?.();

    // Update state
    setConversationState(prev => ({
      ...prev,
      status: 'listening',
      currentInput: '',
      emotion: 'listening',
    }));

    setMood?.('listening');
    setSpeechBubble?.('Glacia đang lắng nghe... Hãy nói đi ạ!');
    addTrustScore?.(5, 'Kích hoạt đàm thoại giọng nói');

    onStart?.();

    // Start STT
    sttStopRef.current = sttListen({
      onInterim: (text) => {
        setConversationState(prev => ({
          ...prev,
          currentInput: text,
          status: 'listening',
        }));
        onInterim?.(text);
        setSpeechBubble?.(`🎙️ ${text}...`);
      },
      onFinal: async (text) => {
        if (!text.trim()) {
          stopListening();
          return;
        }

        // Detect user emotion
        const userEmotion = detectUserEmotion(text);
        
        setConversationState(prev => ({
          ...prev,
          currentInput: text,
          status: 'processing',
        }));
        setMood?.('thinking');
        setSpeechBubble?.(`Glacia đang suy nghĩ...`);

        // Add to history
        const userMessage: ConversationHistoryItem = {
          id: `user_${Date.now()}`,
          role: 'user',
          content: text,
          emotion: userEmotion,
          timestamp: new Date(),
        };
        setConversationHistory(prev => [...prev, userMessage]);

        // Call LLM backend
        try {
          const abortController = new AbortController();
          abortControllerRef.current = abortController;

          // Use existing backend integration from GlaciaContext
          // Import callAIFromSettings dynamically to avoid circular dependency
          const { callAIFromSettings } = await import('../../../utils/aiSettingsApi');
          
          // Try to use existing AI backend
          const aiResponse = await Promise.race([
            callAIFromSettings(text, 'ai-assistant', 'general'),
            new Promise<string>((resolve) => setTimeout(() => resolve('Glacia đang xử lý yêu cầu của bạn...'), 10000)),
          ]);

          const responseText = typeof aiResponse === 'string'
            ? aiResponse
            : (aiResponse.text || aiResponse.content || aiResponse.output) || 'Glacia không hiểu câu hỏi của bạn.';
          
          // Detect emotion from response
          const { mood: responseEmotion, confidence } = detectEmotionFromText(responseText);

          setConversationState(prev => ({
            ...prev,
            currentResponse: responseText,
            emotion: responseEmotion,
            confidence,
            status: 'speaking',
          }));

          // Add to history
          const assistantMessage: ConversationHistoryItem = {
            id: `assistant_${Date.now()}`,
            role: 'assistant',
            content: responseText,
            emotion: responseEmotion,
            timestamp: new Date(),
          };
          setConversationHistory(prev => [...prev, assistantMessage]);

          // Update mood and speak
          setMood?.(responseEmotion);
          setSpeechBubble?.(responseText.slice(0, 100) + (responseText.length > 100 ? '...' : ''));
          addTrustScore?.(10, 'Hội thoại AI thành công');

          // Speak the response
          ttsCancelRef.current = () => glaciaVoice.stopSpeaking();
          glaciaVoice.speak(responseText, responseEmotion, () => {
            setConversationState(prev => ({
              ...prev,
              status: continuous ? 'listening' : 'idle',
            }));
            setMood?.(continuous ? 'listening' : 'happy');
            setSpeechBubble?.(continuous ? 'Glacia đang lắng nghe...' : 'Glacia sẵn sàng hỗ trợ bạn!');
            onEnd?.();
            
            // If continuous, start listening again
            if (continuous) {
              setTimeout(startListening, 500);
            }
          });

          onResponse?.(responseText, responseEmotion);

        } catch (err) {
          if (abortControllerRef.current?.signal.aborted) return;
          
          console.error('Conversation error:', err);
          setConversationState(prev => ({
            ...prev,
            status: 'error',
          }));
          setMood?.('alert');
          setSpeechBubble?.('Có lỗi xảy ra. Glacia sẽ thử lại!');
          onError?.(err instanceof Error ? err : new Error(String(err)));
          
          // Try again after delay
          setTimeout(() => {
            setConversationState(prev => ({ ...prev, status: 'idle' }));
            setMood?.('idle');
          }, 3000);
        }
      },
      onEnd: () => {
        if (conversationState.status === 'listening') {
          stopListening();
        }
      },
      onError: (err) => {
        console.error('STT error:', err);
        setConversationState(prev => ({
          ...prev,
          status: 'error',
        }));
        setMood?.('alert');
        setSpeechBubble?.('Glacia không nghe rõ. Bạn có thể nói lại được không?');
        onError?.(err instanceof Error ? err : new Error(String(err)));
        
        setTimeout(() => {
          setConversationState(prev => ({ ...prev, status: 'idle' }));
          setMood?.('idle');
        }, 3000);
      },
    });

    return sttStopRef.current;
  }, [
    isSupported,
    conversationState,
    conversationHistory,
    continuous,
    onResponse,
    onInterim,
    onStart,
    onEnd,
    onError,
    setMood,
    setSpeechBubble,
    addTrustScore,
    detectUserEmotion,
  ]);

  /**
   * Stop listening and cancel all operations
   */
  const stopListening = useCallback(() => {
    sttStopRef.current?.();
    ttsCancelRef.current?.();
    abortControllerRef.current?.abort();
    glaciaVoice.stopSpeaking();

    setConversationState(prev => ({
      ...prev,
      status: 'idle',
    }));
    setMood?.('idle');
    onEnd?.();
  }, [onEnd, setMood]);

  /**
   * Send text directly (without STT)
   */
  const sendText = useCallback(async (text: string) => {
    if (!text.trim() || conversationState.status === 'processing') return;

    setConversationState(prev => ({
      ...prev,
      currentInput: text,
      status: 'processing',
    }));
    setMood?.('thinking');
    setSpeechBubble?.('Glacia đang suy nghĩ...');

    // Add to history
    const userMessage: ConversationHistoryItem = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      emotion: detectUserEmotion(text),
      timestamp: new Date(),
    };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const { callAIFromSettings } = await import('../../../utils/aiSettingsApi');
      
      const aiResponse = await callAIFromSettings(text, 'ai-assistant', 'general');

      const responseText = typeof aiResponse === 'string'
        ? aiResponse
        : (aiResponse.text || aiResponse.content || aiResponse.output) || 'Glacia không hiểu câu hỏi của bạn.';
      
      const { mood: responseEmotion, confidence } = detectEmotionFromText(responseText);

      setConversationState(prev => ({
        ...prev,
        currentResponse: responseText,
        emotion: responseEmotion,
        confidence,
        status: 'speaking',
      }));

      const assistantMessage: ConversationHistoryItem = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: responseText,
        emotion: responseEmotion,
        timestamp: new Date(),
      };
      setConversationHistory(prev => [...prev, assistantMessage]);

      setMood?.(responseEmotion);
      setSpeechBubble?.(responseText.slice(0, 100));
      addTrustScore?.(10, 'Hội thoại text AI thành công');

      // Speak the response
      ttsCancelRef.current = () => glaciaVoice.stopSpeaking();
      glaciaVoice.speak(responseText, responseEmotion, () => {
        setConversationState(prev => ({
          ...prev,
          status: 'idle',
        }));
        setMood?.('happy');
        onEnd?.();
      });

      onResponse?.(responseText, responseEmotion);

    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) return;
      
      console.error('Text conversation error:', err);
      setConversationState(prev => ({
        ...prev,
        status: 'error',
      }));
      setMood?.('alert');
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [
    conversationState,
    conversationHistory,
    onResponse,
    onEnd,
    onError,
    setMood,
    setSpeechBubble,
    addTrustScore,
    detectUserEmotion,
  ]);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setConversationState(prev => ({
      ...prev,
      conversationId: `conv_${Date.now()}`,
    }));
  }, []);

  /**
   * Toggle continuous listening mode
   */
  const toggleContinuous = useCallback((enabled: boolean) => {
    if (enabled && conversationState.status === 'idle') {
      startListening();
    } else if (!enabled) {
      stopListening();
    }
  }, [conversationState.status, startListening, stopListening]);

  return {
    // State
    conversationState,
    conversationHistory,
    isSupported,
    isListening: conversationState.status === 'listening',
    isSpeaking: conversationState.status === 'speaking',
    isProcessing: conversationState.status === 'processing',
    hasError: conversationState.status === 'error',
    
    // Methods
    startListening,
    stopListening,
    sendText,
    clearHistory,
    toggleContinuous,
    
    // Current data
    currentInput: conversationState.currentInput,
    currentResponse: conversationState.currentResponse,
    currentEmotion: conversationState.emotion,
    emotionConfidence: conversationState.confidence,
  };
}

/**
 * Helper to create a standalone conversation manager
 * (for use outside React components)
 */
export class ConversationManager {
  private sttStopFn: (() => void) | null = null;
  private isListening = false;
  private isSupported: boolean;
  
  constructor() {
    this.isSupported = isSttSupported() && isTtsSupported();
  }
  
  startListening(options: RealTimeConversationOptions = {}) {
    if (!this.isSupported) {
      options.onError?.(new Error('Speech recognition not supported'));
      return;
    }
    
    glaciaVoice.stopSpeaking();
    this.isListening = true;
    options.onStart?.();
    
    this.sttStopFn = sttListen({
      onInterim: options.onInterim,
      onFinal: async (text) => {
        if (!text.trim()) return;
        
        try {
          const { callAIFromSettings } = await import('../../../utils/aiSettingsApi');
          const response = await callAIFromSettings(text, 'ai-assistant', 'general');
          
          const responseText = typeof response === 'string'
            ? response
            : (response.text || response.content || response.output) || 'Glacia không hiểu.';
          const { mood } = detectEmotionFromText(responseText);
          
          glaciaVoice.speak(responseText, mood);
          options.onResponse?.(responseText, mood);
        } catch (err) {
          options.onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      },
      onEnd: () => {
        this.isListening = false;
        options.onEnd?.();
      },
      onError: options.onError
        ? (err: unknown) => options.onError!(err instanceof Error ? err : new Error(String(err)))
        : undefined,
    });
  }
  
  stopListening() {
    this.sttStopFn?.();
    this.sttStopFn = null;
    this.isListening = false;
    glaciaVoice.stopSpeaking();
  }
  
  get isActive() {
    return this.isListening;
  }
  
  get isAvailable() {
    return this.isSupported;
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();
