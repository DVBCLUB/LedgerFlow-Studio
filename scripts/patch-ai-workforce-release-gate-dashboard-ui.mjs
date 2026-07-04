import fs from 'node:fs';
import path from 'node:path';

const panelPath = path.resolve('src/modules/ai-nhan-su/AIWorkforceRuntimePanel.tsx');

if (!fs.existsSync(panelPath)) {
  throw new Error(`AIWorkforceRuntimePanel source not found: ${panelPath}`);
}

let source = fs.readFileSync(panelPath, 'utf8').replace(/\r\n/g, '\n');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch release gate dashboard UI: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

function replaceFirstAvailable(candidates, replacementFactory, label, { optional = false } = {}) {
  for (const search of candidates) {
    if (!source.includes(search)) continue;
    const replacement = typeof replacementFactory === 'function' ? replacementFactory(search) : replacementFactory;
    source = source.replace(search, replacement);
    changed = true;
    return true;
  }
  if (optional) return false;
  throw new Error(`Cannot patch release gate dashboard UI: missing ${label}`);
}

function insertReleaseGateState() {
  if (source.includes('const releaseGate = dashboard?.releaseGate;')) return true;

  const exactInserted = replaceFirstAvailable(
    [
      '  const ledger = dashboard?.ledger;\n  const recentRecords = dashboard?.recentRecords || [];',
      '  const ledger = dashboard?.ledger;\n',
      '  const tooling = dashboard?.tooling;\n',
      '  const metricStoreStats = dashboard?.metricStoreStats;\n',
      '  const offline = Boolean(error && !dashboard);\n',
    ],
    (anchor) => {
      if (anchor.includes('recentRecords')) {
        return '  const ledger = dashboard?.ledger;\n  const releaseGate = dashboard?.releaseGate;\n  const recentRecords = dashboard?.recentRecords || [];';
      }
      if (anchor.includes('offline')) return `  const releaseGate = dashboard?.releaseGate;\n${anchor}`;
      return `${anchor}  const releaseGate = dashboard?.releaseGate;\n`;
    },
    'dashboard releaseGate state anchor',
    { optional: true },
  );
  if (exactInserted) return true;

  const beforeReturn = /\n\s*return \(\n\s*<section className=\{`\$\{cardClass\}/;
  if (beforeReturn.test(source)) {
    source = source.replace(beforeReturn, (match) => `\n  const releaseGate = dashboard?.releaseGate;${match}`);
    changed = true;
    return true;
  }

  console.warn('AI Workforce Release Gate dashboard UI: could not find a stable state anchor; skipping releaseGate state injection.');
  return false;
}

function insertReleaseGateCard() {
  if (source.includes('<ReleaseGateDashboardCard releaseGate={releaseGate} />')) return true;

  const inserted = replaceFirstAvailable(
    [
      '      </div>\n\n      <div className="mt-5 grid gap-3 lg:grid-cols-6">',
      '      </div>\n\n      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">',
      '      </div>\n\n      {lastMissionPlan && (',
      '      </div>\n\n      {activeQueue && (',
    ],
    (anchor) => {
      if (anchor.includes('<div className=')) {
        return anchor.replace('      </div>\n\n', '      </div>\n\n      <ReleaseGateDashboardCard releaseGate={releaseGate} />\n\n');
      }
      if (anchor.includes('{lastMissionPlan')) return '      </div>\n\n      <ReleaseGateDashboardCard releaseGate={releaseGate} />\n\n      {lastMissionPlan && (';
      return '      </div>\n\n      <ReleaseGateDashboardCard releaseGate={releaseGate} />\n\n      {activeQueue && (';
    },
    'metric grid insertion anchor',
    { optional: true },
  );
  if (inserted) return true;

  console.warn('AI Workforce Release Gate dashboard UI: could not find a stable card insertion anchor; leaving Runtime Panel unchanged.');
  return false;
}

if (!source.includes("import ReleaseGateDashboardCard from './ReleaseGateDashboardCard';")) {
  replaceFirstAvailable(
    [
      "} from '../../services/aiWorkforceRuntimeClient';",
      "import React from 'react';",
    ],
    (anchor) => anchor.includes('aiWorkforceRuntimeClient')
      ? "} from '../../services/aiWorkforceRuntimeClient';\nimport ReleaseGateDashboardCard from './ReleaseGateDashboardCard';"
      : "import React from 'react';\nimport ReleaseGateDashboardCard from './ReleaseGateDashboardCard';",
    'runtime client import anchor',
  );
}

const hasReleaseGateState = insertReleaseGateState();
if (hasReleaseGateState) insertReleaseGateCard();

if (changed) {
  fs.writeFileSync(panelPath, source);
  console.log('AI Workforce Release Gate dashboard UI card mounted in Runtime Panel.');
} else {
  console.log('AI Workforce Release Gate dashboard UI card already mounted.');
}
