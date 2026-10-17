import assert from 'node:assert/strict';
import test from 'node:test';

import { minecraftQuestionRecordSchema } from '../src/features/content/content-validator';
import { shuffleRecordOptions } from '../src/features/content/content-selection';
import type { ContentQuestionRecord } from '../src/features/content/types';
import { buildSeedSql } from '../scripts/export-supabase-seed';
import { toDisplayOption, toDisplayOptions, toOriginalOption } from '../supabase/functions/_shared/round-integrity';

const text = (en: string) => ({ en, ru: `ру ${en}`, uk: `ук ${en}` });

const base = {
  ageBand: '8-12',
  categoryId: 'minecraft',
  difficulty: 'easy',
  explanation: text('Because.'),
  isActive: true,
  prompt: text('Prompt'),
  sourceVersion: 'test',
  tags: ['test'],
  topicId: 'crafting-and-smelting',
} satisfies Omit<ContentQuestionRecord, 'correctIndex' | 'id' | 'options'>;

const trueFalse: ContentQuestionRecord = { ...base, correctIndex: 1, id: 'tf', kind: 'true-false', options: [text('True'), text('False')] };
const recipe: ContentQuestionRecord = {
  ...base,
  correctIndex: 0,
  id: 'torch',
  kind: 'recipe',
  media: { grid: [null, 'coal', null, null, null, null, null, null, null], missingSlot: 4, type: 'recipe' },
  optionIcons: ['stick', 'bone', 'string', 'feather'],
  options: [text('Stick'), text('Bone'), text('String'), text('Feather')],
};

test('each question type has the shape it needs', () => {
  assert.ok(minecraftQuestionRecordSchema.safeParse(trueFalse).success);
  assert.ok(minecraftQuestionRecordSchema.safeParse(recipe).success);
  assert.ok(minecraftQuestionRecordSchema.safeParse({ ...base, correctIndex: 0, id: 'pic', kind: 'picture', media: { sprite: 'diamond', type: 'picture' }, options: recipe.options }).success);

  assert.ok(!minecraftQuestionRecordSchema.safeParse({ ...trueFalse, options: recipe.options }).success, 'true-false has two options');
  assert.ok(!minecraftQuestionRecordSchema.safeParse({ ...recipe, optionIcons: ['stick'] }).success, 'an icon per option');
  assert.ok(!minecraftQuestionRecordSchema.safeParse({ ...recipe, media: { ...recipe.media!, missingSlot: 1 } }).success, 'the missing slot is empty');
  assert.ok(!minecraftQuestionRecordSchema.safeParse({ ...base, correctIndex: 0, id: 'pic', kind: 'picture', media: { sprite: 'creeper-face', type: 'picture' }, options: recipe.options }).success, 'only our own sprites');
});

test('true/false keeps its order; recipe icons follow their options when shuffled', () => {
  assert.deepEqual(shuffleRecordOptions(trueFalse, 'seed'), trueFalse);

  for (const seed of ['a', 'b', 'c', 'd']) {
    const shuffled = shuffleRecordOptions(recipe, seed);
    const iconFor = Object.fromEntries(recipe.options.map((option, index) => [option.en, recipe.optionIcons![index]]));

    shuffled.options.forEach((option, index) => assert.equal(shuffled.optionIcons![index], iconFor[option.en]));
    assert.equal(shuffled.options[shuffled.correctIndex].en, 'Stick');
  }
});

test('the server shows two-option questions as they are and maps answers back', () => {
  assert.deepEqual(toDisplayOptions(['True', 'False'], 'round', 'q'), ['True', 'False']);
  assert.equal(toOriginalOption(1, 'round', 'q', 2), 1);
  assert.equal(toOriginalOption(2, 'round', 'q', 2), -1);
  assert.equal(toDisplayOption(0, 'round', 'q', 2), 0);

  // Icons get the same per-round order as their options.
  const options = ['Stick', 'Bone', 'String', 'Feather'];
  const shownOptions = toDisplayOptions(options, 'round-1', 'q1');
  const shownIcons = toDisplayOptions(['stick', 'bone', 'string', 'feather'], 'round-1', 'q1');

  shownOptions.forEach((option, index) => assert.equal(shownIcons[index], option.toLowerCase()));
});

test('the seed writes empty option columns and the media of new question types', () => {
  const sql = buildSeedSql([trueFalse, recipe]);

  assert.match(sql, /'True', 'False', null, null, 1/);
  assert.match(sql, /'recipe', '\{"grid":\[null,"coal"/);
  assert.match(sql, /array\['stick', 'bone', 'string', 'feather'\]::text\[\]/);
});
