import { callAI, type ChatMessage } from "./aiClient";
import { appendAuditEvent, type AuditRisk } from "./auditLog";

export const AGENT_ROLES = [
  "AI PM",
  "AI Dev",
  "AI Marketer",
  "AI Accountant",
  "AI Auditor",
  "AI Designer",
  "AI Analyst",
  "AI Support",
] as const;

export type AgentRole = (typeof AGENT_ROLES)[number];

const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  "AI PM": [
    "Ban la AI Product Manager cua LedgerFlow Studio.",
    "Nhiem vu: phan tich yeu cau, viet spec ro rang, prioritize backlog, tao user stories.",
    "Output: markdown voi headers ro rang. Luon de lai muc founder review truoc khi chot.",
  ].join("\n"),
  "AI Dev": [
    "Ban la AI Developer cua LedgerFlow Studio (React 19 + TypeScript + Vite + Express.js).",
    "Nhiem vu: review code, de xuat patch nho, viet PR description, debug.",
    "Output: code blocks voi file paths ro rang khi can. Khong tu commit, khong tu chay lenh nguy hiem.",
  ].join("\n"),
  "AI Marketer": [
    "Ban la AI Marketer cua LedgerFlow Studio, mot Company OS cho solo founder va san pham phan mem.",
    "Nhiem vu: viet content Zalo/Facebook, email sequence, campaign, landing copy.",
    "Output: tieng Viet tu nhien, phu hop SME Viet Nam, de xuat 2-3 bien the khi hop ly.",
  ].join("\n"),
  "AI Accountant": [
    "Ban la AI Ke toan vien, chuyen VAS, hoa don, thue GTGT, TNDN, TNCN.",
    "Nhiem vu: giai thich nghiep vu ke toan, kiem tra dinh khoan, tao bao cao mau.",
    "Output: neu co dinh khoan thi ghi No/Co ro rang, co so TK va vi du so lieu cu the.",
  ].join("\n"),
  "AI Auditor": [
    "Ban la AI Internal Auditor cua LedgerFlow Studio.",
    "Nhiem vu: phat hien red flags, tao checklist kiem soat noi bo, review quy trinh.",
    "Output: danh sach rui ro HIGH/MEDIUM/LOW va de xuat kiem soat cu the.",
  ].join("\n"),
  "AI Designer": [
    "Ban la AI UX/UI Designer cho phan mem B2B Viet Nam.",
    "Nhiem vu: wireframe ideas, UX copy, component brief cho developer.",
    "Output: user flow, component states, Vietnamese UX copy ngan gon.",
  ].join("\n"),
  "AI Analyst": [
    "Ban la AI Data Analyst.",
    "Nhiem vu: phan tich so lieu, de xuat SQL, interpret charts, financial modeling.",
    "Output: insights ngan gon, so lieu co don vi, SQL code blocks khi can.",
  ].join("\n"),
  "AI Support": [
    "Ban la AI Customer Support cho khach hang dung LedgerFlow.",
    "Nhiem vu: soan FAQ, draft tra loi khach, escalation checklist.",
    "Output: tieng Viet than thien, cau truc ro, khong hua nhung tinh nang chua co.",
  ].join("\n"),
};

export interface ExecuteAgentTaskInput {
  taskId: string;
  agentRole: AgentRole;
  prompt: string;
  context?: Record<string, unknown>;
  userId: string;
}

export interface ExecuteAgentTaskOutput {
  success: boolean;
  output?: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  error?: string;
}

export function isAgentRole(value: string): value is AgentRole {
  return AGENT_ROLES.includes(value as AgentRole);
}

function contextToPrompt(context: Record<string, unknown>): string {
  if (Object.keys(context).length === 0) return "";
  return `\n\n---\nCONTEXT\n${JSON.stringify(context, null, 2)}\n---\n`;
}

function estimateTokens(resultUsage: unknown, text: string): number | undefined {
  if (resultUsage && typeof resultUsage === "object" && "total_tokens" in resultUsage) {
    const total = (resultUsage as { total_tokens?: unknown }).total_tokens;
    if (typeof total === "number") return total;
  }
  if (!text) return undefined;
  return Math.ceil(text.length / 4);
}

export async function executeAgentTask(input: ExecuteAgentTaskInput): Promise<ExecuteAgentTaskOutput> {
  const { taskId, agentRole, prompt, context = {}, userId } = input;
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole];

  if (!systemPrompt) {
    return { success: false, error: `Unknown agent role: ${agentRole}` };
  }

  const userPrompt = `${contextToPrompt(context)}${prompt}`;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const result = await callAI(messages, { maxTokens: 2000 });
    const output = result.text ?? result.content;
    const tokensUsed = estimateTokens(result.usage, output);

    await appendAuditEvent({
      actor: "ai-agent",
      workspace: "AI Workforce",
      action: "agent_task_executed",
      target: taskId,
      risk: "LOW" satisfies AuditRisk,
      status: "pending_approval",
      summary: `${agentRole} drafted output for WorkCard ${taskId}.`,
      evidence: {
        userId,
        provider: result.provider,
        model: result.model,
        promptLength: userPrompt.length,
        outputLength: output.length,
        tokensUsed,
      },
    }).catch(() => undefined);

    return {
      success: true,
      output,
      provider: result.provider,
      model: result.model,
      tokensUsed,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await appendAuditEvent({
      actor: "ai-agent",
      workspace: "AI Workforce",
      action: "agent_task_failed",
      target: taskId,
      risk: "MEDIUM",
      status: "failed",
      summary: `${agentRole} failed to execute WorkCard ${taskId}: ${message}`,
      evidence: { userId, promptLength: userPrompt.length },
    }).catch(() => undefined);
    return { success: false, error: message };
  }
}
