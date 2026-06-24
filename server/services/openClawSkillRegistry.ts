import { listAgentToolContracts } from './agentToolRegistry.ts';
import { listRobotCapabilities } from './robotCapabilityRegistry.ts';

export type OpenClawSkillDomain = 'agent' | 'robot' | 'automation' | 'plugin' | 'governance';
export type OpenClawSkillRisk = 'low' | 'medium' | 'high' | 'blocked';
export type OpenClawSkillMode = 'simulation' | 'sandbox' | 'connector' | 'digital_twin' | 'hardware' | 'policy';

export interface OpenClawSkill {
  id: string;
  name: string;
  domain: OpenClawSkillDomain;
  command?: string;
  mode: OpenClawSkillMode;
  risk: OpenClawSkillRisk;
  requiresApproval: boolean;
  description: string;
  source: string;
  tags: string[];
}

const AUTOMATION_SKILLS: OpenClawSkill[] = [
  {
    id: 'automation.scheduler.status',
    name: 'Automation Scheduler Status',
    domain: 'automation',
    command: '/automation scheduler status',
    mode: 'policy',
    risk: 'low',
    requiresApproval: false,
    description: 'Read local automation scheduler status and trigger keys.',
    source: 'automationSchedulerLoop',
    tags: ['scheduler', 'read-only', 'telegram'],
  },
  {
    id: 'automation.scheduler.tick',
    name: 'Automation Scheduler Tick',
    domain: 'automation',
    command: '/automation scheduler tick',
    mode: 'policy',
    risk: 'medium',
    requiresApproval: false,
    description: 'Run a bounded scheduler tick that may fire daily or weekly local automation events.',
    source: 'automationSchedulerLoop',
    tags: ['scheduler', 'event-loop', 'audit'],
  },
  {
    id: 'automation.scheduler.start',
    name: 'Start Automation Scheduler',
    domain: 'automation',
    command: '/automation scheduler start',
    mode: 'policy',
    risk: 'medium',
    requiresApproval: false,
    description: 'Start the local scheduler loop with a safe minimum interval.',
    source: 'automationSchedulerLoop',
    tags: ['scheduler', 'local-only'],
  },
  {
    id: 'automation.scheduler.stop',
    name: 'Stop Automation Scheduler',
    domain: 'automation',
    command: '/automation scheduler stop',
    mode: 'policy',
    risk: 'low',
    requiresApproval: false,
    description: 'Stop the local scheduler loop.',
    source: 'automationSchedulerLoop',
    tags: ['scheduler', 'safety'],
  },
];

const GOVERNANCE_SKILLS: OpenClawSkill[] = [
  {
    id: 'governance.agent.approve_step',
    name: 'Approve Agent Step',
    domain: 'governance',
    command: '/mission approve <runId> <stepId> <fingerprint>',
    mode: 'policy',
    risk: 'high',
    requiresApproval: true,
    description: 'Approve a waiting agent step after fingerprint review.',
    source: 'agentRuntime',
    tags: ['approval', 'audit', 'telegram'],
  },
  {
    id: 'governance.agent.reject_step',
    name: 'Reject Agent Step',
    domain: 'governance',
    command: '/mission reject <runId> <stepId> [fingerprint] [reason]',
    mode: 'policy',
    risk: 'low',
    requiresApproval: false,
    description: 'Reject a waiting agent step and stop unsafe continuation.',
    source: 'agentRuntime',
    tags: ['rejection', 'audit', 'telegram'],
  },
  {
    id: 'governance.ai.emergency_stop',
    name: 'AI Emergency Stop',
    domain: 'governance',
    command: '/ai emergency-stop on|off',
    mode: 'policy',
    risk: 'high',
    requiresApproval: false,
    description: 'Enable or release the AI Workforce emergency stop.',
    source: 'agentRuntime',
    tags: ['emergency-stop', 'safety'],
  },
];

function agentToolToSkill(tool: ReturnType<typeof listAgentToolContracts>[number]): OpenClawSkill {
  return {
    id: `agent.${tool.id}`,
    name: tool.id.replace(/_/g, ' '),
    domain: 'agent',
    mode: tool.execution,
    risk: tool.risk,
    requiresApproval: tool.requiresApproval,
    description: tool.description,
    source: 'agentToolRegistry',
    tags: [tool.permission, tool.execution],
  };
}

function robotCapabilityToSkill(capability: ReturnType<typeof listRobotCapabilities>[number]): OpenClawSkill {
  return {
    id: `robot.${capability.id}`,
    name: capability.name,
    domain: 'robot',
    command: capability.command,
    mode: capability.mode,
    risk: capability.risk,
    requiresApproval: capability.requiresApproval,
    description: capability.description,
    source: 'robotCapabilityRegistry',
    tags: [capability.mode, capability.risk, capability.command],
  };
}

export function listOpenClawSkills(filter?: { domain?: OpenClawSkillDomain; includeBlocked?: boolean }) {
  const agentSkills = listAgentToolContracts().map(agentToolToSkill);
  const robotSkills = listRobotCapabilities({ includeBlocked: filter?.includeBlocked }).map(robotCapabilityToSkill);
  const skills = [...agentSkills, ...robotSkills, ...AUTOMATION_SKILLS, ...GOVERNANCE_SKILLS];
  return skills.filter((skill) => {
    if (filter?.domain && skill.domain !== filter.domain) return false;
    if (!filter?.includeBlocked && skill.risk === 'blocked') return false;
    return true;
  }).map((skill) => ({ ...skill, tags: [...skill.tags] }));
}

export function getOpenClawSkill(id: string) {
  const skill = listOpenClawSkills({ includeBlocked: true }).find((item) => item.id === id || item.command === id);
  return skill ? { ...skill, tags: [...skill.tags] } : null;
}

export function getOpenClawSkillSummary() {
  const skills = listOpenClawSkills({ includeBlocked: true });
  const byDomain = skills.reduce<Record<string, number>>((acc, skill) => {
    acc[skill.domain] = (acc[skill.domain] || 0) + 1;
    return acc;
  }, {});
  return {
    total: skills.length,
    blocked: skills.filter((skill) => skill.risk === 'blocked').length,
    approvalRequired: skills.filter((skill) => skill.requiresApproval).length,
    byDomain,
  };
}
