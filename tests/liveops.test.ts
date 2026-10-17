import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { MasterQuestionRecord } from '../src/features/content/master-types';
import { checkQuestionPack } from '../scripts/add-question-pack';
import { compareGameVersions, questionsToReview } from '../scripts/audit-game-version';
import { summarizeReports } from '../scripts/list-question-reports';

const bank = JSON.parse(
  readFileSync(new URL('../content/minecraft/minecraft-master-bank.v2.json', import.meta.url), 'utf8')
) as MasterQuestionRecord[];

test('game versions compare by number, not as text', () => {
  assert.equal(compareGameVersions('1.21', '1.22'), -1);
  assert.equal(compareGameVersions('1.21.10', '1.21.4'), 1);
  assert.equal(compareGameVersions('1.21', '1.21.0'), 0);
});

test('after an update, version-gated questions verified on an older version come up for review', () => {
  const gated = bank.filter((record) => record.versionGated && record.isActive);

  assert.equal(questionsToReview(bank, '1.21').length, 0, 'everything is checked on 1.21');
  assert.equal(questionsToReview(bank, '1.22').length, gated.length);
  assert.ok(questionsToReview(bank, '1.22', true).length > gated.length);
});

test('a question pack is refused when it repeats the bank or misses its version', () => {
  const copy = { ...bank[0], id: 'pack-copy', verifiedForVersion: undefined };
  const problems = checkQuestionPack(bank, [copy]);

  assert.ok(problems.some((problem) => problem.includes('verifiedForVersion')));
  assert.ok(problems.some((problem) => problem.startsWith('duplicate')));
  assert.deepEqual(checkQuestionPack(bank, []), []);
});

test('reports are grouped per question with reasons and languages', () => {
  const summary = summarizeReports([
    { content_id: 'a', created_at: '', locale: 'uk', reason: 'typo' },
    { content_id: 'b', created_at: '', locale: 'en', reason: 'outdated' },
    { content_id: 'b', created_at: '', locale: 'ru', reason: 'outdated' },
  ]);

  assert.deepEqual(summary[0], { contentId: 'b', locales: ['en', 'ru'], reasons: { outdated: 2 }, total: 2 });
  assert.equal(summary[1].contentId, 'a');
});
