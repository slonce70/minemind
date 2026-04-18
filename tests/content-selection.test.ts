import assert from 'node:assert/strict';
import test from 'node:test';

import { selectQuestionRound } from '../src/features/content/content-selection';
import type { ContentQuestionRecord } from '../src/features/content/types';

const sampleQuestionBank: ContentQuestionRecord[] = [
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'survival-1',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Survival 1', ru: 'Выживание 1', uk: 'Виживання 1' },
    sourceVersion: 'test-v1',
    tags: ['survival'],
    topicId: 'survival-basics',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'survival-2',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Survival 2', ru: 'Выживание 2', uk: 'Виживання 2' },
    sourceVersion: 'test-v1',
    tags: ['survival'],
    topicId: 'survival-basics',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'crafting-1',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Crafting 1', ru: 'Крафт 1', uk: 'Крафт 1' },
    sourceVersion: 'test-v1',
    tags: ['crafting'],
    topicId: 'crafting-and-smelting',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'crafting-2',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Crafting 2', ru: 'Крафт 2', uk: 'Крафт 2' },
    sourceVersion: 'test-v1',
    tags: ['crafting'],
    topicId: 'crafting-and-smelting',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'mobs-1',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Mobs 1', ru: 'Мобы 1', uk: 'Моби 1' },
    sourceVersion: 'test-v1',
    tags: ['mobs'],
    topicId: 'mobs-and-combat',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'mobs-2',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Mobs 2', ru: 'Мобы 2', uk: 'Моби 2' },
    sourceVersion: 'test-v1',
    tags: ['mobs'],
    topicId: 'mobs-and-combat',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'biomes-1',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Biomes 1', ru: 'Биомы 1', uk: 'Біоми 1' },
    sourceVersion: 'test-v1',
    tags: ['biomes'],
    topicId: 'biomes-and-structures',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'medium',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'biomes-2',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Biomes 2', ru: 'Биомы 2', uk: 'Біоми 2' },
    sourceVersion: 'test-v1',
    tags: ['biomes'],
    topicId: 'biomes-and-structures',
  },
  {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: 0,
    difficulty: 'easy',
    explanation: { en: 'Fact', ru: 'Факт', uk: 'Факт' },
    id: 'easy-extra',
    isActive: true,
    options: [
      { en: 'A', ru: 'A', uk: 'A' },
      { en: 'B', ru: 'B', uk: 'B' },
      { en: 'C', ru: 'C', uk: 'C' },
      { en: 'D', ru: 'D', uk: 'D' },
    ],
    prompt: { en: 'Easy', ru: 'Легко', uk: 'Легко' },
    sourceVersion: 'test-v1',
    tags: ['easy'],
    topicId: 'survival-basics',
  },
];

test('round selection returns the requested question count for the requested difficulty', () => {
  const round = selectQuestionRound({
    bank: sampleQuestionBank,
    count: 8,
    difficulty: 'medium',
    seed: 'alpha',
  });

  assert.equal(round.length, 8);
  assert.ok(round.every((entry) => entry.difficulty === 'medium'));
});

test('round selection stays deterministic for the same seed', () => {
  const first = selectQuestionRound({
    bank: sampleQuestionBank,
    count: 6,
    difficulty: 'medium',
    seed: 'alpha',
  }).map((entry) => entry.id);
  const second = selectQuestionRound({
    bank: sampleQuestionBank,
    count: 6,
    difficulty: 'medium',
    seed: 'alpha',
  }).map((entry) => entry.id);

  assert.deepEqual(first, second);
});

test('round selection spreads topics before repeating when enough topics exist', () => {
  const round = selectQuestionRound({
    bank: sampleQuestionBank,
    count: 4,
    difficulty: 'medium',
    seed: 'alpha',
  });

  assert.equal(new Set(round.map((entry) => entry.topicId)).size, 4);
});
