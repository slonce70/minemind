import assert from 'node:assert/strict';
import test from 'node:test';

import { buildQuizResult } from '../src/features/quiz/quiz-service';
import type { QuizAnswerMap, QuizQuestion } from '../src/features/quiz/types';

const sampleQuestions: QuizQuestion[] = [
  {
    correctIndex: 1,
    explanation: 'A crafting table unlocks the 3x3 crafting grid.',
    id: 'q1',
    options: ['Bed', 'Crafting Table', 'Furnace', 'Chest'],
    prompt: 'Which block unlocks the 3x3 crafting grid?',
  },
  {
    correctIndex: 0,
    explanation: 'Creepers are the iconic exploding mob.',
    id: 'q2',
    options: ['Creeper', 'Slime', 'Bee', 'Villager'],
    prompt: 'Which mob sneaks up and explodes?',
  },
];

const sampleAnswers: QuizAnswerMap = {
  q1: { selectedIndex: 1, timeLeft: 10 },
  q2: { selectedIndex: 0, timeLeft: 5 },
};

test('hard mode applies the configured score multiplier', () => {
  const result = buildQuizResult(sampleQuestions, sampleAnswers, {
    difficulty: 'hard',
    mode: 'solo',
  });

  assert.ok(result.score > 290);
  assert.equal(result.difficulty, 'hard');
});
