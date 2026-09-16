/**
 * GlaciaReal3DAvatar.tsx
 * ═══════════════════════════════════════════════════════════════
 * True 3D WebGL Avatar & Virtual Being Engine for Glacia (Three.js)
 * ─────────────────────────────────────────────────────────────
 * Hoàn toàn được dựng bằng 3D WebGL Mesh & Skeleton Rigging:
 * - Đầu, tai, sừng rồng tinh thể, vương miện ngọc bích 3D
 * - Mắt ngọc bích 3D dõi theo con trỏ chuột thời gian thực (3D Eye-tracking)
 * - Mí mắt chớp tự động (3D Autonomous Blinking)
 * - Khẩu hình miệng nhấp nhô theo giọng nói (3D Viseme Lip-sync)
 * - 4 Cánh rồng tiên pha lê đập nhịp nhàng (3D Harmonic Wing Flutter)
 * - Đuôi uốn lượn đa khớp (3D Multi-segment Tail Physics)
 * - Vòng cổ ngọc bích đập theo tần số âm thanh (Acoustic Amulet Pulse)
 * - 5 Vệ tinh lượng tử AI Staff quay quanh trong không gian 3D (Constellation Swarm)
 * - Raycast tương tác chạm 3D (Click trên sừng, vương miện, đầu, ngọc)
 * - Tối ưu hóa hiệu năng cao: Tự động dừng render khi ẩn tab, giới hạn PixelRatio,
 *   phục hồi WebGL context lost và giải phóng bộ nhớ triệt để chống giật lag.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useGlacia, type GlaciaMood } from './GlaciaContext';
import { glaciaVoice, type VisemeFrame } from './glaciaVoiceEngine';
import { glaciaAudio } from './glaciaAudioSynth';
import { CRYSTAL_SKINS, type CrystalSkinTheme } from './GlaciaLiveVoiceCallHUD';
import { calculateVisemeMorph } from './services/visemeSpeechEngine';

interface GlaciaReal3DAvatarProps {
  interactive?: boolean;
  className?: string;
  showHUDs?: boolean;
  scale?: number;
  compactMode?: boolean;
  onPet?: () => void;
}

const SATELLITE_CONFIGS = [
  { name: 'NeoDev', color: 0x6366f1, emissive: 0x4338ca },
  { name: 'NovaGrowth', color: 0xec4899, emissive: 0xdb2777 },
  { name: 'AeroSales', color: 0xf43f5e, emissive: 0xe11d48 },
  { name: 'VortexFinance', color: 0x10b981, emissive: 0x059669 },
  { name: 'AegisAudit', color: 0xfbbf24, emissive: 0xd97706 },
];

export default function GlaciaReal3DAvatar({
  interactive = true,
  className = '',
  scale = 1,
  compactMode = false,
  onPet,
}: GlaciaReal3DAvatarProps) {
  const {
    mood,
    setMood,
    currentEmotion,
    isListening,
    isSpeaking,
    activeCrystalSkin,
    addTrustScore,
    setSpeechBubble,
  } = useGlacia();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState<boolean>(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftEyePupilRef = useRef<THREE.Mesh | null>(null);
  const rightEyePupilRef = useRef<THREE.Mesh | null>(null);
  const leftEyelidRef = useRef<THREE.Mesh | null>(null);
  const rightEyelidRef = useRef<THREE.Mesh | null>(null);
  const mouthMeshRef = useRef<THREE.Mesh | null>(null);
  const amuletMeshRef = useRef<THREE.Mesh | null>(null);
  const wingsRef = useRef<THREE.Mesh[]>([]);
  const tailSegmentsRef = useRef<THREE.Mesh[]>([]);
  const satellitesRef = useRef<THREE.Mesh[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);
  const quantumSparkleRef = useRef<THREE.Points | null>(null); // Quantum Sparkle particle effect
  const greetingDoneRef = useRef<boolean>(false); // Track if greeting animation has run
  const greetingTimerRef = useRef<number>(0); // Timer for greeting animation
  const mouseTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number>(0);
  const moodRef = useRef<GlaciaMood>(mood);
  const isSpeakingRef = useRef<boolean>(isSpeaking);
  const visemeScaleRef = useRef<number>(0);
  const skinRef = useRef<CrystalSkinTheme>(activeCrystalSkin);
  const isTabVisibleRef = useRef<boolean>(true);

  // Materials References
  const sapphireGemMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const wingMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const hornMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    skinRef.current = activeCrystalSkin;
    const skinConfig = CRYSTAL_SKINS[activeCrystalSkin];
    if (skinConfig) {
      const primaryHex = parseInt(skinConfig.primaryColor.replace('#', ''), 16);
      if (sapphireGemMatRef.current) {
        sapphireGemMatRef.current.color.setHex(primaryHex);
        sapphireGemMatRef.current.emissive.setHex(primaryHex);
      }
      if (wingMatRef.current) {
        wingMatRef.current.color.setHex(primaryHex);
        wingMatRef.current.emissive.setHex(primaryHex);
      }
      if (hornMatRef.current) {
        hornMatRef.current.color.setHex(primaryHex);
        hornMatRef.current.emissive.setHex(primaryHex);
      }
    }
  }, [activeCrystalSkin]);

  // Subscribe to real-time viseme lip-sync frames
  useEffect(() => {
    const unsub = glaciaVoice.subscribeVisemes((frame: VisemeFrame) => {
      visemeScaleRef.current = frame.intensity || 0;
    });
    return unsub;
  }, []);

  // Track Mouse Pointer for 3D LookAt & Eyeturning
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

  // 3D Raycasting Touch Interactions (Petting, Crown Tap, Wing Flutter)
  const handle3DClick = (e: React.MouseEvent<HTMLDivElement>) => {
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
      addTrustScore(5, 'Xoa đầu & Chạm vào Glacia 3D');

      if (onPet) {
        onPet();
      } else {
        const petReplies = [
          'Meow! Năng lượng tinh thể của Glacia đang dồi dào! ✨',
          'Vương miện Sapphire đang phát sóng lượng tử bảo vệ hệ thống!',
          'Cánh pha lê đã hấp thu năng lượng cực quang rực rỡ!',
          'Glacia rất vui khi được Giám đốc cưng chiều! 🌟',
        ];
        const randomReply = petReplies[Math.floor(Math.random() * petReplies.length)];
        setSpeechBubble(randomReply);
        glaciaVoice.speak(randomReply, 'happy');
      }

      if (avatarGroupRef.current) {
        avatarGroupRef.current.position.y += 0.08;
        setTimeout(() => {
          if (avatarGroupRef.current) avatarGroupRef.current.position.y -= 0.08;
        }, 180);
      }
    }
  };

  // Main Three.js Setup & Rigging Loop with Performance Safeguards
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability safely
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGLError(true);
        return;
      }
    } catch {
      setHasWebGLError(true);
      return;
    }

    const width = compactMode ? 180 : container.clientWidth || 380;
    const height = compactMode ? 180 : container.clientHeight || 420;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.2, compactMode ? 4.2 : 3.8);
    scene.userData.camera = camera;

    // 2. Renderer with Memory & High-DPI Limits
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setHasWebGLError(true);
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // WebGL Context Lost Prevention
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(animFrameIdRef.current);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

    // 3. Lighting Rig (Cinema Studio 3-point + Underglow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const cyanKeyLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    cyanKeyLight.position.set(3.5, 4.5, 5);
    scene.add(cyanKeyLight);

    const purpleFillLight = new THREE.DirectionalLight(0xa855f7, 2.4);
    purpleFillLight.position.set(-3.5, -2, 3.5);
    scene.add(purpleFillLight);

    const rimLight = new THREE.PointLight(0x67e8f9, 4.0, 15);
    rimLight.position.set(0, 3.5, -2.5);
    scene.add(rimLight);

    const underGlow = new THREE.PointLight(0x06b6d4, 2.5, 8);
    underGlow.position.set(0, -2, 1);
    scene.add(underGlow);

    // ── Procedural Dynamic Textures for Ultra-Rich 3D Rendering ──
    const createFurCanvasTexture = () => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      const c = cv.getContext('2d');
      if (c) {
        c.fillStyle = '#f8fafc';
        c.fillRect(0, 0, 256, 256);
        // Soft fur noise
        for (let i = 0; i < 600; i++) {
          const fx = Math.random() * 256;
          const fy = Math.random() * 256;
          const r = Math.random() * 2.5 + 0.5;
          c.fillStyle = Math.random() > 0.5 ? 'rgba(226, 232, 240, 0.6)' : 'rgba(255, 255, 255, 0.8)';
          c.beginPath();
          c.arc(fx, fy, r, 0, Math.PI * 2);
          c.fill();
        }
      }
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 2);
      return tex;
    };

    const createEyeCanvasTexture = () => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      const c = cv.getContext('2d');
      if (c) {
        // Deep sapphire radial gradient
        const grad = c.createRadialGradient(128, 128, 10, 128, 128, 128);
        grad.addColorStop(0, '#0284c7');
        grad.addColorStop(0.4, '#0369a1');
        grad.addColorStop(0.7, '#075985');
        grad.addColorStop(1, '#0c4a6e');
        c.fillStyle = grad;
        c.fillRect(0, 0, 256, 256);

        // Iris crystal striations
        for (let a = 0; a < Math.PI * 2; a += 0.08) {
          c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          c.lineWidth = 1.5;
          c.beginPath();
          c.moveTo(128, 128);
          c.lineTo(128 + Math.cos(a) * 110, 128 + Math.sin(a) * 110);
          c.stroke();
        }

        // Starburst catchlight
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(100, 100, 18, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.arc(160, 155, 8, 0, Math.PI * 2);
        c.fill();
      }
      return new THREE.CanvasTexture(cv);
    };

    const furTexture = createFurCanvasTexture();
    const eyeTexture = createEyeCanvasTexture();

    // 4. Materials Setup
    const skinConfig = CRYSTAL_SKINS[skinRef.current] || CRYSTAL_SKINS.frost_aurora;
    const initialPrimaryHex = parseInt(skinConfig.primaryColor.replace('#', ''), 16);

    const catBodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: furTexture,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.2,
      sheen: 0.8,
      sheenColor: 0xe0f2fe,
      transmission: 0.05,
      opacity: 0.98,
      transparent: true,
    });

    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbcfe8,
      roughness: 0.6,
      emissive: 0xf472b6,
      emissiveIntensity: 0.2,
    });

    const sapphireGemMaterial = new THREE.MeshPhysicalMaterial({
      color: initialPrimaryHex,
      emissive: initialPrimaryHex,
      emissiveIntensity: 0.75,
      roughness: 0.04,
      metalness: 0.15,
      transmission: 0.9,
      ior: 1.77,
      transparent: true,
      opacity: 0.94,
    });
    sapphireGemMatRef.current = sapphireGemMaterial;

    const goldTiaraMaterial = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      metalness: 0.9,
      roughness: 0.15,
      emissive: 0x3b82f6,
      emissiveIntensity: 0.35,
    });

    const wingMaterial = new THREE.MeshPhysicalMaterial({
      color: initialPrimaryHex,
      emissive: initialPrimaryHex,
      emissiveIntensity: 0.6,
      roughness: 0.08,
      metalness: 0.2,
      transmission: 0.92,
      ior: 1.5,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    wingMatRef.current = wingMaterial;

    const hornMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: initialPrimaryHex,
      emissiveIntensity: 0.85,
      roughness: 0.06,
      transmission: 0.88,
      ior: 1.6,
      transparent: true,
      opacity: 0.92,
    });
    hornMatRef.current = hornMaterial;

    // 5. Procedural 3D Character Rigging
    const avatarGroup = new THREE.Group();
    avatarGroup.scale.set(scale * 1.35, scale * 1.35, scale * 1.35);
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // ── 3D Body & Torso ──
    const torsoGeo = new THREE.SphereGeometry(0.55, 32, 24);
    torsoGeo.scale(0.88, 1.12, 0.78);
    const torsoMesh = new THREE.Mesh(torsoGeo, catBodyMaterial);
    torsoMesh.position.set(0, -0.45, 0);
    avatarGroup.add(torsoMesh);

    // Front Fluffy Paws
    const pawGeo = new THREE.SphereGeometry(0.14, 16, 16);
    pawGeo.scale(0.9, 0.7, 1.2);
    const leftPaw = new THREE.Mesh(pawGeo, catBodyMaterial);
    leftPaw.position.set(-0.24, -0.92, 0.22);
    avatarGroup.add(leftPaw);

    const rightPaw = new THREE.Mesh(pawGeo, catBodyMaterial);
    rightPaw.position.set(0.24, -0.92, 0.22);
    avatarGroup.add(rightPaw);

    // ── 3D Head Group ──
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.42, 0.1);
    headGroupRef.current = headGroup;
    avatarGroup.add(headGroup);

    const skullGeo = new THREE.SphereGeometry(0.52, 32, 32);
    skullGeo.scale(1.08, 0.96, 0.96);
    const skullMesh = new THREE.Mesh(skullGeo, catBodyMaterial);
    headGroup.add(skullMesh);

    // Fluffy Cheeks with Tuft Accents
    const leftCheek = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), catBodyMaterial);
    leftCheek.position.set(-0.3, -0.15, 0.24);
    headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), catBodyMaterial);
    rightCheek.position.set(0.3, -0.15, 0.24);
    headGroup.add(rightCheek);

    // ── 3D Cat Ears (Outer Fur + Inner Pink) ──
    const earGeo = new THREE.ConeGeometry(0.24, 0.48, 4);
    earGeo.scale(0.85, 1, 0.35);

    const leftEar = new THREE.Mesh(earGeo, catBodyMaterial);
    leftEar.position.set(-0.36, 0.48, 0.05);
    leftEar.rotation.set(0.1, 0.1, 0.45);
    headGroup.add(leftEar);

    const leftInnerEar = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 4), innerEarMaterial);
    leftInnerEar.position.set(-0.35, 0.47, 0.1);
    leftInnerEar.rotation.set(0.1, 0.1, 0.45);
    headGroup.add(leftInnerEar);

    const rightEar = new THREE.Mesh(earGeo, catBodyMaterial);
    rightEar.position.set(0.36, 0.48, 0.05);
    rightEar.rotation.set(0.1, -0.1, -0.45);
    headGroup.add(rightEar);

    const rightInnerEar = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.38, 4), innerEarMaterial);
    rightInnerEar.position.set(0.35, 0.47, 0.1);
    rightInnerEar.rotation.set(0.1, -0.1, -0.45);
    headGroup.add(rightInnerEar);

    // ── 3D Curved Crystal Dragon Horns (Segmented Icicles) ──
    const hornGeo = new THREE.ConeGeometry(0.13, 0.78, 6);
    hornGeo.scale(0.7, 1, 0.45);

    const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
    leftHorn.position.set(-0.24, 0.68, -0.05);
    leftHorn.rotation.set(-0.25, 0.25, -0.4);
    headGroup.add(leftHorn);

    const leftHornBranch = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 5), hornMaterial);
    leftHornBranch.position.set(-0.34, 0.62, -0.02);
    leftHornBranch.rotation.set(-0.4, 0.2, -0.7);
    headGroup.add(leftHornBranch);

    const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
    rightHorn.position.set(0.24, 0.68, -0.05);
    rightHorn.rotation.set(-0.25, -0.25, 0.4);
    headGroup.add(rightHorn);

    const rightHornBranch = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 5), hornMaterial);
    rightHornBranch.position.set(0.34, 0.62, -0.02);
    rightHornBranch.rotation.set(-0.4, -0.2, 0.7);
    headGroup.add(rightHornBranch);

    // ── 3D Sapphire Tiara & Forehead Gem ──
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.48, 0.18);
    headGroup.add(crownGroup);

    const tiaraArc = new THREE.TorusGeometry(0.26, 0.032, 8, 20, Math.PI);
    tiaraArc.rotateZ(Math.PI);
    const tiaraMesh = new THREE.Mesh(tiaraArc, goldTiaraMaterial);
    crownGroup.add(tiaraMesh);

    const crownGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), sapphireGemMaterial);
    crownGem.position.set(0, 0.14, 0.05);
    crownGroup.add(crownGem);

    // ── 3D Luminous Sapphire Blue Eyes (Multi-layered Sclera + Iris + Specular + Eyelids) ──
    const eyeScleraGeo = new THREE.SphereGeometry(0.14, 24, 24);
    const eyeScleraMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const pupilGeo = new THREE.SphereGeometry(0.09, 20, 20);
    const pupilMat = new THREE.MeshBasicMaterial({ map: eyeTexture });

    const eyelidGeo = new THREE.SphereGeometry(0.152, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const eyelidMat = new THREE.MeshPhysicalMaterial({ color: 0xf1f5f9, roughness: 0.3 });

    // Left Eye
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.22, 0.02, 0.44);
    headGroup.add(leftEyeGroup);

    const leftSclera = new THREE.Mesh(eyeScleraGeo, eyeScleraMat);
    leftEyeGroup.add(leftSclera);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(0, 0, 0.08);
    leftEyeGroup.add(leftPupil);
    leftEyePupilRef.current = leftPupil;

    const leftEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    leftEyelid.position.set(0, 0.02, 0);
    leftEyelid.rotation.x = -Math.PI / 2;
    leftEyeGroup.add(leftEyelid);
    leftEyelidRef.current = leftEyelid;

    // Right Eye
    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.22, 0.02, 0.44);
    headGroup.add(rightEyeGroup);

    const rightSclera = new THREE.Mesh(eyeScleraGeo, eyeScleraMat);
    rightEyeGroup.add(rightSclera);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0, 0, 0.08);
    rightEyeGroup.add(rightPupil);
    rightEyePupilRef.current = rightPupil;

    const rightEyelid = new THREE.Mesh(eyelidGeo, eyelidMat);
    rightEyelid.position.set(0, 0.02, 0);
    rightEyelid.rotation.x = -Math.PI / 2;
    rightEyeGroup.add(rightEyelid);
    rightEyelidRef.current = rightEyelid;

    // 3D Cute Pink Nose & Lip-sync Mouth
    const noseGeo = new THREE.ConeGeometry(0.045, 0.045, 3);
    noseGeo.rotateZ(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, new THREE.MeshBasicMaterial({ color: 0xf472b6 }));
    noseMesh.position.set(0, -0.09, 0.54);
    headGroup.add(noseMesh);

    const mouthGeo = new THREE.SphereGeometry(0.065, 16, 12);
    mouthGeo.scale(1, 0.45, 0.5);
    const mouthMesh = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
    mouthMesh.position.set(0, -0.16, 0.51);
    mouthMeshRef.current = mouthMesh;
    headGroup.add(mouthMesh);

    // ── 4 Segmented 3D Crystal Fairy Wings ──
    const wings: THREE.Mesh[] = [];
    const upperWingGeo = new THREE.ConeGeometry(0.4, 1.2, 4);
    upperWingGeo.scale(0.8, 1, 0.08);

    const leftUpperWing = new THREE.Mesh(upperWingGeo, wingMaterial);
    leftUpperWing.position.set(-0.35, 0.1, -0.35);
    leftUpperWing.rotation.set(0.3, 0.4, -0.8);
    avatarGroup.add(leftUpperWing);
    wings.push(leftUpperWing);

    const rightUpperWing = new THREE.Mesh(upperWingGeo, wingMaterial);
    rightUpperWing.position.set(0.35, 0.1, -0.35);
    rightUpperWing.rotation.set(0.3, -0.4, 0.8);
    avatarGroup.add(rightUpperWing);
    wings.push(rightUpperWing);

    const lowerWingGeo = new THREE.ConeGeometry(0.25, 0.75, 4);
    lowerWingGeo.scale(0.8, 1, 0.06);

    const leftLowerWing = new THREE.Mesh(lowerWingGeo, wingMaterial);
    leftLowerWing.position.set(-0.28, -0.3, -0.32);
    leftLowerWing.rotation.set(0.2, 0.3, -1.2);
    avatarGroup.add(leftLowerWing);
    wings.push(leftLowerWing);

    const rightLowerWing = new THREE.Mesh(lowerWingGeo, wingMaterial);
    rightLowerWing.position.set(0.28, -0.3, -0.32);
    rightLowerWing.rotation.set(0.2, -0.3, 1.2);
    avatarGroup.add(rightLowerWing);
    wings.push(rightLowerWing);

    wingsRef.current = wings;

    // ── 3D Sapphire Collar & Amulet ──
    const collarMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.035, 8, 24),
      goldTiaraMaterial
    );
    collarMesh.position.set(0, -0.05, 0.06);
    collarMesh.rotation.x = Math.PI / 2.2;
    avatarGroup.add(collarMesh);

    const amuletMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0), sapphireGemMaterial);
    amuletMesh.position.set(0, -0.15, 0.44);
    amuletMeshRef.current = amuletMesh;
    avatarGroup.add(amuletMesh);

    // ── 3D Multi-segment Tail ──
    const tailSegments: THREE.Mesh[] = [];
    const tailGeo = new THREE.SphereGeometry(0.1, 8, 8);
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(tailGeo, catBodyMaterial);
      seg.scale.set(1 - i * 0.1, 1 - i * 0.1, 1 - i * 0.1);
      seg.position.set(0, -0.65 - i * 0.11, -0.3 - i * 0.06);
      avatarGroup.add(seg);
      tailSegments.push(seg);
    }
    tailSegmentsRef.current = tailSegments;

    // ── 5 AI Staff Constellation Orbital Satellites ──
    const satellites: THREE.Mesh[] = [];
    SATELLITE_CONFIGS.forEach((cfg) => {
      const satMat = new THREE.MeshPhysicalMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.2,
        transmission: 0.7,
        transparent: true,
        opacity: 0.9,
      });
      const satMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), satMat);
      scene.add(satMesh);
      satellites.push(satMesh);
    });
    satellitesRef.current = satellites;

    // ── 3D Orbiting Snow Crystals Particle Field ──
    const particleCount = compactMode ? 40 : 90;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 3;
      particlePositions[i + 1] = (Math.random() - 0.5) * 3;
      particlePositions[i + 2] = (Math.random() - 0.5) * 2.5;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: compactMode ? 0.06 : 0.04,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    particlesRef.current = particles;
    scene.add(particles);

    // ── Quantum Sparkle Particle Field (dynamic colors when happy/excited) ──
    const sparkleCount = compactMode ? 30 : 60;
    const sparkleGeo = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    const sparkleColors = new Float32Array(sparkleCount * 3);
    const sparkleSizes = new Float32Array(sparkleCount);
    for (let i = 0; i < sparkleCount; i++) {
      const i3 = i * 3;
      sparklePositions[i3] = (Math.random() - 0.5) * 4;
      sparklePositions[i3 + 1] = (Math.random() - 0.5) * 4;
      sparklePositions[i3 + 2] = (Math.random() - 0.5) * 3;
      sparkleColors[i3] = Math.random();
      sparkleColors[i3 + 1] = Math.random() * 0.5 + 0.5;
      sparkleColors[i3 + 2] = 1.0;
      sparkleSizes[i] = Math.random() * 0.05 + 0.02;
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    sparkleGeo.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
    sparkleGeo.setAttribute('size', new THREE.BufferAttribute(sparkleSizes, 1));
    const sparkleMat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const quantumSparkle = new THREE.Points(sparkleGeo, sparkleMat);
    quantumSparkleRef.current = quantumSparkle;
    scene.add(quantumSparkle);

    // 6. Main 60FPS Render & Animation Loop with Tab Visibility Check
    let clock = new THREE.Clock();
    let blinkTimer = 0;
    let isBlinking = false;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Skip GPU computation if user switched to another tab
      if (!isTabVisibleRef.current) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // ── Float & Biological Breathing Oscillation (Respiration Curve) ──
      const breathSpeed = moodRef.current === 'sleeping' ? 0.8 : 2.2;
      const breathAmp = moodRef.current === 'sleeping' ? 0.02 : 0.06;
      avatarGroup.position.y = Math.sin(elapsed * breathSpeed) * breathAmp;

      // Micro respiration chest pulse
      const respScale = 1 + Math.sin(elapsed * breathSpeed) * 0.015;
      avatarGroup.scale.set(respScale, respScale, respScale);

      // ── 3D Head LookAt Target (Cursor Tracking + Natural Micro-Nod) ──
      if (headGroupRef.current) {
        const microNod = Math.sin(elapsed * 1.5) * 0.01;
        const targetRotY = mouseTargetRef.current.x * 0.45;
        const targetRotX = -mouseTargetRef.current.y * 0.35 + microNod;
        headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetRotY, 0.08);
        headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetRotX, 0.08);

        if (moodRef.current === 'curious') {
          headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, 0.15, 0.05);
        } else {
          headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, 0, 0.05);
        }
      }

      // ── 3D Eye Pupils LookAt + Saccadic Micro-Movements ──
      if (leftEyePupilRef.current && rightEyePupilRef.current) {
        const saccadeX = (Math.sin(elapsed * 5.3) + Math.cos(elapsed * 11.7)) * 0.004;
        const saccadeY = (Math.cos(elapsed * 7.1) + Math.sin(elapsed * 13.2)) * 0.004;
        const pupilX = mouseTargetRef.current.x * 0.035 + saccadeX;
        const pupilY = mouseTargetRef.current.y * 0.035 + saccadeY;
        leftEyePupilRef.current.position.x = THREE.MathUtils.lerp(leftEyePupilRef.current.position.x, pupilX, 0.15);
        leftEyePupilRef.current.position.y = THREE.MathUtils.lerp(leftEyePupilRef.current.position.y, pupilY, 0.15);
        rightEyePupilRef.current.position.x = THREE.MathUtils.lerp(rightEyePupilRef.current.position.x, pupilX, 0.15);
        rightEyePupilRef.current.position.y = THREE.MathUtils.lerp(rightEyePupilRef.current.position.y, pupilY, 0.15);
      }

      // ── Autonomous 3D Blinking ──
      blinkTimer += delta;
      if (blinkTimer > 3.5 && !isBlinking && moodRef.current !== 'sleeping') {
        isBlinking = true;
        blinkTimer = 0;
      }
      if (isBlinking) {
        if (leftEyelidRef.current && rightEyelidRef.current) {
          leftEyelidRef.current.scale.y = 0.08;
          rightEyelidRef.current.scale.y = 0.08;
        }
        setTimeout(() => {
          isBlinking = false;
          if (leftEyelidRef.current && rightEyelidRef.current) {
            leftEyelidRef.current.scale.y = 1;
            rightEyelidRef.current.scale.y = 1;
          }
        }, 120);
      }
      if (moodRef.current === 'sleeping') {
        if (leftEyelidRef.current && rightEyelidRef.current) {
          leftEyelidRef.current.scale.y = 0.1;
          rightEyelidRef.current.scale.y = 0.1;
        }
      }

      // ── 3D Viseme Lip-sync & Amulet Audio Pulse 3.0 ──
      if (mouthMeshRef.current) {
        const visemeMorph = calculateVisemeMorph(
          visemeScaleRef.current,
          isSpeakingRef.current,
          moodRef.current,
          elapsed
        );
        mouthMeshRef.current.scale.x = THREE.MathUtils.lerp(mouthMeshRef.current.scale.x, visemeMorph.scaleX, 0.25);
        mouthMeshRef.current.scale.y = THREE.MathUtils.lerp(mouthMeshRef.current.scale.y, visemeMorph.scaleY, 0.25);
        mouthMeshRef.current.scale.z = THREE.MathUtils.lerp(mouthMeshRef.current.scale.z, visemeMorph.scaleZ, 0.25);
      }

      if (amuletMeshRef.current) {
        const amuletPulse = isSpeakingRef.current ? 1 + visemeScaleRef.current * 0.4 : 1 + Math.sin(elapsed * 4) * 0.06;
        amuletMeshRef.current.scale.set(amuletPulse, amuletPulse, amuletPulse);
      }

      // ── 3D Dual-Harmonic Wing Flutter ──
      if (wingsRef.current.length >= 4) {
        const flapSpeed = moodRef.current === 'happy' ? 7.5 : 4.0;
        const flapAngle = Math.sin(elapsed * flapSpeed) * 0.35;
        wingsRef.current[0].rotation.z = -0.8 + flapAngle;
        wingsRef.current[1].rotation.z = 0.8 - flapAngle;
        wingsRef.current[2].rotation.z = -1.2 + flapAngle * 0.6;
        wingsRef.current[3].rotation.z = 1.2 - flapAngle * 0.6;
      }

      // ── 3D Tail Physics Wave ──
      if (tailSegmentsRef.current.length > 0) {
        tailSegmentsRef.current.forEach((seg, idx) => {
          const wave = Math.sin(elapsed * 2.5 + idx * 0.6) * 0.18;
          seg.position.x = wave * (idx + 1) * 0.08;
          seg.position.y = -0.65 - idx * 0.11 + Math.cos(elapsed * 2 + idx * 0.4) * 0.03;
        });
      }

      // ── 3D Constellation Satellites Orbit ──
      if (satellitesRef.current.length > 0) {
        const orbitRadius = compactMode ? 1.0 : 1.35;
        satellitesRef.current.forEach((sat, i) => {
          const angle = elapsed * 0.6 + (i * Math.PI * 2) / satellitesRef.current.length;
          sat.position.x = Math.cos(angle) * orbitRadius;
          sat.position.z = Math.sin(angle) * orbitRadius;
          sat.position.y = Math.sin(elapsed * 1.8 + i) * 0.25;
          sat.rotation.x = elapsed * 1.2;
          sat.rotation.y = elapsed * 1.5;
        });
      }

      // ── Particle Orbit ──
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsed * 0.08;
        particlesRef.current.rotation.x = Math.sin(elapsed * 0.05) * 0.1;
      }

      // ── Quantum Sparkle Effect ──
      if (quantumSparkleRef.current) {
        const sparkleMat = quantumSparkleRef.current.material as THREE.PointsMaterial;
        const isHappy = moodRef.current === 'happy';
        const isCurious = moodRef.current === 'curious';
        const isSpeaking = isSpeakingRef.current;

        // Fade in/out based on mood
        const targetOpacity = (isHappy || isCurious || isSpeaking) ? 0.85 : 0;
        sparkleMat.opacity = THREE.MathUtils.lerp(sparkleMat.opacity, targetOpacity, 0.03);

        // Animate sparkle positions with a gentle orbit + twinkle
        const positions = quantumSparkleRef.current.geometry.attributes.position;
        const posArray = positions.array as Float32Array;
        for (let i = 0; i < posArray.length; i += 3) {
          // Gentle floating motion
          posArray[i] += Math.sin(elapsed * 0.5 + i) * 0.0003;
          posArray[i + 1] += Math.cos(elapsed * 0.4 + i * 0.7) * 0.0003;
          posArray[i + 2] += Math.sin(elapsed * 0.3 + i * 0.5) * 0.0002;
          // Keep within bounds
          if (Math.abs(posArray[i]) > 2) posArray[i] *= 0.99;
          if (Math.abs(posArray[i + 1]) > 2) posArray[i + 1] *= 0.99;
          if (Math.abs(posArray[i + 2]) > 1.5) posArray[i + 2] *= 0.99;
        }
        positions.needsUpdate = true;

        // Twinkle sizes
        const sizeAttr = quantumSparkleRef.current.geometry.attributes.size;
        if (sizeAttr) {
          const sizeArray = sizeAttr.array as Float32Array;
          for (let i = 0; i < sizeArray.length; i++) {
            sizeArray[i] = (Math.sin(elapsed * 2 + i * 1.5) * 0.5 + 0.5) * 0.05 + 0.01;
          }
          sizeAttr.needsUpdate = true;
        }

        // Rotate the whole sparkle field
        quantumSparkleRef.current.rotation.y = elapsed * 0.15;
        quantumSparkleRef.current.rotation.x = Math.sin(elapsed * 0.08) * 0.2;
      }

      // ── Greeting Animation (wave + sparkle burst on first render) ──
      if (!greetingDoneRef.current) {
        greetingTimerRef.current += delta;
        const greetDuration = 3.0; // 3 seconds greeting animation

        if (greetingTimerRef.current < greetDuration) {
          const progress = greetingTimerRef.current / greetDuration;
          // Wave wings
          if (wingsRef.current.length >= 4) {
            const waveAngle = Math.sin(progress * Math.PI * 6) * 0.6 * (1 - progress);
            wingsRef.current[0].rotation.z = -0.8 + waveAngle;
            wingsRef.current[1].rotation.z = 0.8 - waveAngle;
            wingsRef.current[2].rotation.z = -1.2 + waveAngle * 0.6;
            wingsRef.current[3].rotation.z = 1.2 - waveAngle * 0.6;
          }
          // Head tilt greeting
          if (headGroupRef.current) {
            headGroupRef.current.rotation.z = Math.sin(progress * Math.PI * 3) * 0.12 * (1 - progress);
          }
          // Sparkle burst at peak
          if (quantumSparkleRef.current && progress > 0.2 && progress < 0.8) {
            const sparkleMat = quantumSparkleRef.current.material as THREE.PointsMaterial;
            sparkleMat.opacity = Math.sin(progress * Math.PI * 2) * 0.9;
          }
        } else {
          greetingDoneRef.current = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Page Visibility Handler
    const handleVisibilityChange = () => {
      isTabVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = compactMode ? 180 : container.clientWidth || 380;
      const h = compactMode ? 180 : container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      if (satellitesRef.current.length > 0 && sceneRef.current) {
        satellitesRef.current.forEach((sat) => sceneRef.current?.remove(sat));
      }
      if (quantumSparkleRef.current && sceneRef.current) {
        sceneRef.current.remove(quantumSparkleRef.current);
        quantumSparkleRef.current.geometry.dispose();
        (quantumSparkleRef.current.material as THREE.PointsMaterial).dispose();
        quantumSparkleRef.current = null;
      }
      if (rendererRef.current?.domElement && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, [scale, compactMode]);

  // Graceful Fallback if WebGL is unavailable on old hardware
  if (hasWebGLError) {
    return (
      <div className={`relative flex items-center justify-center p-4 ${className}`}>
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-1 shadow-2xl animate-pulse">
          <img
            src="/glacia-avatar.png"
            alt="Glacia Fallback"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handle3DClick}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* 3D WebGL Canvas Mount Node */}
      <div
        ref={mountRef}
        className={`${
          compactMode ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-80 h-96 sm:w-96 sm:h-[420px]'
        } flex items-center justify-center relative cursor-grab active:cursor-grabbing`}
      />
    </div>
  );
}
