import { serviceClient } from './client.ts';
import type { ContentDifficulty } from './room-settings.ts';

type QuestionRow = {
  correct_option: number;
  explanation: string;
  id: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  prompt: string;
  sort_order: number;
};

export async function getLocalizedQuestionPack(
  locale: string,
  difficulty: ContentDifficulty = 'medium',
  count = 8
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
    .order('created_at', { ascending: true })
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
    throw new Error(`No question pack found for locale "${locale}".`);
  }

  const { data: questions, error: questionsError } = await serviceClient
    .from('questions')
    .select(
      'id,prompt,option_a,option_b,option_c,option_d,correct_option,explanation,sort_order'
    )
    .eq('pack_id', pack.id)
    .order('sort_order', { ascending: true })
    .limit(count);

  if (questionsError) {
    throw questionsError;
  }

  if (!questions || questions.length < Math.min(count, 4)) {
    throw new Error('Question pack does not contain enough questions to start a round.');
  }

  return {
    difficulty,
    pack,
    questions: questions as QuestionRow[],
  };
}

export function sanitizeQuestionsForClient(questions: QuestionRow[]) {
  return questions.map((question) => ({
    id: question.id,
    options: [question.option_a, question.option_b, question.option_c, question.option_d],
    prompt: question.prompt,
  }));
}
