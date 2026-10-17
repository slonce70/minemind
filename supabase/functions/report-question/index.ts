import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/limits.ts';
import { questionReportReasons } from '../_shared/question-reports.ts';
import { resolveQuestionLocale } from '../_shared/questions.ts';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ReportQuestionPayload = { locale?: string; questionId?: string; reason?: string };

/** "This question is wrong": a reason from a fixed list, kept for the content team. */
serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<ReportQuestionPayload>(request);
    const reason = questionReportReasons.find((entry) => entry === body.reason);
    const questionId = typeof body.questionId === 'string' ? body.questionId.trim().slice(0, 120) : '';

    if (!reason || !questionId) {
      throw new GameError('invalid_request', 'Pick a question and a reason.');
    }

    // Solo rounds know the bank id (content_id); live rooms only see the database id.
    const { data: question, error: questionError } = await serviceClient
      .from('questions')
      .select('content_id')
      .eq(uuidPattern.test(questionId) ? 'id' : 'content_id', questionId)
      .limit(1)
      .maybeSingle();

    if (questionError) {
      throw questionError;
    }

    if (!question) {
      throw new GameError('invalid_request', 'Unknown question.');
    }

    await enforceRateLimit(user.id, 'report-question');

    const { error } = await serviceClient.from('question_reports').insert({
      content_id: question.content_id,
      locale: resolveQuestionLocale(body.locale),
      player_id: user.id,
      reason,
    });

    if (error) {
      throw error;
    }

    return jsonResponse({ reported: true });
  } catch (error) {
    return errorResponse(error);
  }
});
