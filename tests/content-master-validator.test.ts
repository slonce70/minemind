import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { validateMasterQuestionProgram } from '../src/features/content/master-content-validator';
import type { ContentDifficulty, ContentTopicId } from '../src/features/content/types';

test('question slot blueprint sums to 1080 records', () => {
  const slots = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-question-slots.v1.json', import.meta.url), 'utf8')
  );

  const total = slots.reduce((sum: number, slot: { targetCount: number }) => sum + slot.targetCount, 0);
  assert.equal(total, 1080);
});

test('source register includes primary Minecraft Wiki and minecraft.net entries', () => {
  const sources = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-source-register.v1.json', import.meta.url), 'utf8')
  );

  assert.ok(sources.some((entry: { id: string }) => entry.id === 'wiki-block'));
  assert.ok(sources.some((entry: { id: string }) => entry.id === 'official-how-to-craft'));
});

test('master question program rejects records without sources', () => {
  assert.throws(
    () =>
      validateMasterQuestionProgram({
        sourceRegister: [],
        slotBlueprint: [],
        masterBank: [
          {
            id: 'survival-easy-001',
            categoryId: 'minecraft',
            topicId: 'survival-basics',
            clusterId: 'health-hunger-safety',
            difficulty: 'easy',
            ageBand: '8-12',
            canonScope: 'common-canon',
            promptEn: 'Which item restores hunger?',
            correctAnswer: 'Bread',
            distractors: ['Stone', 'Sand', 'Stick'],
            explanationEn: 'Bread is a food item.',
            tags: ['food'],
            sourceVersion: 'minecraft-v2',
            reviewStatus: 'draft',
            translationStatus: 'not-started',
            versionGated: false,
            isActive: false,
            sources: [],
          },
        ],
      }),
    /at least one source/
  );
});

test('approved master bank keeps the wave one floor with balanced topic-difficulty coverage', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    canonScope: string;
    difficulty: ContentDifficulty;
    reviewStatus: string;
    topicId: ContentTopicId;
  }>;

  assert.ok(bank.length >= 120);
  assert.ok(bank.every((record) => record.canonScope === 'common-canon'));
  assert.ok(bank.every((record) => record.reviewStatus === 'approved'));

  const coverage = new Map<string, number>();

  for (const record of bank) {
    const key = `${record.topicId}:${record.difficulty}`;
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
  }

  assert.equal(coverage.size, 24);
  for (const count of coverage.values()) {
    assert.ok(count >= 5);
  }
});

test('villager and biome wave-two slices reach 15 records per difficulty pair', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    difficulty: ContentDifficulty;
    topicId: ContentTopicId;
  }>;

  const trackedTopics: ContentTopicId[] = [
    'villagers-and-enchanting',
    'biomes-and-structures',
  ];

  const coverage = new Map<string, number>();

  for (const record of bank) {
    if (!trackedTopics.includes(record.topicId)) {
      continue;
    }

    const key = `${record.topicId}:${record.difficulty}`;
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
  }

  assert.equal(coverage.size, 6);
  for (const count of coverage.values()) {
    assert.equal(count, 15);
  }
});

test('survival and crafting wave-three slices reach 15 records per difficulty pair', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    difficulty: ContentDifficulty;
    topicId: ContentTopicId;
  }>;

  const trackedTopics: ContentTopicId[] = [
    'survival-basics',
    'crafting-and-smelting',
  ];

  const coverage = new Map<string, number>();

  for (const record of bank) {
    if (!trackedTopics.includes(record.topicId)) {
      continue;
    }

    const key = `${record.topicId}:${record.difficulty}`;
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
  }

  assert.equal(coverage.size, 6);
  for (const count of coverage.values()) {
    assert.equal(count, 15);
  }
});

test('blocks and farming wave-four slices reach 15 records per difficulty pair', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    difficulty: ContentDifficulty;
    topicId: ContentTopicId;
  }>;

  const trackedTopics: ContentTopicId[] = [
    'blocks-and-building',
    'farming-and-animals',
  ];

  const coverage = new Map<string, number>();

  for (const record of bank) {
    if (!trackedTopics.includes(record.topicId)) {
      continue;
    }

    const key = `${record.topicId}:${record.difficulty}`;
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
  }

  assert.equal(coverage.size, 6);
  for (const count of coverage.values()) {
    assert.equal(count, 15);
  }
});

test('mobs and nether wave-five slices reach 15 records per difficulty pair', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    difficulty: ContentDifficulty;
    topicId: ContentTopicId;
  }>;

  const trackedTopics: ContentTopicId[] = [
    'mobs-and-combat',
    'nether-end-and-redstone',
  ];

  const coverage = new Map<string, number>();

  for (const record of bank) {
    if (!trackedTopics.includes(record.topicId)) {
      continue;
    }

    const key = `${record.topicId}:${record.difficulty}`;
    coverage.set(key, (coverage.get(key) ?? 0) + 1);
  }

  assert.equal(coverage.size, 6);
  for (const count of coverage.values()) {
    assert.equal(count, 15);
  }
});

test('approved master bank ships ukrainian localization for every record', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    id: string;
    localized?: {
      en?: { explanation: string; options: string[]; prompt: string };
      uk?: { explanation: string; options: string[]; prompt: string };
    };
    reviewStatus: string;
    translationStatus: string;
  }>;

  assert.ok(bank.every((record) => record.reviewStatus === 'approved'));
  assert.ok(bank.every((record) => record.translationStatus === 'complete'));
  assert.ok(
    bank.every(
      (record) =>
        record.localized?.en?.prompt &&
        record.localized?.en?.explanation &&
        record.localized?.en?.options.length === 4 &&
        record.localized?.uk?.prompt &&
        record.localized?.uk?.explanation &&
        record.localized?.uk?.options.length === 4
    )
  );
});

test('ukrainian localization avoids placeholder phrasing and known broken terms', () => {
  const bank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{
    id: string;
    localized: {
      uk: { explanation: string; options: string[]; prompt: string };
    };
  }>;

  const bannedPatterns = [
    /саме той варіант/,
    / АРМ/,
    /підліани/,
    /Пожежні витрати/,
    /океанського пам'ятника/,
    /Кінцеве місто/,
    /\bЗовнішні острови Енд\b/,
    /Руїни океану/,
    /Тропічна колода/,
    /щитівки/,
  ];

  for (const record of bank) {
    const prompt = record.localized.uk.prompt;
    const explanation = record.localized.uk.explanation;
    const options = record.localized.uk.options;
    const combined = [prompt, explanation, ...options].join(' || ');

    for (const pattern of bannedPatterns) {
      assert.doesNotMatch(
        combined,
        pattern,
        `${record.id} still matches banned pattern: ${pattern}`
      );
    }

    assert.match(prompt, /^[A-ZА-ЯІЇЄҐ0-9]/, `${record.id} prompt should start with an uppercase character`);
    for (const option of options) {
      assert.match(option, /^[A-ZА-ЯІЇЄҐ0-9]/, `${record.id} option should start with an uppercase character`);
    }
  }
});

test('runtime question bank stays in sync with the fully localized master bank', () => {
  const masterBank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
  ) as Array<{ id: string }>;
  const runtimeBank = JSON.parse(
    readFileSync(new URL('../content/minecraft/minecraft-question-bank.v1.json', import.meta.url), 'utf8')
  ) as Array<{ id: string }>;

  assert.equal(runtimeBank.length, masterBank.length);
  assert.deepEqual(
    runtimeBank.map((record) => record.id).sort(),
    masterBank.map((record) => record.id).sort()
  );
});
