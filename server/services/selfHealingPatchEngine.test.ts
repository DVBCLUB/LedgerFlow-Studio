import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyErrorLog,
  generateSelfHealingPatch,
  listSelfHealingPatches,
  updatePatchStatus,
} from './selfHealingPatchEngine.ts';

test('selfHealingPatchEngine - classifies errors accurately', () => {
  const imp = classifyErrorLog("Error: Cannot find module './missingModule.ts' in server/services/aiRouter.ts");
  assert.equal(imp.classification, 'missing_import');
  assert.equal(imp.targetFile, 'server/services/aiRouter.ts');

  const ts = classifyErrorLog("Type 'string' is not assignable to type 'number' in src/app/ErpApp.tsx:42");
  assert.equal(ts.classification, 'typescript_type');
  assert.equal(ts.targetFile, 'src/app/ErpApp.tsx');
});

test('selfHealingPatchEngine - generates patch with safety judge review and tracks status', async () => {
  const proposal = await generateSelfHealingPatch({
    errorLog: "TypeError: Cannot read property 'map' of undefined at server/services/aiRoutingPolicy.ts:120",
  });

  assert.ok(proposal.id.startsWith('patch_'));
  assert.equal(proposal.targetFile, 'server/services/aiRoutingPolicy.ts');
  assert.ok(proposal.diffSnippet.length > 0);
  assert.ok(typeof proposal.safetyScore === 'number');
  assert.equal(proposal.status, 'pending_review');

  const list = listSelfHealingPatches();
  assert.ok(list.some((p) => p.id === proposal.id));

  const updated = updatePatchStatus(proposal.id, 'approved', 'CEO Test');
  assert.equal(updated?.status, 'approved');
  assert.equal(updated?.approvedBy, 'CEO Test');
});
