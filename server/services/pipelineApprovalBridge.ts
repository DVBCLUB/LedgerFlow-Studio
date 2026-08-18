/**
 * pipelineApprovalBridge.ts
 * ============================================================
 * AUTOMATED PIPELINE APPROVAL WEBHOOK BRIDGE
 *
 * Bridges completed pipelines (Video, Game Assets, Software builds)
 * to the Human Approval Gateway and Telegram 1-Click Approval.
 */

import { submitHumanApprovalRequest, type ApprovalRequest } from './humanApprovalGateway.ts';
import { recordAIAction } from './aiActionLedger.ts';

export type PipelineType = 'video_production' | 'game_asset' | 'software_release';

export interface PipelineApprovalBridgeResult {
  bridged: boolean;
  approvalRequest?: ApprovalRequest;
  pipelineType: PipelineType;
  itemId: string;
  message: string;
}

/**
 * Automatically submit approval request upon pipeline item completion
 */
export function bridgePipelineCompletionToApproval(params: {
  pipelineType: PipelineType;
  itemId: string;
  title: string;
  summary: string;
  authorAgentId?: string;
  metadata?: Record<string, unknown>;
}): PipelineApprovalBridgeResult {
  const agentId = params.authorAgentId || 'agent_pipeline_auto';

  let roleId = 'role_ai_market_scout';
  let domain = 'video_marketing';
  let actionType = 'bulk_external_publish';

  if (params.pipelineType === 'game_asset') {
    roleId = 'role_ai_code_specialist';
    domain = 'game_studio';
    actionType = 'deploy_production_build';
  } else if (params.pipelineType === 'software_release') {
    roleId = 'role_ai_code_specialist';
    domain = 'software_core';
    actionType = 'deploy_production_build';
  }

  const approvalReq = submitHumanApprovalRequest({
    requesterAgentId: agentId,
    requesterRoleId: roleId,
    domain,
    actionType,
    title: `[Tự Động Phê Duyệt] ${params.title}`,
    description: `Pipeline ${params.pipelineType} đã hoàn thành xuất sắc (${params.itemId}). ${params.summary}`,
    proposedChanges: {
      pipelineType: params.pipelineType,
      itemId: params.itemId,
      ...params.metadata,
    },
    timeoutMinutes: 30,
  });

  recordAIAction({
    agentId,
    roleId,
    domain,
    actionType: `PIPELINE_AUTO_BRIDGED:${params.pipelineType}`,
    targetResource: params.itemId,
    outputSummary: `Đã tự động gửi yêu cầu phê duyệt ${approvalReq.requestId} cho ${params.title}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return {
    bridged: true,
    approvalRequest: approvalReq,
    pipelineType: params.pipelineType,
    itemId: params.itemId,
    message: `Đã kích hoạt cổng duyệt Solo Founder cho ${params.title} (ID: ${approvalReq.requestId})`,
  };
}
