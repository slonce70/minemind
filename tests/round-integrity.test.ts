import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { scoreAnswer } from '../supabase/functions/_shared/game-rules.ts';
import {
  buildRoundRanking,
  computeRoundEndsAt,
  computeServerTimeLeftMs,
  isRoundExpired,
  pickSeededIds,
  toDisplayOption,
  toDisplayOptions,
  toOriginalOption,
} from '../supabase/functions/_shared/round-integrity.ts';
import { buildSeedSql, questionBankPath, seedPath } from '../scripts/export-supabase-seed';
import { validateQuestionBank } from '../src/features/content/content-validator';

const readSource = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('one scoring formula: 100 + 6 per second left, times the difficulty multiplier', () => {
  assert.equal(scoreAnswer({ isCorrect: true, timeLeftMs: 10_900 }), 160);
  assert.equal(scoreAnswer({ difficulty: 'medium', isCorrect: true, timeLeftMs: 10_000 }), 200);
  assert.equal(scoreAnswer({ difficulty: 'hard', isCorrect: true, timeLeftMs: 10_000 }), 240);
  assert.equal(scoreAnswer({ difficulty: 'hard', isCorrect: false, timeLeftMs: 10_000 }), 0);
});

test('server measures time left from when the question was opened', () => {
  const openedAt = '2026-10-16T10:00:00.000Z';

  assert.equal(
    computeServerTimeLeftMs({ difficulty: 'hard', now: new Date('2026-10-16T10:00:05.000Z'), openedAt }),
    10_000
  );
  // Inside the network grace window: answer counts, no bonus left.
  assert.equal(
    computeServerTimeLeftMs({ difficulty: 'hard', now: new Date('2026-10-16T10:00:16.000Z'), openedAt }),
    0
  );
  assert.equal(
    computeServerTimeLeftMs({ difficulty: 'hard', now: new Date('2026-10-16T10:00:30.000Z'), openedAt }),
    null
  );
  assert.equal(computeServerTimeLeftMs({ difficulty: 'easy', now: new Date(), openedAt: null }), 0);
});

test('round deadline covers every question plus reading time, then expires', () => {
  const startedAt = new Date('2026-10-16T10:00:00.000Z');
  const endsAt = computeRoundEndsAt({ difficulty: 'hard', questionCount: 8, startedAt });

  assert.equal(endsAt.toISOString(), '2026-10-16T10:03:50.000Z');
  assert.equal(isRoundExpired(endsAt.toISOString(), new Date('2026-10-16T10:03:49.000Z')), false);
  assert.equal(isRoundExpired(endsAt.toISOString(), endsAt), true);
  assert.equal(isRoundExpired(null, new Date()), false);
});

test('per-round option order maps displayed answers back to the stored option', () => {
  const options = ['A', 'B', 'C', 'D'];
  const displayed = toDisplayOptions(options, 'round-7', 'question-3');

  displayed.forEach((option, displayIndex) => {
    const original = toOriginalOption(displayIndex, 'round-7', 'question-3');

    assert.equal(options[original], option);
    assert.equal(toDisplayOption(original, 'round-7', 'question-3'), displayIndex);
  });
  assert.equal(toOriginalOption(-1, 'round-7', 'question-3'), -1);
  assert.equal(toOriginalOption(9, 'round-7', 'question-3'), -1);
});

test('server picks a seeded random subset instead of the first rows', () => {
  const ids = Array.from({ length: 40 }, (_, index) => `q-${index}`);
  const first = pickSeededIds(ids, 8, 'seed-a');

  assert.equal(new Set(first).size, 8);
  assert.deepEqual(first, pickSeededIds(ids, 8, 'seed-a'));
  assert.notDeepEqual(first, pickSeededIds(ids, 8, 'seed-b'));
  assert.notDeepEqual(first, ids.slice(0, 8));
});

test('ranking gives silent players zero and applies the difficulty multiplier', () => {
  const ranking = buildRoundRanking({
    correctOptionByQuestionId: new Map([
      ['q1', 0],
      ['q2', 2],
    ]),
    difficulty: 'hard',
    participantIds: ['fast', 'silent'],
    questionIds: ['q1', 'q2'],
    roundId: 'r1',
    submissions: [
      { player_id: 'fast', question_id: 'q1', selected_option: 0, time_left_ms: 10_000 },
      { player_id: 'fast', question_id: 'q2', selected_option: null, time_left_ms: null },
    ],
  });

  assert.deepEqual(
    ranking.map(({ correct_count, player_id, rank, score }) => ({ correct_count, player_id, rank, score })),
    [
      { correct_count: 1, player_id: 'fast', rank: 1, score: 240 },
      { correct_count: 0, player_id: 'silent', rank: 2, score: 0 },
    ]
  );
});

test('submit-answer allows one answer and ignores client-reported time', () => {
  const source = readSource('../supabase/functions/submit-answer/index.ts');

  assert.doesNotMatch(source, /\.upsert\([^)]*selected_option: selectedOption/s);
  assert.doesNotMatch(source, /timeLeftMs\?:/);
  assert.match(source, /Answer already submitted/);
  assert.match(source, /\.is\('selected_option', null\)/);
  assert.match(source, /computeServerTimeLeftMs\(/);
});

test('migration unifies pack difficulty, locks question tables and allows open-before-answer rows', () => {
  const migration = readSource('../supabase/migrations/20261016_question_packs_and_round_integrity.sql');

  assert.match(migration, /question_packs_difficulty_check check \(difficulty in \('easy', 'medium', 'hard'\)\)/);
  assert.match(migration, /set is_active = false\nwhere slug is null/);
  assert.match(
    readSource('../supabase/migrations/20260710120000_lock_down_content_and_answer_reads.sql'),
    /alter table public\.questions enable row level security/
  );
  assert.match(migration, /drop policy if exists "participants can submit their own answers"/);
  assert.match(migration, /add column if not exists opened_at timestamptz/);
});

test('supabase seed is generated from the current content bank', () => {
  const bank = validateQuestionBank(JSON.parse(readFileSync(questionBankPath, 'utf8')));
  const seed = readFileSync(seedPath, 'utf8');

  assert.equal(seed, buildSeedSql(bank), 'run `npm run export:content` to refresh supabase/seed.sql');
  assert.doesNotMatch(seed, /'starter'/);
  assert.match(seed, /'minecraft-ru-hard'/);
});

test('start-solo-round uses the requested difficulty', () => {
  const source = readSource('../supabase/functions/start-solo-round/index.ts');

  assert.doesNotMatch(source, /getLocalizedQuestionPack\([^)]*'medium'\)/);
  assert.match(source, /resolveDifficulty\(body\.difficulty\)/);
});

test('a freshly created room accepts players', () => {
  assert.match(readSource('../supabase/functions/create-room/index.ts'), /status: 'lobby'/);
  assert.match(
    readSource('../supabase/functions/join-room/index.ts'),
    /room\.status !== 'lobby' && room\.status !== 'waiting'/
  );
});
