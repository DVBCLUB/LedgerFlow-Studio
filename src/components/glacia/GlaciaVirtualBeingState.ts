/**
 * GlaciaVirtualBeingState.ts
 * ═══════════════════════════════════════════════════════════════
 * Quản lý trạng thái 4 Trụ cột Tiêu chuẩn:
 * 1. Digital Human (Tâm trí số, Nhịp tim lượng tử, Dòng suy tưởng, Vitals)
 * 2. Interactive AI Avatar (Đồng bộ khẩu hình Viseme, Ánh mắt, Biểu cảm)
 * 3. Embodied AI Agent (Nhận biết không gian màn hình, Thực thi Tool, Chỉ trỏ UI)
 * 4. Virtual Human / Virtual Being (Chu kỳ sinh học 24h, Điểm gắn kết 4 Tier, Ký ức Chiến lược)
 * ═══════════════════════════════════════════════════════════════
 */

export type GlaciaStandardArchetype =
  | 'Digital Human'
  | 'Interactive AI Avatar'
  | 'Embodied AI Agent'
  | 'Virtual Being';

export interface CognitiveThoughtStep {
  id: string;
  phase?: 'gaze_analysis' | 'context_recall' | 'swarm_correlation' | 'synthesis_execution' | string;
  label: string;
  detail?: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: string;
  durationMs?: number;
}

export interface CyberBiologyVitals {
  heartRateBpm: number; // 70-95 BPM
  neuralCoherence: number; // 0-100%
  empathyEQIndex: number; // 0-100%
  crystalEnergyPool: number; // 0-100%
  circadianPhase: 'morning_awakening' | 'active_daylight' | 'evening_synthesis' | 'deep_night_sentinel';
  circadianLabel: string;
}

export interface MemoryVaultItem {
  id: string;
  category: 'goal' | 'preference' | 'milestone' | 'knowledge';
  title: string;
  detail: string;
  importance: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface VirtualBeingProfile {
  name: string;
  species: string;
  archetype: GlaciaStandardArchetype;
  trustScore: number; // 0 to 1000 XP
  bondingTier: string;
  energyLevel: number; // 0 to 100%
  totalInteractions: number;
  totalGoalsDispatched: number;
  totalVoiceMinutes: number;
  circadianMode: 'morning_awakening' | 'active_daylight' | 'evening_synthesis' | 'deep_night_sentinel';
  lastInteractedAt: string;
  unlockedFeats: string[];
  memories: MemoryVaultItem[];
}

const STORAGE_KEY = 'lf_glacia_virtual_being_v3';

export const DEFAULT_MEMORIES: MemoryVaultItem[] = [
  {
    id: 'mem-1',
    category: 'goal',
    title: 'Sứ Mệnh Sáng Tạo & Game Dev Tối Thượng',
    detail: 'Phát triển Glacia thành Đạo Diễn Phim AI, Xưởng Sản Xuất Game 2D/3D Tự Trị và Kỹ Sư Lập Trình Phần Mềm Đỉnh Cao cho Founder David Bao.',
    importance: 'high',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  },
  {
    id: 'mem-2',
    category: 'preference',
    title: 'Định Hướng Chiến Lược Bất Biến',
    detail: 'Không làm kế toán hay tài chính khô cứng. Tập trung 100% vào Lập trình Game 2D/3D, Viết kịch bản Storyboard phim điện ảnh, Tạo dựng Nhân vật 3D Blender, Dựng phim giải trí và Lập trình phần mềm.',
    importance: 'high',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  },
  {
    id: 'mem-3',
    category: 'knowledge',
    title: 'Hệ Sinh Thái Sáng Tạo & Game Engine',
    detail: 'Glacia Game Engine 2.0 (Canvas 2D/Three.js/WebAudio), AI Cinematic Video Studio (FFmpeg/Storyboard), Blender 3D Rigging & Virtual Cast, SWE Autonomous Coder.',
    importance: 'high',
    createdAt: new Date().toLocaleDateString('vi-VN'),
  },
];

export function getCircadianPhase(): 'morning_awakening' | 'active_daylight' | 'evening_synthesis' | 'deep_night_sentinel' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning_awakening';
  if (hour >= 12 && hour < 18) return 'active_daylight';
  if (hour >= 18 && hour < 23) return 'evening_synthesis';
  return 'deep_night_sentinel';
}

export function getCircadianLabel(phase: string): string {
  switch (phase) {
    case 'morning_awakening':
      return '🌅 Thức giấc & Nạp Năng lượng Lượng tử (06:00 - 12:00)';
    case 'active_daylight':
      return '⚡ Trực chiến & Điều phối Toàn diện (12:00 - 18:00)';
    case 'evening_synthesis':
      return '🌆 Tổng hợp Báo cáo & Đánh giá Chỉ số (18:00 - 23:00)';
    case 'deep_night_sentinel':
    default:
      return '🌙 Canh gác An ninh & Tối ưu Hệ thống (23:00 - 06:00)';
  }
}

export function getBondingTierName(trustScore: number): string {
  if (trustScore >= 800) return 'Hộ Thần Tối Cao (Level 4 · Soul Partner & Guardian)';
  if (trustScore >= 500) return 'Tri Kỷ Chiến Lược (Level 3 · Strategic Ally)';
  if (trustScore >= 200) return 'Cộng Sự Tin Cậy (Level 2 · Trusted Companion)';
  return 'Trợ Lý Đồng Hành (Level 1 · Active Agent)';
}

export function getBondingTierProgress(trustScore: number): { currentTierMin: number; nextTierMax: number; percent: number; level: number } {
  if (trustScore >= 800) {
    return { currentTierMin: 800, nextTierMax: 1000, percent: Math.min(100, ((trustScore - 800) / 200) * 100), level: 4 };
  }
  if (trustScore >= 500) {
    return { currentTierMin: 500, nextTierMax: 800, percent: ((trustScore - 500) / 300) * 100, level: 3 };
  }
  if (trustScore >= 200) {
    return { currentTierMin: 200, nextTierMax: 500, percent: ((trustScore - 200) / 300) * 100, level: 2 };
  }
  return { currentTierMin: 0, nextTierMax: 200, percent: (trustScore / 200) * 100, level: 1 };
}

export function loadVirtualBeingProfile(): VirtualBeingProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...parsed,
        bondingTier: getBondingTierName(parsed.trustScore || 450),
        circadianMode: getCircadianPhase(),
        memories: parsed.memories && parsed.memories.length ? parsed.memories : DEFAULT_MEMORIES,
      };
    }
  } catch {}

  return {
    name: 'Glacia',
    species: 'Frost Dragon-Fairy Crystal Cat (Mèo Rồng Tiên Tinh Thể)',
    archetype: 'Digital Human',
    trustScore: 460,
    bondingTier: getBondingTierName(460),
    energyLevel: 98,
    totalInteractions: 36,
    totalGoalsDispatched: 14,
    totalVoiceMinutes: 22,
    circadianMode: getCircadianPhase(),
    lastInteractedAt: new Date().toISOString(),
    unlockedFeats: [
      'Giao tiếp Đa phương thức (Voice + STT/TTS)',
      'Hiện thân Không gian (Embodied Spatial Guidance)',
      'Điều phối Đa AI Swarm Tự động',
      'Đồng bộ Khẩu hình Viseme & Biểu cảm Realtime',
      'Bánh Xe Lệnh Nhanh 8 Hướng Lượng Tử (Radial HUD)',
      'Kho Ký Ức Dài Hạn & Đồ Thị Tri Thức Doanh Nghiệp',
    ],
    memories: DEFAULT_MEMORIES,
  };
}

export function saveVirtualBeingProfile(profile: VirtualBeingProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}
