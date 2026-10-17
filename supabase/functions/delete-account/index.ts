import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

import { requireAuthenticatedUser } from '../_shared/auth.ts';
import { serviceClient } from '../_shared/client.ts';
import { GameError } from '../_shared/error-codes.ts';
import { errorResponse, handleCors, jsonResponse, requireJsonBody } from '../_shared/http.ts';

/**
 * Deletes the player's account and everything tied to it. Removing the auth user cascades in the
 * database: profile, progress, room places, answers, results, reports and rate-limit records.
 * Rooms the player hosted go too (with their rounds). Only anonymous per-question statistics stay.
 */
serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  try {
    const user = await requireAuthenticatedUser(request);
    const body = await requireJsonBody<{ confirm?: string }>(request);

    if (body.confirm !== 'delete-everything') {
      throw new GameError('invalid_request', 'Confirm the deletion.');
    }

    const { error } = await serviceClient.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
});
