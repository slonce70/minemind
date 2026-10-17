import { hashString } from '../../../supabase/functions/_shared/game-rules';
import type { ContentDifficulty, ContentTopicId } from '../content/types';
import type { MatchRecord } from '../results/match-record';
import { achievementCatalog, type AchievementId } from './achievements';
import { cardCatalog, rollCard } from './cards';
import { levelForXp, rankForLevel, type RankId } from './levels';

export * from './levels';

/** Everything the player earns. Plain JSON: persisted locally and merged with the cloud copy. */
export type PlayerProgress = {
  achievements: Partial<Record<AchievementId, string>>;
  /** Match ids already rewarded, so a recovered or re-saved round never pays twice. */
  awardedMatchIds: string[];
  cards: Record<string, number>;
  daily?: DailyQuestState;
  /** Bank question ids the player got wrong and hasn't fixed yet (the "mistakes" mode). */
  mistakes: string[];
  /** Last answers with their difficulty, newest last: drives adaptive difficulty. */
  recentAnswers: { correct: boolean; difficulty: ContentDifficulty }[];
  stats: Partial<Record<StatKey, number>>;
  streak: DayStreak;
  topicCorrect: Partial<Record<ContentTopicId, number>>;
  updatedAt: string;
  xp: number;
};

export type StatKey =
  | 'bestStreak'
  | 'challenges'
  | 'correct'
  | 'hardPerfect'
  | 'matches'
  | 'mistakesFixed'
  | 'multiplayer'
  | 'perfect';

export type DayStreak = {
  best: number;
  count: number;
  /** Local calendar day (YYYY-MM-DD) of the last counted play. */
  lastDay?: string;
  lastPlayedAt?: string;
};

export const dailyQuestIds = ['correct-15', 'rounds-3', 'streak-5', 'hard-round', 'six-correct'] as const;

export type DailyQuestId = (typeof dailyQuestIds)[number];

export type DailyQuestState = { day: string; done: boolean; progress: number; questId: DailyQuestId };

export const dailyQuestGoals: Record<DailyQuestId, number> = {
  'correct-15': 15,
  'hard-round': 1,
  'rounds-3': 3,
  'six-correct': 1,
  'streak-5': 5,
};

export const dailyQuestXp = 100;

export function createEmptyProgress(now = new Date()): PlayerProgress {
  return {
    achievements: {},
    awardedMatchIds: [],
    cards: {},
    mistakes: [],
    recentAnswers: [],
    stats: {},
    streak: { best: 0, count: 0 },
    topicCorrect: {},
    updatedAt: now.toISOString(),
    xp: 0,
  };
}

// --- XP ---

const xpMultiplier: Record<ContentDifficulty, number> = { easy: 1, hard: 1.5, medium: 1.25 };

export function xpForMatch(record: Pick<MatchRecord, 'bestStreak' | 'correctAnswers' | 'difficulty' | 'questionCount'>) {
  const isPerfect = record.questionCount > 0 && record.correctAnswers === record.questionCount;
  const answers = Math.round(record.correctAnswers * 10 * xpMultiplier[record.difficulty ?? 'medium']);

  return {
    answers,
    finish: 15,
    perfect: isPerfect ? 40 : 0,
    streak: Math.min(record.bestStreak, 8) * 2,
  };
}

// --- day streak ---

/** Local calendar day for `now` at a UTC offset in minutes (east positive). */
export function localDay(now: Date, utcOffsetMinutes: number) {
  return new Date(now.getTime() + utcOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

function daysBetween(fromDay: string, toDay: string) {
  return Math.round((Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / 86_400_000);
}

// A missed calendar day still continues the streak if this little real time has passed: covers
// flying east (or changing the phone's time zone), which can skip a date without a day of rest.
const streakGraceMs = 30 * 3_600_000;

/**
 * Counts one play per local day. Guarded against time-zone changes: a date that moves backwards
 * counts as the same day (no double counting), and a skipped date within 30 real hours of the
 * last play doesn't reset the streak.
 */
export function advanceStreak(streak: DayStreak, now: Date, utcOffsetMinutes: number): DayStreak {
  const today = localDay(now, utcOffsetMinutes);
  const playedAt = now.toISOString();

  if (!streak.lastDay) {
    return { best: Math.max(streak.best, 1), count: 1, lastDay: today, lastPlayedAt: playedAt };
  }

  const gap = daysBetween(streak.lastDay, today);

  if (gap <= 0) {
    return { ...streak, lastPlayedAt: playedAt };
  }

  const sinceLastPlay = streak.lastPlayedAt ? now.getTime() - Date.parse(streak.lastPlayedAt) : Infinity;
  const continues = gap === 1 || sinceLastPlay <= streakGraceMs;
  const count = continues ? streak.count + 1 : 1;

  return { best: Math.max(streak.best, count), count, lastDay: today, lastPlayedAt: playedAt };
}

/** The streak as it should be shown today: 0 once a day has been missed. */
export function visibleStreak(streak: DayStreak, now: Date, utcOffsetMinutes: number) {
  if (!streak.lastDay) {
    return 0;
  }

  const gap = daysBetween(streak.lastDay, localDay(now, utcOffsetMinutes));
  const sinceLastPlay = streak.lastPlayedAt ? now.getTime() - Date.parse(streak.lastPlayedAt) : Infinity;

  return gap <= 1 || sinceLastPlay <= streakGraceMs ? streak.count : 0;
}

// --- daily quest ---

export function dailyQuestFor(day: string): DailyQuestId {
  return dailyQuestIds[hashString(`daily:${day}`) % dailyQuestIds.length];
}

export function currentDailyQuest(progress: PlayerProgress, day: string): DailyQuestState {
  return progress.daily?.day === day ? progress.daily : { day, done: false, progress: 0, questId: dailyQuestFor(day) };
}

function advanceDailyQuest(quest: DailyQuestState, record: MatchRecord): DailyQuestState {
  if (quest.done) {
    return quest;
  }

  const goal = dailyQuestGoals[quest.questId];
  const progress = (() => {
    switch (quest.questId) {
      case 'correct-15':
        return quest.progress + record.correctAnswers;
      case 'rounds-3':
        return quest.progress + 1;
      case 'streak-5':
        return Math.max(quest.progress, record.bestStreak);
      case 'hard-round':
        return record.difficulty === 'hard' && record.correctAnswers >= 4 ? 1 : quest.progress;
      case 'six-correct':
        return record.correctAnswers >= 6 ? 1 : quest.progress;
    }
  })();

  return { ...quest, done: progress >= goal, progress: Math.min(progress, goal) };
}

// --- applying a finished match ---

export type QuestionInfo = { difficulty: ContentDifficulty; topicId: ContentTopicId };

export type MatchRewards = {
  achievements: AchievementId[];
  card?: { id: string; isNew: boolean };
  daily: DailyQuestState & { justCompleted: boolean };
  levelAfter: number;
  levelBefore: number;
  matchId: string;
  rankAfter: RankId;
  rankBefore: RankId;
  streak: number;
  xp: number;
  xpBefore: number;
  xpBreakdown: ReturnType<typeof xpForMatch> & { daily: number };
};

const maxAwardedIds = 60;
const maxMistakes = 80;
const maxRecentAnswers = 24;

/**
 * Pays out a finished match: XP, day streak, daily quest, achievements and maybe a card. Pure:
 * the same progress and match always give the same result. Returns null if this match was
 * already rewarded.
 */
export function applyMatch(input: {
  now: Date;
  progress: PlayerProgress;
  questionInfo: (questionId: string) => QuestionInfo | undefined;
  record: MatchRecord;
  utcOffsetMinutes: number;
}): { progress: PlayerProgress; rewards: MatchRewards } | null {
  const { now, progress, questionInfo, record, utcOffsetMinutes } = input;

  if (progress.awardedMatchIds.includes(record.id)) {
    return null;
  }

  const isPerfect = record.questionCount > 0 && record.correctAnswers === record.questionCount;
  const stats = { ...progress.stats };
  const bump = (key: StatKey, by = 1) => {
    stats[key] = (stats[key] ?? 0) + by;
  };

  bump('matches');
  bump('correct', record.correctAnswers);
  stats.bestStreak = Math.max(stats.bestStreak ?? 0, record.bestStreak);

  if (isPerfect) {
    bump('perfect');

    if (record.difficulty === 'hard') {
      bump('hardPerfect');
    }
  }

  if (record.mode !== 'solo') {
    bump('multiplayer');
  }

  if (record.round?.soloMode === 'challenge') {
    bump('challenges');
  }

  const topicCorrect = { ...progress.topicCorrect };
  const mistakes = new Set(progress.mistakes);
  const recentAnswers = [...progress.recentAnswers];

  for (const answer of record.breakdown) {
    const info = questionInfo(answer.questionId);

    if (!info) {
      continue;
    }

    recentAnswers.push({ correct: answer.isCorrect, difficulty: info.difficulty });

    if (answer.isCorrect) {
      topicCorrect[info.topicId] = (topicCorrect[info.topicId] ?? 0) + 1;

      if (mistakes.delete(answer.questionId)) {
        bump('mistakesFixed');
      }
    } else {
      // Re-adding moves it to the end, so the list keeps the most recent mistakes.
      mistakes.delete(answer.questionId);
      mistakes.add(answer.questionId);
    }
  }

  const day = localDay(now, utcOffsetMinutes);
  const questBefore = currentDailyQuest(progress, day);
  const daily = advanceDailyQuest(questBefore, record);
  const dailyJustDone = daily.done && !questBefore.done;
  const breakdown = { ...xpForMatch(record), daily: dailyJustDone ? dailyQuestXp : 0 };
  const xpGained = breakdown.answers + breakdown.finish + breakdown.perfect + breakdown.streak + breakdown.daily;
  const xp = progress.xp + xpGained;
  const streak = advanceStreak(progress.streak, now, utcOffsetMinutes);

  // A card for a decent round (half right or better) and for finishing the daily quest.
  const cards = { ...progress.cards };
  let card: MatchRewards['card'];

  if (record.correctAnswers * 2 >= record.questionCount || dailyJustDone) {
    const rolled = rollCard({ boosted: isPerfect || dailyJustDone, owned: cards, seed: record.id });

    card = { id: rolled.id, isNew: !cards[rolled.id] };
    cards[rolled.id] = (cards[rolled.id] ?? 0) + 1;
  }

  const next: PlayerProgress = {
    ...progress,
    awardedMatchIds: [...progress.awardedMatchIds, record.id].slice(-maxAwardedIds),
    cards,
    daily,
    mistakes: [...mistakes].slice(-maxMistakes),
    recentAnswers: recentAnswers.slice(-maxRecentAnswers),
    stats,
    streak,
    topicCorrect,
    updatedAt: now.toISOString(),
    xp,
  };
  const unlocked = achievementCatalog
    .filter((achievement) => !next.achievements[achievement.id] && achievement.isUnlocked(next))
    .map((achievement) => achievement.id);

  next.achievements = {
    ...next.achievements,
    ...Object.fromEntries(unlocked.map((id) => [id, now.toISOString()])),
  };

  const levelBefore = levelForXp(progress.xp);
  const levelAfter = levelForXp(xp);

  return {
    progress: next,
    rewards: {
      achievements: unlocked,
      card,
      daily: { ...daily, justCompleted: dailyJustDone },
      levelAfter,
      levelBefore,
      matchId: record.id,
      rankAfter: rankForLevel(levelAfter),
      rankBefore: rankForLevel(levelBefore),
      streak: streak.count,
      xp: xpGained,
      xpBefore: progress.xp,
      xpBreakdown: breakdown,
    },
  };
}

// --- cloud merge ---

function maxRecord<K extends string>(left: Partial<Record<K, number>>, right: Partial<Record<K, number>>) {
  const merged: Partial<Record<K, number>> = { ...left };

  for (const [key, value] of Object.entries(right) as [K, number][]) {
    merged[key] = Math.max(merged[key] ?? 0, value);
  }

  return merged;
}

function laterDay(left?: string, right?: string) {
  return (left ?? '') >= (right ?? '');
}

/**
 * Merges two copies of the progress (device and cloud). Conflicts go to the bigger progress:
 * the higher XP and counters, the union of achievements and cards, the newer streak and quest.
 */
export function mergeProgress(local: PlayerProgress, remote: PlayerProgress): PlayerProgress {
  const newer = local.updatedAt >= remote.updatedAt ? local : remote;
  const achievements = { ...remote.achievements };

  for (const [id, at] of Object.entries(local.achievements) as [AchievementId, string][]) {
    const other = achievements[id];
    achievements[id] = other && other < at ? other : at;
  }

  const streak: DayStreak =
    local.streak.lastDay === remote.streak.lastDay
      ? local.streak.count >= remote.streak.count
        ? local.streak
        : remote.streak
      : laterDay(local.streak.lastDay, remote.streak.lastDay)
        ? local.streak
        : remote.streak;

  const daily =
    local.daily && remote.daily && local.daily.day === remote.daily.day
      ? local.daily.progress >= remote.daily.progress || local.daily.done
        ? local.daily
        : remote.daily
      : laterDay(local.daily?.day, remote.daily?.day)
        ? (local.daily ?? remote.daily)
        : (remote.daily ?? local.daily);

  return {
    achievements,
    awardedMatchIds: [...new Set([...remote.awardedMatchIds, ...local.awardedMatchIds])].slice(-maxAwardedIds),
    cards: maxRecord(local.cards, remote.cards) as Record<string, number>,
    daily,
    mistakes: newer.mistakes,
    recentAnswers: newer.recentAnswers,
    stats: maxRecord(local.stats, remote.stats),
    streak: { ...streak, best: Math.max(local.streak.best, remote.streak.best) },
    topicCorrect: maxRecord(local.topicCorrect, remote.topicCorrect),
    updatedAt: newer.updatedAt,
    xp: Math.max(local.xp, remote.xp),
  };
}

/** Anything saved by an older build or another device, shaped into valid progress. */
export function sanitizeProgress(value: unknown): PlayerProgress {
  const empty = createEmptyProgress(new Date(0));

  if (!value || typeof value !== 'object') {
    return empty;
  }

  const raw = value as Partial<PlayerProgress>;
  const objectOr = <T>(candidate: unknown, fallback: T): T =>
    candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? (candidate as T) : fallback;

  return {
    achievements: objectOr(raw.achievements, {}),
    awardedMatchIds: Array.isArray(raw.awardedMatchIds) ? raw.awardedMatchIds.filter((id) => typeof id === 'string') : [],
    cards: objectOr(raw.cards, {}),
    daily: raw.daily && typeof raw.daily.day === 'string' ? raw.daily : undefined,
    mistakes: Array.isArray(raw.mistakes) ? raw.mistakes.filter((id) => typeof id === 'string') : [],
    recentAnswers: Array.isArray(raw.recentAnswers) ? raw.recentAnswers : [],
    stats: objectOr(raw.stats, {}),
    streak: { ...empty.streak, ...objectOr(raw.streak, {}) },
    topicCorrect: objectOr(raw.topicCorrect, {}),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : empty.updatedAt,
    xp: typeof raw.xp === 'number' && Number.isFinite(raw.xp) ? Math.max(0, Math.floor(raw.xp)) : 0,
  };
}

export const totalCards = cardCatalog.length;
