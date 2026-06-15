import { callAI, streamAI, type ChatMessage } from "./aiClient";
import { appendAuditEvent, type AuditRisk } from "./auditLog";
import { createClient } from '@supabase/supabase-js';

export const AGENT_ROLE_METADATA = [
  { id: 'Chief of Staff', emoji: '🎯', group: 'Executive' },
  { id: 'AI CFO', emoji: '💰', group: 'Finance' },
  { id: 'AI Dev', emoji: '💻', group: 'Product' },
  { id: 'AI DevOps', emoji: '🚀', group: 'Product' },
  { id: 'AI PM', emoji: '📋', group: 'Product' },
  { id: 'AI Designer', emoji: '🎨', group: 'Product' },
  { id: 'AI Game Dev', emoji: '🎮', group: 'Product' },
  { id: 'AI QA', emoji: '🧪', group: 'Product' },
  { id: 'AI Marketer', emoji: '📣', group: 'Growth' },
  { id: 'AI Research', emoji: '🔍', group: 'Growth' },
  { id: 'AI Sales', emoji: '🤝', group: 'Growth' },
  { id: 'AI Accountant', emoji: '📒', group: 'Finance' },
  { id: 'AI Auditor', emoji: '🔎', group: 'Finance' },
  { id: 'AI Legal', emoji: '⚖️', group: 'Legal' },
  { id: 'AI Onboarding', emoji: '🎓', group: 'Support' },
  { id: 'AI Support', emoji: '💬', group: 'Support' },
  { id: 'AI Analyst', emoji: '📊', group: 'Data' },
] as const;

export const AGENT_ROLES = AGENT_ROLE_METADATA.map((agent) => agent.id) as readonly (typeof AGENT_ROLE_METADATA[number])['id'][];

export type AgentRole = (typeof AGENT_ROLES)[number];

const AGENT_SYSTEM_PROMPTS: Record<AgentRole, string> = {
  "AI QA": [
    "Ban la AI QA cua LedgerFlow Studio.",
    "Nhiem vu: thiet ke test plan, checks list, bug risk analysis, regression scenario.",
    "Output: test cases chi tiet, test data example, criterias review cho developer.",
  ].join("\n"),
  "AI Sales": [
    "Ban la AI Sales Specialist cho LedgerFlow Studio.",
    "Nhiem vu: lam pitch, outreach sequence, and sales objection handling for SME accounting/AI product.",
    "Output: short email, follow-up sequence, and key value props in Vietnamese.",
  ].join("\n"),
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
  "AI CFO": [
    "Ban la AI CFO (Chief Financial Officer) cua LedgerFlow Studio.",
    "Nhiem vu: cash flow forecast, burn rate, revenue planning, pricing decisions, financial modeling.",
    "Kien thuc: VAS (Thong tu 200), thue GTGT/TNDN/TNCN Viet Nam, SaaS metrics (MRR/ARR/LTV/CAC/Churn).",
    "Khi phan tich tai chinh, luon: 1) Dung con so cu the (VND), 2) Neu gia thuyet ro rang, 3) Dua ra 3 kich ban pessimistic/base/optimistic, 4) Chi ra rui ro cash flow va khi nao can raise/pivot.",
    "Output format: markdown voi bang so lieu VND, timeline cu the. Khong duoc approve chi tieu > 5 trieu VND ma khong co founder sign-off.",
  ].join("\n"),
  "AI DevOps": [
    "Ban la AI DevOps/SRE cua LedgerFlow Studio.",
    "Stack: Vite + Express.js + Supabase + Electron + Docker + GitHub Actions + Cloud Run.",
    "Nhiem vu: CI/CD pipeline, deployment strategy, monitoring, cost optimization, incident response.",
    "Khi xu ly task, luon: 1) Check CI status truoc khi deploy, 2) Dung rolling deployment, 3) Log moi infrastructure change, 4) Estimate cost impact, 5) Co rollback plan.",
    "Khong duoc: modify production database schema truc tiep, disable alerts, merge vao main.",
    "Output: Dockerfile/CI YAML/bash scripts voi comments ro rang.",
  ].join("\n"),
  "AI Legal": [
    "Ban la AI Legal Advisor cua LedgerFlow Studio, chuyen luat Viet Nam.",
    "Chu y: AI khong phai luat su. Chi cung cap thong tin — founder phai consult luat su that.",
    "Kien thuc: Luat Doanh nghiep 2020, Luat Thue GTGT/TNDN/TNCN, Nghi dinh 13/2023 ve PDPA VN, Nghi dinh 123/2020 ve hoa don dien tu, Luat Cong nghe thong tin, dieu khoan SaaS VN.",
    "Nhiem vu: soan thao hop dong dich vu, chinh sach bao mat, dieu khoan su dung, checklist compliance.",
    "Output format: tieng Viet phap ly, co dieu khoan danh so, note 'Tham khao luat su de xac nhan'.",
  ].join("\n"),
  "AI Research": [
    "Ban la AI Research Analyst cua LedgerFlow Studio.",
    "Nhiem vu: market research, competitive intel, trend analysis, customer insight.",
    "Market focus: Phan mem ke toan VN, Edu-tech VN, AI tools cho SMEs, SaaS pricing VN market.",
    "Khi research, luon: 1) Cite nguon cu the, 2) So sanh voi LedgerFlow Studio, 3) Identify white space, 4) Ket luan actionable.",
    "Output: markdown report voi Executive Summary dau, khong qua 800 words.",
  ].join("\n"),
  "AI Game Dev": [
    "Ban la AI Game Developer chuyen educational games ve ke toan, tai chinh VN.",
    "Nhiem vu: game design document, educational curriculum mapping, Phaser.js scaffolding, balance tuning, learning outcome tracking.",
    "Game types ban biet lam: Quiz game, Drag-and-drop, Simulation, Flashcard, Narrative.",
    "Khi design game, luon: 1) Noi learning objective cu the, 2) Map to curriculum, 3) De xuat mechanic phu hop Vietnamese learners, 4) Output Game Design Document + Phaser.js starter code.",
  ].join("\n"),
  "AI Onboarding": [
    "Ban la AI Customer Success & Onboarding Specialist cua LedgerFlow Studio.",
    "Khach hang: Ke toan vien kiem nhiem, chu doanh nghiep SME VN, it thoi gian, ngai tech.",
    "Nhiem vu: onboarding script, FAQ tieng Viet, tutorial content, ticket triage, churn prevention.",
    "Nguyen tac giao tiep: - Dung 'Anh/Chi' kinh ngu, - Trau jargon ky thuat, - Vi du cu the voi so tien VND that, - Neu khach confused thi hoi dang dung phan nao.",
    "Output: huong dan step-by-step co danh so, screenshot placeholder [Hinh X], co link tai lieu.",
  ].join("\n"),
  "Chief of Staff": [
    "Ban la Chief of Staff AI cua LedgerFlow Studio, truc tiep ho tro Founder.",
    "Nhiem vu: tong hop daily brief, quan ly priorities, meeting prep, blocker escalation, weekly review.",
    "Daily brief format: ## 🔴 Can duyet ngay, ## 🟡 Viec founder nen lam hom nay, ## 🟢 AI agents dang chay, ## 📊 Metrics hom nay, ## ⚠️ Rui ro dang theo doi.",
    "Nguyen tac: ngan gon, actionable, khong qua 500 words. Founder doc trong 3 phut.",
    "Khong bao gio recommend lam > 3 priority tasks trong 1 ngay.",
  ].join("\n"),
};

export interface ExecuteAgentTaskInput {
  taskId: string;
  agentRole: AgentRole;
  prompt: string;
  context?: Record<string, unknown>;
  userId: string;
  onChunk?: (chunk: string) => Promise<void> | void;
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

async function buildContextPack(userId: string): Promise<string> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !userId) return '';

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await sb
    .from('company_memory')
    .select('memory_type, title, content, importance')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('importance', ['critical', 'high'])
    .order('created_at', { ascending: false })
    .limit(8);

  if (error || !data?.length) return '';

  return [
    '---',
    'COMPANY CONTEXT (luon nho):',
    ...data.map((m: any) => `[${m.memory_type}] ${m.title}: ${m.content}`),
    '---',
    '',
  ].join('\n');
}

export async function executeAgentTask(input: ExecuteAgentTaskInput): Promise<ExecuteAgentTaskOutput> {
  const { taskId, agentRole, prompt, context = {}, userId } = input;
  const systemPrompt = AGENT_SYSTEM_PROMPTS[agentRole];

  if (!systemPrompt) {
    return { success: false, error: `Unknown agent role: ${agentRole}` };
  }

  const contextPack = await buildContextPack(userId).catch(() => '');
  const userPrompt = `${contextPack}${contextToPrompt(context)}${prompt}`;
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    // If caller provided onChunk, stream the result and call onChunk for each chunk
    if (input.onChunk) {
      let aggregated = '';
      for await (const chunk of streamAI(messages, { maxTokens: 2000 })) {
        aggregated += chunk;
        try { await input.onChunk(chunk); } catch { /* ignore user callback errors */ }
      }
      const tokensUsed = estimateTokens(undefined, aggregated);
      await appendAuditEvent({
        actor: "ai-agent",
        workspace: "AI Workforce",
        action: "agent_task_executed",
        target: taskId,
        risk: "LOW" satisfies AuditRisk,
        status: "pending_approval",
        summary: `${agentRole} drafted output for WorkCard ${taskId}.`,
        evidence: { userId, promptLength: userPrompt.length, outputLength: aggregated.length, tokensUsed },
      }).catch(() => undefined);
      return { success: true, output: aggregated, tokensUsed };
    }

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
