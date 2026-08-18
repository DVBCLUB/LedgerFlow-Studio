/**
 * ollamaLocalHubService.ts
 * ============================================================
 * 1-CLICK OLLAMA LOCAL MODEL HUB & AUTO-MANAGER ($0)
 *
 * Manages local AI models running on the user's PC via Ollama (http://127.0.0.1:11434).
 * Provides a curated list of high-speed, lightweight $0 models for coding,
 * reasoning, and general assistance without requiring terminal commands.
 */

import { recordAIAction } from './aiActionLedger.ts';

export interface LocalModelCatalogItem {
  modelTag: string;
  displayName: string;
  sizeGb: number;
  minRamGb: number;
  recommendedRole: string;
  strengths: string;
  pullCommand: string;
}

export const CURATED_LOCAL_MODELS: LocalModelCatalogItem[] = [
  {
    modelTag: 'qwen2.5-coder:7b',
    displayName: 'Qwen 2.5 Coder (7B)',
    sizeGb: 4.7,
    minRamGb: 8,
    recommendedRole: 'role_ai_code_specialist',
    strengths: 'Chuyên gia viết mã nguồn TypeScript, Python, sửa lỗi và refactor tốc độ cao.',
    pullCommand: 'ollama run qwen2.5-coder:7b',
  },
  {
    modelTag: 'deepseek-r1:1.5b',
    displayName: 'DeepSeek R1 (1.5B Reasoning)',
    sizeGb: 1.1,
    minRamGb: 4,
    recommendedRole: 'role_ai_security_judge',
    strengths: 'Suy luận logic chuỗi tư duy (Chain-of-Thought) siêu nhẹ, chạy mượt trên mọi máy tính.',
    pullCommand: 'ollama run deepseek-r1:1.5b',
  },
  {
    modelTag: 'llama3.2:3b',
    displayName: 'Meta Llama 3.2 (3B)',
    sizeGb: 2.0,
    minRamGb: 6,
    recommendedRole: 'role_chief_of_staff',
    strengths: 'Tổng hợp văn bản, tóm tắt điều hành, đàm thoại tự nhiên với chi phí $0.',
    pullCommand: 'ollama run llama3.2:3b',
  },
];

/**
 * Check local Ollama health status
 */
export async function checkOllamaLocalStatus(customHost: string = 'http://127.0.0.1:11434'): Promise<{
  isOnline: boolean;
  host: string;
  statusMessage: string;
  curatedModelsCount: number;
}> {
  let isOnline = false;
  try {
    const res = await fetch(`${customHost}/api/tags`, { signal: AbortSignal.timeout(1500) });
    isOnline = res.ok;
  } catch {
    isOnline = false;
  }

  const statusMessage = isOnline
    ? 'Máy chủ Ollama cục bộ đang HOẠT ĐỘNG. Sẵn sàng chạy mô hình $0.'
    : 'Ollama cục bộ chưa bật (hoặc chưa cài đặt). Bạn có thể bật Ollama trên máy để kích hoạt chế độ $0.';

  recordAIAction({
    agentId: 'ollama_hub_service',
    roleId: 'role_chief_of_staff',
    domain: 'software_core',
    actionType: 'OLLAMA_STATUS_CHECKED',
    targetResource: customHost,
    outputSummary: `Kiểm tra Ollama Local: ${isOnline ? 'ONLINE' : 'STANDBY'}.`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return {
    isOnline,
    host: customHost,
    statusMessage,
    curatedModelsCount: CURATED_LOCAL_MODELS.length,
  };
}

/**
 * List curated models for 1-click management
 */
export function listCuratedLocalModels(): LocalModelCatalogItem[] {
  return CURATED_LOCAL_MODELS;
}
