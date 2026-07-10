import assert from 'node:assert/strict';
import test from 'node:test';

import {
  clampTimeLeftMs,
  computeRoundEndsAt,
  questionTimerMs,
} from '../supabase/functions/_shared/round-timing.ts';

test('question timer matches per-difficulty seconds', () => {
  assert.equal(questionTimerMs('easy'), 20000);
  assert.equal(questionTimerMs('medium'), 18000);
  assert.equal(questionTimerMs('hard'), 12000);
});

test('round deadline scales with question count plus a network grace window', () => {
  const started = '2026-07-10T12:00:00.000Z';
  const endsAt = computeRoundEndsAt(started, 'hard', 8);
  const elapsedMs = new Date(endsAt).getTime() - new Date(started).getTime();

  // 8 questions * 12s = 96s, plus grace. Must exceed the bare timer sum.
  assert.ok(elapsedMs > 8 * 12000, 'deadline should exceed the raw timer sum');
  assert.ok(elapsedMs < 8 * 12000 + 60000, 'grace window should stay bounded');
});

test('round deadline treats a zero question count as at least one question', () => {
  const started = '2026-07-10T12:00:00.000Z';
  const endsAt = computeRoundEndsAt(started, 'easy', 0);
  assert.ok(new Date(endsAt).getTime() > new Date(started).getTime());
});

test('clampTimeLeftMs bounds the client value to the difficulty timer', () => {
  // Inflated client claim is capped to the real per-question timer.
  assert.equal(clampTimeLeftMs(999999, 'hard'), 12000);
  assert.equal(clampTimeLeftMs(5000, 'medium'), 5000);
  assert.equal(clampTimeLeftMs(-100, 'easy'), 0);
});

test('clampTimeLeftMs rejects non-finite and missing values', () => {
  assert.equal(clampTimeLeftMs(undefined, 'medium'), 0);
  assert.equal(clampTimeLeftMs(Number.NaN, 'medium'), 0);
  assert.equal(clampTimeLeftMs(Number.POSITIVE_INFINITY, 'medium'), 0);
});
