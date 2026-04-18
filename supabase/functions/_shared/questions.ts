import { serviceClient } from './client.ts';

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

export async function getLocalizedQuestionPack(locale: string, count = 8) {
  const { data: pack, error: packError } = await serviceClient
    .from('question_packs')
    .select('id,title')
    .eq('locale', locale)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (packError) {
    throw packError;
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
