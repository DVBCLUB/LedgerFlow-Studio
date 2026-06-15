#!/usr/bin/env node
/*
Simple local simulator that posts debug events to the server's debug-event route.
Usage: node scripts/local-simulate-debug-events.mjs <pipelineId> [stepIndex]
*/
import fetch from 'node-fetch';

const [,, pipelineId, stepIndexArg] = process.argv;
if (!pipelineId) {
  console.error('Usage: node scripts/local-simulate-debug-events.mjs <pipelineId> [stepIndex]');
  process.exit(2);
}
const stepIndex = Number(stepIndexArg ?? 0);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async ()=>{
  try{
    for(let i=1;i<=3;i++){
      const chunk = `Local debug chunk ${i} @ ${new Date().toISOString()}`;
      const res = await fetch(`http://127.0.0.1:3000/api/pipelines/${encodeURIComponent(pipelineId)}/debug-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chunk', stepIndex, chunk }),
      });
      const j = await res.text();
      console.log('posted chunk', i, res.status, j.slice(0,200));
      await sleep(900);
    }

    // Send waiting approval update
    const upd = await fetch(`http://127.0.0.1:3000/api/pipelines/${encodeURIComponent(pipelineId)}/debug-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'update', stepIndex, step: { status: 'waiting_approval', name: `Local Step ${stepIndex + 1}` } }),
    });
    console.log('posted update', upd.status, await upd.text());
  }catch(e){ console.error(e); process.exit(1); }
})();
