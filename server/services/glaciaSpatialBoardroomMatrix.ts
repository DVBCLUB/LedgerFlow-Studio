/**
 * server/services/glaciaSpatialBoardroomMatrix.ts
 * Phòng Họp Không Gian 3D & Truyền Hiện Đa Người Dùng (Spatial Boardroom Matrix) của Glacia (Epoch 12).
 * Khởi tạo phòng họp không gian 3D WebGL / Spatial Audio kết nối CEO David Bao, đối tác và các Avatar AI tương tác dữ liệu thực tế ảo.
 */

import fs from 'fs';
import path from 'path';

export interface SpatialParticipantNode {
  participantId: string;
  name: string;
  role: string;
  avatarType: 'digital_human_3d' | 'executive_agent_holo' | 'investor_guest';
  position3D: [number, number, number]; // [x, y, z]
  spatialAudioPan: number; // -1.0 (Left) to 1.0 (Right)
  isSpeaking: boolean;
}

export interface SpatialBoardroomSession {
  sessionId: string;
  roomTopic: string;
  roomStatus: 'in_session' | 'adjourned';
  environmentTheme: 'cyber_glass_boardroom' | 'metaverse_auditorium' | 'zenith_penthouse';
  participants: SpatialParticipantNode[];
  floatingHolographicWidgets: Array<{
    widgetId: string;
    title: string;
    value: string;
    position3D: [number, number, number];
  }>;
  createdAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const BOARDROOM_FILE = path.join(RUNTIME_DIR, 'glacia_spatial_boardrooms.json');

export function initializeSpatialBoardroomSession(
  roomTopic: string = 'Họp Chiến Lược Tăng Trưởng Toàn Cầu & Thâu Tóm M&A',
  customParticipantNames?: string[]
): SpatialBoardroomSession {
  const participants: SpatialParticipantNode[] = [
    {
      participantId: 'p-ceo',
      name: 'CEO David Bao',
      role: 'Chủ Tịch HĐQT & Sáng Lập',
      avatarType: 'digital_human_3d',
      position3D: [0, 1.2, -2.5],
      spatialAudioPan: 0.0,
      isSpeaking: true,
    },
    {
      participantId: 'p-glacia',
      name: 'Robot Glacia AI',
      role: 'Tổng Cố Vấn Tự Trị',
      avatarType: 'executive_agent_holo',
      position3D: [-1.8, 1.2, -1.5],
      spatialAudioPan: -0.7,
      isSpeaking: false,
    },
    {
      participantId: 'p-investor',
      name: customParticipantNames?.[0] || 'Đối Tác Quỹ Đầu Tư Dragon Capital',
      role: 'Đại Diện Nhà Đầu Tư',
      avatarType: 'investor_guest',
      position3D: [1.8, 1.2, -1.5],
      spatialAudioPan: 0.7,
      isSpeaking: false,
    },
  ];

  const session: SpatialBoardroomSession = {
    sessionId: `spatial-room-${Date.now()}`,
    roomTopic,
    roomStatus: 'in_session',
    environmentTheme: 'cyber_glass_boardroom',
    participants,
    floatingHolographicWidgets: [
      { widgetId: 'w-arr', title: 'Doanh Thu ARR', value: '185,000,000đ/tháng', position3D: [0, 2.2, -2.0] },
      { widgetId: 'w-runway', title: 'Runway An Toàn', value: '24 Tháng ($0 Token)', position3D: [-1.2, 2.0, -1.8] },
      { widgetId: 'w-mna', title: 'Thương Vụ M&A Mục Tiêu', value: '5.5x ARR (TechVAS)', position3D: [1.2, 2.0, -1.8] },
    ],
    createdAt: new Date().toISOString(),
  };

  saveSession(session);
  return session;
}

function saveSession(session: SpatialBoardroomSession): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const list = listSpatialBoardrooms();
    list.unshift(session);
    if (list.length > 20) list.pop();
    fs.writeFileSync(BOARDROOM_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}
}

export function listSpatialBoardrooms(): SpatialBoardroomSession[] {
  try {
    if (fs.existsSync(BOARDROOM_FILE)) {
      const data = JSON.parse(fs.readFileSync(BOARDROOM_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const initial = initializeSpatialBoardroomSession();
  return [initial];
}
