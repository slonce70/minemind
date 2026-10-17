import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { closeQuestionIfAllAnswered } from '../_shared/early-close.ts';
import { GameError } from '../_shared/error-codes.ts';
import { scoreAnswer } from '../_shared/game-rules.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { loadQuestionsInOrder, originalOptions, resolveQuestionLocale } from '../_shared/questions.ts';
import { broadcastToRoom } from '../_shared/realtime.ts';
import { assertQuestionBelongsToRound } from '../_shared/round-questions.ts';
import {
  computeTimelineTimeLeftMs,
  isRoundExpired,
  resolveDifficulty,
  toDisplayOption,
  toOriginalOption,
} from '../_shared/round-integrity.ts';
import { assertRoomMembership } from '../_shared/rooms.ts';

type SubmitAnswerPayload = {
  /** Language of the explanation returned with the verdict. */
  locale?: 'en' | 'ru' | 'uk';
  questionId: string;
  roundId: string;
  selectedOption?: number;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<SubmitAnswerPayload>(request);
    const now = new Date();
    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .select('id, room_id, question_ids, difficulty, started_at, ends_at, finalized_at')
      .eq('id', body.roundId)
      .single();

    if (roundError || !round) {
      throw roundError ?? new GameError('round_not_found', 'Round not found.');
    }

    if (round.room_id) {
      await assertRoomMembership(round.room_id, user.id);
    }

    assertQuestionBelongsToRound({
      questionId: body.questionId,
      roundQuestionIds: round.question_ids,
    });

    if (round.finalized_at || isRoundExpired(round.ends_at, now)) {
      throw new GameError('round_over', 'Round time is over.');
    }

    // Time is measured on the round timeline, by the server clock only.
    const difficulty = resolveDifficulty(round.difficulty);
    const timeLeftMs = computeTimelineTimeLeftMs({
      difficulty,
      index: round.question_ids.indexOf(body.questionId),
      now,
      startedAt: new Date(round.started_at),
    });

    if (timeLeftMs === 'not-open') {
      throw new GameError('question_not_open', 'This question has not opened yet.');
    }

    const [question] = await loadQuestionsInOrder([body.questionId], resolveQuestionLocale(body.locale));

    if (!question) {
      throw new Error('Question not found.');
    }

    // Answers after the question closed count as a miss; options are stored in original order.
    const optionCount = originalOptions(question).length;
    const selectedOption =
      timeLeftMs === null ? -1 : toOriginalOption(body.selectedOption ?? -1, round.id, body.questionId, optionCount);
    // One answer per question: the unique (round, player, question) index rejects a second one.
    const { error: insertError } = await serviceClient.from('answer_submissions').insert({
      player_id: user.id,
      question_id: body.questionId,
      round_id: body.roundId,
      selected_option: selectedOption,
      submitted_at: now.toISOString(),
      time_left_ms: timeLeftMs ?? 0,
    });

    if (insertError) {
      throw insertError.code === '23505'
        ? new GameError('answer_already_submitted', 'Answer already submitted.')
        : insertError;
    }

    const isCorrect = selectedOption === question.correct_option;

    if (round.room_id) {
      // Others only learn that this player answered, not what or whether it was right.
      await broadcastToRoom(round.room_id, 'answer-progress', { playerId: user.id, questionId: body.questionId });

      // Everyone answered: no point waiting out the timer.
      if (timeLeftMs !== null && (await closeQuestionIfAllAnswered({ difficulty, now, questionId: body.questionId, round }))) {
        await broadcastToRoom(round.room_id, 'timeline-moved', { questionId: body.questionId });
      }
    }

    return jsonResponse({
      accepted: true,
      correctOption: toDisplayOption(question.correct_option, round.id, body.questionId, optionCount),
      explanation: question.explanation,
      isCorrect,
      scoreDelta: scoreAnswer({ difficulty, isCorrect, timeLeftMs: timeLeftMs ?? 0 }),
      timedOut: timeLeftMs === null,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
