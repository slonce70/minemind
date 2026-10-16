import { serviceClient } from './client.ts';
import { GameError } from './error-codes.ts';
import type { ContentDifficulty } from './room-settings.ts';
import { pickSeededIds, toDisplayOption, toDisplayOptions } from './round-integrity.ts';

export type QuestionRow = {
  correct_option: number;
  explanation: string;
  id: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  prompt: string;
};

export type QuestionLocale = 'en' | 'ru' | 'uk';

const questionColumns = 'id,prompt,option_a,option_b,option_c,option_d,correct_option,explanation';
const translationColumns = 'question_id,prompt,option_a,option_b,option_c,option_d,explanation';

export function resolveQuestionLocale(value: unknown): QuestionLocale {
  return value === 'uk' || value === 'ru' ? value : 'en';
}

/**
 * Loads questions in the order of `ids` (round order), with texts in `locale`. The option order and
 * correct option are the same for every language; a missing translation falls back to the base
 * (English) texts.
 */
export async function loadQuestionsInOrder(ids: string[], locale: QuestionLocale) {
  const [questionsResult, translationsResult] = await Promise.all([
    serviceClient.from('questions').select(questionColumns).in('id', ids),
    serviceClient.from('question_translations').select(translationColumns).in('question_id', ids).eq('locale', locale),
  ]);

  if (questionsResult.error || !questionsResult.data) {
    throw questionsResult.error ?? new Error('Unable to load questions for the round.');
  }

  if (translationsResult.error) {
    throw translationsResult.error;
  }

  const translations = new Map(
    (translationsResult.data ?? []).map((translation) => [translation.question_id as string, translation])
  );
  const byId = new Map(
    (questionsResult.data as QuestionRow[]).map((question) => {
      const translation = translations.get(question.id);

      return [
        question.id,
        translation
          ? {
              ...question,
              explanation: translation.explanation,
              option_a: translation.option_a,
              option_b: translation.option_b,
              option_c: translation.option_c,
              option_d: translation.option_d,
              prompt: translation.prompt,
            }
          : question,
      ];
    })
  );

  return ids.map((id) => byId.get(id)).filter((question): question is QuestionRow => Boolean(question));
}

/** Picks a seeded random set of active questions from the language-neutral pack for `difficulty`. */
export async function pickRoundQuestionIds(difficulty: ContentDifficulty, count = 8, seed: string = crypto.randomUUID()) {
  const { data: pack, error: packError } = await serviceClient
    .from('question_packs')
    .select('id')
    .is('locale', null)
    .eq('difficulty', difficulty)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (packError) {
    throw packError;
  }

  if (!pack) {
    throw new GameError('no_questions', `No question pack found for difficulty "${difficulty}".`);
  }

  const { data: idRows, error: idsError } = await serviceClient
    .from('questions')
    .select('id')
    .eq('pack_id', pack.id)
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (idsError) {
    throw idsError;
  }

  const allIds = (idRows ?? []).map((row) => row.id as string);

  if (allIds.length < count) {
    throw new GameError('no_questions', 'Question pack does not contain enough questions to start a round.');
  }

  return pickSeededIds(allIds, count, seed);
}

function originalOptions(question: QuestionRow) {
  return [question.option_a, question.option_b, question.option_c, question.option_d];
}

/** Room rounds: per-round option order, no answers. */
export function sanitizeQuestionsForClient(questions: QuestionRow[], roundId: string) {
  return questions.map((question) => ({
    id: question.id,
    options: toDisplayOptions(originalOptions(question), roundId, question.id),
    prompt: question.prompt,
  }));
}

/** Solo rounds are not scored on the server, so the client gets answers to reveal locally. */
export function questionsWithAnswersForClient(questions: QuestionRow[], seed: string) {
  return questions.map((question) => ({
    correctIndex: toDisplayOption(question.correct_option, seed, question.id),
    explanation: question.explanation,
    id: question.id,
    options: toDisplayOptions(originalOptions(question), seed, question.id),
    prompt: question.prompt,
  }));
}

/** The player's own answers so far, mapped to the round's display order. */
export function buildPlayerAnswers(input: {
  questions: QuestionRow[];
  roundId: string;
  submissions: Array<{ question_id: string; selected_option: number | null; time_left_ms: number | null }>;
}) {
  const questionsById = new Map(input.questions.map((question) => [question.id, question]));

  return input.submissions.flatMap((submission) => {
    const question = questionsById.get(submission.question_id);

    if (!question || submission.selected_option === null) {
      return [];
    }

    return [
      {
        correctOption: toDisplayOption(question.correct_option, input.roundId, question.id),
        explanation: question.explanation,
        isCorrect: submission.selected_option === question.correct_option,
        questionId: question.id,
        selectedOption:
          submission.selected_option < 0 ? -1 : toDisplayOption(submission.selected_option, input.roundId, question.id),
        timeLeftMs: submission.time_left_ms ?? 0,
      },
    ];
  });
}
