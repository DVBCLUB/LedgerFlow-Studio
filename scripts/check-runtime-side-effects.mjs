import { execFileSync } from 'node:child_process';

const trackedRuntimeFiles = [
  'skill_registry.json',
  'webhook_rules.json',
];

function changedFiles() {
  const output = execFileSync('git', ['diff', '--name-only', '--', ...trackedRuntimeFiles], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

const changed = changedFiles();

if (changed.length > 0) {
  console.error('\nRuntime side-effect check failed:\n');
  for (const file of changed) {
    console.error(`- ${file} was modified by runtime/test execution.`);
  }
  console.error('\nRuntime state must be written to ignored runtime files or temp paths, not tracked seed files.\n');
  process.exit(1);
}

console.log('Runtime side-effect check passed: tracked runtime seed files are clean.');
