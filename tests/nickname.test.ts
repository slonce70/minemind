import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { profanityRoots, reservedNicknameWords } from '../supabase/functions/_shared/nickname-rules';
import { validateNickname } from '../src/features/profile/nickname';
import { generateNickname, nicknameCandidates } from '../src/features/profile/nickname-generator';

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

test('ordinary words that merely contain a blocked word are allowed', () => {
  for (const name of ['Modern', 'Essex', 'Sextant', 'Commodore', 'Model Builder', 'Небанальний', 'Страхуя', 'Сукня', 'Скорпіон']) {
    assert.equal(validateNickname(name).valid, true, name);
  }
});

test('blocked words are caught as whole words, in camelCase, with digits and leetspeak', () => {
  for (const name of ['Mod King', 'ModKing', 'admin_1', 'Admin123', 'SEX', 'sh1t', 'ShitHead', 'f u c k', 'Хуй', 'сука бля', '4dm1n']) {
    const result = validateNickname(name);

    assert.equal(result.valid, false, name);
    assert.equal(result.reasonKey, 'errors.nicknameUnsafe', name);
  }
});

test('every generated nickname is valid in every language', () => {
  for (const locale of ['uk', 'en', 'ru'] as const) {
    const candidates = nicknameCandidates(locale);

    assert.ok(candidates.length >= 100, `${locale}: ${candidates.length}`);

    for (const name of candidates) {
      assert.equal(validateNickname(name).valid, true, `${locale}: ${name}`);
    }
  }
});

test('the dice gives a different nickname than the current one', () => {
  const first = generateNickname('uk', () => 0);

  assert.notEqual(generateNickname('uk', () => 0, first), first);
});

test('the SQL nickname check blocks the same words as the shared rules', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261017130000_nickname_rules.sql', import.meta.url), 'utf8');
  const sqlList = (name: string) =>
    [...(sql.match(new RegExp(`${name} constant text\\[\\] := array\\[([\\s\\S]*?)\\];`))?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
      (match) => match[1]
    );

  assert.deepEqual(sqlList('reserved'), [...reservedNicknameWords]);
  assert.deepEqual(sqlList('roots'), [...profanityRoots]);
});
