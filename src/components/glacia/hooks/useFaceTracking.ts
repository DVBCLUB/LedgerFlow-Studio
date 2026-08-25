/**
 * useFaceTracking.ts
 * ============================================================
 * React Hook for Face Tracking in AI Virtual Assistant
 * 
 * Provides:
 * - Easy integration of face tracking with React components
 * - Automatic camera permission handling
 * - Face detection state management
 * - Avatar synchronization
 * - Emotion and pose tracking callbacks
 * 
 * ============================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { faceTrackingService, FaceTrackingService, FaceDetection } from '../services/faceTrackingService';
import { avatarManager } from '../services/avatarService';
import { AvatarEmotion, AvatarState } from '../services/avatarService';
import { HeadPose, FacialExpression, EyeTracking, MouthTracking, FaceTrackingState, FaceTrackingOptions } from '../services/faceTrackingService';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Hook return value
 */
export interface UseFaceTrackingReturn {
  // State
  isTracking: boolean;
  isDetected: boolean;
  detectionConfidence: number;
  lastDetection: FaceDetection | undefined;
  error: string | undefined;
  
  // Current tracking data
  currentPose: HeadPose | null;
  currentExpression: FacialExpression | null;
  currentEyeTracking: EyeTracking | null;
  currentMouthTracking: MouthTracking | null;
  currentEmotion: AvatarEmotion;
  currentGesture: string | null;
  
  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  toggleTracking: () => Promise<void>;
  switchCamera: (deviceId: string) => Promise<void>;
  listCameras: () => Promise<MediaDeviceInfo[]>;
  reset: () => void;
  
  // Options
  updateOptions: (options: Partial<FaceTrackingOptions>) => void;
  
  // Permissions
  hasCameraPermission: boolean;
  requestCameraPermission: () => Promise<boolean>;
}

/**
 * Hook options
 */
export interface UseFaceTrackingOptions extends FaceTrackingOptions {
  autoStart?: boolean;                // Start tracking automatically
  autoSyncAvatar?: boolean;          // Sync detected face with avatar
  onPermissionGranted?: () => void;   // Camera permission granted
  onPermissionDenied?: () => void;    // Camera permission denied
  onFaceDetected?: (detection: FaceDetection) => void;
  onFaceLost?: () => void;
  onTrackingStart?: () => void;
  onTrackingStop?: () => void;
  onEmotionChange?: (emotion: AvatarEmotion, confidence: number) => void;
  onPoseChange?: (pose: HeadPose) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// DEFAULT OPTIONS
// ============================================================================

const DEFAULT_OPTIONS: UseFaceTrackingOptions = {
  autoStart: false,
  autoSyncAvatar: true,
  minConfidence: 0.5,
  detectionInterval: 100,
  smoothFactor: 0.3,
  enableEmotionDetection: true,
  enableHeadPose: true,
  enableEyeTracking: true,
  enableMouthTracking: true,
  enableExpressionAnalysis: true,
  cameraId: '',
  resolution: { width: 640, height: 480 },
  mirror: true,
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * React hook for face tracking integration
 */
export function useFaceTracking(options: UseFaceTrackingOptions = {}): UseFaceTrackingReturn {
  const [state, setState] = useState<FaceTrackingState>(() => faceTrackingService.getState());
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentEmotion, setCurrentEmotion] = useState<AvatarEmotion>('NEUTRAL');
  const [currentGesture, setCurrentGesture] = useState<string | null>(null);
  const [currentPose, setCurrentPose] = useState<HeadPose | null>(null);
  const [currentExpression, setCurrentExpression] = useState<FacialExpression | null>(null);
  const [currentEyeTracking, setCurrentEyeTracking] = useState<EyeTracking | null>(null);
  const [currentMouthTracking, setCurrentMouthTracking] = useState<MouthTracking | null>(null);
  const [error, setError] = useState<string | undefined>();
  
  const trackingServiceRef = useRef<FaceTrackingService | null>(null);
  const mergedOptionsRef = useRef<UseFaceTrackingOptions>({ ...DEFAULT_OPTIONS, ...options });
  const initializedRef = useRef<boolean>(false);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize face tracking service
        await faceTrackingService.initialize();
        trackingServiceRef.current = faceTrackingService;
        
        // Update merged options
        mergedOptionsRef.current = { ...DEFAULT_OPTIONS, ...options };
        
        // Update service options
        faceTrackingService.updateOptions(mergedOptionsRef.current);
        
        // Set up avatar manager for sync
        faceTrackingService.setAvatarManager(avatarManager);
        
        // Check camera permission
        await checkCameraPermission();
        
        // List available cameras
        const availableCameras = await faceTrackingService.listCameras();
        setCameras(availableCameras);
        
        // Set initial state
        updateStateFromService();
        
        initializedRef.current = true;
        
        // Auto-start if enabled
        if (mergedOptionsRef.current.autoStart) {
          await startTracking();
        }
        
        // Set up callbacks
        setupCallbacks();
        
      } catch (err) {
        console.error('Face tracking initialization error:', err);
        setError(`Initialization failed: ${err}`);
      }
    };
    
    init();
    
    // Cleanup
    return () => {
      // Remove callbacks
      faceTrackingService.onDetected(null);
      faceTrackingService.onLost(null);
      faceTrackingService.onStart(null);
      faceTrackingService.onStop(null);
      faceTrackingService.onErrorCallback(null);
      faceTrackingService.onEmotionChangeCallback(null);
      faceTrackingService.onPoseChangeCallback(null);
    };
  }, []);

  // ==========================================================================
  // CALLBACKS SETUP
  // ==========================================================================

  const setupCallbacks = useCallback(() => {
    const opts = mergedOptionsRef.current;
    
    // Face detected callback
    faceTrackingService.onDetected((detection) => {
      updateStateFromService();
      opts.onFaceDetected?.(detection);
      
      // Update current tracking data
      setCurrentPose(detection.pose);
      setCurrentExpression(detection.expression);
      setCurrentEyeTracking(detection.eyes);
      setCurrentMouthTracking(detection.mouth);
      
      // Map emotion
      const emotionMap: Record<string, AvatarEmotion> = {
        'happy': 'HAPPY',
        'joy': 'HAPPY',
        'smiling': 'CONFIDENT_SMILE',
        'excited': 'ENTHUSIASTIC',
        'surprised': 'SURPRISED',
        'angry': 'ANGRY',
        'disgusted': 'ANGRY',
        'fearful': 'ALERT',
        'sad': 'SAD',
        'neutral': 'NEUTRAL',
        'contempt': 'SERIOUS_EXECUTIVE',
        'confused': 'THINKING',
        'curious': 'CURIOUS',
      };
      const emotion = emotionMap[detection.expression.dominantEmotion] || 'NEUTRAL';
      setCurrentEmotion(emotion);
    });
    
    // Face lost callback
    faceTrackingService.onLost(() => {
      updateStateFromService();
      opts.onFaceLost?.();
      setCurrentEmotion('NEUTRAL');
      setCurrentGesture(null);
    });
    
    // Tracking start callback
    faceTrackingService.onStart(() => {
      updateStateFromService();
      opts.onTrackingStart?.();
    });
    
    // Tracking stop callback
    faceTrackingService.onStop(() => {
      updateStateFromService();
      opts.onTrackingStop?.();
    });
    
    // Error callback
    faceTrackingService.onErrorCallback((err) => {
      setError(err.message);
      opts.onError?.(err);
    });
    
    // Emotion change callback
    faceTrackingService.onEmotionChangeCallback((emotion, confidence) => {
      setCurrentEmotion(emotion);
      opts.onEmotionChange?.(emotion, confidence);
    });
    
    // Pose change callback
    faceTrackingService.onPoseChangeCallback((pose) => {
      setCurrentPose(pose);
      opts.onPoseChange?.(pose);
    });
  }, []);

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  const updateStateFromService = useCallback(() => {
    const serviceState = faceTrackingService.getState();
    setState({ ...serviceState });
    setError(serviceState.error);
  }, []);

  const updateTrackingData = useCallback(() => {
    setCurrentPose(faceTrackingService.getCurrentPose());
    setCurrentExpression(faceTrackingService.getExpression());
    setCurrentEyeTracking(faceTrackingService.getEyeTracking());
    setCurrentMouthTracking(faceTrackingService.getMouthTracking());
  }, []);

  // Update state when service state changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.isTracking) {
        updateStateFromService();
        updateTrackingData();
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [state.isTracking, updateStateFromService, updateTrackingData]);

  // ==========================================================================
  // CAMERA PERMISSION
  // ==========================================================================

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions?.query({ name: 'camera' as any });
      if (result) {
        setHasPermission(result.state === 'granted');
        return result.state === 'granted';
      }
      
      // Fallback: try to access camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        return true;
      } catch {
        setHasPermission(false);
        return false;
      }
    } catch {
      return false;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      mergedOptionsRef.current.onPermissionGranted?.();
      return true;
    } catch {
      setHasPermission(false);
      mergedOptionsRef.current.onPermissionDenied?.();
      return false;
    }
  };

  // ==========================================================================
  // TRACKING ACTIONS
  // ==========================================================================

  const startTracking = useCallback(async () => {
    try {
      // Check permission
      if (!hasPermission) {
        const granted = await requestCameraPermission();
        if (!granted) {
          throw new Error('Camera permission denied');
        }
      }
      
      await faceTrackingService.start();
      updateStateFromService();
    } catch (err) {
      console.error('Failed to start tracking:', err);
      setError(`Failed to start tracking: ${err}`);
      throw err;
    }
  }, [hasPermission, requestCameraPermission, updateStateFromService]);

  const stopTracking = useCallback(async () => {
    try {
      await faceTrackingService.stop();
      updateStateFromService();
    } catch (err) {
      console.error('Failed to stop tracking:', err);
      setError(`Failed to stop tracking: ${err}`);
      throw err;
    }
  }, [updateStateFromService]);

  const toggleTracking = useCallback(async () => {
    if (state.isTracking) {
      await stopTracking();
    } else {
      await startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      await faceTrackingService.switchCamera(deviceId);
      updateStateFromService();
    } catch (err) {
      console.error('Failed to switch camera:', err);
      setError(`Failed to switch camera: ${err}`);
      throw err;
    }
  }, [updateStateFromService]);

  const listCameras = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const cameras = await faceTrackingService.listCameras();
      setCameras(cameras);
      return cameras;
    } catch (err) {
      console.error('Failed to list cameras:', err);
      setError(`Failed to list cameras: ${err}`);
      return [];
    }
  }, []);

  const reset = useCallback(() => {
    faceTrackingService.cleanup();
    setState({
      isTracking: false,
      isDetected: false,
      detectionConfidence: 0,
      lastUpdate: 0,
    });
    setCurrentEmotion('NEUTRAL');
    setCurrentGesture(null);
    setCurrentPose(null);
    setCurrentExpression(null);
    setCurrentEyeTracking(null);
    setCurrentMouthTracking(null);
    setError(undefined);
  }, []);

  const updateOptions = useCallback((newOptions: Partial<FaceTrackingOptions>) => {
    mergedOptionsRef.current = { ...mergedOptionsRef.current, ...newOptions };
    faceTrackingService.updateOptions(newOptions);
  }, []);

  // ==========================================================================
  // RETURN VALUE
  // ==========================================================================

  return {
    // State
    isTracking: state.isTracking,
    isDetected: state.isDetected,
    detectionConfidence: state.detectionConfidence,
    lastDetection: state.lastDetection,
    error,
    
    // Current tracking data
    currentPose,
    currentExpression,
    currentEyeTracking,
    currentMouthTracking,
    currentEmotion,
    currentGesture,
    
    // Actions
    startTracking,
    stopTracking,
    toggleTracking,
    switchCamera,
    listCameras,
    reset,
    
    // Options
    updateOptions,
    
    // Permissions
    hasCameraPermission: hasPermission,
    requestCameraPermission,
  };
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default useFaceTracking;

export type { UseFaceTrackingReturn, UseFaceTrackingOptions };
