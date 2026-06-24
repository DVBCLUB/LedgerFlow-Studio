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

const router = Router();

const validWorkTypes: SoftwareFactoryWorkType[] = ["planning", "coding", "qa", "media", "launch"];
const validStatuses: SoftwareFactoryRunStatus[] = ["draft", "queued", "running", "review", "complete", "blocked"];
const validProviderHealth: SoftwareFactoryProviderHealth[] = ["healthy", "limited", "paused"];
const validReleaseChannels: SoftwareFactoryReleaseChannel[] = ["landing_page", "short_video", "store_listing", "creative_pack", "email_draft", "social_draft"];
const validReleaseStatuses: SoftwareFactoryReleaseStatus[] = ["draft", "ready", "review", "scheduled", "complete"];

router.get("/runs", (_req, res) => {
  res.json({ ok: true, runs: listSoftwareFactoryRuns(), stats: getSoftwareFactoryStats() });
});

router.post("/runs", (req, res) => {
  const { title, workType, owner, input, output } = req.body || {};
  if (!title || !input || !validWorkTypes.includes(workType)) {
    return res.status(400).json({ ok: false, error: "title, input and valid workType are required" });
  }

  const run = createSoftwareFactoryRun({ title, workType, owner, input, output });
  return res.status(201).json({ ok: true, run });
});

router.get("/runs/:id", (req, res) => {
  const run = getSoftwareFactoryRun(req.params.id);
  if (!run) return res.status(404).json({ ok: false, error: "run not found" });
  return res.json({ ok: true, run });
});

router.patch("/runs/:id/status", (req, res) => {
  const { status, output } = req.body || {};
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ ok: false, error: "valid status is required" });
  }
  const run = updateSoftwareFactoryRunStatus(req.params.id, status, output);
  if (!run) return res.status(404).json({ ok: false, error: "run not found" });
  return res.json({ ok: true, run });
});

router.post("/runs/:id/executions", (req, res) => {
  const execution = createSoftwareFactoryExecution(req.params.id);
  if (!execution) return res.status(404).json({ ok: false, error: "run not found" });
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
  return res.json({ ok: true, execution });
});

router.post("/executions/:id/block", (req, res) => {
  const { reason } = req.body || {};
  const execution = blockSoftwareFactoryExecution(req.params.id, reason || "blocked by operator");
  if (!execution) return res.status(404).json({ ok: false, error: "execution not found" });
  return res.json({ ok: true, execution });
});

router.get("/providers", (_req, res) => {
  res.json({ ok: true, profiles: listSoftwareFactoryProviderProfiles(), stats: getSoftwareFactoryProviderStats() });
});

router.post("/providers/choose", (req, res) => {
  const { workKind } = req.body || {};
  if (!validWorkTypes.includes(workKind)) return res.status(400).json({ ok: false, error: "valid workKind is required" });
  const decision = chooseSoftwareFactoryProvider(workKind as SoftwareFactoryWorkKind);
  return res.json({ ok: true, decision });
});

router.patch("/providers/:id/health", (req, res) => {
  const { health } = req.body || {};
  if (!validProviderHealth.includes(health)) return res.status(400).json({ ok: false, error: "valid health is required" });
  const profile = setSoftwareFactoryProviderHealth(req.params.id, health);
  if (!profile) return res.status(404).json({ ok: false, error: "provider profile not found" });
  return res.json({ ok: true, profile, stats: getSoftwareFactoryProviderStats() });
});

router.get("/release-kit", (_req, res) => {
  res.json({ ok: true, items: listSoftwareFactoryReleaseItems(), stats: getSoftwareFactoryReleaseStats() });
});

router.post("/release-kit", (req, res) => {
  const { runId, channel, title, owner, deliverable, notes } = req.body || {};
  if (!runId || !title || !deliverable || !validReleaseChannels.includes(channel)) {
    return res.status(400).json({ ok: false, error: "runId, title, deliverable and valid channel are required" });
  }
  const item = createSoftwareFactoryReleaseItem({ runId, channel, title, owner, deliverable, notes });
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
  return res.json({ ok: true, item, stats: getSoftwareFactoryReleaseStats() });
});

router.post("/release-kit/seed", (req, res) => {
  const { runId } = req.body || {};
  res.json({ ok: true, items: seedSoftwareFactoryReleaseItems(runId || "sample-run"), stats: getSoftwareFactoryReleaseStats() });
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
    res.json({ ok: true, result: await createSoftwareFactoryWorkBranch(branchName) });
  } catch (err: any) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

router.post("/git/commit-draft", async (_req, res) => {
  try {
    res.json({ ok: true, draft: await prepareSoftwareFactoryCommitDraft() });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.post("/git/pr-draft", async (req, res) => {
  try {
    const { base } = req.body || {};
    res.json({ ok: true, draft: await prepareSoftwareFactoryPullRequestDraft(base || "main") });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get("/stats", (_req, res) => {
  res.json({ ok: true, stats: getSoftwareFactoryStats(), executionStats: getSoftwareFactoryExecutionStats(), providerStats: getSoftwareFactoryProviderStats(), releaseStats: getSoftwareFactoryReleaseStats() });
});

router.post("/seed", (_req, res) => {
  res.json({ ok: true, runs: seedSoftwareFactoryRuns(), stats: getSoftwareFactoryStats() });
});

export default router;
