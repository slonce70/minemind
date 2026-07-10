import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { assertQuestionBelongsToRound } from '../_shared/round-questions.ts';
import { clampTimeLeftMs } from '../_shared/round-timing.ts';
import { assertRoomMembership } from '../_shared/rooms.ts';

type ContentDifficulty = 'easy' | 'medium' | 'hard';

type SubmitAnswerPayload = {
  questionId: string;
  roundId: string;
  selectedOption: number;
  timeLeftMs?: number;
};

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<SubmitAnswerPayload>(request);

    // Reject invalid options outright instead of silently clamping (99 -> 3).
    if (
      typeof body.selectedOption !== 'number' ||
      !Number.isInteger(body.selectedOption) ||
      body.selectedOption < -1 ||
      body.selectedOption > 3
    ) {
      throw new Error('Invalid selected option.');
    }

    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .select('id, room_id, question_ids, ends_at, difficulty')
      .eq('id', body.roundId)
      .single();

    if (roundError || !round) {
      throw roundError ?? new Error('Round not found.');
    }

    if (round.room_id) {
      await assertRoomMembership(round.room_id, user.id);
    }

    assertQuestionBelongsToRound({
      questionId: body.questionId,
      roundQuestionIds: round.question_ids,
    });

    // Reject answers once the round deadline has passed so a stalled client
    // cannot backfill answers after the round has effectively ended.
    if (round.ends_at && new Date(round.ends_at).getTime() < Date.now()) {
      throw new Error('Round has already ended.');
    }

    const difficulty = (round.difficulty as ContentDifficulty | null) ?? 'medium';
    const sanitizedOption = body.selectedOption;
    const sanitizedTimeLeft = clampTimeLeftMs(body.timeLeftMs, difficulty);

    // Answers are immutable: one submission per (round, player, question). This
    // defeats the "submit, read correctness, resubmit until right" cheat while
    // still allowing immediate per-question feedback below.
    const { error: insertError } = await serviceClient.from('answer_submissions').insert({
      player_id: user.id,
      question_id: body.questionId,
      round_id: body.roundId,
      selected_option: sanitizedOption,
      submitted_at: new Date().toISOString(),
      time_left_ms: sanitizedTimeLeft,
    });

    if (insertError) {
      // 23505 = unique_violation on (round_id, player_id, question_id).
      if ((insertError as { code?: string }).code === '23505') {
        throw new Error('This question was already answered.');
      }
      throw insertError;
    }

    const { data: question, error: questionError } = await serviceClient
      .from('questions')
      .select('correct_option, explanation')
      .in('id', round.question_ids)
      .eq('id', body.questionId)
      .single();

    if (questionError || !question) {
      throw questionError ?? new Error('Question not found.');
    }

    const isCorrect = sanitizedOption === question.correct_option;

    return jsonResponse({
      accepted: true,
      explanation: question.explanation,
      isCorrect,
      scoreDelta: isCorrect ? 100 + Math.floor(sanitizedTimeLeft / 1000) * 6 : 0,
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown submit-answer failure.',
      },
      400
    );
  }
});
