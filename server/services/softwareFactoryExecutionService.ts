import { readSoftwareFactoryStore, writeSoftwareFactoryStore } from "./softwareFactoryStore";
import {
  getSoftwareFactoryRun,
  updateSoftwareFactoryRunStatus,
  type SoftwareFactoryRun,
} from "./softwareFactoryService";

export type SoftwareFactoryExecutionStepStatus = "pending" | "running" | "complete" | "review" | "blocked";

export interface SoftwareFactoryExecutionStep {
  id: string;
  label: string;
  status: SoftwareFactoryExecutionStepStatus;
  detail: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareFactoryExecution {
  id: string;
  runId: string;
  status: SoftwareFactoryExecutionStepStatus;
  steps: SoftwareFactoryExecutionStep[];
  log: string[];
  createdAt: string;
  updatedAt: string;
}

const EXECUTION_STORE_NAME = "executions";
const executions = new Map<string, SoftwareFactoryExecution>();

function hydrateExecutions() {
  if (executions.size > 0) return;
  for (const execution of readSoftwareFactoryStore<SoftwareFactoryExecution>(EXECUTION_STORE_NAME)) {
    executions.set(execution.id, execution);
  }
}

function persistExecutions() {
  writeSoftwareFactoryStore(EXECUTION_STORE_NAME, Array.from(executions.values()));
}

function now() {
  return new Date().toISOString();
}

function createId(prefix = "sfx") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultSteps(run: SoftwareFactoryRun): SoftwareFactoryExecutionStep[] {
  const timestamp = now();
  return [
    { id: "normalize", label: "Normalize input", status: "pending", detail: `Prepare ${run.workType} input package.`, createdAt: timestamp, updatedAt: timestamp },
    { id: "plan", label: "Prepare work plan", status: "pending", detail: "Build scoped task plan and expected outputs.", createdAt: timestamp, updatedAt: timestamp },
    { id: "run", label: "Run workspace task", status: "pending", detail: "Execute the selected safe workspace action.", createdAt: timestamp, updatedAt: timestamp },
    { id: "collect", label: "Collect result", status: "pending", detail: "Capture output summary and asset references.", createdAt: timestamp, updatedAt: timestamp },
    { id: "review", label: "Review result", status: "pending", detail: "Route result to review when needed.", createdAt: timestamp, updatedAt: timestamp },
  ];
}

export function createSoftwareFactoryExecution(runId: string) {
  hydrateExecutions();
  const run = getSoftwareFactoryRun(runId);
  if (!run) return null;

  const timestamp = now();
  const execution: SoftwareFactoryExecution = {
    id: createId(),
    runId,
    status: "pending",
    steps: createDefaultSteps(run),
    log: [`${timestamp} execution created for ${run.title}`],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  executions.set(execution.id, execution);
  persistExecutions();
  updateSoftwareFactoryRunStatus(runId, "running");
  return execution;
}

export function listSoftwareFactoryExecutions() {
  hydrateExecutions();
  return Array.from(executions.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSoftwareFactoryExecution(id: string) {
  hydrateExecutions();
  return executions.get(id) || null;
}

export function advanceSoftwareFactoryExecution(id: string) {
  hydrateExecutions();
  const execution = executions.get(id);
  if (!execution) return null;

  const timestamp = now();
  const nextStep = execution.steps.find((step) => step.status === "pending");
  if (!nextStep) {
    const completeExecution: SoftwareFactoryExecution = {
      ...execution,
      status: "complete",
      log: [...execution.log, `${timestamp} execution complete`],
      updatedAt: timestamp,
    };
    executions.set(id, completeExecution);
    persistExecutions();
    updateSoftwareFactoryRunStatus(execution.runId, "complete", "Execution completed successfully.");
    return completeExecution;
  }

  const updatedSteps = execution.steps.map((step) => {
    if (step.id !== nextStep.id) return step;
    const status: SoftwareFactoryExecutionStepStatus = step.id === "review" ? "review" : "complete";
    return { ...step, status, updatedAt: timestamp };
  });

  const status: SoftwareFactoryExecutionStepStatus = nextStep.id === "review" ? "review" : "running";
  const updated: SoftwareFactoryExecution = {
    ...execution,
    status,
    steps: updatedSteps,
    log: [...execution.log, `${timestamp} advanced step ${nextStep.label}`],
    updatedAt: timestamp,
  };
  executions.set(id, updated);
  persistExecutions();
  if (status === "review") updateSoftwareFactoryRunStatus(execution.runId, "review", "Execution is ready for review.");
  return updated;
}

export function blockSoftwareFactoryExecution(id: string, reason: string) {
  hydrateExecutions();
  const execution = executions.get(id);
  if (!execution) return null;
  const timestamp = now();
  const updated: SoftwareFactoryExecution = {
    ...execution,
    status: "blocked",
    log: [...execution.log, `${timestamp} blocked: ${reason}`],
    updatedAt: timestamp,
  };
  executions.set(id, updated);
  persistExecutions();
  updateSoftwareFactoryRunStatus(execution.runId, "blocked", reason);
  return updated;
}

export function getSoftwareFactoryExecutionStats() {
  const all = listSoftwareFactoryExecutions();
  return {
    total: all.length,
    pending: all.filter((item) => item.status === "pending").length,
    running: all.filter((item) => item.status === "running").length,
    review: all.filter((item) => item.status === "review").length,
    complete: all.filter((item) => item.status === "complete").length,
    blocked: all.filter((item) => item.status === "blocked").length,
  };
}
