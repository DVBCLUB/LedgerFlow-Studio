/**
 * avatarService.ts
 * ============================================================
 * AI Virtual Assistant Avatar Service
 * 
 * Provides:
 * - Ready Player Me avatar creation and loading
 * - 3D avatar rendering with Three.js
 * - Gesture system for avatar animation
 * - Face tracking integration
 * - Avatar customization
 * 
 * ============================================================
 */

import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { AvatarEmotion, EMOTION_TO_GESTURE, MOOD_TO_EMOTION } from '../../../../core/types/glaciaAvatar';

export interface AvatarConfig {
  id?: string;
  name?: string;
  modelUrl?: string;
  textureUrl?: string;
  scale?: number;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  animations?: string[];
  emotion?: AvatarEmotion;
  gesture?: string;
  eyeColor?: string;
  hairColor?: string;
  skinColor?: string;
  clothingColor?: string;
}

export interface Gesture {
  name: string;
  type: 'head' | 'hand' | 'body' | 'facial';
  animation: string;
  duration: number;
  intensity: number;
  blendMode?: 'override' | 'additive';
}

export interface AvatarState {
  emotion: AvatarEmotion;
  gesture: string;
  isSpeaking: boolean;
  isListening: boolean;
  lookAtTarget?: { x: number; y: number; z: number };
  mouthOpenness: number;
  eyeBlink: number;
  browRaise: number;
}

// Avatar pose presets
export const AVATAR_POSES: Record<string, { position: THREE.Vector3; rotation: THREE.Euler }> = {
  default: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  standing: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  listening: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, Math.PI / 6, 0),
  },
  thinking: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(-Math.PI / 8, 0, 0),
  },
  happy: {
    position: new THREE.Vector3(0, 0.1, 0),
    rotation: new THREE.Euler(0, 0, 0),
  },
  wave: {
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, Math.PI / 4, 0),
  },
};

// Gesture animations
export const GESTURES: Record<string, Gesture> = {
  nod: {
    name: 'Gật đầu',
    type: 'head',
    animation: 'nod',
    duration: 0.3,
    intensity: 1,
  },
  shake: {
    name: 'Lắc đầu',
    type: 'head',
    animation: 'shake',
    duration: 0.3,
    intensity: 1,
  },
  wave: {
    name: 'Vẫy tay',
    type: 'hand',
    animation: 'wave',
    duration: 0.8,
    intensity: 1,
  },
  point: {
    name: 'Chỉ tay',
    type: 'hand',
    animation: 'point',
    duration: 0.5,
    intensity: 1,
  },
  thumbsUp: {
    name: 'Ngón cái lên',
    type: 'hand',
    animation: 'thumbs_up',
    duration: 0.5,
    intensity: 1,
  },
  clap: {
    name: 'Vỗ tay',
    type: 'hand',
    animation: 'clap',
    duration: 0.3,
    intensity: 1,
  },
  smile: {
    name: 'Mỉm cười',
    type: 'facial',
    animation: 'smile',
    duration: 0.3,
    intensity: 0.8,
  },
  blink: {
    name: 'Chớp mắt',
    type: 'facial',
    animation: 'blink',
    duration: 0.1,
    intensity: 1,
  },
  raiseEyebrows: {
    name: 'Nhướn mày',
    type: 'facial',
    animation: 'raise_eyebrows',
    duration: 0.2,
    intensity: 0.7,
  },
};

// Avatar model loader
class AvatarLoader {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private cache: Map<string, Promise<GLTF>> = new Map();

  constructor() {
    this.loader = new GLTFLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/node_modules/three/examples/js/libs/draco/');
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  async load(modelUrl: string): Promise<GLTF> {
    if (!this.cache.has(modelUrl)) {
      this.cache.set(modelUrl, this.loader.loadAsync(modelUrl));
    }
    return this.cache.get(modelUrl)!;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Avatar Manager
export class AvatarManager {
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private avatar: THREE.Group | null = null;
  private controls: OrbitControls | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private mixer: THREE.AnimationMixer | null = null;
  private loader: AvatarLoader;
  private state: AvatarState;

  private headBone: THREE.Bone | null = null;
  private leftHandBone: THREE.Bone | null = null;
  private rightHandBone: THREE.Bone | null = null;
  private faceBones: Map<string, THREE.Bone> = new Map();

  constructor() {
    this.loader = new AvatarLoader();
    this.state = {
      emotion: 'NEUTRAL',
      gesture: '',
      isSpeaking: false,
      isListening: false,
      mouthOpenness: 0,
      eyeBlink: 0,
      browRaise: 0,
    };
  }

  async initialize(
    container: HTMLElement,
    options: {
      width?: number;
      height?: number;
      backgroundColor?: number;
      cameraPosition?: { x: number; y: number; z: number };
    } = {}
  ): Promise<void> {
    const { width = 800, height = 600, backgroundColor = 0x050b14, cameraPosition = { x: 0, y: 1.6, z: 2 } } = options;

    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(backgroundColor);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;

    // Add renderer to container
    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 5;

    // Add lighting
    this.setupLighting();

    // Start animation loop
    this.startAnimationLoop();
  }

  private setupLighting(): void {
    if (!this.scene) return;

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 5, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0x89cff0, 0.4);
    fillLight.position.set(-2, 3, -1);
    this.scene.add(fillLight);

    // Rim light
    const rimLight = new THREE.PointLight(0x40e0d0, 0.5);
    rimLight.position.set(0, 2, -2);
    this.scene.add(rimLight);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xfff5eb, 0x080820, 0.3);
    this.scene.add(hemiLight);
  }

  async loadAvatar(modelUrl: string, config: AvatarConfig = {}): Promise<void> {
    if (!this.scene) return;

    // Unload previous avatar
    this.unloadAvatar();

    try {
      // Load avatar model
      const gltf = await this.loader.load(modelUrl);

      // Create avatar group
      this.avatar = new THREE.Group();
      this.avatar.scale.set(config.scale || 1, config.scale || 1, config.scale || 1);
      this.avatar.position.set(
        config.position?.x || 0,
        config.position?.y || 0,
        config.position?.z || 0
      );
      if (config.rotation) {
        this.avatar.rotation.set(
          config.rotation.x || 0,
          config.rotation.y || 0,
          config.rotation.z || 0
        );
      }

      // Add model to avatar group
      this.avatar.add(gltf.scene);
      this.scene.add(this.avatar);

      // Set up animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(this.avatar);
        gltf.animations.forEach((clip) => {
          const action = this.mixer!.clipAction(clip);
          this.animations.set(clip.name, action);
        });
      }

      // Find bones for facial and body control
      this.findBones(gltf.scene);

      // Set initial pose
      this.applyPose('default');
      this.applyEmotion(config.emotion || 'NEUTRAL');

    } catch (error) {
      console.error('Failed to load avatar:', error);
      throw error;
    }
  }

  private findBones(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Bone) {
        const boneName = child.name.toLowerCase();
        
        if (boneName.includes('head')) {
          this.headBone = child;
        } else if (boneName.includes('hand') && boneName.includes('left')) {
          this.leftHandBone = child;
        } else if (boneName.includes('hand') && boneName.includes('right')) {
          this.rightHandBone = child;
        } else if (boneName.includes('eye') || boneName.includes('eyelid')) {
          this.faceBones.set(`eye_${this.faceBones.size}`, child);
        } else if (boneName.includes('mouth') || boneName.includes('jaw') || boneName.includes('lip')) {
          this.faceBones.set(`mouth_${this.faceBones.size}`, child);
        } else if (boneName.includes('brow') || boneName.includes('eyebrow')) {
          this.faceBones.set(`brow_${this.faceBones.size}`, child);
        }
      }
    });
  }

  updateState(newState: Partial<AvatarState>): void {
    this.state = { ...this.state, ...newState };

    // Apply emotion changes
    if (newState.emotion) {
      this.applyEmotion(newState.emotion);
    }

    // Apply gesture changes
    if (newState.gesture) {
      this.applyGesture(newState.gesture);
    }

    // Update facial expressions
    this.updateFacialExpressions();
  }

  private applyEmotion(emotion: AvatarEmotion): void {
    // Map emotion to gesture
    const gestureMapping = EMOTION_TO_GESTURE[emotion];
    if (gestureMapping) {
      this.state.gesture = `${gestureMapping.head}_${gestureMapping.hand}`;
    }

    // Play emotion-specific animation if available
    const emotionAnim = this.animations.get(emotion.toLowerCase());
    if (emotionAnim) {
      this.playAnimation(emotionAnim, 0.2);
    }

    // Update facial expressions based on emotion
    switch (emotion) {
      case 'HAPPY':
      case 'CELEBRATING':
        this.state.mouthOpenness = 0.3;
        this.state.eyeBlink = 0.1;
        this.state.browRaise = -0.1;
        break;
      case 'SURPRISED':
        this.state.mouthOpenness = 0.5;
        this.state.eyeBlink = 0.2;
        this.state.browRaise = 0.3;
        break;
      case 'ANGRY':
        this.state.mouthOpenness = 0.1;
        this.state.eyeBlink = 0.05;
        this.state.browRaise = -0.3;
        break;
      case 'SAD':
        this.state.mouthOpenness = 0.1;
        this.state.eyeBlink = 0.05;
        this.state.browRaise = -0.2;
        break;
      case 'THINKING':
      case 'CURIOUS':
        this.state.mouthOpenness = 0.1;
        this.state.eyeBlink = 0.1;
        this.state.browRaise = 0.1;
        break;
      case 'LISTENING':
        this.state.mouthOpenness = 0.05;
        this.state.eyeBlink = 0.1;
        this.state.browRaise = 0;
        break;
      default:
        this.state.mouthOpenness = 0;
        this.state.eyeBlink = 0.05;
        this.state.browRaise = 0;
        break;
    }
  }

  private applyGesture(gesture: string): void {
    // Handle compound gestures (e.g., "TILT_RIGHT_IDLE")
    const parts = gesture.split('_');
    
    for (const part of parts) {
      const gesture = GESTURES[part.toLowerCase()];
      if (gesture) {
        this.playGesture(gesture);
      }
    }
  }

  private playGesture(gesture: Gesture): void {
    const anim = this.animations.get(gesture.animation);
    if (anim) {
      this.playAnimation(anim, gesture.duration);
    } else {
      // Manual gesture animation
      this.animateGesture(gesture);
    }
  }

  private playAnimation(action: THREE.AnimationAction, fadeInDuration: number = 0.2): void {
    if (!this.mixer) return;

    // Stop all animations
    this.animations.forEach((anim) => {
      anim.stop();
      anim.reset();
    });

    // Play the requested animation
    action.reset();
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.fadeIn(fadeInDuration);
    action.play();
  }

  private animateGesture(gesture: Gesture): void {
    // Manual gesture animation
    switch (gesture.animation) {
      case 'nod':
        if (this.headBone) {
          const startRotation = this.headBone.rotation.x;
          const targetRotation = startRotation - Math.PI / 8;
          this.headBone.rotation.x = targetRotation;
          
          // Return to original after delay
          setTimeout(() => {
            if (this.headBone) {
              this.headBone.rotation.x = startRotation;
            }
          }, 300);
        }
        break;

      case 'shake':
        if (this.headBone) {
          const startRotation = this.headBone.rotation.y;
          const targetRotation = startRotation - Math.PI / 6;
          this.headBone.rotation.y = targetRotation;
          
          setTimeout(() => {
            if (this.headBone) {
              this.headBone.rotation.y = startRotation + Math.PI / 6;
            }
          }, 150);
          
          setTimeout(() => {
            if (this.headBone) {
              this.headBone.rotation.y = startRotation;
            }
          }, 300);
        }
        break;

      case 'wave':
        if (this.rightHandBone) {
          const startRotation = this.rightHandBone.rotation.x;
          const targetRotation = startRotation - Math.PI / 2;
          this.rightHandBone.rotation.x = targetRotation;
          
          setTimeout(() => {
            if (this.rightHandBone) {
              this.rightHandBone.rotation.x = startRotation;
            }
          }, 400);
        }
        break;

      case 'point':
        if (this.rightHandBone) {
          this.rightHandBone.rotation.set(0, 0, -Math.PI / 4);
          
          setTimeout(() => {
            if (this.rightHandBone) {
              this.rightHandBone.rotation.set(0, 0, 0);
            }
          }, 500);
        }
        break;

      case 'blink':
        this.state.eyeBlink = 1;
        setTimeout(() => {
          this.state.eyeBlink = 0.05;
        }, 100);
        break;

      case 'smile':
        this.state.mouthOpenness = 0.5;
        break;

      case 'raise_eyebrows':
        this.state.browRaise = 0.3;
        setTimeout(() => {
          this.state.browRaise = 0;
        }, 500);
        break;
    }
  }

  private updateFacialExpressions(): void {
    // Update eye blink (autonomous blinking)
    if (this.faceBones.size > 0 && Math.random() < 0.005) {
      this.state.eyeBlink = 1;
      setTimeout(() => {
        this.state.eyeBlink = 0.05 + Math.random() * 0.05;
      }, 150);
    }

    // Apply facial expressions based on state
    let eyeScale = 1 - this.state.eyeBlink;
    let mouthScaleY = 1 + this.state.mouthOpenness * 2;
    let browOffset = this.state.browRaise;

    // Update eye bones
    this.faceBones.forEach((bone, key) => {
      if (key.startsWith('eye') || key.startsWith('eyelid')) {
        bone.scale.set(1, eyeScale, 1);
      } else if (key.startsWith('mouth') || key.startsWith('jaw')) {
        bone.scale.set(1, mouthScaleY, 1);
      } else if (key.startsWith('brow')) {
        bone.position.y = browOffset * 0.1;
      }
    });

    // Update lip-sync
    if (this.state.isSpeaking) {
      // Simulate mouth movement for speech
      const wave = Math.sin(Date.now() / 100) * 0.2 + 0.1;
      mouthScaleY = 1 + wave * 2;
      
      this.faceBones.forEach((bone, key) => {
        if (key.startsWith('mouth') || key.startsWith('jaw') || key.startsWith('lip')) {
          bone.scale.set(1, mouthScaleY, 1);
        }
      });
    }
  }

  private applyPose(poseName: string): void {
    const pose = AVATAR_POSES[poseName];
    if (!pose || !this.avatar) return;

    this.avatar.position.copy(pose.position);
    this.avatar.rotation.copy(pose.rotation);
  }

  lookAt(target: { x: number; y: number; z: number }): void {
    if (!this.avatar || !this.headBone) return;

    this.state.lookAtTarget = target;
    
    // Calculate direction from head to target
    const headPosition = this.headBone.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(
      target.x - headPosition.x,
      target.y - headPosition.y,
      target.z - headPosition.z
    ).normalize();

    // Look at direction (simplified)
    this.headBone.lookAt(direction);
  }

  speak(text: string, duration: number = 1000): void {
    this.state.isSpeaking = true;
    
    // Start speaking animation
    this.speakingInterval = window.setInterval(() => {
      this.updateFacialExpressions();
    }, 50);

    // Stop speaking after duration
    setTimeout(() => {
      this.state.isSpeaking = false;
      if (this.speakingInterval) {
        clearInterval(this.speakingInterval);
        this.speakingInterval = null;
      }
    }, duration);
  }

  listen(): void {
    this.state.isListening = true;
    this.state.isSpeaking = false;
    this.applyEmotion('LISTENING');
  }

  stopListening(): void {
    this.state.isListening = false;
    this.applyEmotion('NEUTRAL');
  }

  private speakingInterval: number | null = null;

  startAnimationLoop(): void {
    if (!this.renderer || !this.scene || !this.camera) return;

    const animate = () => {
      requestAnimationFrame(animate);

      // Update mixer (animations)
      if (this.mixer) {
        const delta = 0.016; // ~60fps
        this.mixer.update(delta);
      }

      // Update controls
      if (this.controls) {
        this.controls.update();
      }

      // Update facial expressions
      this.updateFacialExpressions();

      // Render scene
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate();
  }

  resize(width: number, height: number): void {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  unloadAvatar(): void {
    // Stop all animations
    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    // Remove avatar from scene
    if (this.avatar && this.scene) {
      this.scene.remove(this.avatar);
    }

    // Clear bones
    this.headBone = null;
    this.leftHandBone = null;
    this.rightHandBone = null;
    this.faceBones.clear();

    this.avatar = null;
    this.mixer = null;
    this.animations.clear();

    // Clear speaking interval
    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }
  }

  cleanup(): void {
    this.unloadAvatar();

    if (this.renderer && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.loader.clearCache();

    this.state = {
      emotion: 'NEUTRAL',
      gesture: '',
      isSpeaking: false,
      isListening: false,
      mouthOpenness: 0,
      eyeBlink: 0,
      browRaise: 0,
    };
  }

  getAvatar(): THREE.Group | null {
    return this.avatar;
  }

  getState(): AvatarState {
    return this.state;
  }
}

// Singleton instance
export const avatarManager = new AvatarManager();

// Ready Player Me Service
class ReadyPlayerMeService {
  private apiBase = 'https://api.readyplayer.me/v1';
  private avatarCache: Map<string, string> = new Map();

  /**
   * Create a new avatar from a selfie photo
   * @param photoUrl - URL of the selfie photo
   * @param options - Avatar customization options
   * @returns Promise<avatarUrl> - URL of the generated 3D avatar
   */
  async createAvatarFromPhoto(
    photoUrl: string,
    options: {
      gender?: 'male' | 'female' | 'neutral';
      bodyType?: 'slim' | 'average' | 'muscular' | 'curvy';
      skinColor?: string;
      hairColor?: string;
      hairStyle?: string;
      eyeColor?: string;
      clothingStyle?: string;
      quality?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<string> {
    // This is a placeholder implementation
    // In production, you would call the Ready Player Me API
    console.log('Creating Ready Player Me avatar from photo:', photoUrl, options);

    // For demo purposes, return a placeholder URL
    // In reality, you would:
    // 1. Upload the photo to Ready Player Me
    // 2. Receive the avatar URL
    // 3. Cache it for future use

    const demoAvatarUrl = `https://models.readyplayer.me/${Math.random().toString(36).substring(2, 8)}.glb`;
    this.avatarCache.set(photoUrl, demoAvatarUrl);
    
    return demoAvatarUrl;
  }

  /**
   * Get existing avatar by photo URL (from cache)
   */
  getAvatarByPhoto(photoUrl: string): string | undefined {
    return this.avatarCache.get(photoUrl);
  }

  /**
   * Get default avatar URLs
   */
  getDefaultAvatars(): Array<{ id: string; name: string; url: string; gender: string }> {
    return [
      {
        id: 'male_professional',
        name: 'Nam Chuyên Nghiệp',
        url: 'https://models.readyplayer.me/avatar-male-professional.glb',
        gender: 'male',
      },
      {
        id: 'female_professional',
        name: 'Nữ Chuyên Nghiệp',
        url: 'https://models.readyplayer.me/avatar-female-professional.glb',
        gender: 'female',
      },
      {
        id: 'male_casual',
        name: 'Nam Thường Ngày',
        url: 'https://models.readyplayer.me/avatar-male-casual.glb',
        gender: 'male',
      },
      {
        id: 'female_casual',
        name: 'Nữ Thường Ngày',
        url: 'https://models.readyplayer.me/avatar-female-casual.glb',
        gender: 'female',
      },
      {
        id: 'robot_assistant',
        name: 'Trợ Lý Robot',
        url: '/models/glacia-avatar.glb',
        gender: 'neutral',
      },
    ];
  }

  /**
   * Delete an avatar
   */
  async deleteAvatar(avatarId: string): Promise<void> {
    console.log('Deleting avatar:', avatarId);
    // In production, call Ready Player Me API to delete
  }

  /**
   * Update avatar appearance
   */
  async updateAvatar(
    avatarId: string,
    updates: {
      clothing?: string;
      hair?: string;
      accessories?: string[];
    }
  ): Promise<string> {
    console.log('Updating avatar:', avatarId, updates);
    // In production, call Ready Player Me API to update
    return this.getDefaultAvatars()[0].url; // Return placeholder
  }
}

export const readyPlayerMeService = new ReadyPlayerMeService();

// Utility function to create a placeholder avatar
function createPlaceholderAvatar(scene: THREE.Scene): THREE.Group {
  const group = new THREE.Group();

  // Create a simple humanoid figure as placeholder
  // Head
  const headGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 0.25, 0);
  group.add(head);

  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.4, 16);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.7 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0, 0);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  // Arms
  const armGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.3, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7 });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.18, 0.1, 0);
  leftArm.rotation.z = Math.PI / 4;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.18, 0.1, 0);
  rightArm.rotation.z = -Math.PI / 4;
  group.add(rightArm);

  // Legs
  const legGeometry = new THREE.CylinderGeometry(0.05, 0.04, 0.4, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.7 });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.07, -0.2, 0);
  group.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.07, -0.2, 0);
  group.add(rightLeg);

  return group;
}

// Create a simple humanoid avatar for immediate use
export function createSimpleHumanoidAvatar(scene: THREE.Scene): THREE.Group {
  return createPlaceholderAvatar(scene);
}
