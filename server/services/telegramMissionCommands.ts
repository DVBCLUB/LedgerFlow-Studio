import {
  advanceAgentRun,
  approveAgentRunStep,
  createAgentRun,
  getAgentRun,
  listAgentRuns,
  rejectAgentRunStep,
  setAgentRuntimeEmergencyStop,
  stopAgentRun,
} from './agentRuntime.ts';
import { getRobotCapability, listRobotCapabilities } from './robotCapabilityRegistry.ts';
import { getAutomationSchedulerStatus, runAutomationSchedulerTick, startAutomationScheduler, stopAutomationScheduler } from './automationSchedulerLoop.ts';
import { listAgentLoopJobs, getAgentLoopJobStatus, getAgentLoopJobStats } from './agentLoopJobRunner.ts';
import { retryJob, purgeJob } from './backgroundJobQueue.ts';
import { getCircuitBreakerStatus } from './aiRouter.ts';
import { getPerformanceDashboard } from './agentPerformanceLedger.ts';
import { triggerAutoRepairSession, listAutoRepairSessions } from './agentAutoRepairEngine.ts';
import { assessActionRisk } from './dynamicRiskMatrix.ts';
import { conductMultiAgentDebate } from './agentConsensusEngine.ts';
import { runBusinessDigitalTwinSimulation } from './businessDigitalTwinSimulator.ts';
import { executeSoftwareRobotWorkflow, listSoftwareRobotWorkflows } from './softwareRobotOrchestrator.ts';
import { scanAndCleanseContextPrompt } from './zeroTrustPoisonShield.ts';
import { getAIWorkforceCockpitOverview } from './aiWorkforceCockpit.ts';
import { publishAutomatedReleaseHandoff, listReleaseHandoffPackages } from './automatedHandoffPublisher.ts';
import { dispatchAgentSwarm } from './swarmDynamicOrchestrator.ts';
import { runSyntheticCustomerFeedbackLoop } from './syntheticCustomerFeedbackLoop.ts';
import { getEnterpriseGovernanceOverview, allocateResourceBudget } from './enterpriseSelfGovernance.ts';
import { listAIStaffWorkstations } from './aiStaffWorkstation.ts';
import { getOperationalTelemetryStream } from './operationalTelemetryStream.ts';
import { publishDistributionCampaign } from './autonomousDistributionHub.ts';
import { getRevenueOptimizationRecommendations } from './revenueGrowthOptimizer.ts';

type TelegramSend = (chatId: number, text: string, options?: Record<string, unknown>) => Promise<void>;

type ParsedMissionCommand = {
  group: 'mission' | 'ai' | 'robot' | 'automation' | 'job';
  action: string;
  args: string[];
  rawArgs: string;
};

const APPROVAL_PHRASE = 'APPROVE AGENT STEP';

function parseCommand(text: string): ParsedMissionCommand | null {
  const trimmed = text.trim();
  const allowed = ['/mission', '/ai', '/robot', '/automation', '/job'];
  const firstToken = trimmed.split(/\s+/)[0]?.toLowerCase() || '';
  if (!allowed.some((prefix) => firstToken.startsWith(prefix))) return null;
  const [first, action = '', ...args] = trimmed.split(/\s+/);
  const lower = first.toLowerCase();
  const group = lower.startsWith('/mission') ? 'mission'
    : lower.startsWith('/ai') ? 'ai'
      : lower.startsWith('/robot') ? 'robot'
        : lower.startsWith('/job') ? 'job'
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

  if (parsed.group === 'ai' && parsed.action === 'circuit') {
    const status = getCircuitBreakerStatus();
    const entries = Object.entries(status);
    if (entries.length === 0) {
      await send(chatId, '✅ No circuit breakers active. All providers healthy.');
      return true;
    }
    const lines = entries.map(([key, cb]) => {
      const icon = cb.state === 'open' ? '🔴' : cb.state === 'half-open' ? '🟡' : '🟢';
      const cooldownSec = cb.openedAt && cb.state === 'open'
        ? Math.max(0, Math.ceil((60_000 - (Date.now() - cb.openedAt)) / 1000))
        : 0;
      return `${icon} \`${key}\` — ${cb.state} (${cb.failures} failures${cooldownSec > 0 ? `, cooldown ${cooldownSec}s` : ''})`;
    });
    await send(chatId, `⚡ *AI Circuit Breakers*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'repair') {
    const errorSnippet = stripQuotes(parsed.rawArgs);
    if (!errorSnippet) {
      const sessions = listAutoRepairSessions(5);
      if (!sessions.length) {
        await send(chatId, '❓ Usage: `/ai repair "error log or stack trace snippet"`', { parse_mode: 'Markdown' });
        return true;
      }
      const lines = sessions.map((s) => `• \`${s.id}\` [${s.status}] Goal: ${s.goal.slice(0, 50)}`);
      await send(chatId, `🛠️ *Auto-Repair Sessions*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
      return true;
    }

    const session = await triggerAutoRepairSession({
      errorLog: errorSnippet,
      source: 'telegram',
      requestedBy: 'founder_telegram',
    });

    await send(chatId, [
      `🛠️ *Auto-Repair Initiated* \`${session.id}\``,
      `Status: \`${session.status}\``,
      session.diagnosis ? `Root cause: ${session.diagnosis.rootCause}` : 'Diagnosing with AI...',
      session.backgroundJobId ? `Job ID: \`${session.backgroundJobId.slice(-10)}\`` : '',
      `Risk level: \`${session.riskAssessment?.effectiveRisk || 'MEDIUM'}\``,
    ].filter(Boolean).join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'risk') {
    const actionId = parsed.args[0] || 'write_file';
    const env = (parsed.args[1] as any) || 'local';
    const assessment = assessActionRisk({ actionId, environment: env });

    const riskIcon = assessment.effectiveRisk === 'CRITICAL' ? '🔴' : assessment.effectiveRisk === 'HIGH' ? '🟠' : assessment.effectiveRisk === 'MEDIUM' ? '🟡' : '🟢';
    await send(chatId, [
      `${riskIcon} *Dynamic Risk Assessment*`,
      `Action: \`${assessment.actionId}\` (${assessment.category})`,
      `Base risk: \`${assessment.baseRisk}\` ──► Effective: \`${assessment.effectiveRisk}\``,
      `Decision: \`${assessment.decision}\``,
      `Agent trust bonus: \`${assessment.agentTrustBonus ? 'YES' : 'NO'}\``,
      '',
      '*Reasons:*',
      ...assessment.reasons.map((r) => `• ${r}`),
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'debate') {
    const topic = stripQuotes(parsed.rawArgs);
    if (!topic) {
      await send(chatId, '❓ Usage: `/ai debate "proposal or decision topic"`', { parse_mode: 'Markdown' });
      return true;
    }

    const session = await conductMultiAgentDebate({ topic, domain: 'general' });
    const decisionIcon = session.finalDecision === 'approved' ? '✅' : '⏸️';

    await send(chatId, [
      `${decisionIcon} *Multi-Agent Consensus Debate* \`${session.id}\``,
      `Topic: ${session.topic}`,
      `Consensus Score: \`${(session.consensusScore * 100).toFixed(0)}%\``,
      `Final decision: \`${session.finalDecision}\``,
      '',
      '*Participants:*',
      ...(session.rounds[0]?.participants || []).map(
        (p) => `• ${p.agentRole.toUpperCase()}: ${p.vote.toUpperCase()} (${(p.confidence * 100).toFixed(0)}%) — ${p.reasoning}`
      ),
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'swarm') {
    const goal = stripQuotes(parsed.rawArgs) || 'Execute continuous AI Workforce optimization';
    const swarm = await dispatchAgentSwarm({
      goal,
      topology: 'hierarchical',
      requestedBy: 'founder_telegram',
    });

    await send(chatId, [
      `🐝 *Agent Swarm Dispatched* \`${swarm.id}\``,
      `Topology: \`${swarm.topology}\` | Status: \`${swarm.status}\``,
      `Goal: "${swarm.goal}"`,
      `Nodes: ${swarm.nodes.length} completed`,
      `Summary: ${swarm.summary}`,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'automation' && parsed.action === 'feedback') {
    const report = await runSyntheticCustomerFeedbackLoop({ sampleSize: 500 });
    await send(chatId, [
      `📊 *Synthetic Customer Feedback Report* \`${report.id}\``,
      `Target Module: \`${report.productModule}\` (Sample: ${report.sampleSize} ICPs)`,
      `Synthetic NPS: \`+${report.syntheticNPS}\``,
      `Avg Usability Score: \`${report.avgUsabilityScore} / 10\``,
      `Churn Risk: \`${report.churnRiskPercent}%\``,
      `Auto-Backlog Tasks Generated: ${report.autoBacklogTasks.length}`,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'staff') {
    const workstations = listAIStaffWorkstations();
    const staffLines = workstations.map(
      (w) => `${w.avatarIcon} *${w.title}* (\`${w.role}\`): ${w.successRatePercent}% success | ${w.utilizationPercent}% utilization`
    );

    await send(chatId, [
      `👥 *AI Workforce Staff Workstations* (7 Roles)`,
      ...staffLines,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'telemetry') {
    const telemetry = getOperationalTelemetryStream();
    await send(chatId, [
      `📡 *Real-Time OS Operational Telemetry*`,
      `Uptime: \`${telemetry.systemUptimeSeconds}s\``,
      `Memory RSS: \`${telemetry.memoryUsageMB.rss} MB\` | Heap: \`${telemetry.memoryUsageMB.heapUsed} MB / ${telemetry.memoryUsageMB.heapTotal} MB\``,
      `Background Jobs: \`${telemetry.backgroundLoopJobs.completed} completed, ${telemetry.backgroundLoopJobs.queued} queued\``,
      `Recent Stream Events: \`${telemetry.recentEventsCount}\``,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'governance') {
    const gov = getEnterpriseGovernanceOverview();
    const roleLines = gov.roleKPIs.map((r) => `• \`${r.role.toUpperCase()}\`: ${r.successRatePercent}% success [${r.kpiStatus}]`);

    await send(chatId, [
      `🏛️ *Enterprise Self-Governance Overview*`,
      `Strategic Health: \`${gov.strategicHealthRating}\``,
      `AI ROI Ratio: \`${gov.aiROI.roiRatio}x\` (Saved ~${gov.aiROI.estimatedTimeSavedHours}h / $${gov.aiROI.estimatedValueGeneratedUSD.toLocaleString()})`,
      '',
      '*Role OKRs & KPIs:*',
      ...roleLines,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'mission' && parsed.action === 'distribute') {
    const version = parsed.args[0] || 'v1.60.0';
    const report = await publishDistributionCampaign({
      releaseVersion: version,
      campaignTitle: `Telegram Autonomous Release ${version}`,
      requestedBy: 'founder_telegram',
    });

    await send(chatId, [
      `📢 *Multi-Channel Campaign Dispatched* \`${report.id}\``,
      `Release Version: \`${report.releaseVersion}\``,
      `Channels: ${report.channels.map((c) => c.channel).join(', ')}`,
      `Engaged Leads: \`~${report.totalLeadsEngagedCount}\``,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'mission' && parsed.action === 'revenue') {
    const rev = getRevenueOptimizationRecommendations();
    const recLines = rev.growthRecommendations.map(
      (r) => `• *${r.title}*: +$${r.estimatedArrIncreaseUSD.toLocaleString()}/yr`
    );

    await send(chatId, [
      `📈 *AI Revenue & Monetization Growth Optimizer*`,
      `Projected ARR: \`$${rev.projectedAnnualRecurrentRevenueUSD.toLocaleString()}\` (MRR: \`$${rev.estimatedMonthlyRecurrentRevenueUSD.toLocaleString()}\`)`,
      '',
      '*Growth Recommendations:*',
      ...recLines,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'mission' && parsed.action === 'budget') {
    const budgetUSD = Number(parsed.args[0]) || 1000;
    const proposal = allocateResourceBudget({ totalMonthlyBudgetUSD: budgetUSD });
    const allocLines = proposal.allocations.map((a) => `• *${a.productLine}*: ${a.sharePercent}% ($${a.allocatedUSD})`);

    await send(chatId, [
      `💰 *Strategic Resource Budget Allocation* ($${proposal.totalMonthlyBudgetUSD})`,
      ...allocLines,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'ai' && parsed.action === 'cockpit') {
    const overview = getAIWorkforceCockpitOverview();
    const statusIcon = overview.healthStatus === 'OPTIMAL' ? '🟢' : overview.healthStatus === 'DEGRADED' ? '🟡' : '🔴';

    const alertsText = overview.executiveAlerts.length
      ? `\n*Executive Alerts:*\n${overview.executiveAlerts.map((a) => `• ${a}`).join('\n')}`
      : '\n✅ No executive alerts.';

    await send(chatId, [
      `${statusIcon} *Executive AI Workforce Cockpit*`,
      `Autonomy Score: \`${overview.autonomyScore.score}%\` (${overview.autonomyScore.rating.replace(/_/g, ' ')})`,
      `Health Status: \`${overview.healthStatus}\``,
      '',
      '*Telemetry Overview:*',
      `• Total Agent Tasks: ${overview.telemetry.totalAgentRuns} (Success: ${(overview.telemetry.overallSuccessRate * 100).toFixed(0)}%)`,
      `• Background Jobs: ${overview.telemetry.completedLoopJobs} completed, ${overview.telemetry.activeLoopJobs} active`,
      `• Auto-Repairs: ${overview.telemetry.autoRepairSessionsCompleted} completed`,
      `• Circuit Breakers Open: ${overview.telemetry.openCircuitBreakers}`,
      `• Simulated Runway: ${overview.telemetry.simulatedMedianRunwayDays} days`,
      alertsText,
    ].join('\n'), { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'mission' && parsed.action === 'release') {
    const subArg = parsed.args[0];
    if (subArg === 'publish' || subArg === 'create') {
      const version = parsed.args[1];
      const pkg = await publishAutomatedReleaseHandoff({
        version,
        title: 'Telegram Autonomous Release Package',
        author: 'founder_telegram',
      });
      await send(chatId, [
        `🚀 *Release Package Published* \`${pkg.version}\``,
        `Title: ${pkg.title}`,
        `Features: ${pkg.features.length}`,
        `Checksum: \`${pkg.checksum.slice(0, 16)}...\``,
        pkg.docFilePath ? `Docs: \`${pkg.docFilePath}\`` : '',
      ].filter(Boolean).join('\n'), { parse_mode: 'Markdown' });
      return true;
    }

    const packages = listReleaseHandoffPackages(5);
    if (!packages.length) {
      await send(chatId, '📦 No release packages published yet.');
      return true;
    }
    const lines = packages.map((p) => `• \`${p.version}\` — ${p.title} (Checksum: \`${p.checksum.slice(0, 8)}\`)`);
    await send(chatId, `📦 *Published Release Packages*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
    return true;
  }

  if (parsed.group === 'robot') {
    switch (parsed.action) {
      case 'capabilities': {
        const includeBlocked = parsed.args.includes('all');
        await send(chatId, `🤖 *Robot Capabilities*\n\n${robotCapabilityLines(includeBlocked)}`, { parse_mode: 'Markdown' });
        return true;
      }
      case 'run': {
        const workflowName = stripQuotes(parsed.rawArgs) || 'Telegram Automated Software Workflow';
        const workflow = await executeSoftwareRobotWorkflow({
          name: workflowName,
          requestedBy: 'founder_telegram',
          actions: [
            {
              id: 'act_1',
              type: 'office_file_process',
              name: 'Scan & Process Office Invoices',
              payload: { path: 'runtime/invoices' },
            },
            {
              id: 'act_2',
              type: 'browser_scrape',
              name: 'Verify Web SaaS Reconciliation',
              payload: { target: 'saas_accounting' },
            },
          ],
        });

        await send(chatId, [
          `🤖 *Software Robot Workflow Executed* \`${workflow.id}\``,
          `Status: \`${workflow.status}\``,
          `Actions: ${workflow.actions.length} | Checkpoints: ${workflow.checkpoints.length}`,
          `Summary: ${workflow.summary || 'Completed.'}`,
        ].join('\n'), { parse_mode: 'Markdown' });
        return true;
      }
      case 'status': {
        const workflows = listSoftwareRobotWorkflows(5);
        if (!workflows.length) {
          await send(chatId, '🤖 No software robot workflows executed yet.');
          return true;
        }
        const lines = workflows.map((w) => `• \`${w.id.slice(-10)}\` [${w.status}] ${w.name}`);
        await send(chatId, `🤖 *Software Robot Workflows*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' });
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
          '`/robot run "workflow name"` — run software robot workflow',
          '`/robot status` — list software robot workflow executions',
          '`/robot capabilities` — list robot capabilities',
          '`/robot capability <id>` — capability details',
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

  if (parsed.group === 'job') {
    switch (parsed.action) {
      case 'list': {
        const limit = parseInt(parsed.args[0] || '10', 10) || 10;
        const jobs = listAgentLoopJobs({ limit });
        const stats = getAgentLoopJobStats();
        if (!jobs.length) {
          await send(chatId, `📋 No agent loop jobs found.\n\nStats: queued=${stats.queued} running=${stats.running} completed=${stats.completed} failed=${stats.failed}`);
          return true;
        }
        const lines = jobs.map((j) => [
          `• \`${j.jobId.slice(-10)}\` [${j.status}]`,
          `  Goal: ${j.goal.slice(0, 60)}`,
          `  By: ${j.requestedBy} at ${j.enqueuedAt.slice(0, 16)}`,
        ].join('\n'));
        await send(chatId, [
          `📋 *Agent Loop Jobs* (showing ${jobs.length})`,
          `Stats: queued=${stats.queued} 🔄 running=${stats.running} ✅ completed=${stats.completed} ❌ failed=${stats.failed}`,
          '',
          ...lines,
        ].join('\n'), { parse_mode: 'Markdown' });
        return true;
      }

      case 'status': {
        const jobId = parsed.args[0];
        if (!jobId) {
          await send(chatId, '❓ Usage: `/job status <jobId>`', { parse_mode: 'Markdown' });
          return true;
        }
        // Accept partial IDs — find first match
        const allJobs = listAgentLoopJobs({ limit: 100 });
        const job = allJobs.find((j) => j.jobId.endsWith(jobId) || j.jobId === jobId) ||
          (getAgentLoopJobStatus(jobId));
        if (!job) {
          await send(chatId, `Job \`${jobId}\` not found.`, { parse_mode: 'Markdown' });
          return true;
        }
        const statusIcon = job.status === 'completed' ? '✅' : job.status === 'failed' || job.status === 'dead_letter' ? '❌' : job.status === 'running' ? '🔄' : '⏳';
        await send(chatId, [
          `${statusIcon} *Job* \`${job.jobId.slice(-12)}\``,
          `Status: \`${job.status}\``,
          `Goal: ${job.goal.slice(0, 100)}`,
          `By: ${job.requestedBy}`,
          `Queued: ${job.enqueuedAt.slice(0, 16)}`,
          job.startedAt ? `Started: ${job.startedAt.slice(0, 16)}` : '',
          job.completedAt ? `Done: ${job.completedAt.slice(0, 16)}` : '',
          job.result ? `Result: ${job.result.slice(0, 120)}` : '',
          job.error ? `Error: ${job.error.slice(0, 120)}` : '',
        ].filter(Boolean).join('\n'), { parse_mode: 'Markdown' });
        return true;
      }

      case 'retry': {
        const jobId = parsed.args[0];
        if (!jobId) {
          await send(chatId, '❓ Usage: `/job retry <jobId>`', { parse_mode: 'Markdown' });
          return true;
        }
        const allJobs = listAgentLoopJobs({ limit: 100 });
        const fullJobId = allJobs.find((j) => j.jobId.endsWith(jobId))?.jobId || jobId;
        const ok = retryJob(fullJobId);
        await send(chatId, ok ? `♻️ Job \`${fullJobId.slice(-12)}\` re-queued.` : `Job \`${jobId}\` not found.`, { parse_mode: 'Markdown' });
        return true;
      }

      case 'cancel': {
        const jobId = parsed.args[0];
        if (!jobId) {
          await send(chatId, '❓ Usage: `/job cancel <jobId>`', { parse_mode: 'Markdown' });
          return true;
        }
        const allJobs = listAgentLoopJobs({ limit: 100 });
        const fullJobId = allJobs.find((j) => j.jobId.endsWith(jobId))?.jobId || jobId;
        const ok = purgeJob(fullJobId);
        await send(chatId, ok ? `🗑️ Job \`${fullJobId.slice(-12)}\` cancelled.` : `Job \`${jobId}\` not found.`, { parse_mode: 'Markdown' });
        return true;
      }

      case 'performance': {
        const dash = getPerformanceDashboard();
        const topLines = dash.topPerformers.slice(0, 3)
          .map((p) => `  ✅ ${p.agentRole}/${p.domain}: ${(p.successRate * 100).toFixed(0)}% (${p.totalRuns}×)`);
        const worstLines = dash.underperformers.slice(0, 2)
          .map((p) => `  ⚠️ ${p.agentRole}/${p.domain}: ${(p.successRate * 100).toFixed(0)}% (${p.totalRuns}×)`);
        await send(chatId, [
          `📊 *Agent Performance*`,
          `Total runs: ${dash.totalRuns} | Success rate: ${(dash.overallSuccessRate * 100).toFixed(0)}%`,
          `Roles: ${dash.totalAgentRoles} | Domains: ${dash.totalDomains}`,
          '',
          '*Top performers:*',
          ...topLines,
          '',
          '*Needs attention:*',
          ...worstLines,
        ].join('\n'), { parse_mode: 'Markdown' });
        return true;
      }

      default:
        await send(chatId, [
          '❓ Unknown job command.',
          '',
          '*Available:*',
          '`/job list [limit]` — list recent agent loop jobs',
          '`/job status <jobId>` — job details',
          '`/job retry <jobId>` — re-queue a failed job',
          '`/job cancel <jobId>` — cancel/delete a job',
          '`/job performance` — agent performance dashboard',
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
        '*Mission commands:*',
        '`/mission create "goal"`',
        '`/mission status latest`',
        '`/mission advance latest`',
        '`/mission approvals`',
        '`/mission approve <runId> <stepId> <fingerprint>`',
        '`/mission reject <runId> <stepId> [fingerprint] [reason]`',
        '`/mission stop <runId>`',
        '`/mission artifact latest`',
        '',
        '*Job commands (durable background):*',
        '`/job list` — list agent loop jobs',
        '`/job status <id>` — job details',
        '`/job retry <id>` — retry failed job',
        '`/job cancel <id>` — cancel job',
        '`/job performance` — agent stats',
        '',
        '*Other:*',
        '`/ai circuit` — circuit breaker status',
        '`/ai emergency-stop on|off`',
        '`/robot capabilities`',
        '`/automation scheduler status`',
      ].join('\n'), { parse_mode: 'Markdown' });
      return true;
  }
}
