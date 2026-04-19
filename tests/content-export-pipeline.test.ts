import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRuntimeQuestionRecord } from '../scripts/export-master-question-packs';

test('approved translated master records map to runtime question shape', () => {
  const runtimeRecord = buildRuntimeQuestionRecord({
    id: 'survival-easy-001',
    topicId: 'survival-basics',
    difficulty: 'easy',
    correctAnswer: 'Bread',
    tags: ['food'],
    sourceVersion: 'minecraft-v2',
    isActive: true,
    localized: {
      en: {
        prompt: 'Which food item can restore hunger?',
        explanation: 'Bread is a common food item.',
        options: ['Bread', 'Stone', 'Stick', 'Sand'],
      },
      uk: {
        prompt: 'Яка їжа відновлює голод?',
        explanation: 'Хліб — звична їжа в Minecraft.',
        options: ['Хліб', 'Камінь', 'Палиця', 'Пісок'],
      },
      ru: {
        prompt: 'Какая еда восстанавливает голод?',
        explanation: 'Хлеб — обычная еда в Minecraft.',
        options: ['Хлеб', 'Камень', 'Палка', 'Песок'],
      },
    },
  });

  assert.equal(runtimeRecord.correctIndex, 0);
  assert.equal(runtimeRecord.prompt.en, 'Which food item can restore hunger?');
  assert.equal(runtimeRecord.options[0].uk, 'Хліб');
});

test('export pipeline derives correctIndex from the localized english answer order', () => {
  const runtimeRecord = buildRuntimeQuestionRecord({
    id: 'crafting-medium-001',
    topicId: 'crafting-and-smelting',
    difficulty: 'medium',
    correctAnswer: 'Pickaxe',
    tags: ['tools', 'mining'],
    sourceVersion: 'minecraft-v2',
    isActive: true,
    localized: {
      en: {
        prompt: 'Which tool mines stone and drops cobblestone?',
        explanation: 'A pickaxe is the correct mining tool for stone.',
        options: ['Hoe', 'Shovel', 'Pickaxe', 'Axe'],
      },
      uk: {
        prompt: 'Який інструмент добуває камінь і дає кругляк?',
        explanation: 'Кайло є правильним інструментом для каменю.',
        options: ['Мотика', 'Лопата', 'Кайло', 'Сокира'],
      },
      ru: {
        prompt: 'Какой инструмент добывает камень и даёт булыжник?',
        explanation: 'Кирка — правильный инструмент для камня.',
        options: ['Мотыга', 'Лопата', 'Кирка', 'Топор'],
      },
    },
  });

  assert.equal(runtimeRecord.correctIndex, 2);
  assert.equal(runtimeRecord.options[2].en, 'Pickaxe');
});

test('export pipeline falls back russian content to ukrainian when ukrainian is the only ship-ready localization', () => {
  const runtimeRecord = buildRuntimeQuestionRecord({
    id: 'mobs-hard-001',
    topicId: 'mobs-and-combat',
    difficulty: 'hard',
    correctAnswer: 'Bee',
    tags: ['mobs', 'neutral', 'bees'],
    sourceVersion: 'minecraft-v2',
    isActive: true,
    localized: {
      en: {
        prompt: 'Breaking a nest without smoke can anger which flying mob into a swarm attack?',
        explanation: 'Bees can swarm and sting when their nest is broken without calming smoke.',
        options: ['Bat', 'Bee', 'Goat', 'Parrot'],
      },
      uk: {
        prompt: 'Який літаючий моб може зграєю напасти, якщо зламати гніздо без диму?',
        explanation: 'Бджоли можуть розлютитися й почати жалити, якщо зламати гніздо без диму від багаття.',
        options: ['Кажан', 'Бджола', 'Коза', 'Папуга'],
      },
    },
  });

  assert.equal(runtimeRecord.prompt.ru, runtimeRecord.prompt.uk);
  assert.equal(runtimeRecord.explanation.ru, runtimeRecord.explanation.uk);
  assert.equal(runtimeRecord.options[1].ru, 'Бджола');
});
