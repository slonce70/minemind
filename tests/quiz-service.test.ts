import test from 'node:test';
import assert from 'node:assert/strict';

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
