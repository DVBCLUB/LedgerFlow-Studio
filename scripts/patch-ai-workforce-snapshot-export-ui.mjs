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

if (!source.includes('<MissionSnapshotExportPanel />')) {
  source = source.replace(
    '      <MissionOperatorRunbookPanel />',
    '      <MissionOperatorRunbookPanel />\n      <MissionSnapshotExportPanel />',
  );
  changed = true;
}

if (changed) {
  fs.writeFileSync(targetPath, source);
  console.log('AI Workforce Mission Snapshot Export UI mounted in AIOperationsCenter.');
} else {
  console.log('AI Workforce Mission Snapshot Export UI already mounted.');
}
