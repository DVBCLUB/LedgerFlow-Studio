import { spawn } from 'child_process';

const checks = [
  { name: 'Environment configuration', command: 'npm', args: ['run', 'check:env'] },
  { name: 'Simulation registry and module integrity', command: 'npm', args: ['run', 'check:simulations'] },
  { name: 'Desktop packaging configuration', command: 'npm', args: ['run', 'check:desktop'] },
  { name: 'Offline readiness', command: 'npm', args: ['run', 'check:offline'] },
  { name: 'TypeScript', command: 'npm', args: ['run', 'lint'] },
  { name: 'Production build output', command: 'npm', args: ['run', 'check:build'] },
  { name: 'Runtime API smoke test', command: 'npm', args: ['run', 'check:runtime'] },
  { name: 'Release artifacts', command: 'npm', args: ['run', 'check:release'] }
];

function runCheck(check) {
  return new Promise((resolve) => {
    console.log(`\n=== LedgerFlow hybrid check: ${check.name} ===\n`);

    const child = spawn(check.command, check.args, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('exit', (code) => {
      resolve({ name: check.name, ok: code === 0, code });
    });

    child.on('error', (error) => {
      console.error(error);
      resolve({ name: check.name, ok: false, code: 1 });
    });
  });
}

const results = [];

for (const check of checks) {
  const result = await runCheck(check);
  results.push(result);
  if (!result.ok) {
    break;
  }
}

const failed = results.filter((result) => !result.ok);

console.log('\n=== LedgerFlow hybrid release checklist summary ===\n');
for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} - ${result.name}`);
}

if (failed.length > 0) {
  console.error('\nHybrid release checklist failed. Fix the first failed check before shipping.\n');
  process.exit(1);
}

console.log('\nHybrid release checklist passed. Build is ready for manual install testing and artifact upload.\n');
