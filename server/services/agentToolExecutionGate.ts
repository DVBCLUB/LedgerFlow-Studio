import { randomBytes } from 'node:crypto';
import { createApprovalFingerprint, getAgentToolContract, type AgentToolContract } from './agentToolRegistry.ts';

export interface AgentToolExecutionInput {
  toolId: string;
  title: string;
  target?: string;
  payload?: Record<string, unknown>;
  executionMode: 'simulation';
}

export interface AgentToolExecutionPreview {
  id: string;
  fingerprint: string;
  tool: AgentToolContract;
  title: string;
  target: string;
  payload: Record<string, unknown>;
  requiresApproval: boolean;
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

export function createAgentToolExecutionPreview(input: AgentToolExecutionInput): AgentToolExecutionPreview {
  cleanupExpired();
  const tool = getAgentToolContract(input.toolId);
  if (!tool || tool.risk === 'blocked') throw new Error('Tool is not registered or is blocked.');
  if (input.executionMode !== 'simulation') throw new Error('Only simulation execution is enabled in this release.');
  const id = `tool_preview_${Date.now()}_${randomBytes(6).toString('hex')}`;
  const preview: StoredPreview = {
    id,
    fingerprint: fingerprintInput(input),
    tool,
    title: input.title,
    target: input.target || '',
    payload: input.payload || {},
    requiresApproval: tool.requiresApproval,
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
