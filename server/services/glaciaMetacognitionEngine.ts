/**
 * server/services/glaciaMetacognitionEngine.ts
 * Động cơ Siêu Nhận Thức (Metacognition Engine) của Glacia (Epoch 8).
 * Lấy cảm hứng từ lý thuyết Metacognition của John Flavell (1979) — "Suy nghĩ về chính suy nghĩ của mình".
 */

import fs from 'fs';
import path from 'path';

export interface ReasoningStep {
  stepIndex: number;
  claim: string;
  evidence: string[];
  assumptions: string[];
  confidence: number; // 0.0 to 1.0
}

export interface CognitiveBiasFinding {
  biasType: 'confirmation_bias' | 'anchoring_bias' | 'circular_reasoning' | 'overconfidence_bias' | 'false_dichotomy';
  severity: 'low' | 'medium' | 'high';
  affectedStep: number;
  explanation: string;
  remedySuggestion: string;
}

export interface MetacognitiveAuditResult {
  auditId: string;
  query: string;
  rawConfidence: number;
  calibratedConfidence: number; // Sau khi tự trừ hao các rủi ro bias
  biasesDetected: CognitiveBiasFinding[];
  knowledgeGaps: string[];
  cognitiveLoadPercent: number;
  isReasoningSound: boolean;
  selfCritiqueNarrative: string;
  auditedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const METACOG_FILE = path.join(RUNTIME_DIR, 'glacia_metacognition_audits.json');

export function calibrateConfidence(rawConfidence: number, evidenceCount: number, contradictionCount: number): number {
  let calibrated = rawConfidence;
  // Giảm nếu ít bằng chứng nhưng tự tin thái quá
  if (evidenceCount === 0) calibrated *= 0.6;
  else if (evidenceCount === 1) calibrated *= 0.8;
  
  // Trừ mạnh nếu có mâu thuẫn nội tại
  if (contradictionCount > 0) {
    calibrated -= contradictionCount * 0.2;
  }
  return Math.max(0.1, Math.min(0.99, Number(calibrated.toFixed(2))));
}

export function detectKnowledgeGaps(query: string, availableContext: string[] = []): string[] {
  const gaps: string[] = [];
  const queryLower = query.toLowerCase();

  if (queryLower.includes('dự báo') || queryLower.includes('tương lai') || queryLower.includes('năm sau')) {
    gaps.push('Dữ liệu vĩ mô và biến động thị trường tương lai chưa thể xác định chính xác 100%.');
  }
  if ((queryLower.includes('đối thủ') || queryLower.includes('misa') || queryLower.includes('bravo')) && availableContext.length < 2) {
    gaps.push('Chưa có báo cáo tài chính nội bộ mới nhất của đối thủ trong 30 ngày qua.');
  }
  if (queryLower.includes('pháp lý') && !queryLower.includes('nghị định')) {
    gaps.push('Cần đối chiếu thêm các thông tư hướng dẫn thi hành mới nhất từ Bộ Tài Chính/Bộ Tư Pháp.');
  }

  return gaps;
}

export function assessCognitiveLoad(activeTaskCount: number, memoryUsageMb: number): {
  loadPercent: number;
  status: 'optimal' | 'moderate' | 'overloaded';
  recommendation: string;
} {
  let score = activeTaskCount * 12 + (memoryUsageMb > 300 ? 30 : 10);
  score = Math.min(100, Math.max(10, score));

  let status: 'optimal' | 'moderate' | 'overloaded' = 'optimal';
  let recommendation = 'Tải nhận thức hoàn hảo. Glacia có thể xử lý các bài toán chiến lược phức tạp.';

  if (score > 75) {
    status = 'overloaded';
    recommendation = 'Glacia đang xử lý quá nhiều luồng thông tin. Đề xuất CEO gom nhóm và ưu tiên 3 mục tiêu trọng điểm.';
  } else if (score > 45) {
    status = 'moderate';
    recommendation = 'Tải nhận thức ở mức cân bằng. Phù hợp cho công việc điều hành thường nhật.';
  }

  return { loadPercent: score, status, recommendation };
}

export function auditReasoningChain(query: string, steps: ReasoningStep[]): MetacognitiveAuditResult {
  const auditId = `metacog-${Date.now()}`;
  const biases: CognitiveBiasFinding[] = [];
  let totalRawConfidence = 0;
  let totalEvidence = 0;
  let contradictionCount = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    totalRawConfidence += step.confidence;
    totalEvidence += step.evidence.length;

    // Phát hiện overconfidence bias
    if (step.confidence > 0.9 && step.evidence.length === 0) {
      biases.push({
        biasType: 'overconfidence_bias',
        severity: 'high',
        affectedStep: step.stepIndex,
        explanation: `Bước ${step.stepIndex} đưa ra độ tự tin ${(step.confidence * 100).toFixed(0)}% nhưng không có bằng chứng dữ liệu cụ thể nào.`,
        remedySuggestion: 'Bổ sung số liệu thực tế từ sổ cái hoặc kết quả kiểm thử trước khi khẳng định.',
      });
    }

    // Phát hiện circular reasoning (lập luận vòng cung)
    if (step.claim.toLowerCase().includes('vì vậy') && step.assumptions.some(a => step.claim.toLowerCase().includes(a.toLowerCase().slice(0, 15)))) {
      biases.push({
        biasType: 'circular_reasoning',
        severity: 'medium',
        affectedStep: step.stepIndex,
        explanation: `Bước ${step.stepIndex} sử dụng lại giả định ban đầu làm luận cứ cho kết luận.`,
        remedySuggestion: 'Tách biệt rõ ràng giữa tiền đề lý thuyết và kết quả quan sát thực nghiệm.',
      });
      contradictionCount++;
    }
  }

  const avgRawConfidence = steps.length > 0 ? totalRawConfidence / steps.length : 0.8;
  const calibratedConfidence = calibrateConfidence(avgRawConfidence, totalEvidence, biases.length);
  const gaps = detectKnowledgeGaps(query);
  const load = assessCognitiveLoad(steps.length, 180);

  const narrative = biases.length === 0
    ? `Chuỗi suy luận chặt chẽ. Độ tự tin sau hiệu chỉnh đạt ${(calibratedConfidence * 100).toFixed(0)}%. Không phát hiện thiên kiến nhận thức.`
    : `Phát hiện ${biases.length} điểm cần cẩn trọng về thiên kiến (chủ yếu là ${biases.map(b => b.biasType).join(', ')}). Đã hiệu chỉnh độ tự tin từ ${(avgRawConfidence * 100).toFixed(0)}% xuống ${(calibratedConfidence * 100).toFixed(0)}% để bảo đảm tính khách quan.`;

  const result: MetacognitiveAuditResult = {
    auditId,
    query,
    rawConfidence: Number(avgRawConfidence.toFixed(2)),
    calibratedConfidence,
    biasesDetected: biases,
    knowledgeGaps: gaps,
    cognitiveLoadPercent: load.loadPercent,
    isReasoningSound: biases.filter(b => b.severity === 'high').length === 0,
    selfCritiqueNarrative: narrative,
    auditedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const current = listMetacognitionAudits();
    current.unshift(result);
    if (current.length > 30) current.pop();
    fs.writeFileSync(METACOG_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {}

  return result;
}

export function listMetacognitionAudits(): MetacognitiveAuditResult[] {
  try {
    if (fs.existsSync(METACOG_FILE)) {
      const data = JSON.parse(fs.readFileSync(METACOG_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return [];
}
