/**
 * FaceTrackingDemo.tsx
 * ============================================================
 * Demo Component for Face Tracking with AI Virtual Assistant
 * 
 * Demonstrates:
 * - Real-time face detection
 * - Emotion recognition
 * - Head pose estimation
 * - Eye and mouth tracking
 * - Avatar synchronization
 * 
 * ============================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFaceTracking, UseFaceTrackingOptions } from './hooks/useFaceTracking';
import { avatarManager, AvatarConfig } from './services/avatarService';
import { AvatarEmotion } from '../../../server/services/aiAvatarConnector';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CameraInfo {
  id: string;
  label: string;
  facing: 'user' | 'environment' | 'unknown';
}

// ============================================================================
// DEMO COMPONENT
// ============================================================================

/**
 * Face Tracking Demo Component
 * Shows how to integrate face tracking with a 3D avatar
 */
export const FaceTrackingDemo: React.FC<{
  showCamera?: boolean;
  showStats?: boolean;
  showControls?: boolean;
  autoStart?: boolean;
  onEmotionChange?: (emotion: AvatarEmotion, confidence: number) => void;
  onTrackingStart?: () => void;
  onTrackingStop?: () => void;
}> = ({
  showCamera = true,
  showStats = true,
  showControls = true,
  autoStart = false,
  onEmotionChange,
  onTrackingStart,
  onTrackingStop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [cameras, setCameras] = useState<CameraInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Face tracking hook
  const {
    isTracking,
    isDetected,
    detectionConfidence,
    currentPose,
    currentExpression,
    currentEyeTracking,
    currentMouthTracking,
    currentEmotion,
    startTracking,
    stopTracking,
    toggleTracking,
    switchCamera,
    listCameras,
    hasCameraPermission,
    requestCameraPermission,
    error,
  } = useFaceTracking({
    autoStart,
    autoSyncAvatar: true,
    onEmotionChange,
    onTrackingStart,
    onTrackingStop,
    onError: (err) => console.error('Face tracking error:', err),
  });

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    const init = async () => {
      try {
        // List cameras
        const devices = await listCameras();
        const cameraInfos = devices.map((device): CameraInfo => ({
          id: device.deviceId,
          label: device.label || `Camera ${cameras.length + 1}`,
          facing: device.facingMode || 'unknown',
        }));
        setCameras(cameraInfos);
        
        // Set default camera (prefer user-facing)
        const userCamera = cameraInfos.find(c => c.facing === 'user');
        if (userCamera) {
          setSelectedCamera(userCamera.id);
        } else if (cameraInfos.length > 0) {
          setSelectedCamera(cameraInfos[0].id);
        }
        
        // Initialize avatar
        await initializeAvatar();
        
        setIsInitialized(true);
      } catch (err) {
        console.error('Initialization error:', err);
      }
    };
    
    init();
    
    return () => {
      // Cleanup avatar
      cleanupAvatar();
    };
  }, []);

  // ==========================================================================
  // AVATAR MANAGEMENT
  // ==========================================================================

  const initializeAvatar = async (config?: Partial<AvatarConfig>) => {
    if (!containerRef.current) return;
    
    try {
      // Initialize avatar manager
      await avatarManager.initialize(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        backgroundColor: 0x050b14,
        cameraPosition: { x: 0, y: 1.6, z: 2 },
      });
      
      // Load a simple placeholder avatar
      const avatarConfig: AvatarConfig = {
        id: 'face-tracking-demo-avatar',
        name: 'Face Tracking Demo Avatar',
        scale: 1,
        position: { x: 0, y: 0, z: 0 },
        emotion: 'NEUTRAL',
        ...config,
      };
      
      // Use a placeholder if no model URL is provided
      // In production, you would use a real GLTF model URL
      await avatarManager.loadAvatar('', avatarConfig);
      
      setAvatarLoaded(true);
      
      // Handle window resize
      window.addEventListener('resize', handleResize);
      
    } catch (err) {
      console.error('Failed to initialize avatar:', err);
    }
  };

  const cleanupAvatar = () => {
    try {
      avatarManager.cleanup();
      window.removeEventListener('resize', handleResize);
    } catch (err) {
      console.error('Failed to cleanup avatar:', err);
    }
  };

  const handleResize = () => {
    if (containerRef.current && avatarManager) {
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      avatarManager.resize(width, height);
    }
  };

  // ==========================================================================
  // CAMERA HANDLING
  // ==========================================================================

  const handleCameraSelect = async (cameraId: string) => {
    try {
      setSelectedCamera(cameraId);
      await switchCamera(cameraId);
    } catch (err) {
      console.error('Failed to switch camera:', err);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const granted = await requestCameraPermission();
      if (granted && autoStart) {
        await startTracking();
      }
    } catch (err) {
      console.error('Permission request failed:', err);
    }
  };

  // ==========================================================================
  // TRACKING CONTROLS
  // ==========================================================================

  const handleStartTracking = async () => {
    try {
      if (!hasCameraPermission) {
        await handleRequestPermission();
      }
      await startTracking();
    } catch (err) {
      console.error('Failed to start tracking:', err);
    }
  };

  const handleStopTracking = async () => {
    try {
      await stopTracking();
    } catch (err) {
      console.error('Failed to stop tracking:', err);
    }
  };

  const handleRefreshCameras = async () => {
    try {
      const devices = await listCameras();
      const cameraInfos = devices.map((device): CameraInfo => ({
        id: device.deviceId,
        label: device.label || `Camera ${cameras.length + 1}`,
        facing: device.facingMode || 'unknown',
      }));
      setCameras(cameraInfos);
    } catch (err) {
      console.error('Failed to refresh cameras:', err);
    }
  };

  // ==========================================================================
  // RENDER STATS
  // ==========================================================================

  const renderStats = () => {
    if (!showStats) return null;
    
    return (
      <div className="face-tracking-stats">
        <div className="stat-row">
          <span className="stat-label">Status:</span>
          <span className={`stat-value ${isTracking ? 'active' : 'inactive'}`}>
            {isTracking ? 'Tracking' : 'Idle'}
          </span>
        </div>
        
        <div className="stat-row">
          <span className="stat-label">Face Detected:</span>
          <span className={`stat-value ${isDetected ? 'active' : 'inactive'}`}>
            {isDetected ? 'Yes' : 'No'}
          </span>
        </div>
        
        {isDetected && (
          <>
            <div className="stat-row">
              <span className="stat-label">Confidence:</span>
              <span className="stat-value">
                {(detectionConfidence * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Emotion:</span>
              <span className="stat-value emotion-value" style={{ 
                background: getEmotionColor(currentEmotion) 
              }}>
                {currentEmotion}
              </span>
            </div>
            
            {currentPose && (
              <>
                <div className="stat-row">
                  <span className="stat-label">Yaw:</span>
                  <span className="stat-value">
                    {(currentPose.yaw * 180 / Math.PI).toFixed(1)}°
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Pitch:</span>
                  <span className="stat-value">
                    {(currentPose.pitch * 180 / Math.PI).toFixed(1)}°
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Roll:</span>
                  <span className="stat-value">
                    {(currentPose.roll * 180 / Math.PI).toFixed(1)}°
                  </span>
                </div>
              </>
            )}
            
            {currentEyeTracking && (
              <div className="stat-row">
                <span className="stat-label">Eye Open:</span>
                <span className="stat-value">
                  L: {(currentEyeTracking.leftEyeOpen * 100).toFixed(0)}% | 
                  R: {(currentEyeTracking.rightEyeOpen * 100).toFixed(0)}%
                </span>
              </div>
            )}
            
            {currentMouthTracking && (
              <>
                <div className="stat-row">
                  <span className="stat-label">Mouth Open:</span>
                  <span className="stat-value">
                    {(currentMouthTracking.openness * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Viseme:</span>
                  <span className="stat-value">
                    {currentMouthTracking.viseme || 'none'}
                  </span>
                </div>
              </>
            )}
          </>
        )}
        
        {currentExpression && (
          <div className="stat-row">
            <span className="stat-label">Dominant:</span>
            <span className="stat-value">
              {currentExpression.dominantEmotion} ({currentExpression.confidence.toFixed(2)})
            </span>
          </div>
        )}
      </div>
    );
  };

  const getEmotionColor = (emotion: AvatarEmotion): string => {
    const colors: Record<AvatarEmotion, string> = {
      NEUTRAL: '#6c757d',
      CONFIDENT_SMILE: '#ffc107',
      SERIOUS_EXECUTIVE: '#0d6efd',
      ENTHUSIASTIC: '#fd7e14',
      HAPPY: '#ffc107',
      CURIOUS: '#20c997',
      THINKING: '#0dcaf0',
      LISTENING: '#6f42c1',
      ALERT: '#dc3545',
      CELEBRATING: '#ffc107',
      ANGRY: '#dc3545',
      SAD: '#6c757d',
      SURPRISED: '#ffc107',
    };
    return colors[emotion] || '#6c757d';
  };

  // ==========================================================================
  // RENDER CONTROLS
  // ==========================================================================

  const renderControls = () => {
    if (!showControls) return null;
    
    return (
      <div className="face-tracking-controls">
        <div className="control-group">
          {!hasCameraPermission ? (
            <button 
              onClick={handleRequestPermission}
              disabled={isTracking}
              className="control-button primary"
            >
              Grant Camera Permission
            </button>
          ) : (
            <button 
              onClick={isTracking ? handleStopTracking : handleStartTracking}
              className={`control-button ${isTracking ? 'danger' : 'primary'}`}
            >
              {isTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
          )}
        </div>
        
        <div className="control-group">
          <select
            value={selectedCamera}
            onChange={(e) => handleCameraSelect(e.target.value)}
            disabled={isTracking || cameras.length === 0}
            className="camera-select"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.label} ({camera.facing})
              </option>
            ))}
          </select>
          <button 
            onClick={handleRefreshCameras}
            className="control-button secondary"
            title="Refresh cameras"
          >
            🔄
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  };

  // ==========================================================================
  // RENDER VIDEO FEED (OPTIONAL)
  // ==========================================================================

  const renderVideoFeed = () => {
    if (!showCamera || !isTracking) return null;
    
    return (
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)', // Mirror
          }}
        />
      </div>
    );
  };

  // ==========================================================================
  // RENDER AVATAR
  // ==========================================================================

  const renderAvatar = () => {
    return (
      <div 
        ref={containerRef}
        className="avatar-container"
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      />
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="face-tracking-demo">
      <div className="demo-header">
        <h2>🎥 Face Tracking Demo</h2>
        <p>Real-time facial expression and pose tracking for AI Virtual Assistant</p>
      </div>
      
      <div className="demo-content">
        {/* Left Panel - Avatar */}
        <div className="demo-panel avatar-panel">
          <div className="panel-header">
            <h3>3D Avatar</h3>
            {isDetected && (
              <span className="detection-badge">
                ✓ Face Detected
              </span>
            )}
          </div>
          <div className="panel-body">
            {renderAvatar()}
          </div>
          <div className="panel-footer">
            <span className="avatar-emotion" style={{
              background: getEmotionColor(currentEmotion)
            }}>
              {currentEmotion}
            </span>
          </div>
        </div>
        
        {/* Right Panel - Stats & Controls */}
        <div className="demo-panel info-panel">
          <div className="panel-header">
            <h3>Tracking Info</h3>
          </div>
          <div className="panel-body">
            {renderStats()}
            {renderControls()}
          </div>
        </div>
      </div>
      
      {/* Optional: Show camera feed */}
      {showCamera && (
        <div className="camera-panel" style={{ display: isTracking ? 'block' : 'none' }}>
          <div className="panel-header">
            <h3>Camera Feed</h3>
          </div>
          {renderVideoFeed()}
        </div>
      )}
      
      {/* Loading indicator */}
      {!isInitialized && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Initializing face tracking...</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// STYLES (CSS-in-JS)
// ============================================================================

const addStyles = () => {
  const styleId = 'face-tracking-demo-styles';
  if (document.getElementById(styleId)) return;
  
  const styles = `
    .face-tracking-demo {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    
    .demo-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .demo-header h2 {
      margin: 0 0 10px 0;
      color: #2c3e50;
    }
    
    .demo-header p {
      margin: 0;
      color: #6c757d;
      font-size: 14px;
    }
    
    .demo-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
    }
    
    .demo-panel {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .panel-header {
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .panel-header h3 {
      margin: 0;
      font-size: 16px;
      color: #495057;
    }
    
    .detection-badge {
      background: #28a745;
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
    }
    
    .panel-body {
      padding: 20px;
      min-height: 300px;
    }
    
    .panel-footer {
      padding: 15px 20px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
    }
    
    .avatar-container {
      width: 100%;
      height: 400px;
      background: linear-gradient(135deg, #050b14 0%, #0a1a2e 100%);
    }
    
    .avatar-emotion {
      padding: 6px 16px;
      border-radius: 20px;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    
    .face-tracking-stats {
      font-size: 13px;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    
    .stat-row:last-child {
      border-bottom: none;
    }
    
    .stat-label {
      color: #6c757d;
      font-weight: 500;
    }
    
    .stat-value {
      color: #212529;
    }
    
    .stat-value.active {
      color: #28a745;
    }
    
    .stat-value.inactive {
      color: #dc3545;
    }
    
    .emotion-value {
      padding: 4px 12px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
    }
    
    .face-tracking-controls {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e9ecef;
    }
    
    .control-group {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }
    
    .control-button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    
    .control-button.primary {
      background: #007bff;
      color: white;
    }
    
    .control-button.primary:hover {
      background: #0069d9;
    }
    
    .control-button.danger {
      background: #dc3545;
      color: white;
    }
    
    .control-button.danger:hover {
      background: #c82333;
    }
    
    .control-button.secondary {
      background: #6c757d;
      color: white;
    }
    
    .control-button.secondary:hover {
      background: #5a6268;
    }
    
    .control-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .camera-select {
      flex: 1;
      padding: 10px;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
    }
    
    .camera-select:focus {
      outline: none;
      border-color: #007bff;
    }
    
    .error-message {
      background: #f8d7da;
      color: #721c24;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      margin-top: 10px;
    }
    
    .camera-panel {
      margin-top: 20px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .camera-panel .panel-header {
      background: #343a40;
      color: white;
    }
    
    .camera-panel .panel-header h3 {
      color: white;
    }
    
    .video-container {
      width: 100%;
      height: 200px;
      background: #000;
    }
    
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @media (max-width: 768px) {
      .demo-content {
        grid-template-columns: 1fr;
      }
      
      .demo-panel {
        margin-bottom: 20px;
      }
    }
  `;
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
};

// Add styles when component is first rendered
let stylesAdded = false;

/**
 * Wrapper component that adds styles
 */
export const FaceTrackingDemoWithStyles: React.FC<React.ComponentProps<typeof FaceTrackingDemo>> = (props) => {
  useEffect(() => {
    if (!stylesAdded) {
      addStyles();
      stylesAdded = true;
    }
  }, []);
  
  return <FaceTrackingDemo {...props} />;
};

// Export with styles as default
export default FaceTrackingDemoWithStyles;
