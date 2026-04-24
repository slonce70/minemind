import { validateQuestionBank } from './content-validator';
import type {
  ContentQuestionBank,
} from './types';

const canonicalQuestionBankData =
  require('../../../content/minecraft/minecraft-question-bank.v1.json') as unknown;

let cachedQuestionBank: ContentQuestionBank | null = null;

export function loadMinecraftQuestionBank(): ContentQuestionBank {
  if (cachedQuestionBank) {
    return cachedQuestionBank;
  }

  const canonicalRecords = validateQuestionBank(canonicalQuestionBankData);

  cachedQuestionBank = canonicalRecords;
  return cachedQuestionBank;
}
