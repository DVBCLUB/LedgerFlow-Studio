import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import type { IncomingMessage } from 'node:http';
import {
  authenticateWebSocketUpgrade,
  trackWebSocketConnection,
  validateIncomingWsMessage,
  type WebSocketClientContext,
} from './websocketAuth.ts';
import { createLocalSession, SESSION_COOKIE_NAME } from './localAuth.ts';
import { resetUserAccountsForTest } from './userAccounts.ts';

function mockIncomingMessage(overrides: Partial<IncomingMessage> = {}): IncomingMessage {
  return {
    headers: {},
    url: '/ws/test',
    socket: {
      remoteAddress: '192.168.1.50',
    },
    ...overrides,
  } as unknown as IncomingMessage;
}

beforeEach(() => {
  resetUserAccountsForTest();
});

test('websocketAuth - rejects unauthenticated remote connection', () => {
  const req = mockIncomingMessage({
    headers: {},
    socket: { remoteAddress: '192.168.1.100' } as any,
  });

  const result = authenticateWebSocketUpgrade(req);
  assert.equal(result.allowed, false);
  assert.equal(result.statusCode, 401);
});

test('websocketAuth - accepts valid cookie session from remote connection', () => {
  const prevPass = process.env.LOCAL_AUTH_DEV_PASSWORD;
  process.env.LOCAL_AUTH_DEV_PASSWORD = 'ws-test-password';
  try {
    const session = createLocalSession('davidbao1704@gmail.com', 'ws-test-password');
    assert.ok(session);

    const req = mockIncomingMessage({
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${session.token}`,
      },
      socket: { remoteAddress: '192.168.1.100' } as any,
    });

    const result = authenticateWebSocketUpgrade(req);
    assert.equal(result.allowed, true);
    assert.equal(result.context?.email, 'davidbao1704@gmail.com');
  } finally {
    if (prevPass === undefined) delete process.env.LOCAL_AUTH_DEV_PASSWORD;
    else process.env.LOCAL_AUTH_DEV_PASSWORD = prevPass;
  }
});

test('websocketAuth - accepts URL query token and API Bearer token', () => {
  const prevToken = process.env.LEDGERFLOW_API_TOKEN;
  process.env.LEDGERFLOW_API_TOKEN = 'secret-ws-api-token-123';
  try {
    // Via Authorization header
    const reqHeader = mockIncomingMessage({
      headers: {
        authorization: 'Bearer secret-ws-api-token-123',
      },
      socket: { remoteAddress: '10.0.0.5' } as any,
    });
    const resHeader = authenticateWebSocketUpgrade(reqHeader);
    assert.equal(resHeader.allowed, true);
    assert.equal(resHeader.context?.role, 'automation');

    // Via URL query param
    const reqQuery = mockIncomingMessage({
      url: '/ws/test?token=secret-ws-api-token-123',
      socket: { remoteAddress: '10.0.0.5' } as any,
    });
    const resQuery = authenticateWebSocketUpgrade(reqQuery);
    assert.equal(resQuery.allowed, true);
    assert.equal(resQuery.context?.role, 'automation');
  } finally {
    if (prevToken === undefined) delete process.env.LEDGERFLOW_API_TOKEN;
    else process.env.LEDGERFLOW_API_TOKEN = prevToken;
  }
});

test('websocketAuth - allows loopback address in dev or desktop mode', () => {
  const prevDesktop = process.env.ELECTRON_DESKTOP;
  process.env.ELECTRON_DESKTOP = 'true';
  try {
    const req = mockIncomingMessage({
      headers: {},
      socket: { remoteAddress: '127.0.0.1' } as any,
    });
    const res = authenticateWebSocketUpgrade(req);
    assert.equal(res.allowed, true);
    assert.equal(res.context?.email, 'davidbao1704@gmail.com');
  } finally {
    if (prevDesktop === undefined) delete process.env.ELECTRON_DESKTOP;
    else process.env.ELECTRON_DESKTOP = prevDesktop;
  }
});

test('websocketAuth - tracks connection lifecycle and enforces IP limit', () => {
  const ip = '172.16.0.99';
  const cleanups: (() => void)[] = [];

  try {
    // Fill up to max (30)
    for (let i = 0; i < 30; i++) {
      cleanups.push(trackWebSocketConnection(ip));
    }

    const req = mockIncomingMessage({
      headers: {},
      socket: { remoteAddress: ip } as any,
    });
    const res = authenticateWebSocketUpgrade(req);
    assert.equal(res.allowed, false);
    assert.equal(res.statusCode, 429);
  } finally {
    cleanups.forEach((c) => c());
  }
});

test('websocketAuth - validates incoming message format and rate limit', () => {
  const ctx: WebSocketClientContext = {
    authenticated: true,
    email: 'davidbao1704@gmail.com',
    role: 'owner',
    clientIp: '127.0.0.1',
    connectedAt: Date.now(),
    messageCount: 0,
    lastMessageTimestamp: Date.now(),
  };

  // Valid message
  const valid = validateIncomingWsMessage(JSON.stringify({ type: 'ping', payload: 123 }), ctx);
  assert.equal(valid.valid, true);
  assert.equal(valid.data?.type, 'ping');

  // Missing type
  const noType = validateIncomingWsMessage(JSON.stringify({ foo: 'bar' }), ctx);
  assert.equal(noType.valid, false);
  assert.match(noType.error || '', /missing "type"/);

  // Malformed JSON
  const malformed = validateIncomingWsMessage('{ bad json', ctx);
  assert.equal(malformed.valid, false);
  assert.match(malformed.error || '', /Malformed JSON/);
});
