import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeMatchRecord } from '../src/features/results/normalize-match-record';
import type { QuizResultSummary } from '../src/features/quiz/types';

function buildResult(overrides?: Partial<QuizResultSummary>): QuizResultSummary {
  return {
    bestStreak: 3,
    breakdown: [
      {
        explanation: 'Creepers бояться котів.',
        isCorrect: true,
        prompt: 'Хто відлякує creeper?',
        questionId: 'cats-vs-creepers',
        selectedIndex: 1,
      },
    ],
    completedAt: '2026-04-19T12:00:00.000Z',
    correctAnswers: 6,
    difficulty: 'medium',
    mode: 'solo',
    questionCount: 8,
    score: 684,
    speedBonus: 84,
    standings: [
      {
        isPlayer: true,
        name: 'Лисобок',
        score: 684,
      },
    ],
    ...overrides,
  };
}

test('records for the same round share a stable id regardless of completedAt', () => {
  // A room round finalized and later recovered builds two summaries with
  // different completedAt timestamps. Anchoring on roundId keeps the id stable
  // so saveMatchRecord dedupes them instead of storing two history entries.
  const finalized = normalizeMatchRecord({
    authority: 'server',
    input: buildResult({ completedAt: '2026-04-19T12:00:00.000Z', mode: 'room', roomCode: 'AB12CD' }),
    isDemo: false,
    roundId: 'round-123',
    transport: 'supabase',
  });
  const recovered = normalizeMatchRecord({
    authority: 'server',
    input: buildResult({ completedAt: '2026-04-19T12:05:30.000Z', mode: 'room', roomCode: 'AB12CD' }),
    isDemo: false,
    roundId: 'round-123',
    transport: 'supabase',
  });

  assert.equal(finalized.id, recovered.id);
});

test('records without a roundId still get unique ids per play', () => {
  const first = normalizeMatchRecord({
    authority: 'client',
    input: buildResult({ completedAt: '2026-04-19T12:00:00.000Z' }),
    isDemo: false,
    transport: 'local',
  });
  const second = normalizeMatchRecord({
    authority: 'client',
    input: buildResult({ completedAt: '2026-04-19T12:09:00.000Z' }),
    isDemo: false,
    transport: 'local',
  });

  assert.notEqual(first.id, second.id);
});

test('normalizeMatchRecord creates a truthful local solo match record', () => {
  const record = normalizeMatchRecord({
    authority: 'client',
    input: buildResult(),
    isDemo: false,
    transport: 'local',
  });

  assert.equal(record.mode, 'solo');
  assert.equal(record.transport, 'local');
  assert.equal(record.authority, 'client');
  assert.equal(record.syncStatus, 'local-only');
  assert.equal(record.isDemo, false);
  assert.equal(record.score, 684);
  assert.equal(record.participants.length, 1);
  assert.equal(record.participants[0]?.isPlayer, true);
});
