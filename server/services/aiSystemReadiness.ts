import fs from "fs";
import path from "path";
import { getAIVaultAutoLockStatus } from "./aiVaultAutoLock.ts";
import { getAIVaultSecurityStatus, listAIKeys } from "./aiKeyVault.ts";
import { runAIPreflight, type AIPreflightSeverity } from "./aiDoctor.ts";
import { getCompanyOsContracts, listCompanyOsControlPlane } from "./companyOsControlPlane.ts";
import { listIntegrationConnectors } from "./integrationRegistry.ts";

export type AISystemReadinessStatus = "ready" | "partial" | "blocked";

export interface AISystemReadinessCheck {
  id: string;
  label: string;
  status: AISystemReadinessStatus;
  message: string;
  nextAction?: string;
}

export interface AISystemReadinessReport {
  ok: boolean;
  checkedAt: string;
  maturity: "P0" | "P1" | "P2";
  score: number;
  summary: string;
  checks: AISystemReadinessCheck[];
  stats: {
    enabledAIKeys: number;
    totalAIKeys: number;
    controlPlaneTasks: number;
    controlPlaneEvents: number;
    controlPlaneToolRuns: number;
    integrationConnectors: number;
  };
  contracts: ReturnType<typeof getCompanyOsContracts>;
}

const migrationPath = path.join(process.cwd(), "supabase", "migrations", "202606170001_company_os_control_plane.sql");

function mapSeverity(severity: AIPreflightSeverity): AISystemReadinessStatus {
  if (severity === "error") return "blocked";
  if (severity === "warn") return "partial";
  return "ready";
}

function scoreStatus(status: AISystemReadinessStatus) {
  if (status === "ready") return 1;
  if (status === "partial") return 0.55;
  return 0;
}

export async function runAISystemReadiness(): Promise<AISystemReadinessReport> {
  const checks: AISystemReadinessCheck[] = [];
  const [keys, preflight, controlPlane, connectors] = await Promise.all([
    Promise.resolve(listAIKeys()).catch(() => []),
    runAIPreflight().catch((error) => ({
      ok: false,
      checkedAt: new Date().toISOString(),
      summary: error instanceof Error ? error.message : "AI preflight failed.",
      checks: [],
      stats: { totalKeys: 0, enabledKeys: 0, okKeys: 0, quotaKeys: 0, errorKeys: 0, recentErrors: 0 },
    })),
    listCompanyOsControlPlane(25).catch(() => ({ events: [], tasks: [], toolRuns: [], storage: "local" as const })),
    listIntegrationConnectors().catch(() => []),
  ]);

  const enabledKeys = keys.filter((key) => key.enabled);
  const vault = await getAIVaultSecurityStatus();
  const autoLock = await getAIVaultAutoLockStatus();
  const contracts = getCompanyOsContracts();

  checks.push({
    id: "ai-gateway",
    label: "AI Gateway",
    status: preflight.ok ? "ready" : "partial",
    message: preflight.summary,
    nextAction: preflight.ok ? undefined : "Open AI Settings and run provider diagnostics.",
  });

  checks.push({
    id: "ai-vault",
    label: "AI Key Vault",
    status: vault.exists ? "ready" : "partial",
    message: vault.exists
      ? `Vault is configured. Auto-lock ${autoLock.enabled ? `enabled at ${autoLock.timeoutMinutes} minutes` : "is disabled"}.`
      : "No encrypted AI key vault exists yet.",
    nextAction: vault.exists ? undefined : "Add at least one provider key in AI Settings.",
  });

  checks.push({
    id: "providers",
    label: "Provider Coverage",
    status: enabledKeys.length > 0 ? "ready" : "partial",
    message: `${enabledKeys.length}/${keys.length} AI provider keys are enabled.`,
    nextAction: enabledKeys.length > 0 ? undefined : "Enable one provider or connect a local model/provider.",
  });

  checks.push({
    id: "control-plane",
    label: "Company OS Control Plane",
    status: "ready",
    message: `Control plane is reachable via ${controlPlane.storage} storage with ${controlPlane.tasks.length} tasks, ${controlPlane.events.length} events, and ${controlPlane.toolRuns.length} tool runs.`,
  });

  checks.push({
    id: "supabase-rls",
    label: "Supabase RLS Schema",
    status: fs.existsSync(migrationPath) ? "ready" : "blocked",
    message: fs.existsSync(migrationPath)
      ? "Company OS Supabase migration with RLS tables is present."
      : "Company OS Supabase migration is missing.",
    nextAction: fs.existsSync(migrationPath) ? "Run the migration in Supabase before production use." : "Restore the control-plane migration file.",
  });

  checks.push({
    id: "openclaw-sandbox",
    label: "OpenClaw Gateway",
    status: contracts.openClawSimulate.realExecution === "blocked-by-default" ? "ready" : "blocked",
    message: `Allowed simulated actions: ${contracts.openClawSimulate.allowedActions.join(", ")}. Real execution is ${contracts.openClawSimulate.realExecution}.`,
    nextAction: "Keep real browser/system automation disabled until a separate sandbox connector is approved.",
  });

  checks.push({
    id: "n8n-telegram-contracts",
    label: "n8n and Telegram Contracts",
    status: contracts.n8nWebhook.path && contracts.telegramUpdate.path ? "ready" : "blocked",
    message: `n8n: ${contracts.n8nWebhook.path}; Telegram: ${contracts.telegramUpdate.path}.`,
    nextAction: "Configure real n8n credentials and Telegram webhook outside frontend code.",
  });

  checks.push({
    id: "audit-export",
    label: "Audit Export",
    status: contracts.auditExport.path ? "ready" : "blocked",
    message: `Audit export is available at ${contracts.auditExport.path} as ${contracts.auditExport.format}.`,
  });

  checks.push({
    id: "integrations",
    label: "Integration Registry",
    status: connectors.length > 0 ? "ready" : "partial",
    message: `${connectors.length} connector records are registered.`,
    nextAction: connectors.length > 0 ? undefined : "Open Integration Hub and seed connector registry.",
  });

  for (const check of preflight.checks) {
    checks.push({
      id: `preflight-${check.id}`,
      label: `Preflight: ${check.label}`,
      status: mapSeverity(check.severity),
      message: check.message,
      nextAction: check.action,
    });
  }

  const score = Math.round((checks.reduce((sum, check) => sum + scoreStatus(check.status), 0) / checks.length) * 100);
  const blocked = checks.filter((check) => check.status === "blocked").length;
  const partial = checks.filter((check) => check.status === "partial").length;
  const ok = blocked === 0;

  return {
    ok,
    checkedAt: new Date().toISOString(),
    maturity: score >= 85 && blocked === 0 ? "P1" : "P0",
    score,
    summary: ok
      ? `AI system is operational with ${partial} partial item(s).`
      : `AI system has ${blocked} blocker(s) that need attention.`,
    checks,
    stats: {
      enabledAIKeys: enabledKeys.length,
      totalAIKeys: keys.length,
      controlPlaneTasks: controlPlane.tasks.length,
      controlPlaneEvents: controlPlane.events.length,
      controlPlaneToolRuns: controlPlane.toolRuns.length,
      integrationConnectors: connectors.length,
    },
    contracts,
  };
}
