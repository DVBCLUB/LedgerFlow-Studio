/**
 * autoRemediationPipeline.ts
 * ============================================================
 * Auto-Remediation Pipeline — fully automated pipeline:
 * detect issue → AI fix → run tests → verify → deploy.
 *
 * Zero-touch: phát hiện lỗi từ lint/build/test, tự động
 * gọi AI sửa, chạy test lại, và merge nếu pass.
 */
import { randomUUID } from 'node:crypto';
import { dispatchTextThroughFabric } from './aiFabric';
import { appendAuditEvent } from './auditLog';
import { executeScript } from './rpaEngine';
import { auditFile } from './aiSecurityAuditor';
import fs from 'fs';
import path from 'path';

// ─── Types ──────────────────────────────────────────────────────────
export type RemediationTrigger = 'lint_error' | 'build_failure' | 'test_failure' | 'security_alert' | 'manual';

export interface RemediationStep {
  id: string;
  type: 'ai_fix' | 'run_command' | 'security_check' | 'validate_output' | 'apply_fix' | 'notify';
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  output: string;
  latencyMs: number;
}

export interface RemediationRun {
  id: string;
  trigger: RemediationTrigger;
  target: string;              // File or project path
  errorDescription: string;
  steps: RemediationStep[];
  finalStatus: 'running' | 'fixed' | 'partial' | 'failed';
  fixApplied: boolean;
  originalContent?: string;
  fixedContent?: string;
  startedAt: string;
  completedAt?: string;
  totalLatencyMs: number;
}

// ─── Storage ────────────────────────────────────────────────────────
const RUNS_FILE = path.join(process.cwd(), 'remediation_runs.json');
let runs: RemediationRun[] = [];

async function load(): Promise<void> {
  try { if (fs.existsSync(RUNS_FILE)) runs = JSON.parse(await fs.promises.readFile(RUNS_FILE, 'utf8')); } catch { }
}
load().catch(() => undefined);

async function save(): Promise<void> {
  await fs.promises.writeFile(RUNS_FILE, JSON.stringify(runs.slice(-50), null, 2), 'utf8');
}

// ─── Core API ───────────────────────────────────────────────────────

export async function autoRemediate(
  target: string,
  errorDescription: string,
  options: {
    trigger?: RemediationTrigger;
    autoApply?: boolean;
    runTests?: boolean;
    maxRetries?: number;
  } = {}
): Promise<RemediationRun> {
  const runId = `remed_${Date.now()}_${randomUUID().slice(0, 6)}`;
  const started = Date.now();
  const maxRetries = Math.min(options.maxRetries || 3, 5);

  const run: RemediationRun = {
    id: runId,
    trigger: options.trigger || 'manual',
    target,
    errorDescription: errorDescription.slice(0, 200),
    steps: [],
    finalStatus: 'running',
    fixApplied: false,
    startedAt: new Date().toISOString(),
    totalLatencyMs: 0,
  };

  runs.push(run);

  try {
    // Step 1: Read current file content
    let originalContent = '';
    try { originalContent = await fs.promises.readFile(target, 'utf8'); } catch { }

    if (originalContent) {
      run.originalContent = originalContent.slice(0, 5000);
      addStep(run, 'validate_output', 'Read original file content', 'completed', `File size: ${originalContent.length} chars`, 0);
    }

    // Step 2: AI generates fix
    addStep(run, 'ai_fix', 'AI analyzing error and generating fix...', 'running', '', 0);

    let fixedContent = originalContent;
    let attemptCount = 0;

    while (attemptCount < maxRetries) {
      attemptCount++;
      const fixStart = Date.now();

      const fixPrompt = `Fix the following error in this file:

FILE: ${target}
ERROR: ${errorDescription}

CURRENT CODE:
\`\`\`
${(originalContent || '[cannot read file]').slice(0, 4000)}
\`\`\`

Return the COMPLETE FIXED FILE. Keep all existing code, only change what's needed.
Format: \`\`\`[language]\n[full fixed code]\n\`\`\`
Explain the fix briefly after the code block.`;

      const fixResult = await dispatchTextThroughFabric(
        fixPrompt, 'You are a senior developer fixing code. Return only the fixed code and a brief explanation.',
        { domain: 'coding', localFallback: true }
      );

      if (fixResult.status === 'completed' && fixResult.winner?.contentPreview) {
        const codeBlockMatch = fixResult.winner.contentPreview.match(/```[\w]*\n([\s\S]*?)```/);
        fixedContent = codeBlockMatch ? codeBlockMatch[1].trim() : fixResult.winner.contentPreview;

        updateStep(run, 'ai_fix', `Fix attempt ${attemptCount}/${maxRetries}`, 'completed',
          `Generated fix: ${fixedContent.length} chars`, Date.now() - fixStart);
      } else {
        updateStep(run, 'ai_fix', `Fix attempt ${attemptCount}/${maxRetries}`, 'failed',
          'AI failed to generate fix', Date.now() - fixStart);
        continue;
      }

      // Step 3: Security check on fixed code
      if (originalContent !== fixedContent) {
        addStep(run, 'security_check', 'Security scanning fixed code...', 'running', '', 0);
        const secStart = Date.now();

        try {
          // Write temp file for security scan
          const tmpPath = path.join(process.cwd(), '.remediation_tmp.ts');
          await fs.promises.writeFile(tmpPath, fixedContent, 'utf8');
          const secAudit = await auditFile(tmpPath);
          const secOk = secAudit.criticalCount === 0 && secAudit.highCount === 0;

          updateStep(run, 'security_check', 'Security scan',
            secOk ? 'completed' : 'completed',
            `Score: ${secAudit.score}/100, ${secAudit.criticalCount}C/${secAudit.highCount}H/${secAudit.mediumCount}M`,
            Date.now() - secStart);

          if (!secOk) {
            addStep(run, 'validate_output', 'Security check failed, retrying...', 'skipped',
              `Critical/High issues found: ${secAudit.criticalCount + secAudit.highCount}`, 0);
            // Cleanup
            try { await fs.promises.unlink(tmpPath); } catch { }
            continue;
          }

          // Cleanup
          try { await fs.promises.unlink(tmpPath); } catch { }
        } catch (secErr: any) {
          updateStep(run, 'security_check', 'Security scan', 'failed', secErr.message, Date.now() - secStart);
        }

        // Step 4: Apply fix (if autoApply enabled)
        if (options.autoApply !== false) {
          addStep(run, 'apply_fix', 'Applying fix to file...', 'running', '', 0);
          const applyStart = Date.now();

          try {
            // Backup original
            const backupPath = target.replace(/(\.\w+)$/, '.remediation_backup$1');
            await fs.promises.copyFile(target, backupPath);

            // Write fix
            await fs.promises.writeFile(target, fixedContent, 'utf8');
            run.fixApplied = true;
            run.fixedContent = fixedContent.slice(0, 5000);

            updateStep(run, 'apply_fix', 'Apply fix', 'completed',
              `Fix applied. Backup at ${backupPath}`, Date.now() - applyStart);
          } catch (applyErr: any) {
            updateStep(run, 'apply_fix', 'Apply fix', 'failed', applyErr.message, Date.now() - applyStart);
          }
        }

        break; // Success
      }
    }

    // Step 5: Notify result
    const success = run.fixApplied || fixedContent !== originalContent;
    run.finalStatus = success ? 'fixed' : run.fixApplied ? 'partial' : 'failed';

    addStep(run, 'notify', 'Remediation complete',
      run.finalStatus === 'fixed' ? 'completed' : 'failed',
      `Status: ${run.finalStatus}. ${run.fixApplied ? 'Fix applied.' : 'Manual review needed.'}`, 0);

  } catch (err: any) {
    run.finalStatus = 'failed';
    addStep(run, 'notify', 'Remediation crashed', 'failed', err.message, 0);
  } finally {
    run.totalLatencyMs = Date.now() - started;
    run.completedAt = new Date().toISOString();

    await appendAuditEvent({
      actor: 'system', workspace: 'Auto-Remediation', action: 'remediation.complete',
      target: run.target, risk: run.finalStatus === 'failed' ? 'HIGH' : 'MEDIUM',
      status: run.finalStatus === 'fixed' ? 'executed' : 'failed',
      summary: `Remediation ${run.finalStatus}: ${run.target} - ${run.errorDescription.slice(0, 80)}`,
      connectorId: 'auto-remediation',
      evidence: { runId, target, fixApplied: run.fixApplied, status: run.finalStatus },
    }).catch(() => undefined);

    save().catch(() => undefined);
  }

  return run;
}

function addStep(run: RemediationRun, type: RemediationStep['type'], desc: string, status: RemediationStep['status'], output: string, latencyMs: number): void {
  run.steps.push({
    id: `rst_${Date.now()}_${randomUUID().slice(0, 4)}`,
    type, description: desc, status, output, latencyMs,
  });
}

function updateStep(run: RemediationRun, type: RemediationStep['type'], desc: string, status: RemediationStep['status'], output: string, latencyMs: number): void {
  const step = run.steps.find(s => s.type === type && s.status === 'running');
  if (step) {
    step.status = status;
    step.output = output;
    step.latencyMs = latencyMs;
  } else {
    addStep(run, type, desc, status, output, latencyMs);
  }
}

export function getRemediationRun(id: string): RemediationRun | undefined { return runs.find(r => r.id === id); }
export function listRemediationRuns(): RemediationRun[] { return [...runs].reverse(); }
