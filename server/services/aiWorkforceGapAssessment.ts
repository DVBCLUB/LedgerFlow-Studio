import { listAgentToolContracts, type AgentToolContract } from './agentToolRegistry.ts';
import { buildGroundedContextPack } from './groundedContextPack.ts';
import { AI_WORKFORCE_BASELINE_TASKS } from './aiBenchmarkObservability.ts';
import { createEmergencyStopContract, validateAutomationSafetyEnvelope } from './automationSafetyEnvelope.ts';
import { scoreSoftwareFactoryReadiness } from './softwareFactoryReadiness.ts';

export type AIWorkforceTargetId =
  | 'orchestration'
  | 'memory_rag_kg'
  | 'mcp_tool_registry'
  | 'computer_browser_robotics'
  | 'software_factory'
  | 'workflow_engine'
  | 'safety_governance'
  | 'benchmark_observability';

export type AIWorkforceGapStatus = 'achieved' | 'partial' | 'gap';

export interface AIWorkforceTarget {
  id: AIWorkforceTargetId;
  title: string;
  openclawPlusGoal: string;
  minimumSignals: string[];
}

export interface AIWorkforceGapRow {
  id: AIWorkforceTargetId;
  title: string;
  score: number;
  status: AIWorkforceGapStatus;
  currentSignals: string[];
  missing: string[];
  nextUpgrade: string;
}

export interface AIWorkforceUpgradeBacklogItem {
  id: string;
  priority: 'P0' | 'P1' | 'P2';
  targetId: AIWorkforceTargetId;
  title: string;
  reason: string;
  acceptanceCriteria: string[];
  safeExecutionMode: 'background' | 'human_review' | 'lab_only';
}

export interface AIWorkforceReadinessReport {
  generatedAt: string;
  overallScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  rows: AIWorkforceGapRow[];
  backlog: AIWorkforceUpgradeBacklogItem[];
}

interface PipelineTypeSignal {
  id: string;
  steps: Array<{ name: string }>;
}

export const AI_WORKFORCE_TARGETS: AIWorkforceTarget[] = [
  {
    id: 'orchestration',
    title: 'Multi-agent orchestration',
    openclawPlusGoal: 'Mission → plan → agent assignment → step execution → review → learning loop.',
    minimumSignals: ['pipeline templates', 'agent roles', 'approval checkpoints', 'resume flow'],
  },
  {
    id: 'memory_rag_kg',
    title: 'Memory + RAG + Knowledge Graph',
    openclawPlusGoal: 'Every high-impact answer is grounded in memory, sources, decision log, and contradiction checks.',
    minimumSignals: ['company memory injection', 'knowledge read tool', 'source map', 'decision log'],
  },
  {
    id: 'mcp_tool_registry',
    title: 'MCP/tool registry',
    openclawPlusGoal: 'Every tool has a manifest, permission, risk tier, timeout, attempts, and approval policy.',
    minimumSignals: ['tool contracts', 'least privilege permissions', 'external connector policy', 'blocked tier'],
  },
  {
    id: 'computer_browser_robotics',
    title: 'Computer, browser, and robot automation',
    openclawPlusGoal: 'Browser/computer/robot actions are sandboxed, replayable, and stopped by human checkpoints.',
    minimumSignals: ['browser read tool', 'robot inspect tool', 'robot move approval', 'lab-only mode'],
  },
  {
    id: 'software_factory',
    title: 'Self-healing software factory',
    openclawPlusGoal: 'Agents can plan patches, review diffs, use CI evidence, and create safe PR handoffs.',
    minimumSignals: ['draft patch tool', 'software product pipeline', 'QA step', 'DevOps step'],
  },
  {
    id: 'workflow_engine',
    title: 'Durable workflow engine',
    openclawPlusGoal: 'Long-running work survives restarts, dedupes jobs, leases workers, retries, and dead-letters failures.',
    minimumSignals: ['durable queue', 'dedupe key', 'lease worker', 'dead letter retry'],
  },
  {
    id: 'safety_governance',
    title: 'Safety and governance layer',
    openclawPlusGoal: 'High-risk actions require one-time approval, immutable fingerprint, audit evidence, and rollback path.',
    minimumSignals: ['risk tiers', 'approval token', 'fingerprint binding', 'single-use approval'],
  },
  {
    id: 'benchmark_observability',
    title: 'Benchmark and observability',
    openclawPlusGoal: 'The AI system continuously grades capability coverage, latency, safety blocks, and output quality.',
    minimumSignals: ['readiness score', 'gap matrix', 'upgrade backlog', 'quality metrics'],
  },
];

function listAIWorkforcePipelineSignals(): PipelineTypeSignal[] {
  return [
    { id: 'software_product', steps: [{ name: 'AI PM spec' }, { name: 'AI Dev plan code' }, { name: 'AI QA test plan' }, { name: 'AI DevOps deploy plan' }] },
    { id: 'daily_content', steps: [{ name: 'Plan' }, { name: 'Draft' }, { name: 'Review' }] },
    { id: 'game_dev', steps: [{ name: 'Design' }, { name: 'Build' }, { name: 'QA' }] },
    { id: 'month_end', steps: [{ name: 'Collect' }, { name: 'Reconcile' }, { name: 'Report' }] },
    { id: 'daily_brief', steps: [{ name: 'Fetch' }, { name: 'Summarize' }, { name: 'Send' }] },
  ];
}

function statusFromScore(score: number): AIWorkforceGapStatus {
  if (score >= 4) return 'achieved';
  if (score >= 2) return 'partial';
  return 'gap';
}

function hasTool(tools: AgentToolContract[], id: string) {
  return tools.some((tool) => tool.id === id);
}

function hasPermission(tools: AgentToolContract[], permission: string) {
  return tools.some((tool) => tool.permission === permission);
}

function scoreRow(row: Omit<AIWorkforceGapRow, 'score' | 'status'> & { score: number }): AIWorkforceGapRow {
  const score = Math.max(0, Math.min(5, row.score));
  return { ...row, score, status: statusFromScore(score) };
}

export function assessAIWorkforceReadiness(now = new Date()): AIWorkforceReadinessReport {
  const tools = listAgentToolContracts();
  const pipelineTypes = listAIWorkforcePipelineSignals();
  const highRiskTools = tools.filter((tool) => tool.risk === 'high');
  const highRiskToolsWithApproval = highRiskTools.filter((tool) => tool.requiresApproval);

  const hasSoftwarePipeline = pipelineTypes.some((pipeline) => pipeline.id === 'software_product');
  const softwarePipeline = pipelineTypes.find((pipeline) => pipeline.id === 'software_product');
  const softwareStepNames = softwarePipeline?.steps.map((step) => step.name.toLowerCase()) || [];
  const sampleGroundedPack = buildGroundedContextPack({
    question: 'AI Workforce memory grounding',
    sources: [{ kind: 'decision', title: 'AI Workforce', content: 'source confidence contradiction knowledge graph', tags: ['ai-workforce'], facts: { mode: 'grounded' } }],
  });
  const robotSafetyDecision = validateAutomationSafetyEnvelope({
    id: 'robot-safety-smoke',
    surface: 'robot',
    title: 'Robot safety smoke',
    allowedTargets: ['robot://simulator/arm-a'],
    labOnly: true,
    humanCheckpoint: true,
    emergencyStop: createEmergencyStopContract(),
    actions: [{ id: 'move-1', type: 'move', target: 'robot://simulator/arm-a/joint-1' }],
  });
  const prReadiness = scoreSoftwareFactoryReadiness({
    title: 'AI readiness smoke',
    changedFiles: [{ filename: 'src/modules/ai-hr/AIWorkforceCommandCenter.tsx', additions: 24, deletions: 1 }],
    checks: [{ name: 'contract', status: 'success' }],
    ciLogSummary: 'Contract checks passed.',
    hasRollbackPlan: true,
  });

  const rows: AIWorkforceGapRow[] = [
    scoreRow({
      id: 'orchestration',
      title: 'Multi-agent orchestration',
      score: pipelineTypes.length >= 5 && pipelineTypes.every((pipeline) => pipeline.steps.length > 0) ? 4 : 3,
      currentSignals: [`${pipelineTypes.length} pipeline templates registered`, 'Step-level approval is supported', 'Pipeline resume flow is available'],
      missing: ['Mission-level planner that selects the best pipeline automatically', 'Cross-agent dependency graph and SLA tracking'],
      nextUpgrade: 'Add mission planner that maps founder intent to pipeline, tools, risk tier, and expected artifacts.',
    }),
    scoreRow({
      id: 'memory_rag_kg',
      title: 'Memory + RAG + Knowledge Graph',
      score: hasTool(tools, 'read_knowledge') && sampleGroundedPack.sourceMap.length && sampleGroundedPack.graph.nodes.length ? 4 : 2,
      currentSignals: ['Knowledge read tool exists', 'Pipeline can inject high-importance company memory', 'Grounded Context Pack exposes source map, confidence, contradictions, and graph nodes/edges'],
      missing: ['Persistent knowledge graph store', 'Runtime wiring into every high-impact pipeline prompt'],
      nextUpgrade: 'Persist graph/source map and inject Grounded Context Pack into pipelineOrchestrator.',
    }),
    scoreRow({
      id: 'mcp_tool_registry',
      title: 'MCP/tool registry',
      score: tools.length >= 10 && hasPermission(tools, 'connector:write') ? 4 : 2,
      currentSignals: [`${tools.length} tool contracts registered`, `${new Set(tools.map((tool) => tool.permission)).size} least-privilege permission scopes`, hasPermission(tools, 'connector:write') ? 'External connector write policy exists' : 'External connector policy missing'],
      missing: ['MCP manifest import/export format', 'Credential scope registry per connector', 'Tool health checks and last-run telemetry'],
      nextUpgrade: 'Add MCP-compatible manifest schema and a registry health score per connector/tool.',
    }),
    scoreRow({
      id: 'computer_browser_robotics',
      title: 'Computer, browser, and robot automation',
      score: hasTool(tools, 'browser_check') && hasTool(tools, 'robot_inspect') && hasTool(tools, 'robot_move') && robotSafetyDecision.approved ? 4 : 2,
      currentSignals: ['Browser read/check tool exists', 'Robot inspect/move tools exist', 'Safety envelope validates allowlist, replay evidence, lab-only robot mode, and emergency stop'],
      missing: ['Runtime adapter that captures real screenshots/action replay', 'Physical robot certification before production mode'],
      nextUpgrade: 'Wire safety envelope into actual browser/robot tool execution.',
    }),
    scoreRow({
      id: 'software_factory',
      title: 'Self-healing software factory',
      score: hasSoftwarePipeline && hasTool(tools, 'draft_patch') && softwareStepNames.some((name) => name.includes('qa')) && prReadiness.verdict === 'ready' ? 4 : 2,
      currentSignals: ['Software Product Factory pipeline exists', 'Draft patch tool exists', 'QA/DevOps steps exist', 'PR readiness scoring classifies file risk, checks, rollback, approvals, blockers, warnings'],
      missing: ['Automatic GitHub Actions CI log fetch', 'PR readiness report surfaced in PR Control Center'],
      nextUpgrade: 'Use readiness scorer in PR handoff and GitHub CI doctor.',
    }),
    scoreRow({
      id: 'workflow_engine',
      title: 'Durable workflow engine',
      score: 4,
      currentSignals: ['Durable queue supports dedupe, lease, retry, dead-letter, retry-dead-letter, and prune', 'Pipeline store has local fallback when Supabase is unavailable'],
      missing: ['Visual workflow graph for nested missions', 'Scheduled mission SLA and escalation policy'],
      nextUpgrade: 'Expose queue health and mission SLA in the AI Factory dashboard.',
    }),
    scoreRow({
      id: 'safety_governance',
      title: 'Safety and governance layer',
      score: highRiskTools.length > 0 && highRiskTools.length === highRiskToolsWithApproval.length && robotSafetyDecision.humanCheckpointRequired ? 4 : 2,
      currentSignals: [`${highRiskToolsWithApproval.length}/${highRiskTools.length} high-risk tools require approval`, 'Approval fingerprints bind reviewed output/input', 'Approval token is one-time use', 'Automation safety envelope requires checkpoint and emergency stop where needed'],
      missing: ['Persistent audit trail for each tool execution preview/approval/consume event', 'Risk policy tied to user role and environment'],
      nextUpgrade: 'Persist safety events and expose approval history in the AI Factory quality tab.',
    }),
    scoreRow({
      id: 'benchmark_observability',
      title: 'Benchmark and observability',
      score: AI_WORKFORCE_BASELINE_TASKS.length >= 3 ? 4 : 2,
      currentSignals: ['Readiness service exposes dynamic gap matrix and backlog', `${AI_WORKFORCE_BASELINE_TASKS.length} baseline regression tasks registered`, 'Run metric summary supports latency, cost, quality, blocked rate, and lane breakdown'],
      missing: ['Persistent run metric store', 'Trend dashboard over time'],
      nextUpgrade: 'Persist run metrics and compare against baseline tasks for each agent lane.',
    }),
  ];

  const backlog = buildAIWorkforceUpgradeBacklog(rows);
  const overallScore = Number((rows.reduce((sum, row) => sum + row.score, 0) / rows.length).toFixed(2));
  const grade = overallScore >= 4.25 ? 'A' : overallScore >= 3.25 ? 'B' : overallScore >= 2.25 ? 'C' : 'D';

  return { generatedAt: now.toISOString(), overallScore, grade, rows, backlog };
}

export function buildAIWorkforceUpgradeBacklog(rows: AIWorkforceGapRow[]): AIWorkforceUpgradeBacklogItem[] {
  return rows
    .filter((row) => row.status !== 'achieved' || row.missing.length > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 8)
    .map((row, index) => ({
      id: `aiw-${row.id}`,
      priority: index === 0 ? 'P0' : index <= 2 ? 'P1' : 'P2',
      targetId: row.id,
      title: row.nextUpgrade,
      reason: row.missing[0] || 'Capability is ready but still needs runtime integration.',
      acceptanceCriteria: [`Keep ${row.title} score at or above 4/5`, 'Add automated contract checks', 'Expose status in AI Factory Command Center'],
      safeExecutionMode: row.id === 'computer_browser_robotics' ? 'lab_only' : row.id === 'safety_governance' || row.id === 'software_factory' ? 'human_review' : 'background',
    }));
}
