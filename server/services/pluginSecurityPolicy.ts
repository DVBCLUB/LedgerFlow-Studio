import path from 'node:path';

export type PluginTrustLevel = 'unsigned' | 'signed' | 'sandboxed' | 'trusted';
export type PluginSandboxMode = 'simulation' | 'process' | 'container';

export interface PluginSecurityManifest {
  name: string;
  entryPoint: string;
  permissions?: string[];
  signature?: string;
  sandbox?: { enabled: boolean; mode?: PluginSandboxMode };
  trustLevel?: PluginTrustLevel;
}

export interface PluginSecurityAssessment {
  allowedForSimulation: boolean;
  allowedForHostInvocation: boolean;
  trustLevel: PluginTrustLevel;
  reasons: string[];
  requiredActions: string[];
}

const APPROVED_PLUGIN_SCOPES = new Set([
  'simulate:tool',
  'read:knowledge',
  'read:workspace',
  'write:artifact',
  'notify:founder',
]);

function inferTrustLevel(manifest: PluginSecurityManifest): PluginTrustLevel {
  if (manifest.trustLevel) return manifest.trustLevel;
  if (manifest.signature && manifest.sandbox?.enabled) return 'sandboxed';
  if (manifest.signature) return 'signed';
  return 'unsigned';
}

function hasSafeEntryPoint(entryPoint: string) {
  return Boolean(entryPoint) && !path.isAbsolute(entryPoint) && !entryPoint.split(/[\\/]+/).includes('..');
}

export function assessPluginSecurity(manifest: PluginSecurityManifest): PluginSecurityAssessment {
  const reasons: string[] = [];
  const requiredActions: string[] = [];
  const trustLevel = inferTrustLevel(manifest);
  const permissions = manifest.permissions || ['simulate:tool'];
  const unknownPermissions = permissions.filter((permission) => !APPROVED_PLUGIN_SCOPES.has(permission));

  if (!manifest.signature) {
    reasons.push('Plugin manifest is unsigned.');
    requiredActions.push('Add a signed manifest before any non-simulation invocation.');
  }

  if (!manifest.sandbox?.enabled) {
    reasons.push('Plugin sandbox is not enabled.');
    requiredActions.push('Enable sandbox mode before any non-simulation invocation.');
  }

  if (unknownPermissions.length) {
    reasons.push(`Plugin requests unapproved scopes: ${unknownPermissions.join(', ')}.`);
    requiredActions.push('Reduce plugin scopes to the approved permission set.');
  }

  if (!hasSafeEntryPoint(manifest.entryPoint)) {
    reasons.push('Plugin entry point is missing or escapes the plugin folder.');
    requiredActions.push('Use a relative entry point inside the plugin folder.');
  }

  const allowedForHostInvocation = Boolean(manifest.signature)
    && Boolean(manifest.sandbox?.enabled)
    && unknownPermissions.length === 0
    && hasSafeEntryPoint(manifest.entryPoint);

  return {
    allowedForSimulation: true,
    allowedForHostInvocation,
    trustLevel,
    reasons,
    requiredActions: [...new Set(requiredActions)],
  };
}

export function listApprovedPluginScopes() {
  return [...APPROVED_PLUGIN_SCOPES];
}
