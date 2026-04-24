import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';

import {
  buildQuizResult,
  getQuestionIllustration,
  getSoloQuestionSet,
} from '../src/features/quiz/quiz-service';
import { illustratedQuestionIds } from '../src/features/quiz/question-illustrations';
import type { QuizAnswerMap, QuizQuestion } from '../src/features/quiz/types';

const maxQuestionIllustrationBytes = 820 * 1024;

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
  assert.deepEqual(getQuestionIllustration('igloo-in-snowy-biomes'), {
    alt: 'Voxel igloo in a snowy biome with ice and spruce trees',
    id: 'igloo-in-snowy-biomes',
    imageUri: '/question-illustrations/igloo-in-snowy-biomes.png',
  });
  assert.deepEqual(getQuestionIllustration('ocean-monument-guardians'), {
    alt: 'Voxel ocean monument underwater with guardians nearby',
    id: 'ocean-monument-guardians',
    imageUri: '/question-illustrations/ocean-monument-guardians.png',
  });
  assert.deepEqual(getQuestionIllustration('obsidian-from-water-and-lava'), {
    alt: 'Voxel water and lava meeting to form obsidian',
    id: 'obsidian-from-water-and-lava',
    imageUri: '/question-illustrations/obsidian-from-water-and-lava.png',
  });
  assert.deepEqual(getQuestionIllustration('redstone-dust-carries-power'), {
    alt: 'Voxel redstone dust line powering a lamp on stone blocks',
    id: 'redstone-dust-carries-power',
    imageUri: '/question-illustrations/redstone-dust-carries-power.png',
  });
  assert.deepEqual(getQuestionIllustration('sand-falls-with-gravity'), {
    alt: 'Voxel sand block falling from a ledge because of gravity',
    id: 'sand-falls-with-gravity',
    imageUri: '/question-illustrations/sand-falls-with-gravity.png',
  });
  assert.deepEqual(getQuestionIllustration('skeleton-uses-bow'), {
    alt: 'Voxel skeleton aiming a bow in a dark field',
    id: 'skeleton-uses-bow',
    imageUri: '/question-illustrations/skeleton-uses-bow.png',
  });
  assert.deepEqual(getQuestionIllustration('torch-lights-caves'), {
    alt: 'Voxel torch casting warm light inside a dark stone cave',
    id: 'torch-lights-caves',
    imageUri: '/question-illustrations/torch-lights-caves.png',
  });
  assert.deepEqual(getQuestionIllustration('village-has-villagers'), {
    alt: 'Voxel village with houses, crop fields, and safe settlement clues',
    id: 'village-has-villagers',
    imageUri: '/question-illustrations/village-has-villagers.png',
  });
  assert.equal(getQuestionIllustration('unknown-question'), undefined);
});

test('question illustration assets stay mirrored and within the web bundle budget', () => {
  assert.ok(illustratedQuestionIds.length >= 12);

  for (const questionId of illustratedQuestionIds) {
    const assetFile = new URL(`../assets/question-illustrations/${questionId}.png`, import.meta.url);
    const publicFile = new URL(`../public/question-illustrations/${questionId}.png`, import.meta.url);

    assert.ok(existsSync(assetFile), `Expected asset illustration for ${questionId}`);
    assert.ok(existsSync(publicFile), `Expected public illustration for ${questionId}`);

    const assetSize = statSync(assetFile).size;
    const publicSize = statSync(publicFile).size;

    assert.equal(publicSize, assetSize, `Expected mirrored illustration sizes for ${questionId}`);
    assert.ok(
      assetSize <= maxQuestionIllustrationBytes,
      `Expected ${questionId}.png to stay under ${maxQuestionIllustrationBytes} bytes, got ${assetSize}`,
    );
  }
});

test('localized question rounds carry illustration metadata when available', () => {
  const round = getSoloQuestionSet('uk', 120, 'easy', 'illustration-coverage');
  const creeper = round.find((question) => question.id === 'creeper-explodes');
  const obsidian = round.find((question) => question.id === 'obsidian-from-water-and-lava');
  const redstone = round.find((question) => question.id === 'redstone-dust-carries-power');
  const sand = round.find((question) => question.id === 'sand-falls-with-gravity');
  const skeleton = round.find((question) => question.id === 'skeleton-uses-bow');
  const torch = round.find((question) => question.id === 'torch-lights-caves');
  const village = round.find((question) => question.id === 'village-has-villagers');

  assert.equal(creeper?.illustration?.imageUri, '/question-illustrations/creeper-explodes.png');
  assert.equal(creeper?.illustration?.alt, 'Блоковий кріпер у високій траві перед вибухом');
  assert.equal(obsidian?.illustration?.imageUri, '/question-illustrations/obsidian-from-water-and-lava.png');
  assert.equal(obsidian?.illustration?.alt, 'Блокова вода торкається лави й утворює обсидіан');
  assert.equal(redstone?.illustration?.imageUri, '/question-illustrations/redstone-dust-carries-power.png');
  assert.equal(redstone?.illustration?.alt, 'Блокова лінія редстоун-пилу живить лампу на камені');
  assert.equal(sand?.illustration?.imageUri, '/question-illustrations/sand-falls-with-gravity.png');
  assert.equal(sand?.illustration?.alt, 'Блоковий пісок падає з уступу через гравітацію');
  assert.equal(skeleton?.illustration?.imageUri, '/question-illustrations/skeleton-uses-bow.png');
  assert.equal(skeleton?.illustration?.alt, 'Блоковий скелет цілиться з лука в темному полі');
  assert.equal(torch?.illustration?.imageUri, '/question-illustrations/torch-lights-caves.png');
  assert.equal(torch?.illustration?.alt, 'Блоковий факел кидає тепле світло в темній камʼяній печері');
  assert.equal(village?.illustration?.imageUri, '/question-illustrations/village-has-villagers.png');
  assert.equal(village?.illustration?.alt, 'Блокове село з будинками, грядками й ознаками безпечного поселення');
});

test('medium rounds expose active illustration metadata for farming and structure questions', () => {
  const round = getSoloQuestionSet('uk', 120, 'medium', 'illustration-coverage-medium');
  const bee = round.find((question) => question.id === 'bee-pollinates-crops');
  const igloo = round.find((question) => question.id === 'igloo-in-snowy-biomes');
  const monument = round.find((question) => question.id === 'ocean-monument-guardians');

  assert.equal(bee?.illustration?.imageUri, '/question-illustrations/bee-pollinates-crops.png');
  assert.equal(bee?.illustration?.alt, 'Блокова бджола запилює пшеницю й квіти біля ферми');
  assert.equal(igloo?.illustration?.imageUri, '/question-illustrations/igloo-in-snowy-biomes.png');
  assert.equal(igloo?.illustration?.alt, 'Блокове іглу в сніжному біомі з кригою та ялинами');
  assert.equal(monument?.illustration?.imageUri, '/question-illustrations/ocean-monument-guardians.png');
  assert.equal(monument?.illustration?.alt, 'Блоковий океанічний монумент під водою з вартовими поруч');
});
