#!/usr/bin/env node
/* Simple E2E: call /api/claude/code-bridge and verify response contains prompt */
import fetch from 'node-fetch';

async function run(){
  try{
    const payload = { prompt: 'Create a small patch to fix variable naming in src/utils/example.ts', mode: 'patch' };
    const res = await fetch('http://127.0.0.1:3000/api/claude/code-bridge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await res.json();
    if(!j?.success) { console.error('Bridge call failed', j); process.exit(2); }
    console.log('Bridge returned prompt length', (j.prompt || '').length);
    if((j.prompt || '').length < 20) { console.error('Prompt too short'); process.exit(3); }
    console.log('E2E OK');
  }catch(e){ console.error('E2E error', e); process.exit(1); }
}

run();
