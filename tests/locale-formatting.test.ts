import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { formatPlayerCount } from '../src/lib/count-format';

test('formatPlayerCount uses correct plural forms for supported locales', () => {
  assert.equal(formatPlayerCount('uk', 1), '1 гравець');
  assert.equal(formatPlayerCount('uk', 2), '2 гравці');
  assert.equal(formatPlayerCount('uk', 5), '5 гравців');

  assert.equal(formatPlayerCount('ru', 1), '1 игрок');
  assert.equal(formatPlayerCount('ru', 3), '3 игрока');
  assert.equal(formatPlayerCount('ru', 7), '7 игроков');

  assert.equal(formatPlayerCount('en', 1), '1 player');
  assert.equal(formatPlayerCount('en', 4), '4 players');
});

test('normalizeLocale falls back to ukrainian for unsupported locales', () => {
  const source = readFileSync(new URL('../src/lib/locale.ts', import.meta.url), 'utf8');

  assert.match(source, /export const defaultAppLocale = 'uk'/);
  assert.match(source, /if \(value\.startsWith\('uk'\)\) \{\s*return 'uk';\s*\}/);
  assert.match(source, /if \(value\.startsWith\('ru'\)\) \{\s*return 'ru';\s*\}/);
  assert.match(source, /return defaultAppLocale;/);
});
