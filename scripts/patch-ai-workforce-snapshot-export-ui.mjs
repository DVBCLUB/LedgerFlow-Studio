import './patch-ai-workforce-release-gate-route.mjs';
import './patch-ai-workforce-snapshot-release-evidence.mjs';
import fs from 'node:fs';
import path from 'node:path';

const targetPath = path.resolve('src/modules/ai-hr/AIOperationsCenter.tsx');

if (!fs.existsSync(targetPath)) {
  throw new Error(`AIOperationsCenter source not found: ${targetPath}`);
}

let source = fs.readFileSync(targetPath, 'utf8');
let changed = false;

if (!source.includes("import MissionSnapshotExportPanel from './MissionSnapshotExportPanel';")) {
  source = source.replace(
    "import MissionOperatorRunbookPanel from './MissionOperatorRunbookPanel';",
    "import MissionOperatorRunbookPanel from './MissionOperatorRunbookPanel';\nimport MissionSnapshotExportPanel from './MissionSnapshotExportPanel';",
  );
  changed = true;
}

if (!source.includes("import MissionReviewNoteSavePanel from './MissionReviewNoteSavePanel';")) {
  source = source.replace(
    "import MissionSnapshotExportPanel from './MissionSnapshotExportPanel';",
    "import MissionSnapshotExportPanel from './MissionSnapshotExportPanel';\nimport MissionReviewNoteSavePanel from './MissionReviewNoteSavePanel';",
  );
  changed = true;
}

if (!source.includes("import MissionReleaseGatePanel from './MissionReleaseGatePanel';")) {
  source = source.replace(
    "import MissionReviewNoteSavePanel from './MissionReviewNoteSavePanel';",
    "import MissionReviewNoteSavePanel from './MissionReviewNoteSavePanel';\nimport MissionReleaseGatePanel from './MissionReleaseGatePanel';",
  );
  changed = true;
}

if (!source.includes('<MissionSnapshotExportPanel />')) {
  source = source.replace(
    '      <MissionOperatorRunbookPanel />',
    '      <MissionOperatorRunbookPanel />\n      <MissionSnapshotExportPanel />',
  );
  changed = true;
}

if (!source.includes('<MissionReviewNoteSavePanel />')) {
  source = source.replace(
    '      <MissionSnapshotExportPanel />',
    '      <MissionSnapshotExportPanel />\n      <MissionReviewNoteSavePanel />',
  );
  changed = true;
}

if (!source.includes('<MissionReleaseGatePanel />')) {
  source = source.replace(
    '      <MissionReviewNoteSavePanel />',
    '      <MissionReviewNoteSavePanel />\n      <MissionReleaseGatePanel />',
  );
  changed = true;
}

if (changed) {
  fs.writeFileSync(targetPath, source);
  console.log('AI Workforce Mission Snapshot Export UI mounted in AIOperationsCenter.');
} else {
  console.log('AI Workforce Mission Snapshot Export UI already mounted.');
}
