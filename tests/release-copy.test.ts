import assert from 'node:assert/strict';
import test from 'node:test';

import { questionReportReasons } from '../supabase/functions/_shared/question-reports';
import { createGateChallenge, isGateAnswerRight } from '../src/features/parental/parental-gate';
import { releaseResources } from '../src/i18n/release-resources';

function keyPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) => keyPaths(child, prefix ? `${prefix}.${key}` : key));
}

test('release texts have the same keys in every locale and a name for every report reason', () => {
  const uk = keyPaths(releaseResources.uk).sort();

  for (const locale of ['en', 'ru'] as const) {
    assert.deepEqual(keyPaths(releaseResources[locale]).sort(), uk);
  }

  for (const locale of ['uk', 'en', 'ru'] as const) {
    assert.equal(releaseResources[locale].parents.numbers.length, 10);
    for (const reason of questionReportReasons) assert.ok(releaseResources[locale].report.reasons[reason]);
  }
});

test('the parental gate asks a product of two numbers from 3 to 9 and checks digits only', () => {
  const low = createGateChallenge(() => 0);
  const high = createGateChallenge(() => 0.999);

  assert.deepEqual(low, { a: 3, b: 3 });
  assert.deepEqual(high, { a: 9, b: 9 });
  assert.ok(isGateAnswerRight({ a: 7, b: 8 }, ' 56 '));
  assert.ok(!isGateAnswerRight({ a: 7, b: 8 }, '54'));
  assert.ok(!isGateAnswerRight({ a: 7, b: 8 }, '56.0'));
  assert.ok(!isGateAnswerRight({ a: 7, b: 8 }, ''));
});
