import { serviceClient } from './client.ts';
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

const questionColumns = 'id,prompt,option_a,option_b,option_c,option_d,correct_option,explanation';

/** Loads questions in the order of `ids` (round order), not table order. */
export async function loadQuestionsInOrder(ids: string[]) {
  const { data, error } = await serviceClient.from('questions').select(questionColumns).in('id', ids);

  if (error || !data) {
    throw error ?? new Error('Unable to load questions for the round.');
  }

  const byId = new Map((data as QuestionRow[]).map((question) => [question.id, question]));

  return ids.map((id) => byId.get(id)).filter((question): question is QuestionRow => Boolean(question));
}

export async function getLocalizedQuestionPack(
  locale: string,
  difficulty: ContentDifficulty = 'medium',
  count = 8,
  seed: string = crypto.randomUUID()
) {
  // Prefer a pack that matches the requested difficulty exactly, but fall back
  // to any pack for the locale. Seed/demo databases ship a single pack per
  // locale, so an exact-difficulty-only lookup left online rounds unable to
  // start ("No question pack found") for every difficulty.
  const { data: exactPack, error: packError } = await serviceClient
    .from('question_packs')
    .select('id,title')
    .eq('locale', locale)
    .eq('difficulty', difficulty)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (packError) {
    throw packError;
  }

  let pack = exactPack;

  if (!pack) {
    const { data: fallbackPack, error: fallbackError } = await serviceClient
      .from('question_packs')
      .select('id,title')
      .eq('locale', locale)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (fallbackError) {
      throw fallbackError;
    }

    pack = fallbackPack;
  }

  if (!pack) {
    throw new Error(`No question pack found for locale "${locale}" and difficulty "${difficulty}".`);
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

  if (allIds.length < Math.min(count, 4)) {
    throw new Error('Question pack does not contain enough questions to start a round.');
  }

  return {
    difficulty,
    pack,
    questions: await loadQuestionsInOrder(pickSeededIds(allIds, count, seed)),
  };
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
