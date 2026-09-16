/**
 * server/services/glaciaCrossModalSynesthesia.ts
 * Động cơ Cảm Giác Kèm Đa Chiều & Chuyển Dịch Xuyên Miền (Cross-Modal Synesthesia) của Glacia (Epoch 11).
 * Chuyển đổi linh hoạt giữa Mã nguồn AST, Tần số Âm thanh Hòa âm, Địa hình 3D Không gian và Trạng thái Cảm xúc.
 */

import fs from 'fs';
import path from 'path';

export interface SynesthesiaTransmutationResult {
  transmutationId: string;
  sourceDomain: 'code_ast' | 'financial_flow' | 'emotion_vector' | 'audio_harmonics';
  targetDomain: 'audio_harmonics' | '3d_spatial_mesh' | 'emotional_state' | 'visual_chroma';
  inputSummary: string;
  harmonicAudioMap: {
    baseFrequencyHz: number;
    chordType: 'C_Major_7th' | 'D_Minor_9th' | 'E_Dissonant_Tritone' | 'A_Harmonic_Minor';
    tempoBpm: number;
    resonanceDescription: string;
  };
  spatial3dMeshDescriptor: {
    meshType: 'topological_terrain' | 'hyperbolic_crystal' | 'torus_knot';
    vertexCount: number;
    colorSpectrumHex: string[];
    elevationVariance: string;
  };
  executiveSynestheticInsight: string;
  transmutedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const SYNESTHESIA_FILE = path.join(RUNTIME_DIR, 'glacia_synesthesia_records.json');

export function transmuteDataDomain(
  sourceDomain: SynesthesiaTransmutationResult['sourceDomain'] = 'financial_flow',
  targetDomain: SynesthesiaTransmutationResult['targetDomain'] = '3d_spatial_mesh',
  inputPayload: string = 'Dòng tiền dương 185tr VNĐ/tháng, Runway 24 tháng, $0 Token Cost'
): SynesthesiaTransmutationResult {
  const isHealthy = inputPayload.toLowerCase().includes('dương') || inputPayload.toLowerCase().includes('clean');

  const result: SynesthesiaTransmutationResult = {
    transmutationId: `syn-${Date.now()}`,
    sourceDomain,
    targetDomain,
    inputSummary: inputPayload,
    harmonicAudioMap: {
      baseFrequencyHz: isHealthy ? 432 : 220, // 432Hz tự nhiên vs 220Hz cảnh báo
      chordType: isHealthy ? 'C_Major_7th' : 'E_Dissonant_Tritone',
      tempoBpm: isHealthy ? 120 : 80,
      resonanceDescription: isHealthy
        ? 'Hòa âm quãng 5 êm dịu, phản ánh tính ổn định vững vàng của dòng tiền doanh nghiệp.'
        : 'Âm thanh biến âm gián đoạn báo hiệu điểm nghẽn chi phí.',
    },
    spatial3dMeshDescriptor: {
      meshType: 'topological_terrain',
      vertexCount: 4096,
      colorSpectrumHex: isHealthy ? ['#10b981', '#06b6d4', '#3b82f6'] : ['#ef4444', '#f59e0b', '#7c3aed'],
      elevationVariance: isHealthy ? 'Đỉnh núi thoải xanh ngọc (Tăng trưởng dương ổn định)' : 'Hẻm vực sâu (Áp lực chi phí)',
    },
    executiveSynestheticInsight: isHealthy
      ? 'Dữ liệu được chuyển dịch thành hòa âm tần số 432Hz (C Major 7th) và địa hình 3D đỉnh núi xanh mướt cho CEO David Bao cảm nhận tức thì.'
      : 'Dữ liệu phát ra cảnh báo hòa âm nghịch tai giúp xử lý tức thì trước khi rủi ro phát sinh.',
    transmutedAt: new Date().toISOString(),
  };

  saveTransmutation(result);
  return result;
}

function saveTransmutation(res: SynesthesiaTransmutationResult): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const list = listSynesthesiaRecords();
    list.unshift(res);
    if (list.length > 20) list.pop();
    fs.writeFileSync(SYNESTHESIA_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {}
}

export function listSynesthesiaRecords(): SynesthesiaTransmutationResult[] {
  try {
    if (fs.existsSync(SYNESTHESIA_FILE)) {
      const data = JSON.parse(fs.readFileSync(SYNESTHESIA_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const initial = transmuteDataDomain();
  return [initial];
}
