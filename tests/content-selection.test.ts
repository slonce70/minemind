import assert from 'node:assert/strict';
import test from 'node:test';

import { selectQuestionRound, shuffleRecordOptions } from '../src/features/content/content-selection';
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

test('shuffling keeps correctIndex pointed at the original correct option text', () => {
  for (const record of sampleQuestionBank) {
    const originalCorrect = record.options[record.correctIndex];

    for (const seed of ['alpha', 'beta', 'gamma', 'delta']) {
      const shuffled = shuffleRecordOptions(record, seed);

      assert.equal(shuffled.options.length, 4);
      assert.deepEqual(shuffled.options[shuffled.correctIndex], originalCorrect);
      // Every original option is still present exactly once.
      assert.deepEqual(
        [...shuffled.options].map((option) => option.en).sort(),
        [...record.options].map((option) => option.en).sort()
      );
    }
  }
});

test('shuffling is deterministic for the same seed and question', () => {
  const record = sampleQuestionBank[0];
  const first = shuffleRecordOptions(record, 'stable-seed');
  const second = shuffleRecordOptions(record, 'stable-seed');

  assert.deepEqual(first.options, second.options);
  assert.equal(first.correctIndex, second.correctIndex);
});

test('correct answer position is spread across all four slots, not pinned to A', () => {
  // The stored bank is ~93% option A; selection-time shuffling must break that
  // so players cannot memorize the position. Sample every option-bearing seed.
  const positions = new Map<number, number>([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);

  const record = sampleQuestionBank[0];
  for (let index = 0; index < 400; index += 1) {
    const shuffled = shuffleRecordOptions(record, `seed-${index}`);
    positions.set(shuffled.correctIndex, (positions.get(shuffled.correctIndex) ?? 0) + 1);
  }

  for (const [slot, count] of positions) {
    assert.ok(count > 0, `expected correct answer to land on slot ${slot} at least once`);
  }

  // No single slot should dominate the way the raw bank does (93% on A).
  const maxShare = Math.max(...positions.values()) / 400;
  assert.ok(maxShare < 0.5, `correct-answer position is too skewed (max share ${maxShare})`);
});
