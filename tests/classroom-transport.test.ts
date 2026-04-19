import assert from 'node:assert/strict';
import test from 'node:test';

import { createLocalHostTransport } from '../src/features/classroom/local-host-transport';

test('local host transport exposes start, join, publish, and close operations', () => {
  const transport = createLocalHostTransport({
    advertise: async () => undefined,
    close: async () => undefined,
    connect: async () => undefined,
    publish: async () => undefined,
    subscribe: () => () => undefined,
  });

  assert.ok(transport.startHostSession);
  assert.ok(transport.joinHostSession);
  assert.ok(transport.publishEvent);
  assert.ok(transport.subscribe);
  assert.ok(transport.close);
});
