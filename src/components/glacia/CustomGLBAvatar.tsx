/**
 * CustomGLBAvatar.tsx
 * ═══════════════════════════════════════════════════════════════
 * High-Fidelity 3D Custom GLB Avatar & Embodied AI Companion
 * ─────────────────────────────────────────────────────────────
 * Renders user's custom 3D avatar (.glb) using Three.js GLTFLoader:
 * - Full PBR materials + Dynamic Emissive texture glow mapping
 * - 3D Cursor Tracking / LookAt & Head Parallax
 * - Procedural Life-like Levitation & Breathing Physics
 * - Voice & Viseme Audio Pulse Emissive Reaction
 * - Orbiting AI Constellation Satellites
 * - 3D Raycasting Interaction (Click/Pet with audio feedback)
 * - Auto BoundingBox Centering & Responsive Scaling
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGlacia, type GlaciaMood } from './GlaciaContext';
import { glaciaVoice, type VisemeFrame } from './glaciaVoiceEngine';
import { glaciaAudio } from './glaciaAudioSynth';

export type LightingThemeType = 'cyber' | 'studio' | 'aurora' | 'sunset';

export interface CustomGLBAvatarProps {
  interactive?: boolean;
  className?: string;
  scale?: number;
  compactMode?: boolean;
  enableOrbitControls?: boolean;
  lightingTheme?: LightingThemeType;
  showControlsHUD?: boolean;
  modelPath?: string;
  fallbackModelPath?: string;
  emissiveTexturePath?: string;
  onPet?: () => void;
}

const SATELLITE_CONFIGS = [
  { name: 'NeoDev', color: 0x6366f1, emissive: 0x4338ca },
  { name: 'NovaGrowth', color: 0xec4899, emissive: 0xdb2777 },
  { name: 'AeroSales', color: 0xf43f5e, emissive: 0xe11d48 },
  { name: 'VortexFinance', color: 0x10b981, emissive: 0x059669 },
  { name: 'AegisAudit', color: 0xfbbf24, emissive: 0xd97706 },
];

export const LIGHTING_PRESETS: Record<LightingThemeType, {
  name: string;
  keyColor: number;
  fillColor: number;
  rimColor: number;
  floorColor: number;
  ambientIntensity: number;
}> = {
  cyber: {
    name: 'Cyberpunk Neon',
    keyColor: 0x38bdf8,
    fillColor: 0xa855f7,
    rimColor: 0x06b6d4,
    floorColor: 0x38bdf8,
    ambientIntensity: 1.8,
  },
  studio: {
    name: 'Cinema Daylight',
    keyColor: 0xffedd5,
    fillColor: 0x94a3b8,
    rimColor: 0xfffbeb,
    floorColor: 0xfde047,
    ambientIntensity: 2.2,
  },
  aurora: {
    name: 'Emerald Aurora',
    keyColor: 0x34d399,
    fillColor: 0x047857,
    rimColor: 0x6ee7b7,
    floorColor: 0x10b981,
    ambientIntensity: 1.9,
  },
  sunset: {
    name: 'Quantum Sunset',
    keyColor: 0xfbbf24,
    fillColor: 0xf43f5e,
    rimColor: 0xc084fc,
    floorColor: 0xf97316,
    ambientIntensity: 1.8,
  },
};

export default function CustomGLBAvatar({
  interactive = true,
  className = '',
  scale = 1,
  compactMode = false,
  enableOrbitControls = false,
  lightingTheme = 'cyber',
  showControlsHUD = false,
  modelPath = '/models/assistant/base_basic_pbr.glb',
  fallbackModelPath = '/models/assistant/base_basic_shaded.glb',
  emissiveTexturePath = '/models/assistant/texture_emissive.png',
  onPet,
}: CustomGLBAvatarProps) {
  const {
    mood,
    isSpeaking,
    isListening,
    addTrustScore,
    setSpeechBubble,
  } = useGlacia();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentLightTheme, setCurrentLightTheme] = useState<LightingThemeType>(lightingTheme);
  const [isAutoSpinning, setIsAutoSpinning] = useState<boolean>(false);

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const characterRootRef = useRef<THREE.Object3D | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const satellitesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.PointLight | null>(null);
  const floorLightRef = useRef<THREE.PointLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number>(0);
  const moodRef = useRef<GlaciaMood>(mood);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const visemeScaleRef = useRef<number>(0);
  const isTabVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    setCurrentLightTheme(lightingTheme);
  }, [lightingTheme]);

  // Update lighting colors dynamically when lightingTheme changes
  useEffect(() => {
    const preset = LIGHTING_PRESETS[currentLightTheme];
    if (preset) {
      if (keyLightRef.current) keyLightRef.current.color.setHex(preset.keyColor);
      if (fillLightRef.current) fillLightRef.current.color.setHex(preset.fillColor);
      if (rimLightRef.current) rimLightRef.current.color.setHex(preset.rimColor);
      if (floorLightRef.current) floorLightRef.current.color.setHex(preset.floorColor);
      if (ambientLightRef.current) ambientLightRef.current.intensity = preset.ambientIntensity;
    }
  }, [currentLightTheme]);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0.1, compactMode ? 4.2 : 3.6);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [compactMode]);

  // Subscribe to real-time viseme lip-sync audio frames
  useEffect(() => {
    const unsub = glaciaVoice.subscribeVisemes((frame: VisemeFrame) => {
      visemeScaleRef.current = frame.intensity || 0;
    });
    return unsub;
  }, []);

  // Track Mouse Pointer for Parallax & LookAt
  useEffect(() => {
    if (!interactive) return;

    let rafScheduled = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafScheduled) return;
      rafScheduled = true;
      requestAnimationFrame(() => {
        rafScheduled = false;
        const normX = (e.clientX / window.innerWidth) * 2 - 1;
        const normY = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseTargetRef.current = {
          x: Math.max(-1, Math.min(1, normX)),
          y: Math.max(-1, Math.min(1, normY)),
        };
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactive]);

  // Raycast Touch / Click Interaction
  const handle3DClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !mountRef.current || !sceneRef.current || !rendererRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    const camera = sceneRef.current.userData.camera as THREE.PerspectiveCamera;
    if (!camera) return;

    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

    if (intersects.length > 0) {
      glaciaAudio.playPettingPurr();
      addTrustScore(5, 'Tương tác & Chạm vào Trợ lý AI 3D');

      if (onPet) {
        onPet();
      } else {
        const replies = [
          '✨ Chào Giám đốc! Trợ lý 3D sẵn sàng phục vụ mọi tác vụ!',
          '⚡ Lõi năng lượng lượng tử đã kích hoạt 100% công suất!',
          '🌟 Tôi đang theo dõi sát sao dữ liệu toàn bộ phân hệ!',
          '💎 Rất vui được đồng hành cùng bạn trên LedgerFlow Studio!',
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        setSpeechBubble(randomReply);
        glaciaVoice.speak(randomReply, 'happy');
      }

      if (modelGroupRef.current) {
        modelGroupRef.current.position.y += 0.08;
        setTimeout(() => {
          if (modelGroupRef.current) modelGroupRef.current.position.y -= 0.08;
        }, 200);
      }
    }
  }, [interactive, onPet, addTrustScore, setSpeechBubble]);

  // Main Three.js Scene Setup & Model Loading Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    setIsLoading(true);
    setHasError(false);
    materialsRef.current = [];

    const width = compactMode ? 180 : container.clientWidth || 380;
    const height = compactMode ? 180 : container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.1, compactMode ? 4.2 : 3.6);
    cameraRef.current = camera;
    scene.userData.camera = camera;

    // 2. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch (err: unknown) {
      setHasError(true);
      setErrorMessage(err instanceof Error ? err.message : 'WebGL Initialization Error');
      setIsLoading(false);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // OrbitControls if enabled
    if (enableOrbitControls) {
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 1.7;
      controls.minDistance = 1.5;
      controls.maxDistance = 8.0;
      controlsRef.current = controls;
    }

    // 3. Cinematic Studio Lighting
    const initialPreset = LIGHTING_PRESETS[currentLightTheme] || LIGHTING_PRESETS.cyber;

    const ambientLight = new THREE.AmbientLight(0xffffff, initialPreset.ambientIntensity);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(initialPreset.keyColor, 3.5);
    keyLight.position.set(4, 5, 5);
    keyLightRef.current = keyLight;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(initialPreset.fillColor, 2.6);
    fillLight.position.set(-4, -2, 3);
    fillLightRef.current = fillLight;
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(initialPreset.rimColor, 4.5, 12);
    rimLight.position.set(0, 3, -3);
    rimLightRef.current = rimLight;
    scene.add(rimLight);

    const floorGlow = new THREE.PointLight(initialPreset.floorColor, 2.0, 6);
    floorGlow.position.set(0, -2, 1);
    floorLightRef.current = floorGlow;
    scene.add(floorGlow);

    // 4. Model Group & Particles
    const modelGroup = new THREE.Group();
    modelGroup.scale.set(scale, scale, scale);
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Particle Swarm
    const particleCount = compactMode ? 35 : 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 3.5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3.5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 3.0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: initialPreset.keyColor,
      size: compactMode ? 0.05 : 0.035,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // Constellation Orbit Satellites
    const satellites: THREE.Mesh[] = [];
    SATELLITE_CONFIGS.forEach((cfg) => {
      const satMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.3,
        transmission: 0.6,
        transparent: true,
        opacity: 0.9,
      });
      const satMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), satMat);
      scene.add(satMesh);
      satellites.push(satMesh);
    });
    satellitesRef.current = satellites;

    // 5. Load GLTF / GLB Model
    const textureLoader = new THREE.TextureLoader();
    let emissiveTexture: THREE.Texture | null = null;
    if (emissiveTexturePath) {
      textureLoader.load(
        emissiveTexturePath,
        (tex) => {
          tex.flipY = false;
          emissiveTexture = tex;
          materialsRef.current.forEach((mat) => {
            mat.emissiveMap = tex;
            mat.needsUpdate = true;
          });
        },
        undefined,
        (err) => console.warn('[CustomGLB] Emissive texture load note:', err)
      );
    }

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    const loadModel = (url: string, isFallback: boolean = false) => {
      gltfLoader.load(
        url,
        (gltf) => {
          const loadedModel = gltf.scene;
          characterRootRef.current = loadedModel;

          // Auto-center & Normalize Scale using BoundingBox
          const box = new THREE.Box3().setFromObject(loadedModel);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = maxDim > 0 ? 2.0 / maxDim : 1;

          loadedModel.scale.set(targetScale, targetScale, targetScale);
          loadedModel.position.set(-center.x * targetScale, -center.y * targetScale, -center.z * targetScale);

          // Traverse and upgrade materials for rich PBR & emissive glow
          loadedModel.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => {
                  if (m instanceof THREE.MeshStandardMaterial) {
                    materialsRef.current.push(m);
                    if (emissiveTexture) m.emissiveMap = emissiveTexture;
                    m.emissiveIntensity = 0.5;
                  }
                });
              } else if (mesh.material instanceof THREE.MeshStandardMaterial) {
                materialsRef.current.push(mesh.material);
                if (emissiveTexture) mesh.material.emissiveMap = emissiveTexture;
                mesh.material.emissiveIntensity = 0.5;
              }
            }
          });

          modelGroup.add(loadedModel);
          setIsLoading(false);
        },
        (progress) => {
          if (progress.total > 0) {
            setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        },
        (err) => {
          console.warn('[CustomGLB] Failed loading from:', url, err);
          if (!isFallback && fallbackModelPath) {
            console.log('[CustomGLB] Attempting fallback model:', fallbackModelPath);
            loadModel(fallbackModelPath, true);
          } else {
            setHasError(true);
            setErrorMessage('Không thể tải mô hình 3D GLB.');
            setIsLoading(false);
          }
        }
      );
    };

    loadModel(modelPath);

    // 6. Animation Render Loop (60 FPS)
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (!isTabVisibleRef.current) return;

      const elapsed = clock.getElapsedTime();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // ── Floating Levitation & Breathing ──
      const breathSpeed = moodRef.current === 'sleeping' ? 0.8 : 2.0;
      const breathAmp = moodRef.current === 'sleeping' ? 0.02 : 0.05;
      modelGroup.position.y = Math.sin(elapsed * breathSpeed) * breathAmp;

      // ── Mouse Cursor LookAt & Rotation Parallax (if Orbit not actively dragged) ──
      if (!enableOrbitControls) {
        const targetRotY = mouseTargetRef.current.x * 0.4;
        const targetRotX = -mouseTargetRef.current.y * 0.25;
        modelGroup.rotation.y = THREE.MathUtils.lerp(modelGroup.rotation.y, targetRotY, 0.08);
        modelGroup.rotation.x = THREE.MathUtils.lerp(modelGroup.rotation.x, targetRotX, 0.08);
      } else if (isAutoSpinning) {
        modelGroup.rotation.y += 0.008;
      }

      // ── Dynamic Emissive Glow Pulsing ──
      if (materialsRef.current.length > 0) {
        const baseIntensity = isSpeakingRef.current
          ? 0.8 + visemeScaleRef.current * 1.5
          : isListening
          ? 0.9 + Math.sin(elapsed * 6) * 0.3
          : 0.5 + Math.sin(elapsed * 2.5) * 0.15;

        materialsRef.current.forEach((mat) => {
          mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, baseIntensity, 0.15);
        });
      }

      // ── Orbiting Satellites ──
      if (satellitesRef.current.length > 0) {
        const orbitRadius = compactMode ? 1.1 : 1.45;
        satellitesRef.current.forEach((sat, i) => {
          const angle = elapsed * 0.5 + (i * Math.PI * 2) / satellitesRef.current.length;
          sat.position.x = Math.cos(angle) * orbitRadius;
          sat.position.z = Math.sin(angle) * orbitRadius;
          sat.position.y = Math.sin(elapsed * 1.5 + i) * 0.3;
          sat.rotation.x = elapsed * 1.2;
          sat.rotation.y = elapsed * 1.4;
        });
      }

      // ── Orbiting Particle Dust ──
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsed * 0.06;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !sceneRef.current) return;
      const newW = compactMode ? 180 : container.clientWidth || 380;
      const newH = compactMode ? 180 : container.clientHeight || 420;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Tab Visibility Handler
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animFrameIdRef.current);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      dracoLoader.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      container.innerHTML = '';
    };
  }, [compactMode, scale, enableOrbitControls, modelPath, fallbackModelPath, emissiveTexturePath, isListening, isAutoSpinning]);

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        width: compactMode ? 180 : '100%',
        height: compactMode ? 180 : '100%',
        minHeight: compactMode ? 180 : 360,
      }}
      onClick={handle3DClick}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center" />

      {/* Interactive Controls Overlay for 3D Stage Mode */}
      {showControlsHUD && !isLoading && !hasError && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-2xl z-20"
        >
          {/* Lighting Presets */}
          <div className="flex items-center gap-1">
            {(['cyber', 'studio', 'aurora', 'sunset'] as LightingThemeType[]).map((theme) => (
              <button
                key={theme}
                onClick={() => setCurrentLightTheme(theme)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  currentLightTheme === theme
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-cyan-300 bg-slate-900/60'
                }`}
                title={`Ánh sáng: ${LIGHTING_PRESETS[theme].name}`}
              >
                {theme === 'cyber' ? '⚡ Cyber' : theme === 'studio' ? '☀️ Studio' : theme === 'aurora' ? '✨ Aurora' : '🌅 Sunset'}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700/60" />

          {/* Auto Spin */}
          <button
            onClick={() => setIsAutoSpinning(!isAutoSpinning)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              isAutoSpinning ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
            title="Tự động xoay 360°"
          >
            🔄 Xoay
          </button>

          {/* Reset Camera */}
          <button
            onClick={handleResetCamera}
            className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white bg-slate-900/60 transition-colors"
            title="Khôi phục góc nhìn camera"
          >
            🎯 Góc gốc
          </button>
        </div>
      )}

      {/* Loading Spinner with Progress */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm rounded-2xl z-10 transition-opacity duration-300">
          <div className="relative w-14 h-14">
            <div className="w-full h-full border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold">
              {loadProgress > 0 ? `${loadProgress}%` : '3D'}
            </div>
          </div>
          <span className="text-xs text-cyan-300 mt-2 font-medium tracking-wide">
            Đang nạp thực thể 3D GLB...
          </span>
        </div>
      )}

      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-2xl text-center z-10">
          <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
            ⚠️
          </div>
          <p className="text-xs text-rose-300 font-medium">{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] text-cyan-300 rounded-lg border border-slate-700"
          >
            Thử lại
          </button>
        </div>
      )}
    </div>
  );
}
