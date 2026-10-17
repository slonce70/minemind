import assert from 'node:assert/strict';
import test from 'node:test';

import { achievementCatalog } from '../src/features/progress/achievements';
import { cardCatalog } from '../src/features/progress/cards';
import { dailyQuestIds, ranks } from '../src/features/progress/progression';
import { progressResources } from '../src/i18n/progress-resources';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object') {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

test('progress texts have the same keys in every locale', () => {
  const uk = keyPaths(progressResources.uk).sort();

  assert.deepEqual(keyPaths(progressResources.en).sort(), uk);
  assert.deepEqual(keyPaths(progressResources.ru).sort(), uk);
});

test('every card, achievement, rank and daily quest has a name', () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    const copy = progressResources[locale];

    for (const card of cardCatalog) assert.ok(copy.cards[card.id as keyof typeof copy.cards], `${locale} card ${card.id}`);
    for (const entry of achievementCatalog) assert.ok(copy.achievements[entry.id]?.name, `${locale} ${entry.id}`);
    for (const rank of ranks) assert.ok(copy.progress.rank[rank.id], `${locale} rank ${rank.id}`);
    for (const quest of dailyQuestIds) assert.ok(copy.progress.daily[quest], `${locale} quest ${quest}`);
  }
});

test('ukrainian and russian texts use their own letters', () => {
  const values = (locale: 'uk' | 'ru') =>
    JSON.stringify(progressResources[locale]).match(/"[^"]*[А-Яа-яІіЇїЄєҐґЁё][^"]*"/g) ?? [];

  assert.ok(values('uk').every((text) => !/[ЫыЭэЪъЁё]/.test(text)), 'uk has russian-only letters');
  assert.ok(values('ru').every((text) => !/[ІіЇїЄєҐґ]/.test(text)), 'ru has ukrainian-only letters');
});
