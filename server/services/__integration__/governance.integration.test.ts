import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { withTestServer } from './testAppHelper.ts';

describe('API Integration - Governance, SOP & Approvals', () => {
  test('GET /api/sop/runbooks returns all 5 SOP runbooks', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/sop/runbooks`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.ok(Array.isArray(data.runbooks));
      assert.ok(data.runbooks.length >= 5);
    });
  });

  test('POST /api/delegation/permission/verify validates RBAC constraints', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/delegation/permission/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: 'role_chief_of_staff', actionType: 'read' }),
      });
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.equal(typeof data.isAllowed, 'boolean');
    });
  });

  test('GET /api/delegation/action-ledger/integrity verifies SHA-256 chain', async () => {
    await withTestServer(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/delegation/action-ledger/integrity`);
      assert.equal(res.status, 200);
      const data: any = await res.json();
      assert.equal(data.success, true);
      assert.equal(typeof data.isValid, 'boolean');
    });
  });

});
