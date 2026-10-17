import { hashString } from '../../../supabase/functions/_shared/game-rules';
import type { AppLocale } from '../../lib/locale';
import { selectQuestionRound, shuffleRecordOptions } from '../content/content-selection';
import {
  contentDifficulties,
  contentTopics,
  type ContentDifficulty,
  type ContentQuestionBank,
  type ContentQuestionRecord,
  type ContentTopicId,
} from '../content/types';
import type { QuizQuestion, RoundVariant, SoloMode } from './types';

export const soloRoundSize = 8;

/** A friend challenge as carried by the link: the round to replay and the score to beat. */
export type ChallengeSpec = {
  correct: number;
  difficulty: ContentDifficulty;
  from: string;
  score: number;
  seed: string;
  topicId?: ContentTopicId;
};

export type SoloRoundSpec =
  | { difficulty: ContentDifficulty; variant: 'classic' }
  | { difficulty: ContentDifficulty; topicId: ContentTopicId; variant: 'topic' }
  | { variant: 'adaptive' }
  | { questionIds: string[]; variant: 'mistakes' }
  | { challenge: ChallengeSpec; variant: 'challenge' };

export type BuiltSoloRound = {
  /** Scoring and timer difficulty of the round. */
  difficulty: ContentDifficulty;
  questions: QuizQuestion[];
  round: RoundVariant;
};

export function localizeQuestion(definition: ContentQuestionRecord, locale: AppLocale): QuizQuestion {
  return {
    correctIndex: definition.correctIndex,
    explanation: definition.explanation[locale],
    id: definition.id,
    kind: definition.kind,
    media: definition.media,
    optionIcons: definition.optionIcons,
    options: definition.options.map((option) => option[locale]),
    prompt: definition.prompt[locale],
    topicId: definition.topicId,
  };
}

/**
 * How many easy/medium/hard questions an adaptive round gets, from the player's recent answers:
 * right answers (more so on hard) push the level up, misses pull it down. Starts at medium.
 */
export function adaptiveMix(recentAnswers: { correct: boolean; difficulty: ContentDifficulty }[], size = soloRoundSize) {
  const step: Record<ContentDifficulty, { down: number; up: number }> = {
    easy: { down: 0.25, up: 0.08 },
    hard: { down: 0.1, up: 0.2 },
    medium: { down: 0.18, up: 0.14 },
  };
  let level = 1;

  for (const answer of recentAnswers) {
    level += answer.correct ? step[answer.difficulty].up : -step[answer.difficulty].down;
    level = Math.min(2, Math.max(0, level));
  }

  const easy = Math.round(size * Math.max(0, 1 - level) * 0.75);
  const hard = Math.round(size * Math.max(0, level - 1) * 0.75);

  return { easy, hard, level, medium: size - easy - hard };
}

function pickSeeded(records: ContentQuestionRecord[], count: number, seed: string) {
  return [...records]
    .sort((left, right) => hashString(`${seed}:${left.id}`) - hashString(`${seed}:${right.id}`))
    .slice(0, count);
}

export function buildSoloRound(input: {
  bank: ContentQuestionBank;
  locale: AppLocale;
  recentAnswers?: { correct: boolean; difficulty: ContentDifficulty }[];
  seed: string;
  spec: SoloRoundSpec;
}): BuiltSoloRound {
  const { bank, locale, seed, spec } = input;
  const active = bank.filter((record) => record.isActive);
  const finish = (records: ContentQuestionRecord[], difficulty: ContentDifficulty, round: Omit<RoundVariant, 'seed'> & { soloMode: SoloMode }) => ({
    difficulty,
    questions: records.map((record) => localizeQuestion(record, locale)),
    round: { ...round, seed },
  });

  switch (spec.variant) {
    case 'classic':
      return finish(
        selectQuestionRound({ bank: active, count: soloRoundSize, difficulty: spec.difficulty, seed }),
        spec.difficulty,
        { soloMode: 'classic' }
      );
    case 'topic': {
      const pool = active.filter((record) => record.topicId === spec.topicId);
      const sameLevel = pool.filter((record) => record.difficulty === spec.difficulty);
      // Top up from the topic's other levels if this one is short.
      const picked = [
        ...pickSeeded(sameLevel, soloRoundSize, seed),
        ...pickSeeded(pool.filter((record) => record.difficulty !== spec.difficulty), soloRoundSize, seed),
      ].slice(0, soloRoundSize);

      return finish(
        picked.map((record) => shuffleRecordOptions(record, seed)),
        spec.difficulty,
        { soloMode: 'topic', topicId: spec.topicId }
      );
    }
    case 'adaptive': {
      const mix = adaptiveMix(input.recentAnswers ?? []);
      // Easy first, hard last: the round ramps up.
      const picked = contentDifficulties.flatMap((difficulty) =>
        selectQuestionRound({ bank: active, count: mix[difficulty], difficulty, seed: `${seed}:${difficulty}` })
      );

      return finish(picked, mix.level >= 1.4 ? 'hard' : mix.level <= 0.6 ? 'easy' : 'medium', { soloMode: 'adaptive' });
    }
    case 'mistakes': {
      const byId = new Map(active.map((record) => [record.id, record]));
      // Most recent mistakes first.
      const picked = [...spec.questionIds]
        .reverse()
        .map((id) => byId.get(id))
        .filter((record): record is ContentQuestionRecord => Boolean(record))
        .slice(0, soloRoundSize);

      return finish(
        picked.map((record) => shuffleRecordOptions(record, seed)),
        'medium',
        { soloMode: 'mistakes' }
      );
    }
    case 'challenge': {
      const { challenge } = spec;
      const base = challenge.topicId
        ? buildSoloRound({ ...input, seed: challenge.seed, spec: { difficulty: challenge.difficulty, topicId: challenge.topicId, variant: 'topic' } })
        : buildSoloRound({ ...input, seed: challenge.seed, spec: { difficulty: challenge.difficulty, variant: 'classic' } });

      return {
        ...base,
        round: {
          challenge: { from: challenge.from, score: challenge.score },
          seed: challenge.seed,
          soloMode: 'challenge',
          topicId: challenge.topicId,
        },
      };
    }
  }
}

// --- challenge links ---

const challengeParams = ['seed', 'd', 'from', 'score', 'c'] as const;

export function challengeQuery(challenge: ChallengeSpec) {
  return {
    c: String(challenge.correct),
    d: challenge.difficulty,
    from: challenge.from,
    score: String(challenge.score),
    seed: challenge.seed,
    ...(challenge.topicId ? { t: challenge.topicId } : {}),
  };
}

/** Reads a challenge from link params; null if anything is missing or out of range. */
export function parseChallenge(params: Record<string, string | string[] | undefined>): ChallengeSpec | null {
  const value = (key: string) => {
    const raw = params[key];
    return (Array.isArray(raw) ? raw[0] : raw)?.trim();
  };

  if (challengeParams.some((key) => !value(key))) {
    return null;
  }

  const difficulty = value('d') as ContentDifficulty;
  const topicId = value('t') as ContentTopicId | undefined;
  const score = Number(value('score'));
  const correct = Number(value('c'));
  const seed = value('seed') ?? '';

  if (
    !contentDifficulties.includes(difficulty) ||
    (topicId && !contentTopics.includes(topicId)) ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100_000 ||
    !Number.isInteger(correct) ||
    correct < 0 ||
    correct > soloRoundSize ||
    seed.length > 80
  ) {
    return null;
  }

  return { correct, difficulty, from: (value('from') ?? '').slice(0, 24), score, seed, topicId };
}

/**
 * The link that opens the challenge screen. `base` is the web app's address (anyone can open it)
 * or the app scheme `minemind://`.
 */
export function buildChallengeUrl(base: string, challenge: ChallengeSpec) {
  const query = new URLSearchParams(challengeQuery(challenge)).toString();
  const root = base.endsWith('://') ? base : `${base.replace(/\/+$/, '')}/`;

  return `${root}challenge?${query}`;
}
