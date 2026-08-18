/**
 * aiBusinessBridge.ts
 * ============================================================
 * Cầu nối AI ↔ dữ liệu nghiệp vụ: kết quả AI được ghi thành entity
 * chuẩn (product/lead/campaign/invoice...) + đồng thời lưu bài học.
 */

import { upsertBusinessEntity, type BusinessEntityType, type BusinessEntity } from './businessDataService.ts';
import { recordCrossAiLesson } from './localLearningStore.ts';

// Loại entity "đụng tiền" — AI phải được người duyệt trước khi ghi chính thức.
const MONEY_TYPES: BusinessEntityType[] = ['invoice', 'deal'];

// Quyết định có cần duyệt hay không — thuần, dùng được cho test.
export function shouldRequireMoneyApproval(input: { type: BusinessEntityType; source?: string }): boolean {
  return MONEY_TYPES.includes(input.type) && (input.source || 'ai') !== 'user';
}

export function persistAgentResult(input: {
  type: BusinessEntityType;
  data: Record<string, unknown>;
  source?: 'user' | 'ai' | 'workflow';
  /** Bắt buộc true để AI ghi entity đụng tiền mà không cần duyệt. */
  approved?: boolean;
  lesson?: { domain: string; title: string; content: string };
}): { entity: BusinessEntity; lessonRecorded: boolean; needsApproval: boolean } {
  const source = input.source || 'ai';
  // AI/workflow ghi entity đụng tiền mà chưa được duyệt → ghi dạng chờ duyệt.
  const needsApproval = shouldRequireMoneyApproval({ type: input.type, source }) && input.approved !== true;

  const entity = upsertBusinessEntity({
    type: input.type,
    data: needsApproval ? { ...input.data, status: 'pending_approval' } : input.data,
    source,
  });

  let lessonRecorded = false;
  if (input.lesson) {
    recordCrossAiLesson({
      domain: input.lesson.domain,
      title: input.lesson.title,
      content: input.lesson.content,
      source: `business:${input.type}`,
      success: true,
    });
    lessonRecorded = true;
  }
  return { entity, lessonRecorded, needsApproval };
}
