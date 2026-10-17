import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAnswerReport } from '../src/features/quiz/answer-report';
import { suggestDifficultyChanges } from '../src/features/content/difficulty-calibration';

const stats = (content_id: string, attempts: number, correct: number, averageMs = 6000) => ({
  answer_ms_total: averageMs * correct,
  attempts,
  content_id,
  correct,
  timed_answers: correct,
});

test('questions that are too easy or too hard for their level get a one-step suggestion', () => {
  const bank = [
    { difficulty: 'hard' as const, id: 'everyone-knows' },
    { difficulty: 'easy' as const, id: 'nobody-knows' },
    { difficulty: 'medium' as const, id: 'just-right' },
    { difficulty: 'medium' as const, id: 'too-few-answers' },
    { difficulty: 'medium' as const, id: 'slow-and-borderline' },
  ];
  const suggestions = suggestDifficultyChanges(bank, [
    stats('everyone-knows', 100, 95),
    stats('nobody-knows', 80, 20),
    stats('just-right', 120, 70),
    stats('too-few-answers', 5, 0),
    stats('slow-and-borderline', 60, 26, 14_000),
  ]);

  assert.deepEqual(
    suggestions.map((entry) => [entry.id, entry.from, entry.to]),
    [
      ['everyone-knows', 'hard', 'medium'],
      ['nobody-knows', 'easy', 'medium'],
      ['slow-and-borderline', 'medium', 'hard'],
    ]
  );
});

test('the solo answer report has right/wrong and time per answered question', () => {
  const questions = [
    { correctIndex: 1, id: 'a', options: ['x', 'y'], prompt: 'a' },
    { correctIndex: 0, id: 'b', options: ['x', 'y'], prompt: 'b' },
    { correctIndex: 0, id: 'c', options: ['x', 'y'], prompt: 'c' },
  ];
  const report = buildAnswerReport(
    questions,
    { a: { selectedIndex: 1, timeLeft: 14 }, b: { selectedIndex: -1, timeLeft: 0 } },
    18
  );

  assert.deepEqual(report, [
    { answerMs: 4000, correct: true, questionId: 'a' },
    { answerMs: null, correct: false, questionId: 'b' },
  ]);
});
