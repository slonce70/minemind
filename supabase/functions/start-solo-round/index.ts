import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { getLocalizedQuestionPack, sanitizeQuestionsForClient } from '../_shared/questions.ts';

type StartSoloRoundPayload = {
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
    const { pack, questions } = await getLocalizedQuestionPack(body.locale ?? 'en');

    return jsonResponse({
      pack,
      questions: sanitizeQuestionsForClient(questions),
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown start-solo-round failure.',
      },
      400
    );
  }
});
