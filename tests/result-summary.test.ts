import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeQuizResultSummary } from '../src/features/results/normalize-result-summary';
import { migratePersistedAppState } from '../src/state/app-store-migration';
import type { QuizResultSummary } from '../src/features/quiz/types';

function buildResult(overrides?: Partial<QuizResultSummary>): QuizResultSummary {
  return {
    bestStreak: 2,
    breakdown: [],
    completedAt: '2026-04-19T10:00:00.000Z',
    correctAnswers: 4,
    difficulty: 'hard',
    mode: 'solo',
    questionCount: 8,
    score: 762,
    speedBonus: 22,
    standings: [
      {
        isPlayer: true,
        name: 'You',
        score: 508,
      },
      {
        isPlayer: false,
        name: 'PixelFox',
        score: 390,
      },
    ],
    ...overrides,
  };
}

test('normalizeQuizResultSummary heals stale player standings from persisted results', () => {
  const normalized = normalizeQuizResultSummary(buildResult());

  assert.ok(normalized);
  assert.equal(normalized.standings[0]?.score, 762);
  assert.equal(normalized.standings[0]?.isPlayer, true);
});

test('normalizeQuizResultSummary returns the original object when standings already match', () => {
  const result = buildResult({
    standings: [
      {
        isPlayer: true,
        name: 'You',
        score: 762,
      },
    ],
  });

  assert.equal(normalizeQuizResultSummary(result), result);
});

test('normalizeQuizResultSummary trusts multi-player room standings over stale local hero score', () => {
  const result = buildResult({
    mode: 'room',
    standings: [
      {
        isPlayer: false,
        name: 'PixelFox',
        score: 880,
      },
      {
        isPlayer: true,
        name: 'You',
        score: 790,
      },
    ],
  });

  const normalized = normalizeQuizResultSummary(result);

  assert.ok(normalized);
  assert.equal(normalized.score, 790);
  assert.deepEqual(normalized.standings, result.standings);
});

test('store migration preserves legacy lastResult as the first recent match', () => {
  const migrated = migratePersistedAppState({ lastResult: buildResult({ mode: 'room', roomCode: 'AB12CD' }) });

  assert.equal(migrated.recentMatches.length, 1);
  assert.equal(migrated.lastMatchId, migrated.recentMatches[0]?.id);
  assert.equal(migrated.recentMatches[0]?.mode, 'room');
  assert.equal(migrated.recentMatches[0]?.transport, 'local');
});
