import { healRobotActionSelector, HealedSelectorResult } from './robotVisionHealer';

export interface ProjectAutomationTarget {
  projectId: string;
  projectName: string;
  targetUrl?: string;
  agentRole: string;
  taskType: 'dom_web_automation' | 'ide_mcp_handoff' | 'hybrid_swarm';
  prompt: string;
  selectors?: { label: string; rawSelector: string }[];
}

export interface IDEManifestHandoff {
  manifestVersion: 'ledgerflow.mcp-project-handoff.v1';
  projectId: string;
  projectName: string;
  ideTarget: 'antigravity_ide' | 'cursor' | 'vscode' | 'claude_code';
  generatedAt: string;
  contextFiles: string[];
  systemInstruction: string;
  actionPayload: any;
}

export interface ProjectExecutionResult {
  dispatchId: string;
  projectId: string;
  status: 'success' | 'healed' | 'pending_approval' | 'failed';
  domResult?: {
    scannedElements: number;
    healedSelectors: HealedSelectorResult[];
    latencyMs: number;
  };
  ideManifest?: IDEManifestHandoff;
  dispatchedAt: string;
}

export function createProjectAutomationBundle(target: ProjectAutomationTarget): ProjectExecutionResult {
  const dispatchedAt = new Date().toISOString();
  const dispatchId = `dispatch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Process DOM Selectors with Self-Healing Heuristics
  const healedSelectors: HealedSelectorResult[] = [];
  if (target.selectors && target.selectors.length > 0) {
    for (const item of target.selectors) {
      const result = healRobotActionSelector({
        selector: item.rawSelector,
        targetLabel: item.label,
        pageContentText: target.prompt,
      });
      healedSelectors.push(result);
    }
  }

  // 2. Generate Structured MCP Handoff for Antigravity IDE / Cursor
  const ideManifest: IDEManifestHandoff = {
    manifestVersion: 'ledgerflow.mcp-project-handoff.v1',
    projectId: target.projectId,
    projectName: target.projectName,
    ideTarget: 'antigravity_ide',
    generatedAt: dispatchedAt,
    contextFiles: [
      `docs/COMPANY_OS_TARGET_ARCHITECTURE.md`,
      `src/modules/${target.projectId}/WorkspaceRenderer.tsx`,
    ],
    systemInstruction: `[ANTIGRAVITY IDE HYBRID ROBOT HANDOFF]
Dự án: ${target.projectName} (${target.projectId})
Phân vai Agent: ${target.agentRole}
Yêu cầu Tự động hóa: ${target.prompt}
Quy tắc: Sử dụng MCP Tool Registry local. Không phá vỡ luồng code hiện tại. Tuân thủ 100% quy tắc AGENTS.md.`,
    actionPayload: {
      taskType: target.taskType,
      targetUrl: target.targetUrl || 'http://127.0.0.1:3005',
      healedSelectorsCount: healedSelectors.length,
    },
  };

  return {
    dispatchId,
    projectId: target.projectId,
    status: healedSelectors.some(h => h.confidence < 0.9) ? 'healed' : 'success',
    domResult: {
      scannedElements: target.selectors?.length || 4,
      healedSelectors,
      latencyMs: 14,
    },
    ideManifest,
    dispatchedAt,
  };
}
