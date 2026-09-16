/**
 * HumanAvatar3D.tsx
 * ═══════════════════════════════════════════════════════════════
 * Human-like 3D Avatar Component for AI Virtual Assistant
 * 
 * Features:
 * - Ready Player Me avatar loading
 * - Gesture animation system
 * - Facial expression control
 * - Emotion mapping
 * - Eye tracking
 * - Lip-sync
 * - Responsive design
 * 
 * Usage:
 *   <HumanAvatar3D
 *     avatarUrl="/models/human-avatar.glb"
 *     emotion="HAPPY"
 *     gesture="wave"
 *     isSpeaking={true}
 *     lookAt={{ x: 0, y: 0, z: -1 }}
 *     scale={1}
 *   />
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AvatarEmotion, EMOTION_TO_GESTURE, MOOD_TO_EMOTION, type HeadGesture, type HandGesture } from '../../../core/types/glaciaAvatar';
import { avatarManager, readyPlayerMeService, GESTURES, type AvatarState } from './services/avatarService';
import { glaciaAudio } from './glaciaAudioSynth';

// Emotion to color mapping for visual feedback
const EMOTION_COLORS: Record<string, string> = {
  NEUTRAL: '#38bdf8',
  CONFIDENT_SMILE: '#10b981',
  SERIOUS_EXECUTIVE: '#3b82f6',
  ENTHUSIASTIC: '#8b5cf6',
  HAPPY: '#059669',
  CURIOUS: '#6366f1',
  THINKING: '#84cc16',
  LISTENING: '#ec4899',
  ALERT: '#ef4444',
  CELEBRATING: '#f59e0b',
  ANGRY: '#dc2626',
  SAD: '#1e40af',
  SURPRISED: '#f97316',
};

// Simple mood to emotion mapping
export const SIMPLE_MOOD_MAP: Record<string, AvatarEmotion> = {
  idle: 'NEUTRAL',
  happy: 'HAPPY',
  curious: 'CURIOUS',
  thinking: 'THINKING',
  listening: 'LISTENING',
  dispatching: 'ENTHUSIASTIC',
  celebrating: 'CELEBRATING',
  alert: 'ALERT',
  sleeping: 'NEUTRAL',
  default: 'NEUTRAL',
};

export interface HumanAvatar3DProps {
  /** URL to the 3D avatar model (GLB/GLTF) */
  avatarUrl?: string;
  /** Emotion state */
  emotion?: AvatarEmotion | string;
  /** Mood state (simpler alternative to emotion) */
  mood?: string;
  /** Gesture to play */
  gesture?: HeadGesture | HandGesture | string;
  /** Whether avatar is currently speaking */
  isSpeaking?: boolean;
  /** Whether avatar is currently listening */
  isListening?: boolean;
  /** Target for avatar to look at (normalized coordinates -1 to 1) */
  lookAt?: { x: number; y: number; z: number };
  /** Scale of the avatar */
  scale?: number;
  /** Position offset */
  position?: { x: number; y: number; z: number };
  /** Rotation offset */
  rotation?: { x: number; y: number; z: number };
  /** Whether to enable interactions */
  interactive?: boolean;
  /** Whether to show debug info */
  showDebug?: boolean;
  /** Class name for styling */
  className?: string;
  /** Callback when avatar is loaded */
  onLoad?: () => void;
  /** Callback when avatar fails to load */
  onError?: (error: Error) => void;
  /** Callback when avatar clicks */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

// Custom type for ref
export interface HumanAvatar3DRef {
  playGesture: (gesture: string) => void;
  setEmotion: (emotion: AvatarEmotion | string) => void;
  speak: (text: string, duration?: number) => void;
  listen: () => void;
  stopListening: () => void;
  lookAt: (target: { x: number; y: number; z: number }) => void;
  getState: () => AvatarState;
}

/**
 * Human-like 3D Avatar Component
 */
const HumanAvatar3D = forwardRef<HumanAvatar3DRef, HumanAvatar3DProps>(
  (
    {
      avatarUrl = '/models/assistant/base_basic_pbr.glb',
      emotion = 'NEUTRAL',
      mood,
      gesture: propGesture,
      isSpeaking = false,
      isListening = false,
      lookAt,
      scale = 1,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      interactive = true,
      showDebug = false,
      className = '',
      onLoad,
      onError,
      onClick,
    },
    ref
  ) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [currentEmotion, setCurrentEmotion] = useState<AvatarEmotion>('NEUTRAL');
    const [currentGesture, setCurrentGesture] = useState<string>('');

    // Resize observer
    const resizeObserverRef = useRef<ResizeObserver | null>(null);

    // Determine emotion from props
    const resolvedEmotion = (): AvatarEmotion => {
      if (mood && SIMPLE_MOOD_MAP[mood]) {
        return SIMPLE_MOOD_MAP[mood];
      }
      if (emotion && (emotion in MOOD_TO_EMOTION || emotion in EMOTION_TO_GESTURE)) {
        return emotion as AvatarEmotion;
      }
      return 'NEUTRAL';
    };

    // Play gesture
    const playGesture = useCallback((gesture: string) => {
      setCurrentGesture(gesture);
      if (avatarManager.getAvatar()) {
        avatarManager.updateState({ gesture });
      }
    }, []);

    // Set emotion
    const setEmotion = useCallback((newEmotion: AvatarEmotion | string) => {
      const finalEmotion: AvatarEmotion = typeof newEmotion === 'string' 
        ? (newEmotion in EMOTION_TO_GESTURE ? newEmotion as AvatarEmotion : 'NEUTRAL') 
        : newEmotion;
      setCurrentEmotion(finalEmotion);
      if (avatarManager.getAvatar()) {
        avatarManager.updateState({ emotion: finalEmotion });
      }
    }, []);

    // Speak
    const speak = useCallback((text: string, duration: number = text.length * 100) => {
      if (avatarManager.getAvatar()) {
        avatarManager.speak(text, duration);
      }
    }, []);

    // Listen
    const listen = useCallback(() => {
      if (avatarManager.getAvatar()) {
        avatarManager.listen();
      }
    }, []);

    // Stop listening
    const stopListening = useCallback(() => {
      if (avatarManager.getAvatar()) {
        avatarManager.stopListening();
      }
    }, []);

    // Look at target
    const avatarLookAt = useCallback((target: { x: number; y: number; z: number }) => {
      if (avatarManager.getAvatar()) {
        avatarManager.lookAt(target);
      }
    }, []);

    // Get state
    const getState = useCallback(() => {
      return avatarManager.getState();
    }, []);

    // Expose methods via ref
    useImperativeHandle(
      ref,
      () => ({
        playGesture,
        setEmotion,
        speak,
        listen,
        stopListening,
        lookAt: avatarLookAt,
        getState,
      }),
      [playGesture, setEmotion, speak, listen, stopListening, avatarLookAt, getState]
    );

    // Initialize Three.js
    useEffect(() => {
      const mount = mountRef.current;
      if (!mount) return;

      let isMounted = true;

      // Cleanup previous instance
      avatarManager.cleanup();

      // Get default avatar URL if not provided
      const urlToLoad = avatarUrl || readyPlayerMeService.getDefaultAvatars()[0].url;

      // Load avatar
      const loadAvatar = async () => {
        try {
          // Initialize with container
          await avatarManager.initialize(mount, {
            width: mount.clientWidth,
            height: mount.clientHeight,
            backgroundColor: 0x050b14,
          });

          // Try to load the avatar
          try {
            await avatarManager.loadAvatar(urlToLoad, {
              scale,
              position,
              rotation,
              emotion: resolvedEmotion(),
            });

            if (isMounted) {
              setIsLoaded(true);
              setCurrentEmotion(resolvedEmotion());
              onLoad?.();
              glaciaAudio.playCrystalChime(1318.5);
            }
          } catch (loadError) {
            console.warn('Failed to load avatar model, using placeholder:', loadError);
            // Continue with initialized scene but no avatar
            if (isMounted) {
              setIsLoaded(true);
              onLoad?.();
            }
          }

          // Handle lookAt
          if (lookAt) {
            avatarManager.lookAt(lookAt);
          }

        } catch (error) {
          if (isMounted) {
            setHasError(true);
            setIsLoaded(false);
            onError?.(error instanceof Error ? error : new Error(String(error)));
            console.error('Avatar initialization failed:', error);
          }
        }
      };

      // Set up resize observer
      resizeObserverRef.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          avatarManager.resize(entry.contentRect.width, entry.contentRect.height);
        }
      });
      resizeObserverRef.current.observe(mount);

      loadAvatar();

      return () => {
        isMounted = false;
        resizeObserverRef.current?.disconnect();
        avatarManager.cleanup();
      };
    }, [avatarUrl, scale, position, rotation, lookAt, onLoad, onError]);

    // Update emotion when props change
    useEffect(() => {
      const newEmotion = resolvedEmotion();
      if (newEmotion !== currentEmotion && isLoaded) {
        setEmotion(newEmotion);
      }
    }, [emotion, mood, currentEmotion, isLoaded, resolvedEmotion, setEmotion]);

    // Update gesture when props change
    useEffect(() => {
      if (propGesture && propGesture !== currentGesture && isLoaded) {
        playGesture(propGesture);
      }
    }, [propGesture, currentGesture, isLoaded, playGesture]);

    // Update speaking/listening state
    useEffect(() => {
      if (!isLoaded) return;

      if (isSpeaking) {
        avatarManager.updateState({ isSpeaking: true, isListening: false });
      } else if (isListening) {
        avatarManager.updateState({ isSpeaking: false, isListening: true });
      } else {
        avatarManager.updateState({ isSpeaking: false, isListening: false });
      }
    }, [isSpeaking, isListening, isLoaded]);

    // Update lookAt when props change
    useEffect(() => {
      if (lookAt && isLoaded) {
        avatarManager.lookAt(lookAt);
      }
    }, [lookAt, isLoaded]);

    // Handle mouse interactions
    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive) {
        glaciaAudio.playPettingPurr();
        onClick?.(e);
      }
    }, [interactive, onClick]);

    // Handle mouse move for eye tracking
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (interactive && isLoaded && mountRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        avatarManager.lookAt({ x: x * 10, y: y * 5, z: -5 });
      }
    }, [interactive, isLoaded]);

    // Render loading state
    if (!isLoaded && !hasError) {
      return (
        <div
          ref={mountRef}
          className={`relative w-full h-full flex items-center justify-center ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 rounded-2xl" />
          
          {/* Loading Indicator */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 p-1 shadow-2xl animate-pulse">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
            </div>

            <div className="text-center">
              <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">Đang tải Avatar 3D...</p>
            </div>
          </div>
        </div>
      );
    }

    // Render error state
    if (hasError) {
      return (
        <div
          ref={mountRef}
          className={`relative w-full h-full flex items-center justify-center ${className}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-950/60 to-slate-950 rounded-2xl" />
          
          <div className="relative z-10 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-rose-300">Không thể tải Avatar</h3>
              <p className="text-xs text-slate-400 mt-1">WebGL không được hỗ trợ trên thiết bị này</p>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold hover:bg-rose-500/30 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      );
    }

    // Render main avatar
    return (
      <div
        ref={mountRef}
        className={`relative w-full h-full ${className}`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
      >
        {/* Emotion Indicator */}
        {showDebug && isLoaded && (
          <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur-xl rounded-xl p-2">
            <div className="text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: EMOTION_COLORS[currentEmotion] || '#38bdf8' }}
                />
                <span className="text-cyan-300">{currentEmotion}</span>
              </div>
              {currentGesture && (
                <div className="text-[9px] text-slate-400 mt-0.5">
                  Gesture: {currentGesture}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Interactive Overlay */}
        {interactive && isLoaded && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-cyan-500/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
        )}

        {/* Status Badge */}
        {isLoaded && (
          <div className="absolute bottom-2 left-2 z-10">
            {isSpeaking ? (
              <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 rounded-lg text-[10px] font-bold animate-pulse">
                Đang nói
              </span>
            ) : isListening ? (
              <span className="px-2 py-1 bg-rose-500/20 border border-rose-400/40 text-rose-300 rounded-lg text-[10px] font-bold animate-pulse">
                Đang nghe
              </span>
            ) : currentEmotion !== 'NEUTRAL' ? (
              <span className="px-2 py-1 bg-slate-800/80 border border-slate-700 text-slate-300 rounded-lg text-[10px] font-mono">
                {currentEmotion}
              </span>
            ) : null}
          </div>
        )}

        {/* Click to interact hint */}
        {interactive && !isSpeaking && !isListening && isLoaded && (
          <div className="absolute bottom-2 right-2 z-10 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <span className="px-2 py-1 bg-slate-900/80 border border-cyan-500/30 text-cyan-400 rounded-lg text-[10px]">
              Click để tương tác
            </span>
          </div>
        )}

        {/* Three.js Canvas (auto-rendered by avatarManager) */}
      </div>
    );
  }
);

// Display name for debugging
HumanAvatar3D.displayName = 'HumanAvatar3D';

export default HumanAvatar3D;

export { readyPlayerMeService, avatarManager, GESTURES, EMOTION_COLORS };
