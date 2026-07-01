#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(command, inherit = false) {
  const result = execSync(command, {
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  if (typeof result !== 'string') return '';
  return result.trim();
}

function tryRun(command) {
  try {
    return run(command, false);
  } catch {
    return '';
  }
}

function resolveBaseRef() {
  const candidates = [];
  if (process.env.GITHUB_BASE_REF) candidates.push(`origin/${process.env.GITHUB_BASE_REF}`);
  candidates.push('origin/main', 'origin/master', 'HEAD~1');
  for (const ref of candidates) {
    if (tryRun(`git rev-parse --verify ${ref}`)) return ref;
  }
  return null;
}

function collectChangedFiles() {
  const baseRef = resolveBaseRef();
  const committed = baseRef
    ? (() => {
        const mergeBase = tryRun(`git merge-base HEAD ${baseRef}`);
        if (!mergeBase) return [];
        return tryRun(`git diff --name-only ${mergeBase}...HEAD`).split(/\r?\n/).filter(Boolean);
      })()
    : [];

  const staged = tryRun('git diff --name-only --cached').split(/\r?\n/).filter(Boolean);
  const unstaged = tryRun('git diff --name-only').split(/\r?\n/).filter(Boolean);
  const untracked = tryRun('git ls-files --others --exclude-standard').split(/\r?\n/).filter(Boolean);

  return [...new Set([...committed, ...staged, ...unstaged, ...untracked])];
}

function matchesAny(file, patterns) {
  return patterns.some((pattern) => pattern.test(file));
}

function buildPlan(files) {
  const aiRuntimePatterns = [
    /^server\/assistant-daemon\.ts$/,
    /^server\/services\/agentRuntime.*\.ts$/,
    /^server\/services\/aiWorkforce.*\.ts$/,
    /^server\/services\/openClaw.*\.ts$/,
    /^server\/services\/robot.*\.ts$/,
    /^server\/services\/telegramMissionCommands\.ts$/,
    /^scripts\/patch-daemon-.*\.mjs$/,
    /^scripts\/check-openclaw-.*\.mjs$/,
    /^scripts\/check-robot-.*\.mjs$/,
    /^scripts\/check-ai-workforce-.*\.mjs$/,
    /^scripts\/openclaw-plus-doctor\.mjs$/,
    /^src\/modules\/ai-hr\/.*\.tsx?$/,
  ];

  const desktopPatterns = [
    /^desktop\//,
    /^build\//,
    /^tools\/windows\//,
    /^scripts\/prepare-desktop-icons\.mjs$/,
    /^scripts\/check-desktop-package\.mjs$/,
    /^package\.json$/,
    /^\.github\/workflows\/build-windows-desktop\.yml$/,
  ];

  const docsOnly = files.length > 0 && files.every((file) => /^(docs\/.*\.md|.*\.md|.*\.txt)$/.test(file));
  const aiRuntimeRisk = files.some((file) => matchesAny(file, aiRuntimePatterns));
  const desktopRisk = files.some((file) => matchesAny(file, desktopPatterns));

  const commands = [];
  if (docsOnly) {
    commands.push('npm run check:codemap');
  } else {
    commands.push('npm run check:green');
  }

  if (aiRuntimeRisk) {
    commands.push('npm run check:openclaw-plus');
    commands.push('npm run check:runtime');
    commands.push('npm run check:ai-assistant-safety');
    commands.push('npm run test:ai-runtime');
  }

  if (desktopRisk && !docsOnly) {
    commands.push('npm run check:desktop');
  }

  const recommendedLabels = [];
  if (docsOnly) {
    recommendedLabels.push('risk/docs-only');
  } else {
    recommendedLabels.push('risk/standard');
  }
  if (aiRuntimeRisk) recommendedLabels.push('risk/ai-runtime');
  if (desktopRisk) recommendedLabels.push('risk/desktop');

  const riskLevel = aiRuntimeRisk ? 'high' : desktopRisk ? 'medium' : docsOnly ? 'low' : 'standard';
  const reviewTracks = [];
  if (docsOnly) {
    reviewTracks.push('docs');
  } else {
    reviewTracks.push('general');
  }
  if (aiRuntimeRisk) reviewTracks.push('ai-runtime');
  if (desktopRisk) reviewTracks.push('desktop');

  const requiredReviewerRoutingVars = [];
  if (recommendedLabels.includes('risk/standard')) {
    requiredReviewerRoutingVars.push('RISK_STANDARD_REVIEWERS', 'RISK_STANDARD_REVIEW_TEAMS');
  }
  if (recommendedLabels.includes('risk/desktop')) {
    requiredReviewerRoutingVars.push('RISK_DESKTOP_REVIEWERS', 'RISK_DESKTOP_REVIEW_TEAMS');
  }
  if (recommendedLabels.includes('risk/ai-runtime')) {
    requiredReviewerRoutingVars.push('RISK_AI_RUNTIME_REVIEWERS', 'RISK_AI_RUNTIME_REVIEW_TEAMS');
  }

  const optionalPolicyVars = ['ENFORCE_REVIEWER_ROUTING', 'ENFORCE_REVIEW_REQUEST_DELIVERY'];
  if (recommendedLabels.includes('risk/ai-runtime')) {
    optionalPolicyVars.push('ENFORCE_AI_RUNTIME_APPROVAL', 'AI_RUNTIME_MIN_APPROVALS');
  }

  return {
    docsOnly,
    aiRuntimeRisk,
    desktopRisk,
    riskLevel,
    recommendedLabels,
    reviewTracks,
    requiredReviewerRoutingVars: [...new Set(requiredReviewerRoutingVars)],
    optionalPolicyVars: [...new Set(optionalPolicyVars)],
    commands: [...new Set(commands)],
  };
}

function appendSummary(markdown) {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  try {
    fs.appendFileSync(target, `${markdown}\n`, 'utf8');
  } catch {
    // Non-blocking in local runs.
  }
}

function writePlanOutput(outputFile, payload) {
  try {
    fs.mkdirSync(path.dirname(outputFile), { recursive: true });
    fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    // Non-blocking for local usage.
  }
}

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const outputFile = process.env.PR_READINESS_OUTPUT_FILE || path.resolve(process.cwd(), 'artifacts/pr-readiness/plan.json');

const files = collectChangedFiles();
const plan = buildPlan(files);

console.log('[pr-readiness] changed files:', files.length);
if (files.length) {
  for (const file of files.slice(0, 120)) console.log(` - ${file}`);
  if (files.length > 120) console.log(` - ... and ${files.length - 120} more`);
}

console.log('[pr-readiness] profile:', JSON.stringify({
  docsOnly: plan.docsOnly,
  aiRuntimeRisk: plan.aiRuntimeRisk,
  desktopRisk: plan.desktopRisk,
  riskLevel: plan.riskLevel,
}, null, 2));

console.log('[pr-readiness] commands:');
for (const command of plan.commands) console.log(` - ${command}`);

appendSummary(`## PR Readiness\n- Changed files: ${files.length}\n- docsOnly: ${plan.docsOnly}\n- aiRuntimeRisk: ${plan.aiRuntimeRisk}\n- desktopRisk: ${plan.desktopRisk}`);
appendSummary(`### Commands\n${plan.commands.map((cmd) => `- ${cmd}`).join('\n')}`);
appendSummary(`### Labels\n${plan.recommendedLabels.map((label) => `- ${label}`).join('\n')}`);
appendSummary(`### Review Tracks\n${plan.reviewTracks.map((track) => `- ${track}`).join('\n')}`);
appendSummary(`### Required Reviewer Routing Vars\n${plan.requiredReviewerRoutingVars.map((name) => `- ${name}`).join('\n')}`);
appendSummary(`### Optional Policy Vars\n${plan.optionalPolicyVars.map((name) => `- ${name}`).join('\n')}`);

writePlanOutput(outputFile, {
  status: dryRun ? 'dry-run' : 'planned',
  generatedAt: new Date().toISOString(),
  changedFilesCount: files.length,
  changedFiles: files,
  profile: {
    docsOnly: plan.docsOnly,
    aiRuntimeRisk: plan.aiRuntimeRisk,
    desktopRisk: plan.desktopRisk,
    riskLevel: plan.riskLevel,
  },
  recommendedLabels: plan.recommendedLabels,
  reviewTracks: plan.reviewTracks,
  requiredReviewerRoutingVars: plan.requiredReviewerRoutingVars,
  optionalPolicyVars: plan.optionalPolicyVars,
  commands: plan.commands,
});

if (dryRun) {
  console.log('[pr-readiness] dry-run complete.');
  process.exit(0);
}

for (const command of plan.commands) {
  console.log(`[pr-readiness] run: ${command}`);
  try {
    run(command, true);
  } catch (error) {
    writePlanOutput(outputFile, {
      status: 'failed',
      generatedAt: new Date().toISOString(),
      failedCommand: command,
      changedFilesCount: files.length,
      changedFiles: files,
      profile: {
        docsOnly: plan.docsOnly,
        aiRuntimeRisk: plan.aiRuntimeRisk,
        desktopRisk: plan.desktopRisk,
        riskLevel: plan.riskLevel,
      },
      recommendedLabels: plan.recommendedLabels,
      reviewTracks: plan.reviewTracks,
      requiredReviewerRoutingVars: plan.requiredReviewerRoutingVars,
      optionalPolicyVars: plan.optionalPolicyVars,
      commands: plan.commands,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

writePlanOutput(outputFile, {
  status: 'passed',
  generatedAt: new Date().toISOString(),
  changedFilesCount: files.length,
  changedFiles: files,
  profile: {
    docsOnly: plan.docsOnly,
    aiRuntimeRisk: plan.aiRuntimeRisk,
    desktopRisk: plan.desktopRisk,
    riskLevel: plan.riskLevel,
  },
  recommendedLabels: plan.recommendedLabels,
  reviewTracks: plan.reviewTracks,
  requiredReviewerRoutingVars: plan.requiredReviewerRoutingVars,
  optionalPolicyVars: plan.optionalPolicyVars,
  commands: plan.commands,
});

console.log('[pr-readiness] all required checks passed.');
