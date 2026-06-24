import {
  advanceAgentRun,
  approveAgentRunStep,
  createAgentRun,
  getAgentRun,
  listAgentRuns,
  rejectAgentRunStep,
  setAgentRuntimeEmergencyStop,
  stopAgentRun,
} from './agentRuntime';
import { getRobotCapability, listRobotCapabilities } from './robotCapabilityRegistry';
import { getAutomationSchedulerStatus, runAutomationSchedulerTick, startAutomationScheduler, stopAutomationScheduler } from './automationSchedulerLoop';

type TelegramSend = (chatId: number, text: string, options?: Record<string, unknown>) => Promise<void>;

type ParsedMissionCommand = {
  group: 'mission' | 'ai' | 'robot' | 'automation';
  action: string;
  args: string[];
  rawArgs: string;
};

const APPROVAL_PHRASE = 'APPROVE AGENT STEP';

function parseCommand(text: string): ParsedMissionCommand | null {
  const trimmed = text.trim();
  const allowed = ['/mission', '/ai', '/robot', '/automation'];
  const firstToken = trimmed.split(/\s+/)[0]?.toLowerCase() || '';
  if (!allowed.some((prefix) => firstToken.startsWith(prefix))) return null;
  const [first, action = '', ...args] = trimmed.split(/\s+/);
  const lower = first.toLowerCase();
  const group = lower.startsWith('/mission') ? 'mission'
    : lower.startsWith('/ai') ? 'ai'
      : lower.startsWith('/robot') ? 'robot'
        : 'automation';
  const rawArgs = trimmed.split(/\s+/).slice(2).join(' ');
  return { group, action: action.toLowerCase(), args, rawArgs };
}

function stripQuotes(value: string) {
  return value.trim().replace(/^[ '"]|[ '"]$/g, '').trim();
}

function latestRunIdFromArgs(args: string[]) {
  return args[0] && args[0] !== 'latest' ? args[0] : '';
}

function runSummary(run: Awaited<ReturnType<typeof getAgentRun>> | undefined | null) {
  if (!run) return 'Run not found.';
  const steps = run.steps || [];
  const waiting = steps.filter((step) => String(step.status).includes('waiting'));
  const artifacts = run.artifacts || [];
  return [
    `🧭 *Mission:* ${run.id}`,
    `Status: \`${run.status}\``,
    `Planner: \`${run.planner || 'unknown'}\``,
    `Goal: ${run.goal}`,
    `Steps: ${steps.length}`,
    `Waiting approvals: ${waiting.length}`,
    `Artifacts: ${artifacts.length}`,
    run.plannerSummary ? `Summary: ${run.plannerSummary}` : '',
  ].filter(Boolean).join('\n');
}

function schedulerSummary() {
  const status = getAutomationSchedulerStatus();
  return [
    '⏱️ *Automation Scheduler*',
    `Status: \`${status.running ? 'running' : 'stopped'}\``,
    `Interval: \`${status.intervalMs || 0}ms\``,
    `Ticks: \`${status.tickCount || 0}\``,
    `Last tick: ${status.lastTickAt || 'never'}`,
    `Daily key: ${status.lastDailyKey || 'none'}`,
    `Weekly key: ${status.lastWeeklyKey || 'none'}`,
  ].join('\n');
}

function robotCapabilityLines(includeBlocked = false) {
  const capabilities = listRobotCapabilities({ includeBlocked }).slice(0, 12);
  if (!capabilities.length) return 'No robot capabilities registered.';
  return capabilities.map((capability) => [
    `• \`${capability.id}\``,
    `  ${capability.name} — ${capability.mode}/${capability.risk}`,
    `  Command: \`${capability.command}\` Approval: \`${capability.requiresApproval ? 'required' : 'not required'}\``,
  ].join('\n')).join('\n\n');
}

async function getLatestRun() {
  const result = await listAgentRuns(1);
  return result.runs[0] || null;
}

export async function tryHandleTelegramMissionCommand(chatId: number, text: string, send: TelegramSend): Promise<boolean> {
  const parsed = parseCommand(text);
  if (!parsed) return false;

  if (parsed.group === 'ai' && parsed.action === 'emergency-stop') {
    const active = parsed.args[0] !== 'off';
    await setAgentRuntimeEmergencyStop(active, `Founder ${active ? 'enabled' : 'released'} AI emergency stop from Telegram.`);
    await send(chatId, active ? '🛑 AI Workforce emergency stop enabled.' : '✅ AI Workforce emergency stop released.');
    return true;
  }

  if (parsed.group === 'robot') {
    switch (parsed.action) {
      case 'capabilities': {
        const includeBlocked = parsed.args.includes('all');
        await send(chatId, `🤖 *Robot Capabilities*\n\n${robotCapabilityLines(includeBlocked)}`, { parse_mode: 'Markdown' });
        return true;
      }
      case 'capability': {
        const id = parsed.args[0];
        if (!id) {
          await send(chatId, '❓ Usage: `/robot capability <capabilityId>`', { parse_mode: 'Markdown' });
          return true;
        }
        const capability = getRobotCapability(id);
        if (!capability) {
          await send(chatId, `Robot capability not found: \`${id}\``, { parse_mode: 'Markdown' });
          return true;
        }
        await send(chatId, [
          `🤖 *${capability.name}*`,
          `ID: \`${capability.id}\``,
          `Mode: \`${capability.mode}\` Risk: \`${capability.risk}\``,
          `Command: \`${capability.command}\``,
          `Approval: \`${capability.requiresApproval ? 'required' : 'not required'}\``,
          capability.description,
          capability.safetyNotes.length ? `Safety: ${capability.safetyNotes.join(' • ')}` : '',
        ].filter(Boolean).join('\n'), { parse_mode: 'Markdown' });
        return true;
      }
      default:
        await send(chatId, [
          '❓ Unknown robot command.',
          '',
          '*Available:*',
          '`/robot capabilities`',
          '`/robot capabilities all`',
          '`/robot capability <capabilityId>`',
        ].join('\n'), { parse_mode: 'Markdown' });
        return true;
    }
  }

  if (parsed.group === 'automation') {
    switch (parsed.action) {
      case 'scheduler': {
        const subAction = parsed.args[0] || 'status';
        if (subAction === 'status') {
          await send(chatId, schedulerSummary(), { parse_mode: 'Markdown' });
          return true;
        }
        if (subAction === 'tick') {
          const result = await runAutomationSchedulerTick();
          await send(chatId, `⚡ Scheduler tick completed. Fired: \`${result.fired.join(', ') || 'none'}\`\n\n${schedulerSummary()}`, { parse_mode: 'Markdown' });
          return true;
        }
        if (subAction === 'start') {
          startAutomationScheduler({ intervalMs: 60 * 60 * 1000 });
          await send(chatId, `▶️ Scheduler started.\n\n${schedulerSummary()}`, { parse_mode: 'Markdown' });
          return true;
        }
        if (subAction === 'stop') {
          stopAutomationScheduler();
          await send(chatId, `⏹️ Scheduler stopped.\n\n${schedulerSummary()}`, { parse_mode: 'Markdown' });
          return true;
        }
        await send(chatId, '❓ Usage: `/automation scheduler status|tick|start|stop`', { parse_mode: 'Markdown' });
        return true;
      }
      default:
        await send(chatId, [
          '❓ Unknown automation command.',
          '',
          '*Available:*',
          '`/automation scheduler status`',
          '`/automation scheduler tick`',
          '`/automation scheduler start`',
          '`/automation scheduler stop`',
        ].join('\n'), { parse_mode: 'Markdown' });
        return true;
    }
  }

  if (parsed.group !== 'mission') return false;

  switch (parsed.action) {
    case 'create': {
      const goal = stripQuotes(parsed.rawArgs);
      if (!goal) {
        await send(chatId, '❓ Usage: `/mission create "your goal"`', { parse_mode: 'Markdown' });
        return true;
      }
      const run = await createAgentRun({ goal, requestedBy: 'telegram', plannerMode: 'auto', maxSteps: 5 });
      await send(chatId, `✅ Created mission \`${run.id}\`\nStatus: \`${run.status}\`\nGoal: ${run.goal}`, { parse_mode: 'Markdown' });
      return true;
    }

    case 'status': {
      const explicitRunId = latestRunIdFromArgs(parsed.args);
      const run = explicitRunId ? await getAgentRun(explicitRunId) : await getLatestRun();
      await send(chatId, runSummary(run), { parse_mode: 'Markdown' });
      return true;
    }

    case 'advance': {
      const runId = latestRunIdFromArgs(parsed.args) || (await getLatestRun())?.id;
      if (!runId) {
        await send(chatId, 'No mission found to advance.');
        return true;
      }
      const run = await advanceAgentRun(runId);
      await send(chatId, `▶️ Advanced mission \`${run.id}\`\nStatus: \`${run.status}\``, { parse_mode: 'Markdown' });
      return true;
    }

    case 'approvals': {
      const result = await listAgentRuns(20);
      const waiting = result.runs.flatMap((run) => (run.steps || [])
        .filter((step) => String(step.status).includes('waiting') || step.requiresApproval)
        .map((step) => ({ run, step })));
      if (!waiting.length) {
        await send(chatId, '✅ No approval is waiting right now.');
        return true;
      }
      const lines = waiting.slice(0, 10).map(({ run, step }) => [
        `• Run \`${run.id}\` step \`${step.id}\``,
        `  Tool: \`${step.toolId || 'tool'}\` Risk: \`${step.risk || 'unknown'}\``,
        `  Fingerprint: \`${step.approvalFingerprint || 'missing'}\``,
      ].join('\n'));
      await send(chatId, `🛂 *Waiting approvals*\n\n${lines.join('\n\n')}`, { parse_mode: 'Markdown' });
      return true;
    }

    case 'approve': {
      const [runId, stepId, fingerprint] = parsed.args;
      if (!runId || !stepId || !fingerprint) {
        await send(chatId, '❓ Usage: `/mission approve <runId> <stepId> <fingerprint>`', { parse_mode: 'Markdown' });
        return true;
      }
      const run = await approveAgentRunStep(runId, { stepId, fingerprint, phrase: APPROVAL_PHRASE });
      await send(chatId, `✅ Approved step \`${stepId}\` for mission \`${run.id}\`.\nStatus: \`${run.status}\``, { parse_mode: 'Markdown' });
      return true;
    }

    case 'reject': {
      const [runId, stepId, fingerprint, ...reasonParts] = parsed.args;
      if (!runId || !stepId) {
        await send(chatId, '❓ Usage: `/mission reject <runId> <stepId> [fingerprint] [reason]`', { parse_mode: 'Markdown' });
        return true;
      }
      const reason = reasonParts.join(' ').trim() || 'Rejected from Telegram.';
      const run = await rejectAgentRunStep(runId, { stepId, fingerprint, reason });
      await send(chatId, `🚫 Rejected step \`${stepId}\` for mission \`${run.id}\`.\nStatus: \`${run.status}\``, { parse_mode: 'Markdown' });
      return true;
    }

    case 'stop': {
      const runId = latestRunIdFromArgs(parsed.args) || (await getLatestRun())?.id;
      if (!runId) {
        await send(chatId, 'No mission found to stop.');
        return true;
      }
      const run = await stopAgentRun(runId, 'Founder stopped mission from Telegram.');
      await send(chatId, `🛑 Stopped mission \`${run.id}\`.\nStatus: \`${run.status}\``, { parse_mode: 'Markdown' });
      return true;
    }

    case 'artifact': {
      const explicitRunId = latestRunIdFromArgs(parsed.args);
      const run = explicitRunId ? await getAgentRun(explicitRunId) : await getLatestRun();
      const artifacts = run?.artifacts || [];
      if (!run || !artifacts.length) {
        await send(chatId, 'No artifact found for that mission.');
        return true;
      }
      const artifact = artifacts[artifacts.length - 1];
      await send(chatId, `📦 *Artifact* \`${artifact.id}\`\nType: \`${artifact.type}\`\n${artifact.summary}`, { parse_mode: 'Markdown' });
      return true;
    }

    default:
      await send(chatId, [
        '❓ Unknown mission command.',
        '',
        '*Available:*',
        '`/mission create "goal"`',
        '`/mission status latest`',
        '`/mission advance latest`',
        '`/mission approvals`',
        '`/mission approve <runId> <stepId> <fingerprint>`',
        '`/mission reject <runId> <stepId> [fingerprint] [reason]`',
        '`/mission stop <runId>`',
        '`/mission artifact latest`',
        '`/robot capabilities`',
        '`/automation scheduler status`',
        '`/ai emergency-stop on|off`',
      ].join('\n'), { parse_mode: 'Markdown' });
      return true;
  }
}
