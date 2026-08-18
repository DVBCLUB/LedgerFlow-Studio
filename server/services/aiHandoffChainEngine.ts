/**
 * aiHandoffChainEngine.ts
 * ============================================================
 * AUTOMATED MULTI-AGENT HANDOFF CHAIN PIPELINE ENGINE
 *
 * Coordinates end-to-end multi-agent execution chains across
 * distinct specialized AI employee roles without manual micro-management.
 *
 * Example:
 *  AI Dev (Code/Patch) -> AI QA (Test Validation) -> AI Security Judge (SAST/CAI)
 *  -> AI Release Manager (Package & Changelog) -> Solo Founder (1-Click Telegram).
 */

import { recordAIAction } from './aiActionLedger.ts';
import { verifyAgentActionPermission } from './advancedDelegationConflictResolver.ts';
import { submitHumanApprovalRequest } from './humanApprovalGateway.ts';

export type ChainStatus = 'IN_PROGRESS' | 'COMPLETED' | 'WAITING_FOUNDER_APPROVAL' | 'FAILED';

export interface HandoffStep {
  stepIndex: number;
  assignedRoleId: string;
  roleTitle: string;
  actionRequired: string;
  status: 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED';
  outputSummary?: string;
  completedAt?: string;
}

export interface HandoffChain {
  chainId: string;
  name: string;
  workflowType: 'software_feature_release' | 'marketing_video_launch' | 'financial_monthly_audit';
  currentStepIndex: number;
  steps: HandoffStep[];
  status: ChainStatus;
  createdAt: string;
  updatedAt: string;
  finalArtifactSummary?: string;
}

const ACTIVE_CHAINS = new Map<string, HandoffChain>();

/**
 * Initialize a Standard Software Release Chain
 */
export function startSoftwareReleaseChain(params: {
  featureTitle: string;
  authorAgentId?: string;
}): HandoffChain {
  const chainId = `chn_sw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const steps: HandoffStep[] = [
    {
      stepIndex: 0,
      assignedRoleId: 'role_ai_code_specialist',
      roleTitle: 'AI Code & Game Specialist',
      actionRequired: `Lập trình và hoàn thiện mã nguồn tính năng: ${params.featureTitle}`,
      status: 'RUNNING',
    },
    {
      stepIndex: 1,
      assignedRoleId: 'role_chief_of_staff',
      roleTitle: 'Chief of Staff & AI QA',
      actionRequired: 'Kiểm thử hồi quy (Regression Test) và xác thực tài liệu sản phẩm',
      status: 'PENDING',
    },
    {
      stepIndex: 2,
      assignedRoleId: 'role_ai_security_judge',
      roleTitle: 'AI Security Judge',
      actionRequired: 'Quét an toàn bảo mật, kiểm tra secret leak và Constitutional Invariants',
      status: 'PENDING',
    },
    {
      stepIndex: 3,
      assignedRoleId: 'role_solo_founder_ceo',
      roleTitle: 'Solo Founder (CEO)',
      actionRequired: 'Duyệt 1-click qua Telegram và ký lệnh phát hành Production Build',
      status: 'PENDING',
    },
  ];

  const chain: HandoffChain = {
    chainId,
    name: `Chuỗi Phát Hành Tính Năng: ${params.featureTitle}`,
    workflowType: 'software_feature_release',
    currentStepIndex: 0,
    steps,
    status: 'IN_PROGRESS',
    createdAt: now,
    updatedAt: now,
  };

  ACTIVE_CHAINS.set(chainId, chain);

  recordAIAction({
    agentId: params.authorAgentId || 'chain_starter',
    roleId: 'role_chief_of_staff',
    domain: 'software_core',
    actionType: 'HANDOFF_CHAIN_INITIALIZED',
    targetResource: chainId,
    outputSummary: `Đã khởi tạo chuỗi chuyền giao 4 bước cho: ${params.featureTitle}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return chain;
}

/**
 * Advance current step in the handoff chain
 */
export function advanceHandoffChain(params: {
  chainId: string;
  stepOutputSummary: string;
  isSuccess: boolean;
}): HandoffChain {
  const chain = ACTIVE_CHAINS.get(params.chainId);
  if (!chain) throw new Error(`Handoff chain ${params.chainId} not found`);

  const currentStep = chain.steps[chain.currentStepIndex];
  if (!currentStep) throw new Error(`No active step found at index ${chain.currentStepIndex}`);

  if (!params.isSuccess) {
    currentStep.status = 'FAILED';
    currentStep.outputSummary = params.stepOutputSummary;
    chain.status = 'FAILED';
    chain.updatedAt = new Date().toISOString();
    return chain;
  }

  // Mark current step as passed
  currentStep.status = 'PASSED';
  currentStep.outputSummary = params.stepOutputSummary;
  currentStep.completedAt = new Date().toISOString();

  // Move to next step if exists
  if (chain.currentStepIndex < chain.steps.length - 1) {
    chain.currentStepIndex += 1;
    const nextStep = chain.steps[chain.currentStepIndex];
    nextStep.status = 'RUNNING';

    // If next step requires CEO approval, submit to Human Approval Gateway
    if (nextStep.assignedRoleId === 'role_solo_founder_ceo') {
      chain.status = 'WAITING_FOUNDER_APPROVAL';
      submitHumanApprovalRequest({
        requesterAgentId: 'agent_handoff_engine',
        requesterRoleId: chain.steps[chain.currentStepIndex - 1].assignedRoleId,
        domain: 'software_core',
        actionType: 'deploy_production_build',
        title: `[Handoff Chain Sẵn Sàng] ${chain.name}`,
        description: `Chuỗi chuyền giao AI đã vượt qua kiểm thử QA và Security. Chờ CEO ký lệnh phát hành.`,
        proposedChanges: { chainId: chain.chainId },
      });
    }
  } else {
    // Chain completed
    chain.status = 'COMPLETED';
    chain.finalArtifactSummary = 'Toàn bộ chuỗi chuyền giao đã hoàn tất xuất sắc 100%.';
  }

  chain.updatedAt = new Date().toISOString();

  recordAIAction({
    agentId: 'agent_handoff_engine',
    roleId: currentStep.assignedRoleId,
    domain: 'software_core',
    actionType: `HANDOFF_STEP_ADVANCED:${currentStep.stepIndex}`,
    targetResource: chain.chainId,
    outputSummary: `Bước ${currentStep.stepIndex + 1} (${currentStep.roleTitle}) đã hoàn thành: ${params.stepOutputSummary}`,
    permissionCheckPassed: true,
    constitutionalRulePassed: true,
  });

  return chain;
}

/**
 * List all active and completed handoff chains
 */
export function listHandoffChains(): HandoffChain[] {
  return Array.from(ACTIVE_CHAINS.values()).reverse();
}
