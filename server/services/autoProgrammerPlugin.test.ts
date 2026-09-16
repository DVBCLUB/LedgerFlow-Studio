/**
 * autoProgrammerPlugin.test.ts
 * ============================================================
 * Tests for Auto-Programmer Plugin
 * ============================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateProject,
  getProjectResult,
  listSessions,
  deleteSession,
  getProjectStats,
} from './autoProgrammerPlugin.ts';

test('autoProgrammerPlugin - generateProject creates a game project', async () => {
  const result = await generateProject({
    projectType: 'game',
    title: 'Test Game',
    description: 'A simple platformer test',
    genre: 'platformer',
  });

  assert.ok(result);
  assert.ok(result.id.startsWith('proj-'), 'id prefix');
  assert.equal(result.projectType, 'game');
  assert.equal(result.title, 'Test Game');
  assert.ok(['completed','generating','failed'].includes(result.status), 'status: ' + result.status);
  assert.ok(result.latencyMs >= 0, 'latencyMs');
});

test('autoProgrammerPlugin - generateProject creates a software project', async () => {
  const result = await generateProject({
    projectType: 'software',
    title: 'Todo App',
    description: 'A fullstack todo application',
    appType: 'web',
    targetAudience: 'developers',
  });
  assert.ok(result);
  assert.equal(result.projectType, 'software');
});

test('autoProgrammerPlugin - generateProject creates a video project', async () => {
  const result = await generateProject({
    projectType: 'video',
    title: 'Promo Video',
    description: 'A 30-second product promo',
    aspectRatio: '16:9',
    targetAudience: 'general',
  });
  assert.ok(result);
  assert.equal(result.projectType, 'video');
});

test('autoProgrammerPlugin - getProjectResult returns null for unknown id', async () => {
  const result = await getProjectResult('nonexistent-id');
  assert.equal(result, null);
});

test('autoProgrammerPlugin - getProjectResult returns existing project', async () => {
  const created = await generateProject({ projectType: 'game', title: 'Retrieval Test' });
  const result = await getProjectResult(created.id);
  assert.ok(result);
  assert.equal(result?.id, created.id);
});

test('autoProgrammerPlugin - listSessions returns array', async () => {
  const sessions = await listSessions();
  assert.ok(Array.isArray(sessions));
});

test('autoProgrammerPlugin - listSessions filters by projectType', async () => {
  await generateProject({ projectType: 'game', title: 'Filter Test' });
  const sessions = await listSessions('game');
  assert.ok(Array.isArray(sessions));
  assert.ok(sessions.length > 0);
  sessions.forEach(s => assert.equal(s.projectType, 'game'));
});

test('autoProgrammerPlugin - deleteSession removes session', async () => {
  const created = await generateProject({ projectType: 'game', title: 'Delete Test' });
  const deleted = await deleteSession(created.id);
  assert.ok(deleted);
  const after = await listSessions();
  assert.equal(after.find(s => s.id === created.id), undefined);
});

test('autoProgrammerPlugin - deleteSession returns false for unknown id', async () => {
  assert.equal(await deleteSession('nonexistent-id'), false);
});

test('autoProgrammerPlugin - getProjectStats returns stats object', () => {
  const stats = getProjectStats();
  assert.ok(stats);
  assert.ok(typeof stats.totalSessions === 'number');
  assert.ok(typeof stats.byType === 'object');
  assert.ok(stats.totalSessions >= 0);
});
