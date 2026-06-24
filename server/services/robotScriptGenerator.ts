/**
 * robotScriptGenerator.ts
 * ============================================================
 * Robot Script Generator — AI dịch ngôn ngữ tự nhiên
 * thành RPA scripts tự động.
 * 
 * "Backup folder X every day at 9AM" → RPA script với cron
 * "When file Y changes, run lint and notify me" → watcher rule
 */
import { dispatchTextThroughFabric } from './aiFabric';
import { createScript, addAction, type RPAAction } from './rpaEngine';
import { createWatchRule } from './smartFileWatcher';
import { createSchedule } from './scheduledReportGenerator';
import { appendAuditEvent } from './auditLog';

// ─── Types ──────────────────────────────────────────────────────────
export interface GeneratedRobot {
  id: string;
  description: string;
  type: 'rpa_script' | 'watcher_rule' | 'report_schedule' | 'mixed';
  rpaScriptId?: string;
  watcherRuleId?: string;
  reportScheduleId?: string;
  generatedAt: string;
  generationMs: number;
  explanation: string;
}

export interface RobotGenerationRequest {
  description: string;
  maxActions?: number;
  autoCreate?: boolean;
}

// ─── Core API ───────────────────────────────────────────────────────

export async function generateRobot(input: RobotGenerationRequest): Promise<GeneratedRobot> {
  const started = Date.now();
  const genId = `rbot_${Date.now()}`;

  const prompt = `Bạn là một RPA Robot Designer. Dịch yêu cầu sau thành robot script:

REQUEST: ${input.description}

DECIDE LOẠI ROBOT:
- rpa_script: tự động hóa file, command, HTTP
- watcher_rule: theo dõi file system
- report_schedule: sinh báo cáo định kỳ
- mixed: kết hợp nhiều loại

Trả về format:
TYPE: [rpa_script|watcher_rule|report_schedule|mixed]
EXPLANATION: [giải thích ngắn gọn robot sẽ làm gì]

Nếu TYPE=rpa_script:
SCRIPT_NAME: [tên script]
ACTION: [type] | [description] | [params: key=value,key=value] | continueOnError:true/false

Nếu TYPE=watcher_rule:
WATCHER_NAME: [tên rule]
WATCH_PATH: [đường dẫn]
PATTERNS: [pattern1,pattern2]
EVENTS: [created,modified,deleted]
ACTION: [notify|dispatch_ai|run_agent_loop] | [description]

Nếu TYPE=report_schedule:
REPORT_NAME: [tên báo cáo]
REPORT_TYPE: [daily|weekly|monthly]
CRON: [cron expression]`;

  let result: { type: string; explanation: string; details: any } = { type: 'rpa_script', explanation: '', details: {} };

  try {
    const aiResult = await dispatchTextThroughFabric(prompt, undefined, { domain: 'general', localFallback: true });
    if (aiResult.winner?.contentPreview) {
      const content = aiResult.winner.contentPreview;
      result.type = extractField(content, 'TYPE') || 'rpa_script';
      result.explanation = extractField(content, 'EXPLANATION') || input.description;
      result.details = { content };

      // Extract script details
      if (result.type === 'rpa_script') {
        result.details.scriptName = extractField(content, 'SCRIPT_NAME') || 'Generated Script';
        result.details.actions = content.split('\n').filter(l => l.toUpperCase().startsWith('ACTION:'));
      } else if (result.type === 'watcher_rule') {
        result.details.watcherName = extractField(content, 'WATCHER_NAME') || 'Generated Watcher';
        result.details.watchPath = extractField(content, 'WATCH_PATH') || process.cwd();
      } else if (result.type === 'report_schedule') {
        result.details.reportName = extractField(content, 'REPORT_NAME') || 'Generated Report';
        result.details.reportType = extractField(content, 'REPORT_TYPE') || 'daily';
        result.details.cron = extractField(content, 'CRON') || '0 9 * * *';
      }
    }
  } catch { /* fallback */ }

  const robot: GeneratedRobot = {
    id: genId,
    description: input.description,
    type: result.type as any,
    explanation: result.explanation || `Generated ${result.type} for: ${input.description.slice(0, 80)}`,
    generatedAt: new Date().toISOString(),
    generationMs: Date.now() - started,
  };

  // Auto-create if requested
  if (input.autoCreate !== false) {
    try {
      switch (robot.type) {
        case 'rpa_script': {
          const script = createScript({
            name: result.details.scriptName || `Robot: ${input.description.slice(0, 60)}`,
            description: input.description,
            tags: ['ai-generated'],
          });

          // Parse and add actions
          const actionLines: string[] = result.details.actions || [];
          if (actionLines.length === 0) {
            // Default: add a shell echo action
            addAction(script.id, {
              type: 'notify', description: input.description.slice(0, 100),
              params: { message: input.description },
              retries: 0, timeoutMs: 5000, continueOnError: true,
            });
          } else {
            for (const line of actionLines) {
              const parts = line.replace(/^ACTION:\s*/i, '').split('|').map(s => s.trim());
              if (parts.length >= 2) {
                const actionType = (parts[0] as any) || 'notify';
                const desc = parts[1] || 'Action';
                const params: Record<string, string> = {};
                if (parts[2]) {
                  parts[2].split(',').forEach((kv: string) => {
                    const [k, ...v] = kv.split('=');
                    if (k) params[k.trim()] = v.join('=').trim();
                  });
                }
                const continueOnError = parts[3]?.includes('true') ?? true;
                addAction(script.id, {
                  type: actionType, description: desc.slice(0, 100),
                  params, retries: 1, timeoutMs: 30000, continueOnError,
                });
              }
            }
          }

          robot.rpaScriptId = script.id;
          break;
        }
        case 'watcher_rule': {
          const rule = createWatchRule({
            name: result.details.watcherName || `Watch: ${input.description.slice(0, 50)}`,
            watchPath: result.details.watchPath || process.cwd(),
            patterns: (result.details.patterns || '').split(',').map((s: string) => s.trim()).filter(Boolean),
            events: ['modified', 'created'],
            actions: [{ id: 'notify', type: 'notify', goalTemplate: `File changed: ${input.description}`, priority: 1 }],
            tags: ['ai-generated'],
          });
          robot.watcherRuleId = rule.id;
          break;
        }
        case 'report_schedule': {
          const schedule = createSchedule({
            name: result.details.reportName || `Report: ${input.description.slice(0, 50)}`,
            type: result.details.reportType || 'daily',
            cronExpression: result.details.cron || '0 9 * * *',
          });
          robot.reportScheduleId = schedule.id;
          break;
        }
      }
    } catch (err: any) {
      robot.explanation += ` (Auto-create failed: ${err.message})`;
    }
  }

  await appendAuditEvent({
    actor: 'system', workspace: 'Robot Generator', action: 'robot.generate',
    target: input.description.slice(0, 80), risk: 'LOW', status: 'executed',
    summary: `Generated ${robot.type}: ${robot.explanation.slice(0, 80)}`,
    connectorId: 'robot-generator',
    evidence: { genId, type: robot.type },
  }).catch(() => undefined);

  return robot;
}

function extractField(content: string, field: string): string | null {
  const regex = new RegExp(`^${field}:\\s*(.+)$`, 'im');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}
