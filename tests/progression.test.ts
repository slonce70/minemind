import assert from 'node:assert/strict';
import test from 'node:test';

import { achievementCatalog } from '../src/features/progress/achievements';
import { cardCatalog, rollCard } from '../src/features/progress/cards';
import {
  advanceStreak,
  applyMatch,
  createEmptyProgress,
  dailyQuestFor,
  levelForXp,
  levelProgress,
  localDay,
  mergeProgress,
  rankForLevel,
  sanitizeProgress,
  visibleStreak,
  type PlayerProgress,
  type QuestionInfo,
} from '../src/features/progress/progression';
import type { MatchRecord } from '../src/features/results/match-record';

const kyiv = 180;

function match(overrides: Partial<MatchRecord> = {}): MatchRecord {
  const correct = overrides.correctAnswers ?? 6;

  return {
    authority: 'client',
    bestStreak: 4,
    breakdown: Array.from({ length: 8 }, (_, index) => ({
      explanation: '',
      isCorrect: index < correct,
      prompt: `q${index}`,
      questionId: `q${index}`,
      selectedIndex: 0,
    })),
    completedAt: '2026-10-17T10:00:00.000Z',
    correctAnswers: correct,
    difficulty: 'medium',
    id: `solo:local:${Math.random()}`,
    isDemo: false,
    mode: 'solo',
    participants: [],
    questionCount: 8,
    score: 600,
    speedBonus: 0,
    syncStatus: 'local-only',
    transport: 'local',
    ...overrides,
  };
}

const info = (id: string): QuestionInfo => ({
  difficulty: 'medium',
  topicId: Number(id.slice(1)) % 2 ? 'mobs-and-combat' : 'survival-basics',
});

function play(progress: PlayerProgress, record: MatchRecord, at = '2026-10-17T10:00:00.000Z') {
  const result = applyMatch({ now: new Date(at), progress, questionInfo: info, record, utcOffsetMinutes: kyiv });
  assert.ok(result);
  return result;
}

test('levels grow by 100 XP more each step and map to ranks', () => {
  assert.equal(levelForXp(0), 1);
  assert.equal(levelForXp(99), 1);
  assert.equal(levelForXp(100), 2);
  assert.equal(levelForXp(300), 3);
  assert.deepEqual(levelProgress(150), { current: 50, level: 2, needed: 200 });
  assert.equal(rankForLevel(1), 'wood');
  assert.equal(rankForLevel(4), 'stone');
  assert.equal(rankForLevel(35), 'netherite');
});

test('a match pays XP once, counts stats, topics and mistakes', () => {
  const first = play(createEmptyProgress(), match({ id: 'm1' }));

  assert.equal(first.rewards.xp, 75 + 15 + 8 + first.rewards.xpBreakdown.daily);
  assert.equal(first.progress.stats.matches, 1);
  assert.equal(first.progress.stats.correct, 6);
  assert.deepEqual(first.progress.mistakes, ['q6', 'q7']);
  assert.ok(first.rewards.achievements.includes('first-round'));
  assert.equal(
    applyMatch({ now: new Date(), progress: first.progress, questionInfo: info, record: match({ id: 'm1' }), utcOffsetMinutes: kyiv }),
    null
  );

  // Fixing a mistake later removes it and counts towards the "mistake fixer" achievement.
  const fixed = play(first.progress, match({ correctAnswers: 8, id: 'm2' }));
  assert.deepEqual(fixed.progress.mistakes, []);
  assert.equal(fixed.progress.stats.mistakesFixed, 2);
  assert.equal(fixed.progress.stats.perfect, 1);
  assert.equal(fixed.rewards.xpBreakdown.perfect, 40);
});

test('day streak: one per local day, survives time-zone hops, resets after a missed day', () => {
  const start = advanceStreak({ best: 0, count: 0 }, new Date('2026-10-17T20:00:00Z'), kyiv);
  assert.equal(start.count, 1);
  assert.equal(start.lastDay, '2026-10-17');

  // Same local day again: no change.
  assert.equal(advanceStreak(start, new Date('2026-10-17T20:30:00Z'), kyiv).count, 1);

  // Next local day.
  const next = advanceStreak(start, new Date('2026-10-18T08:00:00Z'), kyiv);
  assert.equal(next.count, 2);

  // Flying west moves the date back: counts as the same day, not a reset or a double count.
  assert.equal(advanceStreak(next, new Date('2026-10-18T09:00:00Z'), -600).count, 2);

  // Flying east skips a date only 14 real hours later: the streak continues.
  const hop = advanceStreak(start, new Date('2026-10-18T10:00:00Z'), 14 * 60);
  assert.equal(localDay(new Date('2026-10-18T10:00:00Z'), 14 * 60), '2026-10-19');
  assert.equal(hop.count, 2);

  // A real missed day resets.
  const missed = advanceStreak(next, new Date('2026-10-20T12:00:00Z'), kyiv);
  assert.equal(missed.count, 1);
  assert.equal(missed.best, 2);
  assert.equal(visibleStreak(next, new Date('2026-10-21T12:00:00Z'), kyiv), 0);
  assert.equal(visibleStreak(next, new Date('2026-10-19T12:00:00Z'), kyiv), 2);
});

test('the daily quest is the same for everyone on a day and pays once', () => {
  assert.equal(dailyQuestFor('2026-10-17'), dailyQuestFor('2026-10-17'));

  let progress = createEmptyProgress();
  let completions = 0;

  for (let index = 0; index < 4; index += 1) {
    const result = play(progress, match({ bestStreak: 8, correctAnswers: 8, difficulty: 'hard', id: `d${index}` }));
    progress = result.progress;
    completions += result.rewards.daily.justCompleted ? 1 : 0;
  }

  assert.equal(completions, 1);
  assert.equal(progress.daily?.done, true);
});

test('card rolls are deterministic and prefer cards the player lacks', () => {
  const first = rollCard({ boosted: false, owned: {}, seed: 'abc' });
  assert.equal(rollCard({ boosted: false, owned: {}, seed: 'abc' }).id, first.id);

  const allButOneCommon = Object.fromEntries(
    cardCatalog.filter((card) => card.rarity === 'common').slice(1).map((card) => [card.id, 1])
  );
  const seeds = Array.from({ length: 50 }, (_, index) => `seed-${index}`);
  const commons = seeds.map((seed) => rollCard({ boosted: false, owned: allButOneCommon, seed })).filter((card) => card.rarity === 'common');
  assert.ok(commons.length > 0);
  assert.ok(commons.every((card) => card.id === cardCatalog[0].id));
});

test('catalog ids are unique and sprites are 16x16', () => {
  assert.equal(new Set(cardCatalog.map((card) => card.id)).size, cardCatalog.length);
  assert.equal(new Set(achievementCatalog.map((entry) => entry.id)).size, achievementCatalog.length);

  for (const card of cardCatalog) {
    assert.equal(card.sprite.rows.length, 16, card.id);
    assert.ok(card.sprite.rows.every((row) => row.length === 16), card.id);
  }
});

test('merge keeps the bigger progress from either copy', () => {
  const phone = play(createEmptyProgress(), match({ id: 'a' }), '2026-10-17T10:00:00Z').progress;
  const tablet = play(play(createEmptyProgress(), match({ id: 'b' })).progress, match({ correctAnswers: 8, id: 'c' }), '2026-10-18T10:00:00Z').progress;
  const merged = mergeProgress(phone, tablet);

  assert.equal(merged.xp, Math.max(phone.xp, tablet.xp));
  assert.equal(merged.stats.matches, 2);
  assert.equal(merged.streak.lastDay, '2026-10-18');
  assert.deepEqual(new Set(merged.awardedMatchIds), new Set(['a', 'b', 'c']));
  assert.ok(Object.keys(merged.achievements).length >= Object.keys(phone.achievements).length);

  for (const [id, count] of Object.entries(phone.cards)) {
    assert.ok((merged.cards[id] ?? 0) >= count);
  }

  // Merging is symmetric in what it keeps.
  assert.equal(mergeProgress(tablet, phone).xp, merged.xp);
});

test('sanitize turns junk into empty progress', () => {
  assert.equal(sanitizeProgress(null).xp, 0);
  assert.equal(sanitizeProgress({ xp: -5, cards: [] }).xp, 0);
  assert.deepEqual(sanitizeProgress({ cards: [] }).cards, {});
});
