import { Router } from "express";
import {
  createSoftwareFactoryRun,
  getSoftwareFactoryRun,
  getSoftwareFactoryStats,
  listSoftwareFactoryRuns,
  seedSoftwareFactoryRuns,
  updateSoftwareFactoryRunStatus,
  type SoftwareFactoryRunStatus,
  type SoftwareFactoryWorkType,
} from "./softwareFactoryService";
import {
  advanceSoftwareFactoryExecution,
  attachProviderDecisionToExecution,
  blockSoftwareFactoryExecution,
  createSoftwareFactoryExecution,
  getSoftwareFactoryExecution,
  getSoftwareFactoryExecutionStats,
  listSoftwareFactoryExecutions,
} from "./softwareFactoryExecutionService";
import {
  createSoftwareFactoryWorkBranch,
  getSoftwareFactoryGitRunnerStatus,
  prepareSoftwareFactoryCommitDraft,
  prepareSoftwareFactoryPullRequestDraft,
} from "./softwareFactoryGitRunner";
import {
  chooseSoftwareFactoryProvider,
  getSoftwareFactoryProviderStats,
  listSoftwareFactoryProviderProfiles,
  setSoftwareFactoryProviderHealth,
  type SoftwareFactoryProviderHealth,
  type SoftwareFactoryWorkKind,
} from "./softwareFactoryProviderRuntime";
import {
  createSoftwareFactoryReleaseItem,
  getSoftwareFactoryReleaseItem,
  getSoftwareFactoryReleaseStats,
  listSoftwareFactoryReleaseItems,
  seedSoftwareFactoryReleaseItems,
  updateSoftwareFactoryReleaseStatus,
  type SoftwareFactoryReleaseChannel,
  type SoftwareFactoryReleaseStatus,
} from "./softwareFactoryReleaseKitService";
import {
  createSoftwareFactoryAsset,
  getSoftwareFactoryAsset,
  getSoftwareFactoryAssetStats,
  listSoftwareFactoryAssets,
  readSoftwareFactoryAssetContent,
  seedSoftwareFactoryAssets,
  updateSoftwareFactoryAssetStatus,
  type SoftwareFactoryAssetKind,
  type SoftwareFactoryAssetStatus,
} from "./softwareFactoryAssetService";
import {
  getSoftwareFactoryCommandRun,
  getSoftwareFactoryCommandStats,
  listSoftwareFactoryCommandCatalog,
  listSoftwareFactoryCommandRuns,
  runSoftwareFactoryCommand,
  type SoftwareFactoryCommandKind,
} from "./softwareFactoryCommandRunner";
import {
  getSoftwareFactoryAuditEvent,
  getSoftwareFactoryAuditStats,
  listSoftwareFactoryAuditEvents,
  recordSoftwareFactoryAuditEvent,
  seedSoftwareFactoryAuditEvents,
  type SoftwareFactoryAuditArea,
  type SoftwareFactoryAuditLevel,
} from "./softwareFactoryAuditLogService";
import { getSoftwareFactoryHealthSummary } from "./softwareFactoryHealthService";

const router = Router();

const validWorkTypes: SoftwareFactoryWorkType[] = ["planning", "coding", "qa", "media", "launch"];
const validStatuses: SoftwareFactoryRunStatus[] = ["draft", "queued", "running", "review", "complete", "blocked"];
const validProviderHealth: SoftwareFactoryProviderHealth[] = ["healthy", "limited", "paused"];
const validReleaseChannels: SoftwareFactoryReleaseChannel[] = ["landing_page", "short_video", "store_listing", "creative_pack", "email_draft", "social_draft"];
const validReleaseStatuses: SoftwareFactoryReleaseStatus[] = ["draft", "ready", "review", "scheduled", "complete"];
const validAssetKinds: SoftwareFactoryAssetKind[] = ["code", "package", "media", "document", "release", "log"];
const validAssetStatuses: SoftwareFactoryAssetStatus[] = ["new", "checked", "linked", "stored"];
const validCommandKinds: SoftwareFactoryCommandKind[] = ["typecheck", "lint", "test", "build", "preview"];
const validAuditAreas: SoftwareFactoryAuditArea[] = ["run", "execution", "provider", "asset", "release", "command", "git", "system"];
const validAuditLevels: SoftwareFactoryAuditLevel[] = ["info", "success", "warning", "error"];

router.get("/health-summary", (_req, res) => {
  res.json({ ok: true, health: getSoftwareFactoryHealthSummary() });
});

router.get("/runs", (_req, res) => {
  res.json({ ok: true, runs: listSoftwareFactoryRuns(), stats: getSoftwareFactoryStats() });
});

router.post("/runs", (req, res) => {
  const { title, workType, owner, input, output } = req.body || {};
  if (!title || !input || !validWorkTypes.includes(workType)) return res.status(400).json({ ok: false, error: "title, input and valid workType are required" });
  const run = createSoftwareFactoryRun({ title, workType, owner, input, output });
  recordSoftwareFactoryAuditEvent({ area: "run", level: "success", title: "Run created", detail: run.title, entityId: run.id });
  return res.status(201).json({ ok: true, run });
});

router.get("/runs/:id", (req, res) => {
  const run = getSoftwareFactoryRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "run not found" });
  return res.json({ ok: true, run });
});

router.patch("/runs/:id/status", (req, res) => {
  const { status, output } = req.body || {};
  if (!validStatuses.includes(status)) return res.status(400).json({ ok: false, error: "valid status is required" });
  const run = updateSoftwareFactoryRunStatus(req.params.id, status, output);
  if (!run) return res.status(404).json({ ok: false, error: "run not found" });
  recordSoftwareFactoryAuditEvent({ area: "run", level: status === "blocked" ? "warning" : "info", title: "Run status updated", detail: `${run.title} -> ${status}`, entityId: run.id });
  return res.json({ ok: true, run });
});

router.post("/runs/:id/executions", (req, res) => {
  const execution = createSoftwareFactoryExecution(req.params.id);
  if (!execution) return res.status(404).json({ ok: false, error: "run not found" });
  recordSoftwareFactoryAuditEvent({ area: "execution", level: "success", title: "Execution created", detail: `Execution created for run ${req.params.id}`, entityId: execution.id });
  return res.status(201).json({ ok: true, execution });
});

router.get("/executions", (_req, res) => {
  res.json({ ok: true, executions: listSoftwareFactoryExecutions(), stats: getSoftwareFactoryExecutionStats() });
});

router.get("/executions/:id", (req, res) => {
  const execution = getSoftwareFactoryExecution(req.params.id);
  if (!execution) return res.status(404).json({ ok: false, error: "execution not found" });
  return res.json({ ok: true, execution });
});

router.post("/executions/:id/advance", (req, res) => {
  const execution = advanceSoftwareFactoryExecution(req.params.id);
  if (!execution) return res.status(404).json({ ok: false, error: "execution not found" });
  recordSoftwareFactoryAuditEvent({ area: "execution", level: execution.status === "review" ? "warning" : "info", title: "Execution advanced", detail: `Execution is now ${execution.status}`, entityId: execution.id });
  return res.json({ ok: true, execution });
});

router.post("/executions/:id/provider-decision", (req, res) => {
  const { workKind } = req.body || {};
  if (workKind && !validWorkTypes.includes(workKind)) return res.status(400).json({ ok: false, error: "valid workKind is required" });
  const execution = attachProviderDecisionToExecution(req.params.id, workKind as SoftwareFactoryWorkKind | undefined);
  if (!execution) return res.status(404).json({ ok: false, error: "execution not found" });
  recordSoftwareFactoryAuditEvent({ area: "provider", level: execution.providerDecision?.reviewRequired ? "warning" : "success", title: "Provider decision attached", detail: execution.providerDecision?.reason || "Provider decision refreshed", entityId: execution.id });
  return res.json({ ok: true, execution });
});

router.post("/executions/:id/block", (req, res) => {
  const { reason } = req.body || {};
  const execution = blockSoftwareFactoryExecution(req.params.id, reason || "blocked by operator");
  if (!execution) return res.status(404).json({ ok: false, error: "execution not found" });
  recordSoftwareFactoryAuditEvent({ area: "execution", level: "warning", title: "Execution blocked", detail: reason || "blocked by operator", entityId: execution.id });
  return res.json({ ok: true, execution });
});

router.get("/audit", (req, res) => {
  const area = req.query.area as SoftwareFactoryAuditArea | undefined;
  if (area && !validAuditAreas.includes(area)) return res.status(400).json({ ok: false, error: "valid audit area is required" });
  res.json({ ok: true, events: listSoftwareFactoryAuditEvents(area), stats: getSoftwareFactoryAuditStats() });
});

router.post("/audit", (req, res) => {
  const { area, level, title, detail, entityId, metadata } = req.body || {};
  if (!validAuditAreas.includes(area) || (level && !validAuditLevels.includes(level)) || !title || !detail) return res.status(400).json({ ok: false, error: "area, title and detail are required" });
  const event = recordSoftwareFactoryAuditEvent({ area, level, title, detail, entityId, metadata });
  return res.status(201).json({ ok: true, event, stats: getSoftwareFactoryAuditStats() });
});

router.get("/audit/:id", (req, res) => {
  const event = getSoftwareFactoryAuditEvent(req.params.id);
  if (!event) return res.status(404).json({ ok: false, error: "audit event not found" });
  return res.json({ ok: true, event });
});

router.post("/audit/seed", (_req, res) => {
  res.json({ ok: true, events: seedSoftwareFactoryAuditEvents(), stats: getSoftwareFactoryAuditStats() });
});

router.get("/commands/catalog", (_req, res) => {
  res.json({ ok: true, catalog: listSoftwareFactoryCommandCatalog() });
});

router.get("/commands", (_req, res) => {
  res.json({ ok: true, runs: listSoftwareFactoryCommandRuns(), stats: getSoftwareFactoryCommandStats() });
});

router.post("/commands/run", async (req, res) => {
  const { kind, commandIndex } = req.body || {};
  if (!validCommandKinds.includes(kind)) return res.status(400).json({ ok: false, error: "valid command kind is required" });
  const run = await runSoftwareFactoryCommand(kind, typeof commandIndex === "number" ? commandIndex : 0);
  if (!run) return res.status(400).json({ ok: false, error: "command is not available" });
  recordSoftwareFactoryAuditEvent({ area: "command", level: run.status === "complete" ? "success" : "error", title: "Command finished", detail: `${run.command} -> ${run.status}`, entityId: run.id });
  return res.json({ ok: true, run, stats: getSoftwareFactoryCommandStats() });
});

router.get("/commands/:id", (req, res) => {
  const run = getSoftwareFactoryCommandRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "command run not found" });
  return res.json({ ok: true, run });
});

router.get("/providers", (_req, res) => {
  res.json({ ok: true, profiles: listSoftwareFactoryProviderProfiles(), stats: getSoftwareFactoryProviderStats() });
});

router.post("/providers/choose", (req, res) => {
  const { workKind } = req.body || {};
  if (!validWorkTypes.includes(workKind)) return res.status(400).json({ ok: false, error: "valid workKind is required" });
  const decision = chooseSoftwareFactoryProvider(workKind as SoftwareFactoryWorkKind);
  recordSoftwareFactoryAuditEvent({ area: "provider", level: decision.reviewRequired ? "warning" : "success", title: "Provider selected", detail: decision.reason });
  return res.json({ ok: true, decision });
});

router.patch("/providers/:id/health", (req, res) => {
  const { health } = req.body || {};
  if (!validProviderHealth.includes(health)) return res.status(400).json({ ok: false, error: "valid health is required" });
  const profile = setSoftwareFactoryProviderHealth(req.params.id, health);
  if (!profile) return res.status(404).json({ ok: false, error: "provider profile not found" });
  recordSoftwareFactoryAuditEvent({ area: "provider", level: health === "paused" ? "warning" : "info", title: "Provider health updated", detail: `${profile.label} -> ${health}`, entityId: profile.id });
  return res.json({ ok: true, profile, stats: getSoftwareFactoryProviderStats() });
});

router.get("/assets", (_req, res) => {
  res.json({ ok: true, assets: listSoftwareFactoryAssets(), stats: getSoftwareFactoryAssetStats() });
});

router.post("/assets", (req, res) => {
  const { runId, kind, title, fileName, content, notes } = req.body || {};
  if (!runId || !title || typeof content !== "string" || !validAssetKinds.includes(kind)) return res.status(400).json({ ok: false, error: "runId, title, content and valid kind are required" });
  const asset = createSoftwareFactoryAsset({ runId, kind, title, fileName, content, notes });
  recordSoftwareFactoryAuditEvent({ area: "asset", level: "success", title: "Asset stored", detail: asset.title, entityId: asset.id });
  return res.status(201).json({ ok: true, asset, stats: getSoftwareFactoryAssetStats() });
});

router.get("/assets/:id", (req, res) => {
  const asset = getSoftwareFactoryAsset(req.params.id);
  if (!asset) return res.status(404).json({ ok: false, error: "asset not found" });
  return res.json({ ok: true, asset });
});

router.get("/assets/:id/content", (req, res) => {
  const result = readSoftwareFactoryAssetContent(req.params.id);
  if (!result) return res.status(404).json({ ok: false, error: "asset not found" });
  return res.json({ ok: true, ...result });
});

router.patch("/assets/:id/status", (req, res) => {
  const { status, notes } = req.body || {};
  if (!validAssetStatuses.includes(status)) return res.status(400).json({ ok: false, error: "valid status is required" });
  const asset = updateSoftwareFactoryAssetStatus(req.params.id, status, notes);
  if (!asset) return res.status(404).json({ ok: false, error: "asset not found" });
  recordSoftwareFactoryAuditEvent({ area: "asset", level: "info", title: "Asset status updated", detail: `${asset.title} -> ${status}`, entityId: asset.id });
  return res.json({ ok: true, asset, stats: getSoftwareFactoryAssetStats() });
});

router.post("/assets/seed", (req, res) => {
  const { runId } = req.body || {};
  const assets = seedSoftwareFactoryAssets(runId || "sample-run");
  recordSoftwareFactoryAuditEvent({ area: "asset", level: "success", title: "Asset seed completed", detail: `${assets.length} assets available` });
  res.json({ ok: true, assets, stats: getSoftwareFactoryAssetStats() });
});

router.get("/release-kit", (_req, res) => {
  res.json({ ok: true, items: listSoftwareFactoryReleaseItems(), stats: getSoftwareFactoryReleaseStats() });
});

router.post("/release-kit", (req, res) => {
  const { runId, channel, title, owner, deliverable, notes } = req.body || {};
  if (!runId || !title || !deliverable || !validReleaseChannels.includes(channel)) return res.status(400).json({ ok: false, error: "runId, title, deliverable and valid channel are required" });
  const item = createSoftwareFactoryReleaseItem({ runId, channel, title, owner, deliverable, notes });
  recordSoftwareFactoryAuditEvent({ area: "release", level: "success", title: "Release item created", detail: item.title, entityId: item.id });
  return res.status(201).json({ ok: true, item, stats: getSoftwareFactoryReleaseStats() });
});

router.get("/release-kit/:id", (req, res) => {
  const item = getSoftwareFactoryReleaseItem(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: "release item not found" });
  return res.json({ ok: true, item });
});

router.patch("/release-kit/:id/status", (req, res) => {
  const { status, notes } = req.body || {};
  if (!validReleaseStatuses.includes(status)) return res.status(400).json({ ok: false, error: "valid status is required" });
  const item = updateSoftwareFactoryReleaseStatus(req.params.id, status, notes);
  if (!item) return res.status(404).json({ ok: false, error: "release item not found" });
  recordSoftwareFactoryAuditEvent({ area: "release", level: status === "review" ? "warning" : "info", title: "Release status updated", detail: `${item.title} -> ${status}`, entityId: item.id });
  return res.json({ ok: true, item, stats: getSoftwareFactoryReleaseStats() });
});

router.post("/release-kit/seed", (req, res) => {
  const { runId } = req.body || {};
  const items = seedSoftwareFactoryReleaseItems(runId || "sample-run");
  recordSoftwareFactoryAuditEvent({ area: "release", level: "success", title: "Release kit seed completed", detail: `${items.length} release items available` });
  res.json({ ok: true, items, stats: getSoftwareFactoryReleaseStats() });
});

router.get("/git/status", async (_req, res) => {
  try {
    res.json({ ok: true, runner: await getSoftwareFactoryGitRunnerStatus() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/git/branch", async (req, res) => {
  try {
    const { branchName } = req.body || {};
    if (!branchName) return res.status(400).json({ ok: false, error: "branchName is required" });
    const result = await createSoftwareFactoryWorkBranch(branchName);
    recordSoftwareFactoryAuditEvent({ area: "git", level: "success", title: "Branch created", detail: branchName });
    res.json({ ok: true, result });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post("/git/commit-draft", async (_req, res) => {
  try {
    const draft = await prepareSoftwareFactoryCommitDraft();
    recordSoftwareFactoryAuditEvent({ area: "git", level: "info", title: "Commit draft prepared", detail: "Git runner prepared a commit message draft." });
    res.json({ ok: true, draft });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/git/pr-draft", async (req, res) => {
  try {
    const { base } = req.body || {};
    const draft = await prepareSoftwareFactoryPullRequestDraft(base || "main");
    recordSoftwareFactoryAuditEvent({ area: "git", level: "info", title: "PR draft prepared", detail: `Base ${base || "main"}` });
    res.json({ ok: true, draft });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/stats", (_req, res) => {
  res.json({ ok: true, stats: getSoftwareFactoryStats(), executionStats: getSoftwareFactoryExecutionStats(), providerStats: getSoftwareFactoryProviderStats(), releaseStats: getSoftwareFactoryReleaseStats(), assetStats: getSoftwareFactoryAssetStats(), commandStats: getSoftwareFactoryCommandStats(), auditStats: getSoftwareFactoryAuditStats(), health: getSoftwareFactoryHealthSummary() });
});

router.post("/seed", (_req, res) => {
  const runs = seedSoftwareFactoryRuns();
  recordSoftwareFactoryAuditEvent({ area: "run", level: "success", title: "Run seed completed", detail: `${runs.length} runs available` });
  res.json({ ok: true, runs, stats: getSoftwareFactoryStats() });
});

export default router;
