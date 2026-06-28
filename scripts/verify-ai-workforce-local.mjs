import { spawn } from 'node:child_process';

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const steps = [
  ['run', 'ai:patch-ai-workforce-command-center'],
  ['run', 'check:ai-workforce-command-center'],
  ['test'],
  ['run', 'build'],
];

function runStep(args) {
  return new Promise((resolve, reject) => {
    const label = `${npmCmd} ${args.join(' ')}`;
    console.log(`\n━━ AI Workforce local verify: ${label}`);
    const child = spawn(npmCmd, args, {
      stdio: 'inherit',
      shell: false,
      env: process.env,
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
