import fs from 'node:fs';
import path from 'node:path';

const panelPath = path.resolve('src/modules/ai-hr/AIWorkforceRuntimePanel.tsx');

if (!fs.existsSync(panelPath)) {
  throw new Error(`AIWorkforceRuntimePanel source not found: ${panelPath}`);
}

let source = fs.readFileSync(panelPath, 'utf8');
let changed = false;

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Cannot patch release gate dashboard UI: missing ${label}`);
  source = source.replace(search, replacement);
  changed = true;
}

if (!source.includes("import ReleaseGateDashboardCard from './ReleaseGateDashboardCard';")) {
  replaceOnce(
    "} from '../../services/aiWorkforceRuntimeClient';",
    "} from '../../services/aiWorkforceRuntimeClient';\nimport ReleaseGateDashboardCard from './ReleaseGateDashboardCard';",
    'runtime client import anchor',
  );
}

if (!source.includes('const releaseGate = dashboard?.releaseGate;')) {
  replaceOnce(
    '  const ledger = dashboard?.ledger;\n  const recentRecords = dashboard?.recentRecords || [];',
    '  const ledger = dashboard?.ledger;\n  const releaseGate = dashboard?.releaseGate;\n  const recentRecords = dashboard?.recentRecords || [];',
    'dashboard releaseGate state anchor',
  );
}

if (!source.includes('<ReleaseGateDashboardCard releaseGate={releaseGate} />')) {
  replaceOnce(
    '      </div>\n\n      <div className="mt-5 grid gap-3 lg:grid-cols-6">',
    '      </div>\n\n      <ReleaseGateDashboardCard releaseGate={releaseGate} />\n\n      <div className="mt-5 grid gap-3 lg:grid-cols-6">',
    'metric grid insertion anchor',
  );
}

if (changed) {
  fs.writeFileSync(panelPath, source);
  console.log('AI Workforce Release Gate dashboard UI card mounted in Runtime Panel.');
} else {
  console.log('AI Workforce Release Gate dashboard UI card already mounted.');
}
