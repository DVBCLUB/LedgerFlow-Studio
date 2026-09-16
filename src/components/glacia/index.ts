export { GlaciaProvider, useGlacia, SUB_AGENTS_ROSTER, GLACIA_EMOTIONS, GLACIA_PERSONA } from './GlaciaContext';
export { default as GlaciaCompanion } from './GlaciaCompanion';
export { default as GlaciaCommandCockpit } from './GlaciaCommandCockpit';
export { default as GlaciaEmbodiedGuide } from './GlaciaEmbodiedGuide';
export { default as GlaciaLiveVoiceCallHUD, CRYSTAL_SKINS, type CrystalSkinTheme } from './GlaciaLiveVoiceCallHUD';
export { default as GlaciaReal3DAvatar } from './GlaciaReal3DAvatar';
export { default as CustomGLBAvatar, type CustomGLBAvatarProps } from './CustomGLBAvatar';
export { default as GlaciaProactiveSentinel } from './GlaciaProactiveSentinel';
export { default as GlaciaExecutiveBriefingModal } from './GlaciaExecutiveBriefingModal';
export { default as GlaciaNeuralSkillTree } from './GlaciaNeuralSkillTree';
export { default as GlaciaCognitiveThoughtHUD } from './GlaciaCognitiveThoughtHUD';
export { default as GlaciaProactiveMorningBriefing } from './GlaciaProactiveMorningBriefing';
export { default as GlaciaStrategySimulationHUD } from './GlaciaStrategySimulationHUD';
export { default as GlaciaGameAndVideoStudioHUD } from './GlaciaGameAndVideoStudioHUD';
export { default as GlaciaAgentBridgePanel } from './GlaciaAgentBridgePanel';
export { default as GlaciaAdminPortalButton } from './GlaciaAdminPortalButton';
export { default as Glacia3DHologramCanvas } from './Glacia3DHologramCanvas';
export { default as Glacia7DHyperCanvas } from './Glacia7DHyperCanvas';
export { default as GlaciaVirtualHuman } from './GlaciaVirtualHuman';
export { default as GlaciaBiomorphicCharacter } from './GlaciaBiomorphicCharacter';
export { default as GlaciaRealTimeConversation } from './GlaciaRealTimeConversation';
export { default as HumanAvatar3D, type HumanAvatar3DProps, type HumanAvatar3DRef, SIMPLE_MOOD_MAP } from './HumanAvatar3D';
export { glaciaAudio } from './glaciaAudioSynth';
export { glaciaVoice } from './glaciaVoiceEngine';
export { glaciaModuleBridge } from './glaciaModuleBridge';
export * from './GlaciaVirtualBeingState';
export { isTtsSupported, isSttSupported, initSpeechVoices, listen } from './glaciaSpeech';
export type { SpeakCallbacks, SttCallbacks } from './glaciaSpeech';

// Export hooks
export { useRealTimeConversation, detectEmotionFromText, conversationManager } from './hooks';
export type { ConversationHistoryItem, ConversationState, UseFaceTrackingReturn, UseFaceTrackingOptions } from './hooks';

// Export Face Tracking Demo
export { FaceTrackingDemo, FaceTrackingDemoWithStyles } from './FaceTrackingDemo';
export { default as FaceTrackingDemoDefault } from './FaceTrackingDemo';

// Export avatar services
export { avatarManager, readyPlayerMeService, GESTURES } from './services/avatarService';
export type { AvatarConfig, AvatarState, Gesture } from './services/avatarService';
export { EMOTION_COLORS } from './HumanAvatar3D';

// Export all types
export * from './types';

// Export voice services
export * from './services/voiceService';

// Export memory services
export * from './services/memoryService';

// Export face tracking services
export { faceTrackingService, FaceTrackingService } from './services/faceTrackingService';
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
} from './services/faceTrackingService';
