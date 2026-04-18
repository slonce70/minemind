import assert from 'node:assert/strict';
import test from 'node:test';

import { iconMap } from '../src/features/ui/icon-map';
import { themeArt } from '../src/features/ui/theme-art';
import { minecraftCategory } from '../src/features/quiz/mock-data';
import { resources } from '../src/i18n/resources';
import { appTheme } from '../src/theme/tokens';

test('app theme exposes bottom-safe shell tokens and interaction states', () => {
  assert.ok(appTheme.surface.base);
  assert.ok(appTheme.surface.raised);
  assert.ok(appTheme.feedback.correct);
  assert.ok(appTheme.feedback.wrong);
  assert.ok(appTheme.layout.screenPadding);
});

test('home metadata stays aligned with the documented round size', () => {
  assert.equal(minecraftCategory.roundQuestionCount, 8);
});

test('critical home and rooms copy exists in every supported locale', () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    assert.ok(resources[locale].translation.home.playSolo);
    assert.ok(resources[locale].translation.rooms.title);
    assert.ok(resources[locale].translation.results.title);
  }
});

test('fantasy layer exposes themed backgrounds and icon markers', () => {
  assert.ok(themeArt.overworld);
  assert.ok(themeArt.nether);
  assert.ok(iconMap.pickaxe);
  assert.ok(iconMap.trophy);
});
