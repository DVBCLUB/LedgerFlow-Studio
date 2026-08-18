import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldRequireMoneyApproval } from './aiBusinessBridge.ts';

test('money entities from AI/workflow require approval', () => {
  assert.equal(shouldRequireMoneyApproval({ type: 'invoice', source: 'ai' }), true);
  assert.equal(shouldRequireMoneyApproval({ type: 'deal', source: 'ai' }), true);
  assert.equal(shouldRequireMoneyApproval({ type: 'invoice', source: 'workflow' }), true);
  assert.equal(shouldRequireMoneyApproval({ type: 'invoice' }), true, 'default source = ai');
});

test('money entities from user do NOT require approval', () => {
  assert.equal(shouldRequireMoneyApproval({ type: 'invoice', source: 'user' }), false);
  assert.equal(shouldRequireMoneyApproval({ type: 'deal', source: 'user' }), false);
});

test('non-money entities never require approval', () => {
  assert.equal(shouldRequireMoneyApproval({ type: 'task', source: 'ai' }), false);
  assert.equal(shouldRequireMoneyApproval({ type: 'campaign', source: 'ai' }), false);
  assert.equal(shouldRequireMoneyApproval({ type: 'lead', source: 'ai' }), false);
  assert.equal(shouldRequireMoneyApproval({ type: 'customer', source: 'ai' }), false);
});
