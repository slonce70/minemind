import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';
import { filterSubmissionsForRoundQuestions } from '../_shared/round-questions.ts';
import { assertRoomMembership, listRoomParticipants } from '../_shared/rooms.ts';

type FinalizeRoundPayload = {
  roundId: string;
};

type RankingEntry = {
  best_streak: number;
  correct_count: number;
  player_id: string;
  rank: number;
  round_id: string;
  score: number;
};

function buildRankingSnapshot(
  ranking: Array<RankingEntry & { nickname: string }>
) {
  return ranking.map((entry) => ({
    best_streak: entry.best_streak,
    correct_count: entry.correct_count,
    nickname: entry.nickname,
    player_id: entry.player_id,
    rank: entry.rank,
    round_id: entry.round_id,
    score: entry.score,
  }));
}

async function buildNicknameMap(playerIds: string[]) {
  if (playerIds.length === 0) {
    return new Map<string, string>();
  }

  const { data: profiles, error: profilesError } = await serviceClient
    .from('guest_profiles')
    .select('id, nickname')
    .in('id', playerIds);

  if (profilesError) {
    throw profilesError;
  }

  return new Map((profiles ?? []).map((profile) => [profile.id, profile.nickname]));
}

function attachNicknames(ranking: RankingEntry[], nicknameMap: Map<string, string>) {
  return ranking.map((entry) => ({
    ...entry,
    nickname: nicknameMap.get(entry.player_id) ?? 'Player',
  }));
}

async function completeRoomRound(input: {
  nicknameMap: Map<string, string>;
  ranking: RankingEntry[];
  roomId: string;
  roundId: string;
}) {
  const rankingsWithNicknames = attachNicknames(input.ranking, input.nicknameMap);
  const { error } = await serviceClient.rpc('complete_room_round', {
    ranking_snapshot: buildRankingSnapshot(rankingsWithNicknames),
    rankings: input.ranking,
    target_room_id: input.roomId,
    target_round_id: input.roundId,
  });

  if (error) {
    throw error;
  }

  return rankingsWithNicknames;
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<FinalizeRoundPayload>(request);
    const { data: round, error: roundError } = await serviceClient
      .from('round_sessions')
      .select('id, room_id, question_ids')
      .eq('id', body.roundId)
      .single();

    if (roundError || !round) {
      throw roundError ?? new Error('Round not found.');
    }

    if (!round.room_id) {
      throw new Error('Finalize-round currently supports room rounds only.');
    }

    await assertRoomMembership(round.room_id, user.id);
    const { data: existingResults, error: existingResultsError } = await serviceClient
      .from('match_results')
      .select('best_streak, correct_count, player_id, rank, round_id, score')
      .eq('round_id', round.id)
      .order('rank', { ascending: true });

    if (existingResultsError) {
      throw existingResultsError;
    }

    if ((existingResults ?? []).length > 0) {
      const existingRanking = existingResults.map((entry) => ({
        ...entry,
        rank: entry.rank ?? 0,
      }));
      const nicknameMap = await buildNicknameMap(
        existingRanking.map((entry) => entry.player_id)
      );
      const rankings = await completeRoomRound({
        nicknameMap,
        ranking: existingRanking,
        roomId: round.room_id,
        roundId: round.id,
      });

      return jsonResponse({
        rankings,
        roomId: round.room_id,
        roundId: round.id,
        status: 'completed',
      });
    }

    const { data: questions, error: questionsError } = await serviceClient
      .from('questions')
      .select('id, correct_option')
      .in('id', round.question_ids);

    if (questionsError || !questions) {
      throw questionsError ?? new Error('Unable to load questions for round.');
    }

    const questionMap = new Map(questions.map((question) => [question.id, question.correct_option]));
    const { data: submissions, error: submissionsError } = await serviceClient
      .from('answer_submissions')
      .select('player_id, question_id, selected_option, time_left_ms')
      .eq('round_id', round.id);

    if (submissionsError) {
      throw submissionsError;
    }

    const validSubmissions = filterSubmissionsForRoundQuestions(
      submissions ?? [],
      round.question_ids
    );
    const participants = await listRoomParticipants(round.room_id);
    const scoreboard = new Map<
      string,
      {
        bestStreak: number;
        correctCount: number;
        currentStreak: number;
        score: number;
      }
    >();

    for (const submission of validSubmissions) {
      const existing = scoreboard.get(submission.player_id) ?? {
        bestStreak: 0,
        correctCount: 0,
        currentStreak: 0,
        score: 0,
      };
      const isCorrect = questionMap.get(submission.question_id) === submission.selected_option;

      if (isCorrect) {
        existing.correctCount += 1;
        existing.currentStreak += 1;
        existing.bestStreak = Math.max(existing.bestStreak, existing.currentStreak);
        existing.score += 100 + Math.floor((submission.time_left_ms ?? 0) / 1000) * 6;
      } else {
        existing.currentStreak = 0;
      }

      scoreboard.set(submission.player_id, existing);
    }

    for (const participant of participants) {
      if (!scoreboard.has(participant.player_id)) {
        scoreboard.set(participant.player_id, {
          bestStreak: 0,
          correctCount: 0,
          currentStreak: 0,
          score: 0,
        });
      }
    }

    const ranking = [...scoreboard.entries()]
      .map(([playerId, values]) => ({
        best_streak: values.bestStreak,
        correct_count: values.correctCount,
        player_id: playerId,
        round_id: round.id,
        score: values.score,
      }))
      .sort((left, right) => right.score - left.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
    const expectedSubmissions = participants.length * round.question_ids.length;
    const nicknameMap = await buildNicknameMap(ranking.map((entry) => entry.player_id));

    if (validSubmissions.length < expectedSubmissions) {
      await serviceClient
        .from('rooms')
        .update({ status: 'finalizing' })
        .eq('id', round.room_id);

      return jsonResponse({
        rankings: attachNicknames(ranking, nicknameMap),
        roomId: round.room_id,
        roundId: round.id,
        status: 'pending',
      });
    }

    const rankings = await completeRoomRound({
      nicknameMap,
      ranking,
      roomId: round.room_id,
      roundId: round.id,
    });

    return jsonResponse({
      rankings,
      roomId: round.room_id,
      roundId: round.id,
      status: 'completed',
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'Unknown finalize-round failure.',
      },
      400
    );
  }
});
