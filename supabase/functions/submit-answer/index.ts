import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { scoreAnswer } from '../_shared/game-rules.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { loadQuestionsInOrder, resolveQuestionLocale } from '../_shared/questions.ts';
import { broadcastToRoom } from '../_shared/realtime.ts';
import { assertQuestionBelongsToRound } from '../_shared/round-questions.ts';
import {
  computeServerTimeLeftMs,
  isRoundExpired,
  resolveDifficulty,
  toDisplayOption,
  toOriginalOption,
} from '../_shared/round-integrity.ts';
import { assertRoomMembership } from '../_shared/rooms.ts';

type SubmitAnswerPayload = {
  /** Language of the explanation returned with the verdict. */
  locale?: 'en' | 'ru' | 'uk';
  // 'open' starts the server-side timer for the question; 'answer' (default) locks in the choice.
  phase?: 'answer' | 'open';
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
      .select('id, room_id, question_ids, difficulty, ends_at, finalized_at')
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

    const submissionKey = {
      player_id: user.id,
      question_id: body.questionId,
      round_id: body.roundId,
    };

    if (body.phase === 'open') {
      // First open wins: re-opening (e.g. after an app restart) never resets the timer.
      const { error: openError } = await serviceClient
        .from('answer_submissions')
        .upsert(
          { ...submissionKey, opened_at: now.toISOString(), selected_option: null },
          { ignoreDuplicates: true, onConflict: 'round_id,player_id,question_id' }
        );

      if (openError) {
        throw openError;
      }

      return jsonResponse({ opened: true });
    }

    const { data: existing, error: existingError } = await serviceClient
      .from('answer_submissions')
      .select('id, opened_at, selected_option')
      .match(submissionKey)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing && existing.selected_option !== null) {
      throw new GameError('answer_already_submitted', 'Answer already submitted.');
    }

    const difficulty = resolveDifficulty(round.difficulty);
    const timeLeftMs = computeServerTimeLeftMs({ difficulty, now, openedAt: existing?.opened_at });
    // Answers after the timer count as a miss; options are stored in original (database) order.
    const selectedOption =
      timeLeftMs === null ? -1 : toOriginalOption(body.selectedOption ?? -1, round.id, body.questionId);
    const answerFields = {
      selected_option: selectedOption,
      submitted_at: now.toISOString(),
      time_left_ms: timeLeftMs ?? 0,
    };

    if (existing) {
      // `selected_option is null` makes the update a compare-and-set against a parallel answer.
      const { data: updated, error: updateError } = await serviceClient
        .from('answer_submissions')
        .update(answerFields)
        .eq('id', existing.id)
        .is('selected_option', null)
        .select('id');

      if (updateError) {
        throw updateError;
      }

      if (!updated || updated.length === 0) {
        throw new GameError('answer_already_submitted', 'Answer already submitted.');
      }
    } else {
      const { error: insertError } = await serviceClient
        .from('answer_submissions')
        .insert({ ...submissionKey, ...answerFields });

      if (insertError) {
        // Unique (round, player, question): a parallel request already answered.
        throw insertError.code === '23505' ? new GameError('answer_already_submitted', 'Answer already submitted.') : insertError;
      }
    }

    const [question] = await loadQuestionsInOrder([body.questionId], resolveQuestionLocale(body.locale));

    if (!question) {
      throw new Error('Question not found.');
    }

    const isCorrect = selectedOption === question.correct_option;

    if (round.room_id) {
      // Others only learn that this player answered, not what or whether it was right.
      await broadcastToRoom(round.room_id, 'answer-progress', { playerId: user.id, questionId: body.questionId });
    }

    return jsonResponse({
      accepted: true,
      correctOption: toDisplayOption(question.correct_option, round.id, body.questionId),
      explanation: question.explanation,
      isCorrect,
      scoreDelta: scoreAnswer({ difficulty, isCorrect, timeLeftMs: timeLeftMs ?? 0 }),
      timedOut: timeLeftMs === null,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
