/**
 * agentEmployeeRegistry.ts
 * ============================================================
 * Unified AI Employee Registry.
 *
 * Mỗi AI role (từ agentRoles.ts) được gắn thành 1 "nhân viên" (AgentEmployee)
 * với binding rõ ràng: chạy bằng API chính thống (ưu tiên free tier), model
 * local (Ollama) hoặc web chat (chế độ hỗ trợ thủ công — manual assist).
 *
 * Cost & ToS policy:
 *  - Ưu tiên free tier (Ollama local / Groq free / Gemini free) trước khi tốn phí.
 *  - Web chat CHỈ dùng cho tài khoản cá nhân ở chế độ manual-assist
 *    (mỗi tin nhắn cần người duyệt), KHÔNG tự động hóa không giám sát.
 *  - Tài khoản commercial_terms BẮT BUỘC dùng API chính thống.
 */

import { AGENT_ROLES, type AgentRoleId, type AgentGroup } from './agentRoles.ts';

export type EmployeeBindingMode = 'api' | 'local' | 'web_chat';
export type EmployeeCostTier = 'free' | 'low' | 'paid';

export interface EmployeeBinding {
  mode: EmployeeBindingMode;
  provider?: string;       // 'api' | 'local': tên provider (gemini/groq/ollama/deepseek/...)
  webProfileId?: string;   // 'web_chat': id profile từ WebAiSessionManager
}

export type AccessMethod = 'api' | 'cli' | 'ide' | 'local' | 'subscription';

export interface EmployeeEndpoint {
  kind: 'api' | 'cli' | 'local' | 'ide';
  provider: string;        // gemini / deepseek / antigravity / claude / perplexity / veo / lyria / flux / ollama...
  model?: string;          // e.g. 'gemini-2.5-pro', 'gemini-3-flash', 'gemini-2.5-flash-image'
  note?: string;
}

export interface AgentEmployee {
  id: string;              // stable slug, e.g. 'ai-cfo'
  roleId: AgentRoleId;
  name: string;
  emoji: string;
  group: AgentGroup;
  systemPrompt: string;
  domains: string[];
  permission: 'LOW' | 'MEDIUM' | 'HIGH';
  binding: EmployeeBinding;
  costTier: EmployeeCostTier;
  strength: string;        // thế mạnh chuyên môn
  accessMethod: AccessMethod;
  primary: EmployeeEndpoint;
  fallbacks: EmployeeEndpoint[];
}

export interface WebChatComplianceResult {
  allowed: boolean;
  mode: 'manual_assist' | 'blocked';
  reasons: string[];
}

// ─── ToS-safe web chat policy ───────────────────────────────────────────────
export const WEB_CHAT_POLICY = {
  allowedModes: ['manual_assist'],
  maxMessagesPerDay: 20,
  cooldownSeconds: 30,
  requireHumanApprovalPerMessage: true,
  commercialAccountsMustUseApi: true,
} as const;

// ─── Cost ladder (ưu tiên rẻ → đắt, hợp lệ trước) ────────────────────────────
export const COST_LADDER: Array<{ mode: EmployeeBindingMode; provider?: string; note: string }> = [
  { mode: 'local', provider: 'ollama', note: 'Miễn phí, chạy offline, không giới hạn, không lo ToS.' },
  { mode: 'api', provider: 'groq', note: 'Free tier, tốc độ nhanh, không tốn phí.' },
  { mode: 'api', provider: 'gemini', note: 'Free tier rộng rãi (~60 req/phút), tốt cho finance/general.' },
  { mode: 'api', provider: 'deepseek', note: 'Rất rẻ, tốt cho coding.' },
  { mode: 'web_chat', note: 'Chỉ tài khoản cá nhân, manual-assist, có người duyệt từng tin.' },
];

// ─── Local model recommendations (nhẹ, không nặng RAM) ────────────────────────
export interface LocalModelRecommendation {
  model: string;
  quantization: string;
  ramEstimate: string;
  useCase: string;
}

export const LOCAL_MODEL_RECOMMENDATIONS: LocalModelRecommendation[] = [
  { model: 'qwen2.5-coder:7b', quantization: 'Q4_K_M', ramEstimate: '~4.5GB', useCase: 'Coding tốt, máy 16GB' },
  { model: 'qwen2.5-coder:14b', quantization: 'Q4_K_M', ramEstimate: '~9GB', useCase: 'Coding khá, máy 16-24GB' },
  { model: 'llama3.2:3b', quantization: 'Q4_K_M', ramEstimate: '~2GB', useCase: 'General nhẹ nhất, chạy CPU' },
  { model: 'gemma2:9b', quantization: 'Q4_K_M', ramEstimate: '~6GB', useCase: 'General + reasoning' },
  { model: 'mistral:7b', quantization: 'Q4_K_M', ramEstimate: '~4.5GB', useCase: 'General đa năng' },
];

export const OLLAMA_RUNTIME_CONFIG = {
  keepAlive: '5m',
  maxLoadedModels: 1,
  numCtx: 8192,
  env: {
    OLLAMA_KEEP_ALIVE: '5m',
    OLLAMA_MAX_LOADED_MODELS: '1',
  },
  note: 'Chỉ giữ 1 model trong RAM; nhả RAM sau 5 phút idle để không nặng máy.',
};

// ─── Role metadata ───────────────────────────────────────────────────────────
const GROUP_DOMAINS: Record<AgentGroup, string[]> = {
  Executive: ['general', 'finance'],
  Finance: ['finance'],
  Product: ['coding'],
  Growth: ['marketing', 'sales'],
  Legal: ['general'],
  Support: ['general'],
  Data: ['finance', 'general'],
  Media: ['media', 'marketing'],
};

const ROLE_PERMISSIONS: Record<AgentRoleId, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  'Chief of Staff': 'HIGH',
  'AI CFO': 'HIGH',
  'AI Dev': 'HIGH',
  'AI DevOps': 'HIGH',
  'AI PM': 'MEDIUM',
  'AI Designer': 'MEDIUM',
  'AI Game Dev': 'MEDIUM',
  'AI QA': 'HIGH',
  'AI Marketer': 'LOW',
  'AI Research': 'LOW',
  'AI Sales': 'LOW',
  'AI Accountant': 'MEDIUM',
  'AI Auditor': 'MEDIUM',
  'AI Legal': 'HIGH',
  'AI Onboarding': 'LOW',
  'AI Support': 'LOW',
  'AI Analyst': 'MEDIUM',
  'AI Video': 'MEDIUM',
  'AI Music': 'LOW',
  'AI Product Owner': 'MEDIUM',
  'AI Architect': 'HIGH',
  'AI Security': 'HIGH',
  'AI Data Engineer': 'MEDIUM',
  'AI Release Manager': 'HIGH',
  'AI HR': 'LOW',
};

interface RoleAssignment {
  strength: string;
  accessMethod: AccessMethod;
  primary: EmployeeEndpoint;
  fallbacks: EmployeeEndpoint[];
}

const DEFAULT_ASSIGNMENT: RoleAssignment = {
  strength: 'General',
  accessMethod: 'api',
  primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash', note: 'free tier' },
  fallbacks: [
    { kind: 'api', provider: 'groq', note: 'free tier' },
    { kind: 'local', provider: 'ollama', note: 'offline, $0' },
  ],
};

const ROLE_ASSIGNMENTS: Record<AgentRoleId, RoleAssignment> = {
  'Chief of Staff': { strength: 'Điều phối & tổng hợp', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash', note: 'free tier' }, fallbacks: [{ kind: 'api', provider: 'groq', note: 'free tier' }, { kind: 'local', provider: 'ollama', note: 'offline' }] },
  'AI CFO': { strength: 'Tài chính & mô hình hóa', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro', note: 'free tier (limited)' }, fallbacks: [{ kind: 'api', provider: 'deepseek', note: 'rẻ' }] },
  'AI Dev': { strength: 'Lập trình & code agent', accessMethod: 'cli', primary: { kind: 'cli', provider: 'antigravity', note: 'free agentic IDE/CLI' }, fallbacks: [{ kind: 'cli', provider: 'claude', note: 'Claude Code' }, { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro', note: 'free tier' }, { kind: 'api', provider: 'deepseek', note: 'rẻ' }] },
  'AI DevOps': { strength: 'CI/CD & hạ tầng', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro' }, fallbacks: [{ kind: 'api', provider: 'deepseek' }, { kind: 'cli', provider: 'antigravity', note: 'agentic' }] },
  'AI PM': { strength: 'Spec & roadmap', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash' }, fallbacks: [{ kind: 'api', provider: 'groq' }] },
  'AI Designer': { strength: 'Thiết kế & hình ảnh', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-flash-image', note: 'Nano Banana $0.039/ảnh' }, fallbacks: [{ kind: 'local', provider: 'flux', note: 'ComfyUI $0' }, { kind: 'api', provider: 'midjourney', note: 'subscription' }] },
  'AI Game Dev': { strength: 'Game & ML', accessMethod: 'cli', primary: { kind: 'cli', provider: 'antigravity', note: 'free' }, fallbacks: [{ kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro' }, { kind: 'api', provider: 'deepseek' }] },
  'AI QA': { strength: 'Kiểm thử & release gate', accessMethod: 'api', primary: { kind: 'api', provider: 'deepseek', note: 'rẻ' }, fallbacks: [{ kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro' }] },
  'AI Marketer': { strength: 'Content & chiến dịch', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash' }, fallbacks: [{ kind: 'api', provider: 'groq' }, { kind: 'local', provider: 'ollama' }] },
  'AI Research': { strength: 'Research & trích dẫn nguồn', accessMethod: 'api', primary: { kind: 'api', provider: 'perplexity', note: 'trích dẫn nguồn' }, fallbacks: [{ kind: 'api', provider: 'gemini', model: 'gemini-2.5-flash', note: 'Search grounding free 500 RPD' }] },
  'AI Sales': { strength: 'Sales & phễu', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash' }, fallbacks: [{ kind: 'api', provider: 'groq' }] },
  'AI Accountant': { strength: 'Kế toán VAS', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro' }, fallbacks: [{ kind: 'api', provider: 'deepseek' }] },
  'AI Auditor': { strength: 'Soát xét & rủi ro', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro' }, fallbacks: [{ kind: 'api', provider: 'deepseek' }] },
  'AI Legal': { strength: 'Pháp lý VN', accessMethod: 'api', primary: { kind: 'api', provider: 'claude', note: 'an toàn, dài ngữ cảnh' }, fallbacks: [{ kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro' }] },
  'AI Onboarding': { strength: 'Onboarding khách hàng', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash' }, fallbacks: [{ kind: 'api', provider: 'groq' }] },
  'AI Support': { strength: 'Hỗ trợ khách hàng', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash' }, fallbacks: [{ kind: 'api', provider: 'groq' }] },
  'AI Analyst': { strength: 'Phân tích dữ liệu', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash' }, fallbacks: [{ kind: 'api', provider: 'deepseek' }] },
  'AI Video': { strength: 'Video pipeline', accessMethod: 'api', primary: { kind: 'api', provider: 'veo', model: 'veo-3.1-lite', note: '$0.05/giây 720p' }, fallbacks: [{ kind: 'local', provider: 'ffmpeg', note: 'ảnh+TTS+FFmpeg $0' }] },
  'AI Music': { strength: 'Nhạc nền', accessMethod: 'api', primary: { kind: 'api', provider: 'lyria', note: '$0.04-0.08/bài' }, fallbacks: [{ kind: 'local', provider: 'local', note: 'nhạc miễn phí' }] },
  'AI Product Owner': { strength: 'Backlog & ưu tiên feature', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro', note: 'free tier' }, fallbacks: [{ kind: 'api', provider: 'deepseek', note: 'rẻ' }] },
  'AI Architect': { strength: 'Thiết kế kiến trúc hệ thống', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro', note: 'free tier' }, fallbacks: [{ kind: 'api', provider: 'deepseek', note: 'rẻ' }] },
  'AI Security': { strength: 'Bảo mật & SAST', accessMethod: 'api', primary: { kind: 'api', provider: 'claude', note: 'an toàn, cẩn thận' }, fallbacks: [{ kind: 'api', provider: 'gemini', model: 'gemini-2.5-pro', note: 'free tier' }] },
  'AI Data Engineer': { strength: 'ETL & data pipeline', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash', note: 'free tier' }, fallbacks: [{ kind: 'api', provider: 'deepseek', note: 'rẻ' }] },
  'AI Release Manager': { strength: 'Release & changelog', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash', note: 'free tier' }, fallbacks: [{ kind: 'api', provider: 'groq', note: 'free' }] },
  'AI HR': { strength: 'Nhân sự & onboarding nội bộ', accessMethod: 'api', primary: { kind: 'api', provider: 'gemini', model: 'gemini-3-flash', note: 'free tier' }, fallbacks: [{ kind: 'api', provider: 'groq', note: 'free' }] },
};

const DOMAIN_PROVIDER: Record<string, string> = {
  coding: 'deepseek',
  finance: 'gemini',
  marketing: 'groq',
  sales: 'gemini',
  general: 'gemini',
};

const FREE_PROVIDERS = new Set(['ollama', 'gemini', 'groq']);
const LOW_COST_PROVIDERS = new Set(['deepseek', 'openrouter']);

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function costTierForProvider(provider: string): EmployeeCostTier {
  if (FREE_PROVIDERS.has(provider)) return 'free';
  if (LOW_COST_PROVIDERS.has(provider)) return 'low';
  return 'paid';
}

// ─── Binding recommendation (cheapest compliant option) ─────────────────────
export function recommendBinding(domains: string[]): { binding: EmployeeBinding; costTier: EmployeeCostTier } {
  const domain = domains[0] || 'general';
  const provider = DOMAIN_PROVIDER[domain] || 'gemini';
  return {
    binding: { mode: provider === 'ollama' ? 'local' : 'api', provider },
    costTier: costTierForProvider(provider),
  };
}

// ─── Default employee catalog ───────────────────────────────────────────────
function buildDefaultEmployees(): AgentEmployee[] {
  return AGENT_ROLES.map((role) => {
    const domains = GROUP_DOMAINS[role.group] || ['general'];
    const { binding, costTier } = recommendBinding(domains);
    const assignment = ROLE_ASSIGNMENTS[role.id] || DEFAULT_ASSIGNMENT;
    return {
      id: slugify(role.id),
      roleId: role.id,
      name: role.id,
      emoji: role.emoji,
      group: role.group,
      systemPrompt: role.systemPrompt,
      domains,
      permission: ROLE_PERMISSIONS[role.id] || 'MEDIUM',
      binding,
      costTier,
      strength: assignment.strength,
      accessMethod: assignment.accessMethod,
      primary: assignment.primary,
      fallbacks: assignment.fallbacks,
    };
  });
}

const EMPLOYEE_CACHE = buildDefaultEmployees();

export function listAgentEmployees(): AgentEmployee[] {
  return EMPLOYEE_CACHE;
}

export function getAgentEmployeeById(id: string): AgentEmployee | undefined {
  return EMPLOYEE_CACHE.find((employee) => employee.id === id);
}

// ─── Web chat compliance gate ───────────────────────────────────────────────
export function evaluateWebChatCompliance(input: {
  enabled: boolean;
  status: string;
  termsMode?: 'standard_terms' | 'commercial_terms';
}): WebChatComplianceResult {
  const reasons: string[] = [];

  if (!input.enabled) {
    reasons.push('Profile is disabled.');
  }
  if (input.termsMode === 'commercial_terms') {
    reasons.push('Commercial account: web-chat automation is blocked by ToS — use official API binding instead.');
  }
  if (input.status !== 'ready') {
    reasons.push(`Profile status "${input.status}" is not ready (cần xử lý login/quota trước).`);
  }

  const allowed = reasons.length === 0;
  return {
    allowed,
    mode: allowed ? 'manual_assist' : 'blocked',
    reasons: allowed
      ? ['Personal account: manual-assist only. Mỗi tin nhắn cần founder duyệt; tối đa 20 tin/ngày.']
      : reasons,
  };
}
