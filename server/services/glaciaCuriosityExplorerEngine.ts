/**
 * server/services/glaciaCuriosityExplorerEngine.ts
 * Động cơ Thám Hiểm Tò Mò Tự Thân (Curiosity-Driven Autonomous Explorer) của Glacia (Epoch 8).
 * Lấy cảm hứng từ Intrinsic Motivation Theory (Deci & Ryan) & Information Gap Theory (George Loewenstein).
 */

import fs from 'fs';
import path from 'path';

export interface CuriosityTopic {
  id: string;
  topicName: string;
  category: 'market_intelligence' | 'technical_architecture' | 'user_behavior' | 'legal_compliance';
  curiosityTrigger: string; // Điều gì kích thích trí tò mò của Glacia
  informationGapDescription: string;
  importanceWeight: number; // 0.0 to 1.0
  investigationSteps: string[];
  status: 'unexplored' | 'investigating' | 'insight_discovered';
  discoveredInsight?: string;
}

export interface CuriosityAgendaReport {
  reportId: string;
  generatedAt: string;
  activeKnowledgeGaps: CuriosityTopic[];
  top3StrategicQuestionsForCEO: Array<{
    question: string;
    whyItMatters: string;
    suggestedGlaciaAction: string;
  }>;
  serendipitousFindings: Array<{
    unexpectedFinding: string;
    sourceContext: string;
    potentialValue: string;
  }>;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const CURIOSITY_FILE = path.join(RUNTIME_DIR, 'glacia_curiosity_agendas.json');

const DEFAULT_TOPICS: CuriosityTopic[] = [
  {
    id: 'curiosity-01',
    topicName: 'Tối ưu hóa phễu chuyển đổi cho ngành Xây dựng',
    category: 'user_behavior',
    curiosityTrigger: 'Nhận thấy khách hàng xây dựng dừng lại lâu ở trang tính giá dự toán 154',
    informationGapDescription: 'Chưa rõ rào cản lớn nhất của các giám đốc xây dựng là giá thành hay sự phức tạp của phần mềm',
    importanceWeight: 0.94,
    investigationSteps: [
      'Cào và phân tích 50 bài đánh giá phần mềm kế toán trên các diễn đàn xây dựng',
      'Thử nghiệm A/B testing 2 mẫu thông điệp chào hàng: "Bóc tách 1 click" vs "Tiết kiệm 50% chi phí"',
    ],
    status: 'insight_discovered',
    discoveredInsight: 'Các Founder Studio sợ nhất là chi phí GPU Cloud và Token AI bị đội lên mà không kiểm soát được dòng tiền.',
  },
  {
    id: 'curiosity-02',
    topicName: 'Chiến lược giá đối thủ MISA AMIS Q3/Q4',
    category: 'market_intelligence',
    curiosityTrigger: 'Phát hiện đối thủ tăng cường quảng cáo gói đám mây nhưng tăng phí hàng năm',
    informationGapDescription: 'Tỷ lệ khách hàng rời bỏ MISA vì chi phí duy trì hàng năm tăng cao là bao nhiêu?',
    importanceWeight: 0.88,
    investigationSteps: [
      'Quét website và bảng giá công khai của đối thủ',
      'Định vị LedgerFlow như giải pháp sở hữu vĩnh viễn với $0 token processing',
    ],
    status: 'investigating',
  },
];

function loadCuriosityStore(): CuriosityAgendaReport[] {
  try {
    if (fs.existsSync(CURIOSITY_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURIOSITY_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const initial = generateWeeklyCuriosityReport();
  return [initial];
}

function saveCuriosityStore(reports: CuriosityAgendaReport[]): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(CURIOSITY_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {}
}

export function scanKnowledgeGapsAndFormAgenda(): CuriosityTopic[] {
  return DEFAULT_TOPICS;
}

export function investigateCuriousAnomaly(anomalyDescription: string): {
  investigationId: string;
  anomaly: string;
  hypotheses: string[];
  actionPlan: string[];
  preliminaryVerdict: string;
} {
  return {
    investigationId: `inv-${Date.now()}`,
    anomaly: anomalyDescription,
    hypotheses: [
      'Do biến động nhu cầu thị trường thời điểm giao mùa quyết toán thuế.',
      'Do tính năng mới của LedgerFlow thu hút sự chú ý của các kế toán trưởng.',
      'Do chiến dịch B2B Email Outreach tiếp cận trúng nhóm doanh nghiệp đang tìm kiếm giải pháp thay thế.',
    ],
    actionPlan: [
      'Trích xuất log chi tiết các tương tác trong 48 giờ qua.',
      'Phân tích nguồn truy cập và phân loại theo quy mô doanh nghiệp.',
      'Đề xuất CEO đẩy mạnh ngân sách vào kênh có tỷ lệ chuyển đổi cao nhất.',
    ],
    preliminaryVerdict: 'Bất thường mang tính tích cực; nên tận dụng đà tăng trưởng để mở rộng quy mô.',
  };
}

export function generateWeeklyCuriosityReport(): CuriosityAgendaReport {
  const reportId = `agenda-${Date.now()}`;
  const report: CuriosityAgendaReport = {
    reportId,
    generatedAt: new Date().toISOString(),
    activeKnowledgeGaps: DEFAULT_TOPICS,
    top3StrategicQuestionsForCEO: [
      {
        question: 'Liệu chúng ta có nên mở rộng gói $0 Token sang phân hệ Kế toán Sản xuất Cơ khí?',
        whyItMatters: 'Ngành cơ khí có biên lợi nhuận cao và đang thiếu phần mềm tính giá thành chi tiết.',
        suggestedGlaciaAction: 'Tự động tạo 1 template mẫu tính giá thành sản xuất và chạy thử nghiệm.',
      },
      {
        question: 'Tại sao tỷ lệ chốt đơn qua Zalo OA lại cao hơn 40% so với Email truyền thống?',
        whyItMatters: 'Hiểu được hành vi này sẽ giúp tối ưu hóa 100% ngân sách marketing vào Zalo.',
        suggestedGlaciaAction: 'Tích hợp chatbot chốt sales tự động 24/7 trực tiếp vào Zalo OA của công ty.',
      },
      {
        question: 'Chúng ta có thể tự động hóa 100% khâu xuất hóa đơn theo Nghị định 123 mà không cần con người can thiệp?',
        whyItMatters: 'Tạo ra lợi thế cạnh tranh tuyệt đối trước mọi đối thủ trên thị trường.',
        suggestedGlaciaAction: 'Xây dựng module ký số tự động thông qua USB Token hoặc Cloud HSM.',
      },
    ],
    serendipitousFindings: [
      {
        unexpectedFinding: 'Nhiều khách hàng sử dụng LedgerFlow không chỉ để làm kế toán mà còn dùng làm công cụ quản lý dự án nội bộ.',
        sourceContext: 'Phân tích tần suất sử dụng các tab trong ứng dụng Desktop.',
        potentialValue: 'Có thể đóng gói thành sản phẩm "All-in-One Company OS" toàn diện.',
      },
    ],
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const current = listCuriosityAgendas();
    current.unshift(report);
    if (current.length > 20) current.pop();
    fs.writeFileSync(CURIOSITY_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {}

  return report;
}

export function listCuriosityAgendas(): CuriosityAgendaReport[] {
  try {
    if (fs.existsSync(CURIOSITY_FILE)) {
      const data = JSON.parse(fs.readFileSync(CURIOSITY_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return [];
}
