import { appendAuditEvent } from './auditLog.ts';
import { assessPluginSecurity, type PluginSecurityAssessment, type PluginSecurityManifest } from './pluginSecurityPolicy.ts';

export interface PluginInvocationRequest {
  pluginId: string;
  pluginName: string;
  capability: string;
  description?: string;
  params?: Record<string, unknown>;
  manifest: PluginSecurityManifest;
}

export interface PluginInvocationDecision {
  allowed: boolean;
  mode: 'simulation' | 'blocked' | 'sandbox_required';
  output: string;
  assessment: PluginSecurityAssessment;
}

function countParams(params: Record<string, unknown> | undefined) {
  return params ? Object.keys(params).length : 0;
}

export function decidePluginInvocation(input: PluginInvocationRequest): PluginInvocationDecision {
  const assessment = assessPluginSecurity(input.manifest);
  if (!assessment.allowedForHostInvocation) {
    return {
      allowed: false,
      mode: 'simulation',
      output: `[Plugin ${input.pluginName}] ${input.capability}: ${input.description || 'Capability preview'}. Simulation only with ${countParams(input.params)} params. Required actions: ${assessment.requiredActions.join(' ') || 'No additional action.'}`,
      assessment,
    };
  }

  return {
    allowed: true,
    mode: 'sandbox_required',
    output: `[Plugin ${input.pluginName}] ${input.capability}: security policy passed. Invocation must be delegated to the reviewed sandbox boundary.`,
    assessment,
  };
}

export async function auditPluginInvocationDecision(input: PluginInvocationRequest, decision: PluginInvocationDecision) {
  await appendAuditEvent({
    actor: 'system',
    workspace: 'Plugin System',
    action: decision.allowed ? 'plugin.invoke.sandbox_required' : 'plugin.invoke.simulation_only',
    target: input.pluginName,
    risk: decision.allowed ? 'MEDIUM' : 'HIGH',
    status: decision.allowed ? 'pending_approval' : 'sandbox',
    summary: decision.output,
    connectorId: 'plugin-system',
    evidence: {
      pluginId: input.pluginId,
      capability: input.capability,
      mode: decision.mode,
      assessment: decision.assessment,
    },
  });
}
