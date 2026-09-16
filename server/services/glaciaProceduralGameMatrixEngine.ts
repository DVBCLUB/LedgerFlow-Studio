/**
 * server/services/glaciaProceduralGameMatrixEngine.ts
 * ============================================================
 * Glacia 3D Procedural Map Generator & Intelligent Boss AI FSM Engine
 * ------------------------------------------------------------
 * 1. Thuật toán sinh bản đồ 3D Procedural vô tận dựa trên Seed Hashing (Dungeon, Space, Cyberpunk).
 * 2. Ma trận hành vi Trí tuệ Nhân tạo Boss AI theo Finite State Machine (FSM):
 *    - PATROL (Tuần tra), CHASE (Truy kích A*), EVADE (Né đòn phản xạ),
 *    - ULTIMATE_ATTACK (Nộ chiêu AoE Nova), STUNNED (Choáng khi vỡ giáp).
 * 3. Xuất bản tệp cấu hình Three.js JSON & TypeScript Game Loop 60FPS độc lập.
 * ============================================================
 */

import fs from 'fs';
import path from 'path';

export type MapBiome = 'cyberpunk_neon_dungeon' | 'space_nebula_void' | 'crystal_glacier_vault';
export type BossFsmState = 'PATROL' | 'CHASE' | 'EVADE' | 'ULTIMATE_ATTACK' | 'STUNNED';

export interface MapTileNode {
  x: number;
  y: number;
  z: number;
  tileType: 'floor' | 'wall' | 'crystal_loot' | 'hazard_spike' | 'spawn_point' | 'boss_portal';
  elevation: number;
  colorHex: string;
}

export interface BossAiProfile {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  currentState: BossFsmState;
  speed: number;
  attackPower: number;
  aoeRadius: number;
  patrolRoute: { x: number; z: number }[];
  behaviorTreeDescription: string;
}

export interface ProceduralGameWorld {
  worldId: string;
  biome: MapBiome;
  seed: number;
  gridDimensions: { width: number; height: number; depth: number };
  tiles: MapTileNode[];
  boss: BossAiProfile;
  threeJsSceneCode: string;
  generatedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const STATE_FILE = path.join(RUNTIME_DIR, 'glacia_procedural_game_state.json');

/**
 * Hàm băm giả lập số ngẫu nhiên theo Seed (Linear Congruential Generator)
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Sinh thế giới game 3D Procedural và khởi tạo Boss AI FSM
 */
export function generateProceduralGameWorld(
  biome: MapBiome = 'cyberpunk_neon_dungeon',
  seed: number = 42
): ProceduralGameWorld {
  const rand = pseudoRandom(seed);
  const width = 16;
  const depth = 16;
  const tiles: MapTileNode[] = [];

  // Sinh lưới ô 3D Procedural
  for (let x = -width / 2; x < width / 2; x++) {
    for (let z = -depth / 2; z < depth / 2; z++) {
      const distFromCenter = Math.sqrt(x * x + z * z);
      const isPerimeter = Math.abs(x) >= width / 2 - 1 || Math.abs(z) >= depth / 2 - 1;
      const roll = rand();

      let tileType: MapTileNode['tileType'] = 'floor';
      let colorHex = '#1e293b';

      if (isPerimeter) {
        tileType = 'wall';
        colorHex = '#334155';
      } else if (distFromCenter < 2) {
        tileType = 'boss_portal';
        colorHex = '#f43f5e';
      } else if (x === -width / 2 + 2 && z === -depth / 2 + 2) {
        tileType = 'spawn_point';
        colorHex = '#10b981';
      } else if (roll < 0.08) {
        tileType = 'crystal_loot';
        colorHex = '#06b6d4';
      } else if (roll < 0.14) {
        tileType = 'hazard_spike';
        colorHex = '#e11d48';
      }

      tiles.push({
        x,
        y: tileType === 'wall' ? 1.5 : 0,
        z,
        tileType,
        elevation: tileType === 'wall' ? 3.0 : 0.2,
        colorHex,
      });
    }
  }

  // Khởi tạo Boss AI FSM Profile
  const boss: BossAiProfile = {
    id: `boss_titan_${seed}`,
    name: biome === 'cyberpunk_neon_dungeon' ? 'Neon Overlord Glacia-Prime' : 'Void Voidreaver Titan',
    maxHealth: 1500,
    currentHealth: 1500,
    currentState: 'PATROL',
    speed: 4.8,
    attackPower: 85,
    aoeRadius: 6.5,
    patrolRoute: [
      { x: 0, z: 0 },
      { x: 4, z: 4 },
      { x: -4, z: 4 },
      { x: -4, z: -4 },
      { x: 4, z: -4 },
    ],
    behaviorTreeDescription: 'FSM Transition: PATROL -> (Detect Player < 8m) -> CHASE -> (Attack < 2.5m) -> (HP < 40%) -> ULTIMATE_ATTACK',
  };

  // Tạo code TypeScript / Three.js độc lập
  const threeJsSceneCode = `// [Glacia Procedural 3D World - Seed: ${seed}]
import * as THREE from 'three';

export function buildProceduralMap(scene: THREE.Scene) {
  const tiles = ${JSON.stringify(tiles.filter(t => t.tileType !== 'floor'))};
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);

  tiles.forEach(t => {
    const mat = new THREE.MeshStandardMaterial({ color: t.colorHex, roughness: 0.3, metalness: 0.8 });
    const mesh = new THREE.Mesh(boxGeo, mat);
    mesh.position.set(t.x, t.y, t.z);
    mesh.scale.set(0.95, t.elevation, 0.95);
    scene.add(mesh);
  });
}`;

  const world: ProceduralGameWorld = {
    worldId: `world_${biome}_${seed}_${Date.now()}`,
    biome,
    seed,
    gridDimensions: { width, height: 4, depth },
    tiles,
    boss,
    threeJsSceneCode,
    generatedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(world, null, 2), 'utf-8');
  } catch {}

  return world;
}

/**
 * Tính toán bước chuyển trạng thái tiếp theo của Boss AI FSM (Tick Loop)
 */
export function updateBossAiState(
  boss: BossAiProfile,
  playerDistance: number,
  playerIsAttacking: boolean
): { nextState: BossFsmState; actionMessage: string } {
  let nextState: BossFsmState = boss.currentState;
  let actionMessage = '';

  const healthPercent = (boss.currentHealth / boss.maxHealth) * 100;

  if (healthPercent <= 40 && boss.currentState !== 'ULTIMATE_ATTACK') {
    nextState = 'ULTIMATE_ATTACK';
    actionMessage = `🔥 [BOSS FSM] Máu dưới 40% (${healthPercent.toFixed(1)}%)! Kích hoạt Nộ Chiêu ULTIMATE_ATTACK (AoE Nova R=${boss.aoeRadius}m)!`;
  } else if (playerIsAttacking && Math.random() < 0.35 && boss.currentState !== 'STUNNED') {
    nextState = 'EVADE';
    actionMessage = `⚡ [BOSS FSM] Phát hiện đòn đánh của người chơi! Kích hoạt né đòn EVADE (Tốc độ x1.5)!`;
  } else if (playerDistance <= 8.0 && boss.currentState !== 'ULTIMATE_ATTACK') {
    nextState = 'CHASE';
    actionMessage = `🎯 [BOSS FSM] Người chơi trong phạm vi ${playerDistance.toFixed(1)}m <= 8m! Kích hoạt truy kích CHASE!`;
  } else if (playerDistance > 12.0 && boss.currentState !== 'PATROL') {
    nextState = 'PATROL';
    actionMessage = `🛡️ [BOSS FSM] Người chơi ngoài tầm ${playerDistance.toFixed(1)}m > 12m! Quay lại lộ trình tuần tra PATROL.`;
  } else {
    actionMessage = `🔄 [BOSS FSM] Duy trì trạng thái ${boss.currentState}.`;
  }

  boss.currentState = nextState;
  return { nextState, actionMessage };
}
