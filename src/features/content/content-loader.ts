import { minecraftQuestionBank as legacyQuestionBank } from '../quiz/mock-data';

import { validateQuestionBank } from './content-validator';
import type {
  ContentQuestionBank,
  ContentQuestionRecord,
  ContentTopicId,
} from './types';

const canonicalQuestionBankData =
  require('../../../content/minecraft/minecraft-question-bank.v1.json') as unknown;

const legacyTopicByQuestionId: Record<string, ContentTopicId> = {
  biomes: 'biomes-and-structures',
  beds: 'survival-basics',
  'crafting-table': 'crafting-and-smelting',
  creeper: 'mobs-and-combat',
  'diamond-pickaxe': 'crafting-and-smelting',
  'end-dragon': 'nether-end-and-redstone',
  'nether-portal': 'nether-end-and-redstone',
  redstone: 'nether-end-and-redstone',
  torches: 'survival-basics',
  villagers: 'villagers-and-enchanting',
  'water-bucket': 'survival-basics',
  wheat: 'farming-and-animals',
};

function toLegacyRecord(question: (typeof legacyQuestionBank)[number]): ContentQuestionRecord {
  return {
    ageBand: '8-12',
    categoryId: 'minecraft',
    correctIndex: question.correctIndex,
    difficulty: 'medium',
    explanation: question.explanation,
    id: question.id,
    isActive: true,
    options: [
      question.options[0],
      question.options[1],
      question.options[2],
      question.options[3],
    ],
    prompt: question.prompt,
    sourceVersion: 'legacy-v0',
    tags: question.id.split('-'),
    topicId: legacyTopicByQuestionId[question.id] ?? 'survival-basics',
  };
}

function mergeQuestionBanks(
  canonicalRecords: ContentQuestionBank,
  legacyRecords: ContentQuestionBank
): ContentQuestionBank {
  const mergedById = new Map<string, ContentQuestionRecord>();

  canonicalRecords.forEach((record) => {
    mergedById.set(record.id, record);
  });

  legacyRecords.forEach((record) => {
    if (!mergedById.has(record.id)) {
      mergedById.set(record.id, record);
    }
  });

  return Array.from(mergedById.values());
}

let cachedQuestionBank: ContentQuestionBank | null = null;

export function loadMinecraftQuestionBank(): ContentQuestionBank {
  if (cachedQuestionBank) {
    return cachedQuestionBank;
  }

  const canonicalRecords = validateQuestionBank(canonicalQuestionBankData);
  const legacyRecords = legacyQuestionBank.map(toLegacyRecord);
  const mergedRecords = mergeQuestionBanks(canonicalRecords, legacyRecords);

  cachedQuestionBank = validateQuestionBank(mergedRecords);
  return cachedQuestionBank;
}
