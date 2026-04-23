import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQuizResult,
  getQuestionIllustration,
  getSoloQuestionSet,
} from '../src/features/quiz/quiz-service';
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
  assert.ok(round.every((question) => question.options.length === 4));
  assert.ok(round.some((question) => question.prompt.includes('Minecraft') || question.prompt.includes('майн')));
});

test('getSoloQuestionSet stays deterministic for the same seed', () => {
  const first = getSoloQuestionSet('en', 8, 'medium', 'stable-seed').map((question) => question.id);
  const second = getSoloQuestionSet('en', 8, 'medium', 'stable-seed').map((question) => question.id);

  assert.deepEqual(first, second);
});

test('question illustration manifest exposes generated biome assets by question id', () => {
  assert.deepEqual(getQuestionIllustration('badlands-has-terracotta'), {
    alt: 'Voxel badlands biome with layered terracotta hills',
    id: 'badlands-has-terracotta',
    imageUri: '/question-illustrations/badlands-has-terracotta.png',
  });
  assert.deepEqual(getQuestionIllustration('bamboo-jungle-has-bamboo'), {
    alt: 'Voxel bamboo jungle filled with tall bamboo stalks',
    id: 'bamboo-jungle-has-bamboo',
    imageUri: '/question-illustrations/bamboo-jungle-has-bamboo.png',
  });
  assert.deepEqual(getQuestionIllustration('bee-pollinates-crops'), {
    alt: 'Voxel bee pollinating wheat and flowers beside a farm',
    id: 'bee-pollinates-crops',
    imageUri: '/question-illustrations/bee-pollinates-crops.png',
  });
  assert.deepEqual(getQuestionIllustration('creeper-explodes'), {
    alt: 'Voxel creeper in tall grass just before exploding',
    id: 'creeper-explodes',
    imageUri: '/question-illustrations/creeper-explodes.png',
  });
  assert.deepEqual(getQuestionIllustration('obsidian-from-water-and-lava'), {
    alt: 'Voxel water and lava meeting to form obsidian',
    id: 'obsidian-from-water-and-lava',
    imageUri: '/question-illustrations/obsidian-from-water-and-lava.png',
  });
  assert.deepEqual(getQuestionIllustration('village-has-villagers'), {
    alt: 'Voxel village with houses, crop fields, and safe settlement clues',
    id: 'village-has-villagers',
    imageUri: '/question-illustrations/village-has-villagers.png',
  });
  assert.equal(getQuestionIllustration('unknown-question'), undefined);
});

test('localized question rounds carry illustration metadata when available', () => {
  const round = getSoloQuestionSet('uk', 120, 'easy', 'illustration-coverage');
  const creeper = round.find((question) => question.id === 'creeper-explodes');
  const obsidian = round.find((question) => question.id === 'obsidian-from-water-and-lava');
  const village = round.find((question) => question.id === 'village-has-villagers');

  assert.equal(creeper?.illustration?.imageUri, '/question-illustrations/creeper-explodes.png');
  assert.equal(creeper?.illustration?.alt, 'Блоковий кріпер у високій траві перед вибухом');
  assert.equal(obsidian?.illustration?.imageUri, '/question-illustrations/obsidian-from-water-and-lava.png');
  assert.equal(obsidian?.illustration?.alt, 'Блокова вода торкається лави й утворює обсидіан');
  assert.equal(village?.illustration?.imageUri, '/question-illustrations/village-has-villagers.png');
  assert.equal(village?.illustration?.alt, 'Блокове село з будинками, грядками й ознаками безпечного поселення');
});

test('medium rounds expose active illustration metadata for farming questions', () => {
  const round = getSoloQuestionSet('uk', 120, 'medium', 'illustration-coverage-medium');
  const bee = round.find((question) => question.id === 'bee-pollinates-crops');

  assert.equal(bee?.illustration?.imageUri, '/question-illustrations/bee-pollinates-crops.png');
  assert.equal(bee?.illustration?.alt, 'Блокова бджола запилює пшеницю й квіти біля ферми');
});
