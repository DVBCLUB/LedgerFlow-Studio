/**
 * faceTrackingService.ts
 * ============================================================
 * Real-time Face Tracking Service for AI Virtual Assistant
 * 
 * Provides:
 * - Camera video capture
 * - Facial landmark detection via face-api.js
 * - Face tracking integration with TensorFlow.js
 * - Real-time facial expression mirroring to 3D avatar
 * - Emotion detection from facial expressions
 * - Head pose estimation (yaw, pitch, roll)
 * - Eye and mouth tracking for lip-sync
 * 
 * ============================================================
 */

import * as THREE from 'three';
import { AvatarState, AvatarManager, avatarManager } from './avatarService';
import { AvatarEmotion, HeadGesture, HandGesture, BodyGesture } from '../../../../server/services/aiAvatarConnector';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Facial landmark points
 */
export interface FacialLandmarks {
  // Eye landmarks (68-point model)
  leftEye: { x: number; y: number }[];
  rightEye: { x: number; y: number }[];
  leftEyeCenter: { x: number; y: number };
  rightEyeCenter: { x: number; y: number };
  
  // Mouth landmarks
  mouth: { x: number; y: number }[];
  mouthCenter: { x: number; y: number };
  mouthWidth: number;
  mouthHeight: number;
  
  // Nose landmarks
  nose: { x: number; y: number }[];
  noseTip: { x: number; y: number };
  
  // Jaw landmarks
  jaw: { x: number; y: number }[];
  
  // Eyebrow landmarks
  leftEyebrow: { x: number; y: number }[];
  rightEyebrow: { x: number; y: number }[];
  
  // Face contour
  faceContour: { x: number; y: number }[];
}

/**
 * Head pose estimation
 */
export interface HeadPose {
  yaw: number;      // Left/Right rotation (radians)
  pitch: number;    // Up/Down rotation (radians)
  roll: number;     // Tilt rotation (radians)
  rotationMatrix: THREE.Matrix4;
  eulerAngles: THREE.Euler;
}

/**
 * Eye tracking data
 */
export interface EyeTracking {
  leftEyeOpen: number;   // 0-1 (0 = closed, 1 = fully open)
  rightEyeOpen: number;  // 0-1
  leftEyeGaze: { x: number; y: number; z: number };
  rightEyeGaze: { x: number; y: number; z: number };
  averageGaze: { x: number; y: number; z: number };
  blinkDetection: boolean;
  blinkConfidence: number;
}

/**
 * Mouth tracking data
 */
export interface MouthTracking {
  openness: number;      // 0-1 (0 = closed, 1 = fully open)
  width: number;          // 0-1 (0 = narrow, 1 = wide)
  smile: number;          // 0-1 (0 = neutral, 1 = big smile)
  frown: number;          // 0-1 (0 = neutral, 1 = frown)
  isSpeaking: boolean;
  viseme: string | null;  // Current viseme for lip-sync
}

/**
 * Facial expression analysis
 */
export interface FacialExpression {
  emotions: Record<string, number>; // emotion -> confidence (0-1)
  dominantEmotion: string;
  confidence: number;
  
  // Action units (facial muscle activations)
  au4: number;  // Brow lowering
  au5: number;  // Upper lid raising
  au6: number;  // Cheek raising (smile)
  au7: number;  // Lid tightening
  au9: number;  // Nose wrinkling
  au12: number; // Lip corner pulling (smile)
  au15: number; // Lip corner depression (frown)
  au17: number; // Chin raising
  au20: number; // Lip stretching
  au23: number; // Lip tightening
  au25: number; // Lips parting
  au26: number; // Jaw dropping
  au28: number; // Lip sucking
  au45: number; // Blinking
}

/**
 * Face detection result
 */
export interface FaceDetection {
  detection: {
    box: { x: number; y: number; width: number; height: number };
    confidence: number;
    class: 'face';
  };
  landmarks: FacialLandmarks;
  pose: HeadPose;
  eyes: EyeTracking;
  mouth: MouthTracking;
  expression: FacialExpression;
  timestamp: number;
}

/**
 * Face tracking options
 */
export interface FaceTrackingOptions {
  minConfidence?: number;           // Minimum face detection confidence (0-1)
  detectionInterval?: number;       // Ms between detections
  smoothFactor?: number;            // Smoothing factor for animations (0-1)
  enableEmotionDetection?: boolean;
  enableHeadPose?: boolean;
  enableEyeTracking?: boolean;
  enableMouthTracking?: boolean;
  enableExpressionAnalysis?: boolean;
  cameraId?: string;                // Specific camera device ID
  resolution?: { width: number; height: number };
  mirror?: boolean;                 // Mirror the camera feed
}

/**
 * Face tracking state
 */
export interface FaceTrackingState {
  isTracking: boolean;
  isDetected: boolean;
  detectionConfidence: number;
  lastDetection?: FaceDetection;
  lastUpdate: number;
  error?: string;
}

/**
 * Mapping from facial expressions to avatar emotions
 */
const EXPRESSION_TO_EMOTION: Record<string, AvatarEmotion> = {
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

/**
 * Mapping from AU (Action Units) to gestures
 */
const AU_TO_GESTURE: Record<string, { head?: HeadGesture; hand?: HandGesture }> = {
  'au1+2': { head: 'RAISE_EYEBROWS' },       // Inner + Outer brow raiser
  'au4': { head: 'LOOK_DOWN' },              // Brow lowering
  'au5+7': { head: 'RAISE_EYEBROWS' },       // Eye widening
  'au6+12': { hand: 'WAVE' },                // Cheek raiser + lip corner puller (big smile)
  'au15': { head: 'LOOK_DOWN', hand: 'CROSS_ARMS' }, // Frown
  'au25+26': { },                            // Mouth open (speaking)
};

// ============================================================================
// FACE DETECTION MODELS (face-api.js compatible)
// ============================================================================

/**
 * Face detection model types
 */
export type FaceDetectionModel = 'SSD_MOBILENET_V1' | 'TINY_FACE_DETECTOR' | 'MTCNN';

/**
 * Face landmark model types
 */
export type FaceLandmarkModel = 'FACE_LANDMARK_68' | 'FACE_LANDMARK_68_TINY';

/**
 * Emotion recognition model types
 */
export type EmotionModel = 'FACE_EXPRESSION' | 'AGE_GENDER' | 'EMOTION_FER2013';

/**
 * Model loading configuration
 */
export interface ModelConfig {
  detectionModel: FaceDetectionModel;
  landmarkModel: FaceLandmarkModel;
  expressionModel?: EmotionModel;
  modelBasePath?: string; // URL prefix for model files
  loadFromDisk?: boolean; // Load from local disk vs CDN
}

// ============================================================================
// FACE TRACKING SERVICE
// ============================================================================

/**
 * Main Face Tracking Service
 * Handles camera capture, face detection, and avatar synchronization
 */
export class FaceTrackingService {
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private context: CanvasRenderingContext2D | null = null;
  
  private options: FaceTrackingOptions;
  private state: FaceTrackingState;
  private modelConfig: ModelConfig;
  
  // face-api.js integration
  private faceApiLoaded: boolean = false;
  private faceApi: any = null;
  private detectionInterval: number | null = null;
  private animationFrameId: number | null = null;
  
  // Avatar reference
  private avatarManager: AvatarManager | null = null;
  
  // Smoothing buffers
  private poseHistory: HeadPose[] = [];
  private expressionHistory: FacialExpression[] = [];
  private mouthHistory: MouthTracking[] = [];
  
  // Callback handlers
  private onFaceDetected: ((detection: FaceDetection) => void) | null = null;
  private onFaceLost: (() => void) | null = null;
  private onTrackingStart: (() => void) | null = null;
  private onTrackingStop: (() => void) | null = null;
  private onError: ((error: Error) => void) | null = null;
  private onEmotionChange: ((emotion: AvatarEmotion, confidence: number) => void) | null = null;
  private onPoseChange: ((pose: HeadPose) => void) | null = null;

  constructor(avatarManager?: AvatarManager, options: FaceTrackingOptions = {}, modelConfig: ModelConfig = {}) {
    this.avatarManager = avatarManager || null;
    
    this.options = {
      minConfidence: 0.5,
      detectionInterval: 100, // ~10fps
      smoothFactor: 0.3,
      enableEmotionDetection: true,
      enableHeadPose: true,
      enableEyeTracking: true,
      enableMouthTracking: true,
      enableExpressionAnalysis: true,
      cameraId: '',
      resolution: { width: 640, height: 480 },
      mirror: true,
      ...options,
    };
    
    this.state = {
      isTracking: false,
      isDetected: false,
      detectionConfidence: 0,
      lastUpdate: 0,
    };
    
    this.modelConfig = {
      detectionModel: 'SSD_MOBILENET_V1',
      landmarkModel: 'FACE_LANDMARK_68',
      expressionModel: 'FACE_EXPRESSION',
      modelBasePath: '/models/face-api/',
      loadFromDisk: false,
      ...modelConfig,
    };
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  /**
   * Initialize the face tracking service
   */
  async initialize(): Promise<void> {
    console.log('Initializing Face Tracking Service...');
    
    try {
      // Load face-api.js if not already loaded
      await this.loadFaceApi();
      
      // Load models
      await this.loadModels();
      
      // Create video element
      this.createVideoElement();
      
      console.log('Face Tracking Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Face Tracking Service:', error);
      this.state.error = `Initialization failed: ${error}`;
      throw error;
    }
  }

  /**
   * Load face-api.js library dynamically
   */
  private async loadFaceApi(): Promise<void> {
    if (this.faceApiLoaded) return;
    
    try {
      // Check if face-api.js is already loaded globally
      if (typeof (window as any).faceapi !== 'undefined') {
        this.faceApi = (window as any).faceapi;
        this.faceApiLoaded = true;
        console.log('face-api.js already loaded from global scope');
        return;
      }
      
      // Load face-api.js from CDN
      console.log('Loading face-api.js from CDN...');
      await this.loadScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
      
      this.faceApi = (window as any).faceapi;
      this.faceApiLoaded = true;
      console.log('face-api.js loaded successfully');
    } catch (error) {
      console.error('Failed to load face-api.js:', error);
      throw new Error('face-api.js loading failed');
    }
  }

  /**
   * Load face-api.js scripts dynamically
   */
  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Load required models
   */
  private async loadModels(): Promise<void> {
    if (!this.faceApi || !this.faceApiLoaded) {
      throw new Error('face-api.js not loaded');
    }
    
    console.log('Loading face detection models...');
    
    try {
      // Set model paths
      const basePath = this.modelConfig.modelBasePath || '/models/face-api/';
      
      // Load detection model
      await this.faceApi.nets[`${this.modelConfig.detectionModel}`].loadFromUri(
        `${basePath}${this.getModelPath(this.modelConfig.detectionModel)}`
      );
      console.log(`Loaded ${this.modelConfig.detectionModel} detection model`);
      
      // Load landmark model
      await this.faceApi.nets[`${this.modelConfig.landmarkModel}`].loadFromUri(
        `${basePath}${this.getModelPath(this.modelConfig.landmarkModel)}`
      );
      console.log(`Loaded ${this.modelConfig.landmarkModel} landmark model`);
      
      // Load expression model if enabled
      if (this.modelConfig.expressionModel && this.options.enableExpressionAnalysis) {
        await this.faceApi.nets[`${this.modelConfig.expressionModel}`].loadFromUri(
          `${basePath}${this.getModelPath(this.modelConfig.expressionModel)}`
        );
        console.log(`Loaded ${this.modelConfig.expressionModel} expression model`);
      }
      
      console.log('All models loaded successfully');
    } catch (error) {
      console.error('Failed to load models:', error);
      throw new Error(`Model loading failed: ${error}`);
    }
  }

  /**
   * Get model file path based on model type
   */
  private getModelPath(modelType: string): string {
    const paths: Record<string, string> = {
      'SSD_MOBILENET_V1': 'ssd_mobilenetv1_model-weights_manifest.json',
      'TINY_FACE_DETECTOR': 'tiny_face_detector_model-weights_manifest.json',
      'MTCNN': 'mtcnn_model-weights_manifest.json',
      'FACE_LANDMARK_68': 'face_landmark_68_model-weights_manifest.json',
      'FACE_LANDMARK_68_TINY': 'face_landmark_68_tiny_model-weights_manifest.json',
      'FACE_EXPRESSION': 'face_expression_model-weights_manifest.json',
      'AGE_GENDER': 'age_gender_model-weights_manifest.json',
      'EMOTION_FER2013': 'emotion_fer2013_model-weights_manifest.json',
    };
    return paths[modelType] || modelType.toLowerCase().replace('_', '-') + '_model-weights_manifest.json';
  }

  /**
   * Create video element for camera feed
   */
  private createVideoElement(): void {
    if (this.videoElement) return;
    
    this.videoElement = document.createElement('video');
    this.videoElement.id = 'face-tracking-video';
    this.videoElement.style.display = 'none';
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.top = '-9999px';
    this.videoElement.style.left = '-9999px';
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.muted = true;
    
    document.body.appendChild(this.videoElement);
    
    // Create canvas for drawing (optional, for debugging)
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.id = 'face-tracking-canvas';
    this.canvasElement.style.display = 'none';
    this.context = this.canvasElement.getContext('2d');
  }

  // ==========================================================================
  // CAMERA MANAGEMENT
  // ==========================================================================

  /**
   * Start camera stream
   */
  async startCamera(): Promise<void> {
    if (this.stream) {
      console.log('Camera already started');
      return;
    }
    
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: this.options.cameraId ? { exact: this.options.cameraId } : undefined,
          width: this.options.resolution?.width,
          height: this.options.resolution?.height,
          facingMode: 'user',
        },
        audio: false,
      };
      
      console.log('Starting camera with constraints:', constraints);
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.onloadedmetadata = () => {
          this.canvasElement?.setAttribute('width', String(this.videoElement!.videoWidth));
          this.canvasElement?.setAttribute('height', String(this.videoElement!.videoHeight));
          console.log('Camera stream started', this.videoElement!.videoWidth, 'x', this.videoElement!.videoHeight);
        };
      }
      
      console.log('Camera started successfully');
    } catch (error) {
      console.error('Failed to start camera:', error);
      this.state.error = `Camera error: ${error}`;
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
      console.log('Camera stopped');
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  /**
   * Switch camera
   */
  async switchCamera(deviceId: string): Promise<void> {
    console.log('Switching to camera:', deviceId);
    
    // Stop current stream
    this.stopCamera();
    
    // Update camera ID
    this.options.cameraId = deviceId;
    
    // Restart camera
    await this.startCamera();
    
    // Restart tracking if it was running
    if (this.state.isTracking) {
      await this.stop();
      await this.start();
    }
  }

  /**
   * List available cameras
   */
  async listCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'videoinput');
    } catch (error) {
      console.error('Failed to list cameras:', error);
      return [];
    }
  }

  // ==========================================================================
  // FACE DETECTION
  // ==========================================================================

  /**
   * Start face tracking
   */
  async start(): Promise<void> {
    if (this.state.isTracking) {
      console.log('Face tracking already started');
      return;
    }
    
    try {
      // Ensure camera is started
      if (!this.stream) {
        await this.startCamera();
      }
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        if (this.videoElement?.readyState >= HTMLVideoElement.HAVE_CURRENT_DATA) {
          resolve(void 0);
        } else {
          this.videoElement?.addEventListener('loadeddata', () => resolve(void 0));
        }
      });
      
      this.state.isTracking = true;
      this.state.isDetected = false;
      this.state.detectionConfidence = 0;
      
      // Start detection loop
      this.startDetectionLoop();
      
      // Call start callback
      this.onTrackingStart?.();
      
      console.log('Face tracking started');
    } catch (error) {
      console.error('Failed to start face tracking:', error);
      this.state.isTracking = false;
      this.state.error = `Tracking error: ${error}`;
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop face tracking
   */
  async stop(): Promise<void> {
    if (!this.state.isTracking) {
      console.log('Face tracking already stopped');
      return;
    }
    
    // Clear detection interval
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
    
    // Clear animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.state.isTracking = false;
    this.state.isDetected = false;
    this.state.detectionConfidence = 0;
    
    // Call stop callback
    this.onTrackingStop?.();
    
    console.log('Face tracking stopped');
  }

  /**
   * Start detection loop
   */
  private startDetectionLoop(): void {
    if (!this.options || !this.videoElement) return;
    
    // Use requestAnimationFrame for smoother detection
    const detectFrame = async () => {
      if (!this.state.isTracking || !this.videoElement) {
        return;
      }
      
      try {
        const detection = await this.detectFace();
        
        if (detection) {
          this.handleDetection(detection);
        } else {
          this.handleNoDetection();
        }
      } catch (error) {
        console.error('Detection error:', error);
      } finally {
        this.animationFrameId = requestAnimationFrame(detectFrame);
      }
    };
    
    this.animationFrameId = requestAnimationFrame(detectFrame);
  }

  /**
   * Detect face from video frame
   */
  private async detectFace(): Promise<FaceDetection | null> {
    if (!this.faceApi || !this.videoElement || !this.faceApiLoaded) {
      return null;
    }
    
    try {
      // Get video dimensions
      const { videoWidth, videoHeight } = this.videoElement;
      if (videoWidth === 0 || videoHeight === 0) {
        return null;
      }
      
      // Detect faces
      const detections = await this.faceApi.detectAllFaces(
        this.videoElement,
        new this.faceApi[this.modelConfig.detectionModel]()
      ).withFaceLandmarks(
        new this.faceApi[this.modelConfig.landmarkModel]()
      );
      
      // Add expression detection if enabled
      let detectionsWithExpressions = detections;
      if (this.options.enableExpressionAnalysis && this.modelConfig.expressionModel) {
        detectionsWithExpressions = await this.faceApi.detectAllFaces(
          this.videoElement,
          new this.faceApi[this.modelConfig.detectionModel]()
        ).withFaceLandmarks(
          new this.faceApi[this.modelConfig.landmarkModel]()
        ).withFaceExpressions();
      }
      
      // Get the first (most prominent) face
      const detection = detectionsWithExpressions[0];
      if (!detection) {
        return null;
      }
      
      // Parse landmarks
      const landmarks = this.parseLandmarks(detection);
      
      // Estimate head pose
      const pose = this.estimateHeadPose(landmarks);
      
      // Track eyes
      const eyes = this.trackEyes(landmarks);
      
      // Track mouth
      const mouth = this.trackMouth(landmarks);
      
      // Analyze expression
      const expression = this.analyzeExpression(detection, landmarks);
      
      return {
        detection: {
          box: detection.detection.box,
          confidence: detection.detection.score,
          class: 'face',
        },
        landmarks,
        pose,
        eyes,
        mouth,
        expression,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Face detection failed:', error);
      return null;
    }
  }

  /**
   * Parse face-api.js landmarks into our format
   */
  private parseLandmarks(detection: any): FacialLandmarks {
    const landmarks = detection.landmarks;
    const positions = landmarks.positions;
    
    return {
      // Eye landmarks
      leftEye: this.getLandmarkPoints(positions, 'leftEye'),
      rightEye: this.getLandmarkPoints(positions, 'rightEye'),
      leftEyeCenter: this.calculateCenter(positions, 'leftEye'),
      rightEyeCenter: this.calculateCenter(positions, 'rightEye'),
      
      // Mouth landmarks
      mouth: this.getLandmarkPoints(positions, 'mouth'),
      mouthCenter: this.calculateCenter(positions, 'mouth'),
      mouthWidth: this.calculateMouthWidth(positions),
      mouthHeight: this.calculateMouthHeight(positions),
      
      // Nose landmarks
      nose: this.getLandmarkPoints(positions, 'nose'),
      noseTip: this.getLandmarkPoints(positions, 'nose')[0] || { x: 0, y: 0 },
      
      // Jaw landmarks
      jaw: this.getLandmarkPoints(positions, 'jaw'),
      
      // Eyebrow landmarks
      leftEyebrow: this.getLandmarkPoints(positions, 'leftEyebrow'),
      rightEyebrow: this.getLandmarkPoints(positions, 'rightEyebrow'),
      
      // Face contour
      faceContour: [],
    };
  }

  /**
   * Get landmark points for a specific feature
   */
  private getLandmarkPoints(positions: any[], feature: string): { x: number; y: number }[] {
    const featureParts: Record<string, number[]> = {
      leftEye: [36, 37, 38, 39, 40, 41],
      rightEye: [42, 43, 44, 45, 46, 47],
      mouth: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67],
      nose: [27, 28, 29, 30, 31, 32, 33, 34, 35],
      jaw: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      leftEyebrow: [17, 18, 19, 20, 21],
      rightEyebrow: [22, 23, 24, 25, 26],
    };
    
    const indices = featureParts[feature] || [];
    return indices.map(idx => ({
      x: positions[idx]?.x || 0,
      y: positions[idx]?.y || 0,
    }));
  }

  /**
   * Calculate center point from landmarks
   */
  private calculateCenter(positions: any[], feature: string): { x: number; y: number } {
    const points = this.getLandmarkPoints(positions, feature);
    if (points.length === 0) return { x: 0, y: 0 };
    
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    
    return {
      x: sumX / points.length,
      y: sumY / points.length,
    };
  }

  /**
   * Calculate mouth width
   */
  private calculateMouthWidth(positions: any[]): number {
    const points = this.getLandmarkPoints(positions, 'mouth');
    if (points.length < 2) return 0;
    
    const left = points[0];
    const right = points[6];
    return Math.sqrt(Math.pow(right.x - left.x, 2) + Math.pow(right.y - left.y, 2));
  }

  /**
   * Calculate mouth height
   */
  private calculateMouthHeight(positions: any[]): number {
    const points = this.getLandmarkPoints(positions, 'mouth');
    if (points.length < 2) return 0;
    
    const top = points[3];
    const bottom = points[9];
    return Math.sqrt(Math.pow(bottom.x - top.x, 2) + Math.pow(bottom.y - top.y, 2));
  }

  // ==========================================================================
  // HEAD POSE ESTIMATION
  // ==========================================================================

  /**
   * Estimate head pose (yaw, pitch, roll) from 3D landmarks
   * Uses the 3D model points and 2D image points to solve PnP
   */
  private estimateHeadPose(landmarks: FacialLandmarks): HeadPose {
    // Define 3D model points (in a normalized coordinate system)
    // These are approximate positions of facial landmarks in 3D space
    const modelPoints = [
      // Nose tip
      { x: 0, y: 0, z: 0 },
      // Left eye inner corner
      { x: -0.15, y: 0.1, z: -0.1 },
      // Right eye inner corner
      { x: 0.15, y: 0.1, z: -0.1 },
      // Left mouth corner
      { x: -0.15, y: -0.15, z: -0.05 },
      // Right mouth corner
      { x: 0.15, y: -0.15, z: -0.05 },
      // Chin
      { x: 0, y: -0.3, z: -0.1 },
    ];
    
    // Map to 2D image points
    const imagePoints = [
      landmarks.noseTip,
      landmarks.leftEye[0],
      landmarks.rightEye[5],
      landmarks.mouth[0],
      landmarks.mouth[6],
      landmarks.jaw[8],
    ];
    
    // Camera matrix (approximate)
    const cameraMatrix = new THREE.Matrix3().set(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
    
    // Distortion coefficients (none for simplicity)
    const distortionCoeffs = new THREE.Vector4(0, 0, 0, 0);
    
    // Use PnP (Perspective-n-Point) algorithm to estimate pose
    // This is a simplified version - in production, use a proper PnP solver
    const pose = this.simplePoseEstimation(
      modelPoints,
      imagePoints.map(p => new THREE.Vector2(p.x, p.y))
    );
    
    return {
      yaw: pose.yaw,
      pitch: pose.pitch,
      roll: pose.roll,
      rotationMatrix: pose.rotationMatrix,
      eulerAngles: pose.eulerAngles,
    };
  }

  /**
   * Simplified pose estimation based on eye and nose positions
   */
  private simplePoseEstimation(
    modelPoints: { x: number; y: number; z: number }[],
    imagePoints: THREE.Vector2[]
  ): {
    yaw: number;
    pitch: number;
    roll: number;
    rotationMatrix: THREE.Matrix4;
    eulerAngles: THREE.Euler;
  } {
    // Calculate relative positions
    const leftEye = imagePoints[1];
    const rightEye = imagePoints[2];
    const noseTip = imagePoints[0];
    const mouthCenter = new THREE.Vector2(
      (imagePoints[3].x + imagePoints[4].x) / 2,
      (imagePoints[3].y + imagePoints[4].y) / 2
    );
    
    // Calculate eye midpoint
    const eyeMid = new THREE.Vector2(
      (leftEye.x + rightEye.x) / 2,
      (leftEye.y + rightEye.y) / 2
    );
    
    // Calculate vectors
    const eyeVector = new THREE.Vector2(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    const noseVector = new THREE.Vector2(noseTip.x - eyeMid.x, noseTip.y - eyeMid.y);
    const mouthVector = new THREE.Vector2(mouthCenter.x - eyeMid.x, mouthCenter.y - eyeMid.y);
    
    // Calculate angles
    // Yaw: rotation around Y axis (left/right)
    const yaw = Math.atan2(noseVector.x, eyeVector.x);
    
    // Pitch: rotation around X axis (up/down)
    const pitch = Math.atan2(noseVector.y, Math.sqrt(noseVector.x ** 2 + noseVector.y ** 2));
    
    // Roll: rotation around Z axis (tilt)
    const eyeAngle = Math.atan2(eyeVector.y, eyeVector.x);
    const roll = eyeAngle - Math.PI / 2;
    
    // Create rotation matrix from Euler angles
    const euler = new THREE.Euler(pitch, yaw, roll, 'YXZ');
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
    
    return {
      yaw,
      pitch,
      roll,
      rotationMatrix,
      eulerAngles: euler,
    };
  }

  // ==========================================================================
  // EYE TRACKING
  // ==========================================================================

  /**
   * Track eye movements and blinking
   */
  private trackEyes(landmarks: FacialLandmarks): EyeTracking {
    // Calculate eye openness (EAR - Eye Aspect Ratio)
    const leftEyeOpen = this.calculateEyeOpenness(landmarks.leftEye);
    const rightEyeOpen = this.calculateEyeOpenness(landmarks.rightEye);
    
    // Detect blinking
    const blinkThreshold = 0.2;
    const blinkDetection = leftEyeOpen < blinkThreshold && rightEyeOpen < blinkThreshold;
    const blinkConfidence = 1 - Math.min(leftEyeOpen, rightEyeOpen);
    
    // Calculate gaze direction (simplified)
    // In a real implementation, this would use 3D eye model and pupil detection
    const leftEyeGaze = this.estimateGazeDirection(landmarks.leftEye, landmarks.leftEyeCenter);
    const rightEyeGaze = this.estimateGazeDirection(landmarks.rightEye, landmarks.rightEyeCenter);
    
    const averageGaze = {
      x: (leftEyeGaze.x + rightEyeGaze.x) / 2,
      y: (leftEyeGaze.y + rightEyeGaze.y) / 2,
      z: (leftEyeGaze.z + rightEyeGaze.z) / 2,
    };
    
    return {
      leftEyeOpen,
      rightEyeOpen,
      leftEyeGaze,
      rightEyeGaze,
      averageGaze,
      blinkDetection,
      blinkConfidence,
    };
  }

  /**
   * Calculate eye openness using Eye Aspect Ratio (EAR)
   */
  private calculateEyeOpenness(eyePoints: { x: number; y: number }[]): number {
    if (eyePoints.length < 6) return 1;
    
    // Get 6 key points for EAR calculation
    const points = eyePoints.slice(0, 6);
    
    // Calculate distances between vertical eye landmarks
    const a = this.distance2D(points[1], points[5]);
    const b = this.distance2D(points[2], points[4]);
    
    // Calculate distance between horizontal eye landmarks
    const c = this.distance2D(points[0], points[3]);
    
    // EAR = (A + B) / (2 * C)
    const ear = (a + b) / (2 * c);
    
    // Normalize and clamp to 0-1
    return Math.min(1, Math.max(0, ear * 2));
  }

  /**
   * Estimate gaze direction from eye landmarks
   * This is a simplified 2D estimation
   */
  private estimateGazeDirection(
    eyePoints: { x: number; y: number }[],
    eyeCenter: { x: number; y: number }
  ): { x: number; y: number; z: number } {
    if (eyePoints.length < 6) return { x: 0, y: 0, z: -1 };
    
    // Iris/pupil position (approximate from inner corners)
    const pupilX = (eyePoints[0].x + eyePoints[3].x) / 2;
    const pupilY = (eyePoints[0].y + eyePoints[3].y) / 2;
    
    // Calculate direction from eye center to pupil
    const dx = pupilX - eyeCenter.x;
    const dy = pupilY - eyeCenter.y;
    
    // Normalize
    const length = Math.sqrt(dx * dx + dy * dy);
    
    return {
      x: dx / length,
      y: dy / length,
      z: -1, // Forward direction
    };
  }

  // ==========================================================================
  // MOUTH TRACKING
  // ==========================================================================

  /**
   * Track mouth movements
   */
  private trackMouth(landmarks: FacialLandmarks): MouthTracking {
    const mouthWidth = landmarks.mouthWidth;
    const mouthHeight = landmarks.mouthHeight;
    
    // Calculate openness (ratio of height to width)
    const maxExpectedHeight = 0.6; // Maximum expected mouth height relative to width
    const openness = Math.min(1, mouthHeight / (mouthWidth * maxExpectedHeight + 0.001));
    
    // Calculate smile (check if mouth corners are raised)
    const mouthCorners = [landmarks.mouth[0], landmarks.mouth[6]];
    const mouthMid = landmarks.mouth[3];
    const smile = this.calculateSmile(landmarks.mouth);
    
    // Calculate frown
    const frown = this.calculateFrown(landmarks.mouth);
    
    // Determine if speaking (rapid mouth movement)
    const isSpeaking = this.mouthHistory.length > 0 && 
      Math.abs(openness - this.mouthHistory[this.mouthHistory.length - 1].openness) > 0.1;
    
    // Map openness to viseme (simplified)
    const viseme = this.mapOpennessToViseme(openness, mouthWidth);
    
    return {
      openness,
      width: mouthWidth / 100, // Normalize
      smile,
      frown,
      isSpeaking,
      viseme,
    };
  }

  /**
   * Calculate smile intensity
   */
  private calculateSmile(mouthPoints: { x: number; y: number }[]): number {
    if (mouthPoints.length < 7) return 0;
    
    const leftCorner = mouthPoints[0];
    const rightCorner = mouthPoints[6];
    const lipMid = mouthPoints[3];
    
    // Calculate how much corners are raised relative to lip center
    const leftHeight = leftCorner.y - lipMid.y;
    const rightHeight = rightCorner.y - lipMid.y;
    const avgHeight = (leftHeight + rightHeight) / 2;
    
    // Normalize (positive = smile, negative = frown)
    return Math.min(1, Math.max(0, avgHeight / 10));
  }

  /**
   * Calculate frown intensity
   */
  private calculateFrown(mouthPoints: { x: number; y: number }[]): number {
    if (mouthPoints.length < 7) return 0;
    
    const leftCorner = mouthPoints[0];
    const rightCorner = mouthPoints[6];
    const lipMid = mouthPoints[3];
    
    // Calculate how much corners are lowered relative to lip center
    const leftHeight = lipMid.y - leftCorner.y;
    const rightHeight = lipMid.y - rightCorner.y;
    const avgHeight = (leftHeight + rightHeight) / 2;
    
    // Normalize (positive = frown)
    return Math.min(1, Math.max(0, avgHeight / 10));
  }

  /**
   * Map mouth openness and width to viseme
   */
  private mapOpennessToViseme(openness: number, width: number): string | null {
    if (openness < 0.1) return null; // Mouth closed
    if (openness < 0.2 && width > 0.3) return 'ee'; // Small open, wide = E
    if (openness < 0.3) return 'ih'; // Small open = I
    if (openness < 0.5) return 'aa'; // Medium open = A
    if (width > 0.4) return 'ee'; // Wide = E
    return 'oh'; // Large open = O/U
  }

  // ==========================================================================
  // EXPRESSION ANALYSIS
  // ==========================================================================

  /**
   * Analyze facial expression
   */
  private analyzeExpression(detection: any, landmarks: FacialLandmarks): FacialExpression {
    // Get expressions from face-api.js if available
    if (detection.expressions) {
      const apiExpressions = detection.expressions;
      const emotions: Record<string, number> = {};
      let maxEmotion = '';
      let maxConfidence = 0;
      
      for (const [emotion, confidence] of Object.entries(apiExpressions)) {
        emotions[emotion] = confidence as number;
        if (confidence > maxConfidence) {
          maxConfidence = confidence as number;
          maxEmotion = emotion;
        }
      }
      
      return {
        emotions,
        dominantEmotion: maxEmotion || 'neutral',
        confidence: maxConfidence,
        // Placeholder for action units
        au4: emotions.angry || 0,
        au5: emotions.happy || 0,
        au6: emotions.happy || 0,
        au7: emotions.surprised || 0,
        au9: emotions.disgusted || 0,
        au12: emotions.happy || 0,
        au15: emotions.sad || 0,
        au17: 0,
        au20: emotions.surprised || 0,
        au23: 0,
        au25: emotions.surprised || 0,
        au26: 0,
        au28: 0,
        au45: 0,
      };
    }
    
    // Fallback: calculate from landmarks
    return this.calculateExpressionFromLandmarks(landmarks);
  }

  /**
   * Calculate expression from landmarks (fallback)
   */
  private calculateExpressionFromLandmarks(landmarks: FacialLandmarks): FacialExpression {
    // Calculate various features
    const eyeOpenness = (this.calculateEyeOpenness(landmarks.leftEye) + 
                        this.calculateEyeOpenness(landmarks.rightEye)) / 2;
    const mouthOpenness = Math.min(1, landmarks.mouthHeight / 50);
    const smile = this.calculateSmile(landmarks.mouth);
    const frown = this.calculateFrown(landmarks.mouth);
    const browRaise = this.calculateBrowRaise(landmarks);
    
    // Simple emotion detection based on features
    const emotions: Record<string, number> = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      surprised: 0,
      fearful: 0,
      disgusted: 0,
    };
    
    // Map features to emotions
    if (smile > 0.5) emotions.happy = smile;
    if (frown > 0.3) emotions.sad = frown * 0.7;
    if (browRaise > 0.3) emotions.angry = browRaise * 0.5;
    if (eyeOpenness > 0.8 && mouthOpenness > 0.7) emotions.surprised = 0.9;
    if (eyeOpenness < 0.2 && mouthOpenness < 0.1) emotions.neutral = 1;
    
    // Find dominant emotion
    let dominantEmotion = 'neutral';
    let maxConfidence = 0;
    for (const [emotion, confidence] of Object.entries(emotions)) {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        dominantEmotion = emotion;
      }
    }
    
    return {
      emotions,
      dominantEmotion,
      confidence: maxConfidence,
      // Action units (simplified)
      au4: browRaise,
      au5: eyeOpenness,
      au6: smile,
      au7: 0,
      au9: 0,
      au12: smile,
      au15: frown,
      au17: 0,
      au20: mouthOpenness,
      au23: 0,
      au25: mouthOpenness,
      au26: mouthOpenness,
      au28: 0,
      au45: 1 - eyeOpenness,
    };
  }

  /**
   * Calculate eyebrow/brow raise
   */
  private calculateBrowRaise(landmarks: FacialLandmarks): number {
    if (landmarks.leftEyebrow.length === 0 || landmarks.rightEyebrow.length === 0) return 0;
    
    // Get eyebrow center Y position
    const leftBrowY = landmarks.leftEyebrow.reduce((sum, p) => sum + p.y, 0) / landmarks.leftEyebrow.length;
    const rightBrowY = landmarks.rightEyebrow.reduce((sum, p) => sum + p.y, 0) / landmarks.rightEyebrow.length;
    const avgBrowY = (leftBrowY + rightBrowY) / 2;
    
    // Get eye center Y position
    const eyeY = (landmarks.leftEyeCenter.y + landmarks.rightEyeCenter.y) / 2;
    
    // Calculate difference (negative = raised)
    const raise = eyeY - avgBrowY;
    return Math.min(1, Math.max(0, raise / 20));
  }

  // ==========================================================================
  // DETECTION HANDLING
  // ==========================================================================

  /**
   * Handle a face detection
   */
  private handleDetection(detection: FaceDetection): void {
    this.state.isDetected = true;
    this.state.detectionConfidence = detection.detection.confidence;
    this.state.lastDetection = detection;
    this.state.lastUpdate = Date.now();
    
    // Smooth the pose
    const smoothedPose = this.smoothPose(detection.pose);
    
    // Smooth the expression
    const smoothedExpression = this.smoothExpression(detection.expression);
    
    // Update avatar with face tracking data
    this.updateAvatarFromDetection(detection, smoothedPose, smoothedExpression);
    
    // Call detection callback
    this.onFaceDetected?.(detection);
    
    // Call emotion change callback
    const emotion = EXPRESSION_TO_EMOTION[smoothedExpression.dominantEmotion] || 'NEUTRAL';
    this.onEmotionChange?.(emotion, smoothedExpression.confidence);
    
    // Call pose change callback
    this.onPoseChange?.(smoothedPose);
  }

  /**
   * Handle no face detection
   */
  private handleNoDetection(): void {
    if (this.state.isDetected) {
      this.state.isDetected = false;
      this.state.detectionConfidence = 0;
      
      // Reset avatar to neutral
      this.resetAvatarToNeutral();
      
      // Call face lost callback
      this.onFaceLost?.();
    }
  }

  /**
   * Smooth pose data using exponential moving average
   */
  private smoothPose(pose: HeadPose): HeadPose {
    if (!this.options.smoothFactor || this.options.smoothFactor >= 1) {
      return pose;
    }
    
    this.poseHistory.push(pose);
    if (this.poseHistory.length > 10) {
      this.poseHistory.shift();
    }
    
    if (this.poseHistory.length < 2) {
      return pose;
    }
    
    // Average with previous poses
    const smoothedYaw = this.poseHistory.reduce((sum, p) => sum + p.yaw, 0) / this.poseHistory.length;
    const smoothedPitch = this.poseHistory.reduce((sum, p) => sum + p.pitch, 0) / this.poseHistory.length;
    const smoothedRoll = this.poseHistory.reduce((sum, p) => sum + p.roll, 0) / this.poseHistory.length;
    
    // Apply smoothing factor
    const factor = this.options.smoothFactor || 0.3;
    const resultYaw = pose.yaw * (1 - factor) + smoothedYaw * factor;
    const resultPitch = pose.pitch * (1 - factor) + smoothedPitch * factor;
    const resultRoll = pose.roll * (1 - factor) + smoothedRoll * factor;
    
    const euler = new THREE.Euler(resultPitch, resultYaw, resultRoll, 'YXZ');
    const rotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
    
    return {
      ...pose,
      yaw: resultYaw,
      pitch: resultPitch,
      roll: resultRoll,
      rotationMatrix,
      eulerAngles: euler,
    };
  }

  /**
   * Smooth expression data
   */
  private smoothExpression(expression: FacialExpression): FacialExpression {
    if (!this.options.smoothFactor || this.options.smoothFactor >= 1) {
      return expression;
    }
    
    this.expressionHistory.push(expression);
    if (this.expressionHistory.length > 5) {
      this.expressionHistory.shift();
    }
    
    if (this.expressionHistory.length < 2) {
      return expression;
    }
    
    // Average emotions
    const smoothedEmotions: Record<string, number> = {};
    for (const historyExpression of this.expressionHistory) {
      for (const [emotion, confidence] of Object.entries(historyExpression.emotions)) {
        smoothedEmotions[emotion] = (smoothedEmotions[emotion] || 0) + confidence;
      }
    }
    
    // Normalize
    for (const emotion of Object.keys(smoothedEmotions)) {
      smoothedEmotions[emotion] /= this.expressionHistory.length;
    }
    
    // Find dominant emotion
    let dominantEmotion = expression.dominantEmotion;
    let maxConfidence = 0;
    for (const [emotion, confidence] of Object.entries(smoothedEmotions)) {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        dominantEmotion = emotion;
      }
    }
    
    return {
      ...expression,
      emotions: smoothedEmotions,
      dominantEmotion,
      confidence: maxConfidence,
    };
  }

  // ==========================================================================
  // AVATAR SYNCHRONIZATION
  // ==========================================================================

  /**
   * Update avatar based on face detection
   */
  private updateAvatarFromDetection(
    detection: FaceDetection,
    pose: HeadPose,
    expression: FacialExpression
  ): void {
    if (!this.avatarManager) {
      // Use global avatarManager if available
      this.avatarManager = avatarManager;
    }
    
    if (!this.avatarManager) {
      console.warn('No avatar manager available for synchronization');
      return;
    }
    
    // Map detected emotion to avatar emotion
    const emotion = EXPRESSION_TO_EMOTION[expression.dominantEmotion] || 'NEUTRAL';
    
    // Map head pose to gesture
    const headGesture = this.mapPoseToHeadGesture(pose);
    
    // Map expression to gesture
    const gesture = this.mapExpressionToGesture(expression);
    
    // Update avatar state
    const newState: Partial<AvatarState> = {
      emotion,
      gesture: gesture.hand,
      isSpeaking: detection.mouth.isSpeaking,
      mouthOpenness: detection.mouth.openness,
      eyeBlink: 1 - detection.eyes.leftEyeOpen, // 0 = open, 1 = closed
      browRaise: this.calculateBrowRaiseFromExpression(expression),
    };
    
    // Apply head rotation based on pose
    this.applyHeadPoseToAvatar(pose);
    
    // Update avatar state
    this.avatarManager.updateState(newState);
  }

  /**
   * Map head pose to head gesture
   */
  private mapPoseToHeadGesture(pose: HeadPose): HeadGesture {
    const absYaw = Math.abs(pose.yaw);
    const absPitch = Math.abs(pose.pitch);
    const absRoll = Math.abs(pose.roll);
    
    if (absYaw > 0.5) {
      return pose.yaw > 0 ? 'TILT_RIGHT' : 'TILT_LEFT';
    }
    if (absPitch > 0.3) {
      return pose.pitch > 0 ? 'LOOK_UP' : 'LOOK_DOWN';
    }
    if (absRoll > 0.2) {
      return absRoll > 0.4 ? 'RAISE_EYEBROWS' : 'DIRECT_GAZE';
    }
    return 'DIRECT_GAZE';
  }

  /**
   * Map expression to gesture
   */
  private mapExpressionToGesture(expression: FacialExpression): { head: HeadGesture; hand: HandGesture } {
    const dominantEmotion = expression.dominantEmotion.toLowerCase();
    
    // Check for specific action units
    if (expression.au4 > 0.5) return { head: 'LOOK_DOWN', hand: 'IDLE' };
    if (expression.au5 > 0.5) return { head: 'RAISE_EYEBROWS', hand: 'IDLE' };
    if (expression.au6 > 0.5) return { head: 'DIRECT_GAZE', hand: 'WAVE' };
    if (expression.au12 > 0.5) return { head: 'DIRECT_GAZE', hand: 'WAVE' };
    if (expression.au15 > 0.5) return { head: 'LOOK_DOWN', hand: 'CROSS_ARMS' };
    if (expression.au25 > 0.5) return { head: 'DIRECT_GAZE', hand: 'IDLE' };
    
    // Map by emotion
    switch (dominantEmotion) {
      case 'happy':
      case 'joy':
        return { head: 'DIRECT_GAZE', hand: 'WAVE' };
      case 'surprised':
        return { head: 'RAISE_EYEBROWS', hand: 'PEACE' };
      case 'angry':
      case 'disgusted':
        return { head: 'SHAKE', hand: 'CROSS_ARMS' };
      case 'sad':
        return { head: 'LOOK_DOWN', hand: 'IDLE' };
      case 'fearful':
        return { head: 'RAISE_EYEBROWS', hand: 'IDLE' };
      default:
        return { head: 'DIRECT_GAZE', hand: 'IDLE' };
    }
  }

  /**
   * Calculate brow raise from expression
   */
  private calculateBrowRaiseFromExpression(expression: FacialExpression): number {
    // Use AU4 (brow lowering) and AU5 (eye widening)
    return (expression.au5 - expression.au4) * 0.5;
  }

  /**
   * Apply head pose to avatar's head bone
   */
  private applyHeadPoseToAvatar(pose: HeadPose): void {
    // This would be implemented in the avatar manager
    // For now, just update the lookAt target based on gaze
    if (this.avatarManager && this.state.lastDetection) {
      const gaze = this.state.lastDetection.eyes.averageGaze;
      // Convert 2D gaze to 3D target position
      const target = {
        x: gaze.x * 10,
        y: gaze.y * 10,
        z: gaze.z * 10 - 5, // Offset in front of avatar
      };
      this.avatarManager.lookAt(target);
    }
  }

  /**
   * Reset avatar to neutral state
   */
  private resetAvatarToNeutral(): void {
    if (!this.avatarManager) {
      this.avatarManager = avatarManager;
    }
    
    if (this.avatarManager) {
      this.avatarManager.updateState({
        emotion: 'NEUTRAL',
        gesture: '',
        isSpeaking: false,
        mouthOpenness: 0,
        eyeBlink: 0.05,
        browRaise: 0,
      });
    }
  }

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * Calculate 2D distance between two points
   */
  private distance2D(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Set avatar manager for synchronization
   */
  setAvatarManager(manager: AvatarManager): void {
    this.avatarManager = manager;
  }

  /**
   * Get current tracking state
   */
  getState(): FaceTrackingState {
    return { ...this.state };
  }

  /**
   * Get last detection
   */
  getLastDetection(): FaceDetection | undefined {
    return this.state.lastDetection;
  }

  /**
   * Get current head pose
   */
  getCurrentPose(): HeadPose | null {
    return this.state.lastDetection?.pose || null;
  }

  /**
   * Get current eye tracking
   */
  getEyeTracking(): EyeTracking | null {
    return this.state.lastDetection?.eyes || null;
  }

  /**
   * Get current mouth tracking
   */
  getMouthTracking(): MouthTracking | null {
    return this.state.lastDetection?.mouth || null;
  }

  /**
   * Get current expression
   */
  getExpression(): FacialExpression | null {
    return this.state.lastDetection?.expression || null;
  }

  /**
   * Check if tracking is active
   */
  isTracking(): boolean {
    return this.state.isTracking;
  }

  /**
   * Check if a face is currently detected
   */
  isDetected(): boolean {
    return this.state.isDetected;
  }

  /**
   * Set callback for face detection
   */
  onDetected(callback: (detection: FaceDetection) => void): void {
    this.onFaceDetected = callback;
  }

  /**
   * Set callback for face lost
   */
  onLost(callback: () => void): void {
    this.onFaceLost = callback;
  }

  /**
   * Set callback for tracking start
   */
  onStart(callback: () => void): void {
    this.onTrackingStart = callback;
  }

  /**
   * Set callback for tracking stop
   */
  onStop(callback: () => void): void {
    this.onTrackingStop = callback;
  }

  /**
   * Set callback for error
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Set callback for emotion change
   */
  onEmotionChangeCallback(callback: (emotion: AvatarEmotion, confidence: number) => void): void {
    this.onEmotionChange = callback;
  }

  /**
   * Set callback for pose change
   */
  onPoseChangeCallback(callback: (pose: HeadPose) => void): void {
    this.onPoseChange = callback;
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<FaceTrackingOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Update model configuration
   */
  updateModelConfig(config: Partial<ModelConfig>): void {
    this.modelConfig = { ...this.modelConfig, ...config };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop().catch(console.error);
    this.stopCamera();
    
    // Remove elements
    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }
    
    if (this.canvasElement && this.canvasElement.parentNode) {
      this.canvasElement.parentNode.removeChild(this.canvasElement);
      this.canvasElement = null;
    }
    
    this.context = null;
    this.state = {
      isTracking: false,
      isDetected: false,
      detectionConfidence: 0,
      lastUpdate: 0,
    };
    
    this.poseHistory = [];
    this.expressionHistory = [];
    this.mouthHistory = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Singleton instance of FaceTrackingService
 */
export const faceTrackingService = new FaceTrackingService();

// ============================================================================
// EXPORT TYPES
// ============================================================================

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
};
