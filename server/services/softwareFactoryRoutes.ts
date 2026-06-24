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

router.get("/stats", (_req, res) => {
  res.json({ ok: true, stats: getSoftwareFactoryStats() });
});

router.post("/seed", (_req, res) => {
  res.json({ ok: true, runs: seedSoftwareFactoryRuns(), stats: getSoftwareFactoryStats() });
});

export default router;
