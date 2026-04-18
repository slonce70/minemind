import assert from 'node:assert/strict';
import test from 'node:test';

import { validateQuestionBank } from '../src/features/content/content-validator';
import { difficultyConfig } from '../src/features/content/difficulty-config';
import {
  contentDifficulties,
  contentTopics,
} from '../src/features/content/types';

test('content taxonomy stays stable for difficulty and topic ids', () => {
  assert.deepEqual(contentDifficulties, ['easy', 'medium', 'hard']);
  assert.deepEqual(contentTopics, [
    'survival-basics',
    'crafting-and-smelting',
    'blocks-and-building',
    'mobs-and-combat',
    'farming-and-animals',
    'villagers-and-enchanting',
    'biomes-and-structures',
    'nether-end-and-redstone',
  ]);
});

test('difficulty config keeps stable timers and translation keys', () => {
  assert.equal(difficultyConfig.easy.timerSeconds, 20);
  assert.equal(difficultyConfig.medium.timerSeconds, 18);
  assert.equal(difficultyConfig.hard.timerSeconds, 15);
  assert.equal(difficultyConfig.easy.translationKey, 'content.difficulty.easy');
  assert.equal(difficultyConfig.medium.translationKey, 'content.difficulty.medium');
  assert.equal(difficultyConfig.hard.translationKey, 'content.difficulty.hard');
});

const validQuestion = {
  ageBand: '8-12',
  categoryId: 'minecraft',
  correctIndex: 1,
  difficulty: 'easy',
  explanation: {
    en: 'The crafting table unlocks the 3x3 grid needed for many important recipes.',
    ru: 'Верстак открывает сетку 3x3, поэтому без него недоступны многие важные рецепты.',
    uk: 'Верстак відкриває сітку 3x3, тому без нього багато важливих рецептів недоступні.',
  },
  id: 'crafting-table-basics',
  isActive: true,
  options: [
    { en: 'Furnace', ru: 'Печь', uk: 'Піч' },
    { en: 'Crafting Table', ru: 'Верстак', uk: 'Верстак' },
    { en: 'Chest', ru: 'Сундук', uk: 'Скриня' },
    { en: 'Bed', ru: 'Кровать', uk: 'Ліжко' },
  ],
  prompt: {
    en: 'Which block do players usually need to craft most recipes in Minecraft?',
    ru: 'Какой блок чаще всего нужен, чтобы создавать большинство рецептов в Minecraft?',
    uk: 'Який блок найчастіше потрібен, щоб створювати більшість рецептів у Minecraft?',
  },
  sourceVersion: 'minecraft-v1',
  tags: ['crafting', 'blocks', 'basics'],
  topicId: 'crafting-and-smelting',
};

test('validateQuestionBank accepts a fully tagged Minecraft question record', () => {
  const result = validateQuestionBank([validQuestion]);

  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'crafting-table-basics');
  assert.equal(result[0].categoryId, 'minecraft');
  assert.equal(result[0].topicId, 'crafting-and-smelting');
  assert.equal(result[0].prompt.uk, 'Який блок найчастіше потрібен, щоб створювати більшість рецептів у Minecraft?');
});

test('validateQuestionBank rejects duplicate question ids across the bank', () => {
  assert.throws(
    () =>
      validateQuestionBank([
        validQuestion,
        {
          ...validQuestion,
          tags: ['duplicate-check'],
        },
      ]),
    /question ids must be unique across the bank/
  );
});

test('validateQuestionBank normalizes ids before duplicate checks', () => {
  assert.throws(
    () =>
      validateQuestionBank([
        validQuestion,
        {
          ...validQuestion,
          id: 'crafting-table-basics ',
          tags: ['normalized-duplicate'],
        },
      ]),
    /question ids must be unique across the bank/
  );
});

test('validateQuestionBank rejects non-lowercase tags', () => {
  assert.throws(
    () =>
      validateQuestionBank([
        {
          ...validQuestion,
          tags: ['Crafting'],
        },
      ]),
    /Invalid string: must match pattern/
  );
});

test('validateQuestionBank rejects non-canonical sourceVersion casing', () => {
  assert.throws(
    () =>
      validateQuestionBank([
        {
          ...validQuestion,
          sourceVersion: 'Minecraft-V1',
        },
      ]),
    /Invalid string: must match pattern/
  );
});
