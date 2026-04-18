import test from 'node:test';
import assert from 'node:assert/strict';

import { validateNickname } from '../src/features/profile/nickname';

test('accepts a safe nickname', () => {
  const result = validateNickname('BlockFox');

  assert.equal(result.valid, true);
  assert.equal(result.sanitizedValue, 'BlockFox');
});

test('rejects unsafe nicknames', () => {
  const result = validateNickname('AdminBoss');

  assert.equal(result.valid, false);
  assert.equal(result.reasonKey, 'errors.nicknameUnsafe');
});

test('normalizes whitespace in nickname', () => {
  const result = validateNickname('  Craft   Bee  ');

  assert.equal(result.valid, true);
  assert.equal(result.sanitizedValue, 'Craft Bee');
});

test('rejects nickname with punctuation and keeps trimmed value for recovery', () => {
  const result = validateNickname('  Craft!!!  ');

  assert.equal(result.valid, false);
  assert.equal(result.reasonKey, 'errors.nicknameInvalidChars');
  assert.equal(result.sanitizedValue, 'Craft!!!');
});
