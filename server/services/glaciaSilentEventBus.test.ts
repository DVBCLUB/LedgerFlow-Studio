import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  glaciaEventBus,
  emitSystemEvent,
  getSystemEventHistory,
} from './glaciaSilentEventBus.ts';

describe('Glacia Silent Event Bus & Asynchronous Dispatcher', () => {
  it('subscribes and emits events asynchronously with silent payload delivery', async () => {
    let received = false;
    const unsubscribe = glaciaEventBus.on('TRANSACTION_RECORDED', (ev) => {
      if (ev.data.amount === 5000000) {
        received = true;
      }
    });

    const event = emitSystemEvent('TRANSACTION_RECORDED', { amount: 5000000, account: '1121' });
    assert.equal(event.eventType, 'TRANSACTION_RECORDED');
    assert.equal(event.processedSilently, true);

    await new Promise((r) => setTimeout(r, 10));
    assert.equal(received, true);
    unsubscribe();
  });

  it('retrieves event history log without memory leaks', () => {
    emitSystemEvent('SECURITY_AUDIT_COMPLETED', { passed: true });
    const history = getSystemEventHistory(10);
    assert.ok(history.length > 0);
    assert.equal(history[0].processedSilently, true);
  });
});
