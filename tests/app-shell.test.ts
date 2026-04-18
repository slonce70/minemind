import assert from 'node:assert/strict';
import test from 'node:test';

import { appTheme } from '../src/theme/tokens';

test('app theme exposes bottom-safe shell tokens and interaction states', () => {
  assert.ok(appTheme.surface.base);
  assert.ok(appTheme.surface.raised);
  assert.ok(appTheme.feedback.correct);
  assert.ok(appTheme.feedback.wrong);
  assert.ok(appTheme.layout.screenPadding);
});
