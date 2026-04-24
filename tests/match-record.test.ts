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
