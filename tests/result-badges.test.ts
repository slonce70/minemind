import assert from 'node:assert/strict';
import test from 'node:test';

import { getResultBadgeModel } from '../src/features/results/result-badges';

test('hard mode win gets a distinct result badge', () => {
  const badge = getResultBadgeModel({ difficulty: 'hard', perfectRound: true });

  assert.equal(badge.id, 'nether-pro-perfect');
});

test('non-perfect rounds fall back to the standard clear badge', () => {
  const badge = getResultBadgeModel({ difficulty: 'medium', perfectRound: false });

  assert.equal(badge.id, 'standard-clear');
});
