import { validateQuestionBank } from './content-validator';
import type { ContentQuestionBank } from './types';

// The web keeps the question bank out of the first bundle: it is a separate chunk that loads
// while the app starts (the root layout waits for it). Native builds use content-loader.ts.
let cachedQuestionBank: ContentQuestionBank | null = null;
let pending: Promise<void> | null = null;

export function preloadQuestionBank(): Promise<void> {
  pending ??= import('../../../content/minecraft/minecraft-question-bank.v1.json')
    .then((module: { default?: unknown }) => {
      cachedQuestionBank = validateQuestionBank(module.default ?? module);
    })
    .catch((error: unknown) => {
      pending = null;
      throw error;
    });

  return pending;
}

export function isQuestionBankLoaded() {
  return cachedQuestionBank !== null;
}

export function loadMinecraftQuestionBank(): ContentQuestionBank {
  if (!cachedQuestionBank) {
    throw new Error('The question bank is still loading.');
  }

  return cachedQuestionBank;
}
