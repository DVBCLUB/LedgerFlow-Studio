/**
 * automatedWorkflows.ts
 * ============================================================
 * Bộ khung quy trình vận hành TỰ ĐỘNG: founder chỉ cần duyệt.
 *
 * Mỗi template là 1 chuỗi các stage (nhân viên AI đảm nhận theo đúng
 * vị trí công việc), có điểm DỪNG ĐỂ DUYỆT (requiresApproval) trước khi
 * bước sang giai đoạn có rủi ro cao.
 */

import fs from 'node:fs';
import { ensureRuntimeRootSync, resolveRuntimePathFromEnv, resolveRuntimeReadPathFromEnv } from './runtimePaths.ts';
import { routeTask, type TaskType } from './aiRoutingPolicy.ts';
import { sendA2AMessage } from './agentCollaborationProtocol.ts';
import { upsertBusinessEntity } from './businessDataService.ts';

export interface WorkflowStage {
  stageId: string;
  employeeId: string;         // ai-product-owner / ai-dev / ai-qa / ...
  taskType: TaskType;
  instruction: string;        // prefix prompt của stage
  requiresApproval?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
}

export interface WorkflowRun {
  id: string;
  templateId: string;
  input: string;
  currentIndex: number;
  status: 'running' | 'waiting_approval' | 'completed' | 'failed' | 'rejected';
  results: Array<{ stageId: string; ok: boolean; output: string }>;
  createdAt: string;
  updatedAt: string;
}

// ─── Templates: sơ đồ vị trí công ty công nghệ ───────────────────────────────
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'feature_dev',
    name: 'Phát triển feature',
    description: 'PO spec → Dev code → QA test → Security review → [duyệt] → Release notes',
    stages: [
      { stageId: 'spec', employeeId: 'ai-product-owner', taskType: 'general', instruction: 'Viết spec + user story + acceptance criteria cho yêu cầu:' },
      { stageId: 'code', employeeId: 'ai-dev', taskType: 'backend', instruction: 'Triển khai code theo spec:' },
      { stageId: 'test', employeeId: 'ai-qa', taskType: 'general', instruction: 'Viết test plan + edge cases cho:' },
      { stageId: 'security', employeeId: 'ai-security', taskType: 'general', instruction: 'Review bảo mật (secret/injection/dependency) cho:' },
      { stageId: 'approve', employeeId: 'founder', taskType: 'general', instruction: 'Duyệt trước khi release:', requiresApproval: true },
      { stageId: 'release', employeeId: 'ai-release-manager', taskType: 'general', instruction: 'Viết changelog + checklist rollback cho:' },
    ],
  },
  {
    id: 'bug_fix',
    name: 'Sửa lỗi',
    description: 'Dev fix → QA verify → [duyệt] → Release notes',
    stages: [
      { stageId: 'fix', employeeId: 'ai-dev', taskType: 'backend', instruction: 'Sửa lỗi:' },
      { stageId: 'verify', employeeId: 'ai-qa', taskType: 'general', instruction: 'Kiểm tra lại lỗi đã hết chưa:' },
      { stageId: 'approve', employeeId: 'founder', taskType: 'general', instruction: 'Duyệt hotfix:', requiresApproval: true },
      { stageId: 'release', employeeId: 'ai-release-manager', taskType: 'general', instruction: 'Ghi chú release cho:' },
    ],
  },
  {
    id: 'content_campaign',
    name: 'Chiến dịch content',
    description: 'Marketer plan → Video → [duyệt] → Publish',
    stages: [
      { stageId: 'plan', employeeId: 'ai-marketer', taskType: 'marketing', instruction: 'Lập kế hoạch chiến dịch content cho:' },
      { stageId: 'video', employeeId: 'ai-video', taskType: 'video', instruction: 'Lên kế hoạch video cho:' },
      { stageId: 'approve', employeeId: 'founder', taskType: 'general', instruction: 'Duyệt nội dung trước khi đăng:', requiresApproval: true },
      { stageId: 'publish', employeeId: 'ai-marketer', taskType: 'marketing', instruction: 'Soạn caption + lịch đăng cho:' },
    ],
  },
  {
    id: 'month_end_close',
    name: 'Chốt sổ cuối kỳ',
    description: 'Accountant hạch toán → Auditor soát → [duyệt] → CFO báo cáo',
    stages: [
      { stageId: 'post', employeeId: 'ai-accountant', taskType: 'finance', instruction: 'Hạch toán + đối soát chứng từ cuối kỳ:' },
      { stageId: 'audit', employeeId: 'ai-auditor', taskType: 'finance', instruction: 'Soát xét red flags, thiếu chứng từ:' },
      { stageId: 'approve', employeeId: 'founder', taskType: 'general', instruction: 'Duyệt chốt sổ:', requiresApproval: true },
      { stageId: 'report', employeeId: 'ai-cfo', taskType: 'finance', instruction: 'Lập báo cáo tài chính + phân tích:' },
    ],
  },
  {
    id: 'security_audit',
    name: 'Kiểm tra bảo mật',
    description: 'Security audit → [duyệt]',
    stages: [
      { stageId: 'scan', employeeId: 'ai-security', taskType: 'general', instruction: 'Quét bảo mật + rủi ro cho:' },
      { stageId: 'approve', employeeId: 'founder', taskType: 'general', instruction: 'Duyệt kết luận bảo mật:', requiresApproval: true },
    ],
  },
];

// ─── Persistence ─────────────────────────────────────────────────────────────
const RUNS_FILE = resolveRuntimePathFromEnv('WORKFLOW_RUNS_FILE', 'workflow_runs.json');
let cache: WorkflowRun[] | null = null;

function load(): WorkflowRun[] {
  if (cache) return cache;
  try {
    const p = resolveRuntimeReadPathFromEnv('WORKFLOW_RUNS_FILE', 'workflow_runs.json');
    if (!fs.existsSync(p)) { cache = []; return cache; }
    cache = JSON.parse(fs.readFileSync(p, 'utf8')) as WorkflowRun[];
    return cache!;
  } catch { cache = []; return cache; }
}

function save(runs: WorkflowRun[]): void {
  cache = runs;
  try {
    ensureRuntimeRootSync();
    fs.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 2), 'utf8');
  } catch (err) { console.error('[Workflow] persist failed:', err); }
}

function upsert(run: WorkflowRun): void {
  const runs = load();
  const idx = runs.findIndex((r) => r.id === run.id);
  if (idx >= 0) runs[idx] = run; else runs.unshift(run);
  save(runs);
}

async function executeUntilPause(run: WorkflowRun): Promise<WorkflowRun> {
  const template = WORKFLOW_TEMPLATES.find((t) => t.id === run.templateId)!;
  while (run.currentIndex < template.stages.length) {
    const stage = template.stages[run.currentIndex];
    if (stage.requiresApproval) {
      run.status = 'waiting_approval';
      run.updatedAt = new Date().toISOString();
      upsert(run);
      sendA2AMessage({
        senderRole: 'workflow-runner',
        recipientRole: 'Founder',
        messageType: 'delegate_subtask',
        priority: 'high',
        subject: `[Workflow] Duyệt: ${template.name} #${run.id}`,
        body: `${stage.instruction}\n${run.input}`,
      });
      return run;
    }

    const goal = `${stage.instruction}\n${run.input}`;
    const r = await routeTask({ goal, taskType: stage.taskType });
    run.results.push({ stageId: stage.stageId, ok: r.result.success, output: r.result.content || r.result.error || '' });
    run.currentIndex += 1;
    run.updatedAt = new Date().toISOString();
  }
  run.status = 'completed';
  run.updatedAt = new Date().toISOString();
  // P2: handoff — ghi kết quả workflow thành entity nghiệp vụ (task).
  upsertBusinessEntity({
    id: `task_wf_${run.id}`,
    type: 'task',
    data: {
      title: `Workflow ${template.name} hoàn thành`,
      status: 'completed',
      run_id: run.id,
      input: run.input,
      summary: run.results.map((r) => `${r.stageId}:${r.ok ? 'ok' : 'fail'}`).join(', '),
    },
    source: 'workflow',
  });
  upsert(run);
  return run;
}

export async function startWorkflow(templateId: string, input: string): Promise<WorkflowRun> {
  const template = WORKFLOW_TEMPLATES.find((t) => t.id === templateId);
  if (!template) throw new Error(`Unknown workflow template: ${templateId}`);
  const run: WorkflowRun = {
    id: `wf_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
    templateId,
    input,
    currentIndex: 0,
    status: 'running',
    results: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  upsert(run);
  return executeUntilPause(run);
}

export async function approveWorkflow(runId: string): Promise<WorkflowRun> {
  const run = load().find((r) => r.id === runId);
  if (!run) throw new Error('Workflow run not found.');
  if (run.status !== 'waiting_approval') throw new Error(`Workflow is not waiting for approval (status=${run.status}).`);
  run.currentIndex += 1; // bỏ qua stage approval
  run.status = 'running';
  run.updatedAt = new Date().toISOString();
  upsert(run);
  return executeUntilPause(run);
}

export async function rejectWorkflow(runId: string): Promise<WorkflowRun> {
  const run = load().find((r) => r.id === runId);
  if (!run) throw new Error('Workflow run not found.');
  run.status = 'rejected';
  run.updatedAt = new Date().toISOString();
  upsert(run);
  return run;
}

export function listWorkflowRuns(): WorkflowRun[] {
  return load();
}
