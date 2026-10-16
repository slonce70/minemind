import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { computeRoundEndsAt, questionWindow, scoreAnswer } from '../supabase/functions/_shared/game-rules.ts';
import {
  buildRoundRanking,
  computeTimelineEndsAt,
  computeTimelineTimeLeftMs,
  countClosedQuestions,
  countReleasedQuestions,
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

test('live rooms share one timeline: countdown, then timer plus 10 s per question', () => {
  const startedAt = new Date('2026-10-16T10:00:00.000Z');
  const second = questionWindow({ difficulty: 'hard', index: 1, startedAt });

  // 5 s countdown, 15 s question, 10 s answer and standings.
  assert.equal(second.opensAt.toISOString(), '2026-10-16T10:00:30.000Z');
  assert.equal(second.closesAt.toISOString(), '2026-10-16T10:00:45.000Z');

  const endsAt = computeTimelineEndsAt({ difficulty: 'hard', questionCount: 8, startedAt });
  assert.equal(endsAt.toISOString(), '2026-10-16T10:03:18.000Z');
  assert.equal(isRoundExpired(endsAt.toISOString(), new Date('2026-10-16T10:03:17.000Z')), false);
  assert.equal(isRoundExpired(endsAt.toISOString(), endsAt), true);
  assert.equal(isRoundExpired(null, new Date()), false);

  // Classroom stays self-paced with its generous deadline.
  assert.equal(computeRoundEndsAt({ difficulty: 'hard', questionCount: 8, startedAt }).toISOString(), '2026-10-16T10:03:50.000Z');
});

test('the server times answers on the timeline and only hands out open questions', () => {
  const startedAt = new Date('2026-10-16T10:00:00.000Z');
  const at = (time: string) => ({ difficulty: 'hard' as const, now: new Date(`2026-10-16T${time}Z`), questionCount: 8, startedAt });

  assert.equal(computeTimelineTimeLeftMs({ ...at('10:00:20.000'), index: 1 }), 'not-open');
  assert.equal(computeTimelineTimeLeftMs({ ...at('10:00:35.000'), index: 1 }), 10_000);
  // Inside the network grace window: the answer counts, without a bonus.
  assert.equal(computeTimelineTimeLeftMs({ ...at('10:00:47.000'), index: 1 }), 0);
  assert.equal(computeTimelineTimeLeftMs({ ...at('10:00:49.000'), index: 1 }), null);

  assert.equal(countReleasedQuestions(at('10:00:02.000')), 0);
  assert.equal(countReleasedQuestions(at('10:00:03.000')), 1, 'released 2 s before it opens');
  assert.equal(countReleasedQuestions(at('10:00:29.000')), 2);
  assert.equal(countClosedQuestions(at('10:00:22.000')), 0);
  assert.equal(countClosedQuestions(at('10:00:23.000')), 1, 'closed for good after the grace');
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

  assert.doesNotMatch(source, /\.upsert\(/);
  assert.doesNotMatch(source, /timeLeftMs\?:/);
  assert.match(source, /insertError\.code === '23505'/);
  assert.match(source, /computeTimelineTimeLeftMs\(/);
  assert.match(source, /question_not_open/);
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
});

test('one language-neutral question per fact, with a translation per locale', () => {
  const bank = validateQuestionBank(JSON.parse(readFileSync(questionBankPath, 'utf8')));
  const seed = buildSeedSql(bank);
  const migration = readSource('../supabase/migrations/20261017110000_question_translations.sql');

  assert.match(migration, /primary key \(question_id, locale\)/);
  assert.match(migration, /revoke all on public\.question_translations from anon, authenticated/);
  assert.match(seed, /select id, null, '8-12', 'hard', 'MineMind hard', 'minecraft-hard', true/);
  assert.match(seed, /update public\.question_packs\nset is_active = false\nwhere locale is not null/);
  assert.doesNotMatch(seed, /delete from/i);

  // Every record gets a uk, en and ru translation row keyed by its content id.
  for (const locale of ['uk', 'en', 'ru']) {
    assert.equal(
      seed.match(new RegExp(`\\('[a-z0-9-]+', '${locale}', `, 'g'))?.length,
      bank.length,
      locale
    );
  }

  const roundSource = readSource('../supabase/functions/get-room-round/index.ts');
  const viewSource = readSource('../supabase/functions/_shared/round-view.ts');
  assert.match(roundSource, /locale: resolveQuestionLocale\(body\.locale\)/);
  assert.match(viewSource, /loadQuestionsInOrder\(releasedIds, input\.locale\)/);
});

test('start-solo-round uses the requested difficulty', () => {
  const source = readSource('../supabase/functions/start-solo-round/index.ts');

  assert.match(source, /resolveDifficulty\(body\.difficulty\)/);
  assert.match(source, /pickRoundQuestionIds\(difficulty, 8, seed\)/);
});

test('a freshly created room accepts players', () => {
  assert.match(readSource('../supabase/functions/create-room/index.ts'), /status: 'lobby'/);
  assert.match(
    readSource('../supabase/functions/join-room/index.ts'),
    /room\.status !== 'lobby' && room\.status !== 'waiting'/
  );
});
