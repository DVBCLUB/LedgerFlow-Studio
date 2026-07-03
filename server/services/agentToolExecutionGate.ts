import { randomBytes } from 'node:crypto';
import { createApprovalFingerprint, getAgentToolContract, type AgentToolContract } from './agentToolRegistry.ts';
import {
  createEmergencyStopContract,
  validateAutomationSafetyEnvelope,
  type AutomationActionType,
  type AutomationSafetyDecision,
  type AutomationSafetyPlan,
  type AutomationSurface,
} from './automationSafetyEnvelope.ts';

export interface AgentToolExecutionInput {
  toolId: string;
  title: string;
  target?: string;
  payload?: Record<string, unknown>;
  executionMode: 'simulation' | 'connector';
}

export interface AgentToolExecutionPreview {
  id: string;
  fingerprint: string;
  tool: AgentToolContract;
  title: string;
  target: string;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
  safetyPlan: AutomationSafetyPlan;
  safetyDecision: AutomationSafetyDecision;
  expiresAt: string;
}

type StoredPreview = AgentToolExecutionPreview & { input: AgentToolExecutionInput };
type StoredApproval = { token: string; previewId: string; fingerprint: string; expiresAt: number };

const PREVIEW_TTL_MS = 5 * 60 * 1000;
const APPROVAL_TTL_MS = 2 * 60 * 1000;
const previews = new Map<string, StoredPreview>();
const approvals = new Map<string, StoredApproval>();

function cleanupExpired() {
  const now = Date.now();
  for (const [id, preview] of previews) if (Date.parse(preview.expiresAt) <= now) previews.delete(id);
  for (const [token, approval] of approvals) if (approval.expiresAt <= now) approvals.delete(token);
}

function fingerprintInput(input: AgentToolExecutionInput) {
  return createApprovalFingerprint({
    toolId: input.toolId,
    title: input.title,
    target: input.target || '',
    payload: input.payload || {},
    executionMode: input.executionMode,
  });
}

function payloadBoolean(payload: Record<string, unknown>, key: string, fallback: boolean) {
  return typeof payload[key] === 'boolean' ? Boolean(payload[key]) : fallback;
}

function payloadStringArray(payload: Record<string, unknown>, key: string) {
  return Array.isArray(payload[key]) ? (payload[key] as unknown[]).filter((item): item is string => typeof item === 'string') : [];
}

function inferSurface(tool: AgentToolContract): AutomationSurface {
  if (tool.permission.startsWith('robot:')) return 'robot';
  if (tool.permission === 'browser:read' || tool.permission === 'web:search') return 'browser';
  return 'computer';
}

function inferActionType(tool: AgentToolContract): AutomationActionType {
  if (tool.permission === 'robot:move') return 'move';
  if (tool.permission === 'robot:inspect') return 'inspect';
  if (tool.permission === 'browser:read' || tool.permission === 'web:search') return 'read';
  if (tool.permission === 'connector:write' || tool.permission === 'notification:send' || tool.permission === 'patch:draft' || tool.permission === 'github:push' || tool.permission === 'github:pull') return 'type';
  return 'inspect';
}

function defaultTarget(tool: AgentToolContract) {
  if (tool.permission.startsWith('robot:')) return tool.permission === 'robot:move' ? 'robot://simulator/arm-a/joint-1' : 'robot://simulator/arm-a';
  if (tool.permission === 'browser:read' || tool.permission === 'web:search') return 'browser://sandbox/read-only';
  if (tool.permission === 'connector:write' || tool.permission === 'github:push' || tool.permission === 'github:pull') return 'connector://configured/write';
  if (tool.permission === 'notification:send') return 'notification://configured/channel';
  return `agent-tool://${tool.id}`;
}

function defaultAllowedTarget(tool: AgentToolContract, target: string) {
  if (tool.permission === 'robot:move') return 'robot://simulator/arm-a';
  if (tool.permission.startsWith('robot:')) return target;
  if (tool.permission === 'browser:read' || tool.permission === 'web:search') return target;
  if (tool.permission === 'connector:write' || tool.permission === 'github:push' || tool.permission === 'github:pull') return 'connector://configured';
  if (tool.permission === 'notification:send') return 'notification://configured';
  return target;
}

function buildSafetyPlan(input: AgentToolExecutionInput, tool: AgentToolContract, previewId: string): AutomationSafetyPlan {
  const payload = input.payload || {};
  const target = input.target || defaultTarget(tool);
  const allowedTargets = payloadStringArray(payload, 'allowedTargets');
  const emergencyStop = payload.emergencyStop && typeof payload.emergencyStop === 'object'
    ? payload.emergencyStop as { command: string; contact: string }
    : tool.permission === 'robot:move'
      ? createEmergencyStopContract()
      : undefined;

  return {
    id: `tool_safety_${previewId}`,
    surface: inferSurface(tool),
    title: input.title,
    allowedTargets: allowedTargets.length ? allowedTargets : [defaultAllowedTarget(tool, target)],
    humanCheckpoint: payloadBoolean(payload, 'humanCheckpoint', tool.requiresApproval),
    labOnly: payloadBoolean(payload, 'labOnly', tool.permission.startsWith('robot:')),
    emergencyStop,
    actions: [
      {
        id: `${tool.id}_action`,
        type: inferActionType(tool),
        target,
        payload,
      },
    ],
  };
}

export function createAgentToolExecutionPreview(input: AgentToolExecutionInput): AgentToolExecutionPreview {
  cleanupExpired();
  const tool = getAgentToolContract(input.toolId);
  if (!tool || tool.risk === 'blocked') throw new Error('Tool is not registered or is blocked.');
  if (input.executionMode !== 'simulation' && input.executionMode !== 'connector') throw new Error('Only simulation or connector execution is enabled in this release.');
  const id = `tool_preview_${Date.now()}_${randomBytes(6).toString('hex')}`;
  const safetyPlan = buildSafetyPlan(input, tool, id);
  const safetyDecision = validateAutomationSafetyEnvelope(safetyPlan);
  if (!safetyDecision.approved) {
    throw new Error(`Automation safety envelope rejected: ${safetyDecision.issues.join('; ')}`);
  }
  const preview: StoredPreview = {
    id,
    fingerprint: fingerprintInput(input),
    tool,
    title: input.title,
    target: input.target || '',
    payload: input.payload || {},
    requiresApproval: tool.requiresApproval || safetyDecision.humanCheckpointRequired,
    safetyPlan,
    safetyDecision,
    expiresAt: new Date(Date.now() + PREVIEW_TTL_MS).toISOString(),
    input,
  };
  previews.set(id, preview);
  const { input: _input, ...publicPreview } = preview;
  return publicPreview;
}

export function approveAgentToolExecution(previewId: string, fingerprint: string) {
  cleanupExpired();
  const preview = previews.get(previewId);
  if (!preview || preview.fingerprint !== fingerprint) throw new Error('Tool preview is missing, expired, or changed.');
  if (!preview.safetyDecision.approved) throw new Error('Tool preview safety decision is not approved.');
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + APPROVAL_TTL_MS;
  approvals.set(token, { token, previewId, fingerprint, expiresAt });
  return { approvalToken: token, expiresAt: new Date(expiresAt).toISOString() };
}

export function consumeAgentToolExecution(input: AgentToolExecutionInput & { previewId: string; approvalToken?: string }) {
  cleanupExpired();
  const preview = previews.get(input.previewId);
  if (!preview) throw new Error('Tool preview is required or has expired.');
  const fingerprint = fingerprintInput(input);
  if (preview.fingerprint !== fingerprint) throw new Error('Tool input changed after preview. Create a new preview.');
  if (!preview.safetyDecision.approved) throw new Error('Tool preview safety decision is not approved.');
  if (preview.requiresApproval) {
    const approval = input.approvalToken ? approvals.get(input.approvalToken) : undefined;
    if (!approval || approval.previewId !== preview.id || approval.fingerprint !== fingerprint) {
      throw new Error('A valid one-time approval token is required for this tool.');
    }
    approvals.delete(approval.token);
  }
  previews.delete(preview.id);
  return preview;
}
