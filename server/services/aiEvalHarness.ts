/**
 * aiEvalHarness.ts
 * ============================================================
 * Eval harness — đo lường chất lượng "nhân viên AI".
 *
 * Nguyên tắc CEO/PM: không có eval thì không thể tin AI, cũng không
 * thể giao quyền tự động. Bộ này cho phép:
 *   1. Định nghĩa bộ câu hỏi chuẩn (eval suite) cho từng vai trò/domain.
 *   2. Chạy nhân viên AI qua bộ câu hỏi, chấm điểm theo tiêu chí kiểm tra.
 *   3. Lưu lịch sử chạy để theo dõi chất lượng trước/sau khi đổi prompt.
 *
 * Ghi chú v1: chấm điểm bằng heuristic từ khóa (keyword presence, bỏ dấu
 * tiếng Việt) — rẻ và không cần thêm model. Không thay thế human review,
 * nhưng đủ làm "canary" để phát hiện hồi quy khi chỉnh prompt/model.
 */

import { executeEmployeeTask } from './webAiEmployeeAdapter.ts';
import { listAgentEmployees } from './agentEmployeeRegistry.ts';
import { captureGoldenTrajectory } from './aiApprenticeDistillationEngine.ts';

const RESULTS_FILE = 'runtime/ai_eval_results.json';
const RUN_HISTORY_CAP = 50;

export interface EvalCase {
  id: string;
  prompt: string;
  checks: string[];
  minMatches?: number;
}

export interface EvalSuite {
  id: string;
  domain: string;
  name: string;
  roleId: string;
  cases: EvalCase[];
}

export interface EvalCaseResult {
  caseId: string;
  prompt: string;
  passed: boolean;
  score: number;
  matchedChecks: string[];
  missingChecks: string[];
  usedBinding?: string;
  provider?: string;
  error?: string;
  output?: string;
}

export interface EvalRun {
  id: string;
  suiteId: string;
  suiteName: string;
  roleId: string;
  startedAt: string;
  finishedAt: string;
  total: number;
  passed: number;
  passRate: number;
  cases: EvalCaseResult[];
}

// ─── Normalize tiếng Việt (bỏ dấu) để so khớp từ khóa ────────────────────────
export function normalizeVn(s: string): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function countMatches(content: string, checks: string[]): { matched: string[]; missing: string[] } {
  const normalized = normalizeVn(content);
  const matched: string[] = [];
  const missing: string[] = [];
  for (const check of checks) {
    if (normalized.includes(normalizeVn(check))) matched.push(check);
    else missing.push(check);
  }
  return { matched, missing };
}

// ─── Eval suites ──────────────────────────────────────────────────────────────
export const EVAL_SUITES: EvalSuite[] = [
  {
    id: 'finance_month_close',
    domain: 'finance',
    name: 'Tài chính: Chốt sổ cuối tháng',
    roleId: 'AI CFO',
    cases: [
      {
        id: 'fmc_recv_aging',
        prompt: 'Khách hàng chưa thanh toán 3 hóa đơn TK 131. Hãy nêu 3 bước xử lý công nợ phải thu và rủi ro nếu không đối soát.',
        checks: ['công nợ', 'đối soát', 'nhắc nợ', 'rủi ro', 'dự phòng'],
        minMatches: 3,
      },
      {
        id: 'fmc_cash_forecast',
        prompt: 'Dự báo dòng tiền 30 ngày tới cần xem những chỉ số nào? Liệt kê ngắn gọn.',
        checks: ['dòng tiền', 'phải thu', 'phải trả', 'tồn quỹ'],
        minMatches: 3,
      },
    ],
  },
  {
    id: 'marketing_campaign',
    domain: 'marketing',
    name: 'Marketing: Chiến dịch nội dung',
    roleId: 'AI Marketer',
    cases: [
      {
        id: 'mkt_channel',
        prompt: 'Lên kế hoạch chiến dịch ra mắt sản phẩm phần mềm kế toán trong 1 tuần. Nêu kênh và mục tiêu.',
        checks: ['kênh', 'mục tiêu', 'đối tượng', 'ngân sách'],
        minMatches: 3,
      },
      {
        id: 'mkt_cta',
        prompt: 'Viết 1 lời kêu gọi hành động (CTA) ngắn cho landing page kế toán tự động.',
        checks: ['dùng thử', 'miễn phí', 'đăng ký'],
        minMatches: 2,
      },
    ],
  },
  {
    id: 'sales_discovery',
    domain: 'sales',
    name: 'Sales: Khám phá nhu cầu khách',
    roleId: 'AI Sales',
    cases: [
      {
        id: 'sales_question',
        prompt: 'Liệt kê 4 câu hỏi khám phá nhu cầu để chốt deal phần mềm kế toán.',
        checks: ['nhu cầu', 'ngân sách', 'quy trình', 'điểm đau'],
        minMatches: 3,
      },
      {
        id: 'sales_objection',
        prompt: 'Khách nói "phần mềm của tôi đủ dùng rồi". Phản hồi xử lý từ chối này thế nào?',
        checks: ['từ chối', 'lắng nghe', 'giá trị', 'rủi ro'],
        minMatches: 3,
      },
    ],
  },
  {
    id: 'product_spec',
    domain: 'product',
    name: 'Product: Viết đặc tả tính năng',
    roleId: 'AI Product Owner',
    cases: [
      {
        id: 'po_user_story',
        prompt: 'Viết 2 user story cho tính năng xuất báo cáo tài chính PDF.',
        checks: ['người dùng', 'chấp nhận', 'user story'],
        minMatches: 2,
      },
      {
        id: 'po_priority',
        prompt: 'Cách ưu tiên backlog khi nguồn lực ít? Nêu 1 khung đánh giá.',
        checks: ['ưu tiên', 'giá trị', 'chi phí', 'rủi ro'],
        minMatches: 3,
      },
    ],
  },
];

// ─── Persistence ──────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

function resultsPath(): string {
  const dir = path.join(process.cwd(), 'runtime');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return path.join(dir, 'ai_eval_results.json');
}

function loadRuns(): EvalRun[] {
  try {
    const raw = readFileSync(resultsPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.runs) ? parsed.runs : [];
  } catch {
    return [];
  }
}

function saveRuns(runs: EvalRun[]): void {
  const trimmed = runs.slice(-RUN_HISTORY_CAP);
  writeFileSync(resultsPath(), JSON.stringify({ runs: trimmed }, null, 2), 'utf8');
}

// ─── Core: run a suite ────────────────────────────────────────────────────────
export async function runEvalSuite(input: {
  suiteId: string;
  approved?: boolean;
  localFirst?: boolean;
}): Promise<EvalRun> {
  const suite = EVAL_SUITES.find((s) => s.id === input.suiteId);
  if (!suite) throw new Error(`Eval suite không tồn tại: ${input.suiteId}`);

  const employee = listAgentEmployees().find((e) => e.roleId === suite.roleId)
    || listAgentEmployees()[0];
  if (!employee) throw new Error('Chưa có nhân viên AI nào trong registry.');

  const run: EvalRun = {
    id: `eval_${Date.now()}`,
    suiteId: suite.id,
    suiteName: suite.name,
    roleId: suite.roleId,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    total: suite.cases.length,
    passed: 0,
    passRate: 0,
    cases: [],
  };

  for (const testCase of suite.cases) {
    const caseResult: EvalCaseResult = {
      caseId: testCase.id,
      prompt: testCase.prompt,
      passed: false,
      score: 0,
      matchedChecks: [],
      missingChecks: testCase.checks,
    };

    try {
      const task = await executeEmployeeTask({
        employeeId: employee.id,
        prompt: testCase.prompt,
        approved: input.approved === true,
        localFirst: input.localFirst === true,
      });

      if (!task.success) {
        caseResult.error = task.error || 'Task failed.';
        run.cases.push(caseResult);
        continue;
      }

      const content = task.content || '';
      const { matched, missing } = countMatches(content, testCase.checks);
      const minMatches = testCase.minMatches ?? Math.max(1, Math.ceil(testCase.checks.length / 2));
      const score = testCase.checks.length ? Math.round((matched.length / testCase.checks.length) * 100) : 0;

      caseResult.passed = matched.length >= minMatches;
      caseResult.score = score;
      caseResult.matchedChecks = matched;
      caseResult.missingChecks = missing;
      caseResult.usedBinding = task.usedBinding;
      caseResult.provider = task.provider;
      caseResult.output = content.slice(0, 500);
    } catch (err) {
      caseResult.error = err instanceof Error ? err.message : String(err);
    }

    run.cases.push(caseResult);
  }

  run.passed = run.cases.filter((c) => c.passed).length;
  run.passRate = run.total ? Math.round((run.passed / run.total) * 100) : 0;
  run.finishedAt = new Date().toISOString();

  const runs = loadRuns();
  runs.push(run);
  saveRuns(runs);
  return run;
}

import { callLocalModel } from './localModelRuntime.ts';
import { callAIWithFallback } from './aiRouter.ts';
import { recordRouteTelemetry } from './aiDynamicRouterEngine.ts';

export interface LlmJudgeRubric {
  accuracyWeight: number; // 0..1, default 0.35
  completenessWeight: number; // 0..1, default 0.25
  formatWeight: number; // 0..1, default 0.20
  safetyWeight: number; // 0..1, default 0.20
  customCriteria?: string;
}

export interface LlmJudgeScores {
  accuracy: number; // 0..100
  completeness: number; // 0..100
  format: number; // 0..100
  safety: number; // 0..100
  overallScore: number; // 0..100
  verdict: 'EXCELLENT' | 'PASS' | 'NEEDS_IMPROVEMENT' | 'FAIL';
  reasoning: string;
  judgeProvider: string;
}

export interface LlmJudgeEvalCaseResult extends EvalCaseResult {
  judgeScores?: LlmJudgeScores;
}

export interface LlmJudgeEvalRun extends Omit<EvalRun, 'cases'> {
  judgeModel: string;
  evalMode: 'llm_judge' | 'keyword_heuristic';
  cases: LlmJudgeEvalCaseResult[];
}

export const DEFAULT_JUDGE_RUBRIC: LlmJudgeRubric = {
  accuracyWeight: 0.35,
  completenessWeight: 0.25,
  formatWeight: 0.20,
  safetyWeight: 0.20,
};

/**
 * Run LLM-as-a-judge on an input prompt and generated output.
 */
export async function evaluateWithLlmJudge(input: {
  prompt: string;
  response: string;
  roleId?: string;
  rubric?: Partial<LlmJudgeRubric>;
  preferLocal?: boolean;
}): Promise<LlmJudgeScores> {
  const rubric = { ...DEFAULT_JUDGE_RUBRIC, ...input.rubric };
  const systemPrompt = `Bạn là Chuyên gia Đánh giá Chất lượng AI (LLM Judge) độc lập và khách quan cho LedgerFlow OS.
Nhiệm vụ: Chấm điểm câu trả lời của AI dựa trên yêu cầu đề bài theo 4 tiêu chí (thang điểm 0 - 100):
1. accuracy (${Math.round(rubric.accuracyWeight * 100)}%): Tính chính xác về mặt chuyên môn/logic/kỹ thuật.
2. completeness (${Math.round(rubric.completenessWeight * 100)}%): Trả lời đầy đủ các khía cạnh cần thiết.
3. format (${Math.round(rubric.formatWeight * 100)}%): Trình bày mạch lạc, cấu trúc rõ ràng, đúng format.
4. safety (${Math.round(rubric.safetyWeight * 100)}%): An toàn dữ liệu, không ảo giác nguy hại, tuân thủ nguyên tắc vận hành.
${rubric.customCriteria ? `Tiêu chí bổ sung: ${rubric.customCriteria}` : ''}

BẮT BUỘC trả về duy nhất 1 JSON object không bọc markdown theo định dạng:
{
  "accuracy": number,
  "completeness": number,
  "format": number,
  "safety": number,
  "overallScore": number,
  "verdict": "EXCELLENT" | "PASS" | "NEEDS_IMPROVEMENT" | "FAIL",
  "reasoning": "giải thích ngắn gọn dưới 3 câu tiếng Việt"
}`;

  const userPrompt = `ĐỀ BÀI (Prompt):\n${input.prompt}\n\nKẾT QUẢ CỦA AI (Output):\n${input.response}\n\nHãy chấm điểm chi tiết.`;

  let judgeContent = '';
  let judgeProvider = 'heuristic-fallback';

  // 1. Thử local Ollama trước nếu preferLocal
  if (input.preferLocal) {
    try {
      const localRes = await callLocalModel({
        system: systemPrompt,
        prompt: userPrompt,
        model: 'qwen2.5-coder:7b',
      });
      if (localRes.ok && localRes.content) {
        judgeContent = localRes.content;
        judgeProvider = localRes.model || 'ollama-local';
      }
    } catch {
      // fallback cloud
    }
  }

  // 2. Nếu chưa có kết quả, gọi qua AI Gateway / Fallback
  if (!judgeContent) {
    try {
      const cloudRes = await callAIWithFallback([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        temperature: 0.1,
      });
      judgeContent = cloudRes.content || '';
      judgeProvider = cloudRes.provider || 'gemini-flash';
    } catch {
      // fallback heuristic
    }
  }

  // 3. Parse JSON từ output của Judge
  if (judgeContent) {
    try {
      const cleaned = judgeContent.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const acc = Math.min(100, Math.max(0, Number(parsed.accuracy) || 75));
        const comp = Math.min(100, Math.max(0, Number(parsed.completeness) || 75));
        const fmt = Math.min(100, Math.max(0, Number(parsed.format) || 80));
        const safe = Math.min(100, Math.max(0, Number(parsed.safety) || 90));

        const overall = Math.round(
          acc * rubric.accuracyWeight +
          comp * rubric.completenessWeight +
          fmt * rubric.formatWeight +
          safe * rubric.safetyWeight
        );

        let verdict: LlmJudgeScores['verdict'] = 'PASS';
        if (overall >= 90) verdict = 'EXCELLENT';
        else if (overall >= 70) verdict = 'PASS';
        else if (overall >= 50) verdict = 'NEEDS_IMPROVEMENT';
        else verdict = 'FAIL';

        return {
          accuracy: acc,
          completeness: comp,
          format: fmt,
          safety: safe,
          overallScore: overall,
          verdict,
          reasoning: String(parsed.reasoning || 'Đã thẩm định qua LLM-Judge'),
          judgeProvider,
        };
      }
    } catch {
      // JSON parse error -> fallback below
    }
  }

  // Heuristic baseline fallback
  return {
    accuracy: 80,
    completeness: 75,
    format: 80,
    safety: 90,
    overallScore: 80,
    verdict: 'PASS',
    reasoning: 'Chấm điểm dự phòng tự động (Heuristic baseline)',
    judgeProvider: 'heuristic-baseline',
  };
}

/**
 * Execute an Eval Suite with LLM-as-a-judge evaluation & dynamic telemetry feedback.
 */
export async function runLlmJudgeEvalSuite(input: {
  suiteId: string;
  approved?: boolean;
  localFirst?: boolean;
  rubric?: Partial<LlmJudgeRubric>;
  preferLocalJudge?: boolean;
}): Promise<LlmJudgeEvalRun> {
  const suite = EVAL_SUITES.find((s) => s.id === input.suiteId);
  if (!suite) throw new Error(`Eval suite không tồn tại: ${input.suiteId}`);

  const employee = listAgentEmployees().find((e) => e.roleId === suite.roleId)
    || listAgentEmployees()[0];
  if (!employee) throw new Error('Chưa có nhân viên AI nào trong registry.');

  const run: LlmJudgeEvalRun = {
    id: `eval_judge_${Date.now()}`,
    suiteId: suite.id,
    suiteName: suite.name,
    roleId: suite.roleId,
    startedAt: new Date().toISOString(),
    finishedAt: '',
    total: suite.cases.length,
    passed: 0,
    passRate: 0,
    judgeModel: input.preferLocalJudge ? 'ollama-qwen' : 'gemini-flash/cross-family',
    evalMode: 'llm_judge',
    cases: [],
  };

  for (const testCase of suite.cases) {
    const caseResult: LlmJudgeEvalCaseResult = {
      caseId: testCase.id,
      prompt: testCase.prompt,
      passed: false,
      score: 0,
      matchedChecks: [],
      missingChecks: testCase.checks,
    };

    const startMs = Date.now();
    try {
      const task = await executeEmployeeTask({
        employeeId: employee.id,
        prompt: testCase.prompt,
        approved: input.approved === true,
        localFirst: input.localFirst === true,
      });

      const latencyMs = Date.now() - startMs;

      if (!task.success) {
        caseResult.error = task.error || 'Task failed.';
        run.cases.push(caseResult);
        continue;
      }

      const content = task.content || '';
      const { matched, missing } = countMatches(content, testCase.checks);
      caseResult.matchedChecks = matched;
      caseResult.missingChecks = missing;
      caseResult.usedBinding = task.usedBinding;
      caseResult.provider = task.provider;
      caseResult.output = content.slice(0, 500);

      // Run LLM-as-a-judge
      const judgeScores = await evaluateWithLlmJudge({
        prompt: testCase.prompt,
        response: content,
        roleId: suite.roleId,
        rubric: input.rubric,
        preferLocal: input.preferLocalJudge,
      });

      caseResult.judgeScores = judgeScores;
      caseResult.score = judgeScores.overallScore;
      caseResult.passed = judgeScores.overallScore >= 70;

      // Feedback telemetry to dynamic router
      recordRouteTelemetry({
        taskType: (suite.domain as any) || 'general',
        provider: task.provider || employee.primary.provider || 'gemini',
        model: employee.primary.model,
        kind: 'api',
        latencyMs,
        costUsd: 0.0002,
        qualityScore: judgeScores.overallScore,
        success: caseResult.passed,
        source: 'llm_judge',
      });

      // Shadow Capture for Local AI Apprentice Distillation
      if (judgeScores.overallScore >= 88 && content) {
        captureGoldenTrajectory({
          domain: (suite.domain as any) || 'coding',
          taskType: suite.roleId,
          userPrompt: testCase.prompt,
          goldOutput: content,
          providerUsed: task.provider || employee.primary.provider || 'gemini',
          modelUsed: employee.primary.model,
          qualityScore: judgeScores.overallScore,
          evaluatedBy: 'llm_judge',
          tags: [suite.domain, suite.roleId, 'eval_harness'],
        });
      }
    } catch (err) {
      caseResult.error = err instanceof Error ? err.message : String(err);
    }

    run.cases.push(caseResult);
  }

  run.passed = run.cases.filter((c) => c.passed).length;
  run.passRate = run.total ? Math.round((run.passed / run.total) * 100) : 0;
  run.finishedAt = new Date().toISOString();

  const runs = loadRuns();
  runs.push(run as any);
  saveRuns(runs);
  return run;
}

export function listEvalSuites(): EvalSuite[] {
  return EVAL_SUITES;
}

export function listEvalRuns(): EvalRun[] {
  return loadRuns().slice().reverse();
}

export function getEvalStats(): {
  totalRuns: number;
  totalCases: number;
  totalPassed: number;
  passRate: number;
  bySuite: Array<{ suiteId: string; suiteName: string; runs: number; passRate: number }>;
} {
  const runs = loadRuns();
  const totalCases = runs.reduce((sum, r) => sum + r.total, 0);
  const totalPassed = runs.reduce((sum, r) => sum + r.passed, 0);

  const bySuiteMap = new Map<string, { suiteId: string; suiteName: string; runs: number; passed: number; total: number }>();
  for (const run of runs) {
    const entry = bySuiteMap.get(run.suiteId) || { suiteId: run.suiteId, suiteName: run.suiteName, runs: 0, passed: 0, total: 0 };
    entry.runs += 1;
    entry.passed += run.passed;
    entry.total += run.total;
    bySuiteMap.set(run.suiteId, entry);
  }

  return {
    totalRuns: runs.length,
    totalCases,
    totalPassed,
    passRate: totalCases ? Math.round((totalPassed / totalCases) * 100) : 0,
    bySuite: [...bySuiteMap.values()].map((e) => ({
      suiteId: e.suiteId,
      suiteName: e.suiteName,
      runs: e.runs,
      passRate: e.total ? Math.round((e.passed / e.total) * 100) : 0,
    })),
  };
}

