import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/limits.ts';

type ReportAnswersPayload = {
  answers?: { answerMs?: number | null; correct?: boolean; questionId?: string }[];
};

const maxAnswersPerReport = 20;

/**
 * Solo rounds are scored on the device; afterwards the app reports which questions were answered
 * right and how fast, for difficulty calibration. Anonymous: only per-question counters are kept.
 */
serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<ReportAnswersPayload>(request);
    const answers = Array.isArray(body.answers) ? body.answers : [];

    if (answers.length === 0 || answers.length > maxAnswersPerReport) {
      throw new GameError('invalid_request', `Report 1 to ${maxAnswersPerReport} answers.`);
    }

    const entries = answers
      .filter((answer) => typeof answer.questionId === 'string' && typeof answer.correct === 'boolean')
      .map((answer) => ({
        answerMs: Number.isFinite(answer.answerMs) ? Math.round(answer.answerMs as number) : null,
        contentId: (answer.questionId as string).slice(0, 120),
        correct: answer.correct,
      }));

    await enforceRateLimit(user.id, 'report-answers');

    const { error } = await serviceClient.rpc('record_answer_stats', { entries });

    if (error) {
      throw error;
    }

    return jsonResponse({ recorded: entries.length });
  } catch (error) {
    return errorResponse(error);
  }
});
