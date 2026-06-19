import { spawn } from 'child_process';

const mode = process.argv.includes('--release') ? 'release' : 'prebuild';

const prebuildChecks = [
  { name: 'Environment configuration', command: 'npm', args: ['run', 'check:env'] },
  { name: 'Simulation registry and module integrity', command: 'npm', args: ['run', 'check:simulations'] },
  { name: 'Founder Labs dock and Company OS integrity', command: 'npm', args: ['run', 'check:founder-labs'] },
  { name: 'Desktop packaging configuration', command: 'npm', args: ['run', 'check:desktop'] },
  { name: 'Offline readiness', command: 'npm', args: ['run', 'check:offline'] },
  { name: 'TypeScript', command: 'npm', args: ['run', 'lint'] }
];

const releaseChecks = [
  ...prebuildChecks,
  { name: 'Production build output', command: 'npm', args: ['run', 'check:build'] },
  { name: 'Runtime API smoke test', command: 'npm', args: ['run', 'check:runtime'] },
  { name: 'Release artifacts', command: 'npm', args: ['run', 'check:release'] }
];

const checks = mode === 'release' ? releaseChecks : prebuildChecks;

function runCheck(check) {
  return new Promise((resolve) => {
    console.log(`\n=== LedgerFlow desktop release check: ${check.name} ===\n`);

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

console.log(`\n=== LedgerFlow desktop ${mode} checklist summary ===\n`);
for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} - ${result.name}`);
}

if (failed.length > 0) {
  console.error('\nDesktop release checklist failed. Fix the first failed check before continuing.\n');
  process.exit(1);
}

if (mode === 'release') {
  console.log('\nDesktop release checklist passed. Build is ready for manual install testing and artifact upload.\n');
} else {
  console.log('\nDesktop prebuild checklist passed. You can now run npm run desktop:dist.\n');
}
