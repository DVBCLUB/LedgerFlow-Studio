import { getSoftwareFactoryAssetStats } from "./softwareFactoryAssetService";
import { getSoftwareFactoryAuditStats } from "./softwareFactoryAuditLogService";
import { getSoftwareFactoryCommandStats } from "./softwareFactoryCommandRunner";
import { getSoftwareFactoryConnectorConfigStats } from "./softwareFactoryConnectorConfig";
import { getSoftwareFactoryConnectorStats } from "./softwareFactoryConnectorCatalog";
import { getSoftwareFactoryExecutionStats } from "./softwareFactoryExecutionService";
import { getSoftwareFactoryProviderStats } from "./softwareFactoryProviderRuntime";
import { getSoftwareFactoryReleaseStats } from "./softwareFactoryReleaseKitService";
import { getSoftwareFactoryStats } from "./softwareFactoryService";

export type SoftwareFactoryHealthStatus = "healthy" | "attention" | "blocked";

export interface SoftwareFactoryHealthSignal {
  id: string;
  label: string;
  status: SoftwareFactoryHealthStatus;
  value: number | string;
  detail: string;
}

function scoreStatus(signals: SoftwareFactoryHealthSignal[]): SoftwareFactoryHealthStatus {
  if (signals.some((signal) => signal.status === "blocked")) return "blocked";
  if (signals.some((signal) => signal.status === "attention")) return "attention";
  return "healthy";
}

export function getSoftwareFactoryHealthSummary() {
  const runStats = getSoftwareFactoryStats();
  const executionStats = getSoftwareFactoryExecutionStats();
  const providerStats = getSoftwareFactoryProviderStats();
  const connectorStats = getSoftwareFactoryConnectorStats();
  const connectorConfigStats = getSoftwareFactoryConnectorConfigStats();
  const releaseStats = getSoftwareFactoryReleaseStats();
  const assetStats = getSoftwareFactoryAssetStats();
  const commandStats = getSoftwareFactoryCommandStats();
  const auditStats = getSoftwareFactoryAuditStats();

  const signals: SoftwareFactoryHealthSignal[] = [
    {
      id: "runs",
      label: "Runs",
      status: (runStats.byStatus.blocked || 0) > 0 ? "blocked" : (runStats.byStatus.review || 0) > 0 ? "attention" : "healthy",
      value: runStats.total,
      detail: `${runStats.byStatus.queued || 0} queued / ${runStats.byStatus.review || 0} review / ${runStats.byStatus.blocked || 0} blocked`,
    },
    {
      id: "executions",
      label: "Executions",
      status: executionStats.blocked > 0 ? "blocked" : executionStats.review > 0 ? "attention" : "healthy",
      value: executionStats.total,
      detail: `${executionStats.running} running / ${executionStats.review} review / ${executionStats.complete} complete`,
    },
    {
      id: "providers",
      label: "Providers",
      status: providerStats.healthy === 0 ? "blocked" : providerStats.paused > 0 || providerStats.limited > 0 ? "attention" : "healthy",
      value: providerStats.total,
      detail: `${providerStats.healthy} healthy / ${providerStats.limited} limited / ${providerStats.paused} paused`,
    },
    {
      id: "connectors",
      label: "Connectors",
      status: connectorConfigStats.configured === 0 && connectorConfigStats.notRequired === 0 ? "blocked" : connectorConfigStats.missing > 0 ? "attention" : "healthy",
      value: connectorStats.total,
      detail: `${connectorConfigStats.configured} configured / ${connectorConfigStats.missing} missing / ${connectorConfigStats.notRequired} not required`,
    },
    {
      id: "commands",
      label: "Commands",
      status: commandStats.failed > 0 ? "blocked" : commandStats.running > 0 ? "attention" : "healthy",
      value: commandStats.total,
      detail: `${commandStats.complete} complete / ${commandStats.failed} failed / ${commandStats.running} running`,
    },
    {
      id: "assets",
      label: "Assets",
      status: assetStats.total === 0 ? "attention" : "healthy",
      value: assetStats.total,
      detail: `${assetStats.byStatus.stored || 0} stored / ${assetStats.byStatus.checked || 0} checked`,
    },
    {
      id: "release",
      label: "Release Kit",
      status: releaseStats.total === 0 ? "attention" : (releaseStats.byStatus.review || 0) > 0 ? "attention" : "healthy",
      value: releaseStats.total,
      detail: `${releaseStats.byStatus.ready || 0} ready / ${releaseStats.byStatus.review || 0} review / ${releaseStats.byStatus.complete || 0} complete`,
    },
    {
      id: "audit",
      label: "Audit",
      status: auditStats.error > 0 ? "blocked" : auditStats.warning > 0 ? "attention" : "healthy",
      value: auditStats.total,
      detail: `${auditStats.success} success / ${auditStats.warning} warning / ${auditStats.error} error`,
    },
  ];

  const status = scoreStatus(signals);
  const readiness = Math.round((signals.filter((signal) => signal.status === "healthy").length / signals.length) * 100);

  return {
    status,
    readiness,
    checkedAt: new Date().toISOString(),
    signals,
  };
}
