import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

import { buildQuizResult, getSoloQuestionSet } from '../src/features/quiz/quiz-service';
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

test('buildQuizResult calculates score, streak, and correctness', () => {
  const answers: QuizAnswerMap = {
    q1: { selectedIndex: 1, timeLeft: 10 },
    q2: { selectedIndex: 0, timeLeft: 5 },
  };

  const result = buildQuizResult(sampleQuestions, answers);

  assert.equal(result.correctAnswers, 2);
  assert.equal(result.bestStreak, 2);
  assert.equal(result.speedBonus, 90);
  assert.equal(result.score, 290);
  assert.equal(result.mode, 'solo');
});

test('buildQuizResult respects explicit room mode and standings', () => {
  const answers: QuizAnswerMap = {
    q1: { selectedIndex: 1, timeLeft: 8 },
    q2: { selectedIndex: -1, timeLeft: 0 },
  };

  const result = buildQuizResult(sampleQuestions, answers, {
    mode: 'room',
    roomCode: 'AB12CD',
    standings: [
      { isPlayer: true, name: 'Player', score: 148 },
      { isPlayer: false, name: 'BeeBot', score: 190 },
    ],
  });

  assert.equal(result.mode, 'room');
  assert.equal(result.roomCode, 'AB12CD');
  assert.equal(result.correctAnswers, 1);
  assert.equal(result.score, 148);
  assert.equal(result.standings[1].name, 'BeeBot');
});

test('buildQuizResult can use server-authenticated answer payloads without local correct indexes', () => {
  const liveQuestions: QuizQuestion[] = [
    {
      id: 'live-q1',
      options: ['Furnace', 'Crafting Table', 'Chest', 'Bed'],
      prompt: 'Which block unlocks the 3x3 crafting grid?',
    },
  ];

  const answers: QuizAnswerMap = {
    'live-q1': {
      correctIndex: 1,
      explanation: 'The crafting table unlocks the 3x3 grid.',
      isCorrect: true,
      selectedIndex: 1,
      timeLeft: 9,
    },
  };

  const result = buildQuizResult(liveQuestions, answers);

  assert.equal(result.correctAnswers, 1);
  assert.equal(result.score, 154);
  assert.equal(result.breakdown[0].explanation, 'The crafting table unlocks the 3x3 grid.');
});

test('buildQuizResult keeps player standings and speed bonus in the result model', () => {
  const result = buildQuizResult(sampleQuestions, {
    q1: { selectedIndex: 1, timeLeft: 10 },
    q2: { selectedIndex: 0, timeLeft: 5 },
  });

  assert.equal(result.standings[0].isPlayer, true);
  assert.equal(result.speedBonus, 90);
});

test('buildQuizResult can derive fallback standings from the final multiplied score', () => {
  const result = buildQuizResult(sampleQuestions, {
    q1: { selectedIndex: 1, timeLeft: 10 },
    q2: { selectedIndex: 0, timeLeft: 5 },
  }, {
    difficulty: 'hard',
    mode: 'room',
    roomCode: 'ZX90QP',
    standingsBuilder: (finalScore) => [
      { isPlayer: true, name: 'Player', score: finalScore },
      { isPlayer: false, name: 'BeeBot', score: finalScore + 42 },
    ],
  });

  // hard = x1.5: (100 + 10*6) * 1.5 + (100 + 5*6) * 1.5
  assert.equal(result.score, 435);
  assert.deepEqual(result.standings, [
    { isPlayer: true, name: 'Player', score: 435 },
    { isPlayer: false, name: 'BeeBot', score: 477 },
  ]);
});

test('getSoloQuestionSet returns localized questions for the requested difficulty', () => {
  const round = getSoloQuestionSet('uk', 8, 'medium', 'stable-seed');

  assert.equal(round.length, 8);
  assert.ok(round.every((question) => typeof question.prompt === 'string'));
  assert.ok(round.every((question) => question.options.length === (question.kind === 'true-false' ? 2 : 4)));
  // Picture and true/false prompts are short by nature.
  assert.ok(round.every((question) => (question.kind ?? 'choice') !== 'choice' || question.prompt.length >= 40));
});

test('solo questions carry a valid correctIndex so answers can be scored', () => {
  // Regression guard: online solo previously routed through the server, which
  // returns sanitized questions without a correct answer, so every solo answer
  // scored 0. Solo must always come from the local bank with correctIndex set.
  const round = getSoloQuestionSet('en', 8, 'hard', 'scoring-seed');

  assert.ok(round.length > 0);
  assert.ok(
    round.every(
      (question) =>
        typeof question.correctIndex === 'number' &&
        question.correctIndex >= 0 &&
        question.correctIndex < question.options.length
    ),
    'every solo question must expose a scorable correctIndex'
  );
});

test('getSoloQuestionSet does not mix in the old legacy question bank', () => {
  const legacyQuestionIds = new Set([
    'biomes',
    'beds',
    'crafting-table',
    'creeper',
    'diamond-pickaxe',
    'end-dragon',
    'nether-portal',
    'redstone',
    'torches',
    'villagers',
    'water-bucket',
    'wheat',
  ]);
  const round = getSoloQuestionSet('uk', 120, 'medium', 'legacy-filter');

  assert.ok(round.every((question) => !legacyQuestionIds.has(question.id)));
});

test('getSoloQuestionSet stays deterministic for the same seed', () => {
  const first = getSoloQuestionSet('en', 8, 'medium', 'stable-seed').map((question) => question.id);
  const second = getSoloQuestionSet('en', 8, 'medium', 'stable-seed').map((question) => question.id);

  assert.deepEqual(first, second);
});

test('the AI question illustrations are gone from the app and the web export', () => {
  assert.equal(existsSync(new URL('../assets/question-illustrations', import.meta.url)), false);
  assert.equal(existsSync(new URL('../public/question-illustrations', import.meta.url)), false);
});

test('solo questions carry their topic for the question card icon', () => {
  const round = getSoloQuestionSet('uk', 8, 'easy', 'topic-coverage');

  assert.ok(round.every((question) => typeof question.topicId === 'string'));
});

test('the result breakdown keeps the options and the right answer for the review', () => {
  const result = buildQuizResult(sampleQuestions, { q1: { selectedIndex: 0, timeLeft: 4 } });

  assert.deepEqual(result.breakdown[0].options, sampleQuestions[0].options);
  assert.equal(result.breakdown[0].correctIndex, 1);
  assert.equal(result.breakdown[0].selectedIndex, 0);
  assert.equal(result.breakdown[0].isCorrect, false);
});

test('medium rounds also carry topics for every question', () => {
  const round = getSoloQuestionSet('uk', 8, 'medium', 'topic-coverage-medium');

  assert.ok(round.every((question) => typeof question.topicId === 'string'));
});
