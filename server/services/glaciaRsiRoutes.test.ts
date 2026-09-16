import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createHmac, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { registerRobotAutomationRoutes } from './robotAutomationRoutes.ts';

test('RSI HTTP boundary authenticates owner, validates mutations and persists pause', async t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'glacia-rsi-http-'));
  const previousStore = process.env.LEDGERFLOW_RSI_STORE_PATH;
  const previousSecret = process.env.LOCAL_AUTH_SESSION_SECRET;
  const secret = randomUUID();
  process.env.LEDGERFLOW_RSI_STORE_PATH = path.join(dir, 'cycles.json');
  process.env.LOCAL_AUTH_SESSION_SECRET = secret;
  t.after(() => {
    if (previousStore === undefined) delete process.env.LEDGERFLOW_RSI_STORE_PATH;
    else process.env.LEDGERFLOW_RSI_STORE_PATH = previousStore;
    if (previousSecret === undefined) delete process.env.LOCAL_AUTH_SESSION_SECRET;
    else process.env.LOCAL_AUTH_SESSION_SECRET = previousSecret;
    rmSync(dir, { recursive: true, force: true });
  });
  const app = express(); app.use(express.json()); registerRobotAutomationRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => {
    server.closeAllConnections(); server.close(error => error ? reject(error) : resolve());
  }));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/api/glacia/rsi`;
  const cookie = (email: string, role: string) => {
    const payload = Buffer.from(JSON.stringify({ email, role, loggedInAt: new Date().toISOString(), expiresAt: Date.now() + 60000 })).toString('base64url');
    return `ledgerflow_session=${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  };
  const ownerCookie = cookie('davidbao1704@gmail.com', 'owner');
  assert.equal((await fetch(`${url}/cycles`)).status, 403);
  assert.equal((await fetch(`${url}/cycles`, { headers: { cookie: cookie('davidbao1704@gmail.com', 'viewer') } })).status, 403);
  assert.equal((await fetch(`${url}/cycles`, { headers: { cookie: ownerCookie } })).status, 200);
  const post = (suffix: string, body: unknown) => fetch(url + suffix, { method: 'POST', headers: { cookie: ownerCookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await post('/cycles', { observation: 'invalid baseline missing' })).status, 400);
  assert.equal((await post('/pause', { paused: 'false' })).status, 400);
  const paused = await post('/pause', { paused: true });
  assert.equal(paused.status, 200); assert.equal((await paused.json()).paused, true);
  const blocked = await post('/cycles', { observation: 'A reproducible error case', baselineRevision: 'base-v1', baseline: [{ caseId: 'case', score: 0 }] });
  assert.equal(blocked.status, 400);
  assert.match((await blocked.json()).error, /tạm dừng/);
  assert.equal((await (await post('/pause', { paused: false })).json()).paused, false);
});
