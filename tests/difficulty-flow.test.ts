import assert from 'node:assert/strict';
import test from 'node:test';

import { difficultyConfig } from '../src/features/content/difficulty-config';
import { resources } from '../src/i18n/resources';

test('difficulty labels exist in all supported locales', () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    assert.ok(resources[locale].translation.content.difficulty.easy);
    assert.ok(resources[locale].translation.content.difficulty.medium);
    assert.ok(resources[locale].translation.content.difficulty.hard);
  }

  assert.ok(difficultyConfig.easy.translationKey);
  assert.ok(difficultyConfig.medium.translationKey);
  assert.ok(difficultyConfig.hard.translationKey);
});
