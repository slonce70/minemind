import assert from 'node:assert/strict';
import test from 'node:test';

import { parseStartSoloRoundResponse } from '../src/lib/api-contracts';

test('start solo round parser rejects malformed payloads', () => {
  assert.throws(() => parseStartSoloRoundResponse({ questions: 'nope' }), /Invalid/);
});
