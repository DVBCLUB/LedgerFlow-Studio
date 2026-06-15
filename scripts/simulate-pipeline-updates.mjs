#!/usr/bin/env node
/*
Simulate pipeline updates by appending chunks to a pipeline's step outputs.
Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/simulate-pipeline-updates.mjs <pipelineId> [stepIndex]

This script will append 3 chunks spaced by 1s to the specified step.
*/
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars');
  process.exit(2);
}

const [,, pipelineId, stepIndexArg] = process.argv;
if (!pipelineId) {
  console.error('Usage: node scripts/simulate-pipeline-updates.mjs <pipelineId> [stepIndex]');
  process.exit(2);
}
const stepIndex = Number(stepIndexArg ?? 0);

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sleep(ms){ return new Promise((r) => setTimeout(r, ms)); }

(async ()=>{
  try{
    const { data } = await sb.from('agent_pipelines').select('*').eq('id', pipelineId).single();
    if(!data) throw new Error('pipeline not found');
    const steps = Array.isArray(data.steps) ? data.steps : JSON.parse(data.steps || '[]');
    if(!steps[stepIndex]) throw new Error('invalid stepIndex');

    for(let i=1;i<=3;i++){
      steps[stepIndex].output = (steps[stepIndex].output || '') + `\n[chunk ${i}] Generated at ${new Date().toISOString()} `;
      steps[stepIndex].status = 'running';
      await sb.from('agent_pipelines').update({ steps: JSON.stringify(steps), updated_at: new Date().toISOString() }).eq('id', pipelineId);
      console.log('Appended chunk', i);
      await sleep(1000);
    }

    steps[stepIndex].status = 'done';
    steps[stepIndex].completedAt = new Date().toISOString();
    await sb.from('agent_pipelines').update({ steps: JSON.stringify(steps), status: 'running', updated_at: new Date().toISOString() }).eq('id', pipelineId);
    console.log('Step done');
  }catch(e){ console.error(e); process.exit(1); }
})()
