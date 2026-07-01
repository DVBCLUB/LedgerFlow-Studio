#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const FILE_RULES = [
  {
    file: 'docs/GREEN_MERGE_POLICY.md',
    titleIncludes: ['Green Merge Policy'],
    requiredSnippets: ['## Quick operator checklist', '## Escalation rule', 'check:pr-readiness'],
  },
  {
    file: 'docs/AI_GATEWAY.md',
    titleIncludes: ['AI Gateway'],
    requiredSnippets: ['## Provider được hỗ trợ', '### Xu ly nhanh theo trang thai', 'runtime/ai_usage.log.json'],
  },
  {
    file: 'docs/INTEGRATION_HUB.md',
    titleIncludes: ['Integration Hub'],
    requiredSnippets: ['## 1. Nguyên tắc kiến trúc', '### 1.4. Quy tac khong the thuong luong', '### 1.5. Thu tu rollout connector de xuat'],
  },
  {
    file: 'docs/CI_TRIAGE.md',
    titleIncludes: ['CI Triage'],
    requiredSnippets: ['## Release gate hien tai', '## Nhom loi thuong gap', '## Mau bang chung cho PR'],
  },
  {
    file: 'docs/RELEASE_GUARD_CHECKLIST.md',
    titleIncludes: ['Release Guard Checklist'],
    requiredSnippets: ['## 1. Lenh kiem tra bat buoc', 'npm run check:runtime', 'check:desktop'],
  },
  {
    file: 'docs/RELEASE_READINESS_CHECKLIST.md',
    titleIncludes: ['Checklist San Sang Phat Hanh'],
    requiredSnippets: ['## 3. Dieu kien truoc khi gui cho nguoi khac', 'LedgerFlow-Hub-Windows-Setup', '## 4. Build local neu Actions chua co artifact'],
  },
  {
    file: 'docs/AI_WORKFORCE_RUNTIME_BRIEF4_OPERATOR_RUNBOOK.md',
    titleIncludes: ['Runbook Van Hanh'],
    requiredSnippets: ['## 3) Theo doi Drift va Sua Drift', '/api/ai-workforce/mission-execution-queue/drift', '## 4) Van hanh Browser Fallback'],
  },
  {
    file: 'docs/BRIEF4_DEPLOY_ROLLBACK_CHECKLIST.md',
    titleIncludes: ['Checklist Deploy va Rollback'],
    requiredSnippets: ['## Checklist Deploy', '## Dieu kien kich hoat Rollback', '## Bang chung Release'],
  },
  {
    file: 'docs/OPERATIONS_INDEX.md',
    titleIncludes: ['Operations Index'],
    requiredSnippets: ['## CI / Runtime su co', '## Release / Packaging', '## AI Gateway / Integration / Security'],
  },
];

function readText(relativePath) {
  const fullPath = path.resolve(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing documentation file: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function ensureTopHeading(relativePath, text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  if (!firstLine.startsWith('# ')) {
    throw new Error(`${relativePath}: first line must be a Markdown H1 heading.`);
  }
}

function ensureNoTrailingSpaces(relativePath, text) {
  const lines = text.split(/\r?\n/);
  const bad = lines.findIndex((line) => /\s+$/.test(line));
  if (bad >= 0) {
    throw new Error(`${relativePath}: trailing whitespace found at line ${bad + 1}.`);
  }
}

function validateRule(rule) {
  const text = readText(rule.file);
  ensureTopHeading(rule.file, text);
  ensureNoTrailingSpaces(rule.file, text);

  if (Array.isArray(rule.titleIncludes) && rule.titleIncludes.length > 0) {
    const firstLine = text.split(/\r?\n/, 1)[0] || '';
    for (const token of rule.titleIncludes) {
      if (!firstLine.includes(token)) {
        throw new Error(`${rule.file}: title must include "${token}".`);
      }
    }
  }

  for (const snippet of rule.requiredSnippets || []) {
    if (!text.includes(snippet)) {
      throw new Error(`${rule.file}: missing required snippet "${snippet}".`);
    }
  }
}

for (const rule of FILE_RULES) validateRule(rule);

console.log(`Docs operations style check passed for ${FILE_RULES.length} files.`);
