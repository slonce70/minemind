import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { assertRoomMembership } from '../_shared/rooms.ts';

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
    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .select('id, room_id')
      .eq('id', body.roundId)
      .single();

    if (roundError || !round) {
      throw roundError ?? new Error('Round not found.');
    }

    if (round.room_id) {
      await assertRoomMembership(round.room_id, user.id);
    }

    const sanitizedOption = Math.max(-1, Math.min(3, body.selectedOption));
    const sanitizedTimeLeft = Math.max(0, Math.min(18000, body.timeLeftMs ?? 0));

    const { error: upsertError } = await serviceClient.from('answer_submissions').upsert(
      {
        player_id: user.id,
        question_id: body.questionId,
        round_id: body.roundId,
        selected_option: sanitizedOption,
        submitted_at: new Date().toISOString(),
        time_left_ms: sanitizedTimeLeft,
      },
      {
        onConflict: 'round_id,player_id,question_id',
      }
    );

    if (upsertError) {
      throw upsertError;
    }

    const { data: question, error: questionError } = await serviceClient
      .from('questions')
      .select('correct_option, explanation')
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
