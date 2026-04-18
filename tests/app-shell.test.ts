import assert from 'node:assert/strict';
import test from 'node:test';

import { minecraftCategory } from '../src/features/quiz/mock-data';
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
