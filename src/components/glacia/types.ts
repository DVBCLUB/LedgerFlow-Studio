/**
 * types.ts
 * ============================================================
 * Type Definitions for Glacia AI Virtual Assistant Components
 * 
 * Centralized type exports for easier TypeScript support
 * ============================================================
 */

// Re-export all types from various modules
export * from './GlaciaContext';
export * from './GlaciaVirtualBeingState';
export * from './hooks/useRealTimeConversation';
export * from './services/avatarService';
export * from '../../server/services/aiAvatarConnector';

// Common Glacia types
import type { VoiceMoodType } from './glaciaVoiceEngine';
export type { VoiceMoodType };

// Avatar related types
export type {
  AvatarConfig,
  AvatarState,
  Gesture,
} from './services/avatarService';

// Conversation types
export type {
  ConversationState,
  ConversationHistoryItem,
  RealTimeConversationOptions,
} from './hooks/useRealTimeConversation';

// Context types
export type {
  GlaciaMood,
  Glacia3DViewMode,
  CrystalSkinTheme,
  EmotionProfile,
  GlaciaTelemetry,
  GlaciaChatMessage,
  GlaciaContextValue,
  DispatchedAgentTask,
} from './GlaciaContext';

// Virtual Being types
export type {
  VirtualBeingProfile,
  CognitiveThoughtStep,
  CyberBiologyVitals,
  MemoryVaultItem,
} from './GlaciaVirtualBeingState';

// AI Avatar Connector types
export type {
  AvatarEngine,
  AvatarEmotion,
  HeadGesture,
  HandGesture,
  BodyGesture,
  AvatarSceneSpec,
  AvatarPresentationJob,
  ConversationContext,
  StreamingResponse,
  RealTimeConversationState,
} from '../../server/services/aiAvatarConnector';

// Human Avatar 3D types
export type {
  HumanAvatar3DProps,
  HumanAvatar3DRef,
} from './HumanAvatar3D';

// Face Tracking types
export type {
  FaceDetection,
  FacialLandmarks,
  HeadPose,
  EyeTracking,
  MouthTracking,
  FacialExpression,
  FaceTrackingOptions,
  FaceTrackingState,
  ModelConfig,
  FaceDetectionModel,
  FaceLandmarkModel,
  EmotionModel,
} from './services/faceTrackingService';
