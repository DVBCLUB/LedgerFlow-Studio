/**
 * hooks/index.ts
 * ============================================================
 * Export all hooks from glacia components
 * ============================================================
 */

export { useRealTimeConversation, detectEmotionFromText, conversationManager } from './useRealTimeConversation';
export type { ConversationHistoryItem, ConversationState } from './useRealTimeConversation';

export { useFaceTracking } from './useFaceTracking';
export type { UseFaceTrackingReturn, UseFaceTrackingOptions } from './useFaceTracking';
