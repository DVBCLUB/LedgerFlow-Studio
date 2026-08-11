import assert from 'node:assert/strict';
import test from 'node:test';
import {
  triggerAutoRepairSession,
  getAutoRepairSession,
  listAutoRepairSessions,
  clearAutoRepairStoreForTest,
} from './agentAutoRepairEngine.ts';
import { setAIFabricRouterForTest } from './aiFabric.ts';

test('triggerAutoRepairSession diagnoses error log and enqueues repair job', async (t) => {
  await clearAutoRepairStoreForTest();

  // Mock AI Fabric
  const restore = setAIFabricRouterForTest(async (messages) => {
    return {
      content: JSON.stringify({
        rootCause: 'TypeError: Cannot read property id of undefined',
        suspectFiles: ['src/services/userService.ts'],
        suggestedFix: 'Add optional chaining user?.id',
        confidence: 0.9,
      }),
      modelUsed: 'test/model',
      raw: {},
      toolCalls: [],
    };
  });
  t.after(restore);

  const session = await triggerAutoRepairSession({
    errorLog: 'TypeError: Cannot read property id of undefined at userService.ts:42',
    targetFile: 'src/services/userService.ts',
    source: 'ci_test',
  });

  assert.ok(session.id.startsWith('repair_'));
  assert.equal(session.status, 'repairing');
  assert.equal(session.diagnosis?.rootCause, 'TypeError: Cannot read property id of undefined');
  assert.equal(session.diagnosis?.suspectFiles[0], 'src/services/userService.ts');
  assert.ok(session.backgroundJobId);
  assert.ok(session.riskAssessment);

  const retrieved = getAutoRepairSession(session.id);
  assert.equal(retrieved?.id, session.id);
});

test('listAutoRepairSessions lists recent sessions sorted by date', async (t) => {
  await clearAutoRepairStoreForTest();

  const restore = setAIFabricRouterForTest(async () => ({
    content: JSON.stringify({ rootCause: 'SyntaxError', suspectFiles: [], suggestedFix: '', confidence: 0.8 }),
    modelUsed: 'test/model',
    raw: {},
    toolCalls: [],
  }));
  t.after(restore);

  await triggerAutoRepairSession({ errorLog: 'Error 1' });
  await triggerAutoRepairSession({ errorLog: 'Error 2' });

  const list = listAutoRepairSessions(10);
  assert.equal(list.length, 2);
});
