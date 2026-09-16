import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GlaciaError,
  isGlaciaError,
  wrapGlaciaError,
  toSafeErrorResponse,
  logGlaciaError,
} from './glaciaError.ts';

test('GlaciaError - instantiates with default and explicit properties', () => {
  const err = new GlaciaError('Access denied', {
    code: 'GLACIA_POLICY_VIOLATION',
    component: 'PolicyEngine',
    details: { reason: 'Unauthorized action' },
  });

  assert.equal(err.name, 'GlaciaError');
  assert.equal(err.code, 'GLACIA_POLICY_VIOLATION');
  assert.equal(err.statusCode, 403);
  assert.equal(err.retryable, false);
  assert.equal(err.component, 'PolicyEngine');
  assert.equal(err.details.reason, 'Unauthorized action');
  assert.ok(err.timestamp);
});

test('GlaciaError - recognizes retryable codes', () => {
  const timeoutErr = new GlaciaError('Model took too long', {
    code: 'GLACIA_RATE_LIMITED',
  });
  assert.equal(timeoutErr.retryable, true);
  assert.equal(timeoutErr.statusCode, 429);
});

test('isGlaciaError - correctly checks instance', () => {
  const customErr = new GlaciaError('Test', { code: 'GLACIA_INTERNAL_ERROR' });
  const standardErr = new Error('Standard');

  assert.equal(isGlaciaError(customErr), true);
  assert.equal(isGlaciaError(standardErr), false);
  assert.equal(isGlaciaError('string error'), false);
  assert.equal(isGlaciaError(null), false);
});

test('wrapGlaciaError - preserves GlaciaError and wraps generic error', () => {
  const original = new GlaciaError('Custom', { code: 'GLACIA_AUTH_REQUIRED' });
  const wrappedOriginal = wrapGlaciaError(original);
  assert.equal(wrappedOriginal, original);

  const generic = new Error('Disk read failed');
  const wrappedGeneric = wrapGlaciaError(generic, 'GLACIA_INTERNAL_ERROR', 'FileStore');
  assert.equal(wrappedGeneric.code, 'GLACIA_INTERNAL_ERROR');
  assert.equal(wrappedGeneric.component, 'FileStore');
  assert.equal(wrappedGeneric.message, 'Disk read failed');
  assert.equal(wrappedGeneric.cause, generic);
});

test('toSafeErrorResponse - formats response cleanly', () => {
  const err = new GlaciaError('Invalid payload', {
    code: 'GLACIA_VALIDATION_FAILED',
  });
  const res = toSafeErrorResponse(err);

  assert.deepEqual(res, {
    success: false,
    error: 'Invalid payload',
    code: 'GLACIA_VALIDATION_FAILED',
    retryable: false,
  });
});
