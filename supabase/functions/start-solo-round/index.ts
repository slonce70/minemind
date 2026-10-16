import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { getLocalizedQuestionPack, questionsWithAnswersForClient } from '../_shared/questions.ts';
import { resolveDifficulty } from '../_shared/round-integrity.ts';

type StartSoloRoundPayload = {
  difficulty?: string;
  locale?: 'en' | 'ru' | 'uk';
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    await requireAuthenticatedUser(request);
    const body = await requireJsonBody<StartSoloRoundPayload>(request);
    const difficulty = resolveDifficulty(body.difficulty);
    const seed = crypto.randomUUID();
    const { questions } = await getLocalizedQuestionPack(body.locale ?? 'en', difficulty, 8, seed);

    return jsonResponse({
      contentPackVersion: 'minecraft-v1',
      difficulty,
      questions: questionsWithAnswersForClient(questions, seed),
    });
  } catch (error) {
    return errorResponse(error);
  }
});
