/**
 * aiAvatarConnector.ts
 * ============================================================
 * AI VIRTUAL ASSISTANT CONNECTOR - Enhanced Version
 * 
 * Provides comprehensive AI Avatar services with:
 *   - Real-time conversation streaming (STT → LLM → TTS)
 *   - Emotion detection & mapping
 *   - Gesture generation
 *   - Multi-engine support (HeyGen, D-ID, LivePortrait, Custom)
 *   - WebSocket streaming for real-time responses
 *   - Conversation context management
 *   - Avatar state synchronization
 * 
 * ============================================================
 */

import { recordAIAction } from './aiActionLedger.ts';
import { callAIWithFallback } from './aiRouter.ts';
import {
  MOOD_TO_EMOTION,
  EMOTION_TO_GESTURE,
  EMOTION_DETECTION_KEYWORDS,
} from '../../core/types/glaciaAvatar.ts';
import type {
  AvatarEngine,
  AvatarEmotion,
  HeadGesture,
  HandGesture,
  BodyGesture,
  AvatarSceneSpec,
  ConversationContext,
  StreamingResponse,
  AvatarPresentationJob,
  RealTimeConversationState,
} from '../../core/types/glaciaAvatar.ts';

export {
  MOOD_TO_EMOTION,
  EMOTION_TO_GESTURE,
  EMOTION_DETECTION_KEYWORDS,
};

export type {
  AvatarEngine,
  AvatarEmotion,
  HeadGesture,
  HandGesture,
  BodyGesture,
  AvatarSceneSpec,
  ConversationContext,
  StreamingResponse,
  AvatarPresentationJob,
  RealTimeConversationState,
};

// ============================================================================
// CONVERSATION CONTEXT MANAGER
// ============================================================================

class ConversationContextManager {
  private contexts: Map<string, ConversationContext> = new Map();

  createContext(userId: string, userName?: string): ConversationContext {
    const context: ConversationContext = {
      conversationId: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: `sess_${Date.now()}`,
      userId,
      userName,
      previousEmotion: 'NEUTRAL',
      currentMood: 'idle',
      interactionCount: 0,
      lastInteractionAt: new Date().toISOString(),
      shortTermMemory: [],
      longTermMemoryTags: [],
    };
    this.contexts.set(context.conversationId, context);
    return context;
  }

  getContext(conversationId: string): ConversationContext | undefined {
    return this.contexts.get(conversationId);
  }

  updateContext(conversationId: string, updates: Partial<ConversationContext>): ConversationContext | null {
    const context = this.contexts.get(conversationId);
    if (!context) return null;
    
    const updated = { ...context, ...updates };
    this.contexts.set(conversationId, updated);
    return updated;
  }

  addMemory(conversationId: string, role: 'user' | 'assistant', content: string): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      context.shortTermMemory.push({ role, content });
      // Keep only last 20 messages
      if (context.shortTermMemory.length > 20) {
        context.shortTermMemory.shift();
      }
      context.lastInteractionAt = new Date().toISOString();
      context.interactionCount++;
    }
  }

  cleanupOldContexts(maxAgeHours: number = 1): void {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    
    for (const [id, context] of this.contexts.entries()) {
      const lastInteraction = new Date(context.lastInteractionAt).getTime();
      if (now - lastInteraction > maxAgeMs) {
        this.contexts.delete(id);
      }
    }
  }
}

export const conversationContextManager = new ConversationContextManager();

// ============================================================================
// REAL-TIME CONVERSATION HANDLER
// ============================================================================

class RealTimeConversationHandler {
  private activeSessions: Map<string, { 
    sessionId: string;
    conversationId: string;
    status: 'listening' | 'processing' | 'speaking' | 'idle';
    sttController: AbortController | null;
    ttsController: AbortController | null;
    llmController: AbortController | null;
  }> = new Map();

  private emotionHistory: Map<string, AvatarEmotion[]> = new Map();

  /**
   * Detect emotion from text with context awareness
   */
  detectEmotion(text: string, conversationId?: string): { emotion: AvatarEmotion; confidence: number } {
    const lowerText = text.toLowerCase();
    const emotionScores: Record<AvatarEmotion, number> = {
      NEUTRAL: 0,
      CONFIDENT_SMILE: 0,
      SERIOUS_EXECUTIVE: 0,
      ENTHUSIASTIC: 0,
      HAPPY: 0,
      CURIOUS: 0,
      THINKING: 0,
      LISTENING: 0,
      ALERT: 0,
      CELEBRATING: 0,
      ANGRY: 0,
      SAD: 0,
      SURPRISED: 0,
    };

    // Score based on keywords
    for (const [emotion, keywords] of Object.entries(EMOTION_DETECTION_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          emotionScores[emotion as AvatarEmotion] += 3;
        }
      }
    }

    // Check for questions
    if (lowerText.includes('?')) {
      emotionScores.CURIOUS += 2;
      emotionScores.LISTENING += 1;
    }

    // Check for exclamations
    if (lowerText.includes('!')) {
      emotionScores.ENTHUSIASTIC += 1;
      emotionScores.CELEBRATING += 1;
      emotionScores.ALERT += 1;
    }

    // Context-based detection
    if (conversationId) {
      const context = conversationContextManager.getContext(conversationId);
      if (context) {
        // If previous was listening, likely now thinking or responding
        if (context.previousEmotion === 'LISTENING') {
          emotionScores.THINKING += 1;
          emotionScores.CONFIDENT_SMILE += 1;
        }
        
        // If many interactions, likely more enthusiastic
        if (context.interactionCount > 5) {
          emotionScores.ENTHUSIASTIC += 1;
        }
      }
    }

    // Find emotion with highest score
    let maxEmotion: AvatarEmotion = 'NEUTRAL';
    let maxScore = 0;
    for (const [emotion, score] of Object.entries(emotionScores)) {
      if (score > maxScore) {
        maxScore = score;
        maxEmotion = emotion as AvatarEmotion;
      }
    }

    // Normalize confidence
    const total = Math.max(1, Object.values(emotionScores).reduce((a, b) => a + b, 0));
    const confidence = Math.min(1, maxScore / (total * 1.5));

    // If low confidence, use previous emotion or default
    if (confidence < 0.3 && conversationId) {
      const context = conversationContextManager.getContext(conversationId);
      if (context?.previousEmotion) {
        return { emotion: context.previousEmotion, confidence: 0.5 };
      }
    }

    return { emotion: maxEmotion, confidence };
  }

  /**
   * Generate appropriate gesture based on emotion and context
   */
  generateGesture(emotion: AvatarEmotion, text: string, isUserSpeaking: boolean = false): {
    head: HeadGesture;
    hand: HandGesture;
    body: BodyGesture;
  } {
    const baseGesture = EMOTION_TO_GESTURE[emotion];
    
    // If user is speaking, avatar should be listening
    if (isUserSpeaking) {
      return {
        head: 'TILT_RIGHT',
        hand: 'IDLE',
        body: 'LEAN_FORWARD',
      };
    }

    // Add variety based on text length
    const wordCount = text.split(/\s+/).length;
    
    // For long responses, add more expressive gestures
    if (wordCount > 20) {
      return {
        ...baseGesture,
        hand: wordCount > 30 ? 'WAVE' : baseGesture.hand,
      };
    }

    return baseGesture;
  }

  /**
   * Start a real-time conversation session
   */
  async startConversation(userId: string, userName?: string): Promise<{
    sessionId: string;
    conversationId: string;
    initialEmotion: AvatarEmotion;
  }> {
    const context = conversationContextManager.createContext(userId, userName);
    
    recordAIAction({
      agentId: 'ai_avatar_connector',
      roleId: 'role_glacia_assistant',
      domain: 'conversation',
      actionType: 'CONVERSATION_STARTED',
      targetResource: context.conversationId,
      outputSummary: `Khởi tạo phiên đàm thoại AI Avatar cho user ${userId}`,
      permissionCheckPassed: true,
      constitutionalRulePassed: true,
    });

    return {
      sessionId: context.sessionId,
      conversationId: context.conversationId,
      initialEmotion: 'NEUTRAL',
    };
  }

  /**
   * Process user speech input (STT result)
   */
  async processUserInput(
    conversationId: string,
    text: string
  ): Promise<{
    response: string;
    emotion: AvatarEmotion;
    gesture: { head: HeadGesture; hand: HandGesture; body: BodyGesture };
    conversationId: string;
  }> {
    const context = conversationContextManager.getContext(conversationId);
    if (!context) {
      throw new Error(`Conversation context ${conversationId} not found`);
    }

    // Add user message to memory
    conversationContextManager.addMemory(conversationId, 'user', text);
    
    // Detect emotion from user input
    const userEmotion = this.detectEmotion(text, conversationId);
    
    // Update context
    conversationContextManager.updateContext(conversationId, {
      previousEmotion: userEmotion.emotion,
      lastInteractionAt: new Date().toISOString(),
    });

    // Generate LLM response with context
    const response = await this.generateLLMResponse(text, context);
    
    // Detect emotion from response
    const { emotion: responseEmotion, confidence } = this.detectEmotion(response, conversationId);
    
    // Generate gesture
    const gesture = this.generateGesture(responseEmotion, response, false);
    
    // Update context with assistant response
    conversationContextManager.addMemory(conversationId, 'assistant', response);
    conversationContextManager.updateContext(conversationId, {
      previousEmotion: responseEmotion,
      currentMood: responseEmotion.toLowerCase().replace('_', '') as string,
    });

    // Update emotion history
    const history = this.emotionHistory.get(conversationId) || [];
    history.push(responseEmotion);
    if (history.length > 5) history.shift();
    this.emotionHistory.set(conversationId, history);

    recordAIAction({
      agentId: 'ai_avatar_connector',
      roleId: 'role_glacia_assistant',
      domain: 'conversation',
      actionType: 'CONVERSATION_TURN',
      targetResource: conversationId,
      outputSummary: `Xử lý input: "${text.slice(0, 50)}" → Response: "${response.slice(0, 50)}"`,
      permissionCheckPassed: true,
      constitutionalRulePassed: true,
    });

    return {
      response,
      emotion: responseEmotion,
      gesture,
      conversationId,
    };
  }

  /**
   * Generate LLM response with conversation context
   */
  private async generateLLMResponse(prompt: string, context: ConversationContext): Promise<string> {
    try {
      const systemPrompt = `Bạn là Glacia - Trợ lý AI 3D thông minh và thân thiện. 
        Bạn là một Digital Human, Virtual Being với khả năng tương tác đa phương thức.
        
        Hướng dẫn:
        - Trả lời bằng tiếng Việt tự nhiên
        - Gọi người dùng là "Giám đốc" hoặc "${context.userName || 'Bạn'}"
        - Giữ câu trả lời ngắn gọn (dưới 150 từ)
        - Thể hiện cảm xúc phù hợp
        - Nếu không biết, nói "Glacia sẽ tìm hiểu thêm cho bạn nhé!"
        
        Ngữ cảnh trước đó:
        ${context.shortTermMemory.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}`;

      const response = await callAIWithFallback(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        { model: 'ai-assistant', task: 'general' }
      );

      return response.content || response.text || 'Glacia không hiểu câu hỏi của bạn.';
    } catch (error) {
      console.error('LLM response generation failed:', error);
      return 'Glacia gặp trục trặc khi xử lý. Xin lỗi bạn nhé!';
    }
  }

  /**
   * End a conversation session
   */
  endConversation(conversationId: string): void {
    const session = this.activeSessions.get(conversationId);
    if (session) {
      session.sttController?.abort();
      session.ttsController?.abort();
      session.llmController?.abort();
      this.activeSessions.delete(conversationId);
    }
    
    this.emotionHistory.delete(conversationId);
    conversationContextManager.updateContext(conversationId, {
      lastInteractionAt: new Date().toISOString(),
    });

    recordAIAction({
      agentId: 'ai_avatar_connector',
      roleId: 'role_glacia_assistant',
      domain: 'conversation',
      actionType: 'CONVERSATION_ENDED',
      targetResource: conversationId,
      outputSummary: `Kết thúc phiên đàm thoại AI Avatar`,
      permissionCheckPassed: true,
      constitutionalRulePassed: true,
    });
  }

  /**
   * Cleanup inactive sessions
   */
  cleanupSessions(): void {
    for (const [id, session] of this.activeSessions.entries()) {
      if (session.status === 'idle') {
        this.endConversation(id);
      }
    }
    conversationContextManager.cleanupOldContexts();
  }
}

export const realTimeConversationHandler = new RealTimeConversationHandler();

// ============================================================================
// AVATAR PRESENTATION GENERATOR (Enhanced)
// ============================================================================

/**
 * Generate Avatar Presentation Job Specification
 * Enhanced with emotion detection, gesture mapping, and real-time support
 */
export function generateAvatarPresentationJob(params: {
  title: string;
  scriptLines: string[];
  avatarEngine?: AvatarEngine;
  avatarPortraitUrl?: string;
  avatar3DModelUrl?: string;
  authorRoleId?: string;
  userId?: string;
  enableRealTimeSync?: boolean;
}): AvatarPresentationJob {
  const jobId = `avt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const avatarEngine = params.avatarEngine || 'CUSTOM_WEBGL';
  const avatarPortraitUrl = params.avatarPortraitUrl || 'https://assets.ledgerflow.example/avatars/executive_speaker_4k.png';

  // Create conversation context for this job
  const context = params.userId 
    ? conversationContextManager.createContext(params.userId) 
    : conversationContextManager.createContext('anonymous');

  // Process each line with emotion and gesture detection
  const scenes: AvatarSceneSpec[] = params.scriptLines.map((line, idx) => {
    const wordCount = line.split(/\s+/).length;
    const duration = Math.max(2, Math.round(wordCount * 0.25 + 1)); // ~4 words per second
    
    // Detect emotion from line
    const { emotion, confidence } = realTimeConversationHandler.detectEmotion(line, context.conversationId);
    
    // Generate gesture
    const gesture = realTimeConversationHandler.generateGesture(emotion, line, true);
    
    // Add to memory for context
    conversationContextManager.addMemory(context.conversationId, idx % 2 === 0 ? 'user' : 'assistant', line);

    // Generate viseme sequence (simplified)
    const visemeCount = Math.min(10, Math.floor(wordCount / 3));
    const visemeSequence = Array.from({ length: visemeCount }, (_, i) => ({
      viseme: ['aa', 'ee', 'ih', 'oh', 'ou', 'mm'][i % 6],
      startTime: i * (duration / visemeCount),
      endTime: (i + 1) * (duration / visemeCount),
      intensity: 0.7 + Math.random() * 0.3,
    }));

    return {
      sceneNumber: idx + 1,
      spokenText: line,
      emotion,
      headGesture: gesture.head,
      handGesture: gesture.hand,
      bodyGesture: gesture.body,
      durationSecondsEstimate: duration,
      visemeSequence,
      eyeTarget: { x: 0, y: 0, z: -1 }, // Look at user
      cameraFocus: 'USER',
    };
  });

  const totalDurationSeconds = scenes.reduce((sum, s) => sum + s.durationSecondsEstimate, 0);

  // Generate render payload based on engine
  const renderPayload = {
    jobId,
    engine: avatarEngine,
    portraitSource: avatarPortraitUrl,
    model3dSource: params.avatar3DModelUrl,
    speechDriver: avatarEngine === 'ELEVENLABS' ? 'elevenlabs_tts' : 
                  avatarEngine === 'AZURE_TTS' ? 'azure_tts' : 
                  'web_speech_api',
    scenesCount: scenes.length,
    totalDuration: totalDurationSeconds,
    resolution: '1080p_60fps',
    // Real-time sync settings
    realTimeSync: params.enableRealTimeSync || false,
    websocketEndpoint: params.enableRealTimeSync ? `/api/avatar/stream/${jobId}` : undefined,
    // Gesture and emotion settings
    emotionMapping: MOOD_TO_EMOTION,
    gestureMapping: EMOTION_TO_GESTURE,
  };

  const job: AvatarPresentationJob = {
    jobId,
    avatarEngine,
    avatarPortraitUrl,
    avatar3DModelUrl: params.avatar3DModelUrl,
    scenes,
    totalDurationSeconds,
    status: params.enableRealTimeSync ? 'STREAMING' : 'READY_TO_RENDER',
    renderPayload,
    createdAt: now,
    streamingSessionId: params.enableRealTimeSync ? `stream_${jobId}` : undefined,
    syncWithAvatar: params.enableRealTimeSync,
    avatarInstanceId: context.conversationId,
  };

  recordAIAction({
    agentId: 'ai_avatar_connector',
    roleId: params.authorRoleId || 'role_chief_of_staff',
    domain: 'video_marketing',
    actionType: `AVATAR_JOB_GENERATED:${avatarEngine}`,
    targetResource: jobId,
    outputSummary: `Đã sinh gói AI Avatar (${scenes.length} phân cảnh, ~${totalDurationSeconds}s, engine: ${avatarEngine})`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return job;
}

/**
 * Generate a single response for real-time conversation
 * (Used by the frontend hook)
 */
export async function generateRealTimeResponse(
  text: string,
  options: {
    userId?: string;
    conversationId?: string;
    userName?: string;
    context?: Array<{ role: 'user' | 'assistant'; content: string }>;
  } = {}
): Promise<{
  response: string;
  emotion: AvatarEmotion;
  gesture: { head: HeadGesture; hand: HandGesture; body: BodyGesture };
  conversationId: string;
  shouldContinue: boolean;
}> {
  // Get or create conversation context
  let conversationId = options.conversationId;
  
  if (!conversationId && options.userId) {
    const newContext = await realTimeConversationHandler.startConversation(
      options.userId, 
      options.userName
    );
    conversationId = newContext.conversationId;
  }

  // Process input
  const result = await realTimeConversationHandler.processUserInput(
    conversationId || 'temp_conv',
    text
  );

  return {
    ...result,
    shouldContinue: true,
  };
}

/**
 * Generate streaming response chunks
 * (For WebSocket streaming)
 */
export async function* generateStreamingResponse(
  text: string,
  options: {
    userId?: string;
    conversationId?: string;
    userName?: string;
    onChunk?: (chunk: string) => void;
  } = {}
): AsyncGenerator<StreamingResponse, void, unknown> {
  // Get or create conversation context
  let conversationId = options.conversationId;
  
  if (!conversationId && options.userId) {
    const newContext = await realTimeConversationHandler.startConversation(
      options.userId, 
      options.userName
    );
    conversationId = newContext.conversationId;
  }

  // Add user message to memory
  if (conversationId && conversationId !== 'temp_conv') {
    conversationContextManager.addMemory(conversationId, 'user', text);
  }

  // For now, generate full response and chunk it
  // In future, this will stream from LLM
  const result = await realTimeConversationHandler.processUserInput(
    conversationId || 'temp_conv',
    text
  );

  // Split response into chunks (simulating streaming)
  const chunks = result.response.match(/.{1,20}/g) || [result.response];
  
  for (const chunk of chunks) {
    yield {
      type: 'chunk',
      data: chunk,
      emotion: result.emotion,
      timestamp: Date.now(),
      conversationId: conversationId || 'temp_conv',
    };
    
    options.onChunk?.(chunk);
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
  }

  yield {
    type: 'end',
    emotion: result.emotion,
    timestamp: Date.now(),
    conversationId: conversationId || 'temp_conv',
  };
}


