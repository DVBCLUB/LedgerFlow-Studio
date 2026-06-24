export type SoftwareFactoryRunStatus = "draft" | "queued" | "running" | "review" | "complete" | "blocked";
export type SoftwareFactoryWorkType = "planning" | "coding" | "qa" | "media" | "launch";

export interface SoftwareFactoryRun {
  id: string;
  title: string;
  status: SoftwareFactoryRunStatus;
  workType: SoftwareFactoryWorkType;
  owner: string;
  input: string;
  output: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareFactoryCreateInput {
  title: string;
  workType: SoftwareFactoryWorkType;
  owner?: string;
  input: string;
  output?: string;
}

const runs = new Map<string, SoftwareFactoryRun>();

function now() {
  return new Date().toISOString();
}

function createId(prefix = "sfr") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createSoftwareFactoryRun(input: SoftwareFactoryCreateInput): SoftwareFactoryRun {
  const timestamp = now();
  const run: SoftwareFactoryRun = {
    id: createId(),
    title: input.title,
    status: "queued",
    workType: input.workType,
    owner: input.owner || "Factory Coordinator",
    input: input.input,
    output: input.output || "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  runs.set(run.id, run);
  return run;
}

export function listSoftwareFactoryRuns() {
  return Array.from(runs.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSoftwareFactoryRun(id: string) {
  return runs.get(id) || null;
}

export function updateSoftwareFactoryRunStatus(id: string, status: SoftwareFactoryRunStatus, output?: string) {
  const run = runs.get(id);
  if (!run) return null;
  const updated: SoftwareFactoryRun = {
    ...run,
    status,
    output: output ?? run.output,
    updatedAt: now(),
  };
  runs.set(id, updated);
  return updated;
}

export function getSoftwareFactoryStats() {
  const all = listSoftwareFactoryRuns();
  const byStatus = all.reduce<Record<SoftwareFactoryRunStatus, number>>((acc, run) => {
    acc[run.status] = (acc[run.status] || 0) + 1;
    return acc;
  }, { draft: 0, queued: 0, running: 0, review: 0, complete: 0, blocked: 0 });

  return {
    total: all.length,
    byStatus,
    latest: all[0] || null,
  };
}

export function seedSoftwareFactoryRuns() {
  if (runs.size > 0) return listSoftwareFactoryRuns();
  createSoftwareFactoryRun({ title: "Draft product brief", workType: "planning", owner: "Product Architect", input: "Founder idea", output: "PRD draft" });
  createSoftwareFactoryRun({ title: "Prepare repository work plan", workType: "coding", owner: "Coding Swarm", input: "PRD draft", output: "Repo work plan" });
  createSoftwareFactoryRun({ title: "Prepare launch kit", workType: "launch", owner: "Growth Automation", input: "Release notes", output: "Landing copy and video brief" });
  return listSoftwareFactoryRuns();
}
