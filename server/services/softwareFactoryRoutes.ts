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

const router = Router();

const validWorkTypes: SoftwareFactoryWorkType[] = ["planning", "coding", "qa", "media", "launch"];
const validStatuses: SoftwareFactoryRunStatus[] = ["draft", "queued", "running", "review", "complete", "blocked"];

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

router.get("/stats", (_req, res) => {
  res.json({ ok: true, stats: getSoftwareFactoryStats(), executionStats: getSoftwareFactoryExecutionStats() });
});

router.post("/seed", (_req, res) => {
  res.json({ ok: true, runs: seedSoftwareFactoryRuns(), stats: getSoftwareFactoryStats() });
});

export default router;
