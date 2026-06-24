import { readSoftwareFactoryStore, writeSoftwareFactoryStore } from "./softwareFactoryStore";
import {
  getSoftwareFactoryRun,
  updateSoftwareFactoryRunStatus,
  type SoftwareFactoryRun,
} from "./softwareFactoryService";
import {
  chooseSoftwareFactoryProvider,
  type SoftwareFactoryProviderRuntimeDecision,
  type SoftwareFactoryWorkKind,
} from "./softwareFactoryProviderRuntime";

export type SoftwareFactoryExecutionStepStatus = "pending" | "running" | "complete" | "review" | "blocked";

export interface SoftwareFactoryExecutionStep {
  id: string;
  label: string;
  status: SoftwareFactoryExecutionStepStatus;
  detail: string;
  providerProfileId?: string;
  providerLabel?: string;
  providerReason?: string;
  reviewRequired?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareFactoryExecution {
  id: string;
  runId: string;
  status: SoftwareFactoryExecutionStepStatus;
  steps: SoftwareFactoryExecutionStep[];
  providerDecision?: SoftwareFactoryProviderRuntimeDecision;
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

function normalizeWorkKind(workType: string): SoftwareFactoryWorkKind {
  return ["planning", "coding", "qa", "media", "launch"].includes(workType) ? workType as SoftwareFactoryWorkKind : "planning";
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

function decorateStepWithProvider(step: SoftwareFactoryExecutionStep, decision: SoftwareFactoryProviderRuntimeDecision, timestamp: string): SoftwareFactoryExecutionStep {
  if (!decision.selected) {
    return { ...step, status: "review", providerReason: decision.reason, reviewRequired: true, updatedAt: timestamp };
  }
  return {
    ...step,
    providerProfileId: decision.selected.id,
    providerLabel: decision.selected.label,
    providerReason: decision.reason,
    reviewRequired: decision.reviewRequired,
    updatedAt: timestamp,
  };
}

export function createSoftwareFactoryExecution(runId: string) {
  hydrateExecutions();
  const run = getSoftwareFactoryRun(runId);
  if (!run) return null;

  const timestamp = now();
  const workKind = normalizeWorkKind(run.workType);
  const providerDecision = chooseSoftwareFactoryProvider(workKind);
  const steps = createDefaultSteps(run).map((step) => step.id === "run" ? decorateStepWithProvider(step, providerDecision, timestamp) : step);
  const execution: SoftwareFactoryExecution = {
    id: createId(),
    runId,
    status: "pending",
    steps,
    providerDecision,
    log: [`${timestamp} execution created for ${run.title}`, `${timestamp} provider decision: ${providerDecision.reason}`],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  executions.set(execution.id, execution);
  persistExecutions();
  updateSoftwareFactoryRunStatus(runId, providerDecision.reviewRequired ? "review" : "running", providerDecision.reason);
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

export function attachProviderDecisionToExecution(id: string, workKind?: SoftwareFactoryWorkKind) {
  hydrateExecutions();
  const execution = executions.get(id);
  if (!execution) return null;
  const run = getSoftwareFactoryRun(execution.runId);
  const resolvedWorkKind = workKind || normalizeWorkKind(run?.workType || "planning");
  const timestamp = now();
  const providerDecision = chooseSoftwareFactoryProvider(resolvedWorkKind);
  const steps = execution.steps.map((step) => step.id === "run" ? decorateStepWithProvider(step, providerDecision, timestamp) : step);
  const updated: SoftwareFactoryExecution = {
    ...execution,
    steps,
    providerDecision,
    log: [...execution.log, `${timestamp} provider decision: ${providerDecision.reason}`],
    updatedAt: timestamp,
  };
  executions.set(id, updated);
  persistExecutions();
  return updated;
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
    const needsReview = step.reviewRequired || step.id === "review";
    const status: SoftwareFactoryExecutionStepStatus = needsReview ? "review" : "complete";
    return { ...step, status, updatedAt: timestamp };
  });

  const activeStep = updatedSteps.find((step) => step.id === nextStep.id);
  const status: SoftwareFactoryExecutionStepStatus = activeStep?.status === "review" ? "review" : "running";
  const updated: SoftwareFactoryExecution = {
    ...execution,
    status,
    steps: updatedSteps,
    log: [...execution.log, `${timestamp} advanced step ${nextStep.label}${nextStep.providerLabel ? ` via ${nextStep.providerLabel}` : ""}`],
    updatedAt: timestamp,
  };
  executions.set(id, updated);
  persistExecutions();
  if (status === "review") updateSoftwareFactoryRunStatus(execution.runId, "review", activeStep?.providerReason || "Execution is ready for review.");
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
