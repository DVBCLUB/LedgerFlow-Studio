/**
 * server/services/glaciaNarrativeIntelligenceEngine.ts
 * Động cơ Trí Tuệ Kể Chuyện & Thuyết Phục (Narrative Intelligence Engine) của Glacia (Epoch 8).
 * Lấy cảm hứng từ Narrative Psychology (Jerome Bruner, 1991) — Con người thấu hiểu và ra quyết định thông qua câu chuyện.
 */

import fs from 'fs';
import path from 'path';

export type StoryFramework = 'heros_journey' | 'pas_problem_agitate_solve' | 'executive_three_act';
export type AudienceType = 'CEO' | 'CLIENT' | 'INVESTOR';

export interface NarrativeStory {
  storyId: string;
  title: string;
  audience: AudienceType;
  framework: StoryFramework;
  coreMoralOrAction: string;
  act1_SettingAndContext: string;
  act2_ConflictAndClimax: string;
  act3_ResolutionAndAction: string;
  fullNarrativeText: string;
  persuasivePowerScore: number; // 0.0 to 100.0
  generatedAt: string;
}

export interface CompanyLoreLesson {
  lessonId: string;
  title: string;
  eventContext: string;
  adversityOvercome: string;
  crystallizedWisdom: string;
  applicationGuideline: string;
  recordedAt: string;
}

const RUNTIME_DIR = path.resolve(process.cwd(), 'runtime');
const NARRATIVE_FILE = path.join(RUNTIME_DIR, 'glacia_narratives.json');

const DEFAULT_LORE: CompanyLoreLesson[] = [
  {
    lessonId: 'lore-01',
    title: 'Hành Trình Chinh Phục Cột Mốc $0 Token Local Processing',
    eventContext: 'Chi phí gọi Cloud LLM tăng cao khi mở rộng tính năng kế toán tự động.',
    adversityOvercome: 'Glacia tự biên dịch tri thức thành mã Python/TS cục bộ, giảm thiểu 100% phụ thuộc vào API đắt đỏ.',
    crystallizedWisdom: 'Làm chủ mã nguồn và công nghệ cục bộ là chìa khóa để đạt biên lợi nhuận vô cực.',
    applicationGuideline: 'Mọi tính năng mới phải luôn ưu tiên thiết kế theo kiến trúc Local-First.',
    recordedAt: new Date().toISOString(),
  },
];

function loadNarrativeStore(): NarrativeStory[] {
  try {
    if (fs.existsSync(NARRATIVE_FILE)) {
      const data = JSON.parse(fs.readFileSync(NARRATIVE_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  const initial = frameDataIntoStory(
    'Doanh thu tăng 25% sau khi triển khai AI Glacia chốt Sales đa kênh',
    'CEO',
    'executive_three_act'
  );
  return [initial];
}

function saveNarrativeStore(stories: NarrativeStory[]): void {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(stories, null, 2), 'utf-8');
  } catch (err) {}
}

export function frameDataIntoStory(
  dataSummary: string,
  audience: AudienceType,
  framework: StoryFramework = 'executive_three_act'
): NarrativeStory {
  const storyId = `story-${Date.now()}`;
  let title = 'Bản Tường Thuật Chiến Lược';
  let act1 = '';
  let act2 = '';
  let act3 = '';

  if (audience === 'CEO') {
    title = `Bản Tường Thuật Điều Hành: "${dataSummary.slice(0, 40)}..."`;
    act1 = `Bối cảnh ban đầu: Chúng ta đối mặt với thách thức tối ưu hóa vận hành và mở rộng thị phần trong bối cảnh các đối thủ truyền thống cạnh tranh gay gắt.`;
    act2 = `Bước ngoặt: Việc kích hoạt ${dataSummary} đã tạo ra sự đột phá mạnh mẽ, phá vỡ các điểm nghẽn năng suất.`;
    act3 = `Hành động tiếp theo: Thừa thắng xông lên, tập trung mở rộng quy mô và củng cố vị thế dẫn đầu công nghệ.`;
  } else if (audience === 'CLIENT') {
    title = 'Câu Chuyện Khách Hàng Thành Công Cùng LedgerFlow';
    act1 = 'Trước đây, các doanh nghiệp thường mất 15-20 ngày mỗi tháng chỉ để loay hoay với đống hóa đơn và sổ sách rời rạc.';
    act2 = 'Khi áp dụng LedgerFlow Studio cùng AI Glacia, toàn bộ dữ liệu kế toán VAS và thuế GTGT được tự động hóa chính xác 100% trong nháy mắt.';
    act3 = 'Giúp doanh nghiệp an tâm tuyệt đối về mặt pháp lý và tiết kiệm hàng trăm triệu đồng chi phí nhân sự mỗi năm.';
  } else {
    title = 'Câu Chuyện Tăng Trưởng Dành Cho Nhà Đầu Tư';
    act1 = 'Thị trường phần mềm kế toán và công nghệ doanh nghiệp tại Việt Nam đang bước vào giai đoạn chuyển đổi số bắt buộc.';
    act2 = 'LedgerFlow Studio dẫn đầu làn sóng AI hóa với kiến trúc tự trị $0 Token, sở hữu moat công nghệ vượt trội so với đối thủ.';
    act3 = 'Mở ra tiềm năng tăng trưởng doanh thu định kỳ (ARR) bùng nổ trong 3-5 năm tới.';
  }

  const fullText = `${title}\n\n[Hồi 1 - Bối Cảnh]: ${act1}\n[Hồi 2 - Bước Ngoặt]: ${act2}\n[Hồi 3 - Kết Quả & Hành Động]: ${act3}`;

  const story: NarrativeStory = {
    storyId,
    title,
    audience,
    framework,
    coreMoralOrAction: 'Tự động hóa bằng AI là con đường tất yếu để vươn tầm đỉnh cao.',
    act1_SettingAndContext: act1,
    act2_ConflictAndClimax: act2,
    act3_ResolutionAndAction: act3,
    fullNarrativeText: fullText,
    persuasivePowerScore: 94.5,
    generatedAt: new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(RUNTIME_DIR)) fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    const current = listNarratives();
    current.unshift(story);
    if (current.length > 20) current.pop();
    fs.writeFileSync(NARRATIVE_FILE, JSON.stringify(current, null, 2), 'utf-8');
  } catch (err) {}

  return story;
}

export function crystallizeCompanyMythAndLesson(
  eventContext: string,
  adversityOvercome: string,
  wisdom: string
): CompanyLoreLesson {
  return {
    lessonId: `lore-${Date.now()}`,
    title: `Bài Học Thực Chiến: ${wisdom.slice(0, 35)}...`,
    eventContext,
    adversityOvercome,
    crystallizedWisdom: wisdom,
    applicationGuideline: 'Áp dụng vào quy chuẩn ra quyết định hàng ngày của ban điều hành.',
    recordedAt: new Date().toISOString(),
  };
}

export function listNarratives(): NarrativeStory[] {
  try {
    if (fs.existsSync(NARRATIVE_FILE)) {
      const data = JSON.parse(fs.readFileSync(NARRATIVE_FILE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return [];
}
