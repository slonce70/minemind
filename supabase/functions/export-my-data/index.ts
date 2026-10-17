import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { errorResponse, handleCors, jsonResponse } from '../_shared/http.ts';
import { enforceRateLimit } from '../_shared/limits.ts';

// ponytail: one capped query per table; page through if a player ever has more rows than this.
const maxRows = 5000;

async function rows(table: string, column: string, userId: string) {
  const { data, error } = await serviceClient.from(table).select('*').eq(column, userId).limit(maxRows);

  if (error) {
    throw error;
  }

  return data ?? [];
}

/** Everything stored about the player, as one JSON document (the app saves or shares it). */
serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    await enforceRateLimit(user.id, 'export-my-data');

    const [profile, progress, roomPlaces, hostedRooms, answers, results, leaderboard, questionReports] = await Promise.all([
      rows('guest_profiles', 'id', user.id),
      rows('player_progress', 'user_id', user.id),
      rows('room_participants', 'player_id', user.id),
      rows('rooms', 'host_id', user.id),
      rows('answer_submissions', 'player_id', user.id),
      rows('match_results', 'player_id', user.id),
      rows('leaderboard_entries', 'player_id', user.id),
      rows('question_reports', 'player_id', user.id),
    ]);

    return jsonResponse({
      account: {
        createdAt: user.created_at,
        email: user.email ?? null,
        id: user.id,
        isAnonymous: user.is_anonymous ?? !user.email,
      },
      answers,
      exportedAt: new Date().toISOString(),
      hostedRooms,
      leaderboard,
      profile: profile[0] ?? null,
      progress: progress[0] ?? null,
      questionReports,
      results,
      roomPlaces,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
