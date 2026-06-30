import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';

const steps = [
  ['run', 'check:ai-workforce-command-center'],
  ['test'],
  ['run', 'build'],
];

function npmSpawnArgs(args) {
  if (!isWindows) return { command: 'npm', args };
  return {
    command: 'cmd.exe',
    args: ['/d', '/s', '/c', 'npm', ...args],
  };
}

function runStep(args) {
  return new Promise((resolve, reject) => {
    const label = `npm ${args.join(' ')}`;
    const spawned = npmSpawnArgs(args);
    console.log(`\n━━ AI Workforce local verify: ${label}`);
    const child = spawn(spawned.command, spawned.args, {
      stdio: 'inherit',
      shell: false,
      env: { ...process.env },
      windowsHide: false,
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

for (const step of steps) {
  await runStep(step);
}

console.log('\nAI Workforce local verification passed: patch, contract check, tests, and build completed successfully.');
