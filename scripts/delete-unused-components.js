import fs from 'fs';
import path from 'path';

const root = process.cwd();
const componentsDir = path.join(root, 'src', 'components');

const unusedJsonPath = path.join(root, 'unused_components.json');
if (!fs.existsSync(unusedJsonPath)) {
  console.error('Error: unused_components.json does not exist. Run scripts/audit-components.js first.');
  process.exit(1);
}

const unusedFiles = JSON.parse(fs.readFileSync(unusedJsonPath, 'utf-8'));

console.log(`Starting cleanup of ${unusedFiles.length} unused files...`);

let deletedCount = 0;

for (const relPath of unusedFiles) {
  const fullPath = path.resolve(root, relPath);
  
  // Guardrail: Make sure the file exists and is strictly inside src/components
  const relativeToComponents = path.relative(componentsDir, fullPath);
  if (relativeToComponents.startsWith('..') || path.isAbsolute(relativeToComponents)) {
    console.error(`Safety Alert: Skipping path outside components directory: ${relPath}`);
    continue;
  }

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    deletedCount++;
  }
}

console.log(`Cleaned up ${deletedCount} files.`);

// Function to recursively clean up empty directories
function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanEmptyDirs(fullPath);
    }
  }
  // Re-read and check if empty
  const updatedEntries = fs.readdirSync(dir);
  if (updatedEntries.length === 0 && dir !== componentsDir) {
    fs.rmdirSync(dir);
    console.log(`Removed empty directory: ${path.relative(root, dir)}`);
  }
}

cleanEmptyDirs(componentsDir);
console.log('Cleanup finished successfully.');
